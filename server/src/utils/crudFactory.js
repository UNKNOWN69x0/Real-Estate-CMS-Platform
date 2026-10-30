import { Router } from 'express';
import { asyncHandler } from './asyncHandler.js';
import { ApiError } from './ApiError.js';
import { buildListQuery, paginated } from './query.js';
import { toPatchSchema } from './patchSchema.js';
import { validate } from '../middleware/validate.js';
import { logActivity } from '../middleware/activityLog.js';
import { publishSchema } from '../validators/schemas.js';

const HIDDEN_PUBLIC_FIELDS = '-__v -updatedBy';

/**
 * Builds admin + public routers for a collection.
 *
 * options:
 *  Model, entity            – mongoose model and the name written to ActivityLog
 *  createSchema             – Zod schema for POST (update schema is derived from it)
 *  updateSchema             – override for PUT/PATCH (e.g. inquiries only edit status/notes)
 *  searchFields/filterFields/sortFields – whitelists for ?search, ?field=value and ?sort=
 *  labelField               – field used in activity summaries
 *  publishable              – adds status/publishedAt handling and PATCH /:id/publish
 *  publicLookup             – field used by GET /public/:x/:value (default _id)
 *  disable                  – subset of ['create','delete'] to leave out
 */
export function createCrud({
  Model,
  entity,
  createSchema,
  updateSchema = createSchema && toPatchSchema(createSchema),
  searchFields = [],
  filterFields = ['status'],
  sortFields = ['order', 'createdAt', 'updatedAt'],
  defaultSort = 'order',
  labelField = 'title',
  publishable = true,
  publicLookup = '_id',
  disable = [],
}) {
  const listOptions = { searchFields, filterFields, sortFields, defaultSort };
  const label = (doc) => `${entity} "${doc[labelField] ?? doc._id}"`;

  const findOr404 = async (id) => {
    const doc = await Model.findById(id);
    if (!doc) throw ApiError.notFound(`${entity} not found`);
    return doc;
  };

  // Keeps publishedAt consistent with status. On non-publishable collections (inquiries)
  // `status` is just an ordinary workflow field.
  const applyStatus = (doc, status) => {
    if (!status) return;
    doc.status = status;
    if (publishable) doc.publishedAt = status === 'published' ? doc.publishedAt || new Date() : undefined;
  };

  const handlers = {
    list: asyncHandler(async (req, res) => {
      const { filter, page, limit, sort, skip } = buildListQuery(req.query, listOptions);
      const [data, total] = await Promise.all([
        Model.find(filter).sort(sort).skip(skip).limit(limit).lean(),
        Model.countDocuments(filter),
      ]);
      res.json(paginated(data, total, page, limit));
    }),

    get: asyncHandler(async (req, res) => {
      res.json({ data: await findOr404(req.params.id) });
    }),

    create: asyncHandler(async (req, res) => {
      const { status, ...rest } = req.body;
      const doc = new Model(rest);
      if (req.user && Model.schema.path('updatedBy')) doc.updatedBy = req.user._id;
      applyStatus(doc, status);
      await doc.save();
      res.locals.logTarget = { id: doc._id, summary: `Created ${label(doc)}` };
      res.status(201).json({ data: doc });
    }),

    update: asyncHandler(async (req, res) => {
      const doc = await findOr404(req.params.id);
      const { status, ...rest } = req.body;
      doc.set(rest);
      if (req.user && Model.schema.path('updatedBy')) doc.updatedBy = req.user._id;
      applyStatus(doc, status);
      await doc.save();
      res.locals.logTarget = { id: doc._id, summary: `Updated ${label(doc)}` };
      res.json({ data: doc });
    }),

    remove: asyncHandler(async (req, res) => {
      const doc = await findOr404(req.params.id);
      await doc.deleteOne();
      res.locals.logTarget = { id: doc._id, summary: `Deleted ${label(doc)}` };
      res.json({ message: `${entity} deleted` });
    }),

    // Body { status } sets it explicitly; empty body toggles
    publish: asyncHandler(async (req, res) => {
      const doc = await findOr404(req.params.id);
      const next = req.body.status || (doc.status === 'published' ? 'draft' : 'published');
      applyStatus(doc, next);
      await doc.save();
      const action = next === 'published' ? 'publish' : 'unpublish';
      res.locals.logTarget = { id: doc._id, action, summary: `${action === 'publish' ? 'Published' : 'Unpublished'} ${label(doc)}` };
      res.json({ data: doc });
    }),
  };

  const admin = Router();
  admin.get('/', handlers.list);
  if (!disable.includes('create')) {
    admin.post('/', logActivity('create', entity), validate(createSchema), handlers.create);
  }
  admin.get('/:id', handlers.get);
  admin.put('/:id', logActivity('update', entity), validate(updateSchema), handlers.update);
  admin.patch('/:id', logActivity('update', entity), validate(updateSchema), handlers.update);
  if (!disable.includes('delete')) {
    admin.delete('/:id', logActivity('delete', entity), handlers.remove);
  }
  if (publishable) {
    admin.patch('/:id/publish', logActivity('publish', entity), validate(publishSchema), handlers.publish);
  }

  const publicRouter = Router();
  if (publishable) {
    publicRouter.get(
      '/',
      asyncHandler(async (req, res) => {
        const { filter, sort } = buildListQuery(req.query, { ...listOptions, filterFields: [] });
        const data = await Model.find({ ...filter, status: 'published' })
          .select(HIDDEN_PUBLIC_FIELDS)
          .sort(sort)
          .limit(200)
          .lean();
        res.json({ data });
      }),
    );
    publicRouter.get(
      '/:lookup',
      asyncHandler(async (req, res) => {
        const doc = await Model.findOne({ [publicLookup]: req.params.lookup, status: 'published' })
          .select(HIDDEN_PUBLIC_FIELDS)
          .lean();
        if (!doc) throw ApiError.notFound(`${entity} not found`);
        res.json({ data: doc });
      }),
    );
  }

  return { admin, publicRouter, handlers };
}

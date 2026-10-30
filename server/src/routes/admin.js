import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildListQuery, paginated } from '../utils/query.js';
import { resources } from './resources.js';
import { inquiryExportRouter } from './inquiries.js';
import uploadRouter from './upload.js';
import { ActivityLog, LOG_ACTIONS } from '../models/ActivityLog.js';
import { Section } from '../models/Section.js';
import { Amenity } from '../models/Amenity.js';
import { GalleryItem } from '../models/GalleryItem.js';
import { FloorPlan } from '../models/FloorPlan.js';
import { Inquiry } from '../models/Inquiry.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.use('/upload', uploadRouter);

router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const countByStatus = async (Model) => {
      const [total, published] = await Promise.all([
        Model.countDocuments(),
        Model.countDocuments({ status: 'published' }),
      ]);
      return { total, published, draft: total - published };
    };
    const [sections, amenities, gallery, floorPlans, inquiriesTotal, inquiriesNew, recentActivity] = await Promise.all([
      countByStatus(Section),
      countByStatus(Amenity),
      countByStatus(GalleryItem),
      countByStatus(FloorPlan),
      Inquiry.countDocuments(),
      Inquiry.countDocuments({ status: 'new' }),
      ActivityLog.find().sort({ createdAt: -1 }).limit(5).lean(),
    ]);
    res.json({
      data: { sections, amenities, gallery, floorPlans, inquiries: { total: inquiriesTotal, new: inquiriesNew }, recentActivity },
    });
  }),
);

router.get(
  '/logs',
  asyncHandler(async (req, res) => {
    const { filter, page, limit, sort, skip } = buildListQuery(req.query, {
      searchFields: ['summary', 'userEmail'],
      filterFields: ['entity', 'action'],
      sortFields: ['createdAt'],
      defaultSort: '-createdAt',
    });
    if (filter.action && !LOG_ACTIONS.includes(filter.action)) delete filter.action;

    const { from, to } = req.query;
    const range = {};
    if (from && !Number.isNaN(Date.parse(from))) range.$gte = new Date(from);
    if (to && !Number.isNaN(Date.parse(to))) range.$lte = new Date(to);
    if (Object.keys(range).length) filter.createdAt = range;

    const [data, total] = await Promise.all([
      ActivityLog.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      ActivityLog.countDocuments(filter),
    ]);
    res.json(paginated(data, total, page, limit));
  }),
);

// CSV export must be registered before the generic /inquiries/:id route
router.use('/inquiries', inquiryExportRouter);

for (const [path, crud] of Object.entries(resources)) {
  router.use(`/${path}`, crud.admin);
}

export default router;

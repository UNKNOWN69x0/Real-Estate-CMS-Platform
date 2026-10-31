import { Router } from 'express';
import { Inquiry } from '../models/Inquiry.js';
import { validate } from '../middleware/validate.js';
import { inquiryLimiter } from '../middleware/security.js';
import { inquiryCreateSchema } from '../validators/schemas.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildListQuery } from '../utils/query.js';
import { toCsv } from '../utils/csv.js';

// Public: POST /api/inquiries
export const publicInquiryRouter = Router();

publicInquiryRouter.post(
  '/',
  inquiryLimiter,
  validate(inquiryCreateSchema),
  asyncHandler(async (req, res) => {
    const { website, ...inquiry } = req.body;
    // A filled honeypot means a bot: answer exactly like a success so it learns nothing, but store nothing
    if (!website) await Inquiry.create(inquiry);
    // Don't echo the stored document back to anonymous callers
    res.status(201).json({ message: 'Thank you! Our team will contact you shortly.' });
  }),
);

// Admin: GET /api/admin/inquiries/export (mounted before the generic /:id routes)
export const inquiryExportRouter = Router();

const CSV_COLUMNS = [
  { key: 'createdAt', label: 'Received' },
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'message', label: 'Message' },
  { key: 'source', label: 'Source' },
  { key: 'status', label: 'Status' },
  { key: 'notes', label: 'Notes' },
];

inquiryExportRouter.get(
  '/export',
  asyncHandler(async (req, res) => {
    const { filter, sort } = buildListQuery(req.query, {
      searchFields: ['name', 'email', 'phone', 'message'],
      filterFields: ['status'],
      sortFields: ['createdAt', 'name', 'status'],
      defaultSort: '-createdAt',
    });
    const rows = await Inquiry.find(filter).sort(sort).limit(10000).lean();
    res
      .type('text/csv')
      .attachment(`inquiries-${new Date().toISOString().slice(0, 10)}.csv`)
      .send(toCsv(CSV_COLUMNS, rows));
  }),
);

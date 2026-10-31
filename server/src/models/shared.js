export const STATUSES = ['draft', 'published'];

// Marks records created by `npm run seed:demo` (the value is a stable key like "inq-01").
// Hidden from queries by default so it never leaks into APIs, admin forms or CSV exports.
export const demoField = { type: String, select: false };

// Fields shared by every publishable collection
export const publishableFields = {
  status: { type: String, enum: STATUSES, default: 'draft', index: true },
  publishedAt: { type: Date },
  order: { type: Number, default: 0 },
};

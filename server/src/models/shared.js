export const STATUSES = ['draft', 'published'];

// Fields shared by every publishable collection
export const publishableFields = {
  status: { type: String, enum: STATUSES, default: 'draft', index: true },
  publishedAt: { type: Date },
  order: { type: Number, default: 0 },
};

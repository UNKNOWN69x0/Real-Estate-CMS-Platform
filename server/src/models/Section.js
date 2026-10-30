import mongoose from 'mongoose';
import { publishableFields } from './shared.js';

const sectionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    title: { type: String, trim: true, default: '' },
    subtitle: { type: String, trim: true, default: '' },
    body: { type: String, default: '' },
    image: { type: String, default: '' },
    // Section-specific editable data: hero CTAs, about stats, connectivity columns, consultants, footer contacts...
    content: { type: mongoose.Schema.Types.Mixed, default: {} },
    seo: {
      metaTitle: { type: String, trim: true, default: '' },
      metaDescription: { type: String, trim: true, default: '' },
      ogImage: { type: String, default: '' },
    },
    ...publishableFields,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, minimize: false },
);

sectionSchema.index({ status: 1, order: 1 });

export const Section = mongoose.model('Section', sectionSchema);

import mongoose from 'mongoose';
import { publishableFields } from './shared.js';

const galleryItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    category: { type: String, trim: true, default: 'general' },
    ...publishableFields,
  },
  { timestamps: true },
);

galleryItemSchema.index({ status: 1, order: 1 });

export const GalleryItem = mongoose.model('GalleryItem', galleryItemSchema);

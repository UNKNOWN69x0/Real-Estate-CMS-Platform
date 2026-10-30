import mongoose from 'mongoose';
import { publishableFields } from './shared.js';

// Areas are stored in sq.ft as numbers so the table can sort/format them.
const floorPlanSchema = new mongoose.Schema(
  {
    unitType: { type: String, required: true, trim: true },
    carpetArea: { type: Number, required: true, min: 0 },
    balcony: { type: Number, default: 0, min: 0 },
    totalArea: { type: Number, required: true, min: 0 },
    floors: { type: String, trim: true, default: '' }, // e.g. "1-8"
    image: { type: String, default: '' },
    pdfUrl: { type: String, default: '' },
    ...publishableFields,
  },
  { timestamps: true },
);

floorPlanSchema.index({ status: 1, order: 1 });

export const FloorPlan = mongoose.model('FloorPlan', floorPlanSchema);

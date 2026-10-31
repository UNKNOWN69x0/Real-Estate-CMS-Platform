import mongoose from 'mongoose';
import { demoField, publishableFields } from './shared.js';

const amenitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    icon: { type: String, trim: true, default: 'Sparkles' }, // lucide-react icon name
    image: { type: String, default: '' },
    ...publishableFields,
    demo: demoField,
  },
  { timestamps: true },
);

amenitySchema.index({ status: 1, order: 1 });

export const Amenity = mongoose.model('Amenity', amenitySchema);

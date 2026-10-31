import mongoose from 'mongoose';
import { demoField } from './shared.js';

export const INQUIRY_STATUSES = ['new', 'contacted', 'closed'];

const inquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    phone: { type: String, required: true, trim: true },
    message: { type: String, trim: true, default: '' },
    source: { type: String, trim: true, default: 'website' },
    status: { type: String, enum: INQUIRY_STATUSES, default: 'new' },
    notes: { type: String, trim: true, default: '' },
    demo: demoField,
  },
  { timestamps: true },
);

inquirySchema.index({ status: 1, createdAt: -1 });

export const Inquiry = mongoose.model('Inquiry', inquirySchema);

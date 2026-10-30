import mongoose from 'mongoose';

export const LOG_ACTIONS = ['create', 'update', 'delete', 'publish', 'unpublish'];

const activityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userEmail: { type: String, default: '' }, // snapshot, survives user deletion
    action: { type: String, enum: LOG_ACTIONS, required: true },
    entity: { type: String, required: true }, // e.g. "section", "amenity"
    entityId: { type: String, default: '' },
    summary: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ entity: 1, action: 1, createdAt: -1 });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

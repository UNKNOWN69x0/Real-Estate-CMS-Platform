import { ActivityLog } from '../models/ActivityLog.js';

/**
 * Writes an ActivityLog entry after a successful (<400) response.
 * Handlers describe what happened via res.locals.logTarget = { id, summary, action? }.
 * `action` on the target overrides the default (used by publish/unpublish toggles).
 */
export const logActivity = (action, entity) => (req, res, next) => {
  res.on('finish', () => {
    const target = res.locals.logTarget;
    if (res.statusCode >= 400 || !target) return;

    ActivityLog.create({
      user: req.user?._id,
      userEmail: req.user?.email,
      action: target.action || action,
      entity,
      entityId: String(target.id ?? ''),
      summary: target.summary || '',
    }).catch((err) => console.error('Failed to write activity log:', err.message));
  });
  next();
};

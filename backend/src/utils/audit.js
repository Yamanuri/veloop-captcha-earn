import { AuditLog } from '../models/AuditLog.js';

// Fire-and-forget: audit failures must never break the request.
export function audit(event, { userId, challengeId, req, meta } = {}) {
  AuditLog.create({
    event,
    userId,
    challengeId,
    ip: req?.ip,
    userAgent: req?.headers?.['user-agent']?.slice(0, 200),
    meta,
  }).catch((e) => console.error('audit failed', e.message));
}

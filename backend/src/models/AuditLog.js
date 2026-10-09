import mongoose from 'mongoose';
const schema = new mongoose.Schema(
  {
    event: { type: String, required: true, index: true },
    userId: mongoose.Schema.Types.ObjectId,
    challengeId: String,
    ip: String,
    userAgent: String,
    meta: mongoose.Schema.Types.Mixed,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
schema.index({ userId: 1, createdAt: -1 });
export const AuditLog = mongoose.model('AuditLog', schema);

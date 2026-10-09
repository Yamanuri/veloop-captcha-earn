import mongoose from 'mongoose';
const schema = new mongoose.Schema(
  {
    challengeId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    captchaText: { type: String, required: true },
    options: { type: [String], validate: (v) => v.length === 4 },
    // NEVER returned by the API. select:false protects against accidental leaks.
    correctOption: { type: String, required: true, select: false },
    status: { type: String, enum: ['ACTIVE', 'COMPLETED', 'EXPIRED', 'DISCARDED'], default: 'ACTIVE' },
    expiresAt: { type: Date, required: true },
    selectedOption: String,
    result: { type: String, enum: ['CORRECT', 'WRONG'] },
    // Integer units (1 Gem = 100). API/docs expose this as rewardAmount in Gems.
    rewardUnits: { type: Number, default: 0 },
    rewardStatus: { type: String, enum: ['NONE', 'PENDING', 'CLAIMED', 'DISCARDED'], default: 'NONE' },
    completedAt: Date,
    claimedAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
schema.index({ userId: 1, createdAt: -1 });
// Only ONE active challenge per user at any time (also makes concurrent /current calls safe).
schema.index({ userId: 1 }, { unique: true, partialFilterExpression: { status: 'ACTIVE' }, name: 'one_active_per_user' });
schema.virtual('rewardAmount').get(function () {
  return (this.rewardUnits || 0) / 100;
});
export const CaptchaChallenge = mongoose.model('CaptchaChallenge', schema);

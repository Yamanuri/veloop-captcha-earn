import mongoose from 'mongoose';
const schema = new mongoose.Schema(
  {
    attemptId: { type: String, required: true, unique: true },
    // unique => a challenge can have at most ONE accepted attempt (replay protection at DB level)
    challengeId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    selectedOption: String,
    result: { type: String, enum: ['CORRECT', 'WRONG'] },
    rewardUnits: Number,
    status: { type: String, default: 'ACCEPTED' },
    ip: String,
    userAgent: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
export const CaptchaAttempt = mongoose.model('CaptchaAttempt', schema);

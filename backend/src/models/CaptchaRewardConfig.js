import mongoose from 'mongoose';
const schema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    correctReward: { type: Number, default: 1, min: 0 },
    wrongReward: { type: Number, default: 0.5, min: 0 },
    currency: { type: String, default: 'GEMS' },
    expirySeconds: { type: Number, default: 120, min: 10 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);
export const CaptchaRewardConfig = mongoose.model('CaptchaRewardConfig', schema);

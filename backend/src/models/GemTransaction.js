import mongoose from 'mongoose';
const schema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    currency: { type: String, default: 'GEMS' },
    amountUnits: { type: Number, required: true },
    type: { type: String, enum: ['CAPTCHA_REWARD', 'OPENING_BALANCE'], required: true },
    source: { type: String, default: 'CAPTCHA_EARN' },
    referenceId: { type: String, required: true },
    balanceBeforeUnits: { type: Number, required: true },
    balanceAfterUnits: { type: Number, required: true },
    status: { type: String, default: 'COMPLETED' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
// Idempotency guard: a reference (challengeId) can be credited only once per type.
schema.index({ referenceId: 1, type: 1 }, { unique: true });
schema.virtual('amount').get(function () {
  return this.amountUnits / 100;
});
schema.virtual('balanceBefore').get(function () {
  return this.balanceBeforeUnits / 100;
});
schema.virtual('balanceAfter').get(function () {
  return this.balanceAfterUnits / 100;
});
export const GemTransaction = mongoose.model('GemTransaction', schema);

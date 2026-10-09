import mongoose from 'mongoose';
const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    currency: { type: String, default: 'GEMS' },
    // integer units, 1 Gem = 100 units. Never below zero.
    gemUnits: { type: Number, default: 0, min: 0, validate: Number.isInteger },
  },
  { timestamps: true }
);
export const Wallet = mongoose.model('Wallet', schema);

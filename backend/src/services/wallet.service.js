import { Wallet } from '../models/Wallet.js';
import { toGems } from '../utils/units.js';

export async function getGemBalance(userId) {
  const w = await Wallet.findOneAndUpdate(
    { userId },
    { $setOnInsert: { gemUnits: 0, currency: 'GEMS' } },
    { upsert: true, new: true, lean: true }
  );
  return { currency: w.currency, balance: toGems(w.gemUnits) };
}

// Usage: npm run reconcile           -> report only
//        npm run reconcile -- --fix  -> repair missing verification ledger rows and reconcile wallets
import mongoose from 'mongoose';
import { config } from '../src/config/index.js';
import { CaptchaChallenge } from '../src/models/CaptchaChallenge.js';
import { GemTransaction } from '../src/models/GemTransaction.js';
import { Wallet } from '../src/models/Wallet.js';
import { newTransactionId } from '../src/utils/ids.js';

const FIX = process.argv.includes('--fix');
await mongoose.connect(config.mongoUri);

// 1) verified rewards without a ledger row (older than 5 min so in-flight verifies are ignored)
const cutoff = new Date(Date.now() - 5 * 60_000);
const completed = await CaptchaChallenge.find({
  status: 'COMPLETED',
  rewardUnits: { $gt: 0 },
  $or: [
    { completedAt: { $lt: cutoff } },
    { completedAt: null, createdAt: { $lt: cutoff } },
  ],
}).lean();
let missing = 0;
for (const c of completed) {
  if (await GemTransaction.exists({ referenceId: c.challengeId, type: 'CAPTCHA_REWARD' })) continue;
  missing++;
  console.log(`MISSING LEDGER: ${c.challengeId} user=${c.userId} units=${c.rewardUnits}`);
  if (FIX) {
    const [sum] = await GemTransaction.aggregate([
      { $match: { userId: c.userId } },
      { $group: { _id: null, total: { $sum: '$amountUnits' } } },
    ]);
    const balanceBeforeUnits = sum?.total || 0;
    await GemTransaction.create({
      transactionId: newTransactionId(),
      userId: c.userId,
      amountUnits: c.rewardUnits,
      type: 'CAPTCHA_REWARD',
      source: 'CAPTCHA_EARN',
      referenceId: c.challengeId,
      balanceBeforeUnits,
      balanceAfterUnits: balanceBeforeUnits + c.rewardUnits,
      status: 'COMPLETED',
    });
    console.log('  -> ledger repaired; wallet will be synced from the ledger');
  }
}

// 2) wallet balance must equal the sum of its ledger
const sums = await GemTransaction.aggregate([{ $group: { _id: '$userId', total: { $sum: '$amountUnits' } } }]);
let drift = 0;
for (const s of sums) {
  const w = await Wallet.findOne({ userId: s._id }).lean();
  if (!w || w.gemUnits !== s.total) {
    drift++;
    console.log(`DRIFT: user=${s._id} wallet=${w?.gemUnits ?? 'none'} ledger=${s.total}`);
    if (FIX) {
      await Wallet.updateOne({ userId: s._id }, { $set: { gemUnits: s.total } }, { upsert: true });
      console.log('  -> wallet reconciled');
    }
  }
}
console.log(`Reconciliation done. missingLedger=${missing} balanceDrift=${drift}`);
await mongoose.disconnect();
process.exitCode = !FIX && missing + drift > 0 ? 1 : 0;

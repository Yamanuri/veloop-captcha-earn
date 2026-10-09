// Usage: npm run seed   (resets the demo users, wallets, ledger & challenges, then re-seeds)
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { config } from '../src/config/index.js';
import { User } from '../src/models/User.js';
import { Wallet } from '../src/models/Wallet.js';
import { GemTransaction } from '../src/models/GemTransaction.js';
import { CaptchaChallenge } from '../src/models/CaptchaChallenge.js';
import { CaptchaAttempt } from '../src/models/CaptchaAttempt.js';
import { CaptchaRewardConfig } from '../src/models/CaptchaRewardConfig.js';
import { newTransactionId } from '../src/utils/ids.js';

const DEMO = [
  { email: 'demo@veloop.test', name: 'Demo User', password: 'Demo@1234', gems: 100 },
  { email: 'userb@veloop.test', name: 'User B', password: 'UserB@1234', gems: 100 },
];

await mongoose.connect(config.mongoUri);
await mongoose.connection.syncIndexes();

await CaptchaRewardConfig.findOneAndUpdate(
  { key: 'default' },
  { $set: { correctReward: 1, wrongReward: 0.5, currency: 'GEMS', expirySeconds: config.captcha.defaultExpirySeconds, active: true } },
  { upsert: true }
);

for (const d of DEMO) {
  const existing = await User.findOne({ email: d.email });
  if (existing) {
    await Promise.all([
      Wallet.deleteMany({ userId: existing._id }),
      GemTransaction.deleteMany({ userId: existing._id }),
      CaptchaChallenge.deleteMany({ userId: existing._id }),
      CaptchaAttempt.deleteMany({ userId: existing._id }),
      User.deleteOne({ _id: existing._id }),
    ]);
  }
  const user = await User.create({ email: d.email, name: d.name, passwordHash: await bcrypt.hash(d.password, 10) });
  await Wallet.create({ userId: user._id, gemUnits: d.gems * 100 });
  await GemTransaction.create({
    transactionId: newTransactionId(),
    userId: user._id,
    amountUnits: d.gems * 100,
    type: 'OPENING_BALANCE',
    source: 'SEED',
    referenceId: `SEED-${user._id}`,
    balanceBeforeUnits: 0,
    balanceAfterUnits: d.gems * 100,
  });
  console.log(`seeded ${d.email} / ${d.password}  (${d.gems} Gems)`);
}
await mongoose.disconnect();
console.log('Seed complete.');

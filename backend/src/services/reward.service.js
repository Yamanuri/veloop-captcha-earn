import { config } from '../config/index.js';
import { CaptchaRewardConfig } from '../models/CaptchaRewardConfig.js';
import { CaptchaChallenge } from '../models/CaptchaChallenge.js';
import { Wallet } from '../models/Wallet.js';
import { GemTransaction } from '../models/GemTransaction.js';
import { AppError } from '../utils/errors.js';
import { newTransactionId } from '../utils/ids.js';
import { toUnits, toGems } from '../utils/units.js';
import { audit } from '../utils/audit.js';

export async function getRewardConfig() {
  const cfg = await CaptchaRewardConfig.findOneAndUpdate(
    { key: 'default' },
    {
      $setOnInsert: {
        correctReward: config.captcha.defaultCorrectReward,
        wrongReward: config.captcha.defaultWrongReward,
        expirySeconds: config.captcha.defaultExpirySeconds,
        currency: 'GEMS',
        active: true,
      },
    },
    { upsert: true, new: true, lean: true }
  );
  if (!cfg.active) throw new AppError(503, 'CAPTCHA_DISABLED', 'CAPTCHA Earn is temporarily unavailable.');
  return cfg;
}

// The ONLY place reward amounts are decided.
export function calculateReward(result, cfg) {
  return toUnits(result === 'CORRECT' ? cfg.correctReward : cfg.wrongReward);
}

export async function creditVerifiedReward(userId, challengeId, rewardUnits, session) {
  const opts = session ? { session } : {};
  const wallet = await Wallet.findOneAndUpdate(
    { userId },
    { $inc: { gemUnits: rewardUnits } },
    { new: true, upsert: true, setDefaultsOnInsert: true, ...opts }
  );
  const transaction = {
    transactionId: newTransactionId(),
    userId,
    amountUnits: rewardUnits,
    type: 'CAPTCHA_REWARD',
    source: 'CAPTCHA_EARN',
    referenceId: challengeId,
    balanceBeforeUnits: wallet.gemUnits - rewardUnits,
    balanceAfterUnits: wallet.gemUnits,
    status: 'COMPLETED',
  };
  await GemTransaction.create([transaction], opts);
  return { wallet, transaction };
}

async function diagnoseClaimFailure(userId, challengeId, req) {
  const ch = await CaptchaChallenge.findOne({ challengeId }).lean();
  if (!ch || String(ch.userId) !== String(userId)) {
    if (ch) audit('SUSPICIOUS_REQUEST', { userId, challengeId, req, meta: { reason: 'CROSS_USER_CLAIM' } });
    throw new AppError(404, 'INVALID_CHALLENGE', 'Challenge not found.');
  }
  if (ch.rewardStatus === 'CLAIMED') {
    audit('DUPLICATE_ATTEMPT', { userId, challengeId, req, meta: { kind: 'CLAIM' } });
    throw new AppError(409, 'REWARD_ALREADY_CLAIMED', 'This reward has already been claimed.');
  }
  if (ch.rewardStatus === 'DISCARDED') throw new AppError(409, 'CLAIM_SKIPPED', 'This claim was skipped; the verified reward remains in your wallet.');
  throw new AppError(409, 'NOT_VERIFIED', 'Verify this CAPTCHA before claiming a reward.');
}

export async function claimReward(userId, challengeId, req) {
  const eligible = await CaptchaChallenge.findOne({
    challengeId,
    userId,
    status: 'COMPLETED',
    rewardStatus: 'PENDING',
    rewardUnits: { $gt: 0 },
  }).select('_id').lean();
  if (!eligible) return diagnoseClaimFailure(userId, challengeId, req);

  const transaction = await GemTransaction.findOne({
    referenceId: challengeId,
    userId,
    type: 'CAPTCHA_REWARD',
  }).lean();
  if (!transaction) throw new AppError(503, 'REWARD_PROCESSING', 'The reward is still being processed. Please try again.');

  const ch = await CaptchaChallenge.findOneAndUpdate(
    { challengeId, userId, status: 'COMPLETED', rewardStatus: 'PENDING', rewardUnits: { $gt: 0 } },
    { $set: { rewardStatus: 'CLAIMED', claimedAt: new Date() } },
    { new: true }
  );
  if (!ch) return diagnoseClaimFailure(userId, challengeId, req);

  const wallet = await Wallet.findOne({ userId }).lean();
  audit('REWARD_CLAIMED', { userId, challengeId, req, meta: { units: ch.rewardUnits, txn: transaction.transactionId } });
  return {
    reward: { currency: 'GEMS', amount: toGems(ch.rewardUnits) },
    balance: toGems(wallet?.gemUnits || 0),
    transactionId: transaction.transactionId,
  };
}

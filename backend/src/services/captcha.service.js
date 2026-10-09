import mongoose from 'mongoose';
import { CaptchaChallenge } from '../models/CaptchaChallenge.js';
import { CaptchaAttempt } from '../models/CaptchaAttempt.js';
import { config } from '../config/index.js';
import { AppError } from '../utils/errors.js';
import { newChallengeId, newAttemptId } from '../utils/ids.js';
import { toGems } from '../utils/units.js';
import { audit } from '../utils/audit.js';
import { buildChallenge } from './captcha.generator.js';
import { getRewardConfig, calculateReward, creditVerifiedReward } from './reward.service.js';

// What the browser is allowed to see. correctOption is deliberately absent.
function toPublic(c, cfg) {
  return {
    challengeId: c.challengeId,
    question: c.captchaText,
    options: c.options,
    status: c.status,
    expiresAt: c.expiresAt,
    expiresInSeconds: Math.max(0, Math.round((new Date(c.expiresAt) - Date.now()) / 1000)),
    reward: { currency: cfg.currency, correct: cfg.correctReward, wrong: cfg.wrongReward },
  };
}

async function createChallenge(userId, req) {
  const cfg = await getRewardConfig();
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const today = await CaptchaChallenge.countDocuments({ userId, createdAt: { $gte: startOfDay } });
  if (today >= config.captcha.dailyChallengeLimit) {
    throw new AppError(429, 'DAILY_LIMIT_REACHED', 'Daily CAPTCHA limit reached. Please come back tomorrow.');
  }

  // Close active challenges and pending claim states without reversing credited Gems.
  await CaptchaChallenge.updateMany({ userId, status: 'ACTIVE' }, { $set: { status: 'DISCARDED' } });
  await CaptchaChallenge.updateMany(
    { userId, status: 'COMPLETED', rewardStatus: 'PENDING' },
    { $set: { rewardStatus: 'DISCARDED' } }
  );

  for (let i = 0; i < 5; i++) {
    const gen = buildChallenge(config.captcha.length);
    try {
      const doc = await CaptchaChallenge.create({
        challengeId: newChallengeId(),
        userId,
        captchaText: gen.captchaText,
        options: gen.options,
        correctOption: gen.correctOption,
        expiresAt: new Date(Date.now() + cfg.expirySeconds * 1000),
      });
      audit('CHALLENGE_CREATED', { userId, challengeId: doc.challengeId, req });
      return toPublic(doc, cfg);
    } catch (err) {
      if (err?.code !== 11000) throw err;
      if (err.keyPattern?.userId) {
        // A parallel request already created this user's active challenge: return that one.
        const existing = await CaptchaChallenge.findOne({ userId, status: 'ACTIVE' }).lean();
        if (existing) return toPublic(existing, cfg);
      }
      // challengeId collision: loop and retry
    }
  }
  throw new AppError(500, 'GENERATION_FAILED', 'Could not create a CAPTCHA. Please try again.');
}

export async function getCurrentChallenge(userId, req) {
  const cfg = await getRewardConfig();
  const active = await CaptchaChallenge.findOne({ userId, status: 'ACTIVE' }).lean();
  if (active) {
    if (new Date(active.expiresAt) > new Date()) return toPublic(active, cfg);
    await CaptchaChallenge.updateOne({ _id: active._id, status: 'ACTIVE' }, { $set: { status: 'EXPIRED' } });
    audit('CHALLENGE_EXPIRED', { userId, challengeId: active.challengeId, req });
  }
  return createChallenge(userId, req);
}

export const newChallenge = (userId, req) => createChallenge(userId, req);

export async function verifyChallenge(userId, { challengeId, selectedOption }, req) {
  const ch = await CaptchaChallenge.findOne({ challengeId }).select('+correctOption').lean();

  if (!ch) {
    audit('INVALID_ATTEMPT', { userId, challengeId, req, meta: { reason: 'UNKNOWN_CHALLENGE' } });
    throw new AppError(404, 'INVALID_CHALLENGE', 'Challenge not found.');
  }
  if (String(ch.userId) !== String(userId)) {
    // Same response as "not found" so challenge IDs cannot be probed.
    audit('SUSPICIOUS_REQUEST', { userId, challengeId, req, meta: { reason: 'CROSS_USER_CHALLENGE' } });
    throw new AppError(404, 'INVALID_CHALLENGE', 'Challenge not found.');
  }
  if (ch.status === 'COMPLETED' || ch.status === 'DISCARDED') {
    audit('DUPLICATE_ATTEMPT', { userId, challengeId, req, meta: { kind: 'VERIFY', status: ch.status } });
    throw new AppError(409, 'CHALLENGE_ALREADY_COMPLETED', 'This CAPTCHA has already been completed.');
  }
  if (ch.status === 'EXPIRED' || new Date(ch.expiresAt) <= new Date()) {
    await CaptchaChallenge.updateOne({ _id: ch._id, status: 'ACTIVE' }, { $set: { status: 'EXPIRED' } });
    audit('CHALLENGE_EXPIRED', { userId, challengeId, req });
    throw new AppError(410, 'CHALLENGE_EXPIRED', 'Challenge expired. Please continue with a new CAPTCHA.');
  }
  if (!ch.options.includes(selectedOption)) {
    audit('INVALID_ATTEMPT', { userId, challengeId, req, meta: { reason: 'OPTION_NOT_OFFERED' } });
    throw new AppError(400, 'INVALID_OPTION', 'Selected option is not part of this challenge.');
  }

  const cfg = await getRewardConfig();
  const result = selectedOption === ch.correctOption ? 'CORRECT' : 'WRONG';
  const rewardUnits = calculateReward(result, cfg);

  const persistVerification = async (session) => {
    const opts = session ? { session } : {};
    const now = new Date();
    const done = await CaptchaChallenge.findOneAndUpdate(
      { _id: ch._id, userId, status: 'ACTIVE', expiresAt: { $gt: now } },
      { $set: { status: 'COMPLETED', selectedOption, result, rewardUnits, rewardStatus: 'PENDING', completedAt: now } },
      { new: true, ...opts }
    );
    if (!done) return null;

    const credit = await creditVerifiedReward(userId, challengeId, rewardUnits, session);
    await CaptchaAttempt.create([{
      attemptId: newAttemptId(),
      challengeId,
      userId,
      selectedOption,
      result,
      rewardUnits,
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent']?.slice(0, 200),
    }], opts);
    return { done, ...credit };
  };

  let verified;
  if (config.useTransactions) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        verified = await persistVerification(session);
      });
    } finally {
      await session.endSession();
    }
  } else {
    verified = await persistVerification(null);
  }

  if (!verified) {
    audit('DUPLICATE_ATTEMPT', { userId, challengeId, req, meta: { kind: 'VERIFY_RACE' } });
    throw new AppError(409, 'CHALLENGE_ALREADY_COMPLETED', 'This CAPTCHA has already been completed.');
  }

  audit('CHALLENGE_VERIFIED', { userId, challengeId, req, meta: { result, rewardUnits } });
  audit('REWARD_CREATED', { userId, challengeId, req, meta: { rewardUnits, status: 'CREDITED_PENDING_CLAIM' } });

  return {
    challengeId,
    result,
    reward: { currency: cfg.currency, amount: toGems(rewardUnits), status: 'PENDING' },
    balanceBefore: toGems(verified.transaction.balanceBeforeUnits),
    balance: toGems(verified.wallet.gemUnits),
    transactionId: verified.transaction.transactionId,
  };
}

export async function getHistory(userId, page, limit) {
  const filter = { userId, status: { $in: ['COMPLETED', 'EXPIRED', 'DISCARDED'] } };
  const [rows, total] = await Promise.all([
    CaptchaChallenge.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('challengeId status result rewardUnits rewardStatus createdAt completedAt claimedAt') // no options / correctOption
      .lean(),
    CaptchaChallenge.countDocuments(filter),
  ]);
  const items = rows.map((r) => ({
    challengeId: r.challengeId,
    date: r.completedAt || r.createdAt,
    status: r.status,
    result: r.result || null,
    reward: r.result ? toGems(r.rewardUnits) : 0,
    rewardStatus: r.rewardStatus,
  }));
  return { items, page, limit, total };
}

// Integration + attack tests. Requires: API running (npm start) against a seeded DB.
//   API_URL=http://localhost:5000 npm test
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import 'dotenv/config';
import { CaptchaChallenge } from '../src/models/CaptchaChallenge.js';
import { CaptchaAttempt } from '../src/models/CaptchaAttempt.js';
import { Wallet } from '../src/models/Wallet.js';
import { GemTransaction } from '../src/models/GemTransaction.js';
import { User } from '../src/models/User.js';

const BASE = process.env.API_URL || 'http://localhost:5000';
const MONGO =
  process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mydatabase';

async function call(method, path, token, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = {};
  try { json = await res.json(); } catch { /* empty */ }
  return { status: res.status, body: json };
}
const login = async (email, password) => (await call('POST', '/api/auth/login', null, { email, password })).body.token;
const fresh = async (t) => (await call('POST', '/api/captcha/new', t)).body.challenge;
const balance = async (t) => (await call('GET', '/api/wallet/gems', t)).body.balance;
const wrongOf = (c) => c.options.find((o) => o !== c.question);

const A = await login('demo@veloop.test', 'Demo@1234');
const B = await login('userb@veloop.test', 'UserB@1234');
assert.ok(A && B, 'seed users must exist: run `npm run seed`');

after(() => mongoose.disconnect());

test('new account can log in again with its own email and password', async () => {
  await mongoose.connect(MONGO);
  const email = `member_${Date.now()}@gmail.com`;
  const password = 'OwnPassword@123';
  let userId;

  try {
    const created = await call('POST', '/api/auth/register', null, { name: 'New Member', email, password });
    assert.equal(created.status, 201);
    assert.ok(created.body.token);
    userId = created.body.user.id;

    const signedIn = await call('POST', '/api/auth/login', null, { email, password });
    assert.equal(signedIn.status, 200);
    assert.ok(signedIn.body.token);

    const wallet = await call('GET', '/api/wallet/gems', signedIn.body.token);
    assert.equal(wallet.status, 200);
    assert.equal(wallet.body.balance, 0);
  } finally {
    if (userId) {
      await Promise.all([
        User.deleteOne({ _id: userId }),
        Wallet.deleteOne({ userId }),
      ]);
    }
  }
});

test('unauthorized request is rejected', async () => {
  assert.equal((await call('GET', '/api/captcha/current')).status, 401);
  assert.equal((await call('POST', '/api/captcha/verify', 'bad.token.here', {})).status, 401);
});

test('challenge has exactly 4 unique options and never leaks correctOption', async () => {
  const c = await fresh(A);
  assert.equal(c.options.length, 4);
  assert.equal(new Set(c.options).size, 4);
  assert.ok(c.options.includes(c.question));
  assert.equal(c.status, 'ACTIVE');
  assert.ok(!JSON.stringify(c).toLowerCase().includes('correctoption'));
  assert.match(c.question, /^[A-Z2-9]{6}$/);
  const different = c.options.filter((option) => [...option].every((character) => !c.question.includes(character)));
  const similar = c.options.filter((option) => option !== c.question && !different.includes(option));
  assert.equal(different.length, 1);
  assert.equal(similar.length, 2);
  assert.ok(similar.every((option) => [...option].filter((character, index) => character === c.question[index]).length >= 4));
});

test('correct answer credits +1 Gem on verify; claim only transitions once', async () => {
  const before = await balance(A);
  const c = await fresh(A);
  const v = await call('POST', '/api/captcha/verify', A, { challengeId: c.challengeId, selectedOption: c.question });
  assert.equal(v.status, 200);
  assert.equal(v.body.result, 'CORRECT');
  assert.equal(v.body.reward.amount, 1);
  assert.equal(v.body.balance, before + 1);
  assert.equal(await balance(A), before + 1, 'verification credits the wallet');
  const c1 = await call('POST', '/api/captcha/claim', A, { challengeId: c.challengeId });
  assert.equal(c1.status, 200);
  assert.equal(await balance(A), before + 1);
  const c2 = await call('POST', '/api/captcha/claim', A, { challengeId: c.challengeId });
  assert.equal(c2.status, 409);
  assert.equal(c2.body.code, 'REWARD_ALREADY_CLAIMED');
  assert.equal(await balance(A), before + 1);
});

test('wrong answer credits +0.5 Gems on verify', async () => {
  const before = await balance(A);
  const c = await fresh(A);
  const v = await call('POST', '/api/captcha/verify', A, { challengeId: c.challengeId, selectedOption: wrongOf(c) });
  assert.equal(v.body.result, 'WRONG');
  assert.equal(v.body.reward.amount, 0.5);
  assert.equal(await balance(A), before + 0.5);
  await call('POST', '/api/captcha/claim', A, { challengeId: c.challengeId });
  assert.equal(await balance(A), before + 0.5);
});

test('duplicate verification is rejected', async () => {
  const c = await fresh(A);
  const body = { challengeId: c.challengeId, selectedOption: c.question };
  assert.equal((await call('POST', '/api/captcha/verify', A, body)).status, 200);
  const again = await call('POST', '/api/captcha/verify', A, body);
  assert.equal(again.status, 409);
  assert.equal(again.body.code, 'CHALLENGE_ALREADY_COMPLETED');
});

test('TEST 3 fake reward in body is ignored', async () => {
  const before = await balance(A);
  const c = await fresh(A);
  const v = await call('POST', '/api/captcha/verify', A, {
    challengeId: c.challengeId,
    selectedOption: wrongOf(c),
    reward: 100000,
  });
  assert.equal(v.status, 200);
  assert.equal(v.body.result, 'WRONG');
  assert.equal(v.body.reward.amount, 0.5);
  assert.equal(await balance(A), before + 0.5);
  await call('POST', '/api/captcha/claim', A, { challengeId: c.challengeId, reward: 999 });
  assert.equal(await balance(A), before + 0.5);
});

test('TEST 4 fake isCorrect in body is ignored', async () => {
  const c = await fresh(A);
  const v = await call('POST', '/api/captcha/verify', A, {
    challengeId: c.challengeId,
    selectedOption: wrongOf(c),
    isCorrect: true,
    result: 'CORRECT',
  });
  assert.equal(v.status, 200);
  assert.equal(v.body.result, 'WRONG');
  assert.equal(v.body.reward.amount, 0.5);
});

test('fake reward / isCorrect / userId are ignored', async () => {
  const before = await balance(A);
  const c = await fresh(A);
  const v = await call('POST', '/api/captcha/verify', A, {
    challengeId: c.challengeId, selectedOption: wrongOf(c), reward: 100000, isCorrect: true, userId: 'someone-else', result: 'CORRECT',
  });
  assert.equal(v.status, 200);
  assert.equal(v.body.result, 'WRONG');
  assert.equal(v.body.reward.amount, 0.5);
  await call('POST', '/api/captcha/claim', A, { challengeId: c.challengeId, reward: 999 });
  assert.equal(await balance(A), before + 0.5);
});

test('concurrent verify credits once; concurrent claims transition once without another credit', async () => {
  const before = await balance(A);
  const c = await fresh(A);
  const body = { challengeId: c.challengeId, selectedOption: c.question };
  const v = await Promise.all(Array.from({ length: 8 }, () => call('POST', '/api/captcha/verify', A, body)));
  assert.equal(v.filter((r) => r.status === 200).length, 1);
  assert.ok(v.filter((r) => r.status !== 200).every((r) => r.status === 409 || r.status === 429));
  assert.equal(await balance(A), before + 1, 'concurrent verification credits once');
  const k = await Promise.all(Array.from({ length: 8 }, () => call('POST', '/api/captcha/claim', A, { challengeId: c.challengeId })));
  assert.equal(k.filter((r) => r.status === 200).length, 1);
  assert.equal(await balance(A), before + 1, 'claim does not issue a second credit');
});

test('user isolation: user B cannot verify or claim user A challenge', async () => {
  const c = await fresh(A);
  const bBefore = await balance(B);
  const v = await call('POST', '/api/captcha/verify', B, { challengeId: c.challengeId, selectedOption: c.question });
  assert.ok([403, 404].includes(v.status));
  const k = await call('POST', '/api/captcha/claim', B, { challengeId: c.challengeId });
  assert.ok([403, 404].includes(k.status));
  assert.equal(await balance(B), bBefore);
  // and it is still usable by its owner
  assert.equal((await call('POST', '/api/captcha/verify', A, { challengeId: c.challengeId, selectedOption: c.question })).status, 200);
});

test('invalid / missing / not-offered inputs', async () => {
  const c = await fresh(A);
  assert.equal((await call('POST', '/api/captcha/verify', A, { challengeId: 'CAP-000000000000', selectedOption: 'ABC234' })).status, 404);
  assert.equal((await call('POST', '/api/captcha/verify', A, { challengeId: 'nonsense', selectedOption: 'ABC234' })).status, 400);
  assert.equal((await call('POST', '/api/captcha/verify', A, { challengeId: c.challengeId })).status, 400);
  const bad = await call('POST', '/api/captcha/verify', A, { challengeId: c.challengeId, selectedOption: 'ZZZZZZ' });
  assert.equal(bad.status, 400);
  assert.equal(bad.body.code, 'INVALID_OPTION');
});

test('expired challenge is rejected and pays nothing', async () => {
  await mongoose.connect(MONGO);
  const c = await fresh(A);
  await mongoose.connection.collection('captchachallenges').updateOne({ challengeId: c.challengeId }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
  const before = await balance(A);
  const v = await call('POST', '/api/captcha/verify', A, { challengeId: c.challengeId, selectedOption: c.question });
  assert.equal(v.status, 410);
  assert.equal(v.body.code, 'CHALLENGE_EXPIRED');
  assert.equal(await balance(A), before);
});

test('No Thanks: old challenge is invalidated after requesting a new one', async () => {
  const before = await balance(A);
  const old = await fresh(A);
  const verified = await call('POST', '/api/captcha/verify', A, { challengeId: old.challengeId, selectedOption: old.question });
  assert.equal(verified.status, 200);
  assert.equal(await balance(A), before + 1);

  const next = await fresh(A);
  assert.notEqual(old.challengeId, next.challengeId);
  const v = await call('POST', '/api/captcha/verify', A, { challengeId: old.challengeId, selectedOption: old.question });
  assert.equal(v.status, 409);
  assert.equal(await balance(A), before + 1);
  const skippedClaim = await call('POST', '/api/captcha/claim', A, { challengeId: old.challengeId });
  assert.equal(skippedClaim.status, 409);
  assert.equal(skippedClaim.body.code, 'CLAIM_SKIPPED');
});

test('history never exposes answers', async () => {
  const h = await call('GET', '/api/captcha/history?limit=5', A);
  assert.equal(h.status, 200);
  assert.ok(!JSON.stringify(h.body).toLowerCase().includes('correctoption'));
  assert.ok(!('options' in (h.body.items[0] || {})));
});

test('rate limit kicks in (fresh user, burst of verify calls)', async () => {
  const email = `rl_${Date.now()}@veloop.test`;
  const reg = await call('POST', '/api/auth/register', null, { email, password: 'RateLimit@123' });
  const t = reg.body.token;
  const rs = await Promise.all(Array.from({ length: 45 }, () => call('POST', '/api/captcha/verify', t, { challengeId: 'CAP-000000000000', selectedOption: 'ABC234' })));
  assert.ok(rs.some((r) => r.status === 429), 'expected at least one 429');
});

test('challenge, attempt, claim, wallet, ledger, and history persist in MongoDB', async () => {
  await mongoose.connect(MONGO);
  const before = await balance(A);
  const c = await fresh(A);

  const created = await CaptchaChallenge.findOne({ challengeId: c.challengeId }).select('+correctOption').lean();
  assert.equal(created.status, 'ACTIVE');
  assert.ok(created.correctOption);

  const verified = await call('POST', '/api/captcha/verify', A, {
    challengeId: c.challengeId,
    selectedOption: c.question,
  });
  assert.equal(verified.body.result, 'CORRECT');

  const [completed, attempt, walletAfterVerify, transactionAfterVerify] = await Promise.all([
    CaptchaChallenge.findOne({ challengeId: c.challengeId }).lean(),
    CaptchaAttempt.findOne({ challengeId: c.challengeId }).lean(),
    Wallet.findOne({ userId: created.userId }).lean(),
    GemTransaction.findOne({ referenceId: c.challengeId, type: 'CAPTCHA_REWARD' }).lean(),
  ]);
  assert.equal(completed.rewardStatus, 'PENDING');
  assert.equal(attempt.result, 'CORRECT');
  assert.equal(attempt.rewardUnits, 100);
  assert.equal(walletAfterVerify.gemUnits, (before + 1) * 100);
  assert.equal(transactionAfterVerify.amountUnits, 100);
  assert.equal(await balance(A), before + 1);

  const claimed = await call('POST', '/api/captcha/claim', A, { challengeId: c.challengeId });
  assert.equal(claimed.status, 200);
  assert.equal(await balance(A), before + 1);

  const [claimedChallenge, wallet, transaction, history] = await Promise.all([
    CaptchaChallenge.findOne({ challengeId: c.challengeId }).lean(),
    Wallet.findOne({ userId: completed.userId }).lean(),
    GemTransaction.findOne({ referenceId: c.challengeId, type: 'CAPTCHA_REWARD' }).lean(),
    call('GET', '/api/captcha/history?limit=50', A),
  ]);
  assert.equal(claimedChallenge.rewardStatus, 'CLAIMED');
  assert.equal(wallet.gemUnits, (before + 1) * 100);
  assert.equal(transaction.amountUnits, 100);
  assert.equal(transaction.balanceAfterUnits, wallet.gemUnits);
  assert.ok(history.body.items.some((item) => item.challengeId === c.challengeId && item.rewardStatus === 'CLAIMED'));
});

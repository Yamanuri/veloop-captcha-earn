import * as captcha from '../services/captcha.service.js';
import { claimReward, getRewardConfig } from '../services/reward.service.js';
import { audit } from '../utils/audit.js';

const FORBIDDEN_KEYS = ['reward', 'isCorrect', 'result', 'userId', 'amount', 'correctOption', 'rewardStatus'];

export async function current(req, res) {
  res.json({ success: true, challenge: await captcha.getCurrentChallenge(req.user.id, req) });
}
export async function fresh(req, res) {
  res.json({ success: true, challenge: await captcha.newChallenge(req.user.id, req) });
}
export async function verify(req, res) {
  // Log (but otherwise ignore) attempts to smuggle authoritative fields in the body.
  const smuggled = FORBIDDEN_KEYS.filter((k) => k in (req.body || {}));
  if (smuggled.length) {
    audit('SUSPICIOUS_REQUEST', { userId: req.user.id, challengeId: req.validated.challengeId, req, meta: { reason: 'CLIENT_SUPPLIED_AUTHORITATIVE_FIELDS', keys: smuggled } });
  }
  const out = await captcha.verifyChallenge(req.user.id, req.validated, req);
  res.json({ success: true, ...out });
}
export async function claim(req, res) {
  const out = await claimReward(req.user.id, req.validated.challengeId, req);
  res.json({ success: true, claimed: true, ...out });
}
export async function history(req, res) {
  const { page, limit } = req.validated;
  res.json({ success: true, ...(await captcha.getHistory(req.user.id, page, limit)) });
}
export async function config(_req, res) {
  const cfg = await getRewardConfig();
  // Display-only. The server never reads reward numbers from the client.
  res.json({ success: true, config: { currency: cfg.currency, correctReward: cfg.correctReward, wrongReward: cfg.wrongReward, expirySeconds: cfg.expirySeconds } });
}

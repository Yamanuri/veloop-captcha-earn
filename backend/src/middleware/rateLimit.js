import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';
import { audit } from '../utils/audit.js';

const make = (name, max, windowMs = 60_000, byUser = true) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => (byUser && req.user?.id ? `u:${req.user.id}` : req.ip),
    handler: (req, res) => {
      audit('SUSPICIOUS_REQUEST', { userId: req.user?.id, req, meta: { reason: 'RATE_LIMIT', limiter: name } });
      res.status(429).json({ success: false, code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' });
    },
  });

export const globalLimiter = make('global', config.rate.global, 60_000, false);
export const authLimiter = make('auth', config.rate.auth, 15 * 60_000, false);
export const currentLimiter = make('current', config.rate.current);
export const newLimiter = make('new', config.rate.newChallenge);
export const verifyLimiter = make('verify', config.rate.verify);
export const claimLimiter = make('claim', config.rate.claim);
export const historyLimiter = make('history', config.rate.history);

import { Router } from 'express';
import { asyncHandler as h } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as L from '../middleware/rateLimit.js';
import * as V from '../validators/index.js';
import * as auth from '../controllers/auth.controller.js';
import * as cap from '../controllers/captcha.controller.js';
import * as wallet from '../controllers/wallet.controller.js';

const r = Router();

r.post('/auth/register', L.authLimiter, validate(V.registerSchema), h(auth.register));
r.post('/auth/login', L.authLimiter, validate(V.loginSchema), h(auth.login));

// auth runs BEFORE the limiter so limits are per authenticated user, not just per IP
r.get('/captcha/current', requireAuth, L.currentLimiter, h(cap.current));
r.post('/captcha/new', requireAuth, L.newLimiter, h(cap.fresh));
r.post('/captcha/verify', requireAuth, L.verifyLimiter, validate(V.verifySchema), h(cap.verify));
r.post('/captcha/claim', requireAuth, L.claimLimiter, validate(V.claimSchema), h(cap.claim));
r.get('/captcha/history', requireAuth, L.historyLimiter, validate(V.historySchema, 'query'), h(cap.history));
r.get('/captcha/config', requireAuth, L.currentLimiter, h(cap.config));
r.get('/wallet/gems', requireAuth, L.currentLimiter, h(wallet.gems));

export default r;

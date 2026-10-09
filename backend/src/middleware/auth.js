import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AppError } from '../utils/errors.js';

// Identity ALWAYS comes from the verified JWT, never from body / query / params.
export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required.'));
  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token.'));
  }
}

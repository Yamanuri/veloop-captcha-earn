import { AppError } from '../utils/errors.js';

export const notFound = (_req, _res, next) => next(new AppError(404, 'NOT_FOUND', 'Route not found.'));

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) return res.status(err.status).json({ success: false, code: err.code, message: err.message });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ success: false, code: 'BAD_JSON', message: 'Malformed JSON body.' });
  console.error(err);
  res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'Something went wrong.' });
}

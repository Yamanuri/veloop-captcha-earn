import { AppError } from '../utils/errors.js';

export const validate = (schema, source = 'body') => (req, _res, next) => {
  const parsed = schema.safeParse(req[source] ?? {});
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; ');
    return next(new AppError(400, 'VALIDATION_ERROR', msg));
  }
  req.validated = parsed.data;
  next();
};

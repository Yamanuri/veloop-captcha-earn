import { z } from 'zod';

// zod objects STRIP unknown keys, so client-supplied reward / isCorrect / userId never reach the service layer.
export const verifySchema = z.object({
  challengeId: z.string().trim().regex(/^CAP-[A-Z0-9]{12}$/, 'Invalid challenge id'),
  selectedOption: z.string().trim().min(1, 'selectedOption is required').max(12),
});
export const claimSchema = z.object({
  challengeId: z.string().trim().regex(/^CAP-[A-Z0-9]{12}$/, 'Invalid challenge id'),
});
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128),
});
export const registerSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
});
export const historySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

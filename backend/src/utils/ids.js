import crypto from 'node:crypto';
const rand = (n) => crypto.randomBytes(n).toString('hex').toUpperCase();
export const newChallengeId = () => `CAP-${rand(6)}`;
export const newAttemptId = () => `ATT-${rand(6)}`;
export const newTransactionId = () => `TXN-${rand(8)}`;

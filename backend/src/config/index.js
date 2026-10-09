import 'dotenv/config';

const int = (v, d) => (Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : d);

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: int(process.env.PORT, 5000),
  mongoUri:
    process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mydatabase',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map((s) => s.trim()),
  useTransactions: process.env.USE_TRANSACTIONS === 'true',
  captcha: {
    length: 6,
    defaultExpirySeconds: int(process.env.CAPTCHA_EXPIRY_SECONDS, 120),
    dailyChallengeLimit: int(process.env.CAPTCHA_DAILY_LIMIT, 1000),
    defaultCorrectReward: 1,
    defaultWrongReward: 0.5,
  },
  rate: {
    current: int(process.env.RATE_CURRENT_PER_MIN, 60),
    newChallenge: int(process.env.RATE_NEW_PER_MIN, 20),
    verify: int(process.env.RATE_VERIFY_PER_MIN, 30),
    claim: int(process.env.RATE_CLAIM_PER_MIN, 20),
    history: int(process.env.RATE_HISTORY_PER_MIN, 60),
    global: int(process.env.RATE_GLOBAL_PER_MIN, 300),
    auth: int(process.env.AUTH_RATE_MAX, 20),
  },
};

if (!config.jwtSecret || config.jwtSecret.length < 16) {
  throw new Error('JWT_SECRET must be set in the environment (min 16 characters).');
}

if (config.env === 'production' && !config.useTransactions) {
  throw new Error('USE_TRANSACTIONS=true is required in production; use a MongoDB replica set such as Atlas.');
}

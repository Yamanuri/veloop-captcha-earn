import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { User } from '../models/User.js';
import { Wallet } from '../models/Wallet.js';
import { AppError } from '../utils/errors.js';
import { getGemBalance } from '../services/wallet.service.js';

const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);
const sign = (u) => jwt.sign({ sub: String(u._id), email: u.email }, config.jwtSecret, { algorithm: 'HS256', expiresIn: config.jwtExpiresIn });

export async function register(req, res) {
  const { email, password, name } = req.validated;
  if (await User.exists({ email })) throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists.');
  const user = await User.create({ email, name, passwordHash: await bcrypt.hash(password, 10) });
  await Wallet.create({ userId: user._id, gemUnits: 0 });
  res.status(201).json({ success: true, token: sign(user), user: { id: user._id, email, name: user.name } });
}

export async function login(req, res) {
  const { email, password } = req.validated;
  const user = await User.findOne({ email }).select('+passwordHash');
  const ok = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH); // constant-ish time
  if (!user || !ok) throw new AppError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password.');
  const wallet = await getGemBalance(user._id);
  res.json({ success: true, token: sign(user), user: { id: user._id, email: user.email, name: user.name }, balance: wallet.balance });
}

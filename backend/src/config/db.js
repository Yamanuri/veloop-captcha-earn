import mongoose from 'mongoose';
import { config } from './index.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 8000 });
  // Make sure unique / partial indexes (replay + duplicate-reward protection) exist.
  await mongoose.connection.syncIndexes();
  console.log('MongoDB connected');
}

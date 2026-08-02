import mongoose from 'mongoose';
import { env }   from './env';
import { logger } from '../utils/logger';

const MAX_RETRIES    = 5;
const RETRY_DELAY_MS = 3000;

// ─── Connection Options ───────────────────────────────────────────
const mongooseOptions: mongoose.ConnectOptions = {
  serverSelectionTimeoutMS: 10_000,
  socketTimeoutMS:          45_000,
  maxPoolSize:              10,
  minPoolSize:              2,
  heartbeatFrequencyMS:     10_000,
};

// ─── Connect with Retry ───────────────────────────────────────────
export const connectDatabase = async (attempt = 1): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI, mongooseOptions);
    logger.info(`✅ MongoDB connected [attempt ${attempt}]`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`❌ MongoDB connection failed (attempt ${attempt}/${MAX_RETRIES}): ${message}`);

    if (attempt >= MAX_RETRIES) {
      logger.error('MongoDB max retries reached. Shutting down.');
      process.exit(1);
    }

    const delay = RETRY_DELAY_MS * attempt; // Exponential backoff
    logger.info(`Retrying in ${delay / 1000}s...`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    await connectDatabase(attempt + 1);
  }
};

// ─── Connection Events ────────────────────────────────────────────
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting reconnect...');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected.');
});

mongoose.connection.on('error', (error: Error) => {
  logger.error(`MongoDB error: ${error.message}`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received. Closing MongoDB connection...`);
  await mongoose.connection.close();
  logger.info('MongoDB connection closed. Exiting.');
  process.exit(0);
};

process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => void gracefulShutdown('SIGINT'));

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.connection.close();
};

import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '@utils/logger';

mongoose.set('strictQuery', true);

export const connectDatabase = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,   // Max concurrent connections
      minPoolSize: 2,    // Always 2 connections ready
    });

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB runtime error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️  MongoDB disconnected. Attempting reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('✅ MongoDB reconnected');
    });
  } catch (error) {
    logger.error('❌ MongoDB Connection Failed:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
};
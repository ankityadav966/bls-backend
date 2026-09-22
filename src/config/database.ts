import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export const connectDatabase = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);
    
    await mongoose.connect(env.MONGODB_URI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });

    logger.info(`[MongoDB] Connected successfully to ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);

    mongoose.connection.on('error', (err) => {
      logger.error(`[MongoDB] Connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('[MongoDB] Connection disconnected');
    });
  } catch (error: any) {
    logger.error(`[MongoDB] Initial connection failed: ${error.message}`);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('[MongoDB] Disconnected successfully');
  } catch (error: any) {
    logger.error(`[MongoDB] Disconnection error: ${error.message}`);
  }
};

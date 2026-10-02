import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export const connectDatabase = async (): Promise<void> => {
  mongoose.set('strictQuery', true);
  const localUri = 'mongodb://127.0.0.1:27017/BLS';

  try {
    logger.info(`[MongoDB] Connecting to primary URI: ${env.MONGODB_URI.replace(/:([^:@]{4})[^:@]*@/, ':****@')}...`);
    await mongoose.connect(env.MONGODB_URI, {
      autoIndex: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 20,
      minPoolSize: 5,
    });
    logger.info(`[MongoDB] Connected successfully to ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);
  } catch (primaryErr: any) {
    logger.warn(`[MongoDB] Primary connection failed (${primaryErr.message}). Attempting fallback to local MongoDB (${localUri})...`);
    try {
      await mongoose.connect(localUri, {
        autoIndex: false,
        serverSelectionTimeoutMS: 5000,
      });
      logger.info(`[MongoDB] Successfully connected to fallback local database: ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);
    } catch (fallbackErr: any) {
      logger.error(`[MongoDB] Both primary and local MongoDB connections failed: ${fallbackErr.message}`);
      throw primaryErr;
    }
  }

  mongoose.connection.on('error', (err) => {
    logger.error(`[MongoDB] Connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('[MongoDB] Connection disconnected');
  });
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('[MongoDB] Disconnected successfully');
  } catch (error: any) {
    logger.error(`[MongoDB] Disconnection error: ${error.message}`);
  }
};

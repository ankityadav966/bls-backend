import { Redis } from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

export let redisClient: Redis | null = null;
let redisAvailable = false;

export const initRedis = (): Redis | null => {
  if (!env.REDIS_ENABLED) {
    logger.info('[Redis] Redis caching is explicitly disabled via configuration.');
    return null;
  }

  try {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.warn('[Redis] Max reconnect attempts reached. Operating in memory-fallback mode.');
          return null; // Stop reconnecting
        }
        return Math.min(times * 500, 2000);
      },
      lazyConnect: true,
    });

    redisClient.connect()
      .then(() => {
        redisAvailable = true;
        logger.info(`[Redis] Connected successfully to ${env.REDIS_URL}`);
      })
      .catch((err) => {
        redisAvailable = false;
        logger.warn(`[Redis] Connection failed (${err.message}). Application will continue with in-memory caching.`);
      });

    redisClient.on('error', (_err) => {
      redisAvailable = false;
    });

    redisClient.on('connect', () => {
      redisAvailable = true;
    });

    redisClient.on('close', () => {
      redisAvailable = false;
    });

    return redisClient;
  } catch (error: any) {
    redisAvailable = false;
    logger.warn(`[Redis] Initialization error: ${error.message}. Running in memory-fallback mode.`);
    return null;
  }
};

export const getRedisClient = (): Redis | null => redisClient;
export const isRedisAvailable = (): boolean => redisAvailable;

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('[Redis] Disconnected successfully');
    } catch (_err) {
      // Ignored
    }
  }
};

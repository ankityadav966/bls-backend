import { getRedisClient, isRedisAvailable } from '../config/redis.js';
import { logger } from '../utils/logger.js';

interface MemoryCacheEntry {
  value: any;
  expiresAt: number;
}

const memoryCache = new Map<string, MemoryCacheEntry>();

export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      if (isRedisAvailable()) {
        const client = getRedisClient();
        if (client) {
          const raw = await client.get(key);
          if (raw) return JSON.parse(raw) as T;
        }
      } else {
        const entry = memoryCache.get(key);
        if (entry) {
          if (Date.now() > entry.expiresAt) {
            memoryCache.delete(key);
            return null;
          }
          return entry.value as T;
        }
      }
    } catch (err: any) {
      logger.debug(`[Cache] Get error for key ${key}: ${err.message}`);
    }
    return null;
  },

  async set(key: string, value: any, ttlSeconds = 300): Promise<void> {
    try {
      const stringified = JSON.stringify(value);
      if (isRedisAvailable()) {
        const client = getRedisClient();
        if (client) {
          await client.set(key, stringified, 'EX', ttlSeconds);
        }
      } else {
        memoryCache.set(key, {
          value,
          expiresAt: Date.now() + ttlSeconds * 1000,
        });
      }
    } catch (err: any) {
      logger.debug(`[Cache] Set error for key ${key}: ${err.message}`);
    }
  },

  async del(key: string): Promise<void> {
    try {
      if (isRedisAvailable()) {
        const client = getRedisClient();
        if (client) await client.del(key);
      }
      memoryCache.delete(key);
    } catch (err: any) {
      logger.debug(`[Cache] Del error for key ${key}: ${err.message}`);
    }
  },

  async delPattern(pattern: string): Promise<void> {
    try {
      if (isRedisAvailable()) {
        const client = getRedisClient();
        if (client) {
          const keys = await client.keys(pattern);
          if (keys.length > 0) {
            await client.del(...keys);
          }
        }
      }
      // Memory cleanup for pattern
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      for (const k of memoryCache.keys()) {
        if (regex.test(k)) {
          memoryCache.delete(k);
        }
      }
    } catch (err: any) {
      logger.debug(`[Cache] DelPattern error for pattern ${pattern}: ${err.message}`);
    }
  },
};

export const CacheService = cacheService;

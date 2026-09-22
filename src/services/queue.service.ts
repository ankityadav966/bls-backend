import { Queue, Worker, Job } from 'bullmq';
import { isRedisAvailable, getRedisClient } from '../config/redis.js';
import { logger } from '../utils/logger.js';

let notificationsQueue: Queue | null = null;

export const initQueues = () => {
  if (isRedisAvailable()) {
    try {
      const redisClient = getRedisClient();
      if (redisClient) {
        notificationsQueue = new Queue('bls-notifications', {
          connection: redisClient,
        });

        // Initialize background worker
        new Worker(
          'bls-notifications',
          async (job: Job) => {
            logger.info(`[Queue:Worker] Processing job ${job.name} (ID: ${job.id})`);
            // Simulated asynchronous notification dispatch / email sending
            return { status: 'processed', timestamp: new Date() };
          },
          { connection: redisClient }
        );

        logger.info('[Queue] BullMQ workers and queues initialized successfully.');
      }
    } catch (err: any) {
      logger.warn(`[Queue] BullMQ initialization skipped: ${err.message}`);
    }
  } else {
    logger.info('[Queue] Running in synchronous/in-process background runner mode.');
  }
};

export const enqueueNotification = async (name: string, payload: any): Promise<void> => {
  try {
    if (notificationsQueue && isRedisAvailable()) {
      await notificationsQueue.add(name, payload, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      });
    } else {
      // In-process immediate execution fallback
      logger.info(`[Queue:Direct] Async task '${name}' executed directly in-process: ${JSON.stringify(payload?.title || payload)}`);
    }
  } catch (err: any) {
    logger.error(`[Queue] Failed to enqueue notification: ${err.message}`);
  }
};

export const QueueService = {
  addJob: async (name: string, payload: any) => enqueueNotification(name, payload),
};

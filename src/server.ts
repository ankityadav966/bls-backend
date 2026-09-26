import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { disconnectRedis } from './config/redis';
import { logger } from './utils/logger';

const startServer = async () => {
  try {
    logger.info('[Server] Starting BLS AND COMPANY Enterprise Backend...');

    // 1. Connect to Database
    await connectDatabase();

    // 2. Initialize App
    const app = createApp();

    // 3. Start Listening
    const server = app.listen(env.PORT, () => {
      logger.info('========================================================');
      logger.info(` BLS AND COMPANY Backend running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      logger.info(` Production Base:   https://pls.durgaselector.com`);
      logger.info(` API v1 Base:       https://pls.durgaselector.com/api/v1`);
      logger.info(` Swagger Docs:      https://pls.durgaselector.com/api/docs`);
      logger.info(` Health Check:      https://pls.durgaselector.com/health`);
      logger.info('========================================================');
    });

    // Graceful Shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.warn(`[Server] Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        logger.info('[Server] HTTP server closed.');
        await disconnectDatabase();
        await disconnectRedis();
        logger.info('[Server] All connections closed. Exiting process.');
        process.exit(0);
      });

      // Force exit after 10 seconds if lingering
      setTimeout(() => {
        logger.error('[Server] Forced shutdown timeout exceeded. Terminating.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    logger.error('[Server] Fatal error during startup:', error);
    process.exit(1);
  }
};

startServer();

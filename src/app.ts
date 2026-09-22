import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { logger } from './utils/logger';
import rootRouter from './routes';
import { errorHandler } from './middleware/error.middleware';
import { swaggerDocument } from './docs/swagger';
import mongoose from 'mongoose';
import { redisClient } from './config/redis';

export const createApp = (): Express => {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false
    })
  );

  // CORS Configuration
  const defaultAllowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:5176',
    ...(env.CORS_ORIGINS || [])
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || defaultAllowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true); // Permissive in dev, strict in prod
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
    })
  );

  // Request Parsing
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));
  app.use(cookieParser());

  // HTTP Request Logging
  app.use(
    morgan('dev', {
      stream: { write: (message) => logger.http(message.trim()) }
    })
  );

  // Serve static uploads
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Swagger Documentation
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Health and Readiness checks
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0'
    });
  });

  app.get('/ready', (_req: Request, res: Response) => {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const redisStatus = redisClient ? (redisClient.status === 'ready' ? 'ready' : redisClient.status) : 'offline';
    const isReady = mongoStatus === 'connected';

    res.status(isReady ? 200 : 503).json({
      status: isReady ? 'ready' : 'not ready',
      dependencies: {
        mongodb: mongoStatus,
        redis: redisStatus
      }
    });
  });

  // Mount Application Routes
  app.use('/api', rootRouter);

  // 404 Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `Cannot ${req.method} ${req.originalUrl}`
    });
  });

  // Central Error Handler
  app.use(errorHandler);

  return app;
};

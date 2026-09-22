import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sendError } from '../utils/apiResponse';
import { env } from '../config/env';

export class AppError extends Error {
  statusCode: number;
  errors?: any;

  constructor(message: string, statusCode = 400, errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): any => {
  logger.error(`[Error Middleware] ${req.method} ${req.originalUrl}: ${err.message}`, {
    stack: err.stack,
  });

  if (err.name === 'ValidationError') {
    return sendError(res, err.message, 400, err.errors);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return sendError(res, `Duplicate record found for ${field}. Please use unique value.`, 409);
  }

  if (err.name === 'CastError') {
    return sendError(res, `Invalid resource identifier format: ${err.value}`, 400);
  }

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 && env.NODE_ENV === 'production'
    ? 'An unexpected internal server error occurred.'
    : err.message || 'Internal Server Error';

  return sendError(res, message, statusCode, env.NODE_ENV === 'development' ? err.stack : undefined);
};

import { Response } from 'express';

export interface ApiResponseData<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: any;
  };
  errors?: any;
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data?: T,
  meta?: ApiResponseData['meta'],
  errors?: any
) => {
  const responsePayload: ApiResponseData<T> = {
    success,
    message,
    ...(data !== undefined && { data }),
    ...(meta !== undefined && { meta }),
    ...(errors !== undefined && { errors }),
  };

  return res.status(statusCode).json(responsePayload);
};

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  meta?: ApiResponseData['meta'] | number,
  statusCode = 200
) => {
  if (typeof meta === 'number') {
    statusCode = meta;
    meta = undefined;
  }
  return sendResponse(res, statusCode, true, message, data, meta);
};

export const sendPaginated = <T>(
  res: Response,
  message: string,
  data: T,
  page: number,
  limit: number,
  total: number
) => {
  const totalPages = Math.ceil(total / (limit || 20));
  return sendResponse(res, 200, true, message, data, { page, limit, total, totalPages });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  errors?: any
) => {
  return sendResponse(res, statusCode, false, message, undefined, undefined, errors);
};

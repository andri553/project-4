import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: any;
  timestamp: string;
  correlationId?: string;
}

export function sendSuccess<T = any>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200,
  meta?: any
): Response {
  const correlationId = res.getHeader('x-correlation-id') as string | undefined;
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta,
    timestamp: new Date().toISOString(),
    correlationId,
  };
  return res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  errors?: any
): Response {
  const correlationId = res.getHeader('x-correlation-id') as string | undefined;
  const response: ApiResponse = {
    success: false,
    message,
    data: errors,
    timestamp: new Date().toISOString(),
    correlationId,
  };
  return res.status(statusCode).json(response);
}

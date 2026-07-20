import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import { logger } from '../logger/logger';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const correlationId = req.headers['x-correlation-id'] || 'unknown';
  logger.error({ err, path: req.path, method: req.method, correlationId }, 'Unhandled server error');

  const statusCode = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'An unexpected error occurred. Please contact support.'
    : err.message || 'Internal Server Error';

  return sendError(res, message, statusCode, err.errors || undefined);
}

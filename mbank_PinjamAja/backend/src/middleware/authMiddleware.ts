import { Request, Response, NextFunction } from 'express';
import { authService } from '../auth/auth.service';
import { sendError } from '../utils/response';
import { logger } from '../logger/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  correlationId?: string;
  startTime?: number;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Access denied. No token provided.', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = authService.verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn({ error, ip: req.ip }, 'Invalid access token verification failed');
    return sendError(res, 'Invalid or expired token.', 401);
  }
}

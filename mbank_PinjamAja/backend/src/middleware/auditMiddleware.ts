import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import { auditService } from '../audit/audit.service';
import { logger } from '../logger/logger';

export function auditMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Capture request start time
  req.startTime = Date.now();

  res.on('finish', async () => {
    try {
      const responseTime = req.startTime ? Date.now() - req.startTime : 0;
      const actorId = req.user?.id || null;
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
      const userAgent = req.headers['user-agent'] || '';

      // Determine module and action
      const pathParts = req.originalUrl.split('/').filter(Boolean);
      const module = pathParts[1] || 'general';
      const action = `${req.method} ${req.originalUrl}`;
      const result = res.statusCode >= 400 ? 'FAILURE' : 'SUCCESS';

      // Parse browser & device from user-agent simply
      let browser = 'unknown';
      let device = 'unknown';
      if (userAgent) {
        if (userAgent.includes('Chrome')) browser = 'Chrome';
        else if (userAgent.includes('Safari')) browser = 'Safari';
        else if (userAgent.includes('Firefox')) browser = 'Firefox';
        else if (userAgent.includes('Edge')) browser = 'Edge';

        if (userAgent.includes('Mobi') || userAgent.includes('iPhone') || userAgent.includes('Android')) {
          device = 'Mobile';
        } else {
          device = 'Desktop';
        }
      }

      // We only log write operations, logins, logouts, or errors to avoid database bloating on simple GETs.
      // Exception: GET /api/auth/me which is checked constantly can be ignored, but let's log other important actions.
      const isWriteOp = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
      const isAuthRoute = req.originalUrl.includes('/api/auth');
      const isFailure = result === 'FAILURE';

      if (isWriteOp || isAuthRoute || isFailure) {
        await auditService.log({
          actorId,
          module,
          action,
          entity: module,
          entityId: (req.params?.id as string) || null,
          result,
          correlationId: req.correlationId || null,
          httpMethod: req.method,
          responseTime,
          ipAddress: ipAddress as string,
          browser,
          device,
        });
      }
    } catch (error) {
      logger.error({ error }, 'Error in audit middleware finish hook');
    }
  });

  next();
}

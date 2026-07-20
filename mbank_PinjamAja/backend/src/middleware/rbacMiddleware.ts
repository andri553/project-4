import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import { authorizationService } from '../auth/authorization.service';
import { sendError } from '../utils/response';

export function checkPermission(permissionName: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthorized.', 401);
      }

      const hasPerm = await authorizationService.hasPermission(
        req.user.id,
        req.user.role,
        permissionName
      );

      if (!hasPerm) {
        return sendError(res, 'Access denied. Insufficient permissions.', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

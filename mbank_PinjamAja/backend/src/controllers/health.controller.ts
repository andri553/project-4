import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { getRedisStatus } from '../redis/redis';
import { getRabbitMQStatus } from '../queue/queue';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../logger/logger';

export class HealthController {
  async check(req: Request, res: Response, next: NextFunction) {
    let dbStatus = false;
    try {
      // Execute simple query to assert DB is online
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = true;
    } catch (error: any) {
      logger.error({ err: error }, 'Health check database query failure');
      dbStatus = false;
    }

    const redisStatus = getRedisStatus();
    const rabbitMQStatus = getRabbitMQStatus();
    const isHealthy = dbStatus; // DB is core; redis/rabbitmq might be offline but app could degrade gracefully.

    const healthData = {
      database: dbStatus ? 'UP' : 'DOWN',
      redis: redisStatus ? 'UP' : 'DOWN',
      rabbitmq: rabbitMQStatus ? 'UP' : 'DOWN',
      version: '1.0.0',
    };

    if (isHealthy) {
      return sendSuccess(res, 'Health check passed', healthData, 200);
    } else {
      return sendError(res, 'Health check failed. Critical services offline.', 503, healthData);
    }
  }
}
export const healthController = new HealthController();

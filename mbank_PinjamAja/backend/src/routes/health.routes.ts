import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { getRedisStatus } from '../redis/redis';
import { getRabbitMQStatus } from '../queue/queue';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  let dbStatus = 'DOWN';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'UP';
  } catch (err) {
    dbStatus = 'DOWN';
  }

  const redisStatus = getRedisStatus() ? 'UP' : 'DOWN';
  const rabbitmqStatus = getRabbitMQStatus() ? 'UP' : 'DOWN';

  const isOverallUp = dbStatus === 'UP'; // Redis & RabbitMQ are optional degrades in backend bootstrap

  res.json({
    success: true,
    status: isOverallUp ? 'UP' : 'DOWN',
    services: {
      database: dbStatus,
      redis: redisStatus,
      rabbitmq: rabbitmqStatus
    },
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;

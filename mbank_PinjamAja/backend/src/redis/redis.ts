import { createClient } from 'redis';
import { logger } from '../logger/logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
export const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy(retries) {
      if (retries > 2) {
        logger.warn('Redis reconnection retries exhausted. Disabling Redis integration.');
        return false; // Stop reconnecting
      }
      return 1000; // Wait 1s before retry
    }
  }
});

let isRedisConnected = false;

redisClient.on('error', (err) => {
  logger.warn({ err }, 'Redis connection error. Falling back to in-memory/disabled mode.');
  isRedisConnected = false;
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis server.');
  isRedisConnected = true;
});

export async function initRedis(): Promise<void> {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.warn({ error }, 'Failed to initialize Redis. App will degrade gracefully.');
  }
}

export function getRedisStatus(): boolean {
  return isRedisConnected;
}

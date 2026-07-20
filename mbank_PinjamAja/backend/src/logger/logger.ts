import pino from 'pino';
import { AsyncLocalStorage } from 'async_hooks';

// Storage to track correlation IDs across async contexts
export const correlationLocalStorage = new AsyncLocalStorage<string>();

const isDevelopment = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  mixin() {
    const correlationId = correlationLocalStorage.getStore();
    return correlationId ? { correlationId } : {};
  },
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { securityHeaders, apiLimiter } from './middleware/securityMiddleware';
import { auditMiddleware } from './middleware/auditMiddleware';
import { errorHandler } from './middleware/errorHandler';
import { correlationLocalStorage, logger } from './logger/logger';
import { initRedis } from './redis/redis';
import { initRabbitMQ } from './queue/queue';

// Routes
import authRoutes from './auth/auth.routes';
import healthRoutes from './routes/health.routes';
import businessRoutes from './routes/business.routes';
import securityRoutes from './routes/security.routes';
import chatRoutes from './routes/chat.routes';
import { initListeners } from './eventbus/listeners';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Apply Security Middlewares
app.use(securityHeaders);
app.use(cors());
app.use(express.json());

// Correlation ID context middleware
app.use((req: any, res: any, next: any) => {
  const correlationId = (req.headers['x-correlation-id'] as string) || crypto.randomUUID();
  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  correlationLocalStorage.run(correlationId, next);
});

// Register Health Routes (Bypass Rate Limiter)
app.use('/health', healthRoutes);
app.use('/api/v1/health', healthRoutes);

// Apply API general limiter and audit logging
app.use(apiLimiter);
app.use(auditMiddleware);

// Register HTTP Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/business', businessRoutes);
app.use('/api/v1/security', securityRoutes);
app.use('/api/v1/chat', chatRoutes);

// Global Error Handler
app.use(errorHandler);

// Bootstrapping services
async function bootstrap() {
  logger.info('Starting Enterprise Banking Platform Backend Services...');
  
  // Register EventBus listeners
  initListeners();
  
  // Init Redis (Graceful degrade)
  await initRedis();

  // Init RabbitMQ (Graceful degrade)
  await initRabbitMQ();

  app.listen(PORT, () => {
    logger.info(`Backend server running successfully on http://localhost:${PORT}`);
  });
}

bootstrap().catch((error) => {
  logger.fatal({ error }, 'Failed to bootstrap backend application');
  process.exit(1);
});
export default app;

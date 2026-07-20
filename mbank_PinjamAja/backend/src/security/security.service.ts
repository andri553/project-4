import { securityRepository } from './security.repository';
import { publishToQueue } from '../queue/queue';
import { logger } from '../logger/logger';
import { Prisma } from '@prisma/client';

export class SecurityService {
  async log(data: Prisma.SecurityEventUncheckedCreateInput) {
    try {
      const eventEntry = await securityRepository.create(data);

      // Publish event to RabbitMQ
      publishToQueue('security_events', eventEntry);

      return eventEntry;
    } catch (error) {
      logger.error({ error }, 'Failed to create security event');
      // Do not re-throw telemetry errors to allow business/auth flows to degrade gracefully
      return null as any;
    }
  }

  async getRecent(limit?: number) {
    return securityRepository.findRecent(limit);
  }
}
export const securityService = new SecurityService();

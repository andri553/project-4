import { auditRepository } from './audit.repository';
import { publishToQueue } from '../queue/queue';
import { logger } from '../logger/logger';
import { Prisma } from '@prisma/client';

export class AuditService {
  async log(data: Prisma.AuditLogUncheckedCreateInput) {
    try {
      const logEntry = await auditRepository.create(data);
      
      // Publish event to RabbitMQ
      publishToQueue('audit_logs', logEntry);

      return logEntry;
    } catch (error) {
      logger.error({ error }, 'Failed to create audit log');
      throw error;
    }
  }

  async getRecent(limit?: number) {
    return auditRepository.findRecent(limit);
  }
}
export const auditService = new AuditService();

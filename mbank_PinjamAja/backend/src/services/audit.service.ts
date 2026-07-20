import { prisma } from '../config/prisma';
import { logger } from '../logger/logger';
import { publishToQueue } from '../queue/queue';

export class AuditService {
  async log(data: {
    actorId?: string;
    actorRole?: string;
    module: string;
    action: string;
    entity: string;
    entityId?: string;
    oldValue?: string;
    newValue?: string;
    result: 'SUCCESS' | 'FAILURE';
    requestId?: string;
    correlationId?: string;
    httpMethod?: string;
    responseTime?: number;
    ipAddress?: string;
    browser?: string;
    device?: string;
    isMock?: boolean;
    isArchived?: boolean;
  }) {
    try {
      const logEntry = await prisma.auditLog.create({
        data: {
          actorId: data.actorId || null,
          actorRole: data.actorRole || null,
          module: data.module,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId || null,
          oldValue: data.oldValue || null,
          newValue: data.newValue || null,
          result: data.result,
          requestId: data.requestId || null,
          correlationId: data.correlationId || null,
          httpMethod: data.httpMethod || null,
          responseTime: data.responseTime || null,
          ipAddress: data.ipAddress || null,
          browser: data.browser || null,
          device: data.device || null,
          isMock: data.isMock || false,
          isArchived: data.isArchived || false
        }
      });

      // Publish to RabbitMQ if running
      publishToQueue('audit_logs', logEntry);

      return logEntry;
    } catch (error) {
      logger.error({ error }, 'Failed to create audit log entry');
    }
  }
}

export const auditService = new AuditService();

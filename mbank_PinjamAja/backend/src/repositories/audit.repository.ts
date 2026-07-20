import { prisma } from '../config/prisma';

export class AuditRepository {
  async findAuditLogsForUser(userId: string, limit = 50) {
    return prisma.auditLog.findMany({
      where: {
        actorId: userId,
        isArchived: false
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  async findSecurityEventsForUser(userId: string, limit = 50) {
    return prisma.securityEvent.findMany({
      where: {
        userId,
        isArchived: false
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  async findRelatedAuditsAndEvents(userId: string, txDate: Date, limit = 10) {
    // Audit logs and security events that happened near the transaction (e.g., within 1 hour before)
    const oneHourBefore = new Date(txDate.getTime() - 60 * 60 * 1000);
    const oneHourAfter = new Date(txDate.getTime() + 60 * 60 * 1000);

    const [logs, events] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          actorId: userId,
          createdAt: {
            gte: oneHourBefore,
            lte: oneHourAfter
          },
          isArchived: false
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      }),
      prisma.securityEvent.findMany({
        where: {
          userId,
          createdAt: {
            gte: oneHourBefore,
            lte: oneHourAfter
          },
          isArchived: false
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    ]);

    return { logs, events };
  }
}

export const auditRepository = new AuditRepository();

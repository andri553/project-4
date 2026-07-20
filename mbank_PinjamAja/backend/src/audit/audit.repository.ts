import { prisma } from '../config/prisma';
import { AuditLog, Prisma } from '@prisma/client';

export class AuditRepository {
  async create(data: Prisma.AuditLogUncheckedCreateInput) {
    return prisma.auditLog.create({ data });
  }

  async findRecent(limit = 100): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: true },
    });
  }
}
export const auditRepository = new AuditRepository();

import { prisma } from '../config/prisma';
import { SecurityEvent, Prisma } from '@prisma/client';

export class SecurityRepository {
  async create(data: Prisma.SecurityEventCreateInput): Promise<SecurityEvent> {
    return prisma.securityEvent.create({ data });
  }

  async findRecent(limit = 100): Promise<SecurityEvent[]> {
    return prisma.securityEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: true },
    });
  }
}
export const securityRepository = new SecurityRepository();

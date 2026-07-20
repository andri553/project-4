import { prisma } from '../config/prisma';

export class SessionRepository {
  async findActiveByUserId(userId: string) {
    return prisma.session.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        isArchived: false
      },
      orderBy: { lastActivity: 'desc' }
    });
  }

  async findSessionForTransaction(userId: string, txDate: Date) {
    // We try to find the session that was active during the transaction.
    // That means the transaction date falls within the session lifespan or close to lastActivity.
    // We fetch the session that has the closest lastActivity before or shortly after the transaction.
    return prisma.session.findFirst({
      where: {
        userId,
        isArchived: false,
        createdAt: { lte: txDate }
      },
      orderBy: { lastActivity: 'desc' }
    });
  }
}

export const sessionRepository = new SessionRepository();

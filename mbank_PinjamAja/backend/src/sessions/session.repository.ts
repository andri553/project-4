import { prisma } from '../config/prisma';
import { Session, Prisma } from '@prisma/client';

export class SessionRepository {
  async findByRefreshToken(refreshToken: string) {
    return prisma.session.findUnique({
      where: { refreshToken },
      include: { user: { include: { role: true } } },
    });
  }

  async create(data: Prisma.SessionUncheckedCreateInput) {
    return prisma.session.create({ data });
  }

  async updateActivity(id: string, ipAddress?: string): Promise<Session> {
    return prisma.session.update({
      where: { id },
      data: {
        lastActivity: new Date(),
        ...(ipAddress ? { ipAddress } : {}),
      },
    });
  }

  async delete(id: string): Promise<Session> {
    return prisma.session.delete({
      where: { id },
    });
  }

  async deleteByToken(refreshToken: string): Promise<Session | null> {
    const existing = await prisma.session.findUnique({ where: { refreshToken } });
    if (!existing) return null;
    return prisma.session.delete({
      where: { refreshToken },
    });
  }
}
export const sessionRepository = new SessionRepository();

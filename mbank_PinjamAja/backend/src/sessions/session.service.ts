import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { logger } from '../logger/logger';
import { securityService } from '../security/security.service';
import { redisClient, getRedisStatus } from '../redis/redis';

const JWT_SECRET = process.env.JWT_SECRET || 'enterprise_access_token_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'enterprise_refresh_token_secret';
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '30d';

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export class SessionService {
  async createSession(data: {
    userId: string;
    refreshToken: string;
    deviceId?: string;
    deviceFingerprint?: string;
    browser?: string;
    operatingSystem?: string;
    ipAddress?: string;
    isTrustedDevice?: boolean;
  }) {
    const expiresDays = 30; // 30 days absolute timeout
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresDays);

    const session = await prisma.session.create({
      data: {
        userId: data.userId,
        refreshToken: data.refreshToken,
        deviceId: data.deviceId,
        deviceFingerprint: data.deviceFingerprint,
        browser: data.browser,
        operatingSystem: data.operatingSystem,
        ipAddress: data.ipAddress,
        isTrustedDevice: data.isTrustedDevice || false,
        expiresAt,
        status: 'ACTIVE'
      },
      include: { user: { include: { role: true } } }
    });

    await securityService.log({
      userId: data.userId,
      category: 'Session',
      sourceModule: 'session_service',
      severity: 'Low',
      riskScore: 0,
      description: `Session created (${session.id}) on device: ${data.browser || 'unknown'} (${data.operatingSystem || 'unknown'})`,
      status: 'RESOLVED'
    });

    if (getRedisStatus()) {
      try { await redisClient.del('active_sessions_soc'); } catch (e) {}
    }

    return session;
  }

  async getSessionByToken(refreshToken: string) {
    return prisma.session.findFirst({
      where: { refreshToken },
      include: { user: { include: { role: true } } }
    });
  }

  async validateSession(token: string): Promise<TokenPayload | null> {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (e) {
      return null;
    }
  }

  async refreshSession(oldRefreshToken: string, ipAddress?: string) {
    const session = await prisma.session.findFirst({
      where: { refreshToken: oldRefreshToken },
      include: { user: { include: { role: true } } }
    });

    if (!session) {
      await securityService.log({
        category: 'Session',
        sourceModule: 'session_service',
        severity: 'High',
        riskScore: 8,
        description: 'Session refresh attempted with invalid/non-existent refresh token (possible token reuse attack)',
        status: 'OPEN'
      });
      throw new Error('Session not found');
    }

    if (session.status !== 'ACTIVE') {
      throw new Error(`Session is not active (current status: ${session.status})`);
    }

    if (new Date() > session.expiresAt) {
      await prisma.session.update({
        where: { id: session.id },
        data: { status: 'EXPIRED' }
      });
      await securityService.log({
        userId: session.userId,
        category: 'Session',
        sourceModule: 'session_service',
        severity: 'Medium',
        riskScore: 4,
        description: `Session expired for user: ${session.user.email}`,
        status: 'OPEN'
      });
      throw new Error('Session expired');
    }

    // Refresh Token Rotation (RTR): Invalidate old token, issue new tokens
    const roleName = session.user.role.name;
    const payload: TokenPayload = {
      id: session.userId,
      email: session.user.email,
      role: roleName
    };

    const accessToken = jwt.sign(payload as any, JWT_SECRET, { expiresIn: ACCESS_EXPIRY } as any);
    const newRefreshToken = jwt.sign(payload as any, JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY } as any);

    // Rotate refresh token by updating the session record
    const expiresDays = 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresDays);

    const updatedSession = await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        lastActivity: new Date(),
        expiresAt,
        ...(ipAddress ? { ipAddress } : {})
      }
    });

    await securityService.log({
      userId: session.userId,
      category: 'Session',
      sourceModule: 'session_service',
      severity: 'Low',
      riskScore: 0,
      description: `Session refreshed (${session.id}). Refresh Token Rotated.`,
      status: 'RESOLVED'
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: session.user
    };
  }

  async revokeSession(id: string) {
    try {
      const session = await prisma.session.update({
        where: { id },
        data: { status: 'REVOKED' }
      });
      await securityService.log({
        userId: session.userId,
        category: 'Session',
        sourceModule: 'session_service',
        severity: 'Low',
        riskScore: 0,
        description: `Session revoked: ${id}`,
        status: 'RESOLVED'
      });
      if (getRedisStatus()) {
        try { await redisClient.del('active_sessions_soc'); } catch (e) {}
      }
      return session;
    } catch (e) {
      logger.error({ error: e, sessionId: id }, 'Failed to revoke session');
    }
  }

  async terminateSession(refreshToken: string) {
    const session = await prisma.session.findFirst({
      where: { refreshToken }
    });

    if (session) {
      await prisma.session.update({
        where: { id: session.id },
        data: { status: 'LOGGED_OUT' }
      });
      await securityService.log({
        userId: session.userId,
        category: 'Session',
        sourceModule: 'session_service',
        severity: 'Low',
        riskScore: 0,
        description: `User logged out session: ${session.id}`,
        status: 'RESOLVED'
      });
      if (getRedisStatus()) {
        try { await redisClient.del('active_sessions_soc'); } catch (e) {}
      }
    }
  }

  async getActiveSessions(userId: string) {
    return prisma.session.findMany({
      where: { userId, status: 'ACTIVE' }
    });
  }

  async getActiveSessionsSOC() {
    // 1. Try to read from Redis cache
    if (getRedisStatus()) {
      try {
        const cached = await redisClient.get('active_sessions_soc');
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (redisError) {
        logger.warn('[SessionService] Redis error reading active sessions cache. Falling back to DB.');
      }
    }

    // 2. Query Database (fallback)
    const sessions = await prisma.session.findMany({
      where: { status: 'ACTIVE' },
      include: {
        user: {
          include: {
            role: true,
            devices: { take: 1, orderBy: { lastSeen: 'desc' } }
          }
        }
      },
      orderBy: { lastActivity: 'desc' }
    });

    // 3. Try to save to Redis for 10 seconds cache
    if (getRedisStatus()) {
      try {
        await redisClient.setEx('active_sessions_soc', 10, JSON.stringify(sessions));
      } catch (redisError) {
        // ignore cache write error
      }
    }

    return sessions;
  }
}

export const sessionService = new SessionService();

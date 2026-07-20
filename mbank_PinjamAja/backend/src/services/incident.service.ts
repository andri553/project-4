import { prisma } from '../config/prisma';
import { logger } from '../logger/logger';
import { eventBus } from '../eventbus/eventbus';
import { riskService } from './risk.service';

export class IncidentService {
  // Policy Engine checks failed logins
  async recordLoginFailure(email: string, ipAddress: string) {
    try {
      const user = await prisma.user.findFirst({
        where: { email }
      });

      // Log security event for failed login
      await prisma.securityEvent.create({
        data: {
          userId: user?.id || null,
          category: 'Authentication',
          sourceModule: 'policy_engine',
          severity: 'Medium',
          riskScore: 10,
          description: `Failed login attempt for email: ${email} from IP: ${ipAddress}`,
          status: 'OPEN',
          isMock: user?.isMock || false,
          isArchived: user?.isArchived || false,
        }
      });

      if (!user) return;

      // Increase risk score by 10 points
      await riskService.evaluateUserRisk(user.id, 10, `Failed login attempt from IP: ${ipAddress}`);

      // Count failures in the last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const failureCount = await prisma.securityEvent.count({
        where: {
          userId: user.id,
          category: 'Authentication',
          description: { contains: 'Failed login' },
          createdAt: { gte: fiveMinutesAgo }
        }
      });

      if (failureCount >= 3) {
        // Trigger Incident!
        await this.createIncident({
          userId: user.id,
          title: 'Brute Force Attack Detected',
          description: `Brute Force pattern detected for user ${email}. 3+ login failures in under 5 minutes from IP ${ipAddress}. Account automatically locked for security.`,
          severity: 'CRITICAL',
          isMock: user.isMock,
          isArchived: user.isArchived,
        });

        // Auto-lock account
        await prisma.user.update({
          where: { id: user.id },
          data: { accountStatus: 'LOCKED' }
        });

        // Add 35 risk points for account lock
        await riskService.evaluateUserRisk(user.id, 35, 'Account locked due to brute force detection');
      }
    } catch (error) {
      logger.error({ error, email }, 'Failed to record login failure in Policy Engine');
    }
  }

  // Create Incident
  async createIncident(data: {
    userId?: string;
    title: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    isMock?: boolean;
    isArchived?: boolean;
  }) {
    try {
      const incident = await prisma.securityIncident.create({
        data: {
          userId: data.userId || null,
          title: data.title,
          description: data.description,
          severity: data.severity,
          status: 'OPEN',
          isMock: data.isMock || false,
          isArchived: data.isArchived || false
        }
      });

      logger.warn({ incident }, 'NEW SECURITY INCIDENT GENERATED');

      eventBus.publish('incident.created', incident);
      return incident;
    } catch (error) {
      logger.error({ error }, 'Failed to create security incident');
      throw error;
    }
  }
}

export const incidentService = new IncidentService();

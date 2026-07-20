import { prisma } from '../config/prisma';
import { logger } from '../logger/logger';
import { eventBus } from '../eventbus/eventbus';

export class RiskService {
  async evaluateUserRisk(userId: string, pointsChange: number, reason: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) return null;

      let newScore = user.riskScore + pointsChange;
      if (newScore < 0) newScore = 0;
      if (newScore > 100) newScore = 100;

      let riskLevel = 'LOW';
      if (newScore > 75) riskLevel = 'CRITICAL';
      else if (newScore > 50) riskLevel = 'HIGH';
      else if (newScore > 25) riskLevel = 'MEDIUM';

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          riskScore: newScore,
          riskLevel
        }
      });

      logger.info({ userId, oldScore: user.riskScore, newScore, riskLevel, reason }, 'Updated user risk score');

      // Publish security event for risk change
      await prisma.securityEvent.create({
        data: {
          userId,
          category: 'Risk Assessment',
          sourceModule: 'risk_engine',
          severity: riskLevel === 'CRITICAL' || riskLevel === 'HIGH' ? 'High' : 'Medium',
          riskScore: pointsChange,
          description: `Risk score updated to ${newScore} (${riskLevel}). Reason: ${reason}`,
          status: 'RESOLVED',
          isMock: user.isMock,
          isArchived: user.isArchived,
        }
      });

      eventBus.publish('risk.score_updated', {
        userId,
        riskScore: newScore,
        riskLevel,
        reason
      });

      return updatedUser;
    } catch (error) {
      logger.error({ error, userId }, 'Failed to evaluate user risk');
      throw error;
    }
  }

  // Initial risk assessment
  async initialAssessment(userId: string, isMock = false) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    let score = 0;
    if (user.kycStatus === 'NOT_STARTED') score += 25; // Unverified KYC adds risk

    let riskLevel = 'LOW';
    if (score > 25) riskLevel = 'MEDIUM';

    await prisma.user.update({
      where: { id: userId },
      data: { riskScore: score, riskLevel }
    });
  }
}

export const riskService = new RiskService();

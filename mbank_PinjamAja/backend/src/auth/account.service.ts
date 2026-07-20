import { prisma } from '../config/prisma';
import { securityService } from '../security/security.service';

export class AccountService {
  async getProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });
  }

  async updateProfile(userId: string, data: { fullName?: string; email?: string }) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data
    });

    await securityService.log({
      userId,
      category: 'Account',
      sourceModule: 'account_service',
      severity: 'Low',
      riskScore: 0,
      description: 'User profile updated successfully',
      status: 'RESOLVED'
    });

    return updated;
  }

  async updateBiometrics(userId: string, enabled: boolean) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { biometricEnabled: enabled }
    });

    await securityService.log({
      userId,
      category: 'Account',
      sourceModule: 'account_service',
      severity: 'Low',
      riskScore: 0,
      description: `Biometrics ${enabled ? 'enabled' : 'disabled'}`,
      status: 'RESOLVED'
    });

    return updated;
  }
}

export const accountService = new AccountService();

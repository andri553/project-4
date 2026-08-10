import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { authService, SessionContext } from '../auth/auth.service';
import { deviceService } from '../services/device.service';
import { loanService } from '../services/loan.service';
import { savingsService } from '../services/savings.service';
import { kycService } from '../services/kyc.service';
import { notificationService } from '../services/notification.service';
import { prisma } from '../config/prisma';
import { securityService } from '../security/security.service';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../logger/logger';
import { eventBus } from '../eventbus/eventbus';
import { incidentService } from '../services/incident.service';

export class BusinessController {
  // Login
  async login(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const { email, password, deviceId, deviceFingerprint } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    try {
      const userAgent = req.headers['user-agent'] || '';
      let browser = 'unknown';
      let operatingSystem = 'unknown';

      if (userAgent) {
        if (userAgent.includes('Chrome')) browser = 'Chrome';
        else if (userAgent.includes('Safari')) browser = 'Safari';
        else if (userAgent.includes('Firefox')) browser = 'Firefox';

        if (userAgent.includes('Windows')) operatingSystem = 'Windows';
        else if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS')) operatingSystem = 'macOS';
        else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) operatingSystem = 'iOS';
        else if (userAgent.includes('Android')) operatingSystem = 'Android';
        else if (userAgent.includes('Linux')) operatingSystem = 'Linux';
      }

      const context: SessionContext = {
        deviceId,
        deviceFingerprint,
        browser,
        operatingSystem,
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown',
      };

      const result = await authService.login(email, password, context);

      // Perform device validation (Device Service)
      const { isTrusted, device } = await deviceService.validateDevice(result.user.id, context);

      // Publish auth.login event
      eventBus.publish('auth.login', {
        user: result.user,
        context,
        correlationId: req.correlationId
      });

      return sendSuccess(res, 'Login successful', {
        token: result.accessToken,
        refreshToken: result.refreshToken,
        user: {
          id: result.user.id,
          email: result.user.email,
          phone: result.user.phoneNumber,
          fullName: result.user.fullName,
          role: (() => {
            const rawRole = result.user.role.name.toLowerCase();
            if (rawRole === 'administrator') return 'super_admin';
            if (rawRole.includes('ciso') || rawRole.includes('chief information security officer')) return 'ciso';
            if (rawRole.includes('security analyst')) return 'soc_analyst';
            if (rawRole.includes('fraud analyst') || rawRole.includes('risk')) return 'risk_manager';
            if (rawRole.includes('compliance officer')) return 'compliance_officer';
            if (rawRole === 'officer') return 'dev_team';
            return rawRole;
          })(),
          avatarUrl: result.user.avatarUrl,
          kycStatus: result.user.kycStatus.toLowerCase(),
          mfaEnabled: result.user.mfaEnabled,
          biometricEnabled: result.user.biometricEnabled,
          isActive: result.user.accountStatus === 'ACTIVE',
          lastLoginAt: result.user.lastLoginAt,
          riskScore: result.user.riskScore,
          riskLevel: result.user.riskLevel
        },
        device: {
          isTrusted,
          name: device ? `${device.os} (${device.browser})` : 'unknown'
        }
      });
    } catch (error: any) {
      logger.warn({ email, error: error.message }, 'Failed login attempt');
      
      // Notify Policy Engine of login failure
      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
      await incidentService.recordLoginFailure(email, ip);

      return sendError(res, error.message || 'Invalid credentials', 401);
    }
  }

  // Logout
  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const { refreshToken } = req.body;
    try {
      // Find session to get user context
      const session = await authService.logout(refreshToken);
      eventBus.publish('auth.logout', { session, correlationId: req.correlationId });
      return sendSuccess(res, 'Logout successful');
    } catch (error: any) {
      next(error);
    }
  }

  // Profile
  async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const user = await authService.verifyAccessToken(req.headers.authorization?.split(' ')[1] || '');
      return sendSuccess(res, 'User fetched', { user });
    } catch (error: any) {
      next(error);
    }
  }

  // Loans
  async applyLoan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const { productId, productName, amount, tenor, purpose, interestRate } = req.body;
      const loan = await loanService.applyLoan(req.user.id, {
        productId,
        productName,
        amount,
        tenor,
        purpose,
        interestRate
      });
      return sendSuccess(res, 'Loan applied successfully', loan);
    } catch (error: any) {
      next(error);
    }
  }

  async getLoans(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const loans = await loanService.getLoans(req.user.id);
      return sendSuccess(res, 'Loans fetched', loans);
    } catch (error: any) {
      next(error);
    }
  }

  // Savings / Transactions
  async deposit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const { accountId, amount, description } = req.body;
      const tx = await savingsService.deposit(req.user.id, accountId, amount, description);
      return sendSuccess(res, 'Deposit successful', tx);
    } catch (error: any) {
      next(error);
    }
  }

  async withdraw(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const { accountId, amount, description } = req.body;
      const tx = await savingsService.withdraw(req.user.id, accountId, amount, description, false);
      return sendSuccess(res, 'Withdrawal successful', tx);
    } catch (error: any) {
      next(error);
    }
  }

  async transfer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const { accountId, amount, recipientName, recipientAccount, recipientBank } = req.body;
      const tx = await savingsService.transfer(req.user.id, accountId, amount, {
        recipientName,
        recipientAccount,
        recipientBank
      });
      return sendSuccess(res, 'Transfer successful', tx);
    } catch (error: any) {
      next(error);
    }
  }

  async getTransactions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const txs = await savingsService.getTransactions(req.user.id);
      return sendSuccess(res, 'Transactions fetched', txs);
    } catch (error: any) {
      next(error);
    }
  }

  // QRIS Payment
  async qrisPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const { merchantName, amount, accountId } = req.body;
      const tx = await savingsService.withdraw(req.user.id, accountId, amount, `QRIS: ${merchantName}`, true);
      return sendSuccess(res, 'QRIS payment successful', tx);
    } catch (error: any) {
      next(error);
    }
  }

  // KYC
  async startKYC(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const kyc = await kycService.startKYC(req.user.id);
      return sendSuccess(res, 'KYC started successfully', kyc);
    } catch (error: any) {
      next(error);
    }
  }

  async uploadKTP(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const { ocrData } = req.body;
      const kyc = await kycService.uploadKTP(req.user.id, ocrData);
      return sendSuccess(res, 'KTP uploaded and OCR completed successfully', kyc);
    } catch (error: any) {
      next(error);
    }
  }

  async captureSelfie(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const kyc = await kycService.captureSelfie(req.user.id);
      return sendSuccess(res, 'Selfie captured successfully', kyc);
    } catch (error: any) {
      next(error);
    }
  }

  async performFaceMatch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const { score, passed } = req.body;
      const kyc = await kycService.performFaceMatch(req.user.id, score, passed);
      return sendSuccess(res, 'Face match completed successfully', kyc);
    } catch (error: any) {
      next(error);
    }
  }

  async submitKYC(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const { ocrData, matchScore, faceMatchPassed } = req.body;
      const kyc = await kycService.submitKYC(req.user.id, {
        ocrData,
        matchScore,
        faceMatchPassed
      });
      return sendSuccess(res, 'KYC submitted successfully', kyc);
    } catch (error: any) {
      next(error);
    }
  }

  // Notifications
  async getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const notifs = await notificationService.getNotifications(req.user.id);
      return sendSuccess(res, 'Notifications fetched', notifs);
    } catch (error: any) {
      next(error);
    }
  }

  async markAllNotificationsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      await notificationService.markAllAsRead(req.user.id);
      return sendSuccess(res, 'All notifications marked read');
    } catch (error: any) {
      next(error);
    }
  }

  async markNotificationRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await notificationService.markAsRead(id as string);
      return sendSuccess(res, 'Notification marked read');
    } catch (error: any) {
      next(error);
    }
  }

  // Update Security Settings (MFA & Biometric)
  async updateSecuritySettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return sendError(res, 'Unauthorized', 401);

      const { mfaEnabled, biometricEnabled } = req.body;

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(typeof mfaEnabled === 'boolean' ? { mfaEnabled } : {}),
          ...(typeof biometricEnabled === 'boolean' ? { biometricEnabled } : {})
        }
      });

      if (typeof mfaEnabled === 'boolean') {
        await securityService.log({
          userId,
          category: 'Security Settings',
          sourceModule: 'auth_service',
          severity: 'Medium',
          riskScore: mfaEnabled ? 0 : 15,
          description: `User ${user.email} ${mfaEnabled ? 'ENABLED' : 'DISABLED'} Multi-Factor Authentication (MFA)`,
          status: 'RESOLVED'
        });
        eventBus.publish('security.mfa_toggled', { userId, mfaEnabled });
      }

      if (typeof biometricEnabled === 'boolean') {
        await securityService.log({
          userId,
          category: 'Security Settings',
          sourceModule: 'auth_service',
          severity: 'Low',
          riskScore: 0,
          description: `User ${user.email} ${biometricEnabled ? 'ENABLED' : 'DISABLED'} Biometric Authentication`,
          status: 'RESOLVED'
        });
        eventBus.publish('security.biometric_toggled', { userId, biometricEnabled });
      }

      return sendSuccess(res, 'Security settings updated successfully', {
        mfaEnabled: user.mfaEnabled,
        biometricEnabled: user.biometricEnabled
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export const businessController = new BusinessController();

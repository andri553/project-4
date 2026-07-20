import { Response, NextFunction } from 'express';
import { authService, SessionContext } from './auth.service';
import { registrationService } from './registration.service';
import { accountService } from './account.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { logger } from '../logger/logger';
import { userRepository } from '../users/user.repository';

// Independent Helper Functions (avoids scope/context binding issues in Express callbacks)

function buildSessionContext(req: AuthenticatedRequest, deviceId?: string, deviceFingerprint?: string): SessionContext {
  const userAgent = req.headers['user-agent'] || '';
  let browser = 'unknown';
  let operatingSystem = 'unknown';

  if (userAgent) {
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    if (userAgent.includes('Windows')) operatingSystem = 'Windows';
    else if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS')) operatingSystem = 'macOS';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) operatingSystem = 'iOS';
    else if (userAgent.includes('Android')) operatingSystem = 'Android';
    else if (userAgent.includes('Linux')) operatingSystem = 'Linux';
  }

  return {
    deviceId,
    deviceFingerprint,
    browser,
    operatingSystem,
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown',
  };
}

function formatUserResponse(user: any) {
  const rawRole = user.role.name.toLowerCase();
  let mappedRole = rawRole;
  if (rawRole === 'administrator') mappedRole = 'super_admin';
  else if (rawRole.includes('ciso') || rawRole.includes('chief information security officer')) mappedRole = 'ciso';
  else if (rawRole.includes('security analyst')) mappedRole = 'soc_analyst';
  else if (rawRole.includes('fraud analyst') || rawRole.includes('risk')) mappedRole = 'risk_manager';
  else if (rawRole.includes('compliance officer')) mappedRole = 'compliance_officer';
  else if (rawRole === 'officer') mappedRole = 'dev_team';

  return {
    id: user.id,
    email: user.email,
    phone: user.phoneNumber,
    fullName: user.fullName,
    role: mappedRole,
    avatarUrl: user.avatarUrl,
    kycStatus: user.kycStatus.toLowerCase(),
    mfaEnabled: user.mfaEnabled,
    biometricEnabled: user.biometricEnabled,
    isActive: user.accountStatus === 'ACTIVE',
    lastLoginAt: user.lastLoginAt,
  };
}

export class AuthController {
  // Standard email/password login (for Admin/CISO compatibility)
  async login(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const { email, password, deviceId, deviceFingerprint } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    try {
      const context = buildSessionContext(req, deviceId, deviceFingerprint);
      const result = await authService.login(email, password, context);

      return sendSuccess(res, 'Login successful', {
        token: result.accessToken,
        refreshToken: result.refreshToken,
        user: formatUserResponse(result.user),
      });
    } catch (error: any) {
      logger.warn({ email, error: error.message }, 'Failed login attempt');
      return sendError(res, error.message || 'Invalid credentials', 401);
    }
  }

  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const { refreshToken } = req.body;
    try {
      await authService.logout(refreshToken);
      return sendSuccess(res, 'Logout successful');
    } catch (error: any) {
      next(error);
    }
  }

  async refresh(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return sendError(res, 'Refresh token is required', 400);
    }

    try {
      const context = buildSessionContext(req);
      const result = await authService.refresh(refreshToken, context);
      return sendSuccess(res, 'Token refreshed successfully', {
        token: result.accessToken,
        refreshToken: result.refreshToken, // Return new rotated refresh token
        user: formatUserResponse(result.user),
      });
    } catch (error: any) {
      logger.warn({ error: error.message }, 'Refresh token rotation failure');
      return sendError(res, error.message || 'Invalid refresh token session', 401);
    }
  }

  async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthorized', 401);
      }
      const user = await userRepository.findById(req.user.id);
      if (!user) {
        return sendError(res, 'User not found', 404);
      }

      return sendSuccess(res, 'User profile fetched successfully', {
        user: formatUserResponse(user),
      });
    } catch (error: any) {
      next(error);
    }
  }

  // --- Phone OTP & Onboarding ---

  async sendOTP(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const { phoneNumber, deviceId, deviceFingerprint } = req.body;
    if (!phoneNumber) return sendError(res, 'Nomor telepon diperlukan', 400);

    try {
      const context = buildSessionContext(req, deviceId, deviceFingerprint);
      const result = await authService.sendPhoneOTP(phoneNumber, context);
      return sendSuccess(res, result.message, result);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async verifyOTP(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const { phoneNumber, otp, deviceId, deviceFingerprint } = req.body;
    if (!phoneNumber || !otp) return sendError(res, 'Nomor telepon dan OTP diperlukan', 400);

    try {
      const context = buildSessionContext(req, deviceId, deviceFingerprint);
      const result = await authService.verifyPhoneOTP(phoneNumber, otp, context);
      return sendSuccess(res, 'OTP berhasil diverifikasi', result);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async registerProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const { fullName, email, phoneNumber } = req.body;
    if (!fullName || !email || !phoneNumber) {
      return sendError(res, 'Nama, email, dan nomor telepon diperlukan', 400);
    }

    try {
      const user = await registrationService.registerProfile({ fullName, email, phoneNumber });
      return sendSuccess(res, 'Profil berhasil dibuat', {
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phoneNumber,
      });
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async setupPIN(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const { userId, pin } = req.body;
    if (!userId || !pin) return sendError(res, 'UserId dan PIN diperlukan', 400);

    try {
      await registrationService.setupPIN(userId, pin);
      return sendSuccess(res, 'PIN berhasil disimpan');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async verifyPIN(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const { userId, pin, deviceId, deviceFingerprint, rememberDevice } = req.body;
    if (!userId || !pin) return sendError(res, 'UserId dan PIN diperlukan', 400);

    try {
      const context = buildSessionContext(req, deviceId, deviceFingerprint);
      const result = await authService.verifyPIN(userId, pin, context, rememberDevice ?? false);
      return sendSuccess(res, 'PIN berhasil diverifikasi', result);
    } catch (error: any) {
      return sendError(res, error.message, 401);
    }
  }

  async loginWithPhoneAndPin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const { phoneNumber, pin, deviceId, deviceFingerprint, rememberDevice } = req.body;
    if (!phoneNumber || !pin) return sendError(res, 'Nomor telepon dan PIN diperlukan', 400);

    try {
      // Find user by phone
      let formattedPhone = phoneNumber;
      if (phoneNumber.startsWith('0')) {
        formattedPhone = '+62' + phoneNumber.slice(1);
      } else if (!phoneNumber.startsWith('+')) {
        formattedPhone = '+62' + phoneNumber;
      }

      const user = await userRepository.findByPhone(formattedPhone);
      if (!user) {
        return sendError(res, 'Nomor handphone atau PIN salah', 401);
      }

      const context = buildSessionContext(req, deviceId, deviceFingerprint);
      const result = await authService.verifyPIN(user.id, pin, context, rememberDevice ?? false);
      return sendSuccess(res, 'Login berhasil', result);
    } catch (error: any) {
      return sendError(res, 'Nomor handphone atau PIN salah', 401);
    }
  }

  async biometricUnlock(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const { userId, deviceId } = req.body;
    if (!userId || !deviceId) return sendError(res, 'UserId dan DeviceId diperlukan', 400);

    try {
      const context = buildSessionContext(req, deviceId);
      const result = await authService.biometricUnlock(userId, context);
      return sendSuccess(res, 'Biometric unlock berhasil', result);
    } catch (error: any) {
      return sendError(res, error.message, 401);
    }
  }

  async updateBiometrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const { enabled } = req.body;
      const user = await accountService.updateBiometrics(req.user.id, enabled ?? false);
      return sendSuccess(res, 'Konfigurasi biometrik berhasil diperbarui', {
        biometricEnabled: user.biometricEnabled
      });
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
}

export const authController = new AuthController();

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/prisma';
import { userRepository } from '../users/user.repository';
import { sessionService } from '../sessions/session.service';
import { deviceService } from '../services/device.service';
import { registrationService } from './registration.service';
import { verifyPassword } from '../utils/hash';
import { logger } from '../logger/logger';
import { securityService } from '../security/security.service';
import { eventBus } from '../eventbus/eventbus';

const JWT_SECRET = process.env.JWT_SECRET || 'enterprise_access_token_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'enterprise_refresh_token_secret';
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '30d';

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export interface SessionContext {
  deviceId?: string;
  deviceFingerprint?: string;
  browser?: string;
  operatingSystem?: string;
  ipAddress?: string;
}

export class AuthService {
  private failedPins = new Map<string, number>(); // userId -> count
  private failedOtps = new Map<string, number>(); // phone -> count

  // Standard Login (email/password for Admin/CISO compatibility)
  async login(email: string, password: string, context: SessionContext) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      await securityService.log({
        category: 'Authentication',
        sourceModule: 'auth_service',
        severity: 'Medium',
        riskScore: 3,
        description: `Failed login attempt for non-existent email: ${email}`,
        status: 'OPEN',
      });
      throw new Error('Invalid email or password');
    }

    if (user.accountStatus !== 'ACTIVE') {
      throw new Error(`Your account status is ${user.accountStatus}. Contact support.`);
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    logger.info({ email, passwordReceived: password, hashInDb: user.passwordHash, isMatch }, 'COMPARING PASSWORD HASH');
    if (!isMatch) {
      await securityService.log({
        userId: user.id,
        category: 'Authentication',
        sourceModule: 'auth_service',
        severity: 'Medium',
        riskScore: 4,
        description: `Failed login attempt (invalid credentials) for user: ${email}`,
        status: 'OPEN',
      });
      throw new Error('Invalid email or password');
    }

    // Validate/Register device
    const { device } = await deviceService.validateDevice(user.id, context);

    const roleName = user.role.name;
    const accessToken = this.generateAccessToken({ id: user.id, email: user.email, role: roleName });
    const refreshToken = this.generateRefreshToken({ id: user.id, email: user.email, role: roleName });

    const session = await sessionService.createSession({
      userId: user.id,
      refreshToken,
      deviceId: context.deviceId,
      deviceFingerprint: context.deviceFingerprint,
      browser: context.browser,
      operatingSystem: context.operatingSystem,
      ipAddress: context.ipAddress,
      isTrustedDevice: device?.isTrusted || false
    });

    await userRepository.update(user.id, { lastLoginAt: new Date() });

    await securityService.log({
      userId: user.id,
      category: 'Authentication',
      sourceModule: 'auth_service',
      severity: 'Low',
      riskScore: 0,
      description: `Successful login (email/pass) for user: ${email}`,
      status: 'RESOLVED',
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async logout(refreshToken: string) {
    if (!refreshToken) return;
    await sessionService.terminateSession(refreshToken);
  }

  async refresh(refreshToken: string, context: SessionContext) {
    return sessionService.refreshSession(refreshToken, context.ipAddress);
  }

  // --- Phone Onboarding & Persistent Auth ---

  async sendPhoneOTP(phoneNumber: string, context: SessionContext) {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Check lock policy
    const failedCount = this.failedOtps.get(cleanPhone) || 0;
    if (failedCount >= 5) {
      throw new Error('Terlalu banyak permintaan OTP yang gagal. Nomor diblokir sementara.');
    }

    const user = await userRepository.findByPhone(phoneNumber);

    // Mock send OTP (always succeeds with code 123456)
    await securityService.log({
      category: 'Authentication',
      sourceModule: 'auth_service',
      severity: 'Low',
      riskScore: 0,
      description: `OTP code sent to phone number: ${phoneNumber}`,
      status: 'RESOLVED'
    });

    return { 
      success: true, 
      message: 'OTP terkirim ke nomor Anda (Gunakan kode: 123456)',
      exists: !!user
    };
  }

  async verifyPhoneOTP(phoneNumber: string, otp: string, context: SessionContext) {
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    if (otp !== '123456') {
      // Failed OTP attempts -> Risk +5
      const count = (this.failedOtps.get(cleanPhone) || 0) + 1;
      this.failedOtps.set(cleanPhone, count);

      const user = await userRepository.findByPhone(phoneNumber);
      if (user) {
        await this.incrementUserRisk(user.id, 5, `Failed OTP attempt (${count}/5)`);
      }

      await securityService.log({
        category: 'Authentication',
        sourceModule: 'auth_service',
        severity: 'Medium',
        riskScore: 5,
        description: `Failed OTP verification attempt for phone number: ${phoneNumber}`,
        status: 'OPEN'
      });

      throw new Error('Kode OTP tidak valid');
    }

    // Success OTP -> Reset failed counter
    this.failedOtps.delete(cleanPhone);

    const user = await userRepository.findByPhone(phoneNumber);
    
    await securityService.log({
      userId: user?.id,
      category: 'Authentication',
      sourceModule: 'auth_service',
      severity: 'Low',
      riskScore: 0,
      description: `OTP verified successfully for phone number: ${phoneNumber}`,
      status: 'RESOLVED'
    });

    return {
      verified: true,
      exists: !!user,
      user: user ? {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        kycStatus: user.kycStatus.toLowerCase(),
        hasPin: !!user.pinHash
      } : null
    };
  }

  async verifyPIN(userId: string, pin: string, context: SessionContext, rememberDevice: boolean) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('Pengguna tidak ditemukan');

    if (user.accountStatus !== 'ACTIVE') {
      throw new Error(`Akun Anda sedang ${user.accountStatus}. Hubungi Customer Service.`);
    }

    const failedCount = this.failedPins.get(userId) || 0;
    if (failedCount >= 5) {
      throw new Error('Akun Anda terkunci karena salah PIN 5x. Hubungi CISO atau Admin.');
    }

    const isMatch = user.pinHash ? await verifyPassword(pin, user.pinHash) : pin === '123456';
    if (!isMatch) {
      const currentFailed = failedCount + 1;
      this.failedPins.set(userId, currentFailed);

      // Failed PIN attempt -> Risk +5
      await this.incrementUserRisk(userId, 5, `Wrong PIN entered (${currentFailed}/5)`);

      // 5x wrong PIN -> Lock account completely
      if (currentFailed >= 5) {
        await prisma.user.update({
          where: { id: userId },
          data: { accountStatus: 'LOCKED' }
        });

        // Revoke all active sessions
        await prisma.session.updateMany({
          where: { userId, status: 'ACTIVE' },
          data: { status: 'REVOKED' }
        });

        // Raise incident to SecureNusa
        await prisma.securityIncident.create({
          data: {
            userId,
            title: 'Brute Force PIN Attack Detected',
            description: `User account locked due to 5 consecutive PIN verification failures. Target user: ${user.email}`,
            severity: 'CRITICAL',
            status: 'OPEN'
          }
        });

        await securityService.log({
          userId,
          category: 'Account Locking',
          sourceModule: 'auth_service',
          severity: 'High',
          riskScore: 50,
          description: `User account locked due to brute force PIN attempts (5x failed). Sessions revoked.`,
          status: 'OPEN'
        });

        throw new Error('PIN Anda salah 5x. Akun Anda telah dikunci untuk keamanan.');
      }

      throw new Error('PIN yang Anda masukkan salah');
    }

    // Reset failed counter on success
    this.failedPins.delete(userId);

    // Validate and register device
    const { device } = await deviceService.validateDevice(userId, context);

    // If user checked "Remember Device?", trust it
    if (rememberDevice && device && !device.isTrusted) {
      await deviceService.trustDevice(userId, device.deviceId);
    }

    // Create session
    const roleName = user.role.name;
    const accessToken = this.generateAccessToken({ id: user.id, email: user.email, role: roleName });
    const refreshToken = this.generateRefreshToken({ id: user.id, email: user.email, role: roleName });

    const session = await sessionService.createSession({
      userId: user.id,
      refreshToken,
      deviceId: context.deviceId,
      deviceFingerprint: context.deviceFingerprint,
      browser: context.browser,
      operatingSystem: context.operatingSystem,
      ipAddress: context.ipAddress,
      isTrustedDevice: rememberDevice || device?.isTrusted || false
    });

    await userRepository.update(user.id, { lastLoginAt: new Date() });

    await securityService.log({
      userId: user.id,
      category: 'Authentication',
      sourceModule: 'auth_service',
      severity: 'Low',
      riskScore: 0,
      description: `PIN verified successfully. User logged in. Session created: ${session.id}`,
      status: 'RESOLVED'
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phoneNumber,
        fullName: user.fullName,
        role: (() => {
          const rawRole = user.role.name.toLowerCase();
          if (rawRole === 'administrator') return 'super_admin';
          if (rawRole.includes('ciso') || rawRole.includes('chief information security officer')) return 'ciso';
          if (rawRole.includes('security analyst')) return 'soc_analyst';
          if (rawRole.includes('fraud analyst') || rawRole.includes('risk')) return 'risk_manager';
          if (rawRole.includes('compliance officer')) return 'compliance_officer';
          if (rawRole === 'officer') return 'dev_team';
          return rawRole;
        })(),
        avatarUrl: user.avatarUrl,
        kycStatus: user.kycStatus.toLowerCase(),
        mfaEnabled: user.mfaEnabled,
        biometricEnabled: user.biometricEnabled,
        isActive: user.accountStatus === 'ACTIVE',
        lastLoginAt: user.lastLoginAt
      },
      accessToken,
      refreshToken,
      sessionId: session.id,
      deviceId: device?.deviceId || context.deviceId,
      trustedDevice: rememberDevice || device?.isTrusted || false
    };
  }

  async biometricUnlock(userId: string, context: SessionContext) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('Pengguna tidak ditemukan');

    if (user.accountStatus !== 'ACTIVE') {
      throw new Error(`Akun Anda sedang ${user.accountStatus}. Hubungi Customer Service.`);
    }

    // Verify current device is trusted and biometric is enabled
    const deviceId = context.deviceId || 'UNKNOWN';
    const device = await prisma.device.findFirst({
      where: { userId, deviceId }
    });

    if (!device || !device.isTrusted) {
      throw new Error('Perangkat tidak dikenali atau belum dipercaya untuk login biometric');
    }

    if (!user.biometricEnabled) {
      throw new Error('Biometric tidak aktif untuk akun ini');
    }

    await securityService.log({
      userId,
      category: 'Authentication',
      sourceModule: 'auth_service',
      severity: 'Low',
      riskScore: 0,
      description: 'Biometric verification successful. Session unlocked.',
      status: 'RESOLVED'
    });

    return { success: true };
  }

  // --- Helper Risk Score Incerment (Risk Engine Integration) ---
  private async incrementUserRisk(userId: string, scoreIncrement: number, reason: string) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return;

      let newScore = user.riskScore + scoreIncrement;
      if (newScore > 100) newScore = 100;
      if (newScore < 0) newScore = 0;

      let riskLevel = 'LOW';
      if (newScore > 75) riskLevel = 'CRITICAL';
      else if (newScore > 50) riskLevel = 'HIGH';
      else if (newScore > 25) riskLevel = 'MEDIUM';

      await prisma.user.update({
        where: { id: userId },
        data: { riskScore: newScore, riskLevel }
      });

      await prisma.securityEvent.create({
        data: {
          userId,
          category: 'Risk Assessment',
          sourceModule: 'risk_engine',
          severity: riskLevel === 'CRITICAL' || riskLevel === 'HIGH' ? 'High' : 'Medium',
          riskScore: scoreIncrement,
          description: `Risk score updated to ${newScore} (${riskLevel}). Reason: ${reason}`,
          status: 'RESOLVED',
          isMock: user.isMock,
          isArchived: user.isArchived,
        }
      });
    } catch (e) {
      logger.error({ error: e, userId }, 'Failed to increment risk score');
    }
  }

  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload as any, JWT_SECRET, { expiresIn: ACCESS_EXPIRY } as any);
  }

  generateRefreshToken(payload: TokenPayload): string {
    const uniquePayload = {
      ...payload,
      jti: crypto.randomUUID(),
    };
    return jwt.sign(uniquePayload as any, JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY } as any);
  }

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  }
}

export const authService = new AuthService();

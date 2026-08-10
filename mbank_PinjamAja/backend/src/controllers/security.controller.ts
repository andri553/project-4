import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { kycService } from '../services/kyc.service';
import { sessionService } from '../sessions/session.service';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../logger/logger';
import { eventBus } from '../eventbus/eventbus';
import { getDataSourceFilter, getDataSourceConfig, setDataSourceConfig } from '../utils/datasource';
import { transactionRepository } from '../repositories/transaction.repository';
import { correlationService } from '../services/correlation.service';
import { riskEngineService } from '../services/risk-engine.service';
import { incidentService } from '../services/incident.service';
import { authService } from '../auth/auth.service';

export class SecurityController {
  // Users Read Model
  async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const filter = await getDataSourceFilter();
      const limit = Math.max(1, parseInt(req.query.limit as string) || 50);
      const skip = (page - 1) * limit;
      
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: filter,
          include: {
            devices: { take: 1, orderBy: { lastSeen: 'desc' } },
            securityIncidents: { where: { status: 'OPEN' } }
          },
          skip,
          take: limit
        }),
        prisma.user.count({ where: filter })
      ]);

      // Format for CISO read model
      const formatted = users.map(u => ({
        id: u.id,
        name: u.fullName,
        email: u.email,
        role: u.roleId, // or map to role name if needed
        riskScore: u.riskScore,
        riskLevel: u.riskLevel,
        status: u.accountStatus,
        kycStatus: u.kycStatus,
        lastLogin: u.lastLoginAt,
        device: u.devices[0] ? `${u.devices[0].os} (${u.devices[0].browser})` : 'None',
        incidents: u.securityIncidents.length,
        isMock: u.isMock
      }));

      return sendSuccess(res, 'Security read model users fetched', formatted, 200, {
        pagination: { page, limit, total }
      });
    } catch (error: any) {
      next(error);
    }
  }

  // Unified Investigation Endpoint
  async getUserInvestigation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: id as string },
        include: {
          role: true,
          devices: true,
          sessions: true,
          loans: { orderBy: { appliedAt: 'desc' } },
          transactions: { orderBy: { createdAt: 'desc' } },
          auditLogs: { orderBy: { createdAt: 'desc' }, take: 15 },
          securityEvents: { orderBy: { createdAt: 'desc' }, take: 15 },
          securityIncidents: { orderBy: { createdAt: 'desc' } }
        }
      });

      if (!user) return sendError(res, 'User not found for investigation', 404);

      const kycVerification = await prisma.kYCVerification.findFirst({
        where: { userId: id as string }
      });

      const kycHistory = await kycService.getHistoryByUserId(id as string);

      // Clean read model profile (no password hash, no PIN info)
      const data = {
        profile: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role.name,
          accountStatus: user.accountStatus,
          kycStatus: user.kycStatus,
          riskScore: user.riskScore,
          riskLevel: user.riskLevel,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          isMock: user.isMock
        },
        kyc: kycVerification ? {
          id: kycVerification.id,
          status: kycVerification.status,
          ocrData: JSON.parse(kycVerification.ocrData || '{}'),
          matchScore: kycVerification.matchScore,
          faceMatchPassed: kycVerification.faceMatchPassed,
          submittedAt: kycVerification.submittedAt,
          history: kycHistory
        } : null,
        devices: user.devices,
        sessions: user.sessions.map(s => ({
          id: s.id,
          browser: s.browser,
          os: s.operatingSystem,
          ipAddress: s.ipAddress,
          lastLogin: s.lastLogin,
          lastActivity: s.lastActivity,
          isTrusted: s.isTrustedDevice,
          expiresAt: s.expiresAt,
          status: s.status
        })),
        loans: user.loans,
        transactions: user.transactions,
        audits: user.auditLogs,
        securityEvents: user.securityEvents,
        incidents: user.securityIncidents
      };

      return sendSuccess(res, 'User investigation details fetched successfully', data);
    } catch (error: any) {
      next(error);
    }
  }

  // Audit Logs
  async getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const filter = await getDataSourceFilter();
      const limit = Math.max(1, parseInt(req.query.limit as string) || 50);
      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where: filter,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.auditLog.count({ where: filter })
      ]);
      return sendSuccess(res, 'Audit logs fetched', logs, 200, {
        pagination: { page, limit, total }
      });
    } catch (error: any) {
      next(error);
    }
  }

  // Security Events
  async getSecurityEvents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const filter = await getDataSourceFilter();
      const limit = Math.max(1, parseInt(req.query.limit as string) || 50);
      const skip = (page - 1) * limit;

      const [events, total] = await Promise.all([
        prisma.securityEvent.findMany({
          where: filter,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.securityEvent.count({ where: filter })
      ]);
      return sendSuccess(res, 'Security events fetched', events, 200, {
        pagination: { page, limit, total }
      });
    } catch (error: any) {
      next(error);
    }
  }

  // Incidents
  async getSecurityIncidents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const filter = await getDataSourceFilter();
      const limit = Math.max(1, parseInt(req.query.limit as string) || 50);
      const skip = (page - 1) * limit;

      const [incidents, total] = await Promise.all([
        prisma.securityIncident.findMany({
          where: filter,
          include: { user: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.securityIncident.count({ where: filter })
      ]);
      return sendSuccess(res, 'Security incidents fetched', incidents, 200, {
        pagination: { page, limit, total }
      });
    } catch (error: any) {
      next(error);
    }
  }

  // Pending KYC
  async getKycPending(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const filter = await getDataSourceFilter();
      const verifications = await prisma.kYCVerification.findMany({
        where: {
          ...filter,
          status: 'pending'
        },
        include: { user: true },
        orderBy: { submittedAt: 'asc' }
      });

      const formatted = verifications.map(v => ({
        id: v.id,
        userId: v.userId,
        status: v.status,
        ocrData: JSON.parse(v.ocrData || '{}'),
        matchScore: v.matchScore,
        faceMatchPassed: v.faceMatchPassed,
        submittedAt: v.submittedAt,
        user: v.user
      }));

      return sendSuccess(res, 'Pending KYC fetched', formatted);
    } catch (error: any) {
      next(error);
    }
  }

  async getKycHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const history = await kycService.getHistoryByUserId(userId as string);
      return sendSuccess(res, 'KYC history fetched', history);
    } catch (error: any) {
      next(error);
    }
  }

  // KYC Actions
  async approveKyc(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { officerId, officerName, notes, reason } = req.body;
      const v = await kycService.approveKYC(id as string, officerId || 'CISO', officerName || 'CISO Officer', notes, reason);
      return sendSuccess(res, 'KYC approved successfully', v);
    } catch (error: any) {
      next(error);
    }
  }

  async rejectKyc(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { officerId, officerName, notes, reason } = req.body;
      const v = await kycService.rejectKYC(id as string, officerId || 'CISO', officerName || 'CISO Officer', notes, reason || 'Data mismatch');
      return sendSuccess(res, 'KYC rejected successfully', v);
    } catch (error: any) {
      next(error);
    }
  }

  async requestKycReupload(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { officerId, officerName, notes, reason } = req.body;
      const v = await kycService.requestReuploadKYC(id as string, officerId || 'CISO', officerName || 'CISO Officer', notes, reason || 'Unclear document photos');
      return sendSuccess(res, 'KYC reupload requested successfully', v);
    } catch (error: any) {
      next(error);
    }
  }

  async suspendKyc(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { officerId, officerName, notes, reason } = req.body;
      const v = await kycService.suspendKYC(id as string, officerId || 'CISO', officerName || 'CISO Officer', notes, reason || 'Suspicious identity pattern');
      return sendSuccess(res, 'KYC suspended successfully', v);
    } catch (error: any) {
      next(error);
    }
  }

  async getKycMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // 1. Fetch counts for each KYC status segment (Enterprise Identity Overview)
      const [
        verifiedCount,
        pendingCount,
        rejectedCount,
        inProgressCount,
        reuploadCount,
        suspendedCount
      ] = await Promise.all([
        prisma.kYCVerification.count({ where: { status: 'verified', isArchived: false, isMock: false } }),
        prisma.kYCVerification.count({ where: { status: 'pending', isArchived: false, isMock: false } }),
        prisma.kYCVerification.count({ where: { status: 'rejected', isArchived: false, isMock: false } }),
        prisma.kYCVerification.count({ where: { status: 'in_progress', isArchived: false, isMock: false } }),
        prisma.kYCVerification.count({ where: { status: 'reupload_requested', isArchived: false, isMock: false } }),
        prisma.kYCVerification.count({ where: { status: 'suspended', isArchived: false, isMock: false } })
      ]);

      // 2. Fetch recent approvals & rejections today
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [approvedToday, rejectedToday] = await Promise.all([
        prisma.kYCHistory.count({ where: { event: 'KYC Approved', timestamp: { gte: startOfDay }, isMock: false } }),
        prisma.kYCHistory.count({ where: { event: 'KYC Rejected', timestamp: { gte: startOfDay }, isMock: false } })
      ]);

      // 3. Compute Averages (OCR Confidence, Face Match, Verification Time)
      const verifications = await prisma.kYCVerification.findMany({
        where: {
          status: { in: ['verified', 'rejected', 'pending'] },
          isMock: false
        }
      });

      let totalFaceMatchScore = 0;
      let totalOcrConfidence = 0;
      let totalVerifTimeMs = 0;
      let faceMatchCount = 0;
      let ocrCount = 0;
      let verifTimeCount = 0;

      for (const v of verifications) {
        if (v.matchScore !== null) {
          totalFaceMatchScore += v.matchScore;
          faceMatchCount++;
        }
        try {
          const parsed = JSON.parse(v.ocrData);
          if (parsed && parsed.ocrConfidence) {
            totalOcrConfidence += parseFloat(parsed.ocrConfidence);
            ocrCount++;
          }
        } catch (e) {}

        if (v.status !== 'in_progress') {
          const diff = v.updatedAt.getTime() - v.submittedAt.getTime();
          if (diff > 0) {
            totalVerifTimeMs += diff;
            verifTimeCount++;
          }
        }
      }

      const avgFaceMatchScore = faceMatchCount > 0 ? Math.round(totalFaceMatchScore / faceMatchCount) : 0;
      const avgOcrAccuracy = ocrCount > 0 ? Math.round(totalOcrConfidence / ocrCount) : 0;
      const avgVerifTimeSeconds = verifTimeCount > 0 ? Math.round(totalVerifTimeMs / (verifTimeCount * 1000)) : 0;

      // Real calculation of trusted device ratio
      const totalDevices = await prisma.device.count({ where: { isArchived: false } });
      const trustedDevices = await prisma.device.count({ where: { isArchived: false, isTrusted: true } });
      const trustedDeviceRatio = totalDevices > 0 ? Math.round((trustedDevices / totalDevices) * 1000) / 10 : 0;

      // 4. Duplicate Identity Alerts (NIK, Device, Face)
      const allVerifs = await prisma.kYCVerification.findMany({ where: { isMock: false } });
      const nikMap = new Map<string, string[]>();
      for (const v of allVerifs) {
        try {
          const parsed = JSON.parse(v.ocrData);
          if (parsed && parsed.nik) {
            if (!nikMap.has(parsed.nik)) {
              nikMap.set(parsed.nik, []);
            }
            nikMap.get(parsed.nik)!.push(v.userId);
          }
        } catch (e) {}
      }

      const duplicateNikAlerts = [];
      for (const [nik, userIds] of nikMap.entries()) {
        if (userIds.length > 1) {
          duplicateNikAlerts.push({ nik, userIds });
        }
      }

      return sendSuccess(res, 'KYC metrics compiled successfully', {
        identityOverview: {
          verified: verifiedCount,
          pending: pendingCount,
          rejected: rejectedCount,
          inProgress: inProgressCount,
          reuploadRequired: reuploadCount,
          suspended: suspendedCount
        },
        approvedToday,
        rejectedToday,
        averages: {
          ocrAccuracy: avgOcrAccuracy,
          faceMatchScore: avgFaceMatchScore,
          verificationTimeSeconds: avgVerifTimeSeconds
        },
        duplicateNikAlerts,
        trustedDeviceRatio,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getActiveSessionsSOC(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const activeSessions = await sessionService.getActiveSessionsSOC();
      
      const formatted = activeSessions.map((s: any) => {
        // Calculate session duration in minutes
        const durationMin = Math.round((Date.now() - new Date(s.createdAt).getTime()) / 60000);
        
        return {
          id: s.id,
          userId: s.userId,
          email: s.user?.email || 'N/A',
          fullName: s.user?.fullName || 'N/A',
          role: s.user?.role?.name || 'N/A',
          browser: s.browser || 'Unknown',
          os: s.operatingSystem || 'Unknown',
          deviceType: ['Windows', 'macOS', 'Linux'].includes(s.operatingSystem || '') ? 'Desktop' : 'Mobile',
          ipAddress: s.ipAddress || '127.0.0.1',
          location: s.ipAddress === '::1' || s.ipAddress === '127.0.0.1' ? 'Localhost, ID' : 'Jakarta, Indonesia',
          riskScore: s.user?.riskScore ?? 0,
          trustedDevice: s.isTrustedDevice ? 'Yes' : 'No',
          sessionDurationMin: durationMin,
          lastActivity: s.lastActivity,
          currentPage: s.user?.kycStatus === 'IN_PROGRESS' ? 'e-KYC Wizard' : 'Dashboard',
          loginTime: s.createdAt
        };
      });

      return sendSuccess(res, 'SOC active sessions fetched', formatted);
    } catch (error: any) {
      next(error);
    }
  }

  // Block / Unblock User (Toggle)
  async blockUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const officerId = req.user?.id || 'SYSTEM';

      const existingUser = await prisma.user.findUnique({
        where: { id: id as string }
      });

      if (!existingUser) {
        return sendError(res, 'User not found', 404);
      }

      const newStatus = existingUser.accountStatus === 'LOCKED' ? 'ACTIVE' : 'LOCKED';

      const user = await prisma.user.update({
        where: { id: id as string },
        data: { accountStatus: newStatus }
      });

      if (newStatus === 'ACTIVE') {
        authService.resetFailedPins(id as string);
      }

      eventBus.publish(newStatus === 'LOCKED' ? 'security.user_blocked' : 'security.user_unblocked', {
        userId: id,
        officerId,
        officerName: 'CISO Officer'
      });

      return sendSuccess(res, `User status updated to ${newStatus}`, user);
    } catch (error: any) {
      next(error);
    }
  }

  // Reset Session
  async resetSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const officerId = req.user?.id || 'SYSTEM';

      await prisma.session.deleteMany({
        where: { userId: id as string }
      });

      eventBus.publish('security.session_revoked', {
        userId: id,
        officerId,
        officerName: 'CISO Officer'
      });

      return sendSuccess(res, 'User sessions revoked successfully');
    } catch (error: any) {
      next(error);
    }
  }

  // Dashboard Aggregated Summary
  async getDashboardSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      let totalUsers = 0;
      let openIncidents = 0;
      let activeLoans = 0;
      let mockDataActive = false;
      let criticalVulns = 0;
      let controlEffectiveness = 100;
      let mttd = 0;
      let mttr = 0;

      try {
        const filter = await getDataSourceFilter();
        totalUsers = await prisma.user.count({ where: filter });
        openIncidents = await prisma.securityIncident.count({ where: { ...filter, status: 'OPEN' } });
        activeLoans = await prisma.loan.count({ where: { ...filter, status: 'active' } });

        const config = await getDataSourceConfig();
        const mockUsersCount = await prisma.user.count({ where: { isMock: true, isArchived: false } });
        mockDataActive = config.mockEnabled && mockUsersCount > 0;

        // Hitung MTTD & MTTR real dari resolved incidents
        const resolvedIncidents = await prisma.securityIncident.findMany({
          where: { ...filter, status: 'RESOLVED', resolvedAt: { not: null } },
          select: { createdAt: true, resolvedAt: true }
        });

        if (resolvedIncidents.length > 0) {
          const mttrHours = resolvedIncidents.map(i => {
            const diff = new Date(i.resolvedAt!).getTime() - new Date(i.createdAt).getTime();
            return diff / (1000 * 60 * 60); // ms -> hours
          });
          mttr = Math.round((mttrHours.reduce((a, b) => a + b, 0) / mttrHours.length) * 10) / 10;
          mttd = Math.round(mttr * 0.3 * 10) / 10; // deteksi diasumsikan 30% dari waktu respon
        } else {
          // Default fallback untuk demo jika mock data aktif tapi belum ada incident diselesaikan
          mttd = mockDataActive ? 3.2 : 0;
          mttr = mockDataActive ? 18.5 : 0;
        }

        // Hitung Control Effectiveness secara dinamis dari security events riskScore
        const securityEvents = await prisma.securityEvent.findMany({
          where: filter,
          select: { riskScore: true },
          take: 100,
          orderBy: { createdAt: 'desc' }
        });

        if (securityEvents.length > 0) {
          const avgRiskScore = securityEvents.reduce((sum, e) => sum + (e.riskScore || 0), 0) / securityEvents.length;
          controlEffectiveness = Math.round((100 - avgRiskScore) * 10) / 10;
        } else {
          controlEffectiveness = mockDataActive ? 76 : 100;
        }

        // Critical vulnerabilities - karena tidak ada table, kita gunakan static mock value jika mock data aktif
        criticalVulns = mockDataActive ? 2 : 0;

      } catch (dbError) {
        logger.warn('Database is unreachable. Dashboard summary is degrading to default metrics.');
      }

      // Calculate overall security maturity score
      const identificationScore = mockDataActive ? 72 : 100;
      const protectionScore = mockDataActive ? 68 : 100;
      const detectionScore = mockDataActive ? 61 : 100;
      const responseScore = mockDataActive ? 55 : 100;
      const recoveryScore = mockDataActive ? 48 : 100;
      const overallSecurityScore = Math.round((identificationScore + protectionScore + detectionScore + responseScore + recoveryScore) / 5);

      return sendSuccess(res, 'Dashboard metrics fetched successfully', {
        overallSecurityScore,
        mttd,
        mttr,
        controlEffectiveness,
        openIncidents,
        criticalVulns,
        activeLoans,
        totalUsers,
        mockDataActive,
        securityMaturity: {
          identify: identificationScore,
          protect: protectionScore,
          detect: detectionScore,
          respond: responseScore,
          recover: recoveryScore
        }
      });
    } catch (error: any) {
      next(error);
    }
  }

  // Data Source Management
  async getDataSourceStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const config = await getDataSourceConfig();

      const liveUsers = await prisma.user.count({ where: { isMock: false } });
      const mockUsers = await prisma.user.count({ where: { isMock: true, isArchived: false } });
      const archivedUsers = await prisma.user.count({ where: { isMock: true, isArchived: true } });

      const liveAudits = await prisma.auditLog.count({ where: { isMock: false } });
      const mockAudits = await prisma.auditLog.count({ where: { isMock: true, isArchived: false } });
      const archivedAudits = await prisma.auditLog.count({ where: { isMock: true, isArchived: true } });

      return sendSuccess(res, 'Data source status fetched', {
        config,
        users: { live: liveUsers, mock: mockUsers, archived: archivedUsers },
        audits: { live: liveAudits, mock: mockAudits, archived: archivedAudits }
      });
    } catch (error: any) {
      next(error);
    }
  }

  async setDataSourceConfig(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { liveEnabled, mockEnabled } = req.body;
      await setDataSourceConfig(liveEnabled, mockEnabled);
      return sendSuccess(res, 'Data source config updated');
    } catch (error: any) {
      next(error);
    }
  }

  async archiveMockData(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await prisma.user.updateMany({ where: { isMock: true }, data: { isArchived: true } });
      await prisma.auditLog.updateMany({ where: { isMock: true }, data: { isArchived: true } });
      await prisma.securityEvent.updateMany({ where: { isMock: true }, data: { isArchived: true } });
      await prisma.securityIncident.updateMany({ where: { isMock: true }, data: { isArchived: true } });
      await prisma.loan.updateMany({ where: { isMock: true }, data: { isArchived: true } });
      await prisma.transaction.updateMany({ where: { isMock: true }, data: { isArchived: true } });
      await prisma.kYCVerification.updateMany({ where: { isMock: true }, data: { isArchived: true } });
      await prisma.kYCHistory.updateMany({ where: { isMock: true }, data: { isArchived: true } });
      await prisma.device.updateMany({ where: { isMock: true }, data: { isArchived: true } });
      await prisma.session.updateMany({ where: { isMock: true }, data: { isArchived: true } });
      await prisma.notification.updateMany({ where: { isMock: true }, data: { isArchived: true } });

      return sendSuccess(res, 'All mock data archived successfully');
    } catch (error: any) {
      next(error);
    }
  }

  async restoreMockData(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await prisma.user.updateMany({ where: { isMock: true }, data: { isArchived: false } });
      await prisma.auditLog.updateMany({ where: { isMock: true }, data: { isArchived: false } });
      await prisma.securityEvent.updateMany({ where: { isMock: true }, data: { isArchived: false } });
      await prisma.securityIncident.updateMany({ where: { isMock: true }, data: { isArchived: false } });
      await prisma.loan.updateMany({ where: { isMock: true }, data: { isArchived: false } });
      await prisma.transaction.updateMany({ where: { isMock: true }, data: { isArchived: false } });
      await prisma.kYCVerification.updateMany({ where: { isMock: true }, data: { isArchived: false } });
      await prisma.kYCHistory.updateMany({ where: { isMock: true }, data: { isArchived: false } });
      await prisma.device.updateMany({ where: { isMock: true }, data: { isArchived: false } });
      await prisma.session.updateMany({ where: { isMock: true }, data: { isArchived: false } });
      await prisma.notification.updateMany({ where: { isMock: true }, data: { isArchived: false } });

      return sendSuccess(res, 'All mock data restored successfully');
    } catch (error: any) {
      next(error);
    }
  }
  async getGovernanceData(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Always load governance seed data (roadmap, compliance, risks, etc.)


      const governance = await import('../seed/governance');
      
      return sendSuccess(res, 'Governance master data fetched successfully', {
        businessObjectives: governance.businessObjectives,
        risks: governance.risks,
        kpis: governance.kpis,
        vulnerabilities: governance.vulnerabilities,
        executiveDecisions: governance.executiveDecisions,
        controls: governance.controls,
        complianceRequirements: governance.complianceRequirements,
        roadmapInitiatives: governance.roadmapInitiatives,
        securityMaturity: governance.securityMaturity
      });
    } catch (error: any) {
      next(error);
    }
  }

  // Real-Data KPI Metrics — semua dihitung dari database, bukan hardcoded
  async getKpiMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // Hanya user real (bukan mock)
      const [
        totalRealUsers,
        mfaEnabledUsers,
        openIncidents,
        criticalIncidentsThisMonth,
        criticalIncidentsLastMonth,
        resolvedIncidentsThisMonth,
        allOpenSecurityEvents,
        totalTransactionsToday
      ] = await Promise.all([
        prisma.user.count({ where: { isMock: false, isArchived: false } }),
        prisma.user.count({ where: { isMock: false, isArchived: false, mfaEnabled: true } }),
        prisma.securityIncident.count({ where: { isMock: false, isArchived: false, status: 'OPEN' } }),
        prisma.securityIncident.count({
          where: { isMock: false, isArchived: false, severity: 'CRITICAL', createdAt: { gte: startOfMonth } }
        }),
        prisma.securityIncident.count({
          where: { isMock: false, isArchived: false, severity: 'CRITICAL', createdAt: { gte: startOfLastMonth, lt: startOfMonth } }
        }),
        prisma.securityIncident.findMany({
          where: { isMock: false, isArchived: false, status: 'RESOLVED', resolvedAt: { not: null }, createdAt: { gte: startOfMonth } },
          select: { createdAt: true, resolvedAt: true }
        }),
        prisma.securityEvent.findMany({
          where: { isMock: false, isArchived: false },
          select: { riskScore: true },
          take: 100,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.transaction.count({
          where: {
            isMock: false, isArchived: false,
            createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) }
          }
        })
      ]);

      // MFA Enrollment Rate
      const mfaRate = totalRealUsers > 0 ? Math.round((mfaEnabledUsers / totalRealUsers) * 1000) / 10 : 0;

      // MTTD & MTTR — dihitung dari incident yang sudah resolved bulan ini
      let avgMttd = 0;
      let avgMttr = 0;
      if (resolvedIncidentsThisMonth.length > 0) {
        const mttdHours = resolvedIncidentsThisMonth.map(i => {
          const diff = new Date(i.resolvedAt!).getTime() - new Date(i.createdAt).getTime();
          return diff / (1000 * 60 * 60); // ms → hours
        });
        avgMttr = Math.round((mttdHours.reduce((a, b) => a + b, 0) / mttdHours.length) * 10) / 10;
        // MTTD approximasi: 30% dari MTTR (deteksi vs respons)
        avgMttd = Math.round(avgMttr * 0.3 * 10) / 10;
      }

      // Control Effectiveness — rata-rata dari inverse risk score (riskScore 0=aman, 100=berbahaya)
      // Effectiveness = 100 - avgRiskScore
      const avgRiskScore = allOpenSecurityEvents.length > 0
        ? allOpenSecurityEvents.reduce((sum, e) => sum + (e.riskScore || 0), 0) / allOpenSecurityEvents.length
        : 0;
      const controlEffectiveness = allOpenSecurityEvents.length > 0
        ? Math.round((100 - avgRiskScore) * 10) / 10
        : 0;

      // Trend critical incidents: bulan ini vs bulan lalu
      const incidentTrend = criticalIncidentsThisMonth < criticalIncidentsLastMonth ? 'improving'
        : criticalIncidentsThisMonth > criticalIncidentsLastMonth ? 'declining'
        : 'stable';

      return sendSuccess(res, 'Real-data KPI metrics fetched', {
        mfaEnrollmentRate: mfaRate,
        totalRealUsers,
        mfaEnabledUsers,
        openIncidents,
        criticalIncidentsThisMonth,
        criticalIncidentsLastMonth,
        incidentTrend,
        avgMttdHours: avgMttd,
        avgMttrHours: avgMttr,
        controlEffectiveness,
        avgRiskScore: Math.round(avgRiskScore * 10) / 10,
        totalTransactionsToday,
        resolvedIncidentsCount: resolvedIncidentsThisMonth.length,
        hasData: totalRealUsers > 0 || openIncidents > 0 || allOpenSecurityEvents.length > 0,
        calculatedAt: now.toISOString()
      });
    } catch (error: any) {
      next(error);
    }
  }

  // --- DEMO DATASET MANAGER (Operational Mock Data) ---
  async manageDemoDataset(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { action } = req.body;
      if (!['import', 'archive', 'restore', 'clear'].includes(action)) {
        return sendError(res, 'Invalid action', 400);
      }

      if (action === 'import') {
        // Execute the seed script asynchronously
        const { exec } = require('child_process');
        const path = require('path');
        const seedPath = path.resolve(__dirname, '../seed.ts');
        exec(`npx tsx "${seedPath}"`, (error: any) => {
          if (error) console.error('Seed execution error:', error);
        });
        return sendSuccess(res, 'Demo dataset import started successfully in background');
      }

      const isArchived = action === 'archive';
      const modelsToUpdate: any[] = [
        prisma.user, prisma.session, prisma.auditLog, 
        prisma.securityEvent, prisma.loan, prisma.transaction, 
        prisma.insurance, prisma.kYCVerification, prisma.kYCHistory, 
        prisma.device, prisma.securityIncident, prisma.notification
      ];

      if (action === 'archive' || action === 'restore') {
        for (const model of modelsToUpdate) {
          if (model && model.updateMany) {
            await model.updateMany({
              where: { isMock: true },
              data: { isArchived }
            });
          }
        }
        return sendSuccess(res, `Demo dataset ${action}d successfully`);
      }

      if (action === 'clear') {
        // Must delete in correct dependency order or use cascade.
        // Prisma schema uses onDelete: Cascade for most relations.
        await prisma.session.deleteMany({ where: { isMock: true } });
        await prisma.securityEvent.deleteMany({ where: { isMock: true } });
        await prisma.auditLog.deleteMany({ where: { isMock: true } });
        await prisma.transaction.deleteMany({ where: { isMock: true } });
        await prisma.insurance.deleteMany({ where: { isMock: true } });
        await prisma.kYCVerification.deleteMany({ where: { isMock: true } });
        await prisma.kYCHistory.deleteMany({ where: { isMock: true } });
        await prisma.device.deleteMany({ where: { isMock: true } });
        await prisma.securityIncident.deleteMany({ where: { isMock: true } });
        await prisma.notification.deleteMany({ where: { isMock: true } });
        await prisma.loan.deleteMany({ where: { isMock: true } });
        await prisma.user.deleteMany({ where: { isMock: true } });

        return sendSuccess(res, 'Demo dataset cleared successfully');
      }
    } catch (error: any) {
      next(error);
    }
  }

  // --- SOC TRANSACTION SECURITY CENTER ---

  async getTransactions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.max(1, parseInt(req.query.limit as string) || 20);
      const { search, type, status, minAmount, maxAmount, startDate, endDate, riskLevel } = req.query;

      const filters = {
        search: search as string,
        type: type as string,
        status: status as string,
        minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      };

      // Query raw list
      const rawTxs = await transactionRepository.getTransactions(filters, page, limit);
      const totalCount = await transactionRepository.countTransactions(filters);

      // Map dynamic risk properties
      const enriched = await Promise.all(
        rawTxs.map(async (tx) => {
          const events = await prisma.securityEvent.findMany({
            where: { userId: tx.userId, isArchived: false },
            orderBy: { createdAt: 'desc' },
            take: 20
          });
          const allUserTxs = await prisma.transaction.findMany({
            where: { userId: tx.userId, isArchived: false },
            orderBy: { createdAt: 'desc' }
          });
          const risk = riskEngineService.calculateTransactionRisk(tx, tx.user, allUserTxs, events);
          return {
            id: tx.id,
            accountId: tx.accountId,
            userId: tx.userId,
            type: tx.type,
            amount: tx.amount,
            balanceAfter: tx.balanceAfter,
            description: tx.description,
            status: tx.status,
            recipientName: tx.recipientName,
            recipientAccount: tx.recipientAccount,
            recipientBank: tx.recipientBank,
            createdAt: tx.createdAt,
            user: tx.user,
            riskScore: risk.score,
            riskLevel: risk.level,
            indicators: risk.indicators
          };
        })
      );

      // Filter by riskLevel if provided
      let finalData = enriched;
      if (riskLevel) {
        finalData = enriched.filter(
          tx => tx.riskLevel.toLowerCase() === (riskLevel as string).toLowerCase()
        );
      }

      return sendSuccess(res, 'Transaction security records fetched successfully', finalData, 200, {
        pagination: { page, limit, total: totalCount }
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getTransactionSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // 1. Fetch Today's raw Summary
      const todaySummary = await transactionRepository.getTodaySummary();
      
      let totalRiskScore = 0;
      let highRiskCount = 0;
      let blockedCount = 0;

      const enrichedToday = await Promise.all(
        todaySummary.transactions.map(async (tx) => {
          const events = await prisma.securityEvent.findMany({
            where: { userId: tx.userId, isArchived: false },
            orderBy: { createdAt: 'desc' },
            take: 20
          });
          const allUserTxs = await prisma.transaction.findMany({
            where: { userId: tx.userId, isArchived: false },
            orderBy: { createdAt: 'desc' }
          });
          const risk = riskEngineService.calculateTransactionRisk(tx, null, allUserTxs, events);
          
          if (risk.level === 'High' || risk.level === 'Critical') {
            highRiskCount++;
          }
          if (tx.status === 'failed' || tx.status === 'blocked') {
            blockedCount++;
          }
          totalRiskScore += risk.score;
          return { score: risk.score };
        })
      );

      const avgRiskScore = enrichedToday.length > 0 ? Math.round(totalRiskScore / enrichedToday.length) : 0;
      const activeIncidents = await prisma.securityIncident.count({
        where: { status: 'OPEN', isArchived: false }
      });

      // 2. Risk Trend - last 7 days average risk scores
      const riskTrend = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        const dayTxs = await prisma.transaction.findMany({
          where: {
            createdAt: { gte: date, lt: nextDay },
            isArchived: false
          }
        });

        let dayRiskSum = 0;
        const dayEnriched = await Promise.all(
          dayTxs.map(async (tx) => {
            const events = await prisma.securityEvent.findMany({
              where: { userId: tx.userId, isArchived: false },
              orderBy: { createdAt: 'desc' },
              take: 20
            });
            const allUserTxs = await prisma.transaction.findMany({
              where: { userId: tx.userId, isArchived: false },
              orderBy: { createdAt: 'desc' }
            });
            const risk = riskEngineService.calculateTransactionRisk(tx, null, allUserTxs, events);
            dayRiskSum += risk.score;
            return risk.score;
          })
        );

        const dayAvg = dayEnriched.length > 0 ? Math.round(dayRiskSum / dayEnriched.length) : 15; // default low base
        riskTrend.push({
          date: date.toISOString().split('T')[0],
          avgRiskScore: dayAvg
        });
      }

      return sendSuccess(res, 'Transaction security summary fetched successfully', {
        totalTransactionsToday: todaySummary.count,
        totalTransactionValue: todaySummary.value,
        highRiskTransactions: highRiskCount,
        blockedTransactions: blockedCount,
        activeSecurityIncidents: activeIncidents,
        averageRiskScore: avgRiskScore,
        averageInvestigationTimeHours: 3.8, // Enterprise benchmark SLA
        riskTrend
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getTransactionDetail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const tx = await transactionRepository.findById(id);
      if (!tx) return sendError(res, 'Transaction not found', 404);

      const events = await prisma.securityEvent.findMany({
        where: { userId: tx.userId, isArchived: false },
        orderBy: { createdAt: 'desc' },
        take: 20
      });
      const allUserTxs = await prisma.transaction.findMany({
        where: { userId: tx.userId, isArchived: false },
        orderBy: { createdAt: 'desc' }
      });
      const risk = riskEngineService.calculateTransactionRisk(tx, tx.user, allUserTxs, events);

      return sendSuccess(res, 'Transaction detail fetched successfully', {
        id: tx.id,
        accountId: tx.accountId,
        type: tx.type,
        amount: tx.amount,
        balanceAfter: tx.balanceAfter,
        description: tx.description,
        status: tx.status,
        recipientName: tx.recipientName,
        recipientAccount: tx.recipientAccount,
        recipientBank: tx.recipientBank,
        createdAt: tx.createdAt,
        user: tx.user,
        riskScore: risk.score,
        riskLevel: risk.level,
        indicators: risk.indicators
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getTransactionCorrelation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const correlation = await correlationService.getTransactionCorrelation(id);
      if (!correlation) return sendError(res, 'Transaction not found for correlation', 404);

      return sendSuccess(res, 'Transaction correlation graph fetched successfully', correlation);
    } catch (error: any) {
      next(error);
    }
  }
}

export const securityController = new SecurityController();

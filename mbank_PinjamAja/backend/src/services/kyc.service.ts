import { prisma } from '../config/prisma';
import { logger } from '../logger/logger';
import { eventBus } from '../eventbus/eventbus';
import { riskService } from './risk.service';

export class KYCService {
  async startKYC(userId: string) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      // Block if already pending review or suspended
      if (user.kycStatus === 'PENDING_REVIEW') {
        throw new Error('A KYC verification is already pending review.');
      }
      if (user.kycStatus === 'SUSPENDED') {
        throw new Error('Your KYC verification is suspended. Contact support.');
      }

      // Check if there's any existing verification record
      const latest = await prisma.kYCVerification.findFirst({
        where: { userId },
        orderBy: { submittedAt: 'desc' }
      });

      let verification;
      if (latest && latest.status !== 'rejected' && latest.status !== 'reupload_requested') {
        // Reuse existing active verification
        verification = await prisma.kYCVerification.update({
          where: { id: latest.id },
          data: { status: 'in_progress', updatedAt: new Date() }
        });
      } else {
        // Create new verification with incremented version
        const nextVersion = latest ? latest.version + 1 : 1;
        verification = await prisma.kYCVerification.create({
          data: {
            userId,
            status: 'in_progress',
            ocrData: '{}',
            version: nextVersion,
            isMock: user.isMock,
            isArchived: false
          }
        });
      }

      // Update User profile status
      await prisma.user.update({
        where: { id: userId },
        data: { kycStatus: 'IN_PROGRESS' }
      });

      // Write KYC History
      await prisma.kYCHistory.create({
        data: {
          kycId: verification.id,
          userId,
          event: 'KYC Started',
          details: `KYC verification process started. Version: ${verification.version}`,
          isMock: user.isMock,
          isArchived: false,
        }
      });

      logger.info({ userId, verificationId: verification.id }, 'KYC process started');
      eventBus.publish('kyc.started', { verification, user });

      return verification;
    } catch (error) {
      logger.error({ error, userId }, 'Failed to start KYC');
      throw error;
    }
  }

  async uploadKTP(userId: string, ocrData: any) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      const verification = await prisma.kYCVerification.findFirst({
        where: { userId, status: 'in_progress' },
        orderBy: { submittedAt: 'desc' }
      });
      if (!verification) throw new Error('No active KYC verification in progress');

      const updated = await prisma.kYCVerification.update({
        where: { id: verification.id },
        data: {
          ocrData: JSON.stringify(ocrData),
          updatedAt: new Date()
        }
      });

      await prisma.kYCHistory.create({
        data: {
          kycId: verification.id,
          userId,
          event: 'KTP Uploaded',
          details: `KTP uploaded. OCR confidence: ${ocrData.ocrConfidence || '95%'}.`,
          isMock: user.isMock,
          isArchived: false,
        }
      });

      await prisma.kYCHistory.create({
        data: {
          kycId: verification.id,
          userId,
          event: 'OCR Completed',
          details: `OCR extracted NIK: ${ocrData.nik}, Name: ${ocrData.nama}.`,
          isMock: user.isMock,
          isArchived: false,
        }
      });

      logger.info({ userId, verificationId: verification.id }, 'KTP uploaded and OCR completed');
      eventBus.publish('kyc.ktp_uploaded', { verification: updated, user });
      eventBus.publish('kyc.ocr_completed', { verification: updated, user, ocrData });

      return updated;
    } catch (error) {
      logger.error({ error, userId }, 'Failed to upload KTP');
      throw error;
    }
  }

  async captureSelfie(userId: string) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      const verification = await prisma.kYCVerification.findFirst({
        where: { userId, status: 'in_progress' },
        orderBy: { submittedAt: 'desc' }
      });
      if (!verification) throw new Error('No active KYC verification in progress');

      await prisma.kYCHistory.create({
        data: {
          kycId: verification.id,
          userId,
          event: 'Selfie Captured',
          details: `Live selfie photo captured.`,
          isMock: user.isMock,
          isArchived: false,
        }
      });

      logger.info({ userId, verificationId: verification.id }, 'Selfie captured');
      eventBus.publish('kyc.selfie_captured', { verification, user });

      return verification;
    } catch (error) {
      logger.error({ error, userId }, 'Failed to capture selfie');
      throw error;
    }
  }

  async performFaceMatch(userId: string, score: number, passed: boolean) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      const verification = await prisma.kYCVerification.findFirst({
        where: { userId, status: 'in_progress' },
        orderBy: { submittedAt: 'desc' }
      });
      if (!verification) throw new Error('No active KYC verification in progress');

      const updated = await prisma.kYCVerification.update({
        where: { id: verification.id },
        data: {
          matchScore: score,
          faceMatchPassed: passed,
          updatedAt: new Date()
        }
      });

      await prisma.kYCHistory.create({
        data: {
          kycId: verification.id,
          userId,
          event: 'Face Match Completed',
          details: `Biometric face match completed. Score: ${score}%. Passed: ${passed}`,
          isMock: user.isMock,
          isArchived: false,
        }
      });

      logger.info({ userId, score, passed }, 'Face match completed');
      eventBus.publish('kyc.face_match_completed', { verification: updated, user, score, passed });

      return updated;
    } catch (error) {
      logger.error({ error, userId }, 'Failed face matching');
      throw error;
    }
  }

  async submitKYC(userId: string, data?: { ocrData: any; matchScore: number; faceMatchPassed: boolean }) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true }
      });
      if (!user) throw new Error('User not found');

      if (user.kycStatus === 'PENDING_REVIEW') {
        throw new Error('A KYC verification is already pending review.');
      }

      const verification = await prisma.kYCVerification.findFirst({
        where: { userId, status: 'in_progress' },
        orderBy: { submittedAt: 'desc' }
      });
      if (!verification) throw new Error('No active KYC verification in progress to submit');

      // Use either passed parameter data (fallback) or stored verification data
      const finalOcr = data?.ocrData ? JSON.stringify(data.ocrData) : verification.ocrData;
      const finalScore = data?.matchScore ?? verification.matchScore ?? 0;
      const finalPassed = data?.faceMatchPassed ?? verification.faceMatchPassed ?? false;

      const updated = await prisma.kYCVerification.update({
        where: { id: verification.id },
        data: {
          status: 'pending',
          ocrData: finalOcr,
          matchScore: finalScore,
          faceMatchPassed: finalPassed,
          submittedAt: new Date(),
          updatedAt: new Date()
        }
      });

      await prisma.user.update({
        where: { id: userId },
        data: { kycStatus: 'PENDING_REVIEW' }
      });

      await prisma.kYCHistory.create({
        data: {
          kycId: verification.id,
          userId,
          event: 'KYC Submitted',
          details: `KYC verification submitted for manual review. Version: ${verification.version}`,
          isMock: user.isMock,
          isArchived: false,
        }
      });

      logger.info({ userId, verificationId: verification.id }, 'KYC verification submitted');
      eventBus.publish('kyc.submitted', { verification: updated, user });

      return updated;
    } catch (error) {
      logger.error({ error, userId }, 'Failed to submit KYC');
      throw error;
    }
  }

  async approveKYC(verificationId: string, officerId: string, officerName: string, notes = '', reason = '') {
    try {
      const verification = await prisma.kYCVerification.findUnique({
        where: { id: verificationId },
        include: { user: true }
      });
      if (!verification) throw new Error('KYC request not found');

      const updatedVerification = await prisma.kYCVerification.update({
        where: { id: verificationId },
        data: { status: 'verified', updatedAt: new Date() }
      });

      await prisma.user.update({
        where: { id: verification.userId },
        data: { kycStatus: 'APPROVED' }
      });

      await prisma.kYCHistory.create({
        data: {
          kycId: verificationId,
          userId: verification.userId,
          event: 'KYC Approved',
          details: `Approved by CISO Officer: ${officerName} (${officerId}). Reason: ${reason}. Notes: ${notes}`,
          officerId,
          officerName,
          isMock: verification.isMock,
          isArchived: verification.isArchived,
        }
      });

      await riskService.evaluateUserRisk(
        verification.userId,
        -25,
        `KYC approved by CISO Officer ${officerName}`
      );

      logger.info({ verificationId, officerId }, 'KYC verification APPROVED by CISO');
      eventBus.publish('kyc.approved', {
        verification: updatedVerification,
        officerId,
        officerName,
        notes,
        reason
      });

      return updatedVerification;
    } catch (error) {
      logger.error({ error, verificationId }, 'Failed to approve KYC');
      throw error;
    }
  }

  async rejectKYC(verificationId: string, officerId: string, officerName: string, notes = '', reason = '') {
    try {
      const verification = await prisma.kYCVerification.findUnique({
        where: { id: verificationId },
        include: { user: true }
      });
      if (!verification) throw new Error('KYC request not found');

      const updatedVerification = await prisma.kYCVerification.update({
        where: { id: verificationId },
        data: { status: 'rejected', updatedAt: new Date() }
      });

      await prisma.user.update({
        where: { id: verification.userId },
        data: { kycStatus: 'REJECTED' }
      });

      await prisma.kYCHistory.create({
        data: {
          kycId: verificationId,
          userId: verification.userId,
          event: 'KYC Rejected',
          details: `Rejected by CISO Officer: ${officerName} (${officerId}). Reason: ${reason}. Notes: ${notes}`,
          officerId,
          officerName,
          isMock: verification.isMock,
          isArchived: verification.isArchived,
        }
      });

      await riskService.evaluateUserRisk(
        verification.userId,
        15,
        `KYC rejected by CISO Officer ${officerName}: ${reason}`
      );

      logger.info({ verificationId, officerId, reason }, 'KYC verification REJECTED by CISO');
      eventBus.publish('kyc.rejected', {
        verification: updatedVerification,
        officerId,
        officerName,
        notes,
        reason
      });

      return updatedVerification;
    } catch (error) {
      logger.error({ error, verificationId }, 'Failed to reject KYC');
      throw error;
    }
  }

  async requestReuploadKYC(verificationId: string, officerId: string, officerName: string, notes = '', reason = '') {
    try {
      const verification = await prisma.kYCVerification.findUnique({
        where: { id: verificationId },
        include: { user: true }
      });
      if (!verification) throw new Error('KYC request not found');

      const updatedVerification = await prisma.kYCVerification.update({
        where: { id: verificationId },
        data: { status: 'reupload_requested', updatedAt: new Date() }
      });

      await prisma.user.update({
        where: { id: verification.userId },
        data: { kycStatus: 'REUPLOAD_REQUIRED' }
      });

      await prisma.kYCHistory.create({
        data: {
          kycId: verificationId,
          userId: verification.userId,
          event: 'KYC Re-upload Requested',
          details: `Re-upload requested by CISO Officer: ${officerName} (${officerId}). Reason: ${reason}. Notes: ${notes}`,
          officerId,
          officerName,
          isMock: verification.isMock,
          isArchived: verification.isArchived,
        }
      });

      logger.info({ verificationId, officerId, reason }, 'KYC verification reupload requested by CISO');
      eventBus.publish('kyc.reupload_requested', {
        verification: updatedVerification,
        officerId,
        officerName,
        notes,
        reason
      });

      return updatedVerification;
    } catch (error) {
      logger.error({ error, verificationId }, 'Failed to request reupload');
      throw error;
    }
  }

  async suspendKYC(verificationId: string, officerId: string, officerName: string, notes = '', reason = '') {
    try {
      const verification = await prisma.kYCVerification.findUnique({
        where: { id: verificationId },
        include: { user: true }
      });
      if (!verification) throw new Error('KYC request not found');

      const updatedVerification = await prisma.kYCVerification.update({
        where: { id: verificationId },
        data: { status: 'suspended', updatedAt: new Date() }
      });

      await prisma.user.update({
        where: { id: verification.userId },
        data: { kycStatus: 'SUSPENDED' }
      });

      await prisma.kYCHistory.create({
        data: {
          kycId: verificationId,
          userId: verification.userId,
          event: 'KYC Suspended',
          details: `Suspended by CISO Officer: ${officerName} (${officerId}). Reason: ${reason}. Notes: ${notes}`,
          officerId,
          officerName,
          isMock: verification.isMock,
          isArchived: verification.isArchived,
        }
      });

      logger.info({ verificationId, officerId, reason }, 'KYC verification suspended by CISO');
      eventBus.publish('kyc.suspended', {
        verification: updatedVerification,
        officerId,
        officerName,
        notes,
        reason
      });

      return updatedVerification;
    } catch (error) {
      logger.error({ error, verificationId }, 'Failed to suspend KYC');
      throw error;
    }
  }

  async getPendingVerifications(includeMock = true) {
    return prisma.kYCVerification.findMany({
      where: {
        status: 'pending',
        isArchived: false,
        ...(includeMock ? {} : { isMock: false })
      },
      include: { user: true },
      orderBy: { submittedAt: 'asc' }
    });
  }

  async getHistoryByUserId(userId: string) {
    return prisma.kYCHistory.findMany({
      where: { userId, isArchived: false },
      orderBy: { timestamp: 'desc' }
    });
  }
}

export const kycService = new KYCService();

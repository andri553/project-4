import { eventBus } from './eventbus';
import { auditService } from '../services/audit.service';
import { riskService } from '../services/risk.service';
import { incidentService } from '../services/incident.service';
import { prisma } from '../config/prisma';
import { logger } from '../logger/logger';
import { notificationService } from '../services/notification.service';

export function initListeners() {
  logger.info('[EventBus] Registering enterprise side-effect listeners...');

  // 1. Login Listener
  eventBus.on('auth.login', async (payload) => {
    const { user, context, correlationId } = payload;
    await auditService.log({
      actorId: user.id,
      actorRole: user.role.name,
      module: 'AUTH',
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.id,
      result: 'SUCCESS',
      correlationId,
      ipAddress: context.ipAddress,
      browser: context.browser,
      device: context.deviceId,
      isMock: user.isMock,
      isArchived: user.isArchived,
    });
  });

  // 2. Logout Listener
  eventBus.on('auth.logout', async (payload) => {
    const { session, correlationId } = payload;
    if (!session) return;
    await auditService.log({
      actorId: session.userId,
      actorRole: 'Customer', // Default role for customer logout
      module: 'AUTH',
      action: 'USER_LOGOUT',
      entity: 'User',
      entityId: session.userId,
      result: 'SUCCESS',
      correlationId,
      isMock: session.isMock,
      isArchived: session.isArchived,
    });
  });

  // 3. Loan Applied Listener
  eventBus.on('loan.applied', async (payload) => {
    const { loan, user } = payload;
    await auditService.log({
      actorId: user.id,
      actorRole: user.role.name,
      module: 'LOAN',
      action: 'LOAN_APPLIED',
      entity: 'Loan',
      entityId: loan.id,
      result: 'SUCCESS',
      isMock: loan.isMock,
      isArchived: loan.isArchived,
    });
  });

  // 4. Loan Approved Listener
  eventBus.on('loan.approved', async (payload) => {
    const { loan } = payload;
    await auditService.log({
      actorId: 'SYSTEM',
      actorRole: 'System Analyser',
      module: 'LOAN',
      action: 'LOAN_APPROVED',
      entity: 'Loan',
      entityId: loan.id,
      result: 'SUCCESS',
      isMock: loan.isMock,
      isArchived: loan.isArchived,
    });
  });

  // 5. Savings Deposit Listener
  eventBus.on('savings.deposit', async (payload) => {
    const { tx, user } = payload;
    await auditService.log({
      actorId: user.id,
      actorRole: user.role.name,
      module: 'SAVINGS',
      action: 'SAVINGS_DEPOSIT',
      entity: 'Transaction',
      entityId: tx.id,
      result: 'SUCCESS',
      isMock: tx.isMock,
      isArchived: tx.isArchived,
    });
  });

  // 6. Savings Withdrawal & QRIS Listener (Fraud Engine Policy)
  eventBus.on('savings.withdrawal', async (payload) => {
    const { tx, user, isQris } = payload;
    await auditService.log({
      actorId: user.id,
      actorRole: user.role.name,
      module: 'SAVINGS',
      action: isQris ? 'QRIS_PAYMENT' : 'WITHDRAWAL',
      entity: 'Transaction',
      entityId: tx.id,
      result: 'SUCCESS',
      isMock: tx.isMock,
      isArchived: tx.isArchived,
    });

    if (isQris) {
      // Run Policy Check: large transaction threshold
      if (tx.amount > 5000000) {
        // Log security event for large QRIS
        const secEvent = await prisma.securityEvent.create({
          data: {
            userId: user.id,
            category: 'Fraud Detection',
            sourceModule: 'policy_engine',
            severity: 'High',
            riskScore: 30,
            description: `Suspicious high-value QRIS transaction: Rp ${tx.amount.toLocaleString('id-ID')} at ${tx.description}`,
            status: 'OPEN',
            isMock: tx.isMock,
            isArchived: tx.isArchived
          }
        });

        // Raise SOC Incident
        await incidentService.createIncident({
          userId: user.id,
          title: 'Suspicious QRIS Activity Escalation',
          description: `Fraud risk rules triggered: High value QRIS transaction of Rp ${tx.amount.toLocaleString('id-ID')} from account ${tx.accountId}.`,
          severity: 'HIGH',
          isMock: tx.isMock,
          isArchived: tx.isArchived
        });

        // Trigger Risk Engine update
        await riskService.evaluateUserRisk(
          user.id,
          30,
          `High-value QRIS payment: Rp ${tx.amount.toLocaleString('id-ID')}`
        );
      }
    }
  });

  // 7. Savings Transfer Listener
  eventBus.on('savings.transfer', async (payload) => {
    const { tx, user } = payload;
    await auditService.log({
      actorId: user.id,
      actorRole: user.role.name,
      module: 'SAVINGS',
      action: 'TRANSFER_COMPLETED',
      entity: 'Transaction',
      entityId: tx.id,
      result: 'SUCCESS',
      isMock: tx.isMock,
      isArchived: tx.isArchived,
    });
  });

  // 8. KYC Progression & Submit Listeners
  eventBus.on('kyc.started', async (payload) => {
    const { verification, user } = payload;
    await auditService.log({
      actorId: user.id,
      actorRole: 'Customer',
      module: 'KYC',
      action: 'KYC_STARTED',
      entity: 'KYCVerification',
      entityId: verification.id,
      result: 'SUCCESS',
      isMock: verification.isMock,
      isArchived: verification.isArchived,
    });
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        category: 'Identity Verification',
        sourceModule: 'kyc_service',
        severity: 'Low',
        riskScore: 0,
        description: `e-KYC verification flow initiated. Version: ${verification.version}`,
        status: 'RESOLVED',
        isMock: verification.isMock,
        isArchived: verification.isArchived,
      }
    });
  });

  eventBus.on('kyc.ktp_uploaded', async (payload) => {
    const { verification, user } = payload;
    await auditService.log({
      actorId: user.id,
      actorRole: 'Customer',
      module: 'KYC',
      action: 'KTP_UPLOADED',
      entity: 'KYCVerification',
      entityId: verification.id,
      result: 'SUCCESS',
      isMock: verification.isMock,
      isArchived: verification.isArchived,
    });
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        category: 'Identity Verification',
        sourceModule: 'kyc_service',
        severity: 'Low',
        riskScore: 0,
        description: `KTP image uploaded successfully.`,
        status: 'RESOLVED',
        isMock: verification.isMock,
        isArchived: verification.isArchived,
      }
    });
  });

  eventBus.on('kyc.ocr_completed', async (payload) => {
    const { verification, user, ocrData } = payload;
    await auditService.log({
      actorId: user.id,
      actorRole: 'Customer',
      module: 'KYC',
      action: 'OCR_COMPLETED',
      entity: 'KYCVerification',
      entityId: verification.id,
      result: 'SUCCESS',
      isMock: verification.isMock,
      isArchived: verification.isArchived,
    });
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        category: 'Identity Verification',
        sourceModule: 'kyc_service',
        severity: 'Low',
        riskScore: 0,
        description: `OCR processed successfully. Extracted NIK: ${ocrData.nik}, Name: ${ocrData.nama}.`,
        status: 'RESOLVED',
        isMock: verification.isMock,
        isArchived: verification.isArchived,
      }
    });
  });

  eventBus.on('kyc.selfie_captured', async (payload) => {
    const { verification, user } = payload;
    await auditService.log({
      actorId: user.id,
      actorRole: 'Customer',
      module: 'KYC',
      action: 'SELFIE_CAPTURED',
      entity: 'KYCVerification',
      entityId: verification.id,
      result: 'SUCCESS',
      isMock: verification.isMock,
      isArchived: verification.isArchived,
    });
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        category: 'Identity Verification',
        sourceModule: 'kyc_service',
        severity: 'Low',
        riskScore: 0,
        description: `Selfie photo captured successfully.`,
        status: 'RESOLVED',
        isMock: verification.isMock,
        isArchived: verification.isArchived,
      }
    });
  });

  eventBus.on('kyc.face_match_completed', async (payload) => {
    const { verification, user, score, passed } = payload;
    await auditService.log({
      actorId: user.id,
      actorRole: 'Customer',
      module: 'KYC',
      action: 'FACE_MATCH_COMPLETED',
      entity: 'KYCVerification',
      entityId: verification.id,
      result: passed ? 'SUCCESS' : 'FAILURE',
      isMock: verification.isMock,
      isArchived: verification.isArchived,
    });
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        category: 'Identity Verification',
        sourceModule: 'kyc_service',
        severity: passed ? 'Low' : 'High',
        riskScore: passed ? 0 : 20,
        description: `Face matching completed. Match Score: ${score}%. Passed: ${passed}`,
        status: 'RESOLVED',
        isMock: verification.isMock,
        isArchived: verification.isArchived,
      }
    });
  });

  eventBus.on('kyc.submitted', async (payload) => {
    const { verification, user } = payload;
    await auditService.log({
      actorId: user.id,
      actorRole: user.role?.name || 'Customer',
      module: 'KYC',
      action: 'KYC_SUBMITTED',
      entity: 'KYCVerification',
      entityId: verification.id,
      result: 'SUCCESS',
      isMock: verification.isMock,
      isArchived: verification.isArchived,
    });
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        category: 'Identity Verification',
        sourceModule: 'kyc_service',
        severity: 'Medium',
        riskScore: 5,
        description: `e-KYC verification submitted for CISO approval. Version: ${verification.version}`,
        status: 'OPEN',
        isMock: verification.isMock,
        isArchived: verification.isArchived,
      }
    });
    await notificationService.sendNotification(
      user.id,
      'Verifikasi KYC Terkirim',
      'Data verifikasi identitas Anda telah terkirim dan sedang ditinjau oleh Chief Information Security Officer (CISO).',
      'kyc',
      user.isMock
    );
  });

  // 9. KYC Decision Listeners
  eventBus.on('kyc.approved', async (payload) => {
    const { verification, officerId, officerName, notes, reason } = payload;
    await auditService.log({
      actorId: officerId,
      actorRole: 'CISO',
      module: 'KYC',
      action: 'KYC_APPROVED',
      entity: 'KYCVerification',
      entityId: verification.id,
      result: 'SUCCESS',
      newValue: `Approved. Notes: ${notes}. Reason: ${reason}`,
      isMock: verification.isMock,
      isArchived: verification.isArchived,
    });

    await prisma.securityEvent.create({
      data: {
        userId: verification.userId,
        category: 'Identity Verification',
        sourceModule: 'kyc_service',
        severity: 'Low',
        riskScore: 0,
        description: `e-KYC approved by CISO: ${officerName}. Access granted to Loans and Interbank Transfers.`,
        status: 'RESOLVED',
        isMock: verification.isMock,
        isArchived: verification.isArchived,
      }
    });

    await notificationService.sendNotification(
      verification.userId,
      'Identitas Terverifikasi! 🎉',
      'Selamat! Verifikasi identitas (e-KYC) Anda telah disetujui oleh CISO. Fitur Pinjaman, Transfer Antarbank, dan Fitur Premium Anda telah dibuka.',
      'kyc',
      verification.isMock
    );
  });

  eventBus.on('kyc.rejected', async (payload) => {
    const { verification, officerId, officerName, notes, reason } = payload;
    await auditService.log({
      actorId: officerId,
      actorRole: 'CISO',
      module: 'KYC',
      action: 'KYC_REJECTED',
      entity: 'KYCVerification',
      entityId: verification.id,
      result: 'SUCCESS',
      newValue: `Rejected. Reason: ${reason}. Notes: ${notes}`,
      isMock: verification.isMock,
      isArchived: verification.isArchived,
    });

    await prisma.securityEvent.create({
      data: {
        userId: verification.userId,
        category: 'Identity Verification',
        sourceModule: 'kyc_service',
        severity: 'High',
        riskScore: 15,
        description: `e-KYC rejected by CISO: ${officerName}. Reason: ${reason}`,
        status: 'OPEN',
        isMock: verification.isMock,
        isArchived: verification.isArchived,
      }
    });

    await notificationService.sendNotification(
      verification.userId,
      'Verifikasi KYC Ditolak',
      `Maaf, verifikasi identitas Anda ditolak. Alasan: ${reason}. Harap unggah ulang dokumen Anda.`,
      'kyc',
      verification.isMock
    );
  });

  eventBus.on('kyc.reupload_requested', async (payload) => {
    const { verification, officerId, officerName, notes, reason } = payload;
    await auditService.log({
      actorId: officerId,
      actorRole: 'CISO',
      module: 'KYC',
      action: 'KYC_REUPLOAD_REQUESTED',
      entity: 'KYCVerification',
      entityId: verification.id,
      result: 'SUCCESS',
      newValue: `Reupload requested. Reason: ${reason}. Notes: ${notes}`,
      isMock: verification.isMock,
      isArchived: verification.isArchived,
    });

    await prisma.securityEvent.create({
      data: {
        userId: verification.userId,
        category: 'Identity Verification',
        sourceModule: 'kyc_service',
        severity: 'Medium',
        riskScore: 5,
        description: `e-KYC reupload requested by CISO: ${officerName}. Reason: ${reason}`,
        status: 'OPEN',
        isMock: verification.isMock,
        isArchived: verification.isArchived,
      }
    });

    await notificationService.sendNotification(
      verification.userId,
      'Upload Ulang Dokumen KYC',
      `Harap unggah ulang dokumen identitas Anda. Alasan: ${reason}.`,
      'kyc',
      verification.isMock
    );
  });

  eventBus.on('kyc.suspended', async (payload) => {
    const { verification, officerId, officerName, notes, reason } = payload;
    await auditService.log({
      actorId: officerId,
      actorRole: 'CISO',
      module: 'KYC',
      action: 'KYC_SUSPENDED',
      entity: 'KYCVerification',
      entityId: verification.id,
      result: 'SUCCESS',
      newValue: `Suspended. Reason: ${reason}. Notes: ${notes}`,
      isMock: verification.isMock,
      isArchived: verification.isArchived,
    });

    await prisma.securityEvent.create({
      data: {
        userId: verification.userId,
        category: 'Identity Verification',
        sourceModule: 'kyc_service',
        severity: 'Critical',
        riskScore: 40,
        description: `e-KYC verification suspended by CISO: ${officerName}. Reason: ${reason}`,
        status: 'OPEN',
        isMock: verification.isMock,
        isArchived: verification.isArchived,
      }
    });

    await notificationService.sendNotification(
      verification.userId,
      'Verifikasi KYC Ditangguhkan (Suspended)',
      `Verifikasi KYC Anda ditangguhkan karena alasan keamanan: ${reason}. Silakan hubungi customer service kami.`,
      'kyc',
      verification.isMock
    );
  });

  // 10. Device New Detected Listener (Security Policy Check)
  eventBus.on('device.new_detected', async (payload) => {
    const { userId, deviceId, deviceName, isTrusted, location, fingerprint } = payload;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    // Log security event
    await prisma.securityEvent.create({
      data: {
        userId,
        category: 'Device Security',
        sourceModule: 'device_service',
        severity: isTrusted ? 'Low' : 'Medium',
        riskScore: isTrusted ? 0 : 20,
        description: `New unrecognized device logged: ${deviceName} at ${location}. Fingerprint: ${fingerprint}`,
        status: isTrusted ? 'RESOLVED' : 'OPEN',
        isMock: user.isMock,
        isArchived: user.isArchived,
      }
    });

    if (!isTrusted) {
      // Increase risk score by 20 points
      await riskService.evaluateUserRisk(
        userId,
        20,
        `Login from unrecognized device fingerprint: ${fingerprint} (${deviceName})`
      );
    }
  });

  // 11. Security Officer Administration Actions
  eventBus.on('security.user_blocked', async (payload) => {
    const { userId, officerId, officerName } = payload;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    await auditService.log({
      actorId: officerId,
      actorRole: 'Security Analyst',
      module: 'SECURITY',
      action: 'ACCOUNT_BLOCKED',
      entity: 'User',
      entityId: userId,
      result: 'SUCCESS',
      isMock: user.isMock,
      isArchived: user.isArchived,
    });
  });

  eventBus.on('security.session_revoked', async (payload) => {
    const { userId, officerId, officerName } = payload;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    await auditService.log({
      actorId: officerId,
      actorRole: 'Security Analyst',
      module: 'SECURITY',
      action: 'SESSIONS_REVOKED',
      entity: 'User',
      entityId: userId,
      result: 'SUCCESS',
      isMock: user.isMock,
      isArchived: user.isArchived,
    });
  });
}

import { transactionRepository } from '../repositories/transaction.repository';
import { sessionRepository } from '../repositories/session.repository';
import { deviceRepository } from '../repositories/device.repository';
import { auditRepository } from '../repositories/audit.repository';
import { prisma } from '../config/prisma';
import { riskEngineService } from './risk-engine.service';

export interface CorrelationGraph {
  transaction: any;
  riskAssessment: {
    score: number;
    level: string;
    indicators: any;
  };
  related: {
    session: any;
    device: any;
    auditLogs: any[];
    securityEvents: any[];
    incidents: any[];
    hasActiveIncident: boolean;
    duplicateIncidentId: string | null;
  };
  timeline: {
    timestamp: Date;
    event: string;
    details: string;
    type: 'auth' | 'transaction' | 'security' | 'incident';
    severity?: string;
  }[];
}

export class CorrelationService {
  async getTransactionCorrelation(transactionId: string): Promise<CorrelationGraph | null> {
    const tx = await transactionRepository.findById(transactionId);
    if (!tx) return null;

    const txDate = new Date(tx.createdAt);
    const userId = tx.userId;

    // 1. Fetch related audit logs and security events around transaction time (+/- 1 hr)
    const { logs, events } = await auditRepository.findRelatedAuditsAndEvents(userId, txDate, 20);

    // 2. Fetch all user transactions to evaluate behavioral context (dormancy, new beneficiary, rapid tx)
    const allUserTxs = await prisma.transaction.findMany({
      where: { userId, isArchived: false },
      orderBy: { createdAt: 'desc' }
    });

    // 3. Find closest Session active when transaction occurred
    const session = await sessionRepository.findSessionForTransaction(userId, txDate);
    
    // 4. Find Device used in that Session
    let device = null;
    if (session && session.deviceId) {
      device = await deviceRepository.findSpecificDevice(userId, session.deviceId);
    }

    // 5. Fetch incidents related to this user
    const userIncidents = await prisma.securityIncident.findMany({
      where: { userId, isArchived: false },
      orderBy: { createdAt: 'desc' }
    });

    // 6. Calculate risk score & risk indicators via RiskEngineService
    const risk = riskEngineService.calculateTransactionRisk(tx, tx.user, allUserTxs, events);

    // 7. Check for duplicate incidents
    // Duplicate condition: is there any OPEN incident for this user that contains this transaction ID
    const duplicateIncident = userIncidents.find(
      inc => inc.status === 'OPEN' && 
      (inc.description?.includes(tx.id) || inc.title?.includes(tx.id))
    );

    const hasActiveIncident = !!duplicateIncident;
    const duplicateIncidentId = duplicateIncident ? duplicateIncident.id : null;

    // 8. Compile the Chronological Timeline
    const timelineItems: CorrelationGraph['timeline'] = [];

    // Add Session creation if matching
    if (session) {
      timelineItems.push({
        timestamp: new Date(session.createdAt),
        event: 'Session Created',
        details: `Session initiated from ${session.operatingSystem || 'Unknown'} (${session.browser || 'Unknown'}) via IP ${session.ipAddress || 'Unknown'}.`,
        type: 'auth'
      });
    }

    // Add OTP & PIN verification from Audit Logs
    const authLogs = logs.filter(l => l.module === 'AUTH');
    authLogs.forEach(al => {
      if (al.action === 'OTP_VERIFIED') {
        timelineItems.push({
          timestamp: new Date(al.createdAt),
          event: 'OTP Verified',
          details: `One-time password verified successfully. IP: ${al.ipAddress}`,
          type: 'auth'
        });
      } else if (al.action === 'PIN_VERIFIED' || al.action === 'VERIFY_PIN') {
        timelineItems.push({
          timestamp: new Date(al.createdAt),
          event: 'PIN Verified',
          details: `PIN entry authorized. Transaction token issued. IP: ${al.ipAddress}`,
          type: 'auth'
        });
      } else if (al.action === 'LOGIN' || al.action === 'LOGIN_SUCCESS') {
        timelineItems.push({
          timestamp: new Date(al.createdAt),
          event: 'User Logged In',
          details: `Standard credentials approved. Role: ${al.actorRole || 'User'}`,
          type: 'auth'
        });
      }
    });

    // Add Security Events
    events.forEach(se => {
      timelineItems.push({
        timestamp: new Date(se.createdAt),
        event: se.category,
        details: se.description,
        type: 'security',
        severity: se.severity
      });
    });

    // Add the transaction itself
    timelineItems.push({
      timestamp: txDate,
      event: 'Transaction Authorized',
      details: `${tx.type.toUpperCase()}: authorized amount of Rp ${tx.amount.toLocaleString('id-ID')} to ${tx.recipientName || tx.description}. Status: ${tx.status}`,
      type: 'transaction'
    });

    // Add related incidents
    userIncidents.forEach(inc => {
      // Show incidents created within the context (+/- 1 hour)
      const incTime = new Date(inc.createdAt);
      const diff = Math.abs(incTime.getTime() - txDate.getTime());
      if (diff < 60 * 60 * 1000) {
        timelineItems.push({
          timestamp: incTime,
          event: 'Incident Raised',
          details: `[${inc.id}] Title: ${inc.title}. Severity: ${inc.severity}. Status: ${inc.status}`,
          type: 'incident',
          severity: inc.severity
        });
      }
    });

    // Sort timeline chronologically (oldest first)
    timelineItems.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return {
      transaction: {
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
        user: tx.user
      },
      riskAssessment: {
        score: risk.score,
        level: risk.level,
        indicators: risk.indicators
      },
      related: {
        session: session ? {
          id: session.id,
          ipAddress: session.ipAddress,
          browser: session.browser,
          operatingSystem: session.operatingSystem,
          isTrustedDevice: session.isTrustedDevice,
          status: session.status,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity
        } : null,
        device: device ? {
          id: device.id,
          deviceId: device.deviceId,
          fingerprint: device.fingerprint,
          os: device.os,
          browser: device.browser,
          isTrusted: device.isTrusted,
          location: device.location,
          lastSeen: device.lastSeen
        } : null,
        auditLogs: logs,
        securityEvents: events,
        incidents: userIncidents,
        hasActiveIncident,
        duplicateIncidentId
      },
      timeline: timelineItems
    };
  }
}

export const correlationService = new CorrelationService();

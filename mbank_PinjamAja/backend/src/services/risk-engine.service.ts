import { RISK_WEIGHTS } from '../config/risk-weight';

export interface RiskResult {
  score: number;
  level: string;
  indicators: {
    criticalAmount?: boolean;
    highAmount?: boolean;
    unverifiedKyc?: boolean;
    authFailures?: boolean;
    crossBorder?: boolean;
    vpnNetworkRisk?: boolean;
    unusualTime?: boolean;
    newBeneficiary?: boolean;
    rapidTransactions?: boolean;
    dormantReactivation?: boolean;
  };
}

export class RiskEngineService {
  calculateTransactionRisk(tx: any, user: any, relatedTxs: any[], relatedEvents: any[]): RiskResult {
    let score = RISK_WEIGHTS.BASE_SCORE;
    const indicators: RiskResult['indicators'] = {};

    // 1. Transaction Amount Risk
    if (tx.amount > RISK_WEIGHTS.HIGH_AMOUNT_THRESHOLD) {
      score += RISK_WEIGHTS.CRITICAL_AMOUNT_WEIGHT;
      indicators.criticalAmount = true;
    } else if (tx.amount > RISK_WEIGHTS.MEDIUM_AMOUNT_THRESHOLD) {
      score += RISK_WEIGHTS.HIGH_AMOUNT_WEIGHT;
      indicators.highAmount = true;
    } else if (tx.amount > RISK_WEIGHTS.LOW_AMOUNT_THRESHOLD) {
      score += RISK_WEIGHTS.MEDIUM_AMOUNT_WEIGHT;
    }

    // 2. KYC Verification status risk
    const kyc = user?.kycStatus?.toLowerCase();
    if (kyc !== 'verified' && kyc !== 'approved') {
      score += RISK_WEIGHTS.UNVERIFIED_KYC_WEIGHT;
      indicators.unverifiedKyc = true;
    }

    // 3. Failed OTP/PIN attempts in security events
    const failedAuths = relatedEvents.filter(
      e => e.category?.toLowerCase() === 'security' && 
      (e.description?.toLowerCase().includes('fail') || e.description?.toLowerCase().includes('block'))
    );
    if (failedAuths.length > 0) {
      const authRisk = Math.min(RISK_WEIGHTS.MAX_FAILED_ATTEMPT_WEIGHT, failedAuths.length * RISK_WEIGHTS.FAILED_ATTEMPT_WEIGHT);
      score += authRisk;
      indicators.authFailures = true;
    }

    // 4. Cross-border FX indicator
    const isCrossBorder = tx.description?.toLowerCase().includes('sgd') || 
                          tx.description?.toLowerCase().includes('myr') || 
                          tx.description?.toLowerCase().includes('thb') ||
                          tx.description?.toLowerCase().includes('cross-border') ||
                          tx.recipientBank?.toLowerCase() !== 'indo' && tx.recipientBank && !tx.recipientBank.toLowerCase().includes('bank'); // any foreign indication
    if (isCrossBorder) {
      score += RISK_WEIGHTS.CROSS_BORDER_WEIGHT;
      indicators.crossBorder = true;
    }

    // 5. Network Risk (VPN / proxy detection via mock IP pools or event data)
    // In our backend, the CISO SOC audits sometimes note IP changes.
    // Let's assume VPN IP prefix is mock '185.200.' or starts with 'vpn' in logs
    const hasVpnLogs = relatedEvents.some(e => e.description?.toLowerCase().includes('vpn') || e.description?.toLowerCase().includes('tor'));
    if (hasVpnLogs) {
      score += RISK_WEIGHTS.VPN_WEIGHT;
      indicators.vpnNetworkRisk = true;
    }

    // 6. Behavior Indicator: Unusual Activity Time (between 11 PM and 4 AM)
    const txHour = new Date(tx.createdAt).getHours();
    if (txHour >= 23 || txHour < 4) {
      score += RISK_WEIGHTS.BEHAVIOR_NIGHT_ACTIVITY;
      indicators.unusualTime = true;
    }

    // 7. Behavior Indicator: New Beneficiary
    if (tx.type === 'transfer_out' && tx.recipientAccount) {
      const isPriorBeneficiary = relatedTxs.some(
        oldTx => oldTx.id !== tx.id && 
        oldTx.type === 'transfer_out' && 
        oldTx.recipientAccount === tx.recipientAccount
      );
      if (!isPriorBeneficiary) {
        score += RISK_WEIGHTS.BEHAVIOR_NEW_BENEFICIARY;
        indicators.newBeneficiary = true;
      }
    }

    // 8. Behavior Indicator: Rapid Transactions (within 2 minutes of prior transaction)
    const priorTxWithinTwoMin = relatedTxs.find(
      oldTx => oldTx.id !== tx.id &&
      Math.abs(new Date(oldTx.createdAt).getTime() - new Date(tx.createdAt).getTime()) < 2 * 60 * 1000
    );
    if (priorTxWithinTwoMin) {
      score += 20;
      indicators.rapidTransactions = true;
    }

    // 9. Behavior Indicator: Dormant Account Reactivation
    // If no transaction in 30 days, but now executes a transaction of significant amount (> 1M)
    const priorTxsWithin30Days = relatedTxs.filter(
      oldTx => oldTx.id !== tx.id &&
      Math.abs(new Date(tx.createdAt).getTime() - new Date(oldTx.createdAt).getTime()) < 30 * 24 * 60 * 60 * 1000
    );
    if (priorTxsWithin30Days.length === 0 && relatedTxs.length > 0 && tx.amount > 1000000) {
      score += 15;
      indicators.dormantReactivation = true;
    }

    score = Math.min(100, score);

    let level = 'Low';
    if (score >= 80) level = 'Critical';
    else if (score >= 60) level = 'High';
    else if (score >= 30) level = 'Medium';

    return { score, level, indicators };
  }
}

export const riskEngineService = new RiskEngineService();

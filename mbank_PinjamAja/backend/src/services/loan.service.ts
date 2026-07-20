import { prisma } from '../config/prisma';
import { logger } from '../logger/logger';
import { eventBus } from '../eventbus/eventbus';
import { notificationService } from './notification.service';

export class LoanService {
  async applyLoan(userId: string, data: {
    productId: string;
    productName: string;
    amount: number;
    tenor: number;
    purpose: string;
    interestRate: number;
  }) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      const monthlyInstallment = Math.round(
        (data.amount * (1 + (data.interestRate / 100) * data.tenor)) / data.tenor
      );
      const totalRepayment = monthlyInstallment * data.tenor;

      const loan = await prisma.loan.create({
        data: {
          userId,
          productId: data.productId,
          productName: data.productName,
          amount: data.amount,
          tenor: data.tenor,
          purpose: data.purpose,
          interestRate: data.interestRate,
          monthlyInstallment,
          totalRepayment,
          status: 'submitted',
          isMock: user.isMock,
          isArchived: user.isArchived,
        }
      });

      logger.info({ userId, loanId: loan.id }, 'Loan application created');

      // Publish event
      eventBus.publish('loan.applied', {
        loan,
        user
      });

      // Auto-process loan verification after 5 seconds (business logic side effect simulated)
      setTimeout(async () => {
        await this.processAutoApproval(loan.id);
      }, 5000);

      return loan;
    } catch (error) {
      logger.error({ error, userId }, 'Failed to apply loan');
      throw error;
    }
  }

  async processAutoApproval(loanId: string) {
    try {
      const loan = await prisma.loan.findUnique({
        where: { id: loanId },
        include: { user: true }
      });

      if (!loan || loan.status !== 'submitted') return;

      // Policy: Auto-approve only if user has APPROVED KYC and Risk Score <= 50
      if (loan.user.kycStatus === 'APPROVED' && loan.user.riskScore <= 50) {
        await prisma.loan.update({
          where: { id: loanId },
          data: { status: 'active' }
        });

        logger.info({ loanId }, 'Loan auto-approved successfully');

        // Send notification
        await notificationService.sendNotification(
          loan.userId,
          'Pinjaman Disetujui! 🎉',
          `Pengajuan pinjaman ${loan.productName} Anda sebesar Rp ${loan.amount.toLocaleString('id-ID')} telah disetujui otomatis.`,
          'loan',
          loan.isMock
        );

        eventBus.publish('loan.approved', { loan });
      } else {
        // Change status to reviewing
        await prisma.loan.update({
          where: { id: loanId },
          data: { status: 'reviewing' }
        });

        logger.info({ loanId }, 'Loan escalated to manual review');

        await notificationService.sendNotification(
          loan.userId,
          'Pengajuan Pinjaman Ditinjau',
          `Pengajuan pinjaman ${loan.productName} Anda sedang ditinjau manual oleh tim analis kami.`,
          'loan',
          loan.isMock
        );

        eventBus.publish('loan.escalated', { loan });
      }
    } catch (error) {
      logger.error({ error, loanId }, 'Error in loan auto approval process');
    }
  }

  async getLoans(userId: string, includeMock = true) {
    return prisma.loan.findMany({
      where: {
        userId,
        isArchived: false,
        ...(includeMock ? {} : { isMock: false })
      },
      orderBy: { appliedAt: 'desc' }
    });
  }
}

export const loanService = new LoanService();

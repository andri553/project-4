import { create } from 'zustand';
import type { LoanApplication, LoanProduct, InstallmentSchedule, CreditScore } from '@/types';
import { loanApplications, loanProducts, installmentSchedules, creditScores } from '@/data/mockData';
import { logAudit } from './auditStore';
import { useAuthStore } from './authStore';
import { useNotificationStore } from './notificationStore';

interface LoanStore {
  products: LoanProduct[];
  applications: LoanApplication[];
  creditScores: Record<string, CreditScore>;
  installmentSchedules: Record<string, InstallmentSchedule[]>;

  fetchLoans: () => Promise<void>;
  applyLoan: (productId: string, amount: number, tenor: number, purpose: string) => Promise<LoanApplication>;
  getActiveLoans: () => LoanApplication[];
  getLoanById: (id: string) => LoanApplication | undefined;
  getInstallments: (loanId: string) => InstallmentSchedule[];
  getCreditScore: (userId: string) => CreditScore | undefined;
  approveLoan: (loanId: string) => void;
}

let loanCounter = 4;

export const useLoanStore = create<LoanStore>((set, get) => ({
  products: [...loanProducts],
  applications: [...loanApplications],
  creditScores: { ...creditScores },
  installmentSchedules: { ...installmentSchedules },

  fetchLoans: async () => {
    try {
      const res = await fetch('/api/v1/business/loans');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        // Map backend Loan schema to LoanApplication frontend type
        const mapped = data.data.map((l: any) => ({
          id: l.id,
          userId: l.userId,
          productId: l.productId,
          productName: l.productName,
          amount: l.amount,
          tenor: l.tenor,
          purpose: l.purpose,
          interestRate: l.interestRate,
          monthlyInstallment: l.monthlyInstallment,
          totalRepayment: l.totalRepayment,
          status: l.status,
          appliedAt: l.appliedAt,
          updatedAt: l.updatedAt
        }));
        set({ applications: mapped });
      }
    } catch (err) {
      console.error('Failed to fetch loans', err);
    }
  },

  applyLoan: async (productId, amount, tenor, purpose) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('Not authenticated');

    const product = get().products.find((p) => p.id === productId);
    if (!product) throw new Error('Product not found');

    const res = await fetch('/api/v1/business/loans/apply', {
      method: 'POST',
      body: JSON.stringify({
        productId,
        productName: product.name,
        amount,
        tenor,
        purpose,
        interestRate: product.interestRate
      })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Loan application failed');

    const newApp: LoanApplication = {
      id: result.data.id,
      userId: user.id,
      productId,
      productName: product.name,
      amount,
      tenor,
      purpose,
      interestRate: product.interestRate,
      monthlyInstallment: result.data.monthlyInstallment,
      totalRepayment: result.data.totalRepayment,
      status: 'submitted',
      appliedAt: result.data.appliedAt,
      updatedAt: result.data.updatedAt,
    };

    set((state) => ({
      applications: [newApp, ...state.applications],
    }));

    logAudit(
      user.id,
      user.fullName,
      'LOAN',
      'LOAN_APPLIED',
      `Applied for ${product.name} - Rp ${amount.toLocaleString('id-ID')}`,
      'success',
      { loanId: newApp.id, amount, tenor },
    );

    // Auto refresh loans list in 6 seconds to see auto-approval status
    setTimeout(() => {
      get().fetchLoans();
    }, 6000);

    return newApp;
  },
  approveLoan: (loanId) => {
    set((state) => {
      const updatedApplications = state.applications.map((app) => {
        if (app.id === loanId && (app.status === 'submitted' || app.status === 'reviewing')) {
          logAudit(
            app.userId,
            'System Verifier',
            'LOAN',
            'LOAN_APPROVED',
            `Loan application ${loanId} Approved automatically by credit score analysis`,
            'success',
            { loanId }
          );

          // Trigger a notification
          useNotificationStore.getState().addNotification({
            userId: app.userId,
            type: 'loan',
            title: 'Pinjaman Disetujui! 🎉',
            message: `Pengajuan pinjaman ${app.productName} Anda sebesar Rp ${app.amount.toLocaleString('id-ID')} telah disetujui.`,
          });

          // Generate sample installments
          const schedules: InstallmentSchedule[] = [];
          for (let i = 1; i <= app.tenor; i++) {
            const dueDate = new Date();
            dueDate.setMonth(dueDate.getMonth() + i);
            schedules.push({
              installmentNo: i,
              dueDate: dueDate.toISOString(),
              principalAmount: Math.round(app.amount / app.tenor),
              interestAmount: Math.round((app.amount * (app.interestRate / 100))),
              totalAmount: app.monthlyInstallment,
              status: 'upcoming'
            });
          }

          state.installmentSchedules[loanId] = schedules;

          return { ...app, status: 'active' as LoanApplication['status'], updatedAt: new Date().toISOString() };
        }
        return app;
      });

      return { applications: updatedApplications };
    });
  },

  getActiveLoans: () => {
    return get().applications.filter((a) => ['active', 'disbursed'].includes(a.status));
  },

  getLoanById: (id) => {
    return get().applications.find((a) => a.id === id);
  },

  getInstallments: (loanId) => {
    return get().installmentSchedules[loanId] || [];
  },

  getCreditScore: (userId) => {
    return get().creditScores[userId];
  },
}));

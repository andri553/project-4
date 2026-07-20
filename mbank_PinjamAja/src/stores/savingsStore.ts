import { create } from 'zustand';
import type { SavingsAccount, SavingsTransaction, TransactionType } from '@/types';
import { savingsAccounts, savingsTransactions } from '@/data/mockData';
import { logAudit } from './auditStore';
import { useAuthStore } from './authStore';
import { useNotificationStore } from './notificationStore';

interface SavingsStore {
  accounts: SavingsAccount[];
  transactions: SavingsTransaction[];

  getTotalBalance: () => number;
  getAccountById: (id: string) => SavingsAccount | undefined;
  getTransactionsByAccount: (accountId: string) => SavingsTransaction[];
  fetchTransactions: () => Promise<void>;
  deposit: (accountId: string, amount: number, description: string) => Promise<void>;
  withdraw: (accountId: string, amount: number, description: string, isQris?: boolean) => Promise<void>;
  transfer: (accountId: string, amount: number, recipientName: string, recipientAccount: string, recipientBank: string) => Promise<void>;
}

let txCounter = savingsTransactions.length + 1;

export const useSavingsStore = create<SavingsStore>((set, get) => ({
  accounts: [...savingsAccounts],
  transactions: [...savingsTransactions],

  getTotalBalance: () => {
    return get().accounts.reduce((sum, acc) => sum + acc.balance, 0);
  },

  getAccountById: (id) => {
    return get().accounts.find((a) => a.id === id);
  },

  getTransactionsByAccount: (accountId) => {
    return get().transactions.filter((t) => t.accountId === accountId);
  },

  fetchTransactions: async () => {
    try {
      const res = await fetch('/api/v1/business/savings/transactions');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        set({ transactions: data.data });
      }
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    }
  },

  deposit: async (accountId, amount, description) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('Not authenticated');

    const res = await fetch('/api/v1/business/savings/deposit', {
      method: 'POST',
      body: JSON.stringify({ accountId, amount, description })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Deposit failed');

    set((state) => {
      const accounts = state.accounts.map((a) =>
        a.id === accountId ? { ...a, balance: a.balance + amount } : a,
      );
      const account = accounts.find((a) => a.id === accountId)!;
      const newTx: SavingsTransaction = {
        id: result.data.id,
        accountId,
        userId: user.id,
        type: 'deposit',
        amount,
        balanceAfter: account.balance,
        description,
        status: 'completed',
        createdAt: result.data.createdAt,
      };
      return { accounts, transactions: [newTx, ...state.transactions] };
    });

    logAudit(user.id, user.fullName, 'SAVINGS', 'SAVINGS_DEPOSIT', `Deposit Rp ${amount.toLocaleString('id-ID')} to ${accountId}`, 'success', { accountId, amount });
    
    useNotificationStore.getState().addNotification({
      userId: user.id,
      title: 'Setoran Berhasil',
      message: `Setoran sebesar Rp ${amount.toLocaleString('id-ID')} telah ditambahkan ke rekening Anda.`,
      type: 'transaction',
    });
  },

  withdraw: async (accountId, amount, description, isQris = false) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('Not authenticated');

    const url = isQris ? '/api/qris/pay' : '/api/savings/withdraw';
    const body = isQris 
      ? JSON.stringify({ merchantName: description.replace('QRIS: ', ''), amount, accountId })
      : JSON.stringify({ accountId, amount, description });

    const res = await fetch(url, {
      method: 'POST',
      body
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Withdrawal failed');

    set((state) => {
      const accounts = state.accounts.map((a) =>
        a.id === accountId ? { ...a, balance: a.balance - amount } : a,
      );
      const account = accounts.find((a) => a.id === accountId)!;
      const newTx: SavingsTransaction = {
        id: result.data.id,
        accountId,
        userId: user.id,
        type: isQris ? 'qris_payment' : 'withdrawal',
        amount,
        balanceAfter: account.balance,
        description,
        status: 'completed',
        createdAt: result.data.createdAt,
      };
      return { accounts, transactions: [newTx, ...state.transactions] };
    });

    logAudit(user.id, user.fullName, 'SAVINGS', isQris ? 'QRIS_PAYMENT' : 'WITHDRAWAL', `Withdrawal Rp ${amount.toLocaleString('id-ID')} from ${accountId}`, 'success', { accountId, amount });
    
    useNotificationStore.getState().addNotification({
      userId: user.id,
      title: isQris ? 'Pembayaran QRIS Berhasil' : 'Penarikan Berhasil',
      message: `Tarik tunai/pembayaran sebesar Rp ${amount.toLocaleString('id-ID')} berhasil.`,
      type: 'transaction',
    });
  },

  transfer: async (accountId, amount, recipientName, recipientAccount, recipientBank) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('Not authenticated');

    const res = await fetch('/api/v1/business/savings/transfer', {
      method: 'POST',
      body: JSON.stringify({ accountId, amount, recipientName, recipientAccount, recipientBank })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Transfer failed');

    set((state) => {
      const accounts = state.accounts.map((a) =>
        a.id === accountId ? { ...a, balance: a.balance - amount } : a,
      );
      const account = accounts.find((a) => a.id === accountId)!;
      const newTx: SavingsTransaction = {
        id: result.data.id,
        accountId,
        userId: user.id,
        type: 'transfer_out' as TransactionType,
        amount,
        balanceAfter: account.balance,
        description: `Transfer ke ${recipientBank} (${recipientName})`,
        recipientName,
        recipientAccount,
        recipientBank,
        status: 'completed',
        createdAt: result.data.createdAt,
      };
      return { accounts, transactions: [newTx, ...state.transactions] };
    });

    logAudit(user.id, user.fullName, 'SAVINGS', 'TRANSFER_COMPLETED', `Transfer Rp ${amount.toLocaleString('id-ID')} to ${recipientBank} (${recipientName})`, 'success', { accountId, amount, recipientBank });
    
    useNotificationStore.getState().addNotification({
      userId: user.id,
      title: 'Transfer Berhasil',
      message: `Transfer Rp ${amount.toLocaleString('id-ID')} ke ${recipientBank} (${recipientName}) berhasil.`,
      type: 'transaction',
    });
  },
}));

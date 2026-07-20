import { create } from 'zustand';
import type { InsuranceProduct, InsurancePolicy, InsuranceClaim } from '@/types';
import { insuranceProducts, insurancePolicies, insuranceClaims } from '@/data/mockData';
import { useAuthStore } from './authStore';
import { useSavingsStore } from './savingsStore';
import { logAudit } from './auditStore';

interface InsuranceStore {
  products: InsuranceProduct[];
  policies: InsurancePolicy[];
  claims: InsuranceClaim[];
  
  buyInsurance: (productId: string) => Promise<boolean>;
  submitClaim: (policyId: string, type: string, amount: number, description: string) => Promise<boolean>;
}

export const useInsuranceStore = create<InsuranceStore>((set, get) => ({
  products: insuranceProducts,
  policies: insurancePolicies,
  claims: insuranceClaims,
  
  buyInsurance: async (productId) => {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 1000));
    
    const product = get().products.find(p => p.id === productId);
    const user = useAuthStore.getState().user;
    const withdraw = useSavingsStore.getState().withdraw;
    const accounts = useSavingsStore.getState().accounts;
    
    if (!product || !user) return false;
    
    // Find an active savings account
    const activeAccount = accounts.find(a => a.isActive);
    if (!activeAccount) return false;
    
    if (activeAccount.balance < product.premium) return false;
    
    // Deduct money from savings account
    await withdraw(activeAccount.id, product.premium, `Premi ${product.name}`);
    
    // Create new policy
    const newPolicy: InsurancePolicy = {
      id: `POL-NEW-${Date.now()}`,
      userId: user.id,
      productId: product.id,
      productName: product.name,
      type: product.type,
      provider: product.provider,
      policyNumber: `POL-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      premium: product.premium,
      premiumPeriod: product.premiumPeriod,
      maxCoverage: product.maxCoverage,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      status: 'active',
      nextPaymentDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      purchasedAt: new Date().toISOString()
    };
    
    set(state => ({
      policies: [...state.policies, newPolicy]
    }));

    logAudit(
      user.id,
      user.fullName,
      'INSURANCE',
      'INSURANCE_PURCHASED',
      `Purchased insurance policy ${product.name} - Premium Rp ${product.premium.toLocaleString('id-ID')}`,
      'success',
      { policyId: newPolicy.id, productId, premium: product.premium }
    );
    
    return true;
  },

  submitClaim: async (policyId, type, amount, description) => {
    await new Promise((r) => setTimeout(r, 1000));
    const user = useAuthStore.getState().user;
    if (!user) return false;

    const policy = get().policies.find(p => p.id === policyId);
    if (!policy) return false;

    const newClaim: InsuranceClaim = {
      id: `CLM-${Date.now()}`,
      policyId,
      userId: user.id,
      type,
      description,
      amount,
      status: 'submitted',
      documents: ['ktp.jpg', 'bukti_sakit.jpg'],
      submittedAt: new Date().toISOString()
    };

    set(state => ({
      claims: [newClaim, ...state.claims]
    }));

    logAudit(
      user.id,
      user.fullName,
      'INSURANCE',
      'CLAIM_SUBMITTED',
      `Submitted insurance claim for ${policy.productName} - Rp ${amount.toLocaleString('id-ID')}`,
      'success',
      { claimId: newClaim.id, policyId, amount }
    );

    return true;
  }
}));

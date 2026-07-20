import type { User } from '@/types';

export interface DemoUser {
  user: User;
  password: string;
}

export const demoUsers: DemoUser[] = [
  {
    password: 'Customer123!',
    user: {
      id: 'USR-001',
      email: 'budi.santoso@gmail.com',
      phone: '+6281234567890',
      fullName: 'Budi Santoso',
      role: 'customer',
      avatarUrl: undefined,
      kycStatus: 'verified',
      mfaEnabled: true,
      biometricEnabled: true,
      isActive: true,
      createdAt: '2024-03-15T08:00:00Z',
      lastLoginAt: '2026-06-29T07:30:00Z',
    },
  },
  {
    password: 'Customer123!',
    user: {
      id: 'USR-002',
      email: 'siti.rahayu@yahoo.com',
      phone: '+6281298765432',
      fullName: 'Siti Rahayu',
      role: 'customer',
      avatarUrl: undefined,
      kycStatus: 'pending',
      mfaEnabled: false,
      biometricEnabled: false,
      isActive: true,
      createdAt: '2025-01-10T10:00:00Z',
      lastLoginAt: '2026-06-28T14:20:00Z',
    },
  },
  {
    password: 'Support123!',
    user: {
      id: 'USR-003',
      email: 'support@pinjamaja.id',
      phone: '+6281300000001',
      fullName: 'Dewi Lestari',
      role: 'customer_support',
      avatarUrl: undefined,
      kycStatus: 'verified',
      mfaEnabled: true,
      biometricEnabled: false,
      isActive: true,
      createdAt: '2023-06-01T08:00:00Z',
      lastLoginAt: '2026-06-29T08:00:00Z',
    },
  },
  {
    password: 'Verifier123!',
    user: {
      id: 'USR-004',
      email: 'verifier@pinjamaja.id',
      phone: '+6281300000002',
      fullName: 'Ahmad Hidayat',
      role: 'verification_officer',
      avatarUrl: undefined,
      kycStatus: 'verified',
      mfaEnabled: true,
      biometricEnabled: false,
      isActive: true,
      createdAt: '2023-06-01T08:00:00Z',
      lastLoginAt: '2026-06-29T07:45:00Z',
    },
  },
  {
    password: 'Finance123!',
    user: {
      id: 'USR-005',
      email: 'finance@pinjamaja.id',
      phone: '+6281300000003',
      fullName: 'Rina Wulandari',
      role: 'finance_officer',
      avatarUrl: undefined,
      kycStatus: 'verified',
      mfaEnabled: true,
      biometricEnabled: false,
      isActive: true,
      createdAt: '2023-06-01T08:00:00Z',
      lastLoginAt: '2026-06-29T08:15:00Z',
    },
  },
  {
    password: 'Customer123!',
    user: {
      id: 'USR-006',
      email: 'andi.pratama@outlook.com',
      phone: '+6281355667788',
      fullName: 'Andi Pratama',
      role: 'customer',
      avatarUrl: undefined,
      kycStatus: 'unverified',
      mfaEnabled: false,
      biometricEnabled: false,
      isActive: true,
      createdAt: '2026-06-20T12:00:00Z',
      lastLoginAt: '2026-06-28T18:00:00Z',
    },
  },
];

export function findUserByEmail(email: string): DemoUser | undefined {
  return demoUsers.find(u => u.user.email.toLowerCase() === email.toLowerCase());
}

export function getUserById(id: string): User | undefined {
  return demoUsers.find(u => u.user.id === id)?.user;
}

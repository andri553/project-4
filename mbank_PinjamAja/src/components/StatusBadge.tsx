import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusConfig {
  label: string;
  variant: BadgeVariant;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  // Loan statuses
  draft: { label: 'Draft', variant: 'neutral' },
  submitted: { label: 'Diajukan', variant: 'info' },
  reviewing: { label: 'Dalam Review', variant: 'warning' },
  approved: { label: 'Disetujui', variant: 'success' },
  disbursed: { label: 'Dicairkan', variant: 'success' },
  active: { label: 'Aktif', variant: 'success' },
  completed: { label: 'Selesai', variant: 'neutral' },
  rejected: { label: 'Ditolak', variant: 'danger' },
  defaulted: { label: 'Gagal Bayar', variant: 'danger' },
  // Transaction statuses
  pending: { label: 'Menunggu', variant: 'warning' },
  processing: { label: 'Diproses', variant: 'info' },
  failed: { label: 'Gagal', variant: 'danger' },
  reversed: { label: 'Dikembalikan', variant: 'neutral' },
  // KYC statuses
  unverified: { label: 'Belum Verifikasi', variant: 'neutral' },
  verified: { label: 'Terverifikasi', variant: 'success' },
  expired: { label: 'Kadaluarsa', variant: 'danger' },
  // Insurance claim statuses
  paid: { label: 'Dibayar', variant: 'success' },
  // Installment statuses
  upcoming: { label: 'Akan Datang', variant: 'info' },
  overdue: { label: 'Terlambat', variant: 'danger' },
  partial: { label: 'Sebagian', variant: 'warning' },
  // Insurance policy
  cancelled: { label: 'Dibatalkan', variant: 'danger' },
};

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  className?: string;
}

export default function StatusBadge({ status, size = 'sm', className = '' }: StatusBadgeProps) {
  const config = STATUS_MAP[status] || { label: status, variant: 'neutral' as BadgeVariant };

  const variantClasses: Record<BadgeVariant, string> = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    neutral: 'badge-neutral',
  };

  return (
    <span
      className={`badge ${variantClasses[config.variant]} ${className}`}
      style={size === 'md' ? { padding: '4px 14px', fontSize: '13px' } : undefined}
    >
      {config.label}
    </span>
  );
}

// ============================================
// PinjamAJA — Formatting & Helper Utilities
// ============================================

/**
 * Format number as Indonesian Rupiah
 */
export function formatRupiah(amount: number, showPrefix = true): string {
  const formatted = Math.abs(amount)
    .toFixed(0)
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  const sign = amount < 0 ? '-' : '';
  return showPrefix ? `${sign}Rp ${formatted}` : `${sign}${formatted}`;
}

/**
 * Format number as compact (e.g., 1.5jt, 500rb)
 */
export function formatCompact(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}M`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}jt`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}rb`;
  return String(amount);
}

/**
 * Format ISO date string to Indonesian locale
 */
export function formatDate(dateStr: string, style: 'short' | 'long' | 'relative' = 'short'): string {
  const date = new Date(dateStr);
  const now = new Date();

  if (style === 'relative') {
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHrs < 24) return `${diffHrs} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    // Fall through to short format
  }

  if (style === 'long') {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format time from ISO string
 */
export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get initials from a full name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Map transaction type to display label
 */
export function getTransactionLabel(type: string): string {
  const labels: Record<string, string> = {
    deposit: 'Setor Tunai',
    withdrawal: 'Tarik Tunai',
    transfer_in: 'Transfer Masuk',
    transfer_out: 'Transfer Keluar',
    loan_disbursement: 'Pencairan Pinjaman',
    loan_repayment: 'Angsuran Pinjaman',
    qris_payment: 'Pembayaran QRIS',
    insurance_premium: 'Premi Asuransi',
    interest_credit: 'Bunga',
    fee: 'Biaya Admin',
  };
  return labels[type] || type;
}

/**
 * Check if a transaction type is income (adds money)
 */
export function isIncomeTransaction(type: string): boolean {
  return ['deposit', 'transfer_in', 'loan_disbursement', 'interest_credit'].includes(type);
}

/**
 * Country code to flag emoji
 */
export function getCountryFlag(code: string): string {
  const flags: Record<string, string> = {
    ID: '🇮🇩',
    SG: '🇸🇬',
    MY: '🇲🇾',
    TH: '🇹🇭',
  };
  return flags[code] || '🏳️';
}

/**
 * Get greeting based on time of day
 */
export function getGreetingTime(): { text: string; emoji: string } {
  const currentHour = new Date().getHours();
  if (currentHour >= 5 && currentHour < 12) return { text: 'Selamat Pagi', emoji: '☀️' };
  if (currentHour >= 12 && currentHour < 15) return { text: 'Selamat Siang', emoji: '🌤️' };
  if (currentHour >= 15 && currentHour < 18) return { text: 'Selamat Sore', emoji: '🌇' };
  return { text: 'Selamat Malam', emoji: '🌙' };
}

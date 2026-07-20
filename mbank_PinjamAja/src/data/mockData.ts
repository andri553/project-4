import type {
  Profile, LoanProduct, LoanApplication, InstallmentSchedule, CreditScore,
  QRISTransaction, ExchangeRate, InsuranceProduct, InsurancePolicy, InsuranceClaim,
  SavingsAccount, SavingsTransaction, Device, Session, LoginHistory,
  AuditLog, SecurityEvent, Notification, KYCVerification, FAQ,
} from '@/types';

// ============================================
// PROFILES
// ============================================

export const profiles: Profile[] = [
  {
    userId: 'USR-001',
    fullName: 'Budi Santoso',
    nickname: 'Budi',
    dateOfBirth: '1990-05-15',
    gender: 'male',
    placeOfBirth: 'Jakarta',
    motherMaidenName: 'Sari',
    religion: 'Islam',
    maritalStatus: 'married',
    education: 'S1',
    monthlyIncome: 15000000,
    monthlyExpense: 8000000,
    dependents: 2,
    address: {
      street: 'Jl. Sudirman No. 45',
      rt: '003',
      rw: '005',
      kelurahan: 'Senayan',
      kecamatan: 'Kebayoran Baru',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postalCode: '12190',
      country: 'Indonesia',
    },
    employment: {
      status: 'employed',
      companyName: 'PT Tokopedia',
      industry: 'Technology',
      position: 'Senior Software Engineer',
      yearsWorking: 5,
      companyAddress: 'Jl. Casablanca Raya, Jakarta',
      companyPhone: '+62211234567',
    },
    identity: {
      ktpNumber: '3174051505900001',
      ktpName: 'BUDI SANTOSO',
      ktpAddress: 'JL. SUDIRMAN NO. 45, SENAYAN, KEBAYORAN BARU, JAKARTA SELATAN',
      npwpNumber: '12.345.678.9-012.000',
    },
  },
];


// ============================================
// LOAN PRODUCTS
// ============================================

export const loanProducts: LoanProduct[] = [
  {
    id: 'LP-001',
    name: 'PinjamAJA Express',
    description: 'Pinjaman cepat tanpa jaminan untuk kebutuhan mendesak. Dana cair dalam 15 menit.',
    minAmount: 500000,
    maxAmount: 5000000,
    interestRate: 1.5,
    minTenor: 1,
    maxTenor: 6,
    processingFee: 2.5,
    category: 'personal',
    icon: '⚡',
    features: ['Pencairan 15 menit', 'Tanpa jaminan', 'Tenor fleksibel', 'Bunga rendah'],
    requirements: ['KTP valid', 'Usia 21-55 tahun', 'Penghasilan min Rp 3jt/bulan'],
  },
  {
    id: 'LP-002',
    name: 'PinjamAJA Pendidikan',
    description: 'Wujudkan pendidikan berkualitas untuk Anda dan keluarga. Tenor hingga 24 bulan.',
    minAmount: 2000000,
    maxAmount: 30000000,
    interestRate: 0.9,
    minTenor: 3,
    maxTenor: 24,
    processingFee: 1.5,
    category: 'education',
    icon: '🎓',
    features: ['Bunga ringan', 'Tenor panjang', 'Grace period 1 bulan', 'Cashback 2%'],
    requirements: ['KTP valid', 'Bukti pendaftaran/SPP', 'Penghasilan min Rp 4jt/bulan'],
  },
  {
    id: 'LP-003',
    name: 'PinjamAJA Usaha',
    description: 'Modal usaha untuk UMKM Indonesia. Dukung pertumbuhan bisnis Anda.',
    minAmount: 5000000,
    maxAmount: 100000000,
    interestRate: 1.2,
    minTenor: 6,
    maxTenor: 36,
    processingFee: 2.0,
    category: 'business',
    icon: '🏪',
    features: ['Limit besar', 'Tenor panjang', 'Dedicated RM', 'Asuransi kredit'],
    requirements: ['KTP valid', 'SIUP/NIB', 'Laporan keuangan 6 bulan', 'KYC verified'],
  },
  {
    id: 'LP-004',
    name: 'PinjamAJA Medis',
    description: 'Pinjaman khusus untuk kebutuhan medis dan kesehatan keluarga.',
    minAmount: 1000000,
    maxAmount: 50000000,
    interestRate: 0.8,
    minTenor: 3,
    maxTenor: 18,
    processingFee: 1.0,
    category: 'medical',
    icon: '🏥',
    features: ['Bunga terendah', 'Proses cepat', 'Tenor fleksibel', 'Tanpa DP'],
    requirements: ['KTP valid', 'Surat rujukan RS', 'Penghasilan min Rp 3jt/bulan'],
  },
  {
    id: 'LP-005',
    name: 'PinjamAJA Renovasi',
    description: 'Dana renovasi rumah impian Anda. Wujudkan hunian nyaman.',
    minAmount: 10000000,
    maxAmount: 200000000,
    interestRate: 1.0,
    minTenor: 6,
    maxTenor: 48,
    processingFee: 1.5,
    category: 'home_improvement',
    icon: '🏠',
    features: ['Limit jumbo', 'Tenor 4 tahun', 'Bunga kompetitif', 'Proses mudah'],
    requirements: ['KTP valid', 'Sertifikat rumah', 'Slip gaji 3 bulan', 'KYC verified'],
  },
];

// ============================================
// LOAN APPLICATIONS
// ============================================

export const loanApplications: LoanApplication[] = [
  {
    id: 'LA-2024-001',
    userId: 'USR-001',
    productId: 'LP-001',
    productName: 'PinjamAJA Express',
    amount: 3000000,
    tenor: 3,
    purpose: 'Biaya darurat keluarga',
    interestRate: 1.5,
    monthlyInstallment: 1045000,
    totalRepayment: 3135000,
    status: 'completed',
    disbursedAmount: 2925000,
    disbursedAt: '2024-08-01T09:00:00Z',
    appliedAt: '2024-07-30T14:00:00Z',
    updatedAt: '2024-11-01T00:00:00Z',
  },
  {
    id: 'LA-2025-002',
    userId: 'USR-001',
    productId: 'LP-002',
    productName: 'PinjamAJA Pendidikan',
    amount: 15000000,
    tenor: 12,
    purpose: 'Biaya kuliah semester 5',
    interestRate: 0.9,
    monthlyInstallment: 1385000,
    totalRepayment: 16620000,
    status: 'active',
    disbursedAmount: 14775000,
    disbursedAt: '2025-08-15T10:00:00Z',
    appliedAt: '2025-08-10T08:00:00Z',
    updatedAt: '2026-06-29T00:00:00Z',
  },
  {
    id: 'LA-2026-003',
    userId: 'USR-001',
    productId: 'LP-003',
    productName: 'PinjamAJA Usaha',
    amount: 50000000,
    tenor: 24,
    purpose: 'Modal buka cabang toko',
    interestRate: 1.2,
    monthlyInstallment: 2683000,
    totalRepayment: 64392000,
    status: 'reviewing',
    appliedAt: '2026-06-25T11:00:00Z',
    updatedAt: '2026-06-28T15:00:00Z',
  },
];

export const creditScores: Record<string, CreditScore> = {
  'USR-001': {
    score: 780,
    grade: 'A',
    factors: [
      { name: 'Payment History', impact: 'positive', detail: 'Semua angsuran tepat waktu selama 18 bulan' },
      { name: 'Credit Utilization', impact: 'positive', detail: 'Penggunaan kredit 25% dari limit' },
      { name: 'Account Age', impact: 'positive', detail: 'Rekening aktif selama 2+ tahun' },
      { name: 'Income Stability', impact: 'positive', detail: 'Penghasilan stabil dari pekerjaan tetap' },
      { name: 'Debt to Income', impact: 'neutral', detail: 'Rasio utang terhadap penghasilan 35%' },
    ],
    assessedAt: '2026-06-25T11:00:00Z',
  },
};

export const installmentSchedules: Record<string, InstallmentSchedule[]> = {
  'LA-2025-002': [
    { installmentNo: 1, dueDate: '2025-09-15', principalAmount: 1250000, interestAmount: 135000, totalAmount: 1385000, status: 'paid', paidAt: '2025-09-14T10:00:00Z', paidAmount: 1385000 },
    { installmentNo: 2, dueDate: '2025-10-15', principalAmount: 1250000, interestAmount: 135000, totalAmount: 1385000, status: 'paid', paidAt: '2025-10-15T08:00:00Z', paidAmount: 1385000 },
    { installmentNo: 3, dueDate: '2025-11-15', principalAmount: 1250000, interestAmount: 135000, totalAmount: 1385000, status: 'paid', paidAt: '2025-11-14T09:00:00Z', paidAmount: 1385000 },
    { installmentNo: 4, dueDate: '2025-12-15', principalAmount: 1250000, interestAmount: 135000, totalAmount: 1385000, status: 'paid', paidAt: '2025-12-15T07:00:00Z', paidAmount: 1385000 },
    { installmentNo: 5, dueDate: '2026-01-15', principalAmount: 1250000, interestAmount: 135000, totalAmount: 1385000, status: 'paid', paidAt: '2026-01-15T10:00:00Z', paidAmount: 1385000 },
    { installmentNo: 6, dueDate: '2026-02-15', principalAmount: 1250000, interestAmount: 135000, totalAmount: 1385000, status: 'paid', paidAt: '2026-02-14T09:00:00Z', paidAmount: 1385000 },
    { installmentNo: 7, dueDate: '2026-03-15', principalAmount: 1250000, interestAmount: 135000, totalAmount: 1385000, status: 'paid', paidAt: '2026-03-15T08:00:00Z', paidAmount: 1385000 },
    { installmentNo: 8, dueDate: '2026-04-15', principalAmount: 1250000, interestAmount: 135000, totalAmount: 1385000, status: 'paid', paidAt: '2026-04-15T09:00:00Z', paidAmount: 1385000 },
    { installmentNo: 9, dueDate: '2026-05-15', principalAmount: 1250000, interestAmount: 135000, totalAmount: 1385000, status: 'paid', paidAt: '2026-05-14T10:00:00Z', paidAmount: 1385000 },
    { installmentNo: 10, dueDate: '2026-06-15', principalAmount: 1250000, interestAmount: 135000, totalAmount: 1385000, status: 'paid', paidAt: '2026-06-15T08:00:00Z', paidAmount: 1385000 },
    { installmentNo: 11, dueDate: '2026-07-15', principalAmount: 1250000, interestAmount: 135000, totalAmount: 1385000, status: 'upcoming' },
    { installmentNo: 12, dueDate: '2026-08-15', principalAmount: 1250000, interestAmount: 135000, totalAmount: 1385000, status: 'upcoming' },
  ],
};

// ============================================
// QRIS TRANSACTIONS
// ============================================

export const exchangeRates: ExchangeRate[] = [
  { from: 'IDR', to: 'SGD', rate: 0.000082, lastUpdated: '2026-06-29T08:00:00Z' },
  { from: 'IDR', to: 'MYR', rate: 0.00028, lastUpdated: '2026-06-29T08:00:00Z' },
  { from: 'IDR', to: 'THB', rate: 0.0022, lastUpdated: '2026-06-29T08:00:00Z' },
  { from: 'SGD', to: 'IDR', rate: 12195, lastUpdated: '2026-06-29T08:00:00Z' },
  { from: 'MYR', to: 'IDR', rate: 3571, lastUpdated: '2026-06-29T08:00:00Z' },
  { from: 'THB', to: 'IDR', rate: 454, lastUpdated: '2026-06-29T08:00:00Z' },
];

export const qrisTransactions: QRISTransaction[] = [
  {
    id: 'QRIS-001',
    userId: 'USR-001',
    merchantName: 'Kopitiam Singapore',
    merchantId: 'MCH-SG-001',
    country: 'SG',
    countryName: 'Singapore',
    originalAmount: 12.5,
    originalCurrency: 'SGD',
    convertedAmount: 152437,
    convertedCurrency: 'IDR',
    exchangeRate: 12195,
    fee: 2500,
    totalAmount: 154937,
    status: 'completed',
    createdAt: '2026-06-28T12:30:00Z',
  },
  {
    id: 'QRIS-002',
    userId: 'USR-001',
    merchantName: 'Petronas Mesra',
    merchantId: 'MCH-MY-001',
    country: 'MY',
    countryName: 'Malaysia',
    originalAmount: 85.0,
    originalCurrency: 'MYR',
    convertedAmount: 303535,
    convertedCurrency: 'IDR',
    exchangeRate: 3571,
    fee: 5000,
    totalAmount: 308535,
    status: 'completed',
    createdAt: '2026-06-20T15:00:00Z',
  },
  {
    id: 'QRIS-003',
    userId: 'USR-001',
    merchantName: 'CentralWorld Bangkok',
    merchantId: 'MCH-TH-001',
    country: 'TH',
    countryName: 'Thailand',
    originalAmount: 1500,
    originalCurrency: 'THB',
    convertedAmount: 681000,
    convertedCurrency: 'IDR',
    exchangeRate: 454,
    fee: 10000,
    totalAmount: 691000,
    status: 'completed',
    createdAt: '2026-06-10T18:00:00Z',
  },
  {
    id: 'QRIS-004',
    userId: 'USR-001',
    merchantName: 'Changi Airport Duty Free',
    merchantId: 'MCH-SG-002',
    country: 'SG',
    countryName: 'Singapore',
    originalAmount: 45.0,
    originalCurrency: 'SGD',
    convertedAmount: 548775,
    convertedCurrency: 'IDR',
    exchangeRate: 12195,
    fee: 7500,
    totalAmount: 556275,
    status: 'completed',
    createdAt: '2026-05-28T10:00:00Z',
  },
  {
    id: 'QRIS-005',
    userId: 'USR-001',
    merchantName: 'Siam Paragon',
    merchantId: 'MCH-TH-002',
    country: 'TH',
    countryName: 'Thailand',
    originalAmount: 800,
    originalCurrency: 'THB',
    convertedAmount: 363200,
    convertedCurrency: 'IDR',
    exchangeRate: 454,
    fee: 5000,
    totalAmount: 368200,
    status: 'pending',
    createdAt: '2026-06-29T07:00:00Z',
  },
];

// ============================================
// INSURANCE
// ============================================

export const insuranceProducts: InsuranceProduct[] = [
  {
    id: 'INS-P-001',
    name: 'PinjamAJA Health Guard',
    type: 'health',
    provider: 'PT Asuransi Jiwasraya',
    description: 'Perlindungan kesehatan komprehensif untuk rawat inap, rawat jalan, dan operasi.',
    coverage: ['Rawat Inap', 'Rawat Jalan', 'Operasi', 'ICU', 'Obat-obatan'],
    premium: 75000,
    premiumPeriod: 'monthly',
    maxCoverage: 100000000,
    minAge: 18,
    maxAge: 65,
    features: ['Cashless di 500+ RS', 'Klaim online', 'No waiting period', 'Termasuk COVID-19'],
    icon: '🏥',
  },
  {
    id: 'INS-P-002',
    name: 'PinjamAJA Travel Safe',
    type: 'travel',
    provider: 'PT AXA Mandiri',
    description: 'Proteksi perjalanan internasional termasuk ASEAN, Asia, dan seluruh dunia.',
    coverage: ['Kecelakaan perjalanan', 'Bagasi hilang', 'Keterlambatan penerbangan', 'Evakuasi medis', 'Tanggung jawab hukum'],
    premium: 25000,
    premiumPeriod: 'monthly',
    maxCoverage: 500000000,
    minAge: 18,
    maxAge: 70,
    features: ['Cover 195+ negara', 'E-policy instan', 'Klaim 24 jam', 'Free airport lounge'],
    icon: '✈️',
  },
  {
    id: 'INS-P-003',
    name: 'PinjamAJA Device Protect',
    type: 'device',
    provider: 'PT Zurich Insurance',
    description: 'Lindungi smartphone dan gadget Anda dari kerusakan, kehilangan, dan pencurian.',
    coverage: ['Kerusakan layar', 'Kerusakan air', 'Pencurian', 'Kerusakan mekanis'],
    premium: 35000,
    premiumPeriod: 'monthly',
    maxCoverage: 15000000,
    minAge: 18,
    maxAge: 65,
    features: ['Klaim mudah via app', 'Perbaikan di authorized center', 'Penggantian unit', 'Cover accessories'],
    icon: '📱',
  },
  {
    id: 'INS-P-004',
    name: 'PinjamAJA Life Plus',
    type: 'life',
    provider: 'PT Prudential Life',
    description: 'Asuransi jiwa untuk perlindungan keluarga tercinta dengan manfaat investasi.',
    coverage: ['Meninggal dunia', 'Cacat tetap total', 'Penyakit kritis', 'Santunan rumah sakit'],
    premium: 150000,
    premiumPeriod: 'monthly',
    maxCoverage: 1000000000,
    minAge: 18,
    maxAge: 60,
    features: ['Unit link investasi', 'Rider penyakit kritis', 'Pembebasan premi', 'Bonus loyalitas'],
    icon: '🛡️',
  },
];

export const insurancePolicies: InsurancePolicy[] = [
  {
    id: 'POL-001',
    userId: 'USR-001',
    productId: 'INS-P-001',
    productName: 'PinjamAJA Health Guard',
    type: 'health',
    provider: 'PT Asuransi Jiwasraya',
    policyNumber: 'HG-2025-001234',
    premium: 75000,
    premiumPeriod: 'monthly',
    maxCoverage: 100000000,
    startDate: '2025-01-01',
    endDate: '2026-12-31',
    status: 'active',
    nextPaymentDate: '2026-07-01',
    purchasedAt: '2025-01-01T08:00:00Z',
  },
  {
    id: 'POL-002',
    userId: 'USR-001',
    productId: 'INS-P-003',
    productName: 'PinjamAJA Device Protect',
    type: 'device',
    provider: 'PT Zurich Insurance',
    policyNumber: 'DP-2026-005678',
    premium: 35000,
    premiumPeriod: 'monthly',
    maxCoverage: 15000000,
    startDate: '2026-03-01',
    endDate: '2027-02-28',
    status: 'active',
    nextPaymentDate: '2026-07-01',
    purchasedAt: '2026-03-01T10:00:00Z',
  },
];

export const insuranceClaims: InsuranceClaim[] = [
  {
    id: 'CLM-001',
    policyId: 'POL-001',
    userId: 'USR-001',
    type: 'Rawat Jalan',
    description: 'Konsultasi dokter spesialis THT di RS Pondok Indah',
    amount: 850000,
    status: 'approved',
    documents: ['receipt.pdf', 'medical_report.pdf'],
    submittedAt: '2026-05-15T14:00:00Z',
    resolvedAt: '2026-05-17T10:00:00Z',
    approvedAmount: 850000,
  },
  {
    id: 'CLM-002',
    policyId: 'POL-002',
    userId: 'USR-001',
    type: 'Kerusakan layar',
    description: 'Layar iPhone 15 Pro retak karena terjatuh',
    amount: 3500000,
    status: 'reviewing',
    documents: ['photo_damage.jpg', 'purchase_receipt.pdf'],
    submittedAt: '2026-06-27T09:00:00Z',
  },
];

// ============================================
// SAVINGS
// ============================================

export const savingsAccounts: SavingsAccount[] = [
  {
    id: 'SAV-001',
    userId: 'USR-001',
    accountNumber: '7890-1234-5678',
    accountName: 'Tabungan Utama',
    balance: 24750000,
    interestRate: 3.5,
    accountType: 'regular',
    isActive: true,
    createdAt: '2024-03-15T08:00:00Z',
  },
  {
    id: 'SAV-002',
    userId: 'USR-001',
    accountNumber: '7890-1234-9012',
    accountName: 'Dana Darurat',
    balance: 50000000,
    interestRate: 4.5,
    accountType: 'premium',
    isActive: true,
    createdAt: '2024-06-01T10:00:00Z',
  },
  {
    id: 'SAV-003',
    userId: 'USR-001',
    accountNumber: '7890-1234-3456',
    accountName: 'Liburan Jepang 2027',
    balance: 8500000,
    interestRate: 4.0,
    accountType: 'goal',
    goalName: 'Liburan Jepang',
    goalTarget: 25000000,
    isActive: true,
    createdAt: '2026-01-15T08:00:00Z',
  },
];

export const savingsTransactions: SavingsTransaction[] = [
  { id: 'ST-001', accountId: 'SAV-001', userId: 'USR-001', type: 'deposit', amount: 5000000, balanceAfter: 24750000, description: 'Setor tunai via ATM', status: 'completed', createdAt: '2026-06-28T10:00:00Z' },
  { id: 'ST-002', accountId: 'SAV-001', userId: 'USR-001', type: 'transfer_out', amount: 1500000, balanceAfter: 19750000, description: 'Transfer ke BCA', recipientName: 'Agus Suryanto', recipientAccount: '1234567890', recipientBank: 'BCA', status: 'completed', createdAt: '2026-06-27T14:30:00Z' },
  { id: 'ST-003', accountId: 'SAV-001', userId: 'USR-001', type: 'transfer_in', amount: 2000000, balanceAfter: 21750000, description: 'Transfer masuk dari Mandiri', status: 'completed', createdAt: '2026-06-26T09:00:00Z' },
  { id: 'ST-004', accountId: 'SAV-001', userId: 'USR-001', type: 'loan_repayment', amount: 1385000, balanceAfter: 20365000, description: 'Angsuran PinjamAJA Pendidikan #10', reference: 'LA-2025-002', status: 'completed', createdAt: '2026-06-15T08:00:00Z' },
  { id: 'ST-005', accountId: 'SAV-001', userId: 'USR-001', type: 'qris_payment', amount: 154937, balanceAfter: 20210063, description: 'QRIS Payment - Kopitiam Singapore', reference: 'QRIS-001', status: 'completed', createdAt: '2026-06-28T12:30:00Z' },
  { id: 'ST-006', accountId: 'SAV-002', userId: 'USR-001', type: 'interest_credit', amount: 187500, balanceAfter: 50187500, description: 'Bunga bulanan Juni 2026', status: 'completed', createdAt: '2026-06-30T00:00:00Z' },
  { id: 'ST-007', accountId: 'SAV-001', userId: 'USR-001', type: 'insurance_premium', amount: 110000, balanceAfter: 20100063, description: 'Premi Health Guard + Device Protect', status: 'completed', createdAt: '2026-06-01T08:00:00Z' },
  { id: 'ST-008', accountId: 'SAV-003', userId: 'USR-001', type: 'deposit', amount: 1500000, balanceAfter: 8500000, description: 'Nabung untuk liburan Jepang', status: 'completed', createdAt: '2026-06-25T12:00:00Z' },
  { id: 'ST-009', accountId: 'SAV-001', userId: 'USR-001', type: 'withdrawal', amount: 500000, balanceAfter: 19600063, description: 'Tarik tunai ATM Mandiri', status: 'completed', createdAt: '2026-06-22T16:00:00Z' },
  { id: 'ST-010', accountId: 'SAV-001', userId: 'USR-001', type: 'deposit', amount: 15000000, balanceAfter: 34600063, description: 'Gaji bulanan Juni 2026', status: 'completed', createdAt: '2026-06-25T08:00:00Z' },
];

// ============================================
// DEVICES & SESSIONS
// ============================================

export const devices: Device[] = [
  {
    id: 'DEV-001',
    userId: 'USR-001',
    deviceName: 'iPhone 15 Pro',
    deviceType: 'mobile',
    os: 'iOS 18.2',
    browser: 'Safari',
    ipAddress: '180.244.123.45',
    location: 'Jakarta, Indonesia',
    isTrusted: true,
    isCurrentDevice: true,
    lastActiveAt: '2026-06-29T07:30:00Z',
    registeredAt: '2024-03-15T08:00:00Z',
  },
  {
    id: 'DEV-002',
    userId: 'USR-001',
    deviceName: 'MacBook Pro 14"',
    deviceType: 'desktop',
    os: 'macOS Sequoia 15.2',
    browser: 'Chrome 128',
    ipAddress: '180.244.123.46',
    location: 'Jakarta, Indonesia',
    isTrusted: true,
    isCurrentDevice: false,
    lastActiveAt: '2026-06-28T18:00:00Z',
    registeredAt: '2024-05-10T10:00:00Z',
  },
  {
    id: 'DEV-003',
    userId: 'USR-001',
    deviceName: 'Samsung Galaxy Tab S9',
    deviceType: 'tablet',
    os: 'Android 15',
    browser: 'Chrome 128',
    ipAddress: '36.72.89.12',
    location: 'Bandung, Indonesia',
    isTrusted: false,
    isCurrentDevice: false,
    lastActiveAt: '2026-06-20T14:00:00Z',
    registeredAt: '2026-06-20T14:00:00Z',
  },
];

export const sessions: Session[] = [
  {
    id: 'SESS-001',
    userId: 'USR-001',
    deviceId: 'DEV-001',
    deviceName: 'iPhone 15 Pro',
    ipAddress: '180.244.123.45',
    location: 'Jakarta, Indonesia',
    isActive: true,
    createdAt: '2026-06-29T07:30:00Z',
    expiresAt: '2026-06-29T19:30:00Z',
    lastActivityAt: '2026-06-29T08:00:00Z',
  },
  {
    id: 'SESS-002',
    userId: 'USR-001',
    deviceId: 'DEV-002',
    deviceName: 'MacBook Pro 14"',
    ipAddress: '180.244.123.46',
    location: 'Jakarta, Indonesia',
    isActive: true,
    createdAt: '2026-06-28T09:00:00Z',
    expiresAt: '2026-06-28T21:00:00Z',
    lastActivityAt: '2026-06-28T18:00:00Z',
  },
];

export const loginHistory: LoginHistory[] = [
  { id: 'LH-001', userId: 'USR-001', deviceName: 'iPhone 15 Pro', ipAddress: '180.244.123.45', location: 'Jakarta, Indonesia', status: 'success', method: 'biometric', createdAt: '2026-06-29T07:30:00Z' },
  { id: 'LH-002', userId: 'USR-001', deviceName: 'MacBook Pro 14"', ipAddress: '180.244.123.46', location: 'Jakarta, Indonesia', status: 'success', method: 'password', createdAt: '2026-06-28T09:00:00Z' },
  { id: 'LH-003', userId: 'USR-001', deviceName: 'Unknown Device', ipAddress: '103.28.45.89', location: 'Surabaya, Indonesia', status: 'failed', failReason: 'Invalid password', method: 'password', createdAt: '2026-06-27T22:00:00Z' },
  { id: 'LH-004', userId: 'USR-001', deviceName: 'iPhone 15 Pro', ipAddress: '180.244.123.45', location: 'Jakarta, Indonesia', status: 'success', method: 'mfa', createdAt: '2026-06-27T08:00:00Z' },
  { id: 'LH-005', userId: 'USR-001', deviceName: 'Samsung Galaxy Tab S9', ipAddress: '36.72.89.12', location: 'Bandung, Indonesia', status: 'success', method: 'password', createdAt: '2026-06-20T14:00:00Z' },
  { id: 'LH-006', userId: 'USR-001', deviceName: 'Unknown Device', ipAddress: '45.127.12.34', location: 'Singapore', status: 'failed', failReason: 'Account locked - too many attempts', method: 'password', createdAt: '2026-06-18T03:00:00Z' },
];

// ============================================
// AUDIT LOGS
// ============================================

export const auditLogs: AuditLog[] = [
  { id: 'AUD-001', userId: 'USR-001', userName: 'Budi Santoso', category: 'AUTH', action: 'LOGIN_SUCCESS', description: 'User logged in via biometric authentication', ipAddress: '180.244.123.45', deviceInfo: 'iPhone 15 Pro / iOS 18.2', status: 'success', createdAt: '2026-06-29T07:30:00Z' },
  { id: 'AUD-002', userId: 'USR-001', userName: 'Budi Santoso', category: 'SAVINGS', action: 'DEPOSIT', description: 'Deposit Rp 5.000.000 to Tabungan Utama', ipAddress: '180.244.123.45', deviceInfo: 'iPhone 15 Pro / iOS 18.2', status: 'success', createdAt: '2026-06-28T10:00:00Z', metadata: { accountId: 'SAV-001', amount: 5000000 } },
  { id: 'AUD-003', userId: 'USR-001', userName: 'Budi Santoso', category: 'QRIS', action: 'QRIS_PAYMENT', description: 'QRIS payment to Kopitiam Singapore (SGD 12.50)', ipAddress: '180.244.123.45', deviceInfo: 'iPhone 15 Pro / iOS 18.2', status: 'success', createdAt: '2026-06-28T12:30:00Z', metadata: { transactionId: 'QRIS-001', country: 'SG' } },
  { id: 'AUD-004', userId: 'USR-001', userName: 'Budi Santoso', category: 'SAVINGS', action: 'TRANSFER_OUT', description: 'Transfer Rp 1.500.000 to BCA (Agus Suryanto)', ipAddress: '180.244.123.45', deviceInfo: 'iPhone 15 Pro / iOS 18.2', status: 'success', createdAt: '2026-06-27T14:30:00Z' },
  { id: 'AUD-005', userId: 'USR-001', userName: 'Budi Santoso', category: 'AUTH', action: 'LOGIN_FAILURE', description: 'Failed login attempt from unknown device', ipAddress: '103.28.45.89', deviceInfo: 'Unknown Device', status: 'failure', createdAt: '2026-06-27T22:00:00Z' },
  { id: 'AUD-006', userId: 'USR-001', userName: 'Budi Santoso', category: 'LOAN', action: 'LOAN_APPLICATION', description: 'Applied for PinjamAJA Usaha - Rp 50.000.000', ipAddress: '180.244.123.45', deviceInfo: 'iPhone 15 Pro / iOS 18.2', status: 'success', createdAt: '2026-06-25T11:00:00Z', metadata: { loanId: 'LA-2026-003', amount: 50000000 } },
  { id: 'AUD-007', userId: 'USR-001', userName: 'Budi Santoso', category: 'INSURANCE', action: 'CLAIM_SUBMISSION', description: 'Submitted insurance claim for screen damage', ipAddress: '180.244.123.45', deviceInfo: 'iPhone 15 Pro / iOS 18.2', status: 'success', createdAt: '2026-06-27T09:00:00Z', metadata: { claimId: 'CLM-002' } },
  { id: 'AUD-008', userId: 'USR-001', userName: 'Budi Santoso', category: 'LOAN', action: 'LOAN_REPAYMENT', description: 'Installment payment #10 for PinjamAJA Pendidikan', ipAddress: '180.244.123.45', deviceInfo: 'iPhone 15 Pro / iOS 18.2', status: 'success', createdAt: '2026-06-15T08:00:00Z' },
  { id: 'AUD-009', userId: 'USR-001', userName: 'Budi Santoso', category: 'PROFILE', action: 'PROFILE_UPDATE', description: 'Updated employment information', ipAddress: '180.244.123.46', deviceInfo: 'MacBook Pro 14" / Chrome 128', status: 'success', createdAt: '2026-06-10T15:00:00Z' },
  { id: 'AUD-010', userId: 'USR-001', userName: 'Budi Santoso', category: 'SECURITY', action: 'PASSWORD_CHANGE', description: 'Password changed successfully', ipAddress: '180.244.123.45', deviceInfo: 'iPhone 15 Pro / iOS 18.2', status: 'success', createdAt: '2026-06-05T09:00:00Z' },
  { id: 'AUD-011', userId: 'USR-002', userName: 'Siti Rahayu', category: 'KYC', action: 'KTP_UPLOAD', description: 'Uploaded KTP for identity verification', ipAddress: '103.55.67.89', deviceInfo: 'Samsung Galaxy A54 / Android 14', status: 'success', createdAt: '2026-06-28T09:00:00Z' },
  { id: 'AUD-012', userId: 'USR-001', userName: 'Budi Santoso', category: 'SECURITY', action: 'DEVICE_REGISTERED', description: 'New device Samsung Galaxy Tab S9 registered', ipAddress: '36.72.89.12', deviceInfo: 'Samsung Galaxy Tab S9 / Android 15', status: 'success', createdAt: '2026-06-20T14:00:00Z' },
];

// ============================================
// SECURITY EVENTS
// ============================================

export const securityEvents: SecurityEvent[] = [
  { id: 'SE-001', userId: 'USR-001', userName: 'Budi Santoso', eventType: 'LOGIN_FAILURE', severity: 'medium', description: 'Failed login attempt from unknown IP in Surabaya', sourceIp: '103.28.45.89', deviceInfo: 'Unknown Device', resolved: true, createdAt: '2026-06-27T22:00:00Z' },
  { id: 'SE-002', userId: 'USR-001', userName: 'Budi Santoso', eventType: 'NEW_DEVICE_LOGIN', severity: 'low', description: 'Login from new device Samsung Galaxy Tab S9 in Bandung', sourceIp: '36.72.89.12', deviceInfo: 'Samsung Galaxy Tab S9', resolved: true, createdAt: '2026-06-20T14:00:00Z' },
  { id: 'SE-003', userId: 'USR-001', userName: 'Budi Santoso', eventType: 'BRUTE_FORCE_ATTEMPT', severity: 'high', description: 'Multiple failed login attempts detected from Singapore IP', sourceIp: '45.127.12.34', deviceInfo: 'Unknown', resolved: true, createdAt: '2026-06-18T03:00:00Z' },
  { id: 'SE-004', userId: 'USR-001', userName: 'Budi Santoso', eventType: 'PASSWORD_CHANGED', severity: 'low', description: 'User changed account password', sourceIp: '180.244.123.45', deviceInfo: 'iPhone 15 Pro', resolved: true, createdAt: '2026-06-05T09:00:00Z' },
  { id: 'SE-005', userId: 'USR-001', userName: 'Budi Santoso', eventType: 'LARGE_TRANSACTION', severity: 'medium', description: 'Cross-border QRIS payment exceeding Rp 500.000 threshold', sourceIp: '180.244.123.45', deviceInfo: 'iPhone 15 Pro', resolved: false, createdAt: '2026-06-28T12:30:00Z', metadata: { transactionId: 'QRIS-004', amount: 556275 } },
];

// ============================================
// NOTIFICATIONS
// ============================================

export const notifications: Notification[] = [
  { id: 'NOTIF-001', userId: 'USR-001', type: 'transaction', title: 'Pembayaran QRIS Berhasil', message: 'Pembayaran ke Kopitiam Singapore sebesar SGD 12.50 (Rp 154.937) berhasil.', isRead: false, createdAt: '2026-06-28T12:30:00Z' },
  { id: 'NOTIF-002', userId: 'USR-001', type: 'loan', title: 'Pengajuan Pinjaman Diterima', message: 'Pengajuan pinjaman PinjamAJA Usaha sebesar Rp 50.000.000 sedang dalam proses review.', isRead: false, createdAt: '2026-06-25T11:05:00Z' },
  { id: 'NOTIF-003', userId: 'USR-001', type: 'security', title: 'Percobaan Login Gagal', message: 'Terdeteksi percobaan login dari perangkat tidak dikenal di Surabaya. Jika bukan Anda, segera ubah password.', isRead: true, createdAt: '2026-06-27T22:01:00Z' },
  { id: 'NOTIF-004', userId: 'USR-001', type: 'push', title: 'Promo: Asuransi Travel Diskon 50%', message: 'Dapatkan diskon 50% untuk PinjamAJA Travel Safe! Berlaku hingga 30 Juni 2026.', isRead: true, createdAt: '2026-06-20T08:00:00Z' },
  { id: 'NOTIF-005', userId: 'USR-001', type: 'loan', title: 'Angsuran Jatuh Tempo', message: 'Angsuran ke-11 PinjamAJA Pendidikan sebesar Rp 1.385.000 jatuh tempo 15 Juli 2026.', isRead: false, createdAt: '2026-06-29T06:00:00Z' },
  { id: 'NOTIF-006', userId: 'USR-001', type: 'security', title: 'Perangkat Baru Terdaftar', message: 'Samsung Galaxy Tab S9 telah ditambahkan sebagai perangkat terpercaya.', isRead: true, createdAt: '2026-06-20T14:01:00Z' },
  { id: 'NOTIF-007', userId: 'USR-001', type: 'transaction', title: 'Transfer Berhasil', message: 'Transfer Rp 1.500.000 ke BCA (Agus Suryanto) berhasil dilakukan.', isRead: true, createdAt: '2026-06-27T14:31:00Z' },
  { id: 'NOTIF-008', userId: 'USR-001', type: 'push', title: 'Gaji Masuk!', message: 'Setor Rp 15.000.000 ke Tabungan Utama berhasil. Saldo saat ini: Rp 34.600.063.', isRead: true, createdAt: '2026-06-25T08:01:00Z' },
  { id: 'NOTIF-009', userId: 'USR-001', type: 'otp', title: 'Kode OTP', message: 'Kode OTP Anda: 847291. Berlaku 5 menit. Jangan berikan kode ini kepada siapapun.', isRead: true, createdAt: '2026-06-25T10:58:00Z' },
  { id: 'NOTIF-010', userId: 'USR-001', type: 'push', title: 'Klaim Asuransi Diproses', message: 'Klaim kerusakan layar Anda sedang ditinjau oleh tim asuransi.', isRead: false, createdAt: '2026-06-27T09:05:00Z' },
];

// ============================================
// FAQ
// ============================================

export const faqs: FAQ[] = [
  { id: 'FAQ-001', category: 'Akun', question: 'Bagaimana cara mendaftar akun PinjamAJA?', answer: 'Unduh aplikasi PinjamAJA, klik "Daftar", masukkan nomor HP dan email, lalu ikuti langkah verifikasi identitas (e-KYC).' },
  { id: 'FAQ-002', category: 'Akun', question: 'Lupa password, bagaimana cara reset?', answer: 'Klik "Lupa Password" di halaman login, masukkan email terdaftar, lalu ikuti instruksi di email untuk membuat password baru.' },
  { id: 'FAQ-003', category: 'Pinjaman', question: 'Berapa lama proses pencairan pinjaman?', answer: 'PinjamAJA Express dapat cair dalam 15 menit. Pinjaman lain membutuhkan 1-3 hari kerja setelah disetujui.' },
  { id: 'FAQ-004', category: 'Pinjaman', question: 'Apa saja syarat pengajuan pinjaman?', answer: 'Syarat umum: KTP valid, usia 21-55 tahun, memiliki penghasilan tetap, dan sudah verifikasi KYC.' },
  { id: 'FAQ-005', category: 'QRIS', question: 'Negara mana saja yang mendukung QRIS lintas negara?', answer: 'Saat ini PinjamAJA mendukung pembayaran QRIS di Singapore, Malaysia, dan Thailand.' },
  { id: 'FAQ-006', category: 'QRIS', question: 'Berapa biaya transaksi QRIS internasional?', answer: 'Biaya bervariasi antara Rp 2.500 - Rp 10.000 tergantung nilai transaksi dan negara tujuan.' },
  { id: 'FAQ-007', category: 'Asuransi', question: 'Bagaimana cara klaim asuransi?', answer: 'Buka menu Asuransi > Polis Aktif > Ajukan Klaim. Unggah dokumen pendukung dan tunggu proses review 2-3 hari kerja.' },
  { id: 'FAQ-008', category: 'Keamanan', question: 'Apakah data saya aman di PinjamAJA?', answer: 'PinjamAJA menggunakan enkripsi end-to-end, MFA, dan mematuhi regulasi OJK serta UU Perlindungan Data Pribadi (UU PDP).' },
  { id: 'FAQ-009', category: 'Tabungan', question: 'Berapa suku bunga tabungan PinjamAJA?', answer: 'Tabungan reguler: 3.5% p.a., Premium: 4.5% p.a., Goal Savings: 4.0% p.a. Bunga dihitung harian dan dibayar bulanan.' },
  { id: 'FAQ-010', category: 'Tabungan', question: 'Apakah bisa transfer ke bank lain?', answer: 'Ya, PinjamAJA mendukung transfer ke semua bank di Indonesia via BI-FAST dengan biaya Rp 2.500 per transaksi.' },
];

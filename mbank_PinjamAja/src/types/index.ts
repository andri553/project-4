// ============================================
// PinjamAJA Core Platform — Type Definitions
// ============================================

// ---- Enums ----

export type UserRole = 'customer' | 'customer_support' | 'verification_officer' | 'finance_officer';

export type KYCStatus = 'unverified' | 'pending' | 'in_progress' | 'pending_review' | 'verified' | 'rejected' | 'expired' | 'reupload_required' | 'suspended';

export type LoanStatus = 'draft' | 'submitted' | 'reviewing' | 'approved' | 'disbursed' | 'active' | 'completed' | 'rejected' | 'defaulted';

export type TransactionType = 'deposit' | 'withdrawal' | 'transfer_in' | 'transfer_out' | 'loan_disbursement' | 'loan_repayment' | 'qris_payment' | 'insurance_premium' | 'interest_credit' | 'fee';

export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'reversed';

export type InsuranceType = 'health' | 'travel' | 'device' | 'life' | 'accident';

export type ClaimStatus = 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'paid';

export type NotificationType = 'push' | 'otp' | 'security' | 'loan' | 'transaction' | 'promo';

export type AuditCategory = 'AUTH' | 'PROFILE' | 'KYC' | 'LOAN' | 'QRIS' | 'INSURANCE' | 'SAVINGS' | 'SECURITY' | 'NOTIFICATION' | 'SYSTEM';

export type SecurityEventSeverity = 'low' | 'medium' | 'high' | 'critical';

export type QRISCountry = 'ID' | 'SG' | 'MY' | 'TH';

// ---- User & Auth ----

export interface User {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  kycStatus: KYCStatus;
  mfaEnabled: boolean;
  biometricEnabled: boolean;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

// ---- Profile ----

export interface Profile {
  userId: string;
  fullName: string;
  nickname?: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  placeOfBirth: string;
  motherMaidenName: string;
  religion: string;
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  education: string;
  address: Address;
  employment: Employment;
  identity: IdentityDoc;
  monthlyIncome: number;
  monthlyExpense: number;
  dependents: number;
}

export interface Address {
  street: string;
  rt: string;
  rw: string;
  kelurahan: string;
  kecamatan: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface Employment {
  status: 'employed' | 'self_employed' | 'freelance' | 'unemployed' | 'retired' | 'student';
  companyName: string;
  industry: string;
  position: string;
  yearsWorking: number;
  companyAddress: string;
  companyPhone: string;
}

export interface IdentityDoc {
  ktpNumber: string;
  ktpName: string;
  ktpAddress: string;
  npwpNumber?: string;
  ktpExpiryDate?: string;
  ktpImageUrl?: string;
  selfieImageUrl?: string;
}

// ---- KYC ----

export interface KYCVerification {
  id: string;
  userId: string;
  status: KYCStatus;
  ktpUploaded: boolean;
  ocrCompleted: boolean;
  faceVerified: boolean;
  selfieVerified: boolean;
  ocrData?: KTPOCRData;
  matchScore?: number;
  rejectionReason?: string;
  verifiedBy?: string;
  submittedAt: string;
  verifiedAt?: string;
}

export interface KTPOCRData {
  nik: string;
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  alamat: string;
  rt: string;
  rw: string;
  kelurahan: string;
  kecamatan: string;
  agama: string;
  statusPerkawinan: string;
  pekerjaan: string;
  kewarganegaraan: string;
  berlakuHingga: string;
  ocrConfidence?: string;
}

export type KYCWorkflowStep = 'idle' | 'ktp_upload' | 'ocr_review' | 'selfie_capture' | 'face_matching' | 'result';

export type KYCEventType =
  | 'KYC_STARTED' | 'KTP_UPLOADED' | 'OCR_COMPLETED'
  | 'SELFIE_CAPTURED' | 'FACE_MATCH_SUCCESS' | 'FACE_MATCH_FAILED'
  | 'KYC_SUBMITTED' | 'KYC_APPROVED' | 'KYC_REJECTED';

export interface KYCHistoryEntry {
  id: string;
  verificationId: string;
  userId: string;
  event: KYCEventType;
  timestamp: string;
  details: string;
  performedBy?: string;
  metadata?: Record<string, unknown>;
}

// ---- Loans ----

export interface LoanProduct {
  id: string;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  interestRate: number;
  minTenor: number;
  maxTenor: number;
  processingFee: number;
  category: 'personal' | 'education' | 'business' | 'medical' | 'home_improvement';
  icon: string;
  features: string[];
  requirements: string[];
}

export interface LoanApplication {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  amount: number;
  tenor: number;
  purpose: string;
  interestRate: number;
  monthlyInstallment: number;
  totalRepayment: number;
  status: LoanStatus;
  creditScore?: CreditScore;
  disbursedAmount?: number;
  disbursedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  appliedAt: string;
  updatedAt: string;
}

export interface CreditScore {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
  factors: { name: string; impact: 'positive' | 'negative' | 'neutral'; detail: string }[];
  assessedAt: string;
}

export interface InstallmentSchedule {
  installmentNo: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  status: 'upcoming' | 'paid' | 'overdue' | 'partial';
  paidAt?: string;
  paidAmount?: number;
}

// ---- QRIS ----

export interface QRISTransaction {
  id: string;
  userId: string;
  merchantName: string;
  merchantId: string;
  country: QRISCountry;
  countryName: string;
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  convertedCurrency: string;
  exchangeRate: number;
  fee: number;
  totalAmount: number;
  status: TransactionStatus;
  qrData?: string;
  createdAt: string;
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: string;
}

// ---- Insurance ----

export interface InsuranceProduct {
  id: string;
  name: string;
  type: InsuranceType;
  provider: string;
  description: string;
  coverage: string[];
  premium: number;
  premiumPeriod: 'monthly' | 'yearly';
  maxCoverage: number;
  minAge: number;
  maxAge: number;
  features: string[];
  icon: string;
}

export interface InsurancePolicy {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  type: InsuranceType;
  provider: string;
  policyNumber: string;
  premium: number;
  premiumPeriod: 'monthly' | 'yearly';
  maxCoverage: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  nextPaymentDate: string;
  purchasedAt: string;
}

export interface InsuranceClaim {
  id: string;
  policyId: string;
  userId: string;
  type: string;
  description: string;
  amount: number;
  status: ClaimStatus;
  documents: string[];
  submittedAt: string;
  resolvedAt?: string;
  approvedAmount?: number;
  rejectionReason?: string;
}

// ---- Savings ----

export interface SavingsAccount {
  id: string;
  userId: string;
  accountNumber: string;
  accountName: string;
  balance: number;
  interestRate: number;
  accountType: 'regular' | 'premium' | 'goal';
  goalName?: string;
  goalTarget?: number;
  isActive: boolean;
  createdAt: string;
}

export interface SavingsTransaction {
  id: string;
  accountId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  reference?: string;
  recipientName?: string;
  recipientAccount?: string;
  recipientBank?: string;
  status: TransactionStatus;
  createdAt: string;
}

// ---- Device & Session ----

export interface Device {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  os: string;
  browser?: string;
  ipAddress: string;
  location: string;
  isTrusted: boolean;
  isCurrentDevice: boolean;
  lastActiveAt: string;
  registeredAt: string;
}

export interface Session {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  location: string;
  isActive: boolean;
  createdAt: string;
  expiresAt: string;
  lastActivityAt: string;
}

export interface LoginHistory {
  id: string;
  userId: string;
  deviceName: string;
  ipAddress: string;
  location: string;
  status: 'success' | 'failed';
  failReason?: string;
  method: 'password' | 'biometric' | 'mfa';
  createdAt: string;
}

// ---- Audit & Events ----

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  category: AuditCategory;
  action: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress: string;
  deviceInfo: string;
  status: 'success' | 'failure';
  createdAt: string;
}

export interface SecurityEvent {
  id: string;
  userId: string;
  userName: string;
  eventType: string;
  severity: SecurityEventSeverity;
  description: string;
  sourceIp: string;
  deviceInfo: string;
  metadata?: Record<string, unknown>;
  resolved: boolean;
  createdAt: string;
}

// ---- Notifications ----

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ---- API Response Wrappers ----

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  timestamp: string;
}

// ---- FAQ ----

export interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
}

import type { KYCVerification, KTPOCRData, KYCHistoryEntry } from '@/types';

// ============================================
// KYC MODULE — Dedicated Mock Data
// ============================================

// Face match threshold
export const FACE_MATCH_THRESHOLD = 85;

// OCR templates for simulation variety
export const ocrTemplates: Record<string, KTPOCRData> = {
  'USR-001': {
    nik: '3174051505900001',
    nama: 'BUDI SANTOSO',
    tempatLahir: 'JAKARTA',
    tanggalLahir: '15-05-1990',
    jenisKelamin: 'LAKI-LAKI',
    alamat: 'JL. SUDIRMAN NO. 45',
    rt: '003',
    rw: '005',
    kelurahan: 'SENAYAN',
    kecamatan: 'KEBAYORAN BARU',
    agama: 'ISLAM',
    statusPerkawinan: 'KAWIN',
    pekerjaan: 'KARYAWAN SWASTA',
    kewarganegaraan: 'WNI',
    berlakuHingga: 'SEUMUR HIDUP',
  },
  'USR-002': {
    nik: '3275034510950002',
    nama: 'SITI RAHAYU',
    tempatLahir: 'BEKASI',
    tanggalLahir: '05-10-1995',
    jenisKelamin: 'PEREMPUAN',
    alamat: 'JL. AHMAD YANI NO. 12',
    rt: '002',
    rw: '004',
    kelurahan: 'BEKASI JAYA',
    kecamatan: 'BEKASI TIMUR',
    agama: 'ISLAM',
    statusPerkawinan: 'BELUM KAWIN',
    pekerjaan: 'KARYAWAN SWASTA',
    kewarganegaraan: 'WNI',
    berlakuHingga: 'SEUMUR HIDUP',
  },
  'USR-006': {
    nik: '3201140803020003',
    nama: 'ANDI PRATAMA',
    tempatLahir: 'BOGOR',
    tanggalLahir: '08-03-2002',
    jenisKelamin: 'LAKI-LAKI',
    alamat: 'JL. RAYA PAJAJARAN NO. 88',
    rt: '007',
    rw: '003',
    kelurahan: 'BABAKAN',
    kecamatan: 'BOGOR TENGAH',
    agama: 'ISLAM',
    statusPerkawinan: 'BELUM KAWIN',
    pekerjaan: 'MAHASISWA/PELAJAR',
    kewarganegaraan: 'WNI',
    berlakuHingga: 'SEUMUR HIDUP',
  },
  default: {
    nik: '3578012006880004',
    nama: 'PENGGUNA BARU',
    tempatLahir: 'SURABAYA',
    tanggalLahir: '20-06-1988',
    jenisKelamin: 'LAKI-LAKI',
    alamat: 'JL. BASUKI RAHMAT NO. 10',
    rt: '001',
    rw: '002',
    kelurahan: 'EMBONG KALIASIN',
    kecamatan: 'GENTENG',
    agama: 'ISLAM',
    statusPerkawinan: 'KAWIN',
    pekerjaan: 'WIRASWASTA',
    kewarganegaraan: 'WNI',
    berlakuHingga: 'SEUMUR HIDUP',
  },
};

// Seed verifications — migrated from mockData.ts
export const initialKYCVerifications: KYCVerification[] = [
  {
    id: 'KYC-001',
    userId: 'USR-001',
    status: 'verified',
    ktpUploaded: true,
    ocrCompleted: true,
    faceVerified: true,
    selfieVerified: true,
    matchScore: 98.5,
    submittedAt: '2024-03-16T10:00:00Z',
    verifiedAt: '2024-03-16T10:15:00Z',
    verifiedBy: 'USR-004',
    ocrData: ocrTemplates['USR-001'],
  },
  {
    id: 'KYC-002',
    userId: 'USR-002',
    status: 'pending',
    ktpUploaded: true,
    ocrCompleted: true,
    faceVerified: true,
    selfieVerified: true,
    matchScore: 91.2,
    submittedAt: '2026-06-28T09:00:00Z',
    ocrData: ocrTemplates['USR-002'],
  },
  {
    id: 'KYC-003',
    userId: 'USR-006',
    status: 'unverified',
    ktpUploaded: false,
    ocrCompleted: false,
    faceVerified: false,
    selfieVerified: false,
    submittedAt: '2026-06-20T12:00:00Z',
  },
];

// Seed history for USR-001 (already verified user)
export const initialKYCHistory: KYCHistoryEntry[] = [
  {
    id: 'KYCH-001',
    verificationId: 'KYC-001',
    userId: 'USR-001',
    event: 'KYC_STARTED',
    timestamp: '2024-03-16T09:50:00Z',
    details: 'KYC verification process initiated',
  },
  {
    id: 'KYCH-002',
    verificationId: 'KYC-001',
    userId: 'USR-001',
    event: 'KTP_UPLOADED',
    timestamp: '2024-03-16T09:52:00Z',
    details: 'Indonesian ID card (KTP) uploaded for verification',
  },
  {
    id: 'KYCH-003',
    verificationId: 'KYC-001',
    userId: 'USR-001',
    event: 'OCR_COMPLETED',
    timestamp: '2024-03-16T09:52:30Z',
    details: 'OCR data extracted from KTP: NIK 3174051505900001, Nama BUDI SANTOSO',
  },
  {
    id: 'KYCH-004',
    verificationId: 'KYC-001',
    userId: 'USR-001',
    event: 'SELFIE_CAPTURED',
    timestamp: '2024-03-16T09:55:00Z',
    details: 'Live selfie captured for face matching',
  },
  {
    id: 'KYCH-005',
    verificationId: 'KYC-001',
    userId: 'USR-001',
    event: 'FACE_MATCH_SUCCESS',
    timestamp: '2024-03-16T09:56:00Z',
    details: 'Face match successful with score 98.5%',
    metadata: { matchScore: 98.5 },
  },
  {
    id: 'KYCH-006',
    verificationId: 'KYC-001',
    userId: 'USR-001',
    event: 'KYC_SUBMITTED',
    timestamp: '2024-03-16T10:00:00Z',
    details: 'KYC verification submitted for manual review',
  },
  {
    id: 'KYCH-007',
    verificationId: 'KYC-001',
    userId: 'USR-001',
    event: 'KYC_APPROVED',
    timestamp: '2024-03-16T10:15:00Z',
    details: 'KYC verification approved by officer Ahmad Hidayat',
    performedBy: 'USR-004',
  },
  // USR-002 pending history
  {
    id: 'KYCH-008',
    verificationId: 'KYC-002',
    userId: 'USR-002',
    event: 'KYC_STARTED',
    timestamp: '2026-06-28T08:50:00Z',
    details: 'KYC verification process initiated',
  },
  {
    id: 'KYCH-009',
    verificationId: 'KYC-002',
    userId: 'USR-002',
    event: 'KTP_UPLOADED',
    timestamp: '2026-06-28T08:52:00Z',
    details: 'Indonesian ID card (KTP) uploaded for verification',
  },
  {
    id: 'KYCH-010',
    verificationId: 'KYC-002',
    userId: 'USR-002',
    event: 'OCR_COMPLETED',
    timestamp: '2026-06-28T08:52:30Z',
    details: 'OCR data extracted from KTP: NIK 3275034510950002, Nama SITI RAHAYU',
  },
  {
    id: 'KYCH-011',
    verificationId: 'KYC-002',
    userId: 'USR-002',
    event: 'SELFIE_CAPTURED',
    timestamp: '2026-06-28T08:55:00Z',
    details: 'Live selfie captured for face matching',
  },
  {
    id: 'KYCH-012',
    verificationId: 'KYC-002',
    userId: 'USR-002',
    event: 'FACE_MATCH_SUCCESS',
    timestamp: '2026-06-28T08:56:00Z',
    details: 'Face match successful with score 91.2%',
    metadata: { matchScore: 91.2 },
  },
  {
    id: 'KYCH-013',
    verificationId: 'KYC-002',
    userId: 'USR-002',
    event: 'KYC_SUBMITTED',
    timestamp: '2026-06-28T09:00:00Z',
    details: 'KYC verification submitted for manual review',
  },
];

// Helper to get OCR template for a user
export function getOCRTemplate(user: any): KTPOCRData {
  const userId = typeof user === 'string' ? user : user?.id;
  const userObj = typeof user === 'object' ? user : null;
  const base = ocrTemplates[userId] || ocrTemplates['default'];

  if (userObj && userObj.fullName && userObj.fullName !== 'User') {
    const cleanPhone = (userObj.phone || '08123456789').replace(/\D/g, '');
    return {
      ...base,
      nama: userObj.fullName.toUpperCase(),
      nik: `3171${cleanPhone.slice(-12).padStart(12, '0')}`,
    };
  }

  return base;
}

// Generate a random face match score
export function generateFaceMatchScore(): number {
  // Weighted distribution: 85% chance of score >= 85 (pass), 15% chance below
  const rand = Math.random();
  if (rand < 0.85) {
    // Pass range: 85-99
    return Math.round((85 + Math.random() * 14) * 10) / 10;
  }
  // Fail range: 70-84
  return Math.round((70 + Math.random() * 14) * 10) / 10;
}

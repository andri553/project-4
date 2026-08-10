import { create } from 'zustand';
import type { KYCVerification, KTPOCRData, KYCHistoryEntry, KYCWorkflowStep, KYCEventType } from '@/types';
import { initialKYCVerifications, initialKYCHistory, getOCRTemplate, generateFaceMatchScore, FACE_MATCH_THRESHOLD } from '@/data/kycData';
import { performRealKtpOCR } from '@/helpers/ktpOcr';
import { useAuthStore } from './authStore';
import { logAudit, logSecurityEvent } from './auditStore';
import { useNotificationStore } from './notificationStore';

interface KYCStore {
  // Module state
  verifications: KYCVerification[];
  history: KYCHistoryEntry[];

  // Workflow state (per-session)
  currentStep: KYCWorkflowStep;
  isProcessing: boolean;
  ocrData: KTPOCRData | null;
  matchScore: number | null;
  faceMatchPassed: boolean | null;
  error: string | null;

  // === PinjamAJA Workflow Actions ===
  startKYC: () => void;
  uploadKTP: (capturedImage?: string, onProgress?: (p: number) => void) => Promise<void>;
  confirmOCR: (updatedOcrData?: KTPOCRData) => void;
  captureSelfie: () => Promise<void>;
  performFaceMatch: () => Promise<void>;
  submitKYC: () => Promise<boolean>;
  retryKYC: () => void;
  resetWorkflow: () => void;

  // === SecureNusa Verification Actions (Bridge) ===
  approveKYC: (verificationId: string, officerId: string, officerName: string) => void;
  rejectKYC: (verificationId: string, officerId: string, officerName: string, reason: string) => void;

  // Queries
  getVerificationByUserId: (userId: string) => KYCVerification | undefined;
  getHistoryByUserId: (userId: string) => KYCHistoryEntry[];
  getPendingVerifications: () => KYCVerification[];
  getCurrentVerification: () => KYCVerification | undefined;
}

let historyCounter = initialKYCHistory.length + 1;
let verificationCounter = initialKYCVerifications.length + 1;

function createHistoryEntry(
  verificationId: string,
  userId: string,
  event: KYCEventType,
  details: string,
  performedBy?: string,
  metadata?: Record<string, unknown>,
): KYCHistoryEntry {
  return {
    id: `KYCH-${String(historyCounter++).padStart(3, '0')}`,
    verificationId,
    userId,
    event,
    timestamp: new Date().toISOString(),
    details,
    performedBy,
    metadata,
  };
}

export const useKYCStore = create<KYCStore>((set, get) => ({
  verifications: [...initialKYCVerifications],
  history: [...initialKYCHistory],

  currentStep: 'idle',
  isProcessing: false,
  ocrData: null,
  matchScore: null,
  faceMatchPassed: null,
  error: null,

  // ──────────────────────────────────────
   startKYC: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    if (user.kycStatus === 'pending_review') {
      set({ error: 'A KYC verification is already pending review.' });
      return;
    }

    set({ isProcessing: true, error: null });
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const res = await fetch('/api/v1/business/kyc/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await res.json();
        if (res.ok && result.data) {
          const verification = result.data;
          set(state => ({
            verifications: state.verifications.some(v => v.id === verification.id)
              ? state.verifications.map(v => v.id === verification.id ? verification : v)
              : [...state.verifications, verification]
          }));
        }
      }
    } catch (err: any) {
      console.warn('Backend start KYC notice:', err);
    }

    set({
      currentStep: 'ktp_upload',
      ocrData: null,
      matchScore: null,
      faceMatchPassed: null,
      isProcessing: false,
      error: null
    });

    useAuthStore.setState(state => {
      if (state.user && state.user.id === user.id) {
        return { user: { ...state.user, kycStatus: 'in_progress' } };
      }
      return {};
    });
  },

  uploadKTP: async (capturedImage?: string, onProgress?: (p: number) => void) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set({ isProcessing: true, error: null });
    try {
      let ocrData: KTPOCRData;
      if (capturedImage) {
        try {
          ocrData = await performRealKtpOCR(capturedImage, onProgress);
        } catch (e) {
          console.warn('Real Tesseract OCR fallback:', e);
          ocrData = getOCRTemplate(user);
        }
      } else {
        ocrData = getOCRTemplate(user);
      }

      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const res = await fetch('/api/v1/business/kyc/upload-ktp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ ocrData, imageBase64: capturedImage })
          });
          const result = await res.json();
          if (res.ok && result.data) {
            const verification = result.data;
            set(state => ({
              verifications: state.verifications.map(v => v.id === verification.id ? verification : v)
            }));
          }
        }
      } catch (e) {
        console.warn('Backend upload-ktp API notice:', e);
      }

      set({
        isProcessing: false,
        currentStep: 'ocr_review',
        ocrData,
        error: null
      });

    } catch (err: any) {
      const fallbackOcr = getOCRTemplate(user);
      set({
        isProcessing: false,
        currentStep: 'ocr_review',
        ocrData: fallbackOcr,
        error: null
      });
    }
  },

  confirmOCR: (updatedOcrData?: KTPOCRData) => {
    if (updatedOcrData) {
      set({ ocrData: updatedOcrData });
    }
    set({ currentStep: 'selfie_capture' });
  },

  captureSelfie: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set({ isProcessing: true, error: null });
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const res = await fetch('/api/v1/business/kyc/selfie', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await res.json();
        if (res.ok && result.data) {
          const verification = result.data;
          set(state => ({
            verifications: state.verifications.map(v => v.id === verification.id ? verification : v)
          }));
        }
      }
    } catch (err: any) {
      console.warn('Backend selfie API notice:', err);
    }

    set({
      isProcessing: false,
      currentStep: 'face_matching',
      error: null
    });
  },

  performFaceMatch: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set({ isProcessing: true, error: null });
    const score = generateFaceMatchScore();
    const passed = score >= FACE_MATCH_THRESHOLD;

    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const res = await fetch('/api/v1/business/kyc/face-match', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ score, passed })
        });
        const result = await res.json();
        if (res.ok && result.data) {
          const verification = result.data;
          set(state => ({
            verifications: state.verifications.map(v => v.id === verification.id ? verification : v)
          }));
        }
      }
    } catch (err: any) {
      console.warn('Backend face-match API notice:', err);
    }

    set({
      isProcessing: false,
      currentStep: 'result',
      matchScore: score,
      faceMatchPassed: passed,
      error: null
    });
  },

  submitKYC: async () => {
    const user = useAuthStore.getState().user;
    const { ocrData, matchScore, faceMatchPassed } = get();
    if (!user) return false;

    set({ isProcessing: true });
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const res = await fetch('/api/v1/business/kyc/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ocrData,
            matchScore,
            faceMatchPassed
          })
        });
        const result = await res.json();
        if (res.ok && result.data) {
          const verification = result.data;
          set(state => ({
            verifications: state.verifications.map(v => v.id === verification.id ? verification : v)
          }));
        }
      }

      set({
        isProcessing: false,
        currentStep: 'result',
        error: null
      });

      // Sync status to authStore
      useAuthStore.setState(state => {
        if (state.user && state.user.id === user.id) {
          return { user: { ...state.user, kycStatus: 'pending_review' } };
        }
        return {};
      });

      return true;
    } catch (err: any) {
      set({ isProcessing: false, error: err.message });
      return false;
    }
  },

  retryKYC: () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const verification = get().verifications.find(v => v.userId === user.id);
    if (!verification) return;

    // Reset the verification record for retry
    set(state => ({
      verifications: state.verifications.map(v =>
        v.id === verification.id
          ? {
            ...v,
            status: 'unverified' as const,
            ktpUploaded: false,
            ocrCompleted: false,
            faceVerified: false,
            selfieVerified: false,
            matchScore: undefined,
            rejectionReason: undefined,
            ocrData: undefined,
          }
          : v
      ),
      currentStep: 'ktp_upload',
      ocrData: null,
      matchScore: null,
      faceMatchPassed: null,
      error: null,
      history: [
        ...state.history,
        createHistoryEntry(verification.id, user.id, 'KYC_STARTED', 'KYC verification retry initiated'),
      ],
    }));

    // Sync to authStore
    useAuthStore.setState(state => {
      if (state.user && state.user.id === user.id) {
        return { user: { ...state.user, kycStatus: 'unverified' } };
      }
      return {};
    });

    logAudit(user.id, user.fullName, 'KYC', 'KYC_STARTED', 'KYC verification retry initiated');
    logSecurityEvent(user.id, user.fullName, 'KYC_STARTED', 'medium', 'KYC verification retry initiated after previous rejection/failure');
  },

  resetWorkflow: () => {
    set({
      currentStep: 'idle',
      isProcessing: false,
      ocrData: null,
      matchScore: null,
      faceMatchPassed: null,
      error: null,
    });
  },

  // ──────────────────────────────────────
  // SecureNusa Verification Actions (Bridge)
  // ──────────────────────────────────────

  approveKYC: (verificationId, officerId, officerName) => {
    const verification = get().verifications.find(v => v.id === verificationId);
    if (!verification || verification.status !== 'pending') return;

    set(state => ({
      verifications: state.verifications.map(v =>
        v.id === verificationId
          ? { ...v, status: 'verified', verifiedBy: officerId, verifiedAt: new Date().toISOString() }
          : v
      ),
      history: [
        ...state.history,
        createHistoryEntry(verificationId, verification.userId, 'KYC_APPROVED', `KYC verification approved by officer ${officerName}`, officerId),
      ],
    }));

    // Sync to authStore — update the PinjamAJA user's status
    useAuthStore.setState(state => {
      if (state.user && state.user.id === verification.userId) {
        return { user: { ...state.user, kycStatus: 'verified' } };
      }
      return {};
    });

    // Send notification to PinjamAJA user
    useNotificationStore.getState().addNotification({
      userId: verification.userId,
      type: 'security',
      title: 'Akun Terverifikasi! 🛡️',
      message: 'Verifikasi KYC Anda telah disetujui oleh tim verifikasi. Akun Anda sekarang memiliki akses penuh ke semua fitur.',
    });

    logAudit(verification.userId, officerName, 'KYC', 'KYC_APPROVED', `KYC verification ${verificationId} approved by officer ${officerName}`, 'success', { officerId, verificationId });
    logSecurityEvent(verification.userId, officerName, 'KYC_APPROVED', 'low', `KYC approved for user ${verification.userId} by ${officerName}`, { officerId });
  },

  rejectKYC: (verificationId, officerId, officerName, reason) => {
    const verification = get().verifications.find(v => v.id === verificationId);
    if (!verification || verification.status !== 'pending') return;

    set(state => ({
      verifications: state.verifications.map(v =>
        v.id === verificationId
          ? { ...v, status: 'rejected', rejectionReason: reason, verifiedBy: officerId, verifiedAt: new Date().toISOString() }
          : v
      ),
      history: [
        ...state.history,
        createHistoryEntry(verificationId, verification.userId, 'KYC_REJECTED', `KYC verification rejected by officer ${officerName}. Reason: ${reason}`, officerId, { reason }),
      ],
    }));

    // Sync to authStore
    useAuthStore.setState(state => {
      if (state.user && state.user.id === verification.userId) {
        return { user: { ...state.user, kycStatus: 'rejected' } };
      }
      return {};
    });

    // Send notification
    useNotificationStore.getState().addNotification({
      userId: verification.userId,
      type: 'security',
      title: 'Verifikasi Ditolak ❌',
      message: `Verifikasi KYC Anda ditolak. Alasan: ${reason}. Silakan lakukan verifikasi ulang.`,
    });

    logAudit(verification.userId, officerName, 'KYC', 'KYC_REJECTED', `KYC verification ${verificationId} rejected. Reason: ${reason}`, 'success', { officerId, verificationId, reason });
    logSecurityEvent(verification.userId, officerName, 'KYC_REJECTED', 'high', `KYC rejected for user ${verification.userId}. Reason: ${reason}`, { officerId, reason });
  },

  // ──────────────────────────────────────
  // Queries
  // ──────────────────────────────────────

  getVerificationByUserId: (userId) => {
    return get().verifications.find(v => v.userId === userId);
  },

  getHistoryByUserId: (userId) => {
    return get().history.filter(h => h.userId === userId);
  },

  getPendingVerifications: () => {
    return get().verifications.filter(v => v.status === 'pending');
  },

  getCurrentVerification: () => {
    const user = useAuthStore.getState().user;
    if (!user) return undefined;
    return get().verifications.find(v => v.userId === user.id);
  },
}));

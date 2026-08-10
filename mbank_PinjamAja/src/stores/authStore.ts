import { create } from 'zustand';
import type { User } from '@/types';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  mfaPending: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Phone onboarding state
  phoneNumber: string | null;
  tempUser: any | null; // Temp user returned after OTP verification
  isFirstLogin: boolean;
  tempUserId: string | null;

  // Persistent session state
  sessionId: string | null;
  deviceId: string | null;
  trustedDevice: boolean;
  biometricEnabled: boolean;
  phoneExists: boolean | null;
  mfaEnabled: boolean | null;

  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setPhoneNumber: (phone: string) => void;
  clearError: () => void;

  // Phone onboarding actions
  sendPhoneOTP: (phone: string) => Promise<boolean>;
  verifyPhoneOTP: (otp: string) => Promise<boolean>;
  registerProfile: (fullName: string, email: string) => Promise<boolean>;
  setupPIN: (pin: string) => Promise<boolean>;
  verifyPIN: (pin: string) => Promise<boolean>;
  biometricUnlock: () => Promise<boolean>;
  enableBiometricDirectly: (enabled: boolean) => Promise<void>;
  updateSecuritySettings: (settings: { mfaEnabled?: boolean; biometricEnabled?: boolean }) => Promise<boolean>;
  loginWithPhoneAndPin: (pin: string) => Promise<boolean>;
  
  // Session Restoration & Refresh Token Rotation
  restoreSession: () => Promise<boolean>;
  refreshSession: () => Promise<boolean>;
}

// Generate or retrieve persistent device ID
const getOrCreateDeviceId = () => {
  let devId = localStorage.getItem('auth_device_id');
  if (!devId) {
    devId = 'DEV-' + Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem('auth_device_id', devId);
  }
  return devId;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  mfaPending: false,
  isLoading: false,
  error: null,

  phoneNumber: null,
  tempUser: null,
  isFirstLogin: false,
  tempUserId: null,

  sessionId: localStorage.getItem('auth_session_id'),
  deviceId: getOrCreateDeviceId(),
  trustedDevice: localStorage.getItem('auth_device_trusted') === 'true',
  biometricEnabled: localStorage.getItem('auth_biometric_enabled') === 'true',
  phoneExists: null,
  mfaEnabled: null,

  setPhoneNumber: (phone: string) => set({ phoneNumber: phone }),
  clearError: () => set({ error: null }),

  login: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          deviceId: get().deviceId,
          deviceFingerprint: 'FINGERPRINT-' + get().deviceId
        })
      });

      const json = await res.json();

      if (!json.success) {
        set({ isLoading: false, error: json.message || 'Email atau password salah' });
        return false;
      }

      const { token, refreshToken, user } = json.data;

      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_refresh_token', refreshToken);
      localStorage.setItem('auth_user_id', user.id);
      localStorage.setItem('auth_biometric_enabled', String(user.biometricEnabled));

      set({
        user,
        isAuthenticated: true,
        biometricEnabled: user.biometricEnabled,
        isLoading: false
      });
      return true;

    } catch (e) {
      console.error(e);
      set({ isLoading: false, error: 'Koneksi ke server gagal' });
      return false;
    }
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('auth_refresh_token');
    
    if (refreshToken) {
      try {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
      } catch (e) {
        console.warn('Logout notification to backend failed');
      }
    }

    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_session_id');
    localStorage.removeItem('auth_device_trusted');
    localStorage.removeItem('auth_user_id');
    localStorage.removeItem('auth_phone_number');

    set({
      user: null,
      isAuthenticated: false,
      mfaPending: false,
      error: null,
      phoneNumber: null,
      tempUser: null,
      isFirstLogin: false,
      tempUserId: null,
      sessionId: null,
      trustedDevice: false,
      phoneExists: null
    });
  },

  // --- Phone OTP Onboarding Actions ---

  sendPhoneOTP: async (phone) => {
    set({ isLoading: true, error: null, phoneNumber: phone });
    try {
      const res = await fetch('/api/v1/auth/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phone,
          deviceId: get().deviceId,
          deviceFingerprint: 'FINGERPRINT-' + get().deviceId
        })
      });
      const json = await res.json();
      set({ isLoading: false });

      if (!json.success) {
        set({ error: json.message });
        return false;
      }

      const { exists, mfaEnabled } = json.data;
      set({ phoneExists: exists, mfaEnabled: !!mfaEnabled });
      localStorage.setItem('auth_phone_number', phone);
      return true;
    } catch (e) {
      set({ isLoading: false, error: 'Gagal mengirim OTP. Cek koneksi Anda.' });
      return false;
    }
  },

  verifyPhoneOTP: async (otp) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/v1/auth/phone/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: get().phoneNumber,
          otp,
          deviceId: get().deviceId,
          deviceFingerprint: 'FINGERPRINT-' + get().deviceId
        })
      });
      const json = await res.json();
      set({ isLoading: false });

      if (!json.success) {
        set({ error: json.message });
        return false;
      }

      const { exists, user } = json.data;

      if (exists && user) {
        localStorage.setItem('auth_user_id', user.id);
        set({
          tempUser: user,
          tempUserId: user.id,
          isFirstLogin: !user.hasPin
        });
      } else {
        // Does not exist: goes to Registration Flow
        set({
          isFirstLogin: true,
          tempUser: null,
          tempUserId: null
        });
      }

      return true;
    } catch (e) {
      set({ isLoading: false, error: 'Gagal memverifikasi OTP.' });
      return false;
    }
  },

  registerProfile: async (fullName, email) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/v1/auth/phone/register-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          phoneNumber: get().phoneNumber
        })
      });
      const json = await res.json();
      set({ isLoading: false });

      if (!json.success) {
        set({ error: json.message });
        return false;
      }

      const { userId } = json.data;
      localStorage.setItem('auth_user_id', userId);
      set({ tempUserId: userId });

      return true;
    } catch (e) {
      set({ isLoading: false, error: 'Gagal membuat profil baru.' });
      return false;
    }
  },

  setupPIN: async (pin) => {
    set({ isLoading: true, error: null });
    const userId = get().tempUserId || localStorage.getItem('auth_user_id');
    if (!userId) {
      set({ isLoading: false, error: 'Data user tidak ditemukan' });
      return false;
    }

    try {
      const res = await fetch('/api/v1/auth/phone/setup-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, pin })
      });
      const json = await res.json();
      set({ isLoading: false });

      if (!json.success) {
        set({ error: json.message });
        return false;
      }

      return true;
    } catch (e) {
      set({ isLoading: false, error: 'Gagal menyimpan PIN.' });
      return false;
    }
  },

  verifyPIN: async (pin: string) => {
    set({ isLoading: true, error: null });

    const userId = get().tempUserId || localStorage.getItem('auth_user_id');

    if (!userId) {
      const phone = get().phoneNumber || localStorage.getItem('auth_phone_number');
      if (phone) {
        return get().loginWithPhoneAndPin(pin);
      }
      set({
        isLoading: false,
        error: 'Sesi habis. Silakan login kembali.'
      });
      return false;
    }

    try {
      const res = await fetch('/api/v1/auth/phone/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          pin,
          deviceId: get().deviceId,
          deviceFingerprint: 'FINGERPRINT-' + get().deviceId,
          rememberDevice: true
        })
      });

      const json = await res.json();

      set({ isLoading: false });

      if (!json.success) {
        set({ error: json.message });
        return false;
      }

      const {
        accessToken,
        refreshToken,
        user,
        sessionId,
        trustedDevice
      } = json.data;

      localStorage.setItem('auth_token', accessToken);
      localStorage.setItem('auth_refresh_token', refreshToken);
      localStorage.setItem('auth_session_id', sessionId);
      localStorage.setItem('auth_device_trusted', String(trustedDevice));
      localStorage.setItem('auth_user_id', user.id);
      localStorage.setItem('auth_biometric_enabled', String(user.biometricEnabled));

      set({
        user,
        isAuthenticated: true,
        sessionId,
        trustedDevice,
        biometricEnabled: user.biometricEnabled,
        error: null
      });

      return true;
    } catch (e) {
      set({
        isLoading: false,
        error: 'Verifikasi PIN gagal.'
      });
      return false;
    }
  },

  loginWithPhoneAndPin: async (pin: string) => {
    set({ isLoading: true, error: null });

    const phone = get().phoneNumber || localStorage.getItem('auth_phone_number');

    if (!phone) {
      const userId = get().tempUserId || localStorage.getItem('auth_user_id');
      if (userId) {
        return get().verifyPIN(pin);
      }
      set({
        isLoading: false,
        error: 'Sesi habis. Silakan login kembali.'
      });
      return false;
    }

    try {
      const res = await fetch('/api/v1/auth/phone/login-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phone,
          pin,
          deviceId: get().deviceId,
          deviceFingerprint: 'FINGERPRINT-' + get().deviceId,
          rememberDevice: true
        })
      });

      const json = await res.json();

      set({ isLoading: false });

      if (!json.success) {
        set({ error: json.message });
        return false;
      }

      const {
        accessToken,
        refreshToken,
        user,
        sessionId,
        trustedDevice
      } = json.data;

      localStorage.setItem('auth_token', accessToken);
      localStorage.setItem('auth_refresh_token', refreshToken);
      localStorage.setItem('auth_session_id', sessionId);
      localStorage.setItem('auth_device_trusted', String(trustedDevice));
      localStorage.setItem('auth_user_id', user.id);
      localStorage.setItem('auth_biometric_enabled', String(user.biometricEnabled));

      set({
        user,
        isAuthenticated: true,
        sessionId,
        trustedDevice,
        biometricEnabled: user.biometricEnabled,
        error: null
      });

      return true;
    } catch (e) {
      set({
        isLoading: false,
        error: 'Login gagal, koneksi bermasalah.'
      });
      return false;
    }
  },

  biometricUnlock: async () => {
    set({ isLoading: true, error: null });
    const userId = localStorage.getItem('auth_user_id');
    const token = localStorage.getItem('auth_token');

    if (!userId || !token) {
      set({ isLoading: false, error: 'Sesi tidak valid' });
      return false;
    }

    try {
      const res = await fetch('/api/v1/auth/phone/biometric-unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          deviceId: get().deviceId
        })
      });
      const json = await res.json();
      set({ isLoading: false });

      if (!json.success) {
        set({ error: json.message });
        return false;
      }

      // Restore authentication from stored user
      await get().restoreSession();
      return true;
    } catch (e) {
      set({ isLoading: false, error: 'Unlock biometric gagal.' });
      return false;
    }
  },

  enableBiometricDirectly: async (enabled) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const res = await fetch('/api/v1/auth/phone/update-biometrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ enabled })
      });
      const json = await res.json();

      if (json.success) {
        localStorage.setItem('auth_biometric_enabled', String(enabled));
        set(state => {
          if (state.user) {
            return {
              biometricEnabled: enabled,
              user: { ...state.user, biometricEnabled: enabled }
            };
          }
          return { biometricEnabled: enabled };
        });
      }
    } catch (e) {
      console.error('Failed to update biometrics preference on server');
    }
  },

  updateSecuritySettings: async (settings) => {
    const token = localStorage.getItem('auth_token');
    const user = get().user;
    if (!token && !user) return false;

    // Optimistic UI update
    set(state => {
      if (state.user) {
        return {
          user: {
            ...state.user,
            ...(typeof settings.mfaEnabled === 'boolean' ? { mfaEnabled: settings.mfaEnabled } : {}),
            ...(typeof settings.biometricEnabled === 'boolean' ? { biometricEnabled: settings.biometricEnabled } : {})
          },
          ...(typeof settings.biometricEnabled === 'boolean' ? { biometricEnabled: settings.biometricEnabled } : {})
        };
      }
      return {};
    });

    try {
      const res = await fetch('/api/v1/business/auth/security-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(settings)
      });
      const json = await res.json();
      if (json.success) {
        if (typeof settings.biometricEnabled === 'boolean') {
          localStorage.setItem('auth_biometric_enabled', String(settings.biometricEnabled));
        }
        return true;
      }
    } catch (err) {
      console.error('Failed to update security settings on server', err);
    }
    return false;
  },

  // --- Session Restoration & Rotation ---

  restoreSession: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      // Check if we have a refresh token to perform RTR
      const refreshTok = localStorage.getItem('auth_refresh_token');
      if (refreshTok) {
        return get().refreshSession();
      }
      return false;
    }

    try {
      const res = await fetch('/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();

      if (json.success && json.data.user) {
        set({
          user: json.data.user,
          isAuthenticated: true,
          biometricEnabled: json.data.user.biometricEnabled
        });
        return true;
      } else {
        // Token expired/invalid, try refresh token rotation
        return get().refreshSession();
      }
    } catch (e) {
      console.error('Session restoration failed', e);
      return false;
    }
  },

  refreshSession: async () => {
    const refreshToken = localStorage.getItem('auth_refresh_token');
    if (!refreshToken) return false;

    try {
      const res = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      const json = await res.json();

      if (json.success) {
        const { token, refreshToken: newRefreshToken, user } = json.data;

        localStorage.setItem('auth_token', token);
        if (newRefreshToken) {
          localStorage.setItem('auth_refresh_token', newRefreshToken);
        }

        set({
          user,
          isAuthenticated: true,
          biometricEnabled: user.biometricEnabled
        });
        return true;
      } else {
        // Refresh token failed -> Force full logout
        get().logout();
        return false;
      }
    } catch (e) {
      console.error('Refresh token exchange failed', e);
      return false;
    }
  }
}));

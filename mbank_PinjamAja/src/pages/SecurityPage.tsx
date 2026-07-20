import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Fingerprint, Smartphone, Key, AlertTriangle, CheckCircle2, X, Loader2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useAuthStore } from '@/stores/authStore';
import { logAudit, logSecurityEvent } from '@/stores/auditStore';

export default function SecurityPage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user)!;
  const enableBiometricDirectly = useAuthStore(s => s.enableBiometricDirectly);

  const [biometricEnabled, setBiometricEnabled] = useState(
    localStorage.getItem(`biometric_enabled_${user.id}`) === 'true'
  );
  const [mfaEnabled, setMfaEnabled] = useState(user.mfaEnabled || false);
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Modals state
  const [modalType, setModalType] = useState<'password' | 'pin' | null>(null);
  const [currentVal, setCurrentVal] = useState('');
  const [newVal, setNewVal] = useState('');
  const [confirmVal, setConfirmVal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const handleToggle = async (type: 'biometric' | 'mfa') => {
    if (type === 'biometric') {
      const nextVal = !biometricEnabled;
      setBiometricEnabled(nextVal);
      await enableBiometricDirectly(nextVal);
      setToastMessage(nextVal ? 'Biometrik login diaktifkan' : 'Biometrik login dinonaktifkan');
    } else {
      const nextVal = !mfaEnabled;
      setMfaEnabled(nextVal);
      useAuthStore.setState(state => {
        if (state.user) {
          return { user: { ...state.user, mfaEnabled: nextVal } };
        }
        return {};
      });
      setToastMessage(nextVal ? 'MFA diaktifkan' : 'MFA dinonaktifkan');
      logAudit(user.id, user.fullName, 'SECURITY', 'MFA_TOGGLED', `MFA two-factor authentication ${nextVal ? 'enabled' : 'disabled'}`);
    }
    
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSecurityUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    if (newVal.length < (modalType === 'pin' ? 6 : 8)) {
      setModalError(modalType === 'pin' ? 'PIN baru harus 6 digit' : 'Kata sandi baru minimal 8 karakter');
      return;
    }
    if (newVal !== confirmVal) {
      setModalError('Konfirmasi tidak cocok');
      return;
    }

    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1000)); // Simulate api call

    if (modalType === 'pin') {
      localStorage.setItem(`pin_${user.id}`, newVal);
      logAudit(user.id, user.fullName, 'SECURITY', 'PIN_CHANGED', 'Transaction PIN updated successfully');
      setToastMessage('PIN Transaksi berhasil diubah');
    } else {
      logAudit(user.id, user.fullName, 'SECURITY', 'PASSWORD_CHANGED', 'Account password updated successfully');
      setToastMessage('Kata sandi berhasil diubah');
    }

    setIsSubmitting(false);
    setModalType(null);
    setCurrentVal('');
    setNewVal('');
    setConfirmVal('');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      <PageHeader title="Keamanan Akun" onBack={() => navigate('/account')} />

      <div style={{ padding: '16px' }}>
        {/* Password & PIN */}
        <div className="card animate-fade-in-up" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, padding: '16px 16px 8px' }}>Kata Sandi & PIN</h3>
          
          <button style={menuStyle} onClick={() => setModalType('password')}>
            <div style={iconContainerStyle}>
              <Key size={18} color="var(--color-text-secondary)" />
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <p style={{ fontSize: 13, fontWeight: 600 }}>Ubah Kata Sandi</p>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Diperbarui 3 bulan lalu</p>
            </div>
          </button>
          
          <div style={{ height: 1, background: 'var(--color-border-light)', margin: '0 16px' }} />
          
          <button style={menuStyle} onClick={() => setModalType('pin')}>
            <div style={iconContainerStyle}>
              <Lock size={18} color="var(--color-text-secondary)" />
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <p style={{ fontSize: 13, fontWeight: 600 }}>Ubah PIN Transaksi</p>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>6 digit angka untuk transaksi</p>
            </div>
          </button>
        </div>

        {/* Advanced Security */}
        <div className="card animate-fade-in-up" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, padding: '16px 16px 8px' }}>Keamanan Lanjutan</h3>
          
          <div style={{ ...menuStyle, cursor: 'default' }}>
            <div style={iconContainerStyle}>
              <Fingerprint size={18} color="var(--color-text-secondary)" />
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <p style={{ fontSize: 13, fontWeight: 600 }}>Login Biometrik</p>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Gunakan sidik jari atau Face ID</p>
            </div>
            <div 
              onClick={() => handleToggle('biometric')}
              style={{
                width: 40, height: 24, borderRadius: 12, 
                background: biometricEnabled ? 'var(--color-success)' : 'var(--color-border)',
                position: 'relative', cursor: 'pointer', transition: 'background 0.3s'
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: '50%', background: 'white',
                position: 'absolute', top: 2, left: biometricEnabled ? 18 : 2,
                transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }} />
            </div>
          </div>
          
          <div style={{ height: 1, background: 'var(--color-border-light)', margin: '0 16px' }} />
          
          <div style={{ ...menuStyle, cursor: 'default' }}>
            <div style={iconContainerStyle}>
              <Smartphone size={18} color="var(--color-text-secondary)" />
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <p style={{ fontSize: 13, fontWeight: 600 }}>Autentikasi Dua Faktor (MFA)</p>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Tingkatkan keamanan saat login</p>
            </div>
            <div 
              onClick={() => handleToggle('mfa')}
              style={{
                width: 40, height: 24, borderRadius: 12, 
                background: mfaEnabled ? 'var(--color-success)' : 'var(--color-border)',
                position: 'relative', cursor: 'pointer', transition: 'background 0.3s'
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: '50%', background: 'white',
                position: 'absolute', top: 2, left: mfaEnabled ? 18 : 2,
                transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }} />
            </div>
          </div>
        </div>

        {/* Security Warning */}
        <div className="card animate-fade-in-up" style={{ padding: '16px', background: 'var(--color-warning-light)', border: '1px solid #FDE68A' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <AlertTriangle size={24} color="#D97706" style={{ flexShrink: 0 }} />
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#8B6914', marginBottom: 4 }}>Jaga Kerahasiaan Akun Anda</h4>
              <p style={{ fontSize: 11, color: '#8B6914', lineHeight: 1.4 }}>
                PinjamAJA tidak pernah meminta Password, PIN, atau kode OTP Anda. Jangan berikan informasi tersebut kepada siapapun.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Modals */}
      {modalType && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()} style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>
                {modalType === 'pin' ? 'Ubah PIN Transaksi' : 'Ubah Kata Sandi'}
              </h3>
              <button onClick={() => setModalType(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSecurityUpdate}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                  {modalType === 'pin' ? 'PIN Saat Ini' : 'Kata Sandi Saat Ini'}
                </label>
                <input
                  type={modalType === 'pin' ? 'password' : 'password'}
                  className="input-field"
                  placeholder={modalType === 'pin' ? 'Ketik PIN lama' : 'Ketik kata sandi lama'}
                  value={currentVal}
                  onChange={(e) => setCurrentVal(e.target.value)}
                  maxLength={modalType === 'pin' ? 6 : undefined}
                  required
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                  {modalType === 'pin' ? 'PIN Baru (6 Digit)' : 'Kata Sandi Baru'}
                </label>
                <input
                  type={modalType === 'pin' ? 'password' : 'password'}
                  className="input-field"
                  placeholder={modalType === 'pin' ? 'Masukkan 6 angka' : 'Minimal 8 karakter'}
                  value={newVal}
                  onChange={(e) => setNewVal(e.target.value)}
                  maxLength={modalType === 'pin' ? 6 : undefined}
                  required
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                  Konfirmasi {modalType === 'pin' ? 'PIN Baru' : 'Kata Sandi Baru'}
                </label>
                <input
                  type={modalType === 'pin' ? 'password' : 'password'}
                  className="input-field"
                  placeholder="Ketik ulang untuk konfirmasi"
                  value={confirmVal}
                  onChange={(e) => setConfirmVal(e.target.value)}
                  maxLength={modalType === 'pin' ? 6 : undefined}
                  required
                />
              </div>

              {modalError && (
                <div style={{ color: 'var(--color-danger)', fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
                  {modalError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
                style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : null}
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--color-surface)', color: 'var(--color-text-primary)',
          padding: '12px 20px', borderRadius: 'var(--radius-full)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 8,
          zIndex: 1000, fontSize: 13, fontWeight: 600, animation: 'slide-up 0.3s ease-out'
        }}>
          <CheckCircle2 size={18} color="var(--color-success)" />
          {toastMessage}
        </div>
      )}
    </div>
  );
}

const menuStyle = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '16px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};

const iconContainerStyle = {
  width: 36,
  height: 36,
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-surface-secondary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

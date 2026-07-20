import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { 
  ShieldCheck, Loader2, ArrowRight, Smartphone, 
  Lock, CheckCircle2, ChevronRight, Fingerprint, 
  HelpCircle, Eye, EyeOff, AlertCircle
} from 'lucide-react';

export default function LoginPage() {
  const authStore = useAuthStore();
  const navigate = useNavigate();

  // Core flow step state
  const [step, setStep] = useState<'splash' | 'welcome' | 'phone' | 'otp' | 'register_profile' | 'pin_create' | 'pin_confirm' | 'biometric_opt' | 'pin_entry' | 'biometric_verify'>('splash');
  
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [otpVal, setOtpVal] = useState(['', '', '', '', '', '']);
  const [pinVal, setPinVal] = useState('');
  const [confirmPinVal, setConfirmPinVal] = useState('');
  const [enteredPinVal, setEnteredPinVal] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Simulated notification popup for OTP
  const [showOtpNotification, setShowOtpNotification] = useState(false);

  // Splash timeout
  useEffect(() => {
    if (step === 'splash') {
      const timer = setTimeout(() => {
        const userId = localStorage.getItem('auth_user_id');
        const biometricEnabled = localStorage.getItem('auth_biometric_enabled') === 'true';
        
        if (userId) {
          if (biometricEnabled) {
            setStep('biometric_verify');
          } else {
            setStep('pin_entry');
          }
        } else {
          setStep('welcome');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Show OTP SMS notification after entering phone number
  useEffect(() => {
    if (step === 'otp') {
      const timer = setTimeout(() => {
        setShowOtpNotification(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowOtpNotification(false);
    }
  }, [step]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 8) return;
    
    // Normalize phone format
    let formattedPhone = phone;
    if (phone.startsWith('0')) {
      formattedPhone = '+62' + phone.slice(1);
    } else if (!phone.startsWith('+')) {
      formattedPhone = '+62' + phone;
    }

    if (authMode === 'login') {
      // Direct login: save phone and go straight to PIN entry
      authStore.setPhoneNumber(formattedPhone);
      setStep('pin_entry');
    } else {
      // Register mode: send OTP first
      const success = await authStore.sendPhoneOTP(formattedPhone);
      if (success) {
        const exists = useAuthStore.getState().phoneExists;
        if (exists) {
          useAuthStore.setState({ error: 'Nomor handphone sudah terdaftar. Silakan masuk (login).' });
          return;
        }
        setStep('otp');
      }
    }
  };

  const handleOtpInput = async (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '').slice(0, 1);
    const newOtp = [...otpVal];
    newOtp[index] = cleanVal;
    setOtpVal(newOtp);

    // Auto-focus next input
    if (cleanVal && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }

    // Submit if complete
    const fullOtp = newOtp.join('');
    if (fullOtp.length === 6) {
      const success = await authStore.verifyPhoneOTP(fullOtp);
      if (success) {
        if (useAuthStore.getState().isFirstLogin) {
          setStep('register_profile');
        } else {
          setStep('pin_entry');
        }
      } else {
        // Reset OTP input on failure
        setOtpVal(['', '', '', '', '', '']);
        document.getElementById('otp-0')?.focus();
      }
    }
  };

  const handlePinGridClick = (num: string) => {
    if (step === 'pin_create') {
      if (pinVal.length < 6) {
        const newVal = pinVal + num;
        setPinVal(newVal);
        if (newVal.length === 6) {
          setTimeout(() => setStep('pin_confirm'), 300);
        }
      }
    } else if (step === 'pin_confirm') {
      if (confirmPinVal.length < 6) {
        const newVal = confirmPinVal + num;
        setConfirmPinVal(newVal);
        if (newVal.length === 6) {
          if (newVal === pinVal) {
            handlePinComplete(newVal);
          } else {
            useAuthStore.setState({ error: 'PIN konfirmasi tidak cocok' });
            setConfirmPinVal('');
          }
        }
      }
    } else if (step === 'pin_entry') {
      if (enteredPinVal.length < 6) {
        const newVal = enteredPinVal + num;
        setEnteredPinVal(newVal);
        if (newVal.length === 6) {
          handlePinVerification(newVal);
        }
      }
    }
  };

  const handlePinDelete = () => {
    if (step === 'pin_create') {
      setPinVal(pinVal.slice(0, -1));
    } else if (step === 'pin_confirm') {
      setConfirmPinVal(confirmPinVal.slice(0, -1));
    } else if (step === 'pin_entry') {
      setEnteredPinVal(enteredPinVal.slice(0, -1));
    }
  };

  const handlePinComplete = async (finalPin: string) => {
    const success = await authStore.setupPIN(finalPin);
    if (success) {
      setStep('biometric_opt');
    }
  };

  const handlePinVerification = async (enteredPin: string) => {
    let success = false;
    
    // If it's a fresh login process (authMode === 'login') with a phone number, use loginWithPhoneAndPin
    if (authMode === 'login') {
      success = await authStore.loginWithPhoneAndPin(enteredPin);
    } else {
      // Otherwise (returning user from splash, or just finished registration), use verifyPIN which requires userId in localStorage
      success = await authStore.verifyPIN(enteredPin);
    }
    
    if (success) {
      navigate('/');
    } else {
      setEnteredPinVal('');
    }
  };

  const handleBiometricChoose = async (enable: boolean) => {
    await authStore.enableBiometricDirectly(enable);
    // Complete PIN verification to get final tokens/session
    const pin = pinVal || '123456';
    const success = await authStore.verifyPIN(pin);
    if (success) {
      navigate('/');
    }
  };

  const handleBiometricSimulate = async () => {
    const success = await authStore.biometricUnlock();
    if (success) {
      navigate('/');
    }
  };

  // Welcome Carousel Slides
  const slides = [
    { title: 'Solusi Finansial Cepat', desc: 'Pinjam dana darurat dengan bunga rendah & tenor fleksibel.', emoji: '⚡' },
    { title: 'Bayar Serba QRIS', desc: 'Belanja di mana saja termasuk Singapura, Malaysia, Thailand.', emoji: '🌐' },
    { title: 'Tumbuhkan Tabungan', desc: 'Buka rekening tabungan berjangka & wujudkan impianmu.', emoji: '📈' }
  ];

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      
      {/* SIMULATED SMS OTP NOTIFICATION POPUP */}
      {showOtpNotification && (
        <div style={{
          position: 'absolute', top: 12, left: 12, right: 12,
          background: 'rgba(0, 0, 0, 0.9)', color: 'white',
          padding: '12px 16px', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          display: 'flex', gap: 12, alignItems: 'flex-start', zIndex: 1000,
          animation: 'slide-down 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <Smartphone size={20} color="var(--color-primary-light)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 2 }}>[SIMULASI SMS] OTP PinjamAJA</p>
            <p style={{ fontSize: 12, lineHeight: 1.4 }}>Kode OTP verifikasi Anda adalah <strong style={{ color: 'var(--color-primary-light)', fontSize: 13 }}>123456</strong>. JANGAN berikan kode ini kepada siapa pun.</p>
          </div>
          <button 
            onClick={() => setShowOtpNotification(false)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
          >
            Tutup
          </button>
        </div>
      )}

      {/* 1. SPLASH SCREEN */}
      {step === 'splash' && (
        <div className="gradient-hero" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <div className="animate-float" style={{
            width: 88, height: 88, borderRadius: 24, background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 44, fontWeight: 900, marginBottom: 20
          }}>
            ⚡
          </div>
          <h1 className="animate-fade-in" style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6 }}>PinjamAJA</h1>
          <p className="animate-fade-in" style={{ fontSize: 14, opacity: 0.8, marginBottom: 40 }}>Keuangan Digital Terpercaya</p>
          <Loader2 className="animate-spin-slow" size={24} style={{ animationDuration: '1.5s' }} />
        </div>
      )}

      {/* 2. WELCOME SCREEN */}
      {step === 'welcome' && (
        <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 24px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: 80, marginBottom: 24 }}>{slides[carouselIndex].emoji}</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 12 }}>
              {slides[carouselIndex].title}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6, maxWidth: 300 }}>
              {slides[carouselIndex].desc}
            </p>
            
            {/* Slide Dots */}
            <div style={{ display: 'flex', gap: 6, marginTop: 32 }}>
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCarouselIndex(i)}
                  style={{
                    width: carouselIndex === i ? 24 : 8, height: 8, borderRadius: 'var(--radius-full)',
                    background: carouselIndex === i ? 'var(--color-primary)' : 'var(--color-border)',
                    border: 'none', transition: 'all 0.3s'
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
            <button
              onClick={() => {
                setAuthMode('login');
                setStep('phone');
              }}
              className="btn-primary"
              style={{ width: '100%', padding: '16px', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              Masuk (Login) <ArrowRight size={18} />
            </button>
            <button
              onClick={() => {
                setAuthMode('register');
                setStep('phone');
              }}
              className="btn-secondary"
              style={{
                width: '100%', padding: '14px', fontSize: 15, display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, background: 'transparent',
                border: '2.5px solid var(--color-primary)', color: 'var(--color-primary)',
                borderRadius: 'var(--radius-full)', fontWeight: 700, cursor: 'pointer'
              }}
            >
              Daftar Akun Baru (Sign Up) <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* 3. PHONE NUMBER LOGIN */}
      {step === 'phone' && (
        <div className="animate-fade-in-up" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 24px' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 8 }}>
            {authMode === 'login' ? 'Masuk ke PinjamAJA' : 'Daftar Akun Baru'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 32 }}>
            {authMode === 'login' 
              ? 'Masukkan nomor handphone Anda yang sudah terdaftar' 
              : 'Masukkan nomor handphone Anda untuk mendaftar akun baru'}
          </p>

          <form onSubmit={handlePhoneSubmit} style={{ flex: 1 }}>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                Nomor HP / Telepon
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{
                  padding: '12px 16px', background: 'var(--color-surface-secondary)',
                  border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                  fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center'
                }}>
                  🇮🇩 +62
                </span>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="81234567xxx"
                  value={phone}
                  onChange={(e) => {
                    authStore.clearError();
                    setPhone(e.target.value.replace(/\D/g, ''));
                  }}
                  style={{ fontSize: 16, fontWeight: 700, flex: 1 }}
                  required
                  autoFocus
                />
              </div>
            </div>

            {authStore.error && (
              <div className="card" style={{ background: 'var(--color-danger-light)', borderColor: '#FFCCCB', padding: 12, display: 'flex', gap: 8, marginBottom: 16 }}>
                <AlertCircle size={16} color="var(--color-danger)" style={{ marginTop: 2 }} />
                <span style={{ fontSize: 12, color: 'var(--color-danger)', fontWeight: 600 }}>{authStore.error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={authStore.isLoading || phone.length < 8}
              style={{ width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {authStore.isLoading ? <Loader2 className="animate-spin-slow" size={18} /> : null}
              {authStore.isLoading ? 'Mengirim OTP...' : 'Lanjutkan'}
            </button>
            
            <button
              type="button"
              onClick={() => {
                authStore.clearError();
                setStep('welcome');
                setAuthMode(null);
              }}
              style={{
                background: 'none', border: 'none', color: 'var(--color-text-secondary)',
                fontSize: 13, fontWeight: 600, marginTop: 16, width: '100%',
                cursor: 'pointer', textAlign: 'center', display: 'block'
              }}
            >
              Kembali ke Menu Utama
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div style={{ background: 'var(--color-surface-secondary)', padding: 14, borderRadius: 12, border: '1px solid var(--color-border)', marginTop: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6 }}>💡 Akun Uji Coba (Demo):</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 10, color: 'var(--color-text-secondary)' }}>
              <span>• Budi Santoso (verified): <strong>081234567890</strong> (PIN: 123456)</span>
              <span>• Siti Rahayu (pending): <strong>081298765432</strong></span>
              <span>• Pendaftaran Baru: masukkan nomor hp apa saja</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. OTP VERIFICATION */}
      {step === 'otp' && (
        <div className="animate-fade-in-up" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 24px' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 8 }}>
            Verifikasi OTP
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 32 }}>
            Masukkan 6 digit kode OTP yang kami kirim ke nomor HP Anda
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
            {otpVal.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="tel"
                value={digit}
                onChange={(e) => handleOtpInput(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && !digit && i > 0) {
                    const prevInput = document.getElementById(`otp-${i - 1}`);
                    prevInput?.focus();
                  }
                }}
                maxLength={1}
                style={{
                  width: 48, height: 48, border: '2px solid var(--color-border)',
                  borderRadius: 12, textAlign: 'center', fontSize: 20, fontWeight: 800,
                  outline: 'none', background: 'var(--color-surface-secondary)'
                }}
              />
            ))}
          </div>

          {authStore.error && (
            <div className="card" style={{ background: 'var(--color-danger-light)', borderColor: '#FFCCCB', padding: 12, display: 'flex', gap: 8, marginBottom: 20, justifyContent: 'center' }}>
              <AlertCircle size={16} color="var(--color-danger)" />
              <span style={{ fontSize: 12, color: 'var(--color-danger)', fontWeight: 600 }}>{authStore.error}</span>
            </div>
          )}

          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
            <span>Belum menerima kode? </span>
            <button 
              type="button" 
              onClick={() => authStore.sendPhoneOTP(authStore.phoneNumber || '')} 
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer' }}
            >
              Kirim Ulang
            </button>
          </div>
        </div>
      )}

      {/* 4.5 REGISTER PROFILE */}
      {step === 'register_profile' && (
        <div className="animate-fade-in-up" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 24px' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 8 }}>
            Lengkapi Profil Anda
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 32 }}>
            Buat akun baru PinjamAJA untuk memulai pendanaan
          </p>

          <form onSubmit={async (e) => {
            e.preventDefault();
            const success = await authStore.registerProfile(fullName, email);
            if (success) {
              setStep('pin_create');
            }
          }} style={{ flex: 1 }}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                Nama Lengkap
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Masukkan nama lengkap"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ fontSize: 15, fontWeight: 600, width: '100%', padding: '12px' }}
                required
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                Email
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ fontSize: 15, fontWeight: 600, width: '100%', padding: '12px' }}
                required
              />
            </div>

            {authStore.error && (
              <div className="card" style={{ background: 'var(--color-danger-light)', borderColor: '#FFCCCB', padding: 12, display: 'flex', gap: 8, marginBottom: 16 }}>
                <AlertCircle size={16} color="var(--color-danger)" style={{ marginTop: 2 }} />
                <span style={{ fontSize: 12, color: 'var(--color-danger)', fontWeight: 600 }}>{authStore.error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={authStore.isLoading || !fullName || !email}
              style={{ width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {authStore.isLoading ? <Loader2 className="animate-spin" size={18} /> : null}
              Lanjutkan Ke PIN
            </button>
          </form>
        </div>
      )}

      {/* 5. CREATE PIN SCREEN */}
      {(step === 'pin_create' || step === 'pin_confirm' || step === 'pin_entry') && (
        <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 8 }}>
              {step === 'pin_create' ? 'Buat PIN Transaksi' : step === 'pin_confirm' ? 'Konfirmasi PIN Anda' : 'Masukkan PIN Anda'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
              {step === 'pin_create' ? 'PIN digunakan untuk keamanan login & bertransaksi' : step === 'pin_confirm' ? 'Ketik ulang PIN yang baru Anda buat' : 'Masukkan PIN 6-digit untuk melanjutkan'}
            </p>
            
            {/* Dots representing entered PIN */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, margin: '20px 0' }}>
              {Array.from({ length: 6 }).map((_, i) => {
                const currentLen = step === 'pin_create' ? pinVal.length : step === 'pin_confirm' ? confirmPinVal.length : enteredPinVal.length;
                const isFilled = i < currentLen;
                return (
                  <div key={i} style={{
                    width: 14, height: 14, borderRadius: '50%',
                    border: '2px solid var(--color-primary)',
                    background: isFilled ? 'var(--color-primary)' : 'none',
                    transition: 'all 0.15s ease'
                  }} />
                );
              })}
            </div>

            {step === 'pin_entry' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 }}>
                <input 
                  type="checkbox" 
                  id="rememberDevice" 
                  checked={rememberDevice} 
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  style={{ width: 15, height: 15, cursor: 'pointer' }}
                />
                <label htmlFor="rememberDevice" style={{ fontSize: 12, color: 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: 600 }}>
                  Percayai perangkat ini (Trusted Device)
                </label>
              </div>
            )}

            {authStore.error && (
              <div style={{ color: 'var(--color-danger)', fontSize: 12, fontWeight: 600, marginTop: 8 }}>
                {authStore.error}
              </div>
            )}
          </div>

          {/* Number Pad Grid */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 16 }}>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px 24px',
              justifyItems: 'center', maxWidth: 300, margin: '0 auto'
            }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handlePinGridClick(num)}
                  className="keypad-btn"
                >
                  {num}
                </button>
              ))}
              <button 
                type="button" 
                onClick={() => setStep('phone')}
                style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)', border: 'none', background: 'none', cursor: 'pointer' }}
              >
                Kembali
              </button>
              <button
                key="0"
                type="button"
                onClick={() => handlePinGridClick('0')}
                className="keypad-btn"
              >
                0
              </button>
              <button
                type="button"
                onClick={handlePinDelete}
                style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-danger)', border: 'none', background: 'none', cursor: 'pointer' }}
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. BIOMETRIC OPTION */}
      {step === 'biometric_opt' && (
        <div className="animate-scale-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 24px', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', background: 'var(--color-primary-50)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24
          }}>
            <Fingerprint size={48} color="var(--color-primary)" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 8 }}>
            Aktifkan Login Biometrik
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 40, maxWidth: 300 }}>
            Aktifkan pemindaian sidik jari atau Face ID agar masuk ke PinjamAJA lebih cepat & aman
          </p>

          <button
            onClick={() => handleBiometricChoose(true)}
            className="btn-primary"
            style={{ width: '100%', padding: '16px', marginBottom: 12 }}
          >
            Aktifkan Sekarang
          </button>
          
          <button
            onClick={() => handleBiometricChoose(false)}
            className="btn-ghost"
            style={{ width: '100%', padding: '12px', fontSize: 14, color: 'var(--color-text-muted)' }}
          >
            Nanti Saja
          </button>
        </div>
      )}

      {/* 7. BIOMETRIC VERIFICATION (RETURNING USER TRUSTED DEVICE) */}
      {step === 'biometric_verify' && (
        <div className="animate-scale-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 24px', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--color-primary)', letterSpacing: '-0.02em', marginBottom: 32 }}>
            PinjamAJA
          </h1>
          
          <button
            onClick={handleBiometricSimulate}
            style={{
              width: 96, height: 96, borderRadius: '50%', border: 'none',
              background: 'var(--color-primary-50)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-blue)', marginBottom: 24,
              animation: 'pulse-glow 2s infinite'
            }}
          >
            {authStore.isLoading ? (
              <Loader2 className="animate-spin" size={36} color="var(--color-primary)" />
            ) : (
              <Fingerprint size={48} color="var(--color-primary)" />
            )}
          </button>
          
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 6 }}>
            Sentuh Sensor Sidik Jari
          </h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 48 }}>
            Verifikasi identitas Anda untuk masuk langsung
          </p>
          
          <button
            onClick={() => setStep('pin_entry')}
            className="btn-outline"
            style={{ padding: '12px 24px', fontSize: 13 }}
          >
            Masuk Menggunakan PIN
          </button>
        </div>
      )}

    </div>
  );
}

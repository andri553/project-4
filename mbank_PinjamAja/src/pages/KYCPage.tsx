import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, FileText, CheckCircle2, UserCheck, Eye, Loader2, ShieldCheck, XCircle, RotateCcw, Clock } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useAuthStore } from '@/stores/authStore';
import { useKYCStore } from '@/stores/kycStore';
import { FACE_MATCH_THRESHOLD } from '@/data/kycData';

const STEP_CONFIG = [
  { key: 'ktp_upload', label: 'Upload KTP', icon: FileText },
  { key: 'ocr_review', label: 'Data OCR', icon: Eye },
  { key: 'selfie_capture', label: 'Selfie', icon: Camera },
  { key: 'face_matching', label: 'Face Match', icon: UserCheck },
  { key: 'result', label: 'Hasil', icon: CheckCircle2 },
] as const;

function getStepIndex(step: string): number {
  const idx = STEP_CONFIG.findIndex(s => s.key === step);
  return idx >= 0 ? idx : -1;
}

export default function KYCPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  const user = useAuthStore(s => s.user)!;
  const {
    currentStep, isProcessing, ocrData, matchScore, faceMatchPassed,
    startKYC, uploadKTP, confirmOCR, captureSelfie, performFaceMatch, submitKYC,
    retryKYC, resetWorkflow, getCurrentVerification,
  } = useKYCStore();

  const verification = getCurrentVerification();

  // Start KYC workflow on mount if idle
  useEffect(() => {
    if (currentStep === 'idle') {
      // If already verified or pending, don't start workflow
      if (user.kycStatus === 'verified' || user.kycStatus === 'pending') return;
      startKYC();
    }
    return () => {
      // Cleanup on unmount — only reset workflow state, not the verification data
      resetWorkflow();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If user is already verified
  if (user.kycStatus === 'verified') {
    return (
      <div style={{ paddingBottom: 80 }}>
        <PageHeader title="Verifikasi Identitas" onBack={() => navigate('/account')} />
        <div className="animate-scale-in" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <ShieldCheck size={40} color="var(--color-success)" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Sudah Terverifikasi</h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 24 }}>
            Identitas Anda telah berhasil diverifikasi. Semua fitur telah tersedia.
          </p>
          {verification?.matchScore && (
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 24 }}>
              Face Match Score: <strong>{verification.matchScore}%</strong>
            </p>
          )}
          <button className="btn-primary" onClick={() => navigate(redirect || '/account')} style={{ width: '100%', padding: '14px' }}>
            {redirect ? 'Lanjut ke Fitur' : 'Kembali ke Akun'}
          </button>
        </div>
      </div>
    );
  }

  // If pending review by officer
  if (user.kycStatus === 'pending' && currentStep === 'idle') {
    return (
      <div style={{ paddingBottom: 80 }}>
        <PageHeader title="Verifikasi Identitas" onBack={() => navigate('/account')} />
        <div className="animate-scale-in" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Clock size={40} color="#f59e0b" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Menunggu Verifikasi</h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8, lineHeight: 1.6 }}>
            Data verifikasi Anda telah dikirim ke tim kami. Petugas verifikasi akan meninjau data Anda.
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 24 }}>
            Anda akan menerima notifikasi saat proses selesai.
          </p>
          <button className="btn-primary" onClick={() => navigate('/account')} style={{ width: '100%', padding: '14px' }}>
            Kembali ke Akun
          </button>
        </div>
      </div>
    );
  }

  const activeStepIndex = getStepIndex(currentStep);

  const handleBack = () => {
    if (currentStep === 'ktp_upload') {
      resetWorkflow();
      navigate('/account');
    }
    // Other steps don't support going back (data integrity)
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      <PageHeader title="Verifikasi Identitas" onBack={handleBack} />

      {/* Progress Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '24px 16px 16px' }}>
        {STEP_CONFIG.map((s, i) => {
          const Icon = s.icon;
          const isActive = activeStepIndex >= i;
          const isCurrent = activeStepIndex === i;
          return (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: isActive ? 'var(--color-primary)' : 'var(--color-surface-secondary)',
                  color: isActive ? 'white' : 'var(--color-text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isCurrent ? '0 0 0 3px rgba(59,130,246,0.3)' : 'none',
                  transition: 'all 0.3s ease',
                }}>
                  <Icon size={16} />
                </div>
                <span style={{ fontSize: 9, color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: isActive ? 700 : 400 }}>
                  {s.label}
                </span>
              </div>
              {i < STEP_CONFIG.length - 1 && (
                <div style={{ width: 20, height: 2, background: activeStepIndex > i ? 'var(--color-primary)' : 'var(--color-surface-secondary)', transition: 'background 0.3s ease', marginBottom: 18 }} />
              )}
            </div>
          );
        })}
      </div>

      <div style={{ padding: '16px' }}>
        {/* Step 1: Upload KTP */}
        {currentStep === 'ktp_upload' && (
          <div className="animate-fade-in-up">
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Foto KTP</h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              Pastikan foto KTP terlihat jelas, tidak terpotong, dan tidak memantulkan cahaya.
            </p>

            <div style={{
              width: '100%', height: 200, borderRadius: 'var(--radius-lg)',
              border: '2px dashed var(--color-primary)', background: 'var(--color-primary-50)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16
            }}>
              <FileText size={40} color="var(--color-primary)" />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>Ambil Foto KTP</span>
            </div>

            <div style={{ background: 'rgba(59,130,246,0.06)', borderRadius: 10, padding: '12px 14px', marginBottom: 24 }}>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                💡 Pastikan seluruh KTP terlihat • Hindari pantulan cahaya • Foto dalam posisi landscape
              </p>
            </div>

            <button className="btn-primary" onClick={uploadKTP} disabled={isProcessing} style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {isProcessing ? <><Loader2 size={18} className="spin" /> Memproses...</> : 'Upload & Proses OCR'}
            </button>
          </div>
        )}

        {/* Step 2: OCR Review */}
        {currentStep === 'ocr_review' && ocrData && (
          <div className="animate-fade-in-up">
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Cek Data KTP</h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              Data berikut dibaca otomatis dari KTP Anda. Pastikan sudah benar.
            </p>

            <div className="card" style={{ padding: 16, marginBottom: 24 }}>
              <div style={{ display: 'grid', gap: 14, fontSize: 12 }}>
                {[
                  { label: 'NIK', value: ocrData.nik },
                  { label: 'Nama Lengkap', value: ocrData.nama },
                  { label: 'Tempat, Tanggal Lahir', value: `${ocrData.tempatLahir}, ${ocrData.tanggalLahir}` },
                  { label: 'Jenis Kelamin', value: ocrData.jenisKelamin },
                  { label: 'Alamat', value: `${ocrData.alamat} RT ${ocrData.rt}/RW ${ocrData.rw}` },
                  { label: 'Kel/Desa', value: ocrData.kelurahan },
                  { label: 'Kecamatan', value: ocrData.kecamatan },
                  { label: 'Agama', value: ocrData.agama },
                  { label: 'Status', value: ocrData.statusPerkawinan },
                  { label: 'Pekerjaan', value: ocrData.pekerjaan },
                  { label: 'Kewarganegaraan', value: ocrData.kewarganegaraan },
                  { label: 'Berlaku Hingga', value: ocrData.berlakuHingga },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <span style={{ color: 'var(--color-text-secondary)', display: 'block', marginBottom: 2, fontSize: 11 }}>{label}</span>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn-primary" onClick={confirmOCR} style={{ width: '100%', padding: '14px' }}>
              Data Sudah Benar
            </button>
          </div>
        )}

        {/* Step 3: Selfie Capture */}
        {currentStep === 'selfie_capture' && (
          <div className="animate-fade-in-up">
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Verifikasi Wajah</h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              Lepaskan kacamata dan masker. Posisikan wajah Anda dalam bingkai yang disediakan.
            </p>

            <div style={{
              width: 220, height: 300, borderRadius: 110, margin: '0 auto 24px',
              border: '4px solid var(--color-primary)', background: 'var(--color-surface-secondary)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
              position: 'relative', overflow: 'hidden',
            }}>
              {isProcessing ? (
                <>
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(180deg, rgba(59,130,246,0.15) 0%, transparent 50%, rgba(59,130,246,0.15) 100%)',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }} />
                  <Loader2 size={40} color="var(--color-primary)" className="spin" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>Mengambil Foto...</span>
                </>
              ) : (
                <>
                  <Camera size={48} color="var(--color-text-muted)" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>Siap Scan</span>
                </>
              )}
            </div>

            <button className="btn-primary" onClick={captureSelfie} disabled={isProcessing} style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {isProcessing ? <><Loader2 size={18} className="spin" /> Memproses...</> : 'Ambil Selfie'}
            </button>
          </div>
        )}

        {/* Step 4: Face Matching */}
        {currentStep === 'face_matching' && (
          <div className="animate-fade-in-up">
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Pencocokan Wajah</h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              Sistem sedang mencocokkan foto selfie dengan foto KTP Anda.
            </p>

            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              {isProcessing ? (
                <div className="animate-fade-in">
                  <div style={{
                    width: 120, height: 120, borderRadius: '50%', margin: '0 auto 24px',
                    border: '4px solid var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}>
                    <UserCheck size={48} color="var(--color-primary)" />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Mencocokkan wajah...</p>
                  <div style={{ width: '60%', height: 4, borderRadius: 2, background: 'var(--color-surface-secondary)', margin: '16px auto', overflow: 'hidden' }}>
                    <div style={{ width: '70%', height: '100%', background: 'var(--color-primary)', borderRadius: 2, animation: 'indeterminate 1.5s ease-in-out infinite' }} />
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--color-text-muted)' }}>Siap untuk pencocokan</p>
              )}
            </div>

            <button className="btn-primary" onClick={performFaceMatch} disabled={isProcessing} style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {isProcessing ? <><Loader2 size={18} className="spin" /> Mencocokkan...</> : 'Mulai Pencocokan'}
            </button>
          </div>
        )}

        {/* Step 5: Result */}
        {currentStep === 'result' && (
          <div className="animate-scale-in" style={{ textAlign: 'center', padding: '24px 0' }}>
            {faceMatchPassed ? (
              // Face match passed — submit to officer queue
              user.kycStatus === 'pending' ? (
                // Already submitted
                <>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <Clock size={40} color="#f59e0b" />
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Menunggu Verifikasi</h2>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8, lineHeight: 1.6 }}>
                    Data verifikasi Anda telah dikirim ke tim verifikasi kami.
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                    Face Match Score: <strong style={{ color: 'var(--color-success)' }}>{matchScore}%</strong>
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 32, padding: '10px', background: 'rgba(251,191,36,0.08)', borderRadius: 8 }}>
                    Petugas verifikasi akan meninjau KTP, data OCR, selfie, dan skor face match Anda. Anda akan menerima notifikasi saat proses selesai.
                  </p>
                  <button className="btn-primary" onClick={() => navigate('/account')} style={{ width: '100%', padding: '14px' }}>
                    Kembali ke Akun
                  </button>
                </>
              ) : (
                // Ready to submit
                <>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <CheckCircle2 size={40} color="var(--color-success)" />
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Pencocokan Berhasil!</h2>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8, lineHeight: 1.6 }}>
                    Wajah Anda berhasil dicocokkan dengan foto KTP.
                  </p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', marginBottom: 24 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-success)' }}>Score: {matchScore}%</span>
                    <CheckCircle2 size={16} color="var(--color-success)" />
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 24 }}>
                    Threshold: {FACE_MATCH_THRESHOLD}% • Status: <strong style={{ color: 'var(--color-success)' }}>Lulus</strong>
                  </p>
                  <button
                    className="btn-primary"
                    onClick={async () => {
                      const success = await submitKYC();
                      if (success) {
                        navigate('/');
                      }
                    }}
                    disabled={isProcessing}
                    style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    {isProcessing ? <><Loader2 size={18} className="spin" /> Mengirim...</> : 'Kirim ke Tim Verifikasi'}
                  </button>
                </>
              )
            ) : (
              // Face match failed
              <>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <XCircle size={40} color="#ef4444" />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: '#ef4444' }}>Pencocokan Gagal</h2>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8, lineHeight: 1.6 }}>
                  Wajah selfie tidak cocok dengan foto KTP Anda.
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 20, background: 'rgba(239,68,68,0.1)', marginBottom: 16 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>Score: {matchScore}%</span>
                  <XCircle size={16} color="#ef4444" />
                </div>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 24 }}>
                  Threshold: {FACE_MATCH_THRESHOLD}% • Status: <strong style={{ color: '#ef4444' }}>Tidak Lulus</strong>
                </p>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 24, padding: '10px', background: 'rgba(239,68,68,0.06)', borderRadius: 8 }}>
                  Pastikan pencahayaan cukup, wajah tidak tertutup, dan foto KTP jelas.
                </p>
                <button className="btn-primary" onClick={retryKYC} style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <RotateCcw size={16} /> Coba Lagi dari Awal
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

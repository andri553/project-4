import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, FileText, CheckCircle2, UserCheck, Eye, Loader2, ShieldCheck, XCircle, RotateCcw, Clock, Upload, Video, RefreshCw } from 'lucide-react';
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

  // Real Camera States & Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);

  // Editable OCR form state
  const [formOcr, setFormOcr] = useState<any>(null);

  const handleProcessOCR = () => {
    setOcrProgress(0);
    uploadKTP(capturedImage || undefined, (p) => setOcrProgress(p));
  };

  useEffect(() => {
    if (currentStep === 'ocr_review' && ocrData) {
      setFormOcr(ocrData);
    }
  }, [currentStep, ocrData]);

  const handleConfirmOCR = () => {
    if (formOcr) {
      confirmOCR(formOcr);
    } else {
      confirmOCR();
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    stopCamera();
    setCapturedImage(null);
    setCameraError(null);
  }, [currentStep]);

  const startCamera = async (facingMode: 'user' | 'environment' = 'environment') => {
    stopCamera();
    setCameraError(null);
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
    } catch (err1) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (err2: any) {
        console.error('Camera error:', err2);
        setCameraError('Gagal mengakses kamera. Silakan periksa izin browser atau gunakan opsi upload / simulasi.');
        setCameraActive(false);
        return;
      }
    }

    if (stream) {
      setCameraStream(stream);
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error('Error playing video stream:', e));
        }
      }, 50);
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCapturedImage(reader.result as string);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  // Start KYC workflow on mount if idle
  useEffect(() => {
    if (currentStep === 'idle') {
      if (user.kycStatus === 'verified' || user.kycStatus === 'pending') return;
      startKYC();
    }
    return () => {
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
      stopCamera();
      resetWorkflow();
      navigate('/account');
    }
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      <PageHeader title="Verifikasi Identitas" onBack={handleBack} />

      {/* Hidden Canvas for Snapshots */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Hidden File Input for Fallback Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

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
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
              Pastikan foto KTP terlihat jelas, tidak terpotong, dan tidak memantulkan cahaya.
            </p>

            {cameraError && (
              <div style={{ padding: '12px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 10, color: '#ef4444', fontSize: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <XCircle size={16} />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Camera Viewport / Preview Box */}
            <div
              onClick={() => {
                if (!cameraActive && !capturedImage) {
                  startCamera('environment');
                }
              }}
              style={{
                width: '100%', height: 230, borderRadius: 'var(--radius-lg)',
                border: '2px dashed var(--color-primary)', background: '#0f172a',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16,
                position: 'relative', overflow: 'hidden',
                cursor: (!cameraActive && !capturedImage) ? 'pointer' : 'default'
              }}
            >
              {capturedImage ? (
                // Show captured image preview
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <img src={capturedImage} alt="Captured KTP" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(16,185,129,0.9)', color: 'white', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={14} /> Terfoto
                  </div>
                </div>
              ) : cameraActive ? (
                // Show Live Camera Stream
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {/* KTP Framing Guide Overlay */}
                  <div style={{
                    position: 'absolute', inset: 20, border: '2px dashed #3b82f6', borderRadius: 8,
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)', pointerEvents: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600, background: 'rgba(0,0,0,0.6)', padding: '4px 12px', borderRadius: 20 }}>
                      Posisikan KTP di sini
                    </span>
                  </div>
                </div>
              ) : (
                // Idle Camera Placeholder
                <>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={28} color="var(--color-primary)" />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>Siap Ambil Foto KTP (Klik di sini)</span>
                </>
              )}
            </div>

            <div style={{ background: 'rgba(59,130,246,0.06)', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                💡 Pastikan seluruh KTP terlihat • Hindari pantulan cahaya • Foto dalam posisi mendatar (landscape)
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'grid', gap: 10 }}>
              {capturedImage ? (
                <>
                  <button
                    className="btn-primary"
                    onClick={handleProcessOCR}
                    disabled={isProcessing}
                    style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    {isProcessing ? (
                      <><Loader2 size={18} className="spin" /> Membaca Teks Gambar KTP ({ocrProgress > 0 ? `${ocrProgress}%` : 'Scanning...'})</>
                    ) : (
                      'Proses & Scan Teks KTP (Real OCR)'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedImage(null);
                      startCamera('environment');
                    }}
                    disabled={isProcessing}
                    style={{
                      width: '100%', padding: '12px', background: 'transparent',
                      border: '1px solid var(--color-surface-secondary)', color: 'var(--color-text-secondary)',
                      borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}
                  >
                    <RefreshCw size={16} /> Foto Ulang
                  </button>
                </>
              ) : cameraActive ? (
                <>
                  <button
                    className="btn-primary"
                    onClick={takeSnapshot}
                    style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <Camera size={18} /> Tangkap Foto KTP
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    style={{
                      width: '100%', padding: '10px', background: 'transparent',
                      border: 'none', color: 'var(--color-text-muted)', fontSize: 13
                    }}
                  >
                    Batal Kamera
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn-primary"
                    onClick={() => startCamera('environment')}
                    style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <Video size={18} /> Buka Kamera KTP
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: '100%', padding: '12px', background: 'var(--color-surface-secondary)',
                      border: 'none', color: 'var(--color-text-secondary)',
                      borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}
                  >
                    <Upload size={16} /> Upload dari Galeri
                  </button>
                  <button
                    type="button"
                    onClick={() => uploadKTP()}
                    disabled={isProcessing}
                    style={{
                      width: '100%', padding: '12px', background: 'transparent',
                      border: '1px dashed var(--color-primary)', color: 'var(--color-primary)',
                      borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}
                  >
                    {isProcessing ? <><Loader2 size={16} className="spin" /> Memproses...</> : 'Gunakan Simulasi KTP Default'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 2: OCR Review (Editable Form) */}
        {currentStep === 'ocr_review' && (formOcr || ocrData) && (
          <div className="animate-fade-in-up">
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Cek & Edit Data KTP</h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
              Data berikut dibaca otomatis dari KTP. Anda dapat menyesuaikan atau mengedit data jika terdapat ketidaksesuaian dengan KTP fisik Anda.
            </p>

            <div className="card" style={{ padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>NIK (Nomor Induk Kependudukan)</label>
                  <input
                    type="text"
                    className="input"
                    value={formOcr?.nik || ''}
                    onChange={(e) => setFormOcr({ ...formOcr, nik: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', fontSize: 13, fontWeight: 700, borderRadius: 8, border: '1px solid var(--color-border)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Nama Lengkap (Sesuai KTP)</label>
                  <input
                    type="text"
                    className="input"
                    value={formOcr?.nama || ''}
                    onChange={(e) => setFormOcr({ ...formOcr, nama: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', fontSize: 13, fontWeight: 700, borderRadius: 8, border: '1px solid var(--color-border)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Tempat Lahir</label>
                    <input
                      type="text"
                      className="input"
                      value={formOcr?.tempatLahir || ''}
                      onChange={(e) => setFormOcr({ ...formOcr, tempatLahir: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: '1px solid var(--color-border)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Tanggal Lahir</label>
                    <input
                      type="text"
                      className="input"
                      value={formOcr?.tanggalLahir || ''}
                      onChange={(e) => setFormOcr({ ...formOcr, tanggalLahir: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: '1px solid var(--color-border)' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Jenis Kelamin</label>
                  <select
                    className="input"
                    value={formOcr?.jenisKelamin || 'LAKI-LAKI'}
                    onChange={(e) => setFormOcr({ ...formOcr, jenisKelamin: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
                  >
                    <option value="LAKI-LAKI">LAKI-LAKI</option>
                    <option value="PEREMPUAN">PEREMPUAN</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Alamat Lengkap</label>
                  <input
                    type="text"
                    className="input"
                    value={formOcr?.alamat || ''}
                    onChange={(e) => setFormOcr({ ...formOcr, alamat: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: '1px solid var(--color-border)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Kel/Desa</label>
                    <input
                      type="text"
                      className="input"
                      value={formOcr?.kelurahan || ''}
                      onChange={(e) => setFormOcr({ ...formOcr, kelurahan: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: '1px solid var(--color-border)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Kecamatan</label>
                    <input
                      type="text"
                      className="input"
                      value={formOcr?.kecamatan || ''}
                      onChange={(e) => setFormOcr({ ...formOcr, kecamatan: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: '1px solid var(--color-border)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Agama</label>
                    <input
                      type="text"
                      className="input"
                      value={formOcr?.agama || ''}
                      onChange={(e) => setFormOcr({ ...formOcr, agama: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: '1px solid var(--color-border)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Pekerjaan</label>
                    <input
                      type="text"
                      className="input"
                      value={formOcr?.pekerjaan || ''}
                      onChange={(e) => setFormOcr({ ...formOcr, pekerjaan: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: '1px solid var(--color-border)' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button className="btn-primary" onClick={handleConfirmOCR} style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <CheckCircle2 size={18} /> Simpan & Konfirmasi Data KTP
            </button>
          </div>
        )}

        {/* Step 3: Selfie Capture */}
        {currentStep === 'selfie_capture' && (
          <div className="animate-fade-in-up">
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Verifikasi Wajah</h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
              Lepaskan kacamata dan masker. Posisikan wajah Anda dalam bingkai yang disediakan.
            </p>

            {cameraError && (
              <div style={{ padding: '12px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 10, color: '#ef4444', fontSize: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <XCircle size={16} />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Oval Face Framing Container */}
            <div style={{
              width: 230, height: 300, borderRadius: 115, margin: '0 auto 24px',
              border: '4px solid var(--color-primary)', background: '#0f172a',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
              position: 'relative', overflow: 'hidden', boxShadow: '0 0 20px rgba(59,130,246,0.2)'
            }}>
              {capturedImage ? (
                // Show captured selfie preview
                <img src={capturedImage} alt="Selfie Snapshot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : cameraActive ? (
                // Show Live Selfie Stream
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    border: '2px dashed rgba(255,255,255,0.6)', borderRadius: 115, pointerEvents: 'none'
                  }} />
                </div>
              ) : isProcessing ? (
                <>
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(180deg, rgba(59,130,246,0.15) 0%, transparent 50%, rgba(59,130,246,0.15) 100%)',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }} />
                  <Loader2 size={40} color="var(--color-primary)" className="spin" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>Memproses...</span>
                </>
              ) : (
                <>
                  <Camera size={48} color="var(--color-text-muted)" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>Siap Scan Wajah</span>
                </>
              )}
            </div>

            {/* Action Buttons for Selfie */}
            <div style={{ display: 'grid', gap: 10 }}>
              {capturedImage ? (
                <>
                  <button
                    className="btn-primary"
                    onClick={captureSelfie}
                    disabled={isProcessing}
                    style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    {isProcessing ? <><Loader2 size={18} className="spin" /> Memproses Selfie...</> : 'Gunakan Foto Ini'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedImage(null);
                      startCamera('user');
                    }}
                    disabled={isProcessing}
                    style={{
                      width: '100%', padding: '12px', background: 'transparent',
                      border: '1px solid var(--color-surface-secondary)', color: 'var(--color-text-secondary)',
                      borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}
                  >
                    <RefreshCw size={16} /> Foto Ulang Selfie
                  </button>
                </>
              ) : cameraActive ? (
                <>
                  <button
                    className="btn-primary"
                    onClick={takeSnapshot}
                    style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <Camera size={18} /> Ambil Selfie
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    style={{
                      width: '100%', padding: '10px', background: 'transparent',
                      border: 'none', color: 'var(--color-text-muted)', fontSize: 13
                    }}
                  >
                    Tutup Kamera
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn-primary"
                    onClick={() => startCamera('user')}
                    style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <Video size={18} /> Buka Kamera Selfie
                  </button>
                  <button
                    type="button"
                    onClick={captureSelfie}
                    disabled={isProcessing}
                    style={{
                      width: '100%', padding: '12px', background: 'var(--color-surface-secondary)',
                      border: 'none', color: 'var(--color-text-secondary)',
                      borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}
                  >
                    Gunakan Simulasi Default
                  </button>
                </>
              )}
            </div>
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
              user.kycStatus === 'pending' ? (
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

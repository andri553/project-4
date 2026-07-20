import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ShieldCheck, ShieldAlert, Clock, AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react';

interface KYCGuardProps {
  children: React.ReactNode;
  featureName: string;
  redirectPath?: string;
}

export default function KYCGuard({ children, featureName, redirectPath }: KYCGuardProps) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const kycStatus = user.kycStatus;
  const kycLower = kycStatus?.toLowerCase();
  const redirect = redirectPath || location.pathname;

  // Verified / Approved → pass through (case-insensitive to handle backend 'APPROVED')
  if (kycLower === 'verified' || kycLower === 'approved') {
    return <>{children}</>;
  }

  // Not verified → show gate
  return (
    <div className="animate-fade-in" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', background: 'var(--color-bg)' }}>
      <div className="card" style={{ maxWidth: 400, width: '100%', textAlign: 'center', padding: '40px 28px' }}>
        {kycStatus === 'pending' || kycStatus === 'pending_review' ? (
          // Pending Review
          <>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px',
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Clock size={36} color="white" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--color-text)' }}>
              Sedang Diproses
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
              Verifikasi identitas Anda sedang ditinjau oleh Chief Information Security Officer (CISO). 
              Anda akan menerima notifikasi saat proses selesai.
            </p>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 24 }}>
              Fitur <strong>{featureName}</strong> memerlukan verifikasi identitas yang valid.
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}
            >
              <ArrowLeft size={16} /> Kembali
            </button>
          </>
        ) : kycStatus === 'rejected' ? (
          // Rejected
          <>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={36} color="white" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--color-text)' }}>
              Verifikasi Ditolak
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
              Verifikasi identitas Anda sebelumnya ditolak oleh CISO. Silakan lakukan verifikasi ulang untuk mengakses fitur ini.
            </p>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 24 }}>
              Fitur <strong>{featureName}</strong> memerlukan verifikasi identitas yang valid.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/kyc?redirect=${encodeURIComponent(redirect)}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}
              >
                <ShieldCheck size={18} /> Verifikasi Ulang
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate(-1)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}
              >
                <ArrowLeft size={16} /> Kembali
              </button>
            </div>
          </>
        ) : kycStatus === 'reupload_required' ? (
          // Reupload Required
          <>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={36} color="white" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--color-text)' }}>
              Unggah Ulang Dokumen
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
              Dokumen verifikasi Anda tidak lengkap atau tidak jelas. CISO meminta Anda mengunggah ulang dokumen identitas Anda.
            </p>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 24 }}>
              Fitur <strong>{featureName}</strong> memerlukan verifikasi identitas yang valid.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/kyc?redirect=${encodeURIComponent(redirect)}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}
              >
                <ShieldCheck size={18} /> Unggah Ulang Dokumen
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate(-1)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}
              >
                <ArrowLeft size={16} /> Kembali
              </button>
            </div>
          </>
        ) : kycStatus === 'suspended' ? (
          // Suspended
          <>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px',
              background: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShieldAlert size={36} color="white" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--color-text)' }}>
              Verifikasi Ditangguhkan
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
              Verifikasi identitas Anda telah ditangguhkan karena alasan keamanan oleh CISO.
            </p>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 24, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: 10 }}>
              Akun Anda dalam status pembatasan keamanan. Silakan hubungi customer service kami untuk bantuan lebih lanjut.
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}
            >
              <ArrowLeft size={16} /> Kembali
            </button>
          </>
        ) : (
          // Unverified / Not Started / In Progress
          <>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShieldAlert size={36} color="white" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--color-text)' }}>
              Verifikasi Diperlukan
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
              Untuk mengakses <strong>{featureName}</strong>, Anda perlu melakukan verifikasi identitas (e-KYC) terlebih dahulu.
            </p>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 24, padding: '10px 14px', background: 'rgba(59,130,246,0.08)', borderRadius: 10 }}>
              Proses verifikasi mencakup upload KTP, pengenalan wajah, dan review oleh CISO. Biasanya selesai dengan cepat.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/kyc?redirect=${encodeURIComponent(redirect)}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}
              >
                Mulai Verifikasi <ArrowRight size={16} />
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate(-1)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}
              >
                <ArrowLeft size={16} /> Kembali
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, ChevronRight, Shield, Smartphone, Bell, HelpCircle,
  FileText, Lock, Fingerprint, Eye, CheckCircle2, AlertCircle, Clock,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getInitials, formatDate } from '@/helpers/format';
import { devices, profiles } from '@/data/mockData';
import StatusBadge from '@/components/StatusBadge';
import { useKYCStore } from '@/stores/kycStore';

export default function AccountPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user)!;
  const logout = useAuthStore((s) => s.logout);
  const kyc = useKYCStore((s) => s.getVerificationByUserId(user.id));
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleToggleMFA = async () => {
    const nextVal = !user.mfaEnabled;
    await useAuthStore.getState().updateSecuritySettings({ mfaEnabled: nextVal });
    setToastMessage(nextVal ? 'MFA diaktifkan & diperbarui ke SecureNusa' : 'MFA dinonaktifkan & diperbarui ke SecureNusa');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleBiometrics = async () => {
    const nextVal = !user.biometricEnabled;
    await useAuthStore.getState().updateSecuritySettings({ biometricEnabled: nextVal });
    setToastMessage(nextVal ? 'Biometrik diaktifkan & diperbarui ke SecureNusa' : 'Biometrik dinonaktifkan & diperbarui ke SecureNusa');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const profile = profiles.find((p) => p.userId === user.id);
  const userDevices = devices.filter((d) => d.userId === user.id);

  const menuItems = [
    { icon: Shield, label: 'Keamanan Akun', desc: 'MFA, password, biometrik', onClick: () => navigate('/security') },
    { icon: Smartphone, label: 'Perangkat Terdaftar', desc: `${userDevices.length} perangkat`, onClick: () => navigate('/devices') },
    { icon: Bell, label: 'Notifikasi', desc: 'Pengaturan notifikasi', onClick: () => navigate('/notifications') },
    { icon: FileText, label: 'Riwayat Transaksi', desc: 'Semua transaksi', onClick: () => navigate('/transactions') },
    { icon: HelpCircle, label: 'Bantuan & FAQ', desc: 'Pusat bantuan', onClick: () => navigate('/help') },
  ];

  const getKYCSteps = () => {
    if (!kyc) return [];
    return [
      { label: 'Upload KTP', done: kyc.ktpUploaded, icon: FileText },
      { label: 'OCR Verifikasi', done: kyc.ocrCompleted, icon: Eye },
      { label: 'Verifikasi Wajah', done: kyc.faceVerified, icon: Fingerprint },
      { label: 'Selfie Verifikasi', done: kyc.selfieVerified, icon: CheckCircle2 },
    ];
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: 75, left: '50%', transform: 'translateX(-50%)',
          background: '#0F172A', color: 'white',
          padding: '10px 18px', borderRadius: 20, fontSize: 12, fontWeight: 600,
          zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 8,
          border: '1px solid #334155'
        }}>
          <CheckCircle2 size={16} color="#10B981" />
          {toastMessage}
        </div>
      )}

      {/* Profile Header — Clean white style */}
      <div
        className="safe-top animate-fade-in"
        style={{
          padding: '24px 20px 20px',
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border-light)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 800,
              color: 'white',
              boxShadow: 'var(--shadow-blue)',
            }}
          >
            {getInitials(user.fullName)}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 2, color: 'var(--color-text-primary)' }}>{user.fullName}</h2>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{user.email}</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-primary-50)', fontSize: 10, fontWeight: 600, color: 'var(--color-primary)' }}>
              {user.role === 'customer' ? '👤 Customer' : user.role === 'customer_support' ? '🎧 Support' : user.role === 'verification_officer' ? '🔍 Verifier' : '💰 Finance'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* KYC Card */}
        <div className="card animate-slide-up" style={{ padding: '16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={16} color="var(--color-primary)" />
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>Verifikasi Identitas</h3>
            </div>
            <StatusBadge status={user.kycStatus} size="md" />
          </div>

          {kyc && user.kycStatus?.toLowerCase() !== 'verified' && user.kycStatus?.toLowerCase() !== 'approved' && (
            <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
              {getKYCSteps().map((step, i) => {
                const StepIcon = step.icon;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: step.done ? 'var(--color-success-light)' : 'var(--color-surface-secondary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <StepIcon size={14} color={step.done ? 'var(--color-success)' : 'var(--color-text-muted)'} />
                    </div>
                    <span style={{ fontSize: 9, color: step.done ? 'var(--color-success)' : 'var(--color-text-muted)', fontWeight: 600, textAlign: 'center' }}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {user.kycStatus === 'verified' && kyc?.matchScore && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--color-success-light)' }}>
              <CheckCircle2 size={16} color="var(--color-success)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#006B4F' }}>
                Terverifikasi · Match Score {kyc.matchScore}%
              </span>
            </div>
          )}

          {user.kycStatus === 'pending' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--color-warning-light)' }}>
              <Clock size={16} color="#D97706" />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#8B6914' }}>
                Menunggu verifikasi oleh tim kami
              </span>
            </div>
          )}

          {user.kycStatus === 'rejected' && (
            <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--color-danger-light)', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <AlertCircle size={16} color="var(--color-danger)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-danger)' }}>Verifikasi Ditolak</span>
              </div>
              <p style={{ fontSize: 11, color: '#991B1B', marginBottom: 8 }}>
                Alasan: {kyc?.rejectionReason || 'Dokumen tidak valid atau kurang jelas.'}
              </p>
              <button className="btn-primary" onClick={() => navigate('/kyc')} style={{ width: '100%', padding: '8px', fontSize: 11 }}>
                Verifikasi Ulang
              </button>
            </div>
          )}

          {user.kycStatus === 'unverified' && (
            <button className="btn-primary" onClick={() => navigate('/kyc')} style={{ width: '100%', padding: '10px', fontSize: 12 }}>
              Mulai Verifikasi
            </button>
          )}
        </div>

        {/* Profile Info */}
        {profile && (
          <div className="card animate-fade-in-up" style={{ padding: '16px', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Informasi Pribadi</h3>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Telepon', value: user.phone, bold: true },
                { label: 'Tanggal Lahir', value: formatDate(profile.dateOfBirth, 'long') },
                { label: 'Pekerjaan', value: profile.employment.position },
                { label: 'Perusahaan', value: profile.employment.companyName },
                { label: 'Bergabung Sejak', value: formatDate(user.createdAt) },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{row.label}</span>
                  <span style={{ fontWeight: row.bold ? 600 : 500, color: row.bold ? 'var(--color-text-primary)' : undefined }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Features */}
        <div className="card animate-fade-in-up" style={{ padding: '16px', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Keamanan</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={16} color="var(--color-text-muted)" />
                <span style={{ fontSize: 13 }}>Multi-Factor Auth</span>
              </div>
              <button 
                onClick={handleToggleMFA}
                style={{
                  background: user.mfaEnabled ? 'var(--color-success-light)' : 'var(--color-surface-secondary)',
                  color: user.mfaEnabled ? 'var(--color-success)' : 'var(--color-text-secondary)',
                  border: 'none', padding: '6px 12px', borderRadius: '16px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {user.mfaEnabled ? 'Aktif' : 'Aktifkan'}
              </button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Fingerprint size={16} color="var(--color-text-muted)" />
                <span style={{ fontSize: 13 }}>Biometrik (Sidik Jari)</span>
              </div>
              <button 
                onClick={handleToggleBiometrics}
                style={{
                  background: user.biometricEnabled ? 'var(--color-success-light)' : 'var(--color-surface-secondary)',
                  color: user.biometricEnabled ? 'var(--color-success)' : 'var(--color-text-secondary)',
                  border: 'none', padding: '6px 12px', borderRadius: '16px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {user.biometricEnabled ? 'Aktif' : 'Aktifkan'}
              </button>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="card animate-fade-in-up" style={{ overflow: 'hidden', marginBottom: 16 }}>
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  borderBottom: i < menuItems.length - 1 ? '1px solid var(--color-border-light)' : 'none',
                  background: 'none',
                  border: i < menuItems.length - 1 ? undefined : 'none',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  textAlign: 'left',
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--color-surface-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color="var(--color-text-secondary)" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</p>
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{item.desc}</p>
                </div>
                <ChevronRight size={16} color="var(--color-text-muted)" />
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 'var(--radius-lg)',
            border: '1.5px solid var(--color-danger)',
            background: 'var(--color-danger-light)',
            color: '#CC3333',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontFamily: 'var(--font-sans)',
            marginBottom: 24,
          }}
        >
          <LogOut size={18} />
          Keluar
        </button>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 16 }}>
          PinjamAJA v1.0.0 · Terdaftar & diawasi OJK
        </p>
      </div>
    </div>
  );
}

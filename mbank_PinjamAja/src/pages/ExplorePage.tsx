import { useNavigate } from 'react-router-dom';
import {
  Landmark, Shield, QrCode, Wallet, Receipt, Smartphone,
  Zap, Gift, CreditCard, Building2, HeartPulse, Plane,
  Search,
} from 'lucide-react';

export default function ExplorePage() {
  const navigate = useNavigate();

  const mainServices = [
    { icon: Landmark, label: 'Pinjaman', color: '#0066FF', desc: 'Ajukan pinjaman cepat', onClick: () => navigate('/loans') },
    { icon: Shield, label: 'Asuransi', color: '#7C3AED', desc: 'Proteksi kamu & keluarga', onClick: () => navigate('/insurance') },
    { icon: QrCode, label: 'QRIS', color: '#00AED6', desc: 'Bayar pakai QRIS ASEAN', onClick: () => navigate('/qris') },
    { icon: Wallet, label: 'Tabungan', color: '#00C48C', desc: 'Kelola tabunganmu', onClick: () => navigate('/savings') },
  ];

  const otherServices = [
    { icon: Receipt, label: 'Tagihan', color: '#FFB020', onClick: () => navigate('/savings') },
    { icon: Smartphone, label: 'Pulsa', color: '#FF4D4F', onClick: () => navigate('/savings') },
    { icon: Zap, label: 'Listrik', color: '#F59E0B', onClick: () => navigate('/savings') },
    { icon: CreditCard, label: 'Kartu Kredit', color: '#6366F1', onClick: () => navigate('/savings') },
    { icon: Building2, label: 'Pajak', color: '#0EA5E9', onClick: () => navigate('/savings') },
    { icon: HeartPulse, label: 'BPJS', color: '#EF4444', onClick: () => navigate('/savings') },
    { icon: Plane, label: 'Travel', color: '#14B8A6', onClick: () => navigate('/savings') },
    { icon: Gift, label: 'Promo', color: '#EC4899', onClick: () => navigate('/savings') },
  ];

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header with Search */}
      <div style={{ padding: '16px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border-light)' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, color: 'var(--color-text-primary)' }}>Explore</h1>
        <div style={{ position: 'relative' }}>
          <Search size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Cari layanan..."
            style={{ paddingLeft: 42, background: 'var(--color-surface-secondary)', border: '1px solid var(--color-border-light)' }}
            readOnly
          />
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Main Services */}
        <div className="animate-fade-in-up" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Layanan Utama</h3>
          <div className="stagger-children" style={{ display: 'grid', gap: 10 }}>
            {mainServices.map((svc) => {
              const Icon = svc.icon;
              return (
                <button
                  key={svc.label}
                  className="card card-hover animate-fade-in-up"
                  onClick={svc.onClick}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 'var(--radius-md)',
                      background: `${svc.color}10`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={22} color={svc.color} strokeWidth={1.8} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{svc.label}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{svc.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Other Services Grid */}
        <div className="animate-fade-in-up">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Pembayaran & Lainnya</h3>
          <div
            className="card"
            style={{
              padding: '12px 8px',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
            }}
          >
            {otherServices.map((svc) => {
              const Icon = svc.icon;
              return (
                <button key={svc.label} className="service-item" onClick={svc.onClick}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius-md)',
                      background: `${svc.color}10`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={20} color={svc.color} strokeWidth={1.8} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                    {svc.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useInsuranceStore } from '@/stores/insuranceStore';
import { formatRupiah, formatCompact } from '@/helpers/format';

export default function InsuranceBuyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const products = useInsuranceStore(s => s.products);
  const buyInsurance = useInsuranceStore(s => s.buyInsurance);
  
  const product = products.find(p => p.id === id);
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!product) {
      navigate('/insurance');
    }
  }, [product, navigate]);

  if (!product) return null;

  const handlePurchase = async () => {
    setIsSubmitting(true);
    const result = await buyInsurance(product.id);
    setIsSubmitting(false);
    
    if (result) {
      setSuccess(true);
    } else {
      alert('Pembelian gagal. Pastikan saldo Anda mencukupi.');
    }
  };

  if (success) {
    return (
      <div style={{ paddingBottom: 80, height: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
          <div className="animate-scale-in" style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--color-success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle2 size={40} color="var(--color-success)" />
          </div>
          <h2 className="animate-fade-in-up" style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Pembelian Berhasil!</h2>
          <p className="animate-fade-in-up" style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 32, lineHeight: 1.5 }}>
            Polis {product.name} Anda sudah aktif. Detail polis telah dikirim ke email Anda.
          </p>
          <button className="btn-primary animate-fade-in-up" onClick={() => navigate('/insurance')} style={{ width: '100%', padding: '14px' }}>
            Lihat Polis Saya
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      <PageHeader title="Beli Asuransi" onBack={() => step > 1 ? setStep(step - 1) : navigate('/insurance')} />

      <div style={{ padding: '16px' }}>
        {/* Product Summary Header */}
        <div className="card animate-fade-in-up" style={{ padding: '16px', marginBottom: 24, background: 'linear-gradient(135deg, #7C3AED08 0%, #5B21B608 100%)', border: '1px solid #7C3AED33' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              {product.icon}
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text-primary)' }}>{product.name}</h2>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{product.provider}</p>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 16, borderTop: '1px dashed #7C3AED44' }}>
            <div>
              <p style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Premi</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-primary)' }}>
                {formatRupiah(product.premium)}
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)' }}>/{product.premiumPeriod === 'monthly' ? 'bln' : 'thn'}</span>
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Maks Perlindungan</p>
              <p style={{ fontSize: 14, fontWeight: 700 }}>{formatCompact(product.maxCoverage)}</p>
            </div>
          </div>
        </div>

        {step === 1 && (
          <div className="animate-fade-in-up">
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>Manfaat yang Anda dapatkan</h3>
            <div className="card" style={{ padding: '16px', marginBottom: 24 }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {product.coverage.map((c, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--color-text-primary)' }}>
                    <ShieldCheck size={16} color="var(--color-success)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ lineHeight: 1.4 }}>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <button className="btn-primary" onClick={() => setStep(2)} style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              Lanjut ke Pembayaran <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in-up">
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>Konfirmasi Pembayaran</h3>
            <div className="card" style={{ padding: '16px', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Total Premi Pertama</span>
                <span style={{ fontWeight: 700 }}>{formatRupiah(product.premium)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 13 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Biaya Admin</span>
                <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>Gratis</span>
              </div>
              <div style={{ paddingTop: 12, borderTop: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Total Pembayaran</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--color-primary)' }}>{formatRupiah(product.premium)}</span>
              </div>
            </div>
            
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 24, textAlign: 'center', lineHeight: 1.5 }}>
              Dengan menekan tombol Bayar, Anda menyetujui Syarat & Ketentuan dari {product.provider}. Saldo Tabungan Utama Anda akan dipotong secara otomatis.
            </p>
            
            <button 
              className="btn-primary" 
              onClick={handlePurchase} 
              disabled={isSubmitting} 
              style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {isSubmitting ? <Loader2 size={18} className="spin" /> : 'Bayar Sekarang'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

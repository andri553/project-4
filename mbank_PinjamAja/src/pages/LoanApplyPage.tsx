import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, Calculator, ArrowRight } from 'lucide-react';
import { useLoanStore } from '@/stores/loanStore';
import { formatRupiah } from '@/helpers/format';
import PageHeader from '@/components/PageHeader';
import KYCGuard from '@/components/KYCGuard';

export default function LoanApplyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get('product') || '';
  const products = useLoanStore((s) => s.products);
  const applyLoan = useLoanStore((s) => s.applyLoan);

  const [step, setStep] = useState(1);
  const [productId, setProductId] = useState(preselectedId);
  const [amount, setAmount] = useState(0);
  const [tenor, setTenor] = useState(6);
  const [purpose, setPurpose] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const selectedProduct = products.find((p) => p.id === productId);

  // Initialize amount when product is selected
  const handleSelectProduct = (id: string) => {
    const product = products.find((p) => p.id === id);
    if (product) {
      setProductId(id);
      setAmount(product.minAmount);
      setTenor(product.minTenor);
      setStep(2);
    }
  };

  const monthlyInstallment = useMemo(() => {
    if (!selectedProduct || !amount) return 0;
    return Math.round((amount * (1 + (selectedProduct.interestRate / 100) * tenor)) / tenor);
  }, [amount, tenor, selectedProduct]);

  const totalRepayment = monthlyInstallment * tenor;

  const handleSubmit = async () => {
    if (!productId || !amount || !tenor || !purpose) return;
    setIsSubmitting(true);
    try {
      await applyLoan(productId, amount, tenor, purpose);
      setSuccess(true);
    } catch {
      // Error handling
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--color-surface)', textAlign: 'center' }}>
        <div className="animate-scale-in" style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--color-success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <CheckCircle2 size={40} color="var(--color-success)" />
        </div>
        <h2 className="animate-fade-in-up" style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Pengajuan Berhasil!</h2>
        <p className="animate-fade-in-up" style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 8, maxWidth: 280 }}>
          Pengajuan pinjaman {selectedProduct?.name} sebesar {formatRupiah(amount)} telah dikirim.
        </p>
        <p className="animate-fade-in-up" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 32 }}>
          Kami akan meninjau pengajuan Anda dalam 1-3 hari kerja.
        </p>
        <button
          className="btn-primary animate-fade-in-up"
          onClick={() => navigate('/loans')}
          style={{ padding: '14px 32px', fontSize: 14 }}
        >
          Lihat Pengajuan Saya
        </button>
      </div>
    );
  }

  return (
    <KYCGuard featureName="Pengajuan Pinjaman">
      <div style={{ paddingBottom: 100 }}>
        <PageHeader title="Butuh dana untuk apa hari ini?" onBack={() => navigate(-1)} />

      {/* Step indicator */}
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
        {[1, 2, 3].map((s) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: step >= s ? 'var(--color-primary)' : 'var(--color-border)',
                color: step >= s ? 'white' : 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                transition: 'all 0.3s ease',
              }}
            >
              {step > s ? <CheckCircle2 size={16} /> : s}
            </div>
            {s < 3 && <div style={{ width: 32, height: 2, background: step > s ? 'var(--color-primary)' : 'var(--color-border)', borderRadius: 2, transition: 'all 0.3s ease' }} />}
          </div>
        ))}
      </div>

      <div style={{ padding: '0 16px' }}>
        {/* Step 1: Select Product */}
        {step === 1 && (
          <div className="animate-fade-in-up">
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Mau pinjam untuk apa nih?</h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 16 }}>Pilih yang paling pas buat kamu</p>

            <div className="stagger-children">
              {products.map((product) => (
                <button
                  key={product.id}
                  className={`card card-hover animate-fade-in-up`}
                  onClick={() => handleSelectProduct(product.id)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    marginBottom: 10,
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    border: productId === product.id ? '2px solid var(--color-primary)' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 28 }}>{product.icon}</span>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700 }}>{product.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                        {formatRupiah(product.minAmount)} - {formatRupiah(product.maxAmount)} · {product.interestRate}%/bln
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Amount & Tenor */}
        {step === 2 && selectedProduct && (
          <div className="animate-fade-in-up">
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Atur jumlah & waktu cicilan</h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 20 }}>{selectedProduct.name}</p>

            {/* Amount Slider */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                <span>Jumlah Pinjaman</span>
                <span style={{ color: 'var(--color-primary)', fontSize: 18, fontWeight: 800 }}>{formatRupiah(amount)}</span>
              </label>
              <input
                type="range"
                min={selectedProduct.minAmount}
                max={selectedProduct.maxAmount}
                step={selectedProduct.minAmount <= 1000000 ? 100000 : 1000000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>
                <span>{formatRupiah(selectedProduct.minAmount)}</span>
                <span>{formatRupiah(selectedProduct.maxAmount)}</span>
              </div>
            </div>

            {/* Tenor */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Tenor (bulan)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Array.from({ length: selectedProduct.maxTenor - selectedProduct.minTenor + 1 }, (_, i) => selectedProduct.minTenor + i)
                  .filter((t) => t <= 12 || t % 6 === 0)
                  .map((t) => (
                    <button
                      key={t}
                      onClick={() => setTenor(t)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: tenor === t ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                        background: tenor === t ? 'var(--color-primary-50)' : 'var(--color-surface)',
                        color: tenor === t ? 'var(--color-primary)' : 'var(--color-text-primary)',
                        fontSize: 13,
                        fontWeight: tenor === t ? 700 : 500,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-sans)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {t}
                    </button>
                  ))}
              </div>
            </div>

            {/* Calculator Preview */}
            <div className="card" style={{ padding: '16px', marginBottom: 24, background: 'linear-gradient(135deg, #0066FF08 0%, #00339908 100%)', border: '1px solid var(--color-primary-100)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Calculator size={16} color="var(--color-primary)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>Perkiraan cicilan per bulan</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Angsuran/bulan</span>
                <span style={{ fontWeight: 800, fontSize: 16 }}>{formatRupiah(monthlyInstallment)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Total pembayaran</span>
                <span style={{ fontWeight: 600 }}>{formatRupiah(totalRepayment)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-outline" onClick={() => setStep(1)} style={{ flex: 1, padding: '12px' }}>
                Kembali
              </button>
              <button className="btn-primary" onClick={() => setStep(3)} style={{ flex: 2, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                Lanjut <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Purpose & Confirm */}
        {step === 3 && selectedProduct && (
          <div className="animate-fade-in-up">
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Cek lagi sebelum dikirim ya</h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 20 }}>Pastikan semua datanya udah bener</p>

            <div className="card" style={{ padding: '16px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Produk</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{selectedProduct.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Jumlah</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{formatRupiah(amount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tenor</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{tenor} bulan</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Bunga</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{selectedProduct.interestRate}%/bulan</span>
                </div>
                <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>Angsuran/bulan</span>
                  <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: 14 }}>{formatRupiah(monthlyInstallment)}</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Tujuan Pinjaman</label>
              <textarea
                className="input-field"
                placeholder="Contoh: Biaya pendidikan anak"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
                style={{ resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-outline" onClick={() => setStep(2)} style={{ flex: 1, padding: '12px' }}>
                Kembali
              </button>
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={isSubmitting || !purpose.trim()}
                style={{ flex: 2, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                {isSubmitting ? <Loader2 size={16} style={{ animation: 'spin-slow 1s linear infinite' }} /> : <CheckCircle2 size={16} />}
                {isSubmitting ? 'Mengirim...' : 'Ajukan Pinjaman'}
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </KYCGuard>
  );
}

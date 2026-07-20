import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Star, TrendingUp, FileText } from 'lucide-react';
import { useLoanStore } from '@/stores/loanStore';
import { useAuthStore } from '@/stores/authStore';
import { formatRupiah, formatCompact, formatDate } from '@/helpers/format';
import StatusBadge from '@/components/StatusBadge';
import PageHeader from '@/components/PageHeader';

export default function LoansPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'products' | 'applications'>('products');
  const products = useLoanStore((s) => s.products);
  const applications = useLoanStore((s) => s.applications);
  const creditScores = useLoanStore((s) => s.creditScores);
  const user = useAuthStore((s) => s.user)!;
  const creditScore = useMemo(() => creditScores[user.id], [creditScores, user.id]);

  const userApps = applications.filter((a) => a.userId === user.id);

  return (
    <div style={{ paddingBottom: 80 }}>
      <PageHeader title="Pinjaman" onBack={() => navigate('/')} />

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', padding: '0 16px', background: 'var(--color-surface)' }}>
        {(['products', 'applications'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={tab === t ? 'tab-active' : 'tab-inactive'}
            style={{ flex: 1, padding: '12px 0', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent' }}
          >
            {t === 'products' ? 'Produk Pinjaman' : 'Pengajuan Saya'}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px' }}>
        {tab === 'products' ? (
          <>
            {/* Credit Score Card */}
            {creditScore && (
              <div
                className="card animate-fade-in-up"
                style={{ padding: '20px', marginBottom: 16, background: 'linear-gradient(135deg, #0066FF08 0%, #00339908 100%)', border: '1px solid var(--color-primary-100)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {/* Score ring */}
                  <div style={{ position: 'relative', width: 72, height: 72 }}>
                    <svg width="72" height="72" viewBox="0 0 72 72">
                      <circle cx="36" cy="36" r="30" fill="none" stroke="var(--color-border)" strokeWidth="6" />
                      <circle
                        cx="36" cy="36" r="30" fill="none" stroke="var(--color-primary)" strokeWidth="6"
                        strokeDasharray={`${(creditScore.score / 850) * 188.5} 188.5`}
                        strokeLinecap="round"
                        transform="rotate(-90 36 36)"
                      />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--color-primary)' }}>{creditScore.score}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-text-muted)' }}>/{850}</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Star size={14} color="#F59E0B" fill="#F59E0B" />
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text-primary)' }}>Grade {creditScore.grade}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 2 }}>Skor Kredit Anda</p>
                    <p style={{ fontSize: 11, color: 'var(--color-success)', fontWeight: 600 }}>
                      <TrendingUp size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} />
                      Sangat Baik
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Product Cards */}
            <div className="stagger-children">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="card card-hover animate-fade-in-up"
                  style={{ padding: '16px', marginBottom: 12, cursor: 'pointer' }}
                  onClick={() => navigate(`/loan/apply?product=${product.id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--color-primary-50)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 22,
                        flexShrink: 0,
                      }}
                    >
                      {product.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{product.name}</h3>
                      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8, lineHeight: 1.4 }}>
                        {product.description}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                        {product.features.slice(0, 3).map((f) => (
                          <span key={f} className="badge-info" style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 10, fontWeight: 600, background: 'var(--color-primary-50)', color: 'var(--color-primary-dark)' }}>
                            {f}
                          </span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>
                          Bunga <strong style={{ color: 'var(--color-text-primary)' }}>{product.interestRate}%/bln</strong>
                        </span>
                        <span style={{ color: 'var(--color-text-muted)' }}>
                          Maks <strong style={{ color: 'var(--color-text-primary)' }}>{formatCompact(product.maxAmount)}</strong>
                        </span>
                        <span style={{ color: 'var(--color-text-muted)' }}>
                          Tenor <strong style={{ color: 'var(--color-text-primary)' }}>{product.maxTenor} bln</strong>
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={18} color="var(--color-text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Applications Tab */
          <>
            {userApps.length === 0 ? (
              <div className="animate-fade-in" style={{ textAlign: 'center', padding: '48px 24px' }}>
                <FileText size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Belum ada pengajuan</p>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>Pilih produk pinjaman untuk mulai mengajukan</p>
              </div>
            ) : (
              <div className="stagger-children">
                {userApps.map((app) => (
                  <button
                    key={app.id}
                    className="card card-hover animate-fade-in-up"
                    onClick={() => navigate(`/loan/${app.id}`)}
                    style={{
                      width: '100%',
                      padding: '16px',
                      marginBottom: 12,
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700 }}>{app.productName}</h4>
                      <StatusBadge status={app.status} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{formatRupiah(app.amount)}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>{app.tenor} bulan</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6 }}>
                      <span>ID: {app.id}</span>
                      <span>{formatDate(app.appliedAt)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

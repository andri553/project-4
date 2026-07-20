import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, FileText, AlertCircle, ChevronRight } from 'lucide-react';
import { formatRupiah, formatDate, formatCompact } from '@/helpers/format';
import { useInsuranceStore } from '@/stores/insuranceStore';
import StatusBadge from '@/components/StatusBadge';
import PageHeader from '@/components/PageHeader';

type Tab = 'products' | 'policies' | 'claims';

export default function InsurancePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('products');
  const products = useInsuranceStore((s) => s.products);
  const policies = useInsuranceStore((s) => s.policies);
  const claims = useInsuranceStore((s) => s.claims);

  const tabItems: { key: Tab; label: string }[] = [
    { key: 'products', label: 'Produk' },
    { key: 'policies', label: 'Polis Saya' },
    { key: 'claims', label: 'Klaim' },
  ];

  return (
    <div style={{ paddingBottom: 80 }}>
      <PageHeader title="Asuransi" onBack={() => navigate('/')} />

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', padding: '0 16px', background: 'var(--color-surface)' }}>
        {tabItems.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: '12px 0', fontSize: 13, fontWeight: 600,
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)',
              color: tab === t.key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              borderBottom: tab === t.key ? '2px solid var(--color-primary)' : '2px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px' }}>
        {/* Products Tab */}
        {tab === 'products' && (
          <div className="stagger-children">
            {products.map((product) => (
              <div key={product.id} className="card card-hover animate-fade-in-up" style={{ padding: '16px', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                    {product.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 2 }}>{product.name}</h3>
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{product.provider}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6, lineHeight: 1.4 }}>{product.description}</p>
                  </div>
                </div>

                {/* Coverage list */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                  {product.coverage.slice(0, 4).map((c) => (
                    <span key={c} style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-success-light)', color: '#065F46', fontSize: 10, fontWeight: 600 }}>
                      ✓ {c}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--color-border-light)' }}>
                  <div>
                    <p style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Premi mulai</p>
                    <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-primary)' }}>
                      {formatRupiah(product.premium)}<span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)' }}>/{product.premiumPeriod === 'monthly' ? 'bln' : 'thn'}</span>
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Perlindungan maks</p>
                    <p style={{ fontSize: 13, fontWeight: 700 }}>{formatCompact(product.maxCoverage)}</p>
                  </div>
                </div>
                <button
                  className="btn-primary"
                  onClick={() => navigate(`/insurance/buy/${product.id}`)}
                  style={{ width: '100%', marginTop: 12, padding: '10px', fontSize: 13 }}
                >
                  Beli Sekarang
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Policies Tab */}
        {tab === 'policies' && (
          <div className="stagger-children">
            {policies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48 }}>
                <ShieldCheck size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Belum ada polis aktif</p>
              </div>
            ) : (
              policies.map((policy) => (
                <div key={policy.id} className="card animate-fade-in-up" style={{ padding: '16px', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 800 }}>{policy.productName}</h4>
                    <StatusBadge status={policy.status} />
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>No. Polis</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'monospace', fontSize: 11 }}>{policy.policyNumber}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Provider</span>
                      <span style={{ fontWeight: 500 }}>{policy.provider}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Premi</span>
                      <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{formatRupiah(policy.premium)}/{policy.premiumPeriod === 'monthly' ? 'bln' : 'thn'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Perlindungan Maks</span>
                      <span style={{ fontWeight: 600 }}>{formatRupiah(policy.maxCoverage)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Masa Berlaku</span>
                      <span style={{ fontWeight: 500 }}>{formatDate(policy.startDate)} - {formatDate(policy.endDate)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Pembayaran Berikut</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-warning)' }}>{formatDate(policy.nextPaymentDate)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Claims Tab */}
        {tab === 'claims' && (
          <div className="stagger-children">
            {claims.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48 }}>
                <FileText size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Belum ada klaim</p>
              </div>
            ) : (
              claims.map((claim) => (
                <div key={claim.id} className="card animate-fade-in-up" style={{ padding: '16px', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 800 }}>{claim.type}</h4>
                    <StatusBadge status={claim.status} size="md" />
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 10, lineHeight: 1.4 }}>{claim.description}</p>

                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Jumlah Klaim</span>
                      <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{formatRupiah(claim.amount)}</span>
                    </div>
                    {claim.approvedAmount !== undefined && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Jumlah Disetujui</span>
                        <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>{formatRupiah(claim.approvedAmount)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Diajukan</span>
                      <span style={{ fontWeight: 500 }}>{formatDate(claim.submittedAt)}</span>
                    </div>
                    {claim.resolvedAt && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Diselesaikan</span>
                        <span style={{ fontWeight: 500 }}>{formatDate(claim.resolvedAt)}</span>
                      </div>
                    )}
                  </div>

                  {claim.documents.length > 0 && (
                    <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--color-border-light)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {claim.documents.map((doc) => (
                        <span key={doc} style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-surface-secondary)', color: 'var(--color-text-muted)', fontSize: 10, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 2 }}>
                          📎 {doc}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

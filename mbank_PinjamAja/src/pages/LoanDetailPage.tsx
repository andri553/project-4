import { useParams, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { Calendar, CreditCard, CheckCircle2, Clock, AlertTriangle, Info } from 'lucide-react';
import { useLoanStore } from '@/stores/loanStore';
import { formatRupiah, formatDate } from '@/helpers/format';
import StatusBadge from '@/components/StatusBadge';
import PageHeader from '@/components/PageHeader';

export default function LoanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const applications = useLoanStore((s) => s.applications);
  const allInstallments = useLoanStore((s) => s.installmentSchedules);
  
  const loan = useMemo(() => applications.find((a) => a.id === id), [applications, id]);
  const installments = useMemo(() => allInstallments[id || ''] || [], [allInstallments, id]);

  if (!loan) {
    return (
      <div>
        <PageHeader title="Detail Pinjaman" />
        <div style={{ padding: 48, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Pinjaman tidak ditemukan</p>
        </div>
      </div>
    );
  }

  const paidInstallments = installments.filter((i) => i.status === 'paid');
  const progress = installments.length > 0 ? (paidInstallments.length / installments.length) * 100 : 0;

  return (
    <div style={{ paddingBottom: 80 }}>
      <PageHeader title="Detail Pinjaman" />

      <div style={{ padding: '16px' }}>
        {/* Loan Info Card */}
        <div className="card animate-fade-in-up" style={{ padding: '20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{loan.productName}</h2>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>ID: {loan.id}</p>
            </div>
            <StatusBadge status={loan.status} size="md" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: '12px', background: 'var(--color-surface-secondary)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 4 }}>JUMLAH PINJAMAN</p>
              <p style={{ fontSize: 16, fontWeight: 800 }}>{formatRupiah(loan.amount)}</p>
            </div>
            <div style={{ padding: '12px', background: 'var(--color-surface-secondary)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 4 }}>ANGSURAN/BULAN</p>
              <p style={{ fontSize: 16, fontWeight: 800 }}>{formatRupiah(loan.monthlyInstallment)}</p>
            </div>
            <div style={{ padding: '12px', background: 'var(--color-surface-secondary)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 4 }}>BUNGA</p>
              <p style={{ fontSize: 16, fontWeight: 800 }}>{loan.interestRate}%/bln</p>
            </div>
            <div style={{ padding: '12px', background: 'var(--color-surface-secondary)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 4 }}>TENOR</p>
              <p style={{ fontSize: 16, fontWeight: 800 }}>{loan.tenor} bulan</p>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border-light)', marginTop: 16, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Total Pembayaran</span>
            <span style={{ fontWeight: 700 }}>{formatRupiah(loan.totalRepayment)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Tujuan</span>
            <span style={{ fontWeight: 500 }}>{loan.purpose}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Tanggal Pengajuan</span>
            <span style={{ fontWeight: 500 }}>{formatDate(loan.appliedAt, 'long')}</span>
          </div>
        </div>

        {/* Progress Card (for active loans) */}
        {installments.length > 0 && (
          <div className="card animate-fade-in-up" style={{ padding: '20px', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Progres Pembayaran</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ flex: 1, height: 8, borderRadius: 'var(--radius-full)', background: 'var(--color-border)' }}>
                <div
                  style={{
                    height: '100%',
                    borderRadius: 'var(--radius-full)',
                    background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
                    width: `${progress}%`,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>{Math.round(progress)}%</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              {paidInstallments.length} dari {installments.length} angsuran dibayar
            </p>
          </div>
        )}

        {/* Installment Schedule */}
        {installments.length > 0 && (
          <div className="card animate-fade-in-up" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 16px 12px' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800 }}>Jadwal Angsuran</h3>
            </div>
            {installments.map((inst, i) => {
              const statusIcon = inst.status === 'paid'
                ? <CheckCircle2 size={18} color="var(--color-success)" />
                : inst.status === 'overdue'
                  ? <AlertTriangle size={18} color="var(--color-danger)" />
                  : <Clock size={18} color="var(--color-text-muted)" />;

              return (
                <div
                  key={inst.installmentNo}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderTop: '1px solid var(--color-border-light)',
                    background: inst.status === 'paid' ? 'rgba(16,185,129,0.03)' : undefined,
                  }}
                >
                  {statusIcon}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>Angsuran #{inst.installmentNo}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-text-muted)' }}>
                      <Calendar size={11} />
                      {formatDate(inst.dueDate)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 13, fontWeight: 700 }}>{formatRupiah(inst.totalAmount)}</p>
                    <StatusBadge status={inst.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info for non-active loans */}
        {installments.length === 0 && (
          <div className="card animate-fade-in-up" style={{ padding: '24px', textAlign: 'center' }}>
            <Info size={40} color="var(--color-primary)" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              {loan.status === 'reviewing'
                ? 'Pengajuan sedang dalam proses review. Kami akan menghubungi Anda segera.'
                : loan.status === 'submitted'
                  ? 'Pengajuan berhasil dikirim. Menunggu proses verifikasi.'
                  : 'Detail jadwal angsuran akan tersedia setelah pinjaman dicairkan.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

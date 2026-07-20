import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, TrendingUp, Target, Plus, ArrowUpRight, ArrowDownLeft, Send, X, Loader2, CheckCircle2 } from 'lucide-react';
import { useSavingsStore } from '@/stores/savingsStore';
import { useAuthStore } from '@/stores/authStore';
import { formatRupiah, formatDate, getTransactionLabel, isIncomeTransaction } from '@/helpers/format';
import StatusBadge from '@/components/StatusBadge';
import PageHeader from '@/components/PageHeader';

type ModalType = 'deposit' | 'withdraw' | 'transfer' | null;

export default function SavingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const accounts = useSavingsStore((s) => s.accounts);
  const transactions = useSavingsStore((s) => s.transactions);
  const deposit = useSavingsStore((s) => s.deposit);
  const withdraw = useSavingsStore((s) => s.withdraw);
  const transfer = useSavingsStore((s) => s.transfer);

  const totalBalance = useMemo(() => accounts.reduce((sum, acc) => sum + acc.balance, 0), [accounts]);

  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [modal, setModal] = useState<ModalType>(null);
  const [formAmount, setFormAmount] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formRecipient, setFormRecipient] = useState('');
  const [formRecipientAcc, setFormRecipientAcc] = useState('');
  const [formRecipientBank, setFormRecipientBank] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const accountTxs = transactions.filter((t) => t.accountId === selectedAccountId);

  const getAccountIcon = (type: string) => {
    if (type === 'premium') return <TrendingUp size={18} color="#7C3AED" />;
    if (type === 'goal') return <Target size={18} color="#06B6D4" />;
    return <Wallet size={18} color="var(--color-primary)" />;
  };

  const getAccountColor = (type: string) => {
    if (type === 'premium') return '#7C3AED';
    if (type === 'goal') return '#06B6D4';
    return 'var(--color-primary)';
  };

  const handleSubmit = async () => {
    if (!formAmount || Number(formAmount) <= 0) return;
    const amt = Number(formAmount);

    // High value transaction check (> Rp 10.000.000) for unverified users
    const kycLower = user?.kycStatus?.toLowerCase();
    if (amt > 10000000 && kycLower !== 'verified' && kycLower !== 'approved') {
      alert('Transaksi di atas Rp 10.000.000 memerlukan verifikasi identitas (e-KYC).');
      navigate(`/kyc?redirect=${encodeURIComponent('/savings')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (modal === 'deposit') {
        await deposit(selectedAccountId, amt, formDesc || 'Setor tunai');
      } else if (modal === 'withdraw') {
        await withdraw(selectedAccountId, amt, formDesc || 'Tarik tunai');
      } else if (modal === 'transfer') {
        await transfer(selectedAccountId, amt, formRecipient, formRecipientAcc, formRecipientBank);
      }
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setModal(null);
        setFormAmount('');
        setFormDesc('');
        setFormRecipient('');
        setFormRecipientAcc('');
        setFormRecipientBank('');
      }, 1500);
    } catch {
      // error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      <PageHeader title="Tabungan" onBack={() => navigate('/')} />

      <div style={{ padding: '16px' }}>
        {/* Total Balance */}
        <div
          className="balance-card animate-fade-in-up"
          style={{ padding: '20px', marginBottom: 16, color: 'white' }}
        >
          <p style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Total Saldo Tabungan</p>
          <p style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em' }}>{formatRupiah(totalBalance)}</p>
          <p style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>{accounts.length} rekening aktif</p>
        </div>

        {/* Account Cards */}
        <div className="stagger-children" style={{ marginBottom: 16 }}>
          {accounts.map((account) => {
            const color = getAccountColor(account.accountType);
            const isSelected = account.id === selectedAccountId;
            return (
              <button
                key={account.id}
                className={`card animate-fade-in-up`}
                onClick={() => setSelectedAccountId(account.id)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  marginBottom: 8,
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  border: isSelected ? `2px solid ${color}` : undefined,
                  background: isSelected ? `${color}08` : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getAccountIcon(account.accountType)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700 }}>{account.accountName}</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{account.accountNumber} · {account.interestRate}% p.a.</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 14, fontWeight: 800 }}>{formatRupiah(account.balance)}</p>
                    {account.accountType === 'goal' && account.goalTarget && (
                      <p style={{ fontSize: 10, color }}>Target: {formatRupiah(account.goalTarget)}</p>
                    )}
                  </div>
                </div>

                {/* Goal progress bar */}
                {account.accountType === 'goal' && account.goalTarget && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--color-border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                      <span>{account.goalName}</span>
                      <span>{Math.round((account.balance / account.goalTarget) * 100)}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 'var(--radius-full)', background: 'var(--color-border)' }}>
                      <div style={{ height: '100%', borderRadius: 'var(--radius-full)', background: color, width: `${Math.min(100, (account.balance / account.goalTarget) * 100)}%`, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        {selectedAccount && (
          <div className="animate-fade-in" style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <button className="btn-primary" onClick={() => setModal('deposit')} style={{ flex: 1, padding: '10px', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <ArrowDownLeft size={14} /> Setor
            </button>
            <button className="btn-outline" onClick={() => setModal('withdraw')} style={{ flex: 1, padding: '10px', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <ArrowUpRight size={14} /> Tarik
            </button>
            <button
              className="btn-outline"
              onClick={() => {
                if (user?.kycStatus?.toLowerCase() !== 'verified' && user?.kycStatus?.toLowerCase() !== 'approved') {
                  alert('Verifikasi identitas (e-KYC) diperlukan sebelum melakukan Transfer Antarbank.');
                  navigate(`/kyc?redirect=${encodeURIComponent('/savings')}`);
                  return;
                }
                setModal('transfer');
              }}
              style={{ flex: 1, padding: '10px', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
            >
              <Send size={14} /> Transfer
            </button>
          </div>
        )}

        {/* Transactions */}
        <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>
          Riwayat {selectedAccount?.accountName || 'Transaksi'}
        </h3>
        <div className="card" style={{ overflow: 'hidden' }}>
          {accountTxs.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Belum ada transaksi</p>
            </div>
          ) : (
            accountTxs.map((tx, i) => {
              const isIncome = isIncomeTransaction(tx.type);
              return (
                <div
                  key={tx.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderBottom: i < accountTxs.length - 1 ? '1px solid var(--color-border-light)' : 'none',
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: isIncome ? 'var(--color-success-light)' : 'var(--color-danger-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                    {isIncome ? '↓' : '↑'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.description || getTransactionLabel(tx.type)}
                    </p>
                    <p style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                      {formatDate(tx.createdAt, 'relative')}
                    </p>
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: isIncome ? 'var(--color-success)' : 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                    {isIncome ? '+' : '-'}{formatRupiah(tx.amount)}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            {showSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div className="animate-scale-in" style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--color-success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <CheckCircle2 size={32} color="var(--color-success)" />
                </div>
                <p style={{ fontSize: 16, fontWeight: 700 }}>Berhasil!</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800 }}>
                    {modal === 'deposit' ? 'Setor Tunai' : modal === 'withdraw' ? 'Tarik Tunai' : 'Transfer'}
                  </h3>
                  <button onClick={() => setModal(null)} className="btn-ghost" style={{ padding: 4, borderRadius: 'var(--radius-full)' }}>
                    <X size={20} />
                  </button>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Jumlah (Rp)</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="0"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    style={{ fontSize: 20, fontWeight: 700 }}
                    autoFocus
                  />
                </div>

                {(modal === 'deposit' || modal === 'withdraw') && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Keterangan</label>
                    <input className="input-field" placeholder="Opsional" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
                  </div>
                )}

                {modal === 'transfer' && (
                  <>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Nama Penerima</label>
                      <input className="input-field" placeholder="Nama lengkap" value={formRecipient} onChange={(e) => setFormRecipient(e.target.value)} />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>No. Rekening</label>
                      <input className="input-field" placeholder="Nomor rekening tujuan" value={formRecipientAcc} onChange={(e) => setFormRecipientAcc(e.target.value)} />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Bank Tujuan</label>
                      <input className="input-field" placeholder="Contoh: BCA, Mandiri" value={formRecipientBank} onChange={(e) => setFormRecipientBank(e.target.value)} />
                    </div>
                  </>
                )}

                <button
                  className="btn-primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formAmount || Number(formAmount) <= 0 || (modal === 'transfer' && (!formRecipient || !formRecipientAcc || !formRecipientBank))}
                  style={{ width: '100%', padding: '14px', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  {isSubmitting ? <Loader2 size={16} style={{ animation: 'spin-slow 1s linear infinite' }} /> : null}
                  {isSubmitting ? 'Memproses...' : 'Konfirmasi'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

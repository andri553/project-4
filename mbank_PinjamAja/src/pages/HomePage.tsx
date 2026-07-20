import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Eye, EyeOff, Send, ArrowDownToLine, QrCode, Landmark,
  Shield, History, ChevronRight, TrendingUp, Wallet, CreditCard,
  Plus, Search, Zap, Receipt, Smartphone, Gift, Target,
  CheckCircle2, AlertCircle, X, Loader2
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useSavingsStore } from '@/stores/savingsStore';
import { useLoanStore } from '@/stores/loanStore';
import { useInsuranceStore } from '@/stores/insuranceStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { logAudit } from '@/stores/auditStore';
import { formatRupiah, formatDate, getTransactionLabel, isIncomeTransaction, getInitials, getGreetingTime } from '@/helpers/format';

export default function HomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user)!;
  const greeting = getGreetingTime();
  
  const accounts = useSavingsStore((s) => s.accounts);
  const transactions = useSavingsStore((s) => s.transactions);
  const applications = useLoanStore((s) => s.applications);
  const creditScores = useLoanStore((s) => s.creditScores);
  const policies = useInsuranceStore((s) => s.policies);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const totalBalance = useMemo(() => accounts.reduce((sum, acc) => sum + acc.balance, 0), [accounts]);
  
  // Upcoming installment: find the first active loan application
  const activeLoan = useMemo(() => applications.find((a) => ['active', 'disbursed'].includes(a.status)), [applications]);
  const creditScore = useMemo(() => creditScores[user.id], [creditScores, user.id]);
  const activeSavingsGoal = useMemo(() => accounts.find(a => a.accountType === 'goal'), [accounts]);
  const activePolicyCount = useMemo(() => policies.filter(p => p.status === 'active').length, [policies]);

  const [showBalance, setShowBalance] = useState(true);
  const [activePromo, setActivePromo] = useState(0);

  // Pay Installment Modal states
  const [showPayModal, setShowPayModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successPay, setSuccessPay] = useState(false);

  const recentTransactions = transactions.slice(0, 4);

  // GoPay-style 4 main shortcuts
  const mainShortcuts = [
    { icon: CreditCard, label: 'Bayar', color: '#0066FF', bg: '#EBF5FF', onClick: () => navigate('/qris') },
    { icon: Send, label: 'Transfer', color: '#00AED6', bg: '#E0F7FA', onClick: () => navigate('/savings') },
    { icon: Plus, label: 'Top Up', color: '#00C48C', bg: '#E0FFF5', onClick: () => navigate('/savings') },
    { icon: History, label: 'Riwayat', color: '#6B7280', bg: '#F3F4F6', onClick: () => navigate('/transactions') },
  ];

  // Service grid items
  const services = [
    { icon: Landmark, label: 'Pinjaman', color: '#0066FF', onClick: () => navigate('/loans') },
    { icon: Shield, label: 'Asuransi', color: '#7C3AED', onClick: () => navigate('/insurance') },
    { icon: QrCode, label: 'QRIS', color: '#00AED6', onClick: () => navigate('/qris') },
    { icon: Wallet, label: 'Tabungan', color: '#00C48C', onClick: () => navigate('/savings') },
    { icon: Receipt, label: 'Tagihan', color: '#FFB020', onClick: () => navigate('/savings') },
    { icon: Smartphone, label: 'Pulsa', color: '#FF4D4F', onClick: () => navigate('/savings') },
    { icon: Zap, label: 'Listrik', color: '#F59E0B', onClick: () => navigate('/savings') },
    { icon: Gift, label: 'Promo', color: '#EC4899', onClick: () => navigate('/savings') },
  ];

  // Promo banners
  const promos = [
    { title: 'Bebas Transfer!', subtitle: 'Hemat transfer ke bank mana saja gratis 10x per bulan.', gradient: 'linear-gradient(135deg, #0066FF 0%, #00AED6 100%)' },
    { title: 'Bunga Pinjaman 0%', subtitle: 'Ajukan pinjaman pertama tenor 3 bulan tanpa bunga.', gradient: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)' },
    { title: 'Cashback Tabungan', subtitle: 'Buka Rekening Impian cashback saldo Rp 50.000.', gradient: 'linear-gradient(135deg, #00C48C 0%, #059669 100%)' },
  ];

  const handlePayInstallment = async () => {
    if (!activeLoan) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));

    // Deduct savings balance
    const activeAccount = accounts.find(a => a.isActive) || accounts[0];
    if (activeAccount.balance < activeLoan.monthlyInstallment) {
      alert('Saldo tidak mencukupi untuk membayar angsuran');
      setIsSubmitting(false);
      setShowPayModal(false);
      return;
    }

    useSavingsStore.setState((state) => {
      const updatedAccounts = state.accounts.map(acc => 
        acc.id === activeAccount.id ? { ...acc, balance: acc.balance - activeLoan.monthlyInstallment } : acc
      );
      
      const newSavingsTx = {
        id: `ST-${Date.now()}`,
        accountId: activeAccount.id,
        userId: user.id,
        type: 'loan_repayment' as any,
        amount: activeLoan.monthlyInstallment,
        balanceAfter: activeAccount.balance - activeLoan.monthlyInstallment,
        description: `Bayar Cicilan: ${activeLoan.productName}`,
        status: 'completed' as any,
        createdAt: new Date().toISOString()
      };
      
      return {
        accounts: updatedAccounts,
        transactions: [newSavingsTx, ...state.transactions]
      };
    });

    logAudit(
      user.id,
      user.fullName,
      'LOAN',
      'INSTALLMENT_PAID',
      `Paid loan installment of ${formatRupiah(activeLoan.monthlyInstallment)} for ${activeLoan.productName}`,
      'success',
      { loanId: activeLoan.id, amount: activeLoan.monthlyInstallment }
    );

    useNotificationStore.getState().addNotification({
      userId: user.id,
      title: 'Pembayaran Angsuran Berhasil',
      message: `Pembayaran cicilan ${activeLoan.productName} sebesar Rp ${activeLoan.monthlyInstallment.toLocaleString('id-ID')} berhasil.`,
      type: 'loan',
    });

    // Update loan application status to completed if it's fully paid (simulate simple repayment logic)
    useLoanStore.setState((state) => {
      const updated = state.applications.map(app => 
        app.id === activeLoan.id ? { ...app, status: 'completed' as any } : app
      );
      return { applications: updated };
    });

    setIsSubmitting(false);
    setSuccessPay(true);
    setTimeout(() => {
      setSuccessPay(false);
      setShowPayModal(false);
    }, 1500);
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* ===== HEADER ===== */}
      <div
        className="gopay-header safe-top"
        style={{ padding: '16px 20px 24px', color: 'white' }}
      >
        {/* Top bar */}
        <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              onClick={() => navigate('/account')}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 700,
                color: 'white',
                cursor: 'pointer',
              }}
            >
              {getInitials(user.fullName)}
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1.2 }}>{greeting.text}</p>
              <p style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{user.fullName.split(' ')[0]} {greeting.emoji}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => navigate('/notifications')}
              style={{
                position: 'relative',
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={18} color="white" />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#FF4D4F',
                    color: 'white',
                    fontSize: 9,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #0066FF',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Balance Section */}
        <div className="animate-fade-in-up" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Saldo PinjamAJA</span>
            <button
              onClick={() => setShowBalance(!showBalance)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}
            >
              {showBalance ? <Eye size={14} color="rgba(255,255,255,0.7)" /> : <EyeOff size={14} color="rgba(255,255,255,0.7)" />}
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
              {showBalance ? formatRupiah(totalBalance) : 'Rp ••••••'}
            </p>
            <button
              onClick={() => navigate('/savings')}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: 20,
                padding: '6px 14px',
                color: 'white',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Plus size={14} /> Top Up
            </button>
          </div>
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div style={{ padding: '0 16px', marginTop: -12 }}>

        {/* 4 Main Action Shortcuts */}
        <div
          className="card animate-slide-up"
          style={{
            padding: '16px 8px',
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-around',
          }}
        >
          {mainShortcuts.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                className="gopay-action-btn"
                onClick={action.onClick}
              >
                <div
                  className="gopay-action-icon"
                  style={{ background: action.bg }}
                >
                  <Icon size={22} color={action.color} strokeWidth={2} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* FINANCIAL INSIGHTS WIDGET */}
        <div className="card animate-fade-in-up" style={{ padding: '16px', marginBottom: 16, background: '#F8FAFC' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <TrendingUp size={16} color="var(--color-primary)" />
            <h4 style={{ fontSize: 13, fontWeight: 700 }}>Financial Insights</h4>
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Bulan ini pengeluaran Anda hemat <strong>12%</strong> dibandingkan bulan lalu. Kategori terbesar: <strong>Belanja Kuliner</strong>.
          </p>
        </div>

        {/* Promo Banner Carousel */}
        <div className="animate-fade-in-up" style={{ marginBottom: 16 }}>
          <div style={{ overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}>
            <div
              style={{
                display: 'flex',
                transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: `translateX(-${activePromo * 100}%)`,
              }}
            >
              {promos.map((promo, i) => (
                <div
                  key={i}
                  className="promo-banner"
                  style={{
                    background: promo.gradient,
                    flex: '0 0 100%',
                    cursor: 'pointer',
                  }}
                >
                  <p style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{promo.title}</p>
                  <p style={{ fontSize: 11, opacity: 0.85, maxWidth: '75%' }}>{promo.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8 }}>
            {promos.map((_, i) => (
              <button
                key={i}
                onClick={() => setActivePromo(i)}
                style={{
                  width: activePromo === i ? 20 : 6,
                  height: 6,
                  borderRadius: 'var(--radius-full)',
                  background: activePromo === i ? 'var(--color-primary)' : 'var(--color-border)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* CROSS BORDER QRIS SUMMARY WIDGET */}
        <div className="card animate-fade-in-up" style={{
          padding: '12px 16px', marginBottom: 16,
          background: 'linear-gradient(135deg, #E0F7FA 0%, #EBF5FF 100%)',
          border: '1.5px solid var(--color-accent-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
        }}>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 2 }}>QRIS ASEAN Aktif! 🌐</h4>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Kini Anda bisa bayar QRIS langsung di Singapura, Malaysia, & Thailand.</p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/qris')} style={{ padding: '6px 12px', fontSize: 10 }}>Coba</button>
        </div>

        {/* SAVINGS GOAL PROGRESS WIDGET */}
        {activeSavingsGoal && (
          <div className="card animate-fade-in-up" style={{ padding: '16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target size={16} color="var(--color-success)" />
                <h4 style={{ fontSize: 13, fontWeight: 700 }}>Progres Tabungan Impian</h4>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-success)' }}>
                {Math.round((activeSavingsGoal.balance / (activeSavingsGoal.goalTarget || 1)) * 100)}%
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
              Tujuan: <strong>{activeSavingsGoal.goalName}</strong> ({formatRupiah(activeSavingsGoal.balance)} / {formatRupiah(activeSavingsGoal.goalTarget || 0)})
            </p>
            <div style={{ height: 6, borderRadius: 'var(--radius-full)', background: 'var(--color-border)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 'var(--radius-full)', background: 'var(--color-success)',
                width: `${Math.min(100, (activeSavingsGoal.balance / (activeSavingsGoal.goalTarget || 1)) * 100)}%`,
                transition: 'width 0.6s ease'
              }} />
            </div>
          </div>
        )}

        {/* UPCOMING INSTALLMENT WIDGET */}
        {activeLoan && (
          <div className="card animate-fade-in-up" style={{
            padding: '16px', marginBottom: 16,
            border: '1.5px solid var(--color-warning)',
            background: 'linear-gradient(135deg, var(--color-warning-light) 0%, #FFFFFF 100%)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <span className="badge badge-warning" style={{ fontSize: 9, padding: '2px 6px', marginBottom: 6 }}>Tagihan Jatuh Tempo</span>
                <h4 style={{ fontSize: 13, fontWeight: 700 }}>{activeLoan.productName}</h4>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Angsuran per bulan: <strong>{formatRupiah(activeLoan.monthlyInstallment)}</strong></p>
              </div>
              <button 
                onClick={() => setShowPayModal(true)} 
                className="btn-primary animate-pulse-glow" 
                style={{ padding: '8px 16px', fontSize: 11, background: 'var(--color-warning)', color: 'white' }}
              >
                Bayar
              </button>
            </div>
          </div>
        )}

        {/* CREDIT SCORE & INSURANCE SUMMARY COLUMN */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {/* Credit Score Summary */}
          {creditScore && (
            <div className="card animate-fade-in-up" style={{ padding: '12px 14px' }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Skor Kredit</span>
              <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-primary)', margin: '4px 0 2px' }}>{creditScore.score}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-success)' }}>Grade {creditScore.grade}</span>
              </div>
            </div>
          )}

          {/* Insurance Summary */}
          <div className="card animate-fade-in-up" style={{ padding: '12px 14px' }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Polis Aktif</span>
            <p style={{ fontSize: 20, fontWeight: 800, color: '#7C3AED', margin: '4px 0 2px' }}>{activePolicyCount}</p>
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)' }}>Asuransi Mikro</span>
          </div>
        </div>

        {/* RECOMMENDED PRODUCTS */}
        <div className="animate-fade-in-up" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Rekomendasi Layanan</h3>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }} className="no-scrollbar">
            <div className="card card-hover" style={{ padding: 12, flex: '0 0 160px', cursor: 'pointer' }} onClick={() => navigate('/loans')}>
              <span style={{ fontSize: 22 }}>🏪</span>
              <h5 style={{ fontSize: 12, fontWeight: 700, marginTop: 6, marginBottom: 2 }}>Pinjaman Usaha</h5>
              <p style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>Modal s.d Rp 50jt</p>
            </div>
            <div className="card card-hover" style={{ padding: 12, flex: '0 0 160px', cursor: 'pointer' }} onClick={() => navigate('/insurance')}>
              <span style={{ fontSize: 22 }}>🛡️</span>
              <h5 style={{ fontSize: 12, fontWeight: 700, marginTop: 6, marginBottom: 2 }}>Asuransi Gadget</h5>
              <p style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>Mulai dari Rp 9.000/bln</p>
            </div>
            <div className="card card-hover" style={{ padding: 12, flex: '0 0 160px', cursor: 'pointer' }} onClick={() => navigate('/savings')}>
              <span style={{ fontSize: 22 }}>📈</span>
              <h5 style={{ fontSize: 12, fontWeight: 700, marginTop: 6, marginBottom: 2 }}>Tabungan Premium</h5>
              <p style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>Bunga tinggi 4.5% p.a</p>
            </div>
          </div>
        </div>

        {/* Financial Services Grid */}
        <div className="animate-fade-in-up" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Semua Layanan</h3>
          </div>
          <div
            className="card"
            style={{
              padding: '8px 4px',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 0,
            }}
          >
            {services.map((svc) => {
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

        {/* Recent Transactions */}
        <div className="animate-fade-in-up" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Aktivitas Terakhir</h3>
            <button
              className="btn-ghost"
              onClick={() => navigate('/transactions')}
              style={{ fontSize: 12, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 2, color: 'var(--color-primary)' }}
            >
              Semua <ChevronRight size={14} />
            </button>
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            {recentTransactions.map((tx, i) => {
              const isIncome = isIncomeTransaction(tx.type);
              return (
                <div
                  key={tx.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderBottom: i < recentTransactions.length - 1 ? '1px solid var(--color-border-light)' : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--radius-md)',
                      background: isIncome ? 'var(--color-success-light)' : '#F3F4F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                    }}
                  >
                    {isIncome ? '↓' : '↑'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getTransactionLabel(tx.type)}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {formatDate(tx.createdAt, 'relative')}
                    </p>
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: isIncome ? 'var(--color-success)' : 'var(--color-text-primary)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isIncome ? '+' : '-'}{formatRupiah(tx.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* PAY INSTALLMENT MODAL */}
      {showPayModal && activeLoan && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()} style={{ padding: 24 }}>
            {successPay ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--color-success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <CheckCircle2 size={32} color="var(--color-success)" />
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 700 }}>Pembayaran Angsuran Berhasil!</h4>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>Tagihan Anda telah dilunasi.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800 }}>Konfirmasi Bayar Angsuran</h3>
                  <button onClick={() => setShowPayModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                </div>

                <div className="card" style={{ padding: 16, marginBottom: 20 }}>
                  <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 2 }}>Nama Pinjaman</p>
                  <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{activeLoan.productName}</p>
                  
                  <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 2 }}>Jumlah Pembayaran</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-primary)' }}>{formatRupiah(activeLoan.monthlyInstallment)}</p>
                </div>

                <button
                  onClick={handlePayInstallment}
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : null}
                  {isSubmitting ? 'Memproses...' : 'Konfirmasi Pembayaran'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Search } from 'lucide-react';
import { useSavingsStore } from '@/stores/savingsStore';
import { formatRupiah, formatDate, formatTime, getTransactionLabel, isIncomeTransaction } from '@/helpers/format';
import StatusBadge from '@/components/StatusBadge';
import PageHeader from '@/components/PageHeader';

const FILTER_OPTIONS = [
  { value: '', label: 'Semua' },
  { value: 'deposit', label: 'Setor' },
  { value: 'withdrawal', label: 'Tarik' },
  { value: 'transfer_out', label: 'Transfer Keluar' },
  { value: 'transfer_in', label: 'Transfer Masuk' },
  { value: 'loan_repayment', label: 'Angsuran' },
  { value: 'qris_payment', label: 'QRIS' },
  { value: 'insurance_premium', label: 'Premi' },
  { value: 'interest_credit', label: 'Bunga' },
];

export default function TransactionHistoryPage() {
  const navigate = useNavigate();
  const transactions = useSavingsStore((s) => s.transactions);
  const accounts = useSavingsStore((s) => s.accounts);

  const [filter, setFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = transactions.filter((tx) => {
    if (filter && tx.type !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        tx.description.toLowerCase().includes(q) ||
        getTransactionLabel(tx.type).toLowerCase().includes(q) ||
        (tx.recipientName && tx.recipientName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Group by date
  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, tx) => {
    const dateKey = new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(tx);
    return acc;
  }, {});

  return (
    <div style={{ paddingBottom: 80 }}>
      <PageHeader title="Riwayat Transaksi" onBack={() => navigate('/')} />

      <div style={{ padding: '12px 16px' }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Cari transaksi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 38, fontSize: 13 }}
          />
        </div>

        {/* Filter Pills */}
        <div className="no-scrollbar" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12 }}>
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: filter === opt.value ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                background: filter === opt.value ? 'var(--color-primary-50)' : 'var(--color-surface)',
                color: filter === opt.value ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.15s ease',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 12 }}>
          {filtered.length} transaksi ditemukan
        </p>

        {/* Grouped transactions */}
        {Object.keys(grouped).length === 0 ? (
          <div className="animate-fade-in" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <Filter size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Tidak ada transaksi ditemukan</p>
          </div>
        ) : (
          Object.entries(grouped).map(([dateKey, txs]) => (
            <div key={dateKey} className="animate-fade-in-up" style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {dateKey}
              </p>
              <div className="card" style={{ overflow: 'hidden' }}>
                {txs.map((tx, i) => {
                  const isIncome = isIncomeTransaction(tx.type);
                  const account = accounts.find((a) => a.id === tx.accountId);
                  const isExpanded = expandedId === tx.id;

                  return (
                    <div key={tx.id}>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : tx.id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '12px 16px',
                          borderBottom: i < txs.length - 1 && !isExpanded ? '1px solid var(--color-border-light)' : 'none',
                          background: 'none',
                          border: 'none',
                          borderTop: 'none',
                          borderLeft: 'none',
                          borderRight: 'none',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-sans)',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: isIncome ? 'var(--color-success-light)' : 'var(--color-danger-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                          {isIncome ? '↓' : '↑'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tx.description || getTransactionLabel(tx.type)}
                          </p>
                          <p style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                            {formatTime(tx.createdAt)} · {account?.accountName || tx.accountId}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: isIncome ? 'var(--color-success)' : 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                            {isIncome ? '+' : '-'}{formatRupiah(tx.amount)}
                          </p>
                          <StatusBadge status={tx.status} />
                        </div>
                      </button>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="animate-scale-in" style={{ padding: '10px 16px 14px', background: 'var(--color-surface-secondary)', fontSize: 12, borderBottom: i < txs.length - 1 ? '1px solid var(--color-border-light)' : 'none' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--color-text-secondary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>ID Transaksi</span>
                              <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 11 }}>{tx.id}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Tipe</span>
                              <span style={{ fontWeight: 500 }}>{getTransactionLabel(tx.type)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Saldo Setelah</span>
                              <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{formatRupiah(tx.balanceAfter)}</span>
                            </div>
                            {tx.recipientName && (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Penerima</span>
                                <span style={{ fontWeight: 500 }}>{tx.recipientName} ({tx.recipientBank})</span>
                              </div>
                            )}
                            {tx.reference && (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Referensi</span>
                                <span style={{ fontWeight: 500, fontFamily: 'monospace', fontSize: 11 }}>{tx.reference}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

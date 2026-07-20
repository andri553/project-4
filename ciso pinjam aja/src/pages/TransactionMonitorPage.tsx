import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity, Search, Filter, RefreshCw, X, ChevronRight, Shield,
  AlertTriangle, Clock, User, CreditCard, MapPin, Monitor, Smartphone,
  Lock, Unlock, FileText, Download, Eye, ArrowUpRight, ArrowDownRight,
  CheckCircle2, XCircle, AlertOctagon, Zap, UserX, RotateCcw,
  TrendingUp, DollarSign, ShieldAlert, ShieldCheck, Wifi, Globe,
} from 'lucide-react';

// ========== TYPES ==========
interface TransactionRecord {
  id: string;
  accountId: string;
  userId: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  status: string;
  recipientName?: string;
  recipientAccount?: string;
  recipientBank?: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    kycStatus: string;
    riskScore: number;
    riskLevel: string;
  };
  riskScore: number;
  riskLevel: string;
  indicators: Record<string, boolean>;
}

interface SummaryData {
  totalTransactionsToday: number;
  totalTransactionValue: number;
  highRiskTransactions: number;
  blockedTransactions: number;
  activeSecurityIncidents: number;
  averageRiskScore: number;
  averageInvestigationTimeHours: number;
  riskTrend: { date: string; avgRiskScore: number }[];
}

interface CorrelationData {
  transaction: any;
  riskAssessment: { score: number; level: string; indicators: Record<string, boolean> };
  related: {
    session: any;
    device: any;
    auditLogs: any[];
    securityEvents: any[];
    incidents: any[];
    hasActiveIncident: boolean;
    duplicateIncidentId: string | null;
  };
  timeline: { timestamp: string; event: string; details: string; type: string; severity?: string }[];
}

// ========== SAVED FILTERS ==========
const SAVED_FILTERS = [
  { label: 'Critical Today', riskLevel: 'Critical', dateRange: 'today' },
  { label: 'High Risk', riskLevel: 'High', dateRange: '' },
  { label: 'High Amount', minAmount: 5000000, dateRange: '' },
  { label: 'Failed / Blocked', status: 'failed', dateRange: '' },
];

// ========== HELPERS ==========
const API_BASE = '/api/v1/security';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function formatRupiah(amount: number): string {
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)} M`;
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)} Jt`;
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

function getRiskBadge(level: string) {
  const map: Record<string, { bg: string; text: string; dot: string }> = {
    Critical: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
    High:     { bg: 'bg-orange-500/15', text: 'text-orange-400', dot: 'bg-orange-400' },
    Medium:   { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
    Low:      { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  };
  const s = map[level] || map.Low;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {level}
    </span>
  );
}

function getStatusBadge(status: string) {
  const s = status?.toLowerCase();
  if (s === 'completed') return <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Completed</span>;
  if (s === 'failed' || s === 'blocked') return <span className="text-[10px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">{status}</span>;
  return <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">{status}</span>;
}

function getTypeLabel(type: string) {
  const map: Record<string, string> = {
    deposit: 'Deposit',
    withdrawal: 'Withdrawal',
    withdrawal_qris: 'QRIS Payment',
    transfer_out: 'Transfer Out',
    transfer_in: 'Transfer In',
    loan_disbursement: 'Loan Disbursement',
  };
  return map[type] || type;
}

function getTimelineIcon(type: string) {
  if (type === 'auth') return <Shield size={14} className="text-blue-400" />;
  if (type === 'transaction') return <CreditCard size={14} className="text-emerald-400" />;
  if (type === 'security') return <AlertTriangle size={14} className="text-amber-400" />;
  if (type === 'incident') return <AlertOctagon size={14} className="text-red-400" />;
  return <Clock size={14} className="text-slate-400" />;
}

// ========== RISK TREND MINI CHART ==========
function RiskTrendChart({ data }: { data: { date: string; avgRiskScore: number }[] }) {
  if (!data || data.length === 0) return null;
  const maxScore = Math.max(...data.map(d => d.avgRiskScore), 1);
  const chartH = 48;
  const chartW = 160;
  const points = data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * chartW;
    const y = chartH - (d.avgRiskScore / maxScore) * chartH;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={chartW} height={chartH} className="mt-1">
      <polyline
        fill="none"
        stroke="var(--color-accent-blue)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {data.map((d, i) => {
        const x = (i / Math.max(data.length - 1, 1)) * chartW;
        const y = chartH - (d.avgRiskScore / maxScore) * chartH;
        return <circle key={i} cx={x} cy={y} r="3" fill="var(--color-accent-blue)" />;
      })}
    </svg>
  );
}

// ========== MAIN COMPONENT ==========
export default function TransactionMonitorPage() {
  // Dashboard State
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Filters State
  const [searchText, setSearchText] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateRange, setFilterDateRange] = useState('');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Side Panel State
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [correlation, setCorrelation] = useState<CorrelationData | null>(null);
  const [correlationLoading, setCorrelationLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ========== DATA FETCHING ==========
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(pageSize));
    if (searchText) params.set('search', searchText);
    if (filterRisk) params.set('riskLevel', filterRisk);
    if (filterType) params.set('type', filterType);
    if (filterStatus) params.set('status', filterStatus);
    if (filterMinAmount) params.set('minAmount', filterMinAmount);
    if (filterMaxAmount) params.set('maxAmount', filterMaxAmount);

    if (filterDateRange) {
      const now = new Date();
      if (filterDateRange === 'today') {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        params.set('startDate', start.toISOString());
        params.set('endDate', now.toISOString());
      } else if (filterDateRange === '7d') {
        const start = new Date(); start.setDate(start.getDate() - 7);
        params.set('startDate', start.toISOString());
        params.set('endDate', now.toISOString());
      } else if (filterDateRange === '30d') {
        const start = new Date(); start.setDate(start.getDate() - 30);
        params.set('startDate', start.toISOString());
        params.set('endDate', now.toISOString());
      }
    }

    return params.toString();
  }, [page, pageSize, searchText, filterRisk, filterType, filterStatus, filterDateRange, filterMinAmount, filterMaxAmount]);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/transactions?${buildQueryParams()}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setTransactions(json.data || []);
          setTotalCount(json.meta?.pagination?.total || json.data?.length || 0);
        }
      }
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    }
  }, [buildQueryParams]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/transactions/summary`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        if (json.success) setSummary(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch summary', err);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchTransactions(), fetchSummary()]);
    setLoading(false);
    setLastRefresh(new Date());
  }, [fetchTransactions, fetchSummary]);

  // Initial & polling auto-refresh (30s)
  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // Fetch correlation when a transaction is selected
  useEffect(() => {
    if (!selectedTxId) { setCorrelation(null); return; }
    let active = true;
    setCorrelationLoading(true);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/transactions/${selectedTxId}/correlation`, { headers: getAuthHeaders() });
        if (res.ok) {
          const json = await res.json();
          if (active && json.success) setCorrelation(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch correlation', err);
      } finally {
        if (active) setCorrelationLoading(false);
      }
    })();
    return () => { active = false; };
  }, [selectedTxId]);

  // ========== SAVED FILTER HANDLER ==========
  const applySavedFilter = (f: typeof SAVED_FILTERS[0]) => {
    setFilterRisk((f as any).riskLevel || '');
    setFilterStatus((f as any).status || '');
    setFilterDateRange((f as any).dateRange || '');
    setFilterMinAmount((f as any).minAmount ? String((f as any).minAmount) : '');
    setFilterMaxAmount((f as any).maxAmount ? String((f as any).maxAmount) : '');
    setPage(1);
  };

  const clearFilters = () => {
    setSearchText(''); setFilterRisk(''); setFilterType(''); setFilterStatus('');
    setFilterDateRange(''); setFilterMinAmount(''); setFilterMaxAmount('');
    setPage(1);
  };

  const hasActiveFilters = searchText || filterRisk || filterType || filterStatus || filterDateRange || filterMinAmount || filterMaxAmount;

  // ========== SOC RESPONSE ACTIONS ==========
  const doAction = async (action: string, userId?: string) => {
    if (!userId) return;
    setActionLoading(action);
    setActionResult(null);
    try {
      let url = '';
      if (action === 'freeze') url = `${API_BASE}/block-user/${userId}`;
      else if (action === 'revoke') url = `${API_BASE}/reset-session/${userId}`;
      else if (action === 'incident') {
        // Check duplicate
        if (correlation?.related.hasActiveIncident) {
          setActionResult({ type: 'error', message: `Duplicate incident detected. Active incident ID: ${correlation.related.duplicateIncidentId}` });
          setActionLoading(null);
          return;
        }
        url = `${API_BASE}/incidents`;
      }

      let res;
      if (action === 'incident') {
        res = await fetch(url, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            userId,
            title: `SOC Alert: Suspicious Transaction ${selectedTxId}`,
            description: `Transaction ${selectedTxId} flagged by SOC analyst. Risk Score: ${correlation?.riskAssessment.score || 'N/A'}. Amount: Rp ${correlation?.transaction.amount?.toLocaleString('id-ID') || 'N/A'}.`,
            severity: (correlation?.riskAssessment.level === 'Critical' || correlation?.riskAssessment.level === 'High') ? 'HIGH' : 'MEDIUM',
          })
        });
      } else {
        res = await fetch(url, { method: 'POST', headers: getAuthHeaders() });
      }

      if (res && res.ok) {
        const label = action === 'freeze' ? 'Account Frozen' : action === 'revoke' ? 'Session Revoked' : 'Incident Created';
        setActionResult({ type: 'success', message: `${label} successfully.` });
        if (selectedTxId) {
          // Refresh correlation
          const refreshRes = await fetch(`${API_BASE}/transactions/${selectedTxId}/correlation`, { headers: getAuthHeaders() });
          if (refreshRes.ok) {
            const json = await refreshRes.json();
            if (json.success) setCorrelation(json.data);
          }
        }
      } else {
        setActionResult({ type: 'error', message: `Action failed. Server returned ${res?.status || 'unknown'}.` });
      }
    } catch (err) {
      setActionResult({ type: 'error', message: 'Network error. Please try again.' });
    }
    setActionLoading(null);
  };

  // ========== EXPORT INVESTIGATION REPORT ==========
  const exportReport = () => {
    if (!correlation) return;
    const c = correlation;
    const lines: string[] = [];
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('  SECURENUSA × PINJAMAJA — INVESTIGATION REPORT');
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push(`Report Generated: ${new Date().toLocaleString('id-ID')}`);
    lines.push('');
    lines.push('── TRANSACTION DETAILS ──');
    lines.push(`  Transaction ID : ${c.transaction.id}`);
    lines.push(`  Type           : ${getTypeLabel(c.transaction.type)}`);
    lines.push(`  Amount         : Rp ${c.transaction.amount?.toLocaleString('id-ID')}`);
    lines.push(`  Status         : ${c.transaction.status}`);
    lines.push(`  Description    : ${c.transaction.description || '-'}`);
    lines.push(`  Recipient      : ${c.transaction.recipientName || '-'} (${c.transaction.recipientBank || '-'})`);
    lines.push(`  Date           : ${new Date(c.transaction.createdAt).toLocaleString('id-ID')}`);
    lines.push('');
    lines.push('── RISK ASSESSMENT ──');
    lines.push(`  Risk Score     : ${c.riskAssessment.score}/100`);
    lines.push(`  Risk Level     : ${c.riskAssessment.level}`);
    const activeIndicators = Object.entries(c.riskAssessment.indicators).filter(([, v]) => v).map(([k]) => k);
    lines.push(`  Indicators     : ${activeIndicators.length > 0 ? activeIndicators.join(', ') : 'None'}`);
    lines.push('');
    lines.push('── CUSTOMER PROFILE ──');
    lines.push(`  Name           : ${c.transaction.user?.fullName || '-'}`);
    lines.push(`  Email          : ${c.transaction.user?.email || '-'}`);
    lines.push(`  Phone          : ${c.transaction.user?.phoneNumber || '-'}`);
    lines.push(`  KYC Status     : ${c.transaction.user?.kycStatus || '-'}`);
    lines.push('');
    lines.push('── SESSION & DEVICE ──');
    if (c.related.session) {
      lines.push(`  Session ID     : ${c.related.session.id}`);
      lines.push(`  IP Address     : ${c.related.session.ipAddress || '-'}`);
      lines.push(`  Browser        : ${c.related.session.browser || '-'}`);
      lines.push(`  OS             : ${c.related.session.operatingSystem || '-'}`);
      lines.push(`  Trusted Device : ${c.related.session.isTrustedDevice ? 'Yes' : 'No'}`);
    } else {
      lines.push('  No session data available.');
    }
    if (c.related.device) {
      lines.push(`  Device ID      : ${c.related.device.deviceId || '-'}`);
      lines.push(`  Location       : ${c.related.device.location || '-'}`);
    }
    lines.push('');
    lines.push('── CORRELATION TIMELINE ──');
    c.timeline.forEach(t => {
      lines.push(`  [${new Date(t.timestamp).toLocaleTimeString('id-ID')}] ${t.event}: ${t.details}`);
    });
    lines.push('');
    lines.push('── RELATED INCIDENTS ──');
    if (c.related.incidents.length > 0) {
      c.related.incidents.forEach(inc => {
        lines.push(`  [${inc.id}] ${inc.title} — ${inc.severity} — ${inc.status}`);
      });
    } else {
      lines.push('  No related incidents.');
    }
    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('  END OF REPORT');
    lines.push('═══════════════════════════════════════════════════════════');

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Investigation_${c.transaction.id}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ========== PAGINATION ==========
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // ========== RENDER ==========
  return (
    <div className="flex h-full">
      {/* Main Content Area */}
      <div className={`flex-1 overflow-y-auto p-6 space-y-6 transition-all duration-300 ${selectedTxId ? 'mr-[480px]' : ''}`}>

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <Activity style={{ color: 'var(--color-accent-blue)' }} /> Transaction Security Center
            </h1>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              SOC Transaction Intelligence — Risk Assessment, Correlation & Investigation
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-secondary)' }}>
              Auto-refresh 30s · Last: {lastRefresh.toLocaleTimeString('id-ID')}
            </span>
            <button
              onClick={fetchAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:scale-105 cursor-pointer"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', background: 'var(--color-bg-surface)' }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* ── EXECUTIVE DASHBOARD CARDS ── */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {[
              { label: 'Total Transactions', value: summary.totalTransactionsToday, icon: <CreditCard size={16} />, color: 'var(--color-accent-blue)' },
              { label: 'Total Value', value: formatRupiah(summary.totalTransactionValue), icon: <DollarSign size={16} />, color: 'var(--color-accent-emerald)' },
              { label: 'High Risk', value: summary.highRiskTransactions, icon: <ShieldAlert size={16} />, color: 'var(--color-accent-red)' },
              { label: 'Blocked', value: summary.blockedTransactions, icon: <XCircle size={16} />, color: '#F97316' },
              { label: 'Active Incidents', value: summary.activeSecurityIncidents, icon: <AlertOctagon size={16} />, color: '#EF4444' },
              { label: 'Avg Risk Score', value: `${summary.averageRiskScore}/100`, icon: <Shield size={16} />, color: 'var(--color-accent-amber)' },
            ].map((c, i) => (
              <div key={i} className="rounded-xl p-4 border" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span style={{ color: c.color }}>{c.icon}</span>
                  <span className="text-[10px] uppercase font-semibold tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>{c.label}</span>
                </div>
                <p className="text-xl font-bold" style={{ color: c.color }}>{c.value}</p>
              </div>
            ))}
            {/* Risk Trend Sparkline */}
            <div className="rounded-xl p-4 border" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp size={16} style={{ color: 'var(--color-accent-blue)' }} />
                <span className="text-[10px] uppercase font-semibold tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>Risk Trend 7d</span>
              </div>
              <RiskTrendChart data={summary.riskTrend} />
            </div>
          </div>
        )}

        {/* ── SEARCH & FILTERS ── */}
        <div className="rounded-xl p-4 border space-y-3" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="flex-1 min-w-[200px] relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search by Transaction ID, Customer Name, Account Number, Phone..."
                value={searchText}
                onChange={e => { setSearchText(e.target.value); setPage(1); }}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border"
                style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border cursor-pointer transition-all ${hasActiveFilters ? 'border-blue-500 bg-blue-500/10 text-blue-400' : ''}`}
              style={!hasActiveFilters ? { borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', background: 'var(--color-bg-elevated)' } : {}}
            >
              <Filter size={14} /> Filters {hasActiveFilters && '●'}
            </button>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-[10px] text-red-400 hover:underline cursor-pointer">
                Clear All
              </button>
            )}
          </div>

          {/* Saved Filters Row */}
          <div className="flex flex-wrap gap-2">
            {SAVED_FILTERS.map((sf, i) => (
              <button
                key={i}
                onClick={() => applySavedFilter(sf)}
                className="text-[10px] px-2.5 py-1 rounded-full border font-semibold cursor-pointer hover:bg-blue-500/10 hover:border-blue-500/40 transition-all"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                {sf.label}
              </button>
            ))}
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <select value={filterRisk} onChange={e => { setFilterRisk(e.target.value); setPage(1); }}
                className="text-xs px-2 py-1.5 rounded-lg border" style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
                <option value="">All Risk Levels</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}
                className="text-xs px-2 py-1.5 rounded-lg border" style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
                <option value="">All Types</option>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="withdrawal_qris">QRIS Payment</option>
                <option value="transfer_out">Transfer Out</option>
              </select>
              <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                className="text-xs px-2 py-1.5 rounded-lg border" style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="blocked">Blocked</option>
                <option value="pending">Pending</option>
              </select>
              <select value={filterDateRange} onChange={e => { setFilterDateRange(e.target.value); setPage(1); }}
                className="text-xs px-2 py-1.5 rounded-lg border" style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
                <option value="">All Dates</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
              <div className="flex gap-2">
                <input type="number" placeholder="Min Rp" value={filterMinAmount} onChange={e => { setFilterMinAmount(e.target.value); setPage(1); }}
                  className="w-1/2 text-xs px-2 py-1.5 rounded-lg border" style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
                <input type="number" placeholder="Max Rp" value={filterMaxAmount} onChange={e => { setFilterMaxAmount(e.target.value); setPage(1); }}
                  className="w-1/2 text-xs px-2 py-1.5 rounded-lg border" style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
              </div>
            </div>
          )}
        </div>

        {/* ── TRANSACTION TABLE ── */}
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  <th className="py-3 px-4 font-semibold">Transaction ID</th>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount</th>
                  <th className="py-3 px-4 font-semibold text-center">Risk</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {loading && transactions.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center text-slate-500">
                    <RefreshCw size={20} className="animate-spin inline-block mr-2" /> Loading transactions...
                  </td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center text-slate-500 italic">No transactions match your criteria</td></tr>
                ) : transactions.map(tx => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTxId(tx.id)}
                    className={`cursor-pointer transition-all hover:bg-blue-500/5 ${selectedTxId === tx.id ? 'bg-blue-500/10' : ''}`}
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    <td className="py-3 px-4 font-mono text-[10px] text-blue-400 font-bold">{tx.id.slice(0, 12)}...</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-xs">{tx.user?.fullName || '-'}</div>
                      <div className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{tx.user?.email || '-'}</div>
                    </td>
                    <td className="py-3 px-4 text-[10px] font-semibold uppercase" style={{ color: 'var(--color-text-secondary)' }}>{getTypeLabel(tx.type)}</td>
                    <td className="py-3 px-4 text-right font-bold">{formatRupiah(tx.amount)}</td>
                    <td className="py-3 px-4 text-center">{getRiskBadge(tx.riskLevel)}</td>
                    <td className="py-3 px-4 text-center">{getStatusBadge(tx.status)}</td>
                    <td className="py-3 px-4 text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{new Date(tx.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="py-3 px-4 text-center">
                      <button className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-400 cursor-pointer" title="Investigate">
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                Page {page} of {totalPages} ({totalCount} total)
              </span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  className="text-xs px-3 py-1 rounded border cursor-pointer disabled:opacity-30"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
                  Previous
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="text-xs px-3 py-1 rounded border cursor-pointer disabled:opacity-30"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════ */}
      {/* ── CORRELATION INVESTIGATION SIDE PANEL ──      */}
      {/* ════════════════════════════════════════════════ */}
      {selectedTxId && (
        <div className="fixed right-0 top-0 h-full w-[480px] border-l overflow-y-auto z-50 shadow-2xl"
          style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
          
          {/* Panel Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b"
            style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Correlation Investigation
              </h2>
              <p className="text-[10px] font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                {selectedTxId.slice(0, 20)}...
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={exportReport} className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-400 cursor-pointer" title="Export Investigation Report">
                <Download size={16} />
              </button>
              <button onClick={() => { setSelectedTxId(null); setActionResult(null); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 cursor-pointer" title="Close">
                <X size={16} />
              </button>
            </div>
          </div>

          {correlationLoading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw size={24} className="animate-spin text-blue-400" />
              <span className="ml-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading correlation graph...</span>
            </div>
          ) : correlation ? (
            <div className="p-5 space-y-5">

              {/* ── Risk Score Badge ── */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getRiskBadge(correlation.riskAssessment.level)}
                  <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {correlation.riskAssessment.score}<span className="text-xs font-normal" style={{ color: 'var(--color-text-secondary)' }}>/100</span>
                  </span>
                </div>
                {getStatusBadge(correlation.transaction.status)}
              </div>

              {/* ── Transaction Details ── */}
              <div className="rounded-xl p-4 border space-y-2" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}>
                <h3 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  <CreditCard size={12} className="inline mr-1" /> Transaction Profile
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-slate-500">Type:</span> <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{getTypeLabel(correlation.transaction.type)}</span></div>
                  <div><span className="text-slate-500">Amount:</span> <span className="font-bold" style={{ color: 'var(--color-accent-emerald)' }}>Rp {correlation.transaction.amount?.toLocaleString('id-ID')}</span></div>
                  <div><span className="text-slate-500">Recipient:</span> <span style={{ color: 'var(--color-text-primary)' }}>{correlation.transaction.recipientName || '-'}</span></div>
                  <div><span className="text-slate-500">Bank:</span> <span style={{ color: 'var(--color-text-primary)' }}>{correlation.transaction.recipientBank || '-'}</span></div>
                  <div className="col-span-2"><span className="text-slate-500">Description:</span> <span style={{ color: 'var(--color-text-primary)' }}>{correlation.transaction.description}</span></div>
                </div>
              </div>

              {/* ── Customer Profile ── */}
              <div className="rounded-xl p-4 border space-y-2" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}>
                <h3 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  <User size={12} className="inline mr-1" /> Customer Profile
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-slate-500">Name:</span> <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{correlation.transaction.user?.fullName}</span></div>
                  <div><span className="text-slate-500">KYC:</span> <span className={correlation.transaction.user?.kycStatus?.toLowerCase() === 'approved' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>{correlation.transaction.user?.kycStatus}</span></div>
                  <div><span className="text-slate-500">Email:</span> <span style={{ color: 'var(--color-text-primary)' }}>{correlation.transaction.user?.email}</span></div>
                  <div><span className="text-slate-500">Phone:</span> <span style={{ color: 'var(--color-text-primary)' }}>{correlation.transaction.user?.phoneNumber}</span></div>
                </div>
              </div>

              {/* ── Security Context ── */}
              <div className="rounded-xl p-4 border space-y-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}>
                <h3 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  <Shield size={12} className="inline mr-1" /> Security Context
                </h3>
                {correlation.related.session ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5"><Globe size={12} className="text-slate-500" /><span className="text-slate-500">IP:</span> <span style={{ color: 'var(--color-text-primary)' }}>{correlation.related.session.ipAddress || '-'}</span></div>
                    <div className="flex items-center gap-1.5"><Monitor size={12} className="text-slate-500" /><span className="text-slate-500">Browser:</span> <span style={{ color: 'var(--color-text-primary)' }}>{correlation.related.session.browser || '-'}</span></div>
                    <div className="flex items-center gap-1.5"><Smartphone size={12} className="text-slate-500" /><span className="text-slate-500">OS:</span> <span style={{ color: 'var(--color-text-primary)' }}>{correlation.related.session.operatingSystem || '-'}</span></div>
                    <div className="flex items-center gap-1.5">
                      {correlation.related.session.isTrustedDevice
                        ? <><ShieldCheck size={12} className="text-emerald-400" /><span className="text-emerald-400 font-semibold">Trusted Device</span></>
                        : <><ShieldAlert size={12} className="text-amber-400" /><span className="text-amber-400 font-semibold">Untrusted Device</span></>}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs italic text-slate-500">No session data available for this transaction.</p>
                )}
                {correlation.related.device?.location && (
                  <div className="flex items-center gap-1.5 text-xs"><MapPin size={12} className="text-slate-500" /><span className="text-slate-500">Location:</span> <span style={{ color: 'var(--color-text-primary)' }}>{correlation.related.device.location}</span></div>
                )}
              </div>

              {/* ── Behavior & Risk Indicators ── */}
              <div className="rounded-xl p-4 border space-y-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}>
                <h3 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  <Zap size={12} className="inline mr-1" /> Risk & Behavior Indicators
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(correlation.riskAssessment.indicators).filter(([, v]) => v).map(([key]) => {
                    const labelMap: Record<string, { label: string; color: string }> = {
                      criticalAmount: { label: 'Critical Amount', color: 'text-red-400 bg-red-500/10' },
                      highAmount: { label: 'High Amount', color: 'text-orange-400 bg-orange-500/10' },
                      unverifiedKyc: { label: 'Unverified KYC', color: 'text-amber-400 bg-amber-500/10' },
                      authFailures: { label: 'Auth Failures', color: 'text-red-400 bg-red-500/10' },
                      crossBorder: { label: 'Cross-Border', color: 'text-purple-400 bg-purple-500/10' },
                      vpnNetworkRisk: { label: 'Network Risk', color: 'text-orange-400 bg-orange-500/10' },
                      unusualTime: { label: 'Unusual Activity Time', color: 'text-amber-400 bg-amber-500/10' },
                      newBeneficiary: { label: 'New Beneficiary', color: 'text-blue-400 bg-blue-500/10' },
                      rapidTransactions: { label: 'Rapid Transactions', color: 'text-red-400 bg-red-500/10' },
                      dormantReactivation: { label: 'Dormant Reactivation', color: 'text-amber-400 bg-amber-500/10' },
                    };
                    const item = labelMap[key] || { label: key, color: 'text-slate-400 bg-slate-500/10' };
                    return (
                      <span key={key} className={`text-[10px] font-semibold px-2 py-1 rounded-full ${item.color}`}>
                        {item.label}
                      </span>
                    );
                  })}
                  {Object.values(correlation.riskAssessment.indicators).filter(v => v).length === 0 && (
                    <span className="text-[10px] italic text-slate-500">No risk indicators triggered</span>
                  )}
                </div>
              </div>

              {/* ── Correlation Timeline ── */}
              <div className="rounded-xl p-4 border space-y-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}>
                <h3 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  <Clock size={12} className="inline mr-1" /> Correlation Timeline
                </h3>
                <div className="space-y-0">
                  {correlation.timeline.map((t, i) => (
                    <div key={i} className="flex gap-3 group">
                      <div className="flex flex-col items-center">
                        <div className="w-7 h-7 rounded-full border flex items-center justify-center" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-surface)' }}>
                          {getTimelineIcon(t.type)}
                        </div>
                        {i < correlation.timeline.length - 1 && (
                          <div className="w-px flex-1 my-1" style={{ background: 'var(--color-border)' }} />
                        )}
                      </div>
                      <div className="pb-4 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{t.event}</span>
                          {t.severity && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                              t.severity === 'High' || t.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400' :
                              t.severity === 'Medium' || t.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-400' :
                              'bg-amber-500/10 text-amber-400'
                            }`}>{t.severity}</span>
                          )}
                        </div>
                        <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{t.details}</p>
                        <span className="text-[9px] font-mono" style={{ color: 'var(--color-text-secondary)' }}>{new Date(t.timestamp).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  ))}
                  {correlation.timeline.length === 0 && (
                    <p className="text-xs italic text-slate-500">No timeline data available.</p>
                  )}
                </div>
              </div>

              {/* ── Related Incidents ── */}
              {correlation.related.incidents.length > 0 && (
                <div className="rounded-xl p-4 border space-y-2" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}>
                  <h3 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                    <AlertOctagon size={12} className="inline mr-1" /> Related Incidents ({correlation.related.incidents.length})
                  </h3>
                  {correlation.related.incidents.slice(0, 5).map(inc => (
                    <div key={inc.id} className="flex items-center justify-between py-1.5 border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                      <div>
                        <p className="text-[10px] font-mono font-bold text-blue-400">{inc.id.slice(0, 12)}...</p>
                        <p className="text-[10px]" style={{ color: 'var(--color-text-primary)' }}>{inc.title}</p>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${inc.status === 'OPEN' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{inc.status}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ── SOC Response Actions ── */}
              <div className="space-y-3">
                {/* Action Result Toast */}
                {actionResult && (
                  <div className={`rounded-lg p-3 text-xs font-semibold flex items-center gap-2 ${actionResult.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                    {actionResult.type === 'success' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    {actionResult.message}
                    <button onClick={() => setActionResult(null)} className="ml-auto hover:opacity-70 cursor-pointer"><X size={12} /></button>
                  </div>
                )}

                {/* Quick Response */}
                <div className="rounded-xl p-4 border space-y-2" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}>
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                    <Zap size={12} className="inline mr-1" /> Quick Response
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => doAction('freeze', correlation.transaction.user?.id)}
                      disabled={!!actionLoading}
                      className="flex flex-col items-center gap-1 p-3 rounded-lg border border-red-500/30 hover:bg-red-500/10 transition-all cursor-pointer disabled:opacity-30"
                    >
                      <Lock size={16} className="text-red-400" />
                      <span className="text-[10px] font-bold text-red-400">{actionLoading === 'freeze' ? 'Processing...' : 'Freeze Account'}</span>
                    </button>
                    <button
                      onClick={() => doAction('revoke', correlation.transaction.user?.id)}
                      disabled={!!actionLoading}
                      className="flex flex-col items-center gap-1 p-3 rounded-lg border border-orange-500/30 hover:bg-orange-500/10 transition-all cursor-pointer disabled:opacity-30"
                    >
                      <RotateCcw size={16} className="text-orange-400" />
                      <span className="text-[10px] font-bold text-orange-400">{actionLoading === 'revoke' ? 'Processing...' : 'Revoke Session'}</span>
                    </button>
                    <button
                      onClick={() => doAction('incident', correlation.transaction.user?.id)}
                      disabled={!!actionLoading}
                      className="flex flex-col items-center gap-1 p-3 rounded-lg border border-amber-500/30 hover:bg-amber-500/10 transition-all cursor-pointer disabled:opacity-30"
                    >
                      <AlertOctagon size={16} className="text-amber-400" />
                      <span className="text-[10px] font-bold text-amber-400">{actionLoading === 'incident' ? 'Processing...' : 'Create Incident'}</span>
                    </button>
                  </div>
                  {correlation.related.hasActiveIncident && (
                    <p className="text-[10px] text-amber-400 font-semibold mt-1">
                      ⚠ Active incident exists: {correlation.related.duplicateIncidentId?.slice(0, 12)}...
                    </p>
                  )}
                </div>

                {/* Advanced Response */}
                <div className="rounded-xl p-4 border space-y-2" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}>
                  <h3 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                    <Shield size={12} className="inline mr-1" /> Advanced Response
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="flex items-center gap-2 p-2.5 rounded-lg border hover:bg-slate-500/5 transition-all cursor-pointer opacity-60"
                      style={{ borderColor: 'var(--color-border)' }} title="Coming soon">
                      <Smartphone size={14} className="text-slate-400" />
                      <span className="text-[10px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Block Device</span>
                    </button>
                    <button className="flex items-center gap-2 p-2.5 rounded-lg border hover:bg-slate-500/5 transition-all cursor-pointer opacity-60"
                      style={{ borderColor: 'var(--color-border)' }} title="Coming soon">
                      <Unlock size={14} className="text-slate-400" />
                      <span className="text-[10px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Force Re-Auth</span>
                    </button>
                  </div>
                </div>

                {/* Investigation Controls */}
                <div className="rounded-xl p-4 border space-y-2" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}>
                  <h3 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                    <FileText size={12} className="inline mr-1" /> Investigation
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="flex items-center gap-2 p-2.5 rounded-lg border hover:bg-slate-500/5 transition-all cursor-pointer opacity-60"
                      style={{ borderColor: 'var(--color-border)' }} title="Coming soon">
                      <UserX size={14} className="text-slate-400" />
                      <span className="text-[10px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Assign Analyst</span>
                    </button>
                    <button className="flex items-center gap-2 p-2.5 rounded-lg border hover:bg-slate-500/5 transition-all cursor-pointer opacity-60"
                      style={{ borderColor: 'var(--color-border)' }} title="Coming soon">
                      <FileText size={14} className="text-slate-400" />
                      <span className="text-[10px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Add Notes</span>
                    </button>
                    <button className="flex items-center gap-2 p-2.5 rounded-lg border hover:bg-slate-500/5 transition-all cursor-pointer opacity-60"
                      style={{ borderColor: 'var(--color-border)' }} title="Coming soon">
                      <Eye size={14} className="text-slate-400" />
                      <span className="text-[10px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Attach Evidence</span>
                    </button>
                    <button
                      onClick={exportReport}
                      className="flex items-center gap-2 p-2.5 rounded-lg border hover:bg-blue-500/10 transition-all cursor-pointer"
                      style={{ borderColor: 'var(--color-accent-blue)' }}
                    >
                      <Download size={14} className="text-blue-400" />
                      <span className="text-[10px] font-bold text-blue-400">Export Report</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Shield size={32} className="mb-3 opacity-30" />
              <p className="text-xs">No correlation data available.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

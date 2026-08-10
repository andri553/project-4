import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { useGovernance } from '@/contexts/GovernanceContext';
import {
  ShieldAlert, Scale, FileCheck, Map, Bug, AlertTriangle,
  Server, Database, UserCog, GraduationCap, ClipboardCheck,
  BarChart3, Gauge, Code2, Settings, Layers,
  TrendingUp, TrendingDown, ExternalLink, FileText,
  RefreshCw as RefreshCwIcon, Activity, CheckCircle
} from 'lucide-react';
import ModulePlaceholder from '@/components/common/ModulePlaceholder';

// ==========================================
// 1. RISK MANAGEMENT MODULE (GRC Core)
// ==========================================
export function RiskManagementPage() {
  const { openWorkflow } = useWorkflow();
  const { data: { risks } } = useGovernance();
  const [selectedCell, setSelectedCell] = useState<{ l: number; i: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Stats
  const totalRisks = risks.length;
  const criticalRisks = risks.filter(r => r.inherentScore >= 12).length;
  const mitigatedRisks = risks.filter(r => r.status === 'Mitigated').length;
  const acceptedRisks = risks.filter(r => r.status === 'Accepted').length;

  const filteredRisks = useMemo(() => {
    return risks.filter(r => {
      const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMatrix = selectedCell ? r.likelihood === selectedCell.l && r.impact === selectedCell.i : true;
      return matchesSearch && matchesMatrix;
    });
  }, [selectedCell, searchQuery]);

  const matrixCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    risks.forEach(r => {
      const key = `${r.likelihood}-${r.impact}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, []);

  const getCellColor = (l: number, i: number, isSelected: boolean) => {
    const score = l * i;
    let baseColor = '';
    if (score >= 15) baseColor = 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/35';
    else if (score >= 8) baseColor = 'bg-orange-500/20 text-orange-400 border-orange-500/40 hover:bg-orange-500/35';
    else if (score >= 4) baseColor = 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/35';
    else baseColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/35';

    if (isSelected) {
      return `${baseColor} border-2 ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-950 scale-[1.03] z-10`;
    }
    return baseColor;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <ShieldAlert style={{ color: 'var(--color-accent-blue)' }} /> Risk Management
          </h1>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            GRC Register, 5x5 Heatmap & Real-Time Treatment Plans
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Identified Risks', value: totalRisks, color: 'var(--color-accent-blue)' },
          { label: 'Critical Risks (Score ≥ 12)', value: criticalRisks, color: 'var(--color-accent-red)' },
          { label: 'Mitigated Risks', value: mitigatedRisks, color: 'var(--color-accent-emerald)' },
          { label: 'Accepted Risks', value: acceptedRisks, color: 'var(--color-accent-amber)' },
        ].map((stat, i) => (
          <div key={i} className="rounded-xl p-5 border" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
            <span className="text-[11px] uppercase font-semibold tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>{stat.label}</span>
            <p className="text-2xl font-bold mt-1" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Heatmap Matrix & Search */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Risk Heatmap (5x5 Grid) */}
        <div className="col-span-12 lg:col-span-5 rounded-xl p-5 border flex flex-col" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-secondary)' }}>Interactive Risk Heat Map</h3>

          <div className="flex-1 flex flex-col justify-between">
            {/* Impact Label */}
            <div className="flex flex-1">
              <div className="w-6 flex items-center justify-center">
                <span className="text-[9px] font-bold uppercase tracking-wider -rotate-90 select-none" style={{ color: 'var(--color-text-secondary)' }}>Impact</span>
              </div>

              {/* Grid */}
              <div className="flex-1 grid grid-cols-5 gap-1.5">
                {[5, 4, 3, 2, 1].map((impact) => (
                  <div key={impact} className="col-span-5 grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5].map((likelihood) => {
                      const count = matrixCounts[`${likelihood}-${impact}`] || 0;
                      const isSelected = selectedCell?.l === likelihood && selectedCell?.i === impact;
                      return (
                        <div
                          key={likelihood}
                          onClick={() => {
                            if (isSelected) setSelectedCell(null);
                            else setSelectedCell({ l: likelihood, i: impact });
                          }}
                          className={`h-10 rounded border flex flex-col items-center justify-center cursor-pointer transition-all ${getCellColor(likelihood, impact, isSelected)}`}
                        >
                          <span className="text-xs font-bold">{count > 0 ? count : ''}</span>
                          <span className="text-[7px] opacity-60">L{likelihood} I{impact}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Likelihood Label */}
            <div className="pl-6 pt-2 text-center">
              <span className="text-[9px] font-bold uppercase tracking-wider select-none" style={{ color: 'var(--color-text-secondary)' }}>Likelihood</span>
            </div>
          </div>
          {selectedCell && (
            <button
              onClick={() => setSelectedCell(null)}
              className="mt-3 text-[10px] text-blue-400 font-semibold text-center hover:underline cursor-pointer"
            >
              Clear matrix filter
            </button>
          )}
        </div>

        {/* Risk Register Table */}
        <div className="col-span-12 lg:col-span-7 rounded-xl p-5 border flex flex-col justify-between" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Risk Register</h3>
              <input
                type="text"
                placeholder="Search risk title..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="text-xs px-2 py-1 rounded border"
                style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              />
            </div>

            <div className="overflow-x-auto max-h-[220px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                    <th className="py-2 font-semibold w-16">ID</th>
                    <th className="py-2 font-semibold">Title</th>
                    <th className="py-2 font-semibold text-center w-16">Score</th>
                    <th className="py-2 font-semibold w-24">Status</th>
                    <th className="py-2 font-semibold text-right w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                  {filteredRisks.map((risk) => {
                    const isCritical = risk.inherentScore >= 12;
                    return (
                      <tr key={risk.id} className="hover:bg-slate-900/20" style={{ color: 'var(--color-text-primary)' }}>
                        <td className="py-2 font-mono font-bold text-slate-400">{risk.id}</td>
                        <td className="py-2 truncate max-w-[200px]" title={risk.title}>{risk.title}</td>
                        <td className="py-2 text-center font-bold">
                          <span className={isCritical ? 'text-red-400' : 'text-orange-400'}>
                            {risk.inherentScore}
                          </span>
                        </td>
                        <td className="py-2">
                          <span className={`text-[10px] px-1.5 py-0.25 rounded-full font-semibold ${risk.status === 'Mitigated' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                            {risk.status}
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          <button
                            onClick={() => openWorkflow('risk', risk.id)}
                            className="p-1 hover:bg-slate-800 rounded text-blue-400 cursor-pointer"
                            title="Trace Workflow"
                          >
                            <Layers size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRisks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-500 italic">No risks match criteria</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. COMPLIANCE MANAGEMENT MODULE (UU PDP, ISO 27001)
// ==========================================
export function ComplianceManagementPage() {
  const { data: { complianceRequirements } } = useGovernance();
  const { openWorkflow } = useWorkflow();
  const [activeTab, setActiveTab] = useState<'All' | 'UU PDP' | 'POJK 10/2022' | 'PADG 23/21' | 'ISO 27001'>('All');

  const filteredRequirements = useMemo(() => {
    if (activeTab === 'All') return complianceRequirements;
    return complianceRequirements.filter(c => c.regulation === activeTab);
  }, [activeTab]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <Scale style={{ color: 'var(--color-accent-emerald)' }} /> Compliance Management
        </h1>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Regulator Mapping, Audit Evidence Library & GRC Traceability
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--color-border)' }}>
        {(['All', 'UU PDP', 'POJK 10/2022', 'PADG 23/21', 'ISO 27001'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-semibold cursor-pointer border-b-2 -mb-[2px] transition-colors ${activeTab === tab
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredRequirements.map((req) => {
          const statusColors: Record<string, string> = {
            'Compliant': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            'Partially Compliant': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            'Non-Compliant': 'bg-red-500/10 text-red-400 border-red-500/20',
            'Not Assessed': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
          };

          return (
            <div
              key={req.id}
              className="rounded-xl p-5 border flex flex-col justify-between"
              style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400">
                    {req.regulation} • {req.article}
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${statusColors[req.status]}`}>
                    {req.status}
                  </span>
                </div>

                <h3 className="text-xs font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>{req.title}</h3>
                <p className="text-[10px] mb-3 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{req.description}</p>

                {req.gapDescription && (
                  <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-2.5 mb-3 text-[10px] text-red-400">
                    <span className="font-semibold block mb-0.5">GAP IDENTIFIED</span>
                    {req.gapDescription}
                  </div>
                )}

                {/* Progress bar */}
                <div className="flex items-center justify-between text-[9px] mb-1">
                  <span style={{ color: 'var(--color-text-muted)' }}>Progress</span>
                  <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{req.progress}%</span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full mb-3">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${req.progress}%` }} />
                </div>
              </div>

              {/* Linked Evidence files & Actions */}
              <div className="border-t pt-3 flex items-center justify-between mt-2" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-1.5">
                  <FileText size={12} className="text-slate-400" />
                  <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                    {req.controlIds.length} controls mapped
                  </span>
                </div>

                <button
                  onClick={() => openWorkflow('compliance', req.id)}
                  className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-slate-800 text-emerald-400 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Trace Workflow <ExternalLink size={10} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// 3. SECURITY ROADMAP MODULE (Gantt Tracker)
// ==========================================
export function SecurityRoadmapPage() {
  const { data: { roadmapInitiatives } } = useGovernance();
  const { openWorkflow } = useWorkflow();
  const [selectedYear, setSelectedYear] = useState<1 | 2 | 3>(1);

  const filteredInitiatives = useMemo(() => {
    return roadmapInitiatives.filter(r => r.year === selectedYear);
  }, [selectedYear]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <Map style={{ color: 'var(--color-accent-amber)' }} /> 3-Year Security Roadmap
          </h1>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Strategic Milestones, Phased Execution & Budget Utilizations
          </p>
        </div>

        {/* Year Selectors */}
        <div className="flex rounded-lg border p-1" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
          {([1, 2, 3] as const).map(y => (
            <button
              key={y}
              onClick={() => setSelectedYear(y)}
              className={`px-3 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${selectedYear === y
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              Year {y}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {['Q1', 'Q2', 'Q3', 'Q4'].map((quarter) => {
          const quarterInitiatives = filteredInitiatives.filter(
            i => i.quarter.includes(quarter) || (quarter === 'Q4' && i.quarter === 'Q2-Q4') || (quarter === 'Q3' && i.quarter === 'Q1-Q3')
          );

          return (
            <div
              key={quarter}
              className="rounded-xl border p-4 flex flex-col h-[320px]"
              style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}
            >
              <h3 className="text-xs font-bold border-b pb-2 mb-3 tracking-wider uppercase" style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}>
                {quarter} Execution Block
              </h3>

              <div className="flex-1 overflow-y-auto space-y-3">
                {quarterInitiatives.map(ini => (
                  <div
                    key={ini.id}
                    className="p-2.5 rounded-lg border bg-slate-950/40 space-y-2 border-slate-800"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[8px] font-bold px-1 py-0.25 rounded bg-blue-500/10 text-blue-400 font-mono">
                        {ini.id}
                      </span>
                      <span className={`text-[8px] font-semibold ${ini.status === 'Completed' ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                        {ini.status}
                      </span>
                    </div>

                    <h4 className="text-[10px] font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {ini.name}
                    </h4>

                    {/* Progress */}
                    <div className="w-full h-1 bg-slate-800 rounded-full">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${ini.progress}%` }} />
                    </div>

                    <div className="flex items-center justify-between text-[8px] text-slate-500">
                      <span>Owner: {ini.owner.split(',')[0]}</span>
                      {ini.implementationIds.length > 0 ? (
                        <button
                          onClick={() => openWorkflow('implementation', ini.implementationIds[0])}
                          className="text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                        >
                          Trace <Layers size={8} />
                        </button>
                      ) : (
                        <span>No impl project</span>
                      )}
                    </div>
                  </div>
                ))}
                {quarterInitiatives.length === 0 && (
                  <div className="h-full flex items-center justify-center text-[10px] italic text-slate-600">
                    No scheduled items
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// 4. KPI ENGINE MODULE
// ==========================================
export function KPIEnginePage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';

  const fetchMetrics = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/security/kpi-metrics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setMetrics(json.data);
          setLastUpdated(new Date());
        }
      }
    } catch (e) {
      console.error('Failed to fetch KPI metrics', e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // refresh tiap 30s
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  // Definisi KPI berdasarkan data real dari database
  const kpiCards = React.useMemo(() => {
    if (!metrics) return [];
    return [
      {
        id: 'KPI-010',
        name: 'MFA Enrollment Rate',
        description: 'Persentase user real yang mengaktifkan MFA.',
        value: metrics.mfaEnrollmentRate,
        unit: '%',
        target: 100,
        detail: `${metrics.mfaEnabledUsers} dari ${metrics.totalRealUsers} user`,
        trend: metrics.mfaEnrollmentRate >= 80 ? 'improving' : metrics.mfaEnrollmentRate >= 50 ? 'stable' : 'declining',
        color: '#10B981',
        sourceModule: 'IAM / User Database',
      },
      {
        id: 'KPI-012',
        name: 'Critical Incidents (Bulan Ini)',
        description: 'Jumlah insiden keamanan dengan severity CRITICAL bulan ini.',
        value: metrics.criticalIncidentsThisMonth,
        unit: 'incidents',
        target: 0,
        detail: `Bulan lalu: ${metrics.criticalIncidentsLastMonth}`,
        trend: metrics.incidentTrend,
        color: '#EF4444',
        sourceModule: 'Security Incidents DB',
      },
      {
        id: 'KPI-013',
        name: 'Open Incidents',
        description: 'Jumlah insiden keamanan yang masih berstatus OPEN.',
        value: metrics.openIncidents,
        unit: 'active',
        target: 2,
        detail: `${metrics.resolvedIncidentsCount} resolved bulan ini`,
        trend: metrics.openIncidents <= 2 ? 'improving' : 'declining',
        color: '#F59E0B',
        sourceModule: 'Security Incidents DB',
      },
      {
        id: 'KPI-002',
        name: 'Mean Time to Detect (MTTD)',
        description: 'Rata-rata waktu deteksi insiden (dari buat hingga aktif ditangani).',
        value: metrics.avgMttdHours,
        unit: 'hours',
        target: 4,
        detail: metrics.resolvedIncidentsCount > 0 ? `Dari ${metrics.resolvedIncidentsCount} incident resolved` : 'Belum ada incident resolved',
        trend: metrics.avgMttdHours === 0 ? 'stable' : metrics.avgMttdHours <= 4 ? 'improving' : 'declining',
        color: '#3B82F6',
        sourceModule: 'Security Incidents DB',
      },
      {
        id: 'KPI-003',
        name: 'Mean Time to Respond (MTTR)',
        description: 'Rata-rata waktu penyelesaian insiden dari awal hingga resolved.',
        value: metrics.avgMttrHours,
        unit: 'hours',
        target: 24,
        detail: metrics.resolvedIncidentsCount > 0 ? `Dari ${metrics.resolvedIncidentsCount} incident resolved` : 'Belum ada incident resolved',
        trend: metrics.avgMttrHours === 0 ? 'stable' : metrics.avgMttrHours <= 24 ? 'improving' : 'declining',
        color: '#8B5CF6',
        sourceModule: 'Security Incidents DB',
      },
      {
        id: 'KPI-009',
        name: 'Control Effectiveness',
        description: 'Efektivitas kontrol keamanan — dihitung dari inverse rata-rata risk score event.',
        value: metrics.controlEffectiveness,
        unit: '%',
        target: 85,
        detail: `Avg Risk Score: ${metrics.avgRiskScore} dari ${metrics.hasData ? 'event terbaru' : 'belum ada data'}`,
        trend: metrics.controlEffectiveness >= 80 ? 'improving' : metrics.controlEffectiveness >= 60 ? 'stable' : 'declining',
        color: '#06B6D4',
        sourceModule: 'Security Events DB',
      },
    ];
  }, [metrics]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <Gauge style={{ color: 'var(--color-accent-purple)' }} /> KPI Metric Engine
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Data real-time dari database — dihitung langsung dari aktivitas sistem
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              Updated: {lastUpdated.toLocaleTimeString('id-ID')}
            </span>
          )}
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition"
            style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            <RefreshCwIcon size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {loading && !metrics ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCwIcon size={24} className="animate-spin" style={{ color: 'var(--color-accent-purple)' }} />
        </div>
      ) : (
        <>
          {/* Info banner jika belum ada data */}
          {metrics && !metrics.hasData && (
            <div className="rounded-xl p-4 border text-sm flex items-start gap-3"
              style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
              <Activity size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--color-accent-amber)' }} />
              <div>
                <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Belum ada data real</p>
                <p className="text-xs mt-0.5">KPI akan otomatis terhitung saat user melakukan aktivitas (login, transaksi, incident terjadi, dsb). Semua nilai saat ini menunjukkan <strong>0</strong> karena belum ada data di sistem.</p>
              </div>
            </div>
          )}

          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {kpiCards.map((kpi) => {
              const hasValue = kpi.value > 0;
              // Untuk incident metrics: "lebih rendah = lebih baik"
              const isLowerBetter = kpi.id === 'KPI-012' || kpi.id === 'KPI-013' || kpi.id === 'KPI-002' || kpi.id === 'KPI-003';
              const trendColor = kpi.trend === 'improving' ? '#10B981' : kpi.trend === 'declining' ? '#EF4444' : '#F59E0B';
              const TrendIcon = kpi.trend === 'improving' ? TrendingUp : kpi.trend === 'declining' ? TrendingDown : Activity;
              const pct = isLowerBetter
                ? kpi.target > 0 ? Math.max(0, Math.min(100, (1 - kpi.value / (kpi.target * 3)) * 100)) : 0
                : Math.min(100, kpi.target > 0 ? (kpi.value / kpi.target) * 100 : 0);

              return (
                <div
                  key={kpi.id}
                  className="rounded-xl p-5 border flex flex-col justify-between"
                  style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">
                        {kpi.id}
                      </span>
                      {/* Badge trend hanya muncul jika ada data real */}
                      {hasValue && (
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1`}
                          style={{ background: `${trendColor}15`, color: trendColor }}>
                          <TrendIcon size={10} />
                          {kpi.trend}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>{kpi.name}</h3>
                    <p className="text-[10px] leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)' }}>{kpi.description}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-slate-500 text-[9px] block">Current</span>
                        <span className="text-lg font-bold font-mono" style={{ color: hasValue ? kpi.color : 'var(--color-text-muted)' }}>
                          {kpi.value}{kpi.unit === '%' ? '%' : ''} <span className="text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>{kpi.unit !== '%' ? kpi.unit : ''}</span>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 text-[9px] block">Target</span>
                        <span className="text-xs font-bold font-mono" style={{ color: 'var(--color-text-primary)' }}>
                          {kpi.id === 'KPI-012' ? '0' : kpi.target}{kpi.unit === '%' ? '%' : ' ' + kpi.unit}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar hanya jika ada data */}
                    {hasValue ? (
                      <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--color-bg-elevated)' }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: kpi.color }} />
                      </div>
                    ) : (
                      <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--color-bg-elevated)' }} />
                    )}

                    <div className="border-t pt-2 flex items-center justify-between text-[10px]" style={{ borderColor: 'var(--color-border)' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>
                        {hasValue ? kpi.detail : 'No data yet'}
                      </span>
                      <span className="text-[9px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
                        {kpi.sourceModule}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Catatan metodologi */}
          {metrics && (
            <div className="rounded-xl p-4 border text-xs" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
              <p className="font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Metodologi Perhitungan</p>
              <ul className="space-y-0.5 list-disc list-inside">
                <li><strong>MFA Enrollment</strong> — COUNT(user.mfaEnabled=true) / COUNT(total user real)</li>
                <li><strong>Critical Incidents</strong> — COUNT(SecurityIncident WHERE severity=CRITICAL, bulan ini)</li>
                <li><strong>MTTR</strong> — Rata-rata (resolvedAt - createdAt) incident resolved bulan ini</li>
                <li><strong>Control Effectiveness</strong> — 100 - rata-rata riskScore dari 100 SecurityEvent terbaru</li>
              </ul>
              <p className="mt-2">Terakhir dihitung: {metrics.calculatedAt ? new Date(metrics.calculatedAt).toLocaleString('id-ID') : '-'}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}




// ==========================================
// 5. REMAINING MODULE PLACEHOLDERS
// ==========================================

export function SecurityGovernancePage() {
  const policies = [
    {
      id: 'POL-001',
      title: 'Enterprise Information Security Policy (EISP)',
      category: 'Governance & Leadership',
      standard: 'ISO/IEC 27001 Cl. 5.1 & COBIT 2019',
      owner: 'Budi Santoso, CISSP (CISO)',
      version: 'v3.2',
      reviewDate: '2026-01-15',
      status: 'Approved & Published'
    },
    {
      id: 'POL-002',
      title: 'Identity & Access Control Policy (IAM)',
      category: 'Access Management',
      standard: 'NIST SP 800-63B & Zero Trust',
      owner: 'Hendra Wijaya (Security Lead)',
      version: 'v2.1',
      reviewDate: '2026-03-01',
      status: 'Approved & Published'
    },
    {
      id: 'POL-003',
      title: 'Data Classification & Encryption Standard',
      category: 'Data Privacy & Protection',
      standard: 'UU PDP No. 27/2022 & POJK 10/2022',
      owner: 'Fajar Hidayat, CISA (DPO)',
      version: 'v2.0',
      reviewDate: '2026-02-10',
      status: 'Approved & Published'
    },
    {
      id: 'POL-004',
      title: 'Secure SDLC & DevSecOps Framework',
      category: 'Software Engineering',
      standard: 'OWASP SAMM & DevSecOps Standards',
      owner: 'Sari Maharani (Head of Dev)',
      version: 'v1.4',
      reviewDate: '2026-04-12',
      status: 'Approved & Published'
    },
    {
      id: 'POL-005',
      title: 'Incident Response & Business Continuity Plan (BCP)',
      category: 'Security Operations',
      standard: 'ISO 22301 & NIST SP 800-61',
      owner: 'Dewi Anggraeni (SOC Lead)',
      version: 'v2.5',
      reviewDate: '2026-05-20',
      status: 'Approved & Published'
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner / Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <FileCheck style={{ color: '#8B5CF6' }} /> Security Governance & Policy Library
          </h1>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Policy Lifecycle — ISO 27001, NIST CSF 2.0, COBIT 2019 & UU PDP Standards
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border bg-slate-900/60 border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Total Active Policies</span>
          <div className="text-2xl font-bold text-purple-400">18 Master Policies</div>
          <span className="text-[10px] text-slate-500">100% Steering Approved</span>
        </div>
        <div className="p-4 rounded-xl border bg-slate-900/60 border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Annual Review Rate</span>
          <div className="text-2xl font-bold text-emerald-400">100% Up to Date</div>
          <span className="text-[10px] text-slate-500">Audited Q2 2026</span>
        </div>
        <div className="p-4 rounded-xl border bg-slate-900/60 border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Primary Framework</span>
          <div className="text-2xl font-bold text-blue-400">ISO/IEC 27001</div>
          <span className="text-[10px] text-slate-500">NIST CSF 2.0 & COBIT Aligned</span>
        </div>
        <div className="p-4 rounded-xl border bg-slate-900/60 border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Governance Steering</span>
          <div className="text-2xl font-bold text-emerald-400">ACTIVE</div>
          <span className="text-[10px] text-slate-500">Monthly Board Review</span>
        </div>
      </div>

      {/* Policy Library Table */}
      <div className="rounded-xl border p-5 bg-slate-900/40 border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200">Kebijakan & Standar Keamanan Informasi Terpublikasi</h2>
          <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
            All 18 Policies Enforcement Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Policy ID</th>
                <th className="p-3">Nama Kebijakan & Dokumen</th>
                <th className="p-3">Kategori</th>
                <th className="p-3">Standar Regulasi Ref.</th>
                <th className="p-3">Pemilik Kebijakan (Owner)</th>
                <th className="p-3">Versi</th>
                <th className="p-3">Status Approved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {policies.map((pol) => (
                <tr key={pol.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3 font-mono text-[11px] text-purple-400 font-bold">{pol.id}</td>
                  <td className="p-3 font-semibold text-slate-100">{pol.title}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[10px] font-semibold border border-blue-500/20">
                      {pol.category}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">{pol.standard}</td>
                  <td className="p-3 text-slate-300">{pol.owner}</td>
                  <td className="p-3 font-mono text-[11px] text-slate-400">{pol.version}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                      ✓ {pol.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RACI Governance Structure */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border bg-slate-900/60 border-slate-800 space-y-2">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">🏛️ Struktur Komite Tata Kelola (Security Steering Committee)</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Dipimpin oleh Chief Information Security Officer (CISO) bersama Direksi, Tim Hukum, Risk Manager, dan Engineering Lead untuk memastikan seluruh strategi keamanan siber 3-Tahun selaras dengan tujuan ekspansi bisnis SatuNusa.
          </p>
        </div>
        <div className="p-4 rounded-xl border bg-slate-900/60 border-slate-800 space-y-2">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">📋 RACI Matrix & Akuntabilitas Tata Kelola</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Menetapkan secara tegas siapa yang <strong>Responsible (R)</strong>, <strong>Accountable (A)</strong>, <strong>Consulted (C)</strong>, dan <strong>Informed (I)</strong> untuk setiap kebijakan keamanan. Menghilangkan keraguan tanggung jawab antar divisi.
          </p>
        </div>
      </div>
    </div>
  );
}

export function VulnerabilityManagementPage() {
  const { data: { vulnerabilities = [] } } = useGovernance();
  const { openWorkflow } = useWorkflow();

  const stats = useMemo(() => {
    const total = vulnerabilities.length;
    const critical = vulnerabilities.filter(v => v.severity === 'Critical' && v.status === 'Open').length;
    const high = vulnerabilities.filter(v => v.severity === 'High' && v.status === 'Open').length;
    const remediated = vulnerabilities.filter(v => v.status === 'Remediated').length;
    return { total, critical, high, remediated };
  }, [vulnerabilities]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <Bug style={{ color: '#EA580C' }} /> Vulnerability Management
          </h1>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Scanner Results, CVSS Scoring, Remediation & SLA Tracking
          </p>
        </div>
        <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(234, 88, 12, 0.1)', color: '#EA580C' }}>
          <RefreshCwIcon size={12} /> Scan Now
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border p-4 flex flex-col items-center justify-center" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
          <ShieldAlert size={20} className="mb-2 text-red-500" />
          <span className="text-2xl font-bold text-red-500">{stats.critical}</span>
          <span className="text-[10px] text-slate-400 font-semibold mt-1">CRITICAL OPEN</span>
        </div>
        <div className="rounded-xl border p-4 flex flex-col items-center justify-center" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
          <AlertTriangle size={20} className="mb-2 text-orange-500" />
          <span className="text-2xl font-bold text-orange-500">{stats.high}</span>
          <span className="text-[10px] text-slate-400 font-semibold mt-1">HIGH OPEN</span>
        </div>
        <div className="rounded-xl border p-4 flex flex-col items-center justify-center" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
          <CheckCircle size={20} className="mb-2 text-emerald-500" />
          <span className="text-2xl font-bold text-emerald-500">{stats.remediated}</span>
          <span className="text-[10px] text-slate-400 font-semibold mt-1">REMEDIATED</span>
        </div>
        <div className="rounded-xl border p-4 flex flex-col items-center justify-center" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
          <Activity size={20} className="mb-2 text-blue-500" />
          <span className="text-2xl font-bold text-blue-500">{stats.total}</span>
          <span className="text-[10px] text-slate-400 font-semibold mt-1">TOTAL SCANNED</span>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Scanner Results</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-[10px] uppercase tracking-wider" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                <th className="p-3 font-semibold">ID</th>
                <th className="p-3 font-semibold">Vulnerability</th>
                <th className="p-3 font-semibold">Severity / CVSS</th>
                <th className="p-3 font-semibold">Asset</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {vulnerabilities.map((v) => (
                <tr key={v.id} className="border-b last:border-0 hover:bg-slate-900/30 transition-colors" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="p-3 text-xs font-mono font-medium text-slate-400">{v.id}</td>
                  <td className="p-3">
                    <div className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{v.title}</div>
                    <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{v.description.substring(0, 60)}...</div>
                  </td>
                  <td className="p-3 text-xs">
                    <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                      v.severity === 'Critical' ? 'bg-red-500/10 text-red-400' :
                      v.severity === 'High' ? 'bg-orange-500/10 text-orange-400' :
                      v.severity === 'Medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-500/10 text-slate-400'
                    }`}>
                      {v.severity} ({v.cvssScore})
                    </span>
                  </td>
                  <td className="p-3 text-[10px] text-slate-300 font-mono">{v.affectedAssetId}</td>
                  <td className="p-3 text-[10px] font-semibold">
                    <span className={v.status === 'Remediated' ? 'text-emerald-400' : v.status === 'Open' ? 'text-red-400' : 'text-blue-400'}>
                      {v.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => openWorkflow('vulnerability', v.id)} className="text-xs font-medium text-blue-400 hover:underline">
                      Details
                    </button>
                  </td>
                </tr>
              ))}
              {vulnerabilities.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-xs text-slate-500 italic">No vulnerabilities found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function IncidentManagementPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedIncidentDetail, setSelectedIncidentDetail] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  React.useEffect(() => {
    let active = true;
    const fetchIncidents = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/security/incidents?page=${page}&limit=10`);
        if (res.ok) {
          const json = await res.json();
          if (active && json.success) {
            setIncidents(json.data);
            setTotalPages(json.meta?.pagination?.totalPages || 1);
          }
        }
      } catch (err) {
        console.error('Failed to fetch incidents', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 10000);
    return () => { active = false; clearInterval(interval); };
  }, [page, refreshTrigger]);

  React.useEffect(() => {
    if (!selectedIncidentId) {
      setSelectedIncidentDetail(null);
      return;
    }
    const incident = incidents.find(i => i.id === selectedIncidentId);
    if (incident) setSelectedIncidentDetail(incident);
  }, [selectedIncidentId, incidents]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter(i =>
      i.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.id?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [incidents, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <AlertTriangle size={28} className="text-red-500" />
            Security Incident Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Incident Lifecycle — Detection to Post-Incident Review
          </p>
        </div>
        <button
          onClick={() => setRefreshTrigger(prev => prev + 1)}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs px-3 py-2 rounded-lg border border-slate-700 transition"
        >
          <RefreshCwIcon size={14} className={loading ? "animate-spin" : ""} />
          Refresh Data
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center gap-4">
          <span className="font-bold text-white text-sm">Active Incidents</span>
          <div className="relative max-w-xs w-full">
            <SearchIcon size={14} className="absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search title, ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 text-slate-200 text-xs pl-9 pr-4 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider bg-slate-950">
                <th className="p-3">Incident ID & Title</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Status</th>
                <th className="p-3">Reporter</th>
                <th className="p-3">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {filteredIncidents.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-slate-500">No Incidents Found</td></tr>
              ) : (
                filteredIncidents.map(inc => (
                  <tr
                    key={inc.id}
                    onClick={() => setSelectedIncidentId(inc.id)}
                    className={`hover:bg-slate-800/40 cursor-pointer transition ${selectedIncidentId === inc.id ? 'bg-red-500/5 border-l-2 border-l-red-500' : ''}`}
                  >
                    <td className="p-3">
                      <p className="font-bold text-slate-200">{inc.title || 'Unknown Incident'}</p>
                      <p className="text-slate-500 text-[10px] mt-0.5 font-mono">{inc.id}</p>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${inc.severity?.toUpperCase() === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                          inc.severity?.toUpperCase() === 'HIGH' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                            inc.severity?.toUpperCase() === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                              'bg-green-500/10 text-green-500 border border-green-500/20'
                        }`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] uppercase font-semibold">
                        {inc.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{inc.reporterId || 'System'}</td>
                    <td className="p-3 text-slate-400">{new Date(inc.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-slate-400">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {selectedIncidentDetail && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl relative animate-scale-in mt-6">
          <button
            onClick={() => setSelectedIncidentId(null)}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition"
          >
            <XIcon size={18} />
          </button>

          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
            <AlertTriangle size={20} className="text-red-500" />
            Incident Details: {selectedIncidentDetail.title}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 text-sm text-slate-300">
              <p><strong>ID:</strong> <span className="font-mono">{selectedIncidentDetail.id}</span></p>
              <p><strong>Description:</strong> {selectedIncidentDetail.description}</p>
              <p><strong>Incident Type:</strong> {selectedIncidentDetail.incidentType}</p>
              <p><strong>Reporter:</strong> {selectedIncidentDetail.reporterId || 'System'}</p>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">Metrics & Timestamps</p>
              <p className="text-xs text-slate-400 mb-1">Created: {new Date(selectedIncidentDetail.createdAt).toLocaleString()}</p>
              <p className="text-xs text-slate-400">Updated: {new Date(selectedIncidentDetail.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AssetManagementPage() {
  return <ModulePlaceholder title="Security Asset Management" subtitle="CMDB — Servers, Databases, APIs, Applications & Devices"
    icon={<Server size={24} color="#06B6D4" />}
    features={['Asset Inventory', 'Asset Detail View', 'Asset Topology', 'Criticality Assessment', 'Asset Lifecycle', 'Classification Matrix']} />;
}

export function DataProtectionPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);

  const dataInventory = [
    {
      id: 'DP-001',
      name: 'Foto KTP & Data NIK Nasabah',
      category: 'Customer PII (Restricted)',
      storage: 'Amazon S3 + Cloud Storage',
      atRest: 'AES-256 (KMS Managed)',
      inTransit: 'TLS 1.3 (HTTPS)',
      status: 'Protected',
      compliance: 'UU PDP Pasal 20-22',
      kmsKeyId: 'arn:aws:kms:ap-southeast-3:1234567890:key/ktp-enc-v2',
      lastRotation: '2026-06-15',
      recordsCount: '5,240,118 records',
      vaultRegion: 'ap-southeast-3 (Jakarta)'
    },
    {
      id: 'DP-002',
      name: 'Foto Selfie & Verifikasi Wajah',
      category: 'Biometric PII (Restricted)',
      storage: 'Encrypted S3 Bucket',
      atRest: 'AES-256 (Encrypted)',
      inTransit: 'TLS 1.3 (HTTPS)',
      status: 'Protected',
      compliance: 'UU PDP & OJK Reg',
      kmsKeyId: 'arn:aws:kms:ap-southeast-3:1234567890:key/face-bio-v1',
      lastRotation: '2026-07-01',
      recordsCount: '5,180,940 records',
      vaultRegion: 'ap-southeast-3 (Jakarta)'
    },
    {
      id: 'DP-003',
      name: 'Catatan Transaksi & Pinjaman',
      category: 'Financial Data (Confidential)',
      storage: 'PostgreSQL DB (Jakarta DC)',
      atRest: 'AES-256 (Column Encryption)',
      inTransit: 'mTLS 1.3',
      status: 'Protected',
      compliance: 'POJK 10/2022',
      kmsKeyId: 'kms-pg-column-tx-secret',
      lastRotation: '2026-05-20',
      recordsCount: '18,920,400 rows',
      vaultRegion: 'On-Premise + AWS RDS'
    },
    {
      id: 'DP-004',
      name: 'Database Nasabah BPR Akuisisi',
      category: 'Legacy Banking Data',
      storage: 'Migrated Cloud Vault',
      atRest: 'AES-256 (Post-Migration)',
      inTransit: 'TLS 1.3',
      status: 'Protected',
      compliance: 'BI & UU PDP',
      kmsKeyId: 'kms-bpr-legacy-vault-key',
      lastRotation: '2026-07-10',
      recordsCount: '142,500 accounts',
      vaultRegion: 'ap-southeast-3 (Jakarta)'
    },
    {
      id: 'DP-005',
      name: 'Kunci API & Secret Server',
      category: 'Application Credentials',
      storage: 'HashiCorp Vault / KMS',
      atRest: 'AES-256 (Secret Store)',
      inTransit: 'gRPC / TLS 1.3',
      status: 'Protected',
      compliance: 'ISO 27001',
      kmsKeyId: 'vault-master-root-key-v4',
      lastRotation: '2026-07-28',
      recordsCount: '84 active secrets',
      vaultRegion: 'Multi-Cloud Vault Cluster'
    }
  ];

  const filteredInventory = useMemo(() => {
    return dataInventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.compliance.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'ALL' || item.category.includes(selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRotateKey = async (asset: any) => {
    setIsRotating(true);
    await new Promise(r => setTimeout(r, 1200));
    setIsRotating(false);
    triggerToast(`Rotasi Kunci KMS Berhasil untuk ${asset.name}! Kunci baru telah di-generate & aktif.`);
  };

  const handleRunAudit = async (asset: any) => {
    triggerToast(`Audit Enkripsi Berjalan: ${asset.name} terverifikasi 100% utuh & memenuhi ${asset.compliance}.`);
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white border border-emerald-500/40 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up text-xs">
          <CheckCircle size={18} className="text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <Database style={{ color: '#8B5CF6' }} /> Data Protection & Encryption Center
          </h1>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Privacy & Data Security — UU PDP Compliance Engine & Encryption Audit
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => triggerToast('Audit Enkripsi Global Selesai: 5 dari 5 Storage Vaults Terenkripsi Sempurna (AES-256).')}
            className="px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold hover:bg-purple-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Activity size={14} /> Run Global Encryption Audit
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border bg-slate-900/60 border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Encryption Coverage</span>
          <div className="text-2xl font-bold text-emerald-400">99.7%</div>
          <span className="text-[10px] text-slate-500">Data at Rest & Transit</span>
        </div>
        <div className="p-4 rounded-xl border bg-slate-900/60 border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Storage Algorithm</span>
          <div className="text-2xl font-bold text-blue-400">AES-256</div>
          <span className="text-[10px] text-slate-500">Hardware Security Module (HSM)</span>
        </div>
        <div className="p-4 rounded-xl border bg-slate-900/60 border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Transit Protocol</span>
          <div className="text-2xl font-bold text-purple-400">TLS 1.3</div>
          <span className="text-[10px] text-slate-500">Strict Transport Security (HSTS)</span>
        </div>
        <div className="p-4 rounded-xl border bg-slate-900/60 border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">UU PDP Status</span>
          <div className="text-2xl font-bold text-emerald-400">COMPLIANT</div>
          <span className="text-[10px] text-slate-500">UU No. 27/2022 Aligned</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border bg-slate-900/40 border-slate-800">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="Cari aset data, ID (e.g. DP-001), atau regulasi..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg border bg-slate-950/60 border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Klasifikasi:</span>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border bg-slate-950/60 border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="ALL">Semua Klasifikasi</option>
            <option value="Customer PII">Customer PII</option>
            <option value="Biometric PII">Biometric PII</option>
            <option value="Financial Data">Financial Data</option>
            <option value="Legacy Banking Data">Legacy Banking Data</option>
            <option value="Application Credentials">Application Credentials</option>
          </select>
        </div>
      </div>

      {/* Encryption Table */}
      <div className="rounded-xl border p-5 bg-slate-900/40 border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200">Data Asset Encryption Inventory</h2>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
            {filteredInventory.length}/5 Storage Vaults Filtered
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Asset ID</th>
                <th className="p-3">Nama Data / Aset</th>
                <th className="p-3">Klasifikasi Data</th>
                <th className="p-3">Enkripsi Penyimpanan (At Rest)</th>
                <th className="p-3">Enkripsi Pengiriman (In Transit)</th>
                <th className="p-3">Standar Regulasi</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Aksi Interaktif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredInventory.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedAsset(item)}
                  className="hover:bg-purple-950/20 transition-colors cursor-pointer group"
                >
                  <td className="p-3 font-mono text-[11px] text-purple-400 font-bold group-hover:underline">{item.id}</td>
                  <td className="p-3 font-semibold text-slate-100">{item.name}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 text-[10px] font-semibold border border-purple-500/20">
                      {item.category}
                    </span>
                  </td>
                  <td className="p-3 text-emerald-400 font-medium">🔒 {item.atRest}</td>
                  <td className="p-3 text-blue-400 font-medium">🌐 {item.inTransit}</td>
                  <td className="p-3 text-slate-400">{item.compliance}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                      ✓ {item.status}
                    </span>
                  </td>
                  <td className="p-3 text-right" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedAsset(item)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 text-[11px] font-semibold transition cursor-pointer"
                    >
                      Detail & Audit →
                    </button>
                  </td>
                </tr>
              ))}
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500 italic">
                    Tidak ada aset data yang sesuai dengan pencarian
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Technical Standards Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border bg-slate-900/60 border-slate-800 space-y-2">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">🔒 Enkripsi Data Tersimpan (Data at Rest)</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Foto KTP dan selfie nasabah dienkripsi pada tingkat blok (Block-level AES-256) sebelum ditulis ke penyimpanan cloud. Kunci enkripsi dikelola secara terpusat via Key Management Service (KMS) dengan rotasi otomatis tiap 90 hari.
          </p>
        </div>
        <div className="p-4 rounded-xl border bg-slate-900/60 border-slate-800 space-y-2">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">🌐 Enkripsi Pengiriman (Data in Transit)</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Seluruh jalur komunikasi REST API antara aplikasi web nasabah dan server backend dilindungi oleh TLS 1.3 dengan cipher suite modern (ECDHE-RSA-AES128-GCM-SHA256). Mencegah serangan Eavesdropping & Man-in-the-Middle.
          </p>
        </div>
      </div>

      {/* Asset Detail Interactive Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedAsset(null)}>
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-purple-400 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                  {selectedAsset.id}
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-1">{selectedAsset.name}</h3>
                <p className="text-xs text-slate-400">{selectedAsset.category}</p>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Storage Location</span>
                <p className="font-semibold text-slate-200">{selectedAsset.storage}</p>
                <span className="text-[10px] text-purple-400 block">{selectedAsset.vaultRegion}</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Regulasi</span>
                <p className="font-semibold text-slate-200">{selectedAsset.compliance}</p>
                <span className="text-[10px] text-emerald-400 block">✓ Status: {selectedAsset.status}</span>
              </div>

              <div className="col-span-2 p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">KMS Key Identifer (ARN)</span>
                <p className="font-mono text-[11px] text-blue-300 break-all">{selectedAsset.kmsKeyId}</p>
                <span className="text-[10px] text-slate-400 block">Rotasi Terakhir: {selectedAsset.lastRotation}</span>
              </div>
            </div>

            {/* Action buttons inside modal */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                onClick={() => handleRunAudit(selectedAsset)}
                className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
              >
                🔍 Audit Enkripsi Aset
              </button>

              <button
                onClick={() => handleRotateKey(selectedAsset)}
                disabled={isRotating}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer"
              >
                {isRotating ? (
                  <>
                    <Activity size={14} className="animate-spin" /> Meng-rotate Kunci...
                  </>
                ) : (
                  <>
                    🔄 Rotasi Kunci KMS Sekarang
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import {
  Search as SearchIcon,
  Monitor as MonitorIcon,
  Smartphone as SmartphoneIcon,
  ShieldCheck as ShieldCheckIcon,
  X as XIcon,
  Key as KeyRoundIcon,
  Clock as ClockIcon,
  Ban as BanIcon,
  Trash2 as TrashIcon,
} from 'lucide-react';


export function IAMPage() {
  const [users, setUsers] = React.useState<any[]>([]);
  const [events, setEvents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = React.useState<any | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [retryInterval, setRetryInterval] = React.useState(5000);

  // Fetch users and events
  React.useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const usersRes = await fetch(`/api/v1/security/users?page=${page}&limit=10`);
        if (usersRes.ok) {
          const usersJson = await usersRes.json();
          if (active && usersJson.success) {
            setUsers(usersJson.data);
            setTotalPages(usersJson.meta?.pagination?.totalPages || 1);
            setRetryInterval(5000);
          }
        }

        const eventsRes = await fetch('/api/v1/security/events?limit=50');
        if (eventsRes.ok) {
          const eventsJson = await eventsRes.json();
          if (active && eventsJson.success) setEvents(eventsJson.data);
        }
      } catch (err) {
        console.error('Failed to fetch IAM data', err);
        setRetryInterval(prev => Math.min(prev * 2, 60000));
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, retryInterval);
    return () => { active = false; clearInterval(interval); };
  }, [refreshTrigger, page, retryInterval]);

  // Fetch individual user investigation details
  React.useEffect(() => {
    if (!selectedUserId) {
      setSelectedUserDetail(null);
      return;
    }
    const fetchUserDetail = async () => {
      try {
        const res = await fetch(`/api/v1/security/investigation/user/${selectedUserId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) setSelectedUserDetail(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch user details', err);
      }
    };
    fetchUserDetail();
  }, [selectedUserId, refreshTrigger]);

  // Action: Block User
  const handleBlockUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/v1/security/block-user/${userId}`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        alert('Status akun pengguna berhasil diperbarui!');
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Action: Reset Sessions
  const handleResetSessions = async (userId: string) => {
    try {
      const res = await fetch(`/api/v1/security/reset-session/${userId}`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        alert('Semua sesi aktif pengguna berhasil dicabut!');
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered User Directory
  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  // Compute Auth Analytics
  const analytics = useMemo(() => {
    const totalLogins = events.filter(e => e.description.toLowerCase().includes('login') || e.description.toLowerCase().includes('pin')).length;
    const failedLogins = events.filter(e => e.description.toLowerCase().includes('failed') || e.description.toLowerCase().includes('wrong') || e.description.toLowerCase().includes('invalid')).length;
    const successRate = totalLogins > 0 ? Math.round(((totalLogins - failedLogins) / totalLogins) * 100) : 100;

    const lockedAccounts = users.filter(u => u.status === 'LOCKED').length;

    const newDevices = events.filter(e => e.description.toLowerCase().includes('new device') || e.description.toLowerCase().includes('registered')).length;

    const otpSuccess = events.filter(e => e.description.toLowerCase().includes('otp verified')).length;
    const otpTotal = events.filter(e => e.description.toLowerCase().includes('otp')).length;
    const otpRate = otpTotal > 0 ? Math.round((otpSuccess / otpTotal) * 100) : 100;

    return {
      totalLogins,
      successRate,
      lockedAccounts,
      newDevices,
      otpRate
    };
  }, [users, events]);

  return (
    <div className="space-y-6">
      {/* 1. Module Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <UserCog size={28} className="text-blue-500" />
            Identity & Access Management Console
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time User directory, persistent sessions tracker, device registry, and authentication analytics.
          </p>
        </div>
        <button
          onClick={() => setRefreshTrigger(prev => prev + 1)}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs px-3 py-2 rounded-lg border border-slate-700 transition"
        >
          <RefreshCwIcon size={14} className={loading ? "animate-spin" : ""} />
          Refresh Data
        </button>
      </div>

      {/* 2. Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Logins Today</p>
          <p className="text-2xl font-black text-white mt-1">{analytics.totalLogins}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Login Success Rate</p>
          <p className="text-2xl font-black text-green-400 mt-1">{analytics.successRate}%</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Locked Accounts</p>
          <p className="text-2xl font-black text-red-500 mt-1">{analytics.lockedAccounts}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">New Recognized Devices</p>
          <p className="text-2xl font-black text-blue-400 mt-1">{analytics.newDevices}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">OTP Success Rate</p>
          <p className="text-2xl font-black text-purple-400 mt-1">{analytics.otpRate}%</p>
        </div>
      </div>

      {/* 3. Main Console Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">

        {/* Left Side: User Directory (60% width) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center gap-4">
            <span className="font-bold text-white text-sm">User Directory</span>
            <div className="relative max-w-xs w-full">
              <SearchIcon size={14} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search name, email, ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 text-slate-200 text-xs pl-9 pr-4 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider bg-slate-950">
                  <th className="p-3">User Details</th>
                  <th className="p-3">Role</th>
                  <th className="p-3 text-center">Risk Score</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {filteredUsers.map(u => (
                  <tr
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className={`hover:bg-slate-800/40 cursor-pointer transition ${selectedUserId === u.id ? 'bg-blue-500/5 border-l-2 border-l-blue-500' : ''}`}
                  >
                    <td className="p-3">
                      <p className="font-bold text-slate-200">{u.name}</p>
                      <p className="text-slate-500 text-[10px] mt-0.5">{u.email}</p>
                    </td>
                    <td className="p-3 text-slate-400 font-medium uppercase tracking-wider">{u.role === 'customer_role' ? 'Customer' : u.role}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${u.riskScore >= 75 ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                          u.riskScore >= 50 ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                            u.riskScore >= 25 ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                              'bg-green-500/10 text-green-500 border border-green-500/20'
                        }`}>
                        {u.riskScore} ({u.riskLevel})
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${u.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' :
                          u.status === 'LOCKED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            'bg-slate-500/10 text-slate-400'
                        }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleBlockUser(u.id)}
                          title={u.status === 'LOCKED' ? 'Unlock Account' : 'Lock Account'}
                          className={`p-1.5 rounded transition ${u.status === 'LOCKED'
                              ? 'bg-green-500/10 hover:bg-green-500/20 text-green-500'
                              : 'bg-red-500/10 hover:bg-red-500/20 text-red-500'
                            }`}
                        >
                          <BanIcon size={13} />
                        </button>
                        <button
                          onClick={() => handleResetSessions(u.id)}
                          title="Force Reset Sessions (Logout)"
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        >
                          <TrashIcon size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-slate-400">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Live Session Monitor (40% width) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col max-h-[500px]">
          <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
            <span className="font-bold text-white text-sm">Security Events (Live Monitor)</span>
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
          </div>

          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            {events.slice(0, 10).map((evt, i) => (
              <div key={i} className="flex gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className={`p-2 rounded-lg flex-shrink-0 ${evt.severity === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    evt.severity === 'Medium' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                      'bg-slate-800 text-slate-400'
                  }`}>
                  <ShieldAlert size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">{evt.category}</p>
                    <p className="text-[10px] text-slate-500">{new Date(evt.createdAt).toLocaleTimeString()}</p>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 truncate">{evt.description}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[9px] font-semibold bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded uppercase">{evt.sourceModule}</span>
                    {evt.riskScore > 0 && (
                      <span className="text-[9px] font-bold bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded">Risk +{evt.riskScore}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. Drawer: User Investigation Console */}
      {selectedUserDetail && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl relative animate-scale-in">
          <button
            onClick={() => setSelectedUserId(null)}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition"
          >
            <XIcon size={18} />
          </button>

          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Activity size={20} className="text-blue-500" />
            Security Investigation Profile: {selectedUserDetail.profile.fullName}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">

            {/* Column A: Profile Details */}
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Account Information</p>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-slate-500">User ID:</span><span className="text-slate-300 font-mono">{selectedUserDetail.profile.id}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Email:</span><span className="text-slate-300">{selectedUserDetail.profile.email}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Telepon:</span><span className="text-slate-300">{selectedUserDetail.profile.phoneNumber}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">KYC Status:</span><span className="text-slate-300 uppercase font-semibold">{selectedUserDetail.profile.kycStatus}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Dibuat Pada:</span><span className="text-slate-300">{new Date(selectedUserDetail.profile.createdAt).toLocaleDateString()}</span></div>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Administrative Overrides</p>
                <div className="mt-4 flex flex-col gap-2">
                  <button
                    onClick={() => handleBlockUser(selectedUserDetail.profile.id)}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${selectedUserDetail.profile.accountStatus === 'LOCKED'
                        ? 'bg-green-600 hover:bg-green-500 text-white'
                        : 'bg-red-600 hover:bg-red-500 text-white'
                      }`}
                  >
                    <BanIcon size={14} />
                    {selectedUserDetail.profile.accountStatus === 'LOCKED' ? 'Buka Kunci Akun' : 'Kunci Akun Pengguna'}
                  </button>
                  <button
                    onClick={() => handleResetSessions(selectedUserDetail.profile.id)}
                    className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <TrashIcon size={14} />
                    Cabut Seluruh Sesi Aktif
                  </button>
                </div>
              </div>
            </div>

            {/* Column B: Active Sessions & Trusted Devices */}
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Active Sessions</p>
                <div className="mt-3 space-y-3 max-h-[160px] overflow-y-auto pr-1">
                  {selectedUserDetail.sessions && selectedUserDetail.sessions.length > 0 ? (
                    selectedUserDetail.sessions.map((s: any) => (
                      <div key={s.id} className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5">
                            {s.os?.toLowerCase().includes('windows') || s.os?.toLowerCase().includes('mac') ? <MonitorIcon size={12} className="text-slate-400" /> : <SmartphoneIcon size={12} className="text-slate-400" />}
                            <span className="font-bold text-slate-200">{s.os} ({s.browser})</span>
                          </div>
                          <p className="text-slate-500 text-[10px] mt-0.5">IP: {s.ipAddress} • {s.isTrusted ? 'Trusted' : 'Temp'}</p>
                          <p className="text-[9px] text-slate-400 mt-1">Status: <span className="text-green-400 font-semibold">{s.status || 'ACTIVE'}</span></p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">{new Date(s.lastActivity).toLocaleTimeString()}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">Tidak ada sesi aktif.</p>
                  )}
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Registered & Trusted Devices</p>
                <div className="mt-3 space-y-3 max-h-[160px] overflow-y-auto pr-1">
                  {selectedUserDetail.devices && selectedUserDetail.devices.length > 0 ? (
                    selectedUserDetail.devices.map((d: any) => (
                      <div key={d.id} className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <SmartphoneIcon size={12} className="text-slate-400" />
                            <span className="font-bold text-slate-200">{d.os} ({d.browser})</span>
                          </div>
                          <p className="text-slate-500 text-[10px] mt-0.5">ID: {d.deviceId}</p>
                          <p className="text-slate-500 text-[10px]">Location: {d.location}</p>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${d.isTrusted ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                          }`}>
                          {d.isTrusted ? 'Trusted' : 'Untrusted'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">Tidak ada perangkat terdaftar.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Column C: Session Timeline Trace */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col">
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-4">Session Timeline Trace</p>
              <div className="flex-1 overflow-y-auto max-h-[320px] pr-1 space-y-4">
                {selectedUserDetail.securityEvents && selectedUserDetail.securityEvents.length > 0 ? (
                  <div className="relative border-l-2 border-slate-800 ml-3 space-y-4">
                    {selectedUserDetail.securityEvents.map((evt: any, i: number) => (
                      <div key={i} className="relative pl-5">
                        <div className={`absolute -left-[6px] top-1 w-2.5 h-2.5 rounded-full border border-slate-950 ${evt.category.toLowerCase().includes('risk') ? 'bg-red-500' :
                            evt.category.toLowerCase().includes('device') ? 'bg-purple-500' :
                              'bg-blue-500'
                          }`} />
                        <span className="text-[10px] text-slate-500 font-mono block">{new Date(evt.createdAt).toLocaleTimeString()}</span>
                        <span className="text-xs font-bold text-slate-200 block mt-0.5">{evt.category}</span>
                        <span className="text-[11px] text-slate-400 block mt-0.5 leading-relaxed">{evt.description}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Tidak ada riwayat aktivitas session timeline.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export function SecurityAwarenessPage() {
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'programs' | 'phishing' | 'departments'>('programs');

  const trainingModules = [
    {
      id: 'TR-01',
      title: 'UU PDP & Perlindungan Data Pribadi Nasabah',
      target: 'Wajib untuk 100% Karyawan Non-IT & CS',
      completion: 94,
      duration: '45 Menit',
      status: 'Mandatory',
      badge: 'UU PDP Rule',
      icon: '🛡️'
    },
    {
      id: 'TR-02',
      title: 'Deteksi Phishing & Social Engineering',
      target: '70% Karyawan Non-IT & Operations',
      completion: 88,
      duration: '30 Menit',
      status: 'Active',
      badge: 'Anti-Phishing',
      icon: '🎣'
    },
    {
      id: 'TR-03',
      title: 'Kebijakan Kunci API & Sandi Rahasia',
      target: 'DevOps, Engineering & Product Team',
      completion: 91,
      duration: '60 Menit',
      status: 'Active',
      badge: 'DevSecOps',
      icon: '🔑'
    },
    {
      id: 'TR-04',
      title: 'Keamanan Transaksi QRIS Lintas Negara',
      target: 'Tim Finance, Merchant & Customer Service',
      completion: 84,
      duration: '40 Menit',
      status: 'Active',
      badge: 'QRIS & BI',
      icon: '🌐'
    }
  ];

  const departmentData = [
    { name: 'Customer Support & Operations', nonItPct: '85%', enrolled: 450, completion: '92%', clickRate: '4.2%', risk: 'LOW' },
    { name: 'Marketing & User Acquisition', nonItPct: '90%', enrolled: 320, completion: '86%', clickRate: '5.1%', risk: 'MEDIUM' },
    { name: 'Finance & BPR Operations', nonItPct: '75%', enrolled: 280, completion: '95%', clickRate: '2.8%', risk: 'LOW' },
    { name: 'Software Engineering & IT', nonItPct: '5%', enrolled: 200, completion: '98%', clickRate: '1.0%', risk: 'SAFE' }
  ];

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleQuizSubmit = (answerIndex: number) => {
    setSelectedQuizAnswer(answerIndex);
    setQuizSubmitted(true);
    if (answerIndex === 1) {
      triggerToast('Jawaban Benar! 🎉 Anda memahami prosedur pelaporan insiden phishing sesuai standar CISO.');
    } else {
      triggerToast('Jawaban Kurang Tepat. Email mencurigakan harus dilaporkan ke CISO, bukan diklik/dibalas.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white border border-emerald-500/40 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up text-xs">
          <CheckCircle size={18} className="text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <GraduationCap style={{ color: '#10B981' }} /> Security Awareness & Culture Center
          </h1>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Edukasi Keamanan & Simulasi Phishing — Membangun Budaya Siber untuk 70% Karyawan Non-IT PinjamAJA
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQuizModal(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg cursor-pointer"
          >
            🧪 Jalankan Simulasi Quiz Karyawan
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border bg-slate-900/60 border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Audience Non-IT Enrolled</span>
          <div className="text-2xl font-bold text-emerald-400">1,250 Staff</div>
          <span className="text-[10px] text-slate-500">70% Total Tenaga Kerja PinjamAJA</span>
        </div>
        <div className="p-4 rounded-xl border bg-slate-900/60 border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">UU PDP Training Completion</span>
          <div className="text-2xl font-bold text-blue-400">89.4%</div>
          <span className="text-[10px] text-slate-500">Mandatory Course Completed</span>
        </div>
        <div className="p-4 rounded-xl border bg-slate-900/60 border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Phishing Simulation Click-Rate</span>
          <div className="text-2xl font-bold text-amber-400">3.8%</div>
          <span className="text-[10px] text-slate-500">Sangat Rendah (Target &lt; 5%)</span>
        </div>
        <div className="p-4 rounded-xl border bg-slate-900/60 border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Security Culture Index</span>
          <div className="text-2xl font-bold text-purple-400">82 / 100</div>
          <span className="text-[10px] text-slate-500">Kategori: Mature & Resilient</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('programs')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'programs' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          📚 Modul Pelatihan Keamanan (4)
        </button>
        <button
          onClick={() => setActiveTab('phishing')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'phishing' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🎣 Kampanye Simulasi Phishing Real-Time
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'departments' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🏢 Statistik per Departemen (Non-IT)
        </button>
      </div>

      {/* Tab Content 1: Training Programs */}
      {activeTab === 'programs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trainingModules.map((mod) => (
            <div key={mod.id} className="p-5 rounded-xl border bg-slate-900/40 border-slate-800 space-y-3 hover:border-emerald-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="text-xl">{mod.icon}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {mod.badge}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-100">{mod.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{mod.target}</p>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Tingkat Penyelesaian (Completion)</span>
                  <span className="font-bold text-emerald-400">{mod.completion}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${mod.completion}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/60">
                <span className="text-slate-500">Durasi: {mod.duration}</span>
                <button
                  onClick={() => triggerToast(`Status Pelatihan ${mod.title}: Enrolled ${mod.completion}% completed.`)}
                  className="text-emerald-400 hover:underline font-semibold cursor-pointer"
                >
                  Lihat Kurikulum →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content 2: Phishing Simulation */}
      {activeTab === 'phishing' && (
        <div className="p-5 rounded-xl border bg-slate-900/40 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-200">Hasil Simulasi Phishing Kuartal Ini (Q3-2026)</h2>
              <p className="text-xs text-slate-400">Uji Coba Email Phishing Palsu Mengatasnamakan OJK/BI Audit</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
              Status: Active Simulation
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block font-semibold">Email Dikirim</span>
              <span className="text-lg font-bold text-slate-200 font-mono">1,250</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block font-semibold">Dibuka (Opened)</span>
              <span className="text-lg font-bold text-blue-400 font-mono">1,180 (94.4%)</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block font-semibold">Klik Link (Vulnerable)</span>
              <span className="text-lg font-bold text-amber-400 font-mono">48 (3.8%)</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block font-semibold">Dilaporkan ke CISO</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">942 (75.3%)</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: Departments */}
      {activeTab === 'departments' && (
        <div className="rounded-xl border p-5 bg-slate-900/40 border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-slate-200">Keterlibatan Karyawan Non-IT per Departemen</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Nama Departemen</th>
                  <th className="p-3">Proporsi Non-IT</th>
                  <th className="p-3">Jumlah Staf</th>
                  <th className="p-3">Penyelesaian Edukasi</th>
                  <th className="p-3">Phishing Click-Rate</th>
                  <th className="p-3">Status Risiko</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {departmentData.map((dept, i) => (
                  <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-semibold text-slate-100">{dept.name}</td>
                    <td className="p-3 text-purple-400 font-mono">{dept.nonItPct}</td>
                    <td className="p-3 text-slate-300">{dept.enrolled} staff</td>
                    <td className="p-3 text-emerald-400 font-bold">{dept.completion}</td>
                    <td className="p-3 text-amber-400 font-mono">{dept.clickRate}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        dept.risk === 'SAFE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        dept.risk === 'LOW' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {dept.risk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quiz Simulation Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowQuizModal(false)}>
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  QUIZ EVALUASI KARYAWAN NON-IT
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-1">Uji Pemahaman Keamanan Informasi</h3>
              </div>
              <button
                onClick={() => { setShowQuizModal(false); setQuizSubmitted(false); setSelectedQuizAnswer(null); }}
                className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="font-semibold text-slate-200 leading-relaxed">
                Pertanyaan: Jika Anda menerima email berisi lampiran berniat verifikasi KTP dari alamat <em>audit-ojk-support@gmail.com</em>, tindakan paling tepat sesuai prosedur PinjamAJA adalah?
              </p>

              <div className="space-y-2 pt-1">
                {[
                  'Membuka lampiran tersebut untuk memastikan kebenarannya.',
                  'Melaporkan email mencurigakan tersebut ke Tim CISO / CS melalui tombol Report Phishing.',
                  'Membalas email tersebut dengan mengirimkan foto KTP nasabah.',
                  'Mengabaikan email dan menghapusnya tanpa melapor ke siapapun.'
                ].map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuizSubmit(idx)}
                    className={`w-full text-left p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      selectedQuizAnswer === idx
                        ? idx === 1 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-red-500/20 border-red-500 text-red-300'
                        : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span>{option}</span>
                    {selectedQuizAnswer === idx && (
                      <span className="text-sm font-bold">{idx === 1 ? '✓' : '✕'}</span>
                    )}
                  </button>
                ))}
              </div>

              {quizSubmitted && (
                <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                  selectedQuizAnswer === 1 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}>
                  <p className="font-bold mb-0.5">
                    {selectedQuizAnswer === 1 ? '🎉 Jawaban Sempurna!' : '⚠️ Perhatian:'}
                  </p>
                  <p>
                    {selectedQuizAnswer === 1
                      ? 'Langkah ini tepat sesuai kebijakan UU PDP & CISO PinjamAJA. Email resmi pemerintah tidak menggunakan domain gratisan seperti @gmail.com.'
                      : 'Jangan pernah membocorkan data KTP atau membalas email mencurigakan. Selalu laporkan email phishing ke tim CISO.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AuditManagementPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';

  React.useEffect(() => {
    let active = true;
    const fetchEvents = async () => {
      try {
        setLoading(true);
        // Gunakan audit-logs (AuditLog table) bukan security/events
        // AuditLog menyimpan timestamp akurat per-aksi (login, OTP, dll)
        const res = await fetch(`/api/v1/security/audit-logs?page=${page}&limit=20`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          if (active && json.success) {
            setEvents(json.data);
            const meta = json.meta?.pagination;
            setTotalCount(meta?.total || json.data.length);
            setTotalPages(meta?.totalPages || Math.ceil((meta?.total || json.data.length) / 20) || 1);
          }
        }
      } catch (err) {
        console.error('Failed to fetch audit logs', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchEvents();
    const interval = setInterval(fetchEvents, 15000);
    return () => { active = false; clearInterval(interval); };
  }, [page, refreshTrigger, token]);

  // Map module+action → kategori tampilan
  const getCategoryLabel = (log: any): string => {
    const action = (log.action || '').toLowerCase();
    const module = (log.module || '').toLowerCase();
    if (action.includes('login') || action.includes('logout') || action.includes('otp') || action.includes('pin') || module === 'auth') return 'Authentication';
    if (module === 'kyc') return 'Identity Verification';
    if (module === 'savings') return 'Savings';
    if (module === 'loan') return 'Loan';
    if (module === 'session') return 'Session';
    if (module === 'device' || action.includes('device')) return 'Device Security';
    if (module === 'risk') return 'Risk Assessment';
    return log.module || 'System';
  };

  // Map result → severity
  const getSeverityFromResult = (log: any): { label: string; cls: string } => {
    const result = (log.result || '').toUpperCase();
    const action = (log.action || '').toLowerCase();
    if (result === 'FAILURE' || result === 'ERROR') return { label: 'High', cls: 'bg-orange-500/10 text-orange-500 border border-orange-500/20' };
    if (action.includes('block') || action.includes('suspend') || action.includes('fraud')) return { label: 'Critical', cls: 'bg-red-500/10 text-red-500 border border-red-500/20' };
    if (action.includes('kyc') || action.includes('risk') || action.includes('device')) return { label: 'Medium', cls: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' };
    return { label: 'Low', cls: 'bg-green-500/10 text-green-500 border border-green-500/20' };
  };

  // Buat deskripsi yang dapat dibaca dari field AuditLog
  const getDescription = (log: any): string => {
    const parts: string[] = [];
    const action = (log.action || '').replace(/_/g, ' ');
    parts.push(action);
    if (log.entity && log.entityId) parts.push(`on ${log.entity} [${log.entityId.slice(0, 8)}...]`);
    if (log.browser) parts.push(`via ${log.browser}`);
    if (log.ipAddress) parts.push(`from ${log.ipAddress}`);
    return parts.join(' · ');
  };

  const filteredEvents = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return events.filter(e =>
      !q ||
      getDescription(e).toLowerCase().includes(q) ||
      (e.action || '').toLowerCase().includes(q) ||
      (e.module || '').toLowerCase().includes(q) ||
      (e.id || '').toLowerCase().includes(q) ||
      (e.correlationId || '').toLowerCase().includes(q) ||
      (e.ipAddress || '').toLowerCase().includes(q)
    );
  }, [events, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ClipboardCheck size={28} className="text-amber-500" />
            Audit Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Internal & External Audits, Findings & Corrective Actions
          </p>
        </div>
        <button
          onClick={() => setRefreshTrigger(prev => prev + 1)}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs px-3 py-2 rounded-lg border border-slate-700 transition"
        >
          <RefreshCwIcon size={14} className={loading ? "animate-spin" : ""} />
          Refresh Data
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white text-sm">Security Audit Logs</span>
            {!loading && (
              <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                {totalCount} total records
              </span>
            )}
          </div>
          <div className="relative max-w-xs w-full">
            <SearchIcon size={14} className="absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search action, module, IP, ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 text-slate-200 text-xs pl-9 pr-4 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider bg-slate-950">
                <th className="p-3">Log ID & Module</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Action & Detail</th>
                <th className="p-3">Actor / IP</th>
                <th className="p-3">Correlation ID</th>
                <th className="p-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {loading && events.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-slate-500">
                  <RefreshCwIcon size={16} className="animate-spin inline-block mr-2" /> Loading audit logs...
                </td></tr>
              ) : filteredEvents.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-slate-500">No Audit Logs Found</td></tr>
              ) : (
                filteredEvents.map(log => {
                  const sev = getSeverityFromResult(log);
                  const cat = getCategoryLabel(log);
                  const desc = getDescription(log);
                  // Timestamp langsung dari createdAt database — akurat per-event
                  const ts = new Date(log.createdAt);
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-800/40 transition"
                    >
                      <td className="p-3">
                        <p className="font-bold text-slate-200">{cat}</p>
                        <p className="text-slate-500 text-[10px] mt-0.5 font-mono">{log.id.slice(0, 14)}...</p>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${sev.cls}`}>
                          {sev.label}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300 max-w-xs">
                        <p className="font-semibold text-slate-200">{(log.action || '').replace(/_/g, ' ')}</p>
                        {log.result && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${log.result === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                            {log.result}
                          </span>
                        )}
                        {log.browser && <p className="text-slate-500 text-[10px] mt-0.5">{log.browser}</p>}
                      </td>
                      <td className="p-3">
                        <p className="text-slate-300 font-mono text-[10px]">{log.actorId?.slice(0, 10) || 'SYSTEM'}...</p>
                        {log.ipAddress && <p className="text-slate-500 text-[9px] mt-0.5">{log.ipAddress}</p>}
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded">
                          {log.correlationId ? log.correlationId.slice(0, 12) + '...' : 'N/A'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 whitespace-nowrap">
                        {/* Timestamp real dari database — sesuai waktu kejadian sesungguhnya */}
                        <p>{ts.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        <p className="text-[10px] text-slate-500">{ts.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-slate-400">Page {page} of {totalPages} · {totalCount} records</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ReportsPage() {
  return <ModulePlaceholder title="Reports & Analytics Engine" subtitle="Executive, Compliance, Risk & Incident Reports — PDF/Excel Export"
    icon={<BarChart3 size={24} color="#3B82F6" />}
    features={['Executive Summary', 'Monthly Security Report', 'Compliance Report', 'Risk Report', 'Incident Report', 'Board Report']} />;
}

export function SecureSDLCPage() {
  const [activeTab, setActiveTab] = useState<'pipelines' | 'secrets' | 'vulnerabilities'>('pipelines');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [secretGateEnforced, setSecretGateEnforced] = useState(true);

  const microservices = [
    {
      id: 'MS-01',
      name: 'mbank-core-api',
      cloud: 'AWS (ap-southeast-3)',
      sast: 'PASSED (0 High)',
      dast: 'PASSED',
      secretScan: 'CLEAN (0 Keys)',
      depCheck: 'CLEAN',
      status: 'APPROVED',
      lastDeploy: '2026-07-29 16:40'
    },
    {
      id: 'MS-02',
      name: 'mbank-kyc-service',
      cloud: 'AWS S3 + Cloud Storage',
      sast: 'PASSED (0 High)',
      dast: 'PASSED',
      secretScan: 'CLEAN (0 Keys)',
      depCheck: 'CLEAN',
      status: 'APPROVED',
      lastDeploy: '2026-07-30 09:15'
    },
    {
      id: 'MS-03',
      name: 'qris-crossborder-service',
      cloud: 'GCP (asia-southeast2)',
      sast: 'PASSED (0 High)',
      dast: 'PASSED',
      secretScan: 'CLEAN (0 Keys)',
      depCheck: 'CLEAN',
      status: 'APPROVED',
      lastDeploy: '2026-07-30 11:30'
    },
    {
      id: 'MS-04',
      name: 'bpr-migration-worker',
      cloud: 'Hybrid (On-Prem + Cloud)',
      sast: 'PASSED (0 High)',
      dast: 'PASSED',
      secretScan: 'CLEAN (0 Keys)',
      depCheck: 'CLEAN',
      status: 'APPROVED',
      lastDeploy: '2026-07-28 14:00'
    },
    {
      id: 'MS-05',
      name: 'micro-insurance-service',
      cloud: 'GCP App Engine',
      sast: 'PASSED (0 High)',
      dast: 'PASSED',
      secretScan: 'CLEAN (0 Keys)',
      depCheck: 'CLEAN',
      status: 'APPROVED',
      lastDeploy: '2026-07-30 08:20'
    }
  ];

  const secretScanAuditLogs = [
    {
      id: 'SEC-LOG-901',
      repo: 'pinjamaja-backend-core',
      developer: 'dev-team@pinjamaja.co.id',
      event: 'Git Pre-Commit Hook Triggered',
      finding: 'Attempted hardcoded AWS Secret Key commit blocked automatically',
      action: 'BLOCKED BY SECURITY GATE',
      timestamp: '2026-07-29 18:22'
    },
    {
      id: 'SEC-LOG-902',
      repo: 'qris-payment-microservice',
      developer: 'infra@pinjamaja.co.id',
      event: 'Vault Secret Injection Verification',
      finding: 'API keys securely injected via HashiCorp Vault environment variables',
      action: 'PASSED',
      timestamp: '2026-07-30 10:14'
    },
    {
      id: 'SEC-LOG-903',
      repo: 'bpr-savings-migrator',
      developer: 'dev-team@pinjamaja.co.id',
      event: 'Automated TruffleHog Repo Scan',
      finding: '0 plain-text credentials found across 412 commits',
      action: 'PASSED',
      timestamp: '2026-07-30 12:05'
    }
  ];

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRunDevSecOpsPipeline = async () => {
    setIsScanning(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsScanning(false);
    triggerToast('DevSecOps Pipeline Scan Completed: 14/14 Microservices Approved. 0 Hardcoded Keys Found!');
  };

  const handleToggleGate = () => {
    const nextVal = !secretGateEnforced;
    setSecretGateEnforced(nextVal);
    triggerToast(nextVal ? 'Security Gate DIAKTIFKAN: Git commit dengan hardcoded API key akan diblokir otomatis!' : 'Security Gate Dinonaktifkan.');
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white border border-pink-500/40 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up text-xs">
          <CheckCircle size={18} className="text-pink-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <Code2 style={{ color: '#EC4899' }} /> Secure SDLC & DevSecOps Control Center
          </h1>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Pipeline Security, Secret Scanning (Pencegahan Hardcoded API Keys), SAST/DAST & Automated Security Gates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleGate}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              secretGateEnforced ? 'bg-pink-500/20 text-pink-300 border-pink-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            🔒 Secret Gate: {secretGateEnforced ? 'ENFORCED (Active)' : 'DISABLED'}
          </button>

          <button
            onClick={handleRunDevSecOpsPipeline}
            disabled={isScanning}
            className="px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg cursor-pointer"
          >
            {isScanning ? (
              <>
                <Activity size={14} className="animate-spin" /> Running SAST/DAST Scan...
              </>
            ) : (
              <>
                🚀 Trigger CI/CD Security Scan
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border bg-slate-900/60 border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Active Microservices</span>
          <div className="text-2xl font-bold text-pink-400">14 Services</div>
          <span className="text-[10px] text-slate-500">AWS & GCP Cloud Native</span>
        </div>
        <div className="p-4 rounded-xl border bg-slate-900/60 border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Secret Scanner Status</span>
          <div className="text-2xl font-bold text-emerald-400">0 Hardcoded Keys</div>
          <span className="text-[10px] text-slate-500">100% Repos Clean (HashiCorp Vault)</span>
        </div>
        <div className="p-4 rounded-xl border bg-slate-900/60 border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Automated SAST/DAST Coverage</span>
          <div className="text-2xl font-bold text-blue-400">98.2%</div>
          <span className="text-[10px] text-slate-500">Pre-Deployment Automated Testing</span>
        </div>
        <div className="p-4 rounded-xl border bg-slate-900/60 border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Security Gate Approval Rate</span>
          <div className="text-2xl font-bold text-purple-400">96.5%</div>
          <span className="text-[10px] text-slate-500">Build Non-Compliant Diblokir Otomatis</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('pipelines')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'pipelines' ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🚀 CI/CD Security Gates (Microservices)
        </button>
        <button
          onClick={() => setActiveTab('secrets')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'secrets' ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🔒 Secret Management & Anti-Hardcode Audit
        </button>
      </div>

      {/* Tab Content 1: Microservices CI/CD Pipelines */}
      {activeTab === 'pipelines' && (
        <div className="rounded-xl border p-5 bg-slate-900/40 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200">Microservices CI/CD Security Gate Status</h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              5/5 Core Microservices Verified Safe
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Service ID</th>
                  <th className="p-3">Nama Microservice</th>
                  <th className="p-3">Cloud Platform</th>
                  <th className="p-3">SAST Code Scan</th>
                  <th className="p-3">DAST API Scan</th>
                  <th className="p-3">Secret Scan</th>
                  <th className="p-3">Status Pipeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {microservices.map((ms) => (
                  <tr key={ms.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-mono text-[11px] text-pink-400 font-bold">{ms.id}</td>
                    <td className="p-3 font-semibold text-slate-100">{ms.name}</td>
                    <td className="p-3 text-slate-400">{ms.cloud}</td>
                    <td className="p-3 text-emerald-400 font-medium">✓ {ms.sast}</td>
                    <td className="p-3 text-blue-400 font-medium">✓ {ms.dast}</td>
                    <td className="p-3 text-purple-400 font-medium">🔒 {ms.secretScan}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                        ✓ {ms.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 2: Secret Scanning Audit Logs */}
      {activeTab === 'secrets' && (
        <div className="rounded-xl border p-5 bg-slate-900/40 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-200">Anti-Hardcode Secret Scanning Audit Logs</h2>
              <p className="text-xs text-slate-400">Deteksi Otomatis & Pemblokiran API Keys/Kunci Rahasia di Git Repositori</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/20 font-semibold">
              TruffleHog & GitGuardian Active
            </span>
          </div>

          <div className="space-y-3">
            {secretScanAuditLogs.map((log) => (
              <div key={log.id} className="p-4 rounded-xl border bg-slate-950/60 border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-pink-400">{log.id}</span>
                    <span className="text-slate-300 font-bold">{log.repo}</span>
                    <span className="text-[10px] text-slate-500">by {log.developer}</span>
                  </div>
                  <p className="text-slate-300 font-medium">{log.event}</p>
                  <p className="text-slate-400 text-[11px]">{log.finding}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${
                    log.action.includes('BLOCKED') ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {log.action}
                  </span>
                  <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DevSecOps Policy Standards Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border bg-slate-900/60 border-slate-800 space-y-2">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">🔒 Kebijakan Anti-Hardcode API Key (Solusi Gap #2)</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Seluruh kunci API dan password dilarang keras ditulis di kode program. Git Pre-Commit Hook (TruffleHog) secara otomatis memblokir git push jika ditemukan API key polos. Kunci diinjeksi saat runtime via HashiCorp Vault.
          </p>
        </div>
        <div className="p-4 rounded-xl border bg-slate-900/60 border-slate-800 space-y-2">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">🚀 Otomasi Security Gates di CI/CD Pipeline</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Setiap fitur baru harus lulus pengujian keamanan otomatis (SAST/DAST & Dependency Audit) sebelum di-deploy ke AWS atau Google Cloud. Build yang gagal pengujian keamanan akan diblokir otomatis dari rilis produksi.
          </p>
        </div>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/v1/security/datasource/status');
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setStatus(result.data);
        }
      }
    } catch (err: any) {
      setError('Failed to fetch data source metrics');
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleToggle = async (type: 'live' | 'mock', currentVal: boolean) => {
    if (!status) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const liveEnabled = type === 'live' ? !currentVal : status.config.liveEnabled;
      const mockEnabled = type === 'mock' ? !currentVal : status.config.mockEnabled;

      const res = await fetch('/api/v1/security/datasource/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liveEnabled, mockEnabled })
      });
      if (res.ok) {
        setSuccessMsg(`Data source configuration updated successfully.`);
        await fetchStatus();
      } else {
        setError('Failed to update data source config');
      }
    } catch (err: any) {
      setError(err.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'import' | 'archive' | 'restore' | 'clear') => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/v1/security/demo-dataset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        setSuccessMsg(`Demo dataset successfully ${action}ed.`);
        setTimeout(() => fetchStatus(), 1000);
      } else {
        setError(`Failed to ${action} demo dataset.`);
      }
    } catch (err: any) {
      setError(err.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" style={{ color: 'var(--color-text-primary)' }}>
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Settings style={{ color: 'var(--color-accent-blue)' }} /> Data Source Management
        </h1>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Configure enterprise telemetry: toggle between Live operational feeds and Mock presentation datasets
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Telemetry Toggles */}
        <div className="col-span-12 lg:col-span-6 rounded-xl p-5 border flex flex-col justify-between" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
          <div>
            <h3 className="text-sm font-semibold mb-3">Enterprise Telemetry Feeds</h3>
            <p className="text-xs mb-5" style={{ color: 'var(--color-text-muted)' }}>
              Enable or disable data ingestion streams. Disabling a feed filters its records out of read-models immediately.
            </p>

            <div className="space-y-4">
              {/* Live Feeds */}
              <div className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}>
                <div>
                  <h4 className="text-xs font-semibold">Live Operational Feed</h4>
                  <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Ingests dynamic activities from PinjamAJA clients</p>
                </div>
                <button
                  disabled={loading}
                  onClick={() => handleToggle('live', status?.config?.liveEnabled)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${status?.config?.liveEnabled
                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}>
                  {status?.config?.liveEnabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              {/* Mock Feeds */}
              <div className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}>
                <div>
                  <h4 className="text-xs font-semibold">Mock Presentation Feed</h4>
                  <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Ingests pre-populated presentation datasets</p>
                </div>
                <button
                  disabled={loading}
                  onClick={() => handleToggle('mock', status?.config?.mockEnabled)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${status?.config?.mockEnabled
                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}>
                  {status?.config?.mockEnabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Dataset Manager */}
        <div className="col-span-12 lg:col-span-6 rounded-xl p-5 border flex flex-col justify-between" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
          <div>
            <h3 className="text-sm font-semibold mb-3">Demo Dataset Manager</h3>
            <p className="text-xs mb-5" style={{ color: 'var(--color-text-muted)' }}>
              Manage dummy operational records (Users, Incidents, Loans) for presentations without affecting master Governance Data.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                disabled={loading}
                onClick={() => handleAction('import')}
                className="p-3 rounded-lg border text-center hover:bg-blue-500/10 hover:border-blue-500/30 transition-colors group cursor-pointer"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}>
                <span className="block text-md font-bold text-blue-400">IMPORT</span>
                <span className="block text-[9px] mt-1" style={{ color: 'var(--color-text-muted)' }}>Seed dummy operational data</span>
              </button>

              <button
                disabled={loading}
                onClick={() => handleAction('archive')}
                className="p-3 rounded-lg border text-center hover:bg-amber-500/10 hover:border-amber-500/30 transition-colors group cursor-pointer"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}>
                <span className="block text-md font-bold text-amber-400">ARCHIVE</span>
                <span className="block text-[9px] mt-1" style={{ color: 'var(--color-text-muted)' }}>Soft delete dummy data</span>
              </button>

              <button
                disabled={loading}
                onClick={() => handleAction('restore')}
                className="p-3 rounded-lg border text-center hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-colors group cursor-pointer"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}>
                <span className="block text-md font-bold text-emerald-400">RESTORE</span>
                <span className="block text-[9px] mt-1" style={{ color: 'var(--color-text-muted)' }}>Bring back archived dummy data</span>
              </button>

              <button
                disabled={loading}
                onClick={() => handleAction('clear')}
                className="p-3 rounded-lg border text-center hover:bg-red-500/10 hover:border-red-500/30 transition-colors group cursor-pointer"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}>
                <span className="block text-md font-bold text-red-400">CLEAR</span>
                <span className="block text-[9px] mt-1" style={{ color: 'var(--color-text-muted)' }}>Hard delete all dummy data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Database Audit Counts */}
        <div className="col-span-12 rounded-xl p-5 border" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
          <h3 className="text-sm font-semibold mb-4">Ingested Database Record Counts</h3>
          <div className="grid grid-cols-3 gap-5 text-center">
            <div className="p-4 rounded-lg" style={{ background: 'var(--color-bg-elevated)' }}>
              <span className="text-[10px] uppercase font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Live Telemetry Feeds</span>
              <p className="text-2xl font-bold mt-1 text-blue-400">{status?.users?.live || 0} users</p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>{status?.audits?.live || 0} audit logs</p>
            </div>
            <div className="p-4 rounded-lg" style={{ background: 'var(--color-bg-elevated)' }}>
              <span className="text-[10px] uppercase font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Mock Presentation Feeds</span>
              <p className="text-2xl font-bold mt-1 text-emerald-400">{status?.users?.mock || 0} users</p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>{status?.audits?.mock || 0} audit logs</p>
            </div>
            <div className="p-4 rounded-lg" style={{ background: 'var(--color-bg-elevated)' }}>
              <span className="text-[10px] uppercase font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Archived Mock Datasets</span>
              <p className="text-2xl font-bold mt-1 text-slate-400">{status?.users?.archived || 0} users</p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>{status?.audits?.archived || 0} audit logs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

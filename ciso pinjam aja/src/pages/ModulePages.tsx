import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { useGovernance } from '@/contexts/GovernanceContext';
import {
  ShieldAlert, Scale, FileCheck, Map, Bug, AlertTriangle,
  Server, Database, UserCog, GraduationCap, ClipboardCheck,
  BarChart3, Gauge, Code2, Settings, Layers,
  TrendingUp, TrendingDown, ExternalLink, FileText,
  RefreshCw as RefreshCwIcon, Activity,
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
  return <ModulePlaceholder title="Security Governance" subtitle="Policy Lifecycle — Policies, Standards, Procedures & Guidelines"
    icon={<FileCheck size={24} color="#8B5CF6" />}
    features={['Policy Library', 'Document Lifecycle', 'Approval Workflow', 'Version History', 'Policy Coverage Matrix', 'RACI Matrix']} />;
}

export function VulnerabilityManagementPage() {
  return <ModulePlaceholder title="Vulnerability Management" subtitle="Scanner Results, CVSS Scoring, Remediation & SLA Tracking"
    icon={<Bug size={24} color="#EA580C" />}
    features={['Vulnerability Dashboard', 'Scanner Results', 'Asset-Vulnerability Matrix', 'Remediation Tracker', 'Patch Management', 'SLA Compliance']} />;
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
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${inc.severity === 'Critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                          inc.severity === 'High' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                            inc.severity === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
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
  return <ModulePlaceholder title="Data Protection Center" subtitle="Privacy & Data Security — UU PDP Compliance Engine"
    icon={<Database size={24} color="#8B5CF6" />}
    features={['Data Inventory', 'Data Classification', 'Encryption Dashboard', 'Privacy Impact Assessment', 'Data Subject Rights', 'Consent Management']} />;
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
            <ActivityIcon size={20} className="text-blue-500" />
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
  return <ModulePlaceholder title="Security Awareness Center" subtitle="Training Programs, Phishing Simulations & Security Culture"
    icon={<GraduationCap size={24} color="#10B981" />}
    features={['Training Programs', 'Completion Dashboard', 'Phishing Simulation', 'Quiz Management', 'Security Champions', 'Campaign Analytics']} />;
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
  return <ModulePlaceholder title="Secure SDLC" subtitle="DevSecOps — Pipeline Security, SAST/DAST, Secret Management"
    icon={<Code2 size={24} color="#EC4899" />}
    features={['Pipeline Dashboard', 'Security Testing', 'Secret Management', 'Code Review Checklist', 'Dependency Audit', 'Security Gates']} />;
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

import { useMemo, useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useGovernance } from '@/contexts/GovernanceContext';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { useSmartPolling } from '@/hooks/useSmartPolling';
import {
  Shield, TrendingUp, TrendingDown, AlertTriangle, Bug, Target,
  CheckCircle2, Clock, ArrowUpRight, Activity, FileWarning, Zap,
} from 'lucide-react';
import type { SecurityIncident } from '@/types';

/* ===== Helper Components ===== */

function KPICard({ label, value, unit, trend, target, icon, color, onClick }: {
  label: string; value: number; unit: string; trend: 'improving' | 'stable' | 'declining';
  target: number; icon: React.ReactNode; color: string; onClick?: () => void;
}) {
  const hasData = value > 0;
  const pct = Math.min(100, (value / target) * 100);
  const trendColor = trend === 'improving' ? '#10B981' : trend === 'declining' ? '#EF4444' : '#F59E0B';
  const TrendIcon = trend === 'improving' ? TrendingUp : trend === 'declining' ? TrendingDown : Activity;

  return (
    <div className="rounded-xl p-4 card-hover cursor-pointer"
      onClick={onClick}
      style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg" style={{ background: `${color}15` }}>
          {icon}
        </div>
        {/* Hanya tampilkan badge trend jika ada data real (value > 0) */}
        {hasData && (
          <div className="flex items-center gap-1 text-xs font-medium" style={{ color: trendColor }}>
            <TrendIcon size={12} />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold mb-0.5" style={{ color: 'var(--color-text-primary)' }}>
        {value}{unit === '%' ? '%' : ''} <span className="text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>{unit !== '%' ? unit : ''}</span>
      </p>
      <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
      {/* Progress bar hanya tampil jika ada data */}
      {hasData ? (
        <>
          <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--color-bg-elevated)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
          </div>
          <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>Target: {target}{unit === '%' ? '%' : ` ${unit}`}</p>
        </>
      ) : (
        <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>No data yet</p>
      )}
    </div>
  );
}

const THEME_COLORS = {
  light: {
    text: '#0F172A',
    muted: '#94A3B8',
    grid: '#E2E8F0',
    blue: '#3B82F6',
    purple: '#8B5CF6',
    emerald: '#10B981',
    amber: '#F59E0B',
    red: '#EF4444',
    bg: '#FFFFFF',
    cyan: '#06B6D4',
  },
  'mature-dark': {
    text: '#E2E8F0',
    muted: '#64748B',
    grid: '#2E384E',
    blue: '#C5A880',
    purple: '#9B8EA9',
    emerald: '#8FA68F',
    amber: '#D1A27A',
    red: '#C28080',
    bg: '#171C28',
    cyan: '#7EA1B0',
  },
};

function InitiativeCard({ obj }: { obj: any }) {
  const { theme } = useTheme();
  const colors = THEME_COLORS[theme] || THEME_COLORS['mature-dark'];
  const { openWorkflow } = useWorkflow();
  const { data: govData } = useGovernance();
  const relatedRisks = govData.risks.filter(r => obj.riskIds?.includes(r.id)) || [];
  const criticalRisks = relatedRisks.filter(r => r.inherentScore >= 12).length;
  const statusColor = obj.status === 'Completed' ? colors.emerald : obj.status === 'Delayed' || obj.status === 'At Risk' ? colors.red : colors.blue;
  const initiativeColor = obj.initiative === 'Cross-Border QRIS' ? colors.blue : obj.initiative === 'Micro Insurance' ? colors.purple : colors.emerald;

  return (
    <div className="rounded-xl p-4 card-hover cursor-pointer"
      onClick={() => openWorkflow('business-objective', obj.id)}
      style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${initiativeColor}20`, color: initiativeColor }}>
          {obj.initiative}
        </span>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${statusColor}20`, color: statusColor }}>
          {obj.status}
        </span>
      </div>
      <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>{obj.name}</h4>
      <p className="text-[11px] mb-3 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>{obj.description}</p>

      {/* Progress */}
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span style={{ color: 'var(--color-text-secondary)' }}>Progress</span>
        <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{obj.progress}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full mb-3" style={{ background: 'var(--color-bg-elevated)' }}>
        <div className="h-full rounded-full" style={{ width: `${obj.progress}%`, background: initiativeColor }} />
      </div>

      <div className="flex items-center justify-between text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
        <span>{relatedRisks.length} risks ({criticalRisks} critical)</span>
        <span>Due: {new Date(obj.targetDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
      </div>
    </div>
  );
}

/* ===== Main Page ===== */

export default function ExecutiveCommandCenter() {
  const { theme } = useTheme();
  const { openWorkflow } = useWorkflow();
  const colors = THEME_COLORS[theme] || THEME_COLORS['mature-dark'];

  const { data: govData } = useGovernance();
  const [healthStatus, setHealthStatus] = useState({
    api: 'DOWN',
    database: 'DOWN',
    redis: 'DOWN',
    rabbitmq: 'DOWN',
    dashboardSummary: 'DOWN',
    incidents: 'DOWN',
    auditLogs: 'DOWN',
    kycQueue: 'DOWN',
    overall: 'DOWN'
  });
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [retryInterval, setRetryInterval] = useState(5000);
  const [dashboardData, setDashboardData] = useState({
    overallSecurityScore: 0,
    mttd: 0,
    mttr: 0,
    controlEffectiveness: 0,
    openIncidents: 0,
    criticalVulns: 0,
    activeLoans: 0,
    totalUsers: 0,
    mockDataActive: false,
    securityMaturity: { identify: 0, protect: 0, detect: 0, respond: 0, recover: 0 }
  });

  const [kycMetrics, setKycMetrics] = useState<any>({
    identityOverview: { verified: 0, pending: 0, rejected: 0, inProgress: 0, reuploadRequired: 0, suspended: 0 },
    approvedToday: 0,
    rejectedToday: 0,
    averages: { ocrAccuracy: 95, faceMatchScore: 92, verificationTimeSeconds: 120 },
    duplicateNikAlerts: [],
    trustedDeviceRatio: 94.5
  });

  const [activeSessions, setActiveSessions] = useState<any[]>([]);

  const fetchKycMetrics = async () => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
      const res = await fetch('/api/v1/security/kyc-metrics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setKycMetrics(json.data);
      }
    } catch (err) {
      console.warn('Failed to fetch KYC metrics', err);
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
      const res = await fetch('/api/v1/security/active-sessions-soc', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setActiveSessions(json.data);
      }
    } catch (err) {
      console.warn('Failed to fetch active sessions', err);
    }
  };

  const fetchDashboardData = async () => {
    let apiStatus = 'DOWN';
    let dbStatus = 'DOWN';
    let redisStatus = 'DOWN';
    let rabbitmqStatus = 'DOWN';
    let summaryStatus = 'DOWN';
    let incidentsStatus = 'DOWN';
    let auditStatus = 'DOWN';
    let kycStatus = 'DOWN';

    try {
      const hRes = await fetch('/api/v1/health');
      if (hRes.ok) {
        const hData = await hRes.json();
        apiStatus = hData.status === 'UP' ? 'UP' : 'DOWN';
        if (hData.success && hData.services) {
          dbStatus = hData.services.database || 'DOWN';
          redisStatus = hData.services.redis || 'DOWN';
          rabbitmqStatus = hData.services.rabbitmq || 'DOWN';
        }
      }
    } catch (err) {
      console.warn('Failed to fetch health check', err);
    }

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
      const dRes = await fetch('/api/v1/security/dashboard-summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (dRes.ok) {
        const dData = await dRes.json();
        if (dData.success) {
          setDashboardData(dData.data);
          summaryStatus = 'UP';
          setLastSync(new Date().toLocaleTimeString('en-GB'));
        }
      }
    } catch (err) {
      console.warn('Failed to fetch dashboard summary', err);
    }

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
      const iRes = await fetch('/api/v1/security/incidents?limit=5', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (iRes.ok) {
        incidentsStatus = 'UP';
      }
    } catch (err) {}

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
      const aRes = await fetch('/api/v1/security/audit-logs?limit=5', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (aRes.ok) {
        auditStatus = 'UP';
      }
    } catch (err) {}

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
      const kRes = await fetch('/api/v1/security/kyc-pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (kRes.ok) {
        kycStatus = 'UP';
      }
    } catch (err) {}

    // Fetch SOC & e-KYC metrics alongside dashboard data
    fetchKycMetrics();
    fetchActiveSessions();

    const overall = (apiStatus === 'UP' && dbStatus === 'UP') ? 'UP' : 'DOWN';
    if (overall === 'UP') {
      setRetryInterval(30000); // 30 seconds polling
    } else {
      setRetryInterval(prev => Math.min(prev * 2, 60000));
    }

    setHealthStatus({
      api: apiStatus,
      database: dbStatus,
      redis: redisStatus,
      rabbitmq: rabbitmqStatus,
      dashboardSummary: summaryStatus,
      incidents: incidentsStatus,
      auditLogs: auditStatus,
      kycQueue: kycStatus,
      overall
    });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useSmartPolling(fetchDashboardData, retryInterval);

  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const fetchIncidents = async () => {
    try {
      const res = await fetch('/api/v1/security/incidents?limit=5');
      if (res.status === 429) {
        setHealthStatus(prev => ({ ...prev, overall: 'RATE_LIMITED' }));
        setRetryInterval(60000);
        return;
      }
      const json = await res.json();
      if (json.success) {
        setIncidents(json.data.map((se: any) => ({
          id: se.id,
          title: se.title || 'Unknown Incident',
          description: se.description,
          severity: se.severity,
          status: se.status,
          type: se.incidentType || 'General',
          assignee: se.assigneeId || 'Unassigned',
          reporter: se.reporterId || 'System',
          createdAt: se.createdAt,
          updatedAt: se.updatedAt,
          timeline: []
        })));
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const currentRisks = govData.risks || [];
  const currentBusinessObjectives = govData.businessObjectives || [];
  const currentKpis = govData.kpis || [];
  const currentExecutiveDecisions = govData.executiveDecisions || [];

  const complianceAvg = Math.round(currentKpis.filter(k => k.category === 'Compliance').reduce((a, k) => a + k.currentValue, 0) / Math.max(1, currentKpis.filter(k => k.category === 'Compliance').length)) || 0;
  const pendingDecisions = currentExecutiveDecisions.filter(d => d.status === 'Pending').length;

  const textColor = colors.text;
  const mutedColor = colors.muted;
  const gridColor = colors.grid;

  // Computed metrics from backend data
  const overallSecurityScore = dashboardData.overallSecurityScore;
  const openIncidents = dashboardData.openIncidents;
  const criticalVulns = dashboardData.criticalVulns;
  const controlEffectiveness = dashboardData.controlEffectiveness;
  const mockDataActive = dashboardData.mockDataActive ?? true;

  // Chart: Security Score Gauge
  const gaugeOption = useMemo(() => ({
    series: [{
      type: 'gauge',
      startAngle: 220,
      endAngle: -40,
      min: 0,
      max: 100,
      pointer: { show: true, length: '55%', width: 4, itemStyle: { color: colors.blue } },
      axisLine: {
        lineStyle: {
          width: 18,
          color: [
            [0.4, colors.red], [0.6, colors.amber], [0.8, colors.blue], [1, colors.emerald]
          ],
        },
      },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      detail: {
        valueAnimation: true,
        formatter: '{value}',
        fontSize: 36,
        fontWeight: 'bold',
        color: textColor,
        offsetCenter: [0, '30%'],
      },
      title: { show: true, offsetCenter: [0, '55%'], fontSize: 12, color: mutedColor },
      data: [{ value: overallSecurityScore, name: 'Security Score' }],
    }],
  }), [overallSecurityScore, textColor, mutedColor, colors]);

  // Chart: NIST CSF Radar
  const radarOption = useMemo(() => ({
    radar: {
      indicator: [
        { name: 'Identify', max: 100 },
        { name: 'Protect', max: 100 },
        { name: 'Detect', max: 100 },
        { name: 'Respond', max: 100 },
        { name: 'Recover', max: 100 },
      ],
      axisName: { color: mutedColor, fontSize: 11 },
      splitArea: { areaStyle: { color: 'transparent' } },
      axisLine: { lineStyle: { color: gridColor } },
      splitLine: { lineStyle: { color: gridColor } },
    },
    series: [{
      type: 'radar',
      data: [{
        value: [
          dashboardData.securityMaturity.identify,
          dashboardData.securityMaturity.protect,
          dashboardData.securityMaturity.detect,
          dashboardData.securityMaturity.respond,
          dashboardData.securityMaturity.recover
        ],
        name: 'Current Maturity',
        areaStyle: { color: `${colors.blue}26` },
        lineStyle: { color: colors.blue, width: 2 },
        itemStyle: { color: colors.blue },
      }, {
        value: [85, 85, 85, 85, 85],
        name: 'Target (Year 1)',
        lineStyle: { color: colors.purple, width: 1, type: 'dashed' },
        itemStyle: { color: colors.purple },
        areaStyle: { color: 'transparent' },
      }],
    }],
    legend: { bottom: 0, textStyle: { color: mutedColor, fontSize: 10 } },
  }), [mutedColor, gridColor, colors]);

  // Chart: Risk Heatmap
  const heatmapOption = useMemo(() => {
    const heatmapData: [number, number, number][] = [];
    currentRisks.forEach(r => {
      const existing = heatmapData.find(d => d[0] === r.likelihood - 1 && d[1] === r.impact - 1);
      if (existing) existing[2]++;
      else heatmapData.push([r.likelihood - 1, r.impact - 1, 1]);
    });

    return {
      tooltip: {
        formatter: (p: { data: number[] }) => `Likelihood: ${p.data[0] + 1}, Impact: ${p.data[1] + 1}<br/>Risks: ${p.data[2]}`,
      },
      xAxis: { type: 'category' as const, data: ['1', '2', '3', '4', '5'], name: 'Likelihood', nameLocation: 'center' as const, nameGap: 25, axisLabel: { color: mutedColor, fontSize: 10 }, axisLine: { lineStyle: { color: gridColor } }, nameTextStyle: { color: mutedColor, fontSize: 10 } },
      yAxis: { type: 'category' as const, data: ['1', '2', '3', '4', '5'], name: 'Impact', nameLocation: 'center' as const, nameGap: 30, axisLabel: { color: mutedColor, fontSize: 10 }, axisLine: { lineStyle: { color: gridColor } }, nameTextStyle: { color: mutedColor, fontSize: 10 } },
      visualMap: { min: 0, max: 3, show: false, inRange: { color: [colors.emerald, colors.amber, colors.red, colors.red] } },
      series: [{ type: 'heatmap', data: heatmapData, label: { show: true, color: '#fff', fontSize: 12, fontWeight: 'bold' as const }, itemStyle: { borderColor: colors.bg, borderWidth: 3, borderRadius: 4 } }],
      grid: { left: 45, right: 15, top: 10, bottom: 45 },
    };
  }, [mutedColor, gridColor, colors, currentRisks]);

  // Chart: Compliance by Regulation
  const complianceBarOption = useMemo(() => {
    const complianceData = mockDataActive ? [
      { name: 'UU PDP', value: 68, color: colors.purple },
      { name: 'POJK 10/2022', value: 45, color: colors.blue },
      { name: 'PADG 23/21', value: 92, color: colors.emerald },
      { name: 'ISO 27001', value: 78, color: colors.cyan },
    ] : [
      { name: 'UU PDP', value: 0, color: colors.purple },
      { name: 'POJK 10/2022', value: 0, color: colors.blue },
      { name: 'PADG 23/21', value: 0, color: colors.emerald },
      { name: 'ISO 27001', value: 0, color: colors.cyan },
    ];

    return {
      tooltip: { trigger: 'axis' as const },
      xAxis: { type: 'value' as const, max: 100, axisLabel: { color: mutedColor, fontSize: 10, formatter: '{value}%' }, splitLine: { lineStyle: { color: gridColor } }, axisLine: { show: false } },
      yAxis: { type: 'category' as const, data: complianceData.map(d => d.name), axisLabel: { color: textColor, fontSize: 11 }, axisLine: { show: false }, axisTick: { show: false } },
      series: [{
        type: 'bar',
        data: complianceData.map(d => ({ value: d.value, itemStyle: { color: d.color, borderRadius: [0, 4, 4, 0] } })),
        barWidth: 20,
        label: { show: true, position: 'right' as const, formatter: '{c}%', color: textColor, fontSize: 11, fontWeight: 'bold' as const },
      }],
      grid: { left: 90, right: 50, top: 10, bottom: 10 },
    };
  }, [mutedColor, gridColor, textColor, colors, mockDataActive]);

  // Chart: Security Trend (6 months)
  const trendOption = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

    return {
      tooltip: { trigger: 'axis' as const },
      legend: { bottom: 0, textStyle: { color: mutedColor, fontSize: 10 } },
      xAxis: { type: 'category' as const, data: months, axisLabel: { color: mutedColor, fontSize: 10 }, axisLine: { lineStyle: { color: gridColor } } },
      yAxis: { type: 'value' as const, max: 100, axisLabel: { color: mutedColor, fontSize: 10, formatter: '{value}%' }, splitLine: { lineStyle: { color: gridColor } } },
      series: [
        { name: 'Security Score', type: 'line', data: mockDataActive ? [52, 55, 58, 60, 63, overallSecurityScore] : [0, 0, 0, 0, 0, 0], smooth: true, lineStyle: { color: colors.blue, width: 2 }, areaStyle: { color: { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: `${colors.blue}33` }, { offset: 1, color: `${colors.blue}00` }] } }, itemStyle: { color: colors.blue } },
        { name: 'Compliance', type: 'line', data: mockDataActive ? [40, 48, 55, 60, 65, complianceAvg] : [0, 0, 0, 0, 0, 0], smooth: true, lineStyle: { color: colors.emerald, width: 2 }, itemStyle: { color: colors.emerald } },
        { name: 'Risk Treatment', type: 'line', data: mockDataActive ? [30, 38, 45, 52, 58, 65] : [0, 0, 0, 0, 0, 0], smooth: true, lineStyle: { color: colors.purple, width: 2 }, itemStyle: { color: colors.purple } },
      ],
      grid: { left: 45, right: 15, top: 10, bottom: 35 },
    };
  }, [overallSecurityScore, complianceAvg, mutedColor, gridColor, colors, mockDataActive]);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Enterprise Platform Health & Sync Status Grid */}
      <div className="rounded-xl p-5 border" 
        style={{ 
          background: 'var(--color-bg-surface)', 
          borderColor: 'var(--color-border)' 
        }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b border-[var(--color-border)]">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2 mb-0" style={{ color: 'var(--color-text-primary)' }}>
              <span className={`w-2.5 h-2.5 rounded-full ${healthStatus.overall === 'UP' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              Enterprise Platform Status: {healthStatus.overall === 'UP' ? 'ONLINE' : 'DEGRADED / OFFLINE'}
            </h3>
            <p className="text-[11px] mb-0 mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Unified synchronization monitor across ports and database domains. Last sync: {lastSync || 'Just now'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {healthStatus.overall === 'DOWN' && (
              <div className="text-[10px] font-semibold px-2 py-1 rounded" style={{ background: '#EF444420', color: '#EF4444' }}>
                Retrying in {retryInterval / 1000}s...
              </div>
            )}
            <div className="text-xs font-semibold px-2.5 py-1 rounded" style={{ background: healthStatus.overall === 'UP' ? '#10B98120' : '#EF444420', color: healthStatus.overall === 'UP' ? '#10B981' : '#EF4444' }}>
              API Layer: http://localhost:4000
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'Backend API', status: healthStatus.api },
            { label: 'Database', status: healthStatus.database },
            { label: 'Redis (Cache)', status: healthStatus.redis, optional: true },
            { label: 'RabbitMQ (MQ)', status: healthStatus.rabbitmq, optional: true },
            { label: 'Dashboard Summary', status: healthStatus.dashboardSummary },
            { label: 'Incident Engine', status: healthStatus.incidents },
            { label: 'Audit Logs', status: healthStatus.auditLogs },
            { label: 'KYC Queue', status: healthStatus.kycQueue },
          ].map((srv, idx) => {
            const isUp = srv.status === 'UP';
            const color = isUp ? 'text-emerald-400' : srv.optional ? 'text-amber-400' : 'text-red-400';
            const icon = isUp ? '🟢' : srv.optional ? '🟡' : '🔴';

            return (
              <div key={idx} className="p-3 rounded-lg flex flex-col justify-between" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}>
                <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{srv.label}</span>
                <span className={`text-[11px] font-bold mt-1.5 flex items-center gap-1.5 ${color}`}>
                  <span>{icon}</span>
                  {srv.status === 'UP' ? 'UP' : srv.optional ? 'DOWN (Opt)' : 'DOWN'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 1: Score Gauge + NIST Radar + Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Security Score Gauge */}
        <div className="col-span-1 md:col-span-6 lg:col-span-3 rounded-xl p-5" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>Overall Security Posture</h3>
          <ReactECharts option={gaugeOption} style={{ height: 220 }} />
          <div className="text-center">
            <span className="text-xs font-medium px-2 py-1 rounded-full" style={{
              background: overallSecurityScore >= 70 ? `${colors.blue}1A` : `${colors.amber}1A`,
              color: overallSecurityScore >= 70 ? colors.blue : colors.amber,
            }}>
              {mockDataActive ? (overallSecurityScore >= 80 ? 'Managed' : overallSecurityScore >= 60 ? 'Defined' : 'Initial') : 'N/A'} Maturity
            </span>
          </div>
        </div>

        {/* NIST CSF Radar */}
        <div className="col-span-1 md:col-span-6 lg:col-span-3 rounded-xl p-5" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>NIST CSF Maturity</h3>
          <ReactECharts option={radarOption} style={{ height: 220 }} />
        </div>

        {/* KPI Summary Cards */}
        <div className="col-span-1 lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 h-full">
          <KPICard label="MTTD" value={dashboardData.mttd} unit="hours" trend="improving" target={4} icon={<Clock size={16} color={colors.blue} />} color={colors.blue} onClick={() => openWorkflow('kpi', 'KPI-002')} />
          <KPICard label="MTTR" value={dashboardData.mttr} unit="hours" trend="improving" target={24} icon={<Zap size={16} color={colors.purple} />} color={colors.purple} onClick={() => openWorkflow('kpi', 'KPI-003')} />
          <KPICard label="Control Effectiveness" value={controlEffectiveness} unit="%" trend="improving" target={85} icon={<Shield size={16} color={colors.emerald} />} color={colors.emerald} onClick={() => openWorkflow('kpi', 'KPI-009')} />
          <KPICard label="Open Incidents" value={openIncidents} unit="active" trend="improving" target={2} icon={<AlertTriangle size={16} color={colors.red} />} color={colors.red} onClick={() => openWorkflow('kpi', 'KPI-012')} />
          <KPICard label="Critical Vulns" value={criticalVulns} unit="open" trend="declining" target={0} icon={<Bug size={16} color={colors.amber} />} color={colors.amber} onClick={() => openWorkflow('kpi', 'KPI-007')} />
          <KPICard label="Active Loans" value={dashboardData.activeLoans} unit="loans" trend="stable" target={0} icon={<Activity size={16} color={colors.emerald} />} color={colors.emerald} />
        </div>
      </div>

      {/* Row 2: SatuNusa Initiatives */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>SatuNusa Expansion Initiatives</h3>
            <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Business Objective → Risk → Control → Implementation tracking</p>
          </div>
          <button className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--color-accent-blue)', background: 'rgba(59,130,246,0.1)' }}>
            View All <ArrowUpRight size={12} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {currentBusinessObjectives.map(obj => (
            <InitiativeCard key={obj.id} obj={obj} />
          ))}
        </div>
      </div>

      {/* Row 3: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        {/* Security Trend */}
        <div className="col-span-1 lg:col-span-5 rounded-xl p-5" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-secondary)' }}>Security Posture Trend (6 Months)</h3>
          <ReactECharts option={trendOption} style={{ height: 220 }} />
        </div>

        {/* Risk Heatmap */}
        <div className="col-span-1 md:col-span-6 lg:col-span-3 rounded-xl p-5" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-secondary)' }}>Risk Heat Map</h3>
          <ReactECharts option={heatmapOption} style={{ height: 220 }} />
        </div>

        {/* Compliance by Regulation */}
        <div className="col-span-1 md:col-span-6 lg:col-span-4 rounded-xl p-5" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-secondary)' }}>Compliance by Regulation</h3>
          <ReactECharts option={complianceBarOption} style={{ height: 220 }} />
        </div>
      </div>

      {/* Row 4: Decision Queue + Recent Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Decision Queue */}
        <div className="col-span-1 lg:col-span-7 rounded-xl p-5" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Executive Decision Queue</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">{pendingDecisions} Pending</span>
          </div>
          <div className="space-y-2">
            {currentExecutiveDecisions.map(dec => {
              const statusColor = dec.status === 'Approved' ? colors.emerald : dec.status === 'Rejected' ? colors.red : colors.amber;
              const typeColor = dec.type === 'Approval' ? colors.blue : dec.type === 'Risk Acceptance' ? colors.amber : dec.type === 'Escalation' ? colors.red : colors.purple;
              return (
                <div key={dec.id} className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                  style={{ background: 'var(--color-bg-elevated)' }}
                  onClick={() => openWorkflow('decision', dec.id)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-bg-elevated)'; }}>
                  <div className="mt-0.5">
                    {dec.type === 'Approval' ? <CheckCircle2 size={16} color={typeColor} /> :
                     dec.type === 'Escalation' ? <AlertTriangle size={16} color={typeColor} /> :
                     <Target size={16} color={typeColor} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: `${typeColor}20`, color: typeColor }}>{dec.type}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: `${statusColor}20`, color: statusColor }}>{dec.status}</span>
                    </div>
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{dec.title}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{dec.decidedBy} • {new Date(dec.date).toLocaleDateString('en-GB')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
 
        {/* Recent Incidents */}
        <div className="col-span-1 lg:col-span-5 rounded-xl p-5" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Active Security Incidents</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">{mockDataActive ? openIncidents : 0} Active</span>
          </div>
          <div className="space-y-2">
            {incidents.map(inc => {
              const sevColor = inc.severity === 'Critical' ? colors.red : inc.severity === 'High' ? colors.amber : inc.severity === 'Medium' ? colors.amber : colors.emerald;
              return (
                <div key={inc.id} className="p-3 rounded-lg cursor-pointer transition-colors"
                  style={{ background: 'var(--color-bg-elevated)' }}
                  onClick={() => openWorkflow('incident', inc.id)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-bg-elevated)'; }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--color-text-muted)' }}>{inc.id}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-white" style={{ background: sevColor }}>{inc.severity}</span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'var(--color-bg-surface)', color: 'var(--color-text-secondary)' }}>{inc.status}</span>
                  </div>
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{inc.title}</p>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    Assigned: {inc.assignee} • {new Date(inc.createdAt).toLocaleDateString('en-GB')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 5: e-KYC & Identity Center SOC */}
      <div className="mt-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <Shield className="text-blue-500 animate-pulse" size={18} />
              e-KYC & SecureNusa Identity Center SOC
            </h3>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Pemantauan biometrik, performa KYC, dan aktivitas sesi real-time.
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                fetchKycMetrics();
                fetchActiveSessions();
                fetchIncidents();
              }}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors bg-white/5 border border-white/10 text-white hover:bg-white/10"
            >
              <Activity size={12} className="animate-spin-slow" /> Refresh Feeds
            </button>
            <button 
              onClick={() => window.location.href = '/kyc'}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors bg-blue-600 hover:bg-blue-500 text-white"
            >
              Buka Antrean KYC <ArrowUpRight size={12} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
          {/* Card 1: Enterprise Identity Overview */}
          <div className="col-span-1 lg:col-span-4 rounded-xl p-5" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-4 text-blue-500">Enterprise Identity Overview</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                <span style={{ color: 'var(--color-text-muted)' }} className="block mb-1">Verified</span>
                <span className="text-lg font-bold text-green-400">{kycMetrics.identityOverview?.verified ?? 0}</span>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                <span style={{ color: 'var(--color-text-muted)' }} className="block mb-1">Pending Review</span>
                <span className="text-lg font-bold text-amber-400">{kycMetrics.identityOverview?.pending ?? 0}</span>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                <span style={{ color: 'var(--color-text-muted)' }} className="block mb-1">Rejected</span>
                <span className="text-lg font-bold text-red-400">{kycMetrics.identityOverview?.rejected ?? 0}</span>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                <span style={{ color: 'var(--color-text-muted)' }} className="block mb-1">In Progress</span>
                <span className="text-lg font-bold text-blue-400">{kycMetrics.identityOverview?.inProgress ?? 0}</span>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                <span style={{ color: 'var(--color-text-muted)' }} className="block mb-1">Reupload Req.</span>
                <span className="text-lg font-bold text-orange-400">{kycMetrics.identityOverview?.reuploadRequired ?? 0}</span>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                <span style={{ color: 'var(--color-text-muted)' }} className="block mb-1">Suspended</span>
                <span className="text-lg font-bold text-red-500">{kycMetrics.identityOverview?.suspended ?? 0}</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
              <span>Approved Today: <strong className="text-green-400">{kycMetrics.approvedToday ?? 0}</strong></span>
              <span>Rejected Today: <strong className="text-red-400">{kycMetrics.rejectedToday ?? 0}</strong></span>
            </div>
          </div>

          {/* Card 2: Verification Quality & Performance */}
          <div className="col-span-1 lg:col-span-4 rounded-xl p-5 flex flex-col justify-between" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-4 text-blue-500">Biometric & Speed Averages</h4>
              <div className="space-y-3.5 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    <span>OCR Recognition Confidence</span>
                    <span className="font-semibold text-white">{kycMetrics.averages?.ocrAccuracy ?? 95}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${kycMetrics.averages?.ocrAccuracy ?? 95}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    <span>Face Match Score Accuracy</span>
                    <span className="font-semibold text-white">{kycMetrics.averages?.faceMatchScore ?? 92}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${kycMetrics.averages?.faceMatchScore ?? 92}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    <span>Trusted Device Registration Ratio</span>
                    <span className="font-semibold text-white">{kycMetrics.trustedDeviceRatio ?? 94.5}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-purple-500" style={{ width: `${kycMetrics.trustedDeviceRatio ?? 94.5}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
              <span style={{ color: 'var(--color-text-secondary)' }}>Avg. Verification Speed:</span>
              <span className="font-bold text-white flex items-center gap-1">
                <Clock size={12} className="text-blue-400" />
                {Math.round(kycMetrics.averages?.verificationTimeSeconds ?? 120)} detik
              </span>
            </div>
          </div>

          {/* Card 3: Duplicate Identity Alerts Panel */}
          <div className="col-span-1 lg:col-span-4 rounded-xl p-5" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-4 text-blue-500">Identity Alert Center (NIK / Device)</h4>
            <div className="flex-1 flex flex-col justify-center h-[calc(100%-2rem)]">
              {kycMetrics.duplicateNikAlerts && kycMetrics.duplicateNikAlerts.length > 0 ? (
                <div className="space-y-2.5">
                  {kycMetrics.duplicateNikAlerts.map((alert: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex gap-2.5 items-start">
                      <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={14} />
                      <div className="text-[11px]">
                        <span className="font-semibold text-white block">Duplikasi Identitas Terdeteksi</span>
                        <span style={{ color: 'var(--color-text-muted)' }}>NIK {alert.nik} dicoba oleh {alert.count} user berbeda.</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center rounded-lg bg-green-500/5 border border-green-500/10 flex flex-col items-center justify-center opacity-80 h-full">
                  <CheckCircle2 className="text-green-500 mb-2" size={24} />
                  <span className="text-[11px] font-semibold text-green-400">Identity Integrity Secure</span>
                  <span className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Tidak ada duplikasi NIK atau device yang mencurigakan.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full-width: SecureNusa Session SOC Monitoring */}
        <div className="rounded-xl p-5 overflow-hidden" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-500">Active SOC Session Monitoring (Redis Cache Enabled)</h4>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
              {activeSessions.length} Active Sessions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                  <th className="py-2.5 font-semibold">User</th>
                  <th className="py-2.5 font-semibold">OS / Browser</th>
                  <th className="py-2.5 font-semibold">IP Address</th>
                  <th className="py-2.5 font-semibold">Device Status</th>
                  <th className="py-2.5 font-semibold text-center">Risk Score</th>
                  <th className="py-2.5 font-semibold">Login Time</th>
                  <th className="py-2.5 font-semibold">Last Active</th>
                </tr>
              </thead>
              <tbody style={{ color: 'var(--color-text-primary)' }}>
                {activeSessions.length > 0 ? (
                  activeSessions.map((session, index) => {
                    const isHighRisk = (session.user?.riskScore ?? 0) >= 50;
                    return (
                      <tr key={index} className="border-b hover:bg-white/5 transition-colors" style={{ borderColor: 'var(--color-border)' }}>
                        <td className="py-2.5 font-medium">
                          {session.user?.fullName ?? 'System User'}
                          <span className="text-[10px] block text-gray-500 font-mono">{session.userId}</span>
                        </td>
                        <td className="py-2.5 text-gray-400 max-w-[200px] truncate">{session.userAgent}</td>
                        <td className="py-2.5 font-mono text-gray-400">{session.ipAddress}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${session.isTrusted ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {session.isTrusted ? 'Trusted' : 'Untrusted'}
                          </span>
                        </td>
                        <td className={`py-2.5 text-center font-bold ${isHighRisk ? 'text-red-500' : 'text-green-500'}`}>
                          {session.user?.riskScore ?? 15}%
                        </td>
                        <td className="py-2.5 text-gray-400">{new Date(session.createdAt).toLocaleTimeString('en-GB')}</td>
                        <td className="py-2.5 text-gray-400">{new Date(session.updatedAt).toLocaleTimeString('en-GB')}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500 opacity-60">
                      Tidak ada sesi aktif terdeteksi saat ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

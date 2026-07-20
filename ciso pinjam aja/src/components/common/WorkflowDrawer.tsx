import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { useGovernance } from '@/contexts/GovernanceContext';
import { resolveChain, CHAIN_STEPS } from '@/utils/chainResolver';
import {
  X, ExternalLink, Layers, Target, AlertTriangle, Shield,
  Settings as SettingsIcon, FileText, Scale, Gauge, CheckCircle2,
} from 'lucide-react';
import type { ChainNodeType } from '@/utils/chainResolver';

const STEP_ICONS: Record<string, React.ReactNode> = {
  objective: <Target size={13} />,
  risks: <AlertTriangle size={13} />,
  controls: <Shield size={13} />,
  implementations: <SettingsIcon size={13} />,
  evidences: <FileText size={13} />,
  compliance: <Scale size={13} />,
  kpis: <Gauge size={13} />,
  decisions: <CheckCircle2 size={13} />,
};

const MODULE_ROUTING: Record<ChainNodeType, string> = {
  'business-objective': '/',
  'risk': '/risk',
  'control': '/compliance',
  'implementation': '/roadmap',
  'evidence': '/compliance',
  'compliance': '/compliance',
  'kpi': '/kpi',
  'decision': '/',
  'incident': '/incidents',
  'vulnerability': '/vulnerability',
  'asset': '/assets',
};

const MODULE_NAMES: Record<ChainNodeType, string> = {
  'business-objective': 'Executive Command Center',
  'risk': 'Risk Management',
  'control': 'Compliance (Controls)',
  'implementation': '3-Year Security Roadmap',
  'evidence': 'Compliance (Evidence)',
  'compliance': 'Compliance Management',
  'kpi': 'KPI Engine',
  'decision': 'Executive Command Center (Decisions)',
  'incident': 'Incident Management',
  'vulnerability': 'Vulnerability Management',
  'asset': 'Asset Management',
};

export default function WorkflowDrawer() {
  const { isOpen, activeType, activeId, openWorkflow, closeWorkflow } = useWorkflow();
  const { data: governanceData } = useGovernance();
  const navigate = useNavigate();

  const resolved = useMemo(() => {
    if (!activeType || !activeId) return null;
    return resolveChain(activeType, activeId, governanceData);
  }, [activeType, activeId, governanceData]);

  if (!isOpen || !activeType || !activeId || !resolved) return null;

  // Find the details of the currently selected/active node
  let activeNodeDetails: any = null;
  let activeNodeTitle = '';
  let activeNodeSubtitle = '';
  let activeNodeStatus = '';
  let activeNodeStatusColor = '';

  const allNodes = [
    ...(resolved.objective ? [resolved.objective] : []),
    ...resolved.risks,
    ...resolved.controls,
    ...resolved.implementations,
    ...resolved.evidences,
    ...resolved.compliance,
    ...resolved.kpis,
    ...resolved.decisions,
  ];

  const currentFocusedNode = allNodes.find(n => n.type === activeType && n.id === activeId);

  if (currentFocusedNode) {
    activeNodeDetails = currentFocusedNode.data;
    activeNodeTitle = currentFocusedNode.label;
    activeNodeSubtitle = currentFocusedNode.subtitle;
    activeNodeStatus = currentFocusedNode.status;
    activeNodeStatusColor = currentFocusedNode.statusColor;
  }

  const handleNodeClick = (type: ChainNodeType, id: string) => {
    openWorkflow(type, id);
  };

  const handleJumpToModule = () => {
    const route = MODULE_ROUTING[activeType];
    if (route) {
      navigate(route);
      closeWorkflow();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={closeWorkflow}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full w-[480px] sm:w-[540px] z-50 shadow-2xl flex flex-col transform transition-transform duration-300 animate-slide-right"
        style={{ background: 'var(--color-bg-surface)', borderLeft: '1px solid var(--color-border)' }}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <Layers size={18} style={{ color: 'var(--color-accent-blue)' }} />
            <h2 className="text-base font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-primary)' }}>
              Connected EISMS Workflow
            </h2>
          </div>
          <button
            onClick={closeWorkflow}
            className="p-1.5 rounded-lg transition-colors cursor-pointer"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-elevated)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Main Entity Summary Card */}
          <div className="rounded-xl p-4 border" style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--color-accent-blue)' }}>
                {activeType.replace('-', ' ')} • {activeId}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${activeNodeStatusColor}20`, color: activeNodeStatusColor }}>
                {activeNodeStatus}
              </span>
            </div>
            <h3 className="text-base font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>{activeNodeTitle}</h3>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{activeNodeSubtitle}</p>
          </div>

          {/* Workflow Chain Pipeline */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Pipeline Trace (Click any node to pivot)
            </h4>
            <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {CHAIN_STEPS.map((step) => {
                const stepKey = step.key;
                let stepNodes: any[] = [];
                if (stepKey === 'objective') {
                  stepNodes = resolved.objective ? [resolved.objective] : [];
                } else {
                  stepNodes = resolved[stepKey] || [];
                }


                return (
                  <div key={stepKey} className="relative pl-8">
                    {/* Circle Icon Indicator */}
                    <div
                      className="absolute left-2.5 top-1.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center bg-slate-900 transition-colors duration-300"
                      style={{
                        borderColor: stepNodes.length > 0 ? step.color : 'var(--color-border)',
                        boxShadow: stepNodes.some(n => n.type === activeType && n.id === activeId) ? `0 0 10px ${step.color}` : 'none'
                      }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: stepNodes.length > 0 ? step.color : 'transparent',
                        }}
                      />
                    </div>

                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: stepNodes.length > 0 ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                        <span className="flex items-center" style={{ color: stepNodes.length > 0 ? step.color : 'var(--color-text-muted)' }}>
                          {STEP_ICONS[stepKey]}
                        </span>
                        {step.label}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                        ({stepNodes.length} connected)
                      </span>
                    </div>

                    {stepNodes.length > 0 ? (
                      <div className="space-y-1.5">
                        {stepNodes.map((node) => {
                          const isCurrent = node.type === activeType && node.id === activeId;
                          return (
                            <div
                              key={node.id}
                              onClick={() => handleNodeClick(node.type, node.id)}
                              className="p-2.5 rounded-lg border cursor-pointer text-left transition-all"
                              style={{
                                borderColor: isCurrent ? 'var(--color-accent-blue)' : 'var(--color-border)',
                                background: isCurrent ? 'var(--color-bg-hover)' : 'var(--color-bg-surface)',
                                boxShadow: isCurrent ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none',
                              }}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-[10px] font-mono font-bold" style={{ color: isCurrent ? 'var(--color-accent-blue)' : 'var(--color-text-secondary)' }}>
                                  {node.id}
                                </span>
                                <span
                                  className="text-[9px] font-semibold px-1.5 py-0.25 rounded-full"
                                  style={{ background: `${node.statusColor}20`, color: node.statusColor }}
                                >
                                  {node.status}
                                </span>
                              </div>
                              <p className="text-xs font-semibold mt-1 truncate" style={{ color: 'var(--color-text-primary)' }}>
                                {node.label}
                              </p>
                              <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>
                                {node.subtitle}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[10px] italic" style={{ color: 'var(--color-text-muted)' }}>
                        No connected node resolved for this step
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Focused Node Detailed Properties */}
          {activeNodeDetails && (
            <div className="border-t pt-5" style={{ borderColor: 'var(--color-border)' }}>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                <Layers size={14} /> Node Specification Details
              </h4>
              <div className="rounded-xl p-4 space-y-3.5 text-xs" style={{ background: 'var(--color-bg-elevated)' }}>
                {/* Description */}
                {activeNodeDetails.description && (
                  <div>
                    <span className="font-semibold block mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>Description</span>
                    <p style={{ color: 'var(--color-text-primary)' }}>{activeNodeDetails.description}</p>
                  </div>
                )}

                {/* Specific Fields depending on Entity Type */}
                {activeType === 'business-objective' && (
                  <div className="grid grid-cols-2 gap-3 border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Initiative</span>
                      <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{activeNodeDetails.initiative}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Priority</span>
                      <span className="font-semibold text-red-400">{activeNodeDetails.priority}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Strategic Owner</span>
                      <span className="font-semibold">{activeNodeDetails.owner}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Target Completion</span>
                      <span className="font-semibold">{new Date(activeNodeDetails.targetDate).toLocaleDateString('en-GB')}</span>
                    </div>
                  </div>
                )}

                {activeType === 'risk' && (
                  <div className="grid grid-cols-2 gap-3 border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Risk Category</span>
                      <span className="font-semibold">{activeNodeDetails.category}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Risk Owner</span>
                      <span className="font-semibold">{activeNodeDetails.owner}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Inherent Score</span>
                      <span className="font-semibold text-red-500">{activeNodeDetails.inherentScore} (L:{activeNodeDetails.likelihood} × I:{activeNodeDetails.impact})</span>
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Residual Score</span>
                      <span className="font-semibold text-amber-500">{activeNodeDetails.residualScore}</span>
                    </div>
                    <div className="col-span-2 border-t pt-2 mt-1" style={{ borderColor: 'var(--color-border)' }}>
                      <span className="text-[10px] block mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Treatment Plan</span>
                      <div className="bg-slate-900/40 p-2 rounded border border-slate-800">
                        <p className="font-medium text-[11px]">{activeNodeDetails.treatmentPlan?.strategy} • {activeNodeDetails.treatmentPlan?.progress}% progress</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{activeNodeDetails.treatmentPlan?.description}</p>
                        <p className="text-[9px] mt-1 text-slate-400">Due: {activeNodeDetails.treatmentPlan?.dueDate}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeType === 'control' && (
                  <div className="grid grid-cols-2 gap-3 border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Control Type</span>
                      <span className="font-semibold">{activeNodeDetails.type}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Control Owner</span>
                      <span className="font-semibold">{activeNodeDetails.owner}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Effectiveness</span>
                      <span className="font-semibold text-emerald-400">{activeNodeDetails.effectiveness}% effective</span>
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Testing Frequency</span>
                      <span className="font-semibold">{activeNodeDetails.testFrequency}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Mapped Frameworks</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {activeNodeDetails.frameworks?.map((f: string, idx: number) => (
                          <span key={idx} className="bg-purple-500/10 text-purple-400 text-[9px] px-1.5 py-0.5 rounded border border-purple-500/20 font-medium">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeType === 'implementation' && (
                  <div className="grid grid-cols-2 gap-3 border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Lead Owner</span>
                      <span className="font-semibold">{activeNodeDetails.owner}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Roadmap Year</span>
                      <span className="font-semibold">Year {activeNodeDetails.roadmapYear}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Start Date</span>
                      <span className="font-semibold">{activeNodeDetails.startDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Deadline</span>
                      <span className="font-semibold">{activeNodeDetails.deadline}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Allocated Budget</span>
                      <span className="font-semibold text-emerald-400">IDR {(activeNodeDetails.budget?.allocated / 1e6).toFixed(0)}M</span>
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Spent Budget</span>
                      <span className="font-semibold text-blue-400 font-mono">IDR {(activeNodeDetails.budget?.spent / 1e6).toFixed(0)}M</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] block mb-1" style={{ color: 'var(--color-text-muted)' }}>Tasks ({activeNodeDetails.tasks?.length})</span>
                      <div className="space-y-1 bg-slate-900/30 p-2 rounded border border-slate-800">
                        {activeNodeDetails.tasks?.map((t: any) => (
                          <div key={t.id} className="flex items-center justify-between text-[10px]">
                            <span className="truncate max-w-[200px]" style={{ color: t.status === 'Done' ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}>
                              {t.status === 'Done' ? '✓' : '•'} {t.title}
                            </span>
                            <span className="font-mono text-[9px] text-slate-400">{t.assignee}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeType === 'evidence' && (
                  <div className="grid grid-cols-2 gap-3 border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Evidence Type</span>
                      <span className="font-semibold">{activeNodeDetails.type}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>File Size</span>
                      <span className="font-semibold font-mono">{activeNodeDetails.fileSize}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Uploaded By</span>
                      <span className="font-semibold">{activeNodeDetails.uploadedBy}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Upload Timestamp</span>
                      <span className="font-semibold text-[10px]">{new Date(activeNodeDetails.uploadedAt).toLocaleString('en-GB')}</span>
                    </div>
                  </div>
                )}

                {activeType === 'compliance' && (
                  <div className="grid grid-cols-2 gap-3 border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Regulation</span>
                      <span className="font-semibold text-purple-400">{activeNodeDetails.regulation}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Article / Section</span>
                      <span className="font-semibold">{activeNodeDetails.article}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Assigned Officer</span>
                      <span className="font-semibold">{activeNodeDetails.assignee}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Review Due Date</span>
                      <span className="font-semibold">{activeNodeDetails.dueDate}</span>
                    </div>
                    {activeNodeDetails.gapDescription && (
                      <div className="col-span-2 border-t pt-2 mt-1" style={{ borderColor: 'var(--color-border)' }}>
                        <span className="text-[10px] block text-red-400">Identified GAP</span>
                        <p className="text-[11px] font-medium" style={{ color: 'var(--color-text-primary)' }}>{activeNodeDetails.gapDescription}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeType === 'kpi' && (
                  <div className="grid grid-cols-2 gap-3 border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Category</span>
                      <span className="font-semibold">{activeNodeDetails.category}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Source Module</span>
                      <span className="font-semibold">{activeNodeDetails.sourceModule}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Current Metric Value</span>
                      <span className="font-semibold text-blue-400 font-mono text-sm">{activeNodeDetails.currentValue} {activeNodeDetails.unit}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Target Value</span>
                      <span className="font-semibold text-emerald-400 font-mono text-sm">{activeNodeDetails.targetValue} {activeNodeDetails.unit}</span>
                    </div>
                  </div>
                )}

                {activeType === 'decision' && (
                  <div className="grid grid-cols-2 gap-3 border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Decision Category</span>
                      <span className="font-semibold text-blue-400">{activeNodeDetails.type}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Authorized Signatory</span>
                      <span className="font-semibold">{activeNodeDetails.decidedBy}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Decision Date</span>
                      <span className="font-semibold">{activeNodeDetails.date}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>Priority</span>
                      <span className="font-semibold text-red-400">{activeNodeDetails.priority}</span>
                    </div>
                    <div className="col-span-2 border-t pt-2 mt-1" style={{ borderColor: 'var(--color-border)' }}>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>RATIONALE</span>
                      <p className="text-[11px] font-medium" style={{ color: 'var(--color-text-primary)' }}>{activeNodeDetails.rationale}</p>
                    </div>
                    {activeNodeDetails.conditions && activeNodeDetails.conditions.length > 0 && (
                      <div className="col-span-2">
                        <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>CONDITIONS & ASSURANCES</span>
                        <ul className="list-disc list-inside space-y-0.5 mt-1 text-[10px] text-slate-300">
                          {activeNodeDetails.conditions.map((cond: string, idx: number) => (
                            <li key={idx}>{cond}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Currently Viewing</span>
            <span className="text-[10px] font-semibold truncate max-w-[180px]" style={{ color: 'var(--color-text-secondary)' }}>
              {MODULE_NAMES[activeType]}
            </span>
          </div>
          <button
            onClick={handleJumpToModule}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-colors"
            style={{ background: 'var(--color-accent-blue)', color: 'white' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-accent-blue-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-accent-blue)'}
          >
            Jump to Module <ExternalLink size={12} />
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * Connected Workflow Engine
 * 
 * Resolves the EISMS chain in both directions:
 * Business Objective → Risk → Control → Implementation → Evidence → Compliance → KPI → Executive Decision
 * 
 * Given any entity ID, this engine finds every connected entity across the chain.
 */

import type {
  BusinessObjective, Risk, Control, Implementation, KPI,
  ExecutiveDecision, ComplianceRequirement, SecurityIncident,
  Evidence,
} from '@/types';

export type ChainNodeType =
  | 'business-objective'
  | 'risk'
  | 'control'
  | 'implementation'
  | 'evidence'
  | 'compliance'
  | 'kpi'
  | 'decision'
  | 'incident'
  | 'vulnerability'
  | 'asset';

export interface ChainNode {
  type: ChainNodeType;
  id: string;
  label: string;
  subtitle: string;
  status: string;
  statusColor: string;
  data: unknown;
}

export interface ResolvedChain {
  objective?: ChainNode;
  risks: ChainNode[];
  controls: ChainNode[];
  implementations: ChainNode[];
  evidences: ChainNode[];
  compliance: ChainNode[];
  kpis: ChainNode[];
  decisions: ChainNode[];
  incidents: ChainNode[];
  vulnerabilities: ChainNode[];
  assets: ChainNode[];
}

// ===== NODE BUILDERS =====

function buildObjectiveNode(obj: BusinessObjective): ChainNode {
  const statusColors: Record<string, string> = {
    'Planning': '#6B7280', 'In Progress': '#3B82F6', 'Completed': '#10B981',
    'Delayed': '#EF4444', 'At Risk': '#F59E0B',
  };
  return {
    type: 'business-objective', id: obj.id, label: obj.name,
    subtitle: `${obj.initiative} • ${obj.progress}% complete`,
    status: obj.status, statusColor: statusColors[obj.status] || '#6B7280', data: obj,
  };
}

function buildRiskNode(risk: Risk): ChainNode {
  const score = risk.residualScore;
  const statusColor = score >= 12 ? '#DC2626' : score >= 8 ? '#EA580C' : score >= 4 ? '#F59E0B' : '#10B981';
  return {
    type: 'risk', id: risk.id, label: risk.title,
    subtitle: `${risk.category} • Score: ${risk.inherentScore} → ${risk.residualScore}`,
    status: risk.status, statusColor, data: risk,
  };
}

function buildControlNode(ctl: Control): ChainNode {
  const statusColors: Record<string, string> = {
    'Implemented': '#10B981', 'Partially Implemented': '#F59E0B',
    'Planned': '#3B82F6', 'Not Implemented': '#EF4444',
  };
  return {
    type: 'control', id: ctl.id, label: ctl.name,
    subtitle: `${ctl.type} • ${ctl.effectiveness}% effective • ${ctl.frameworks.join(', ')}`,
    status: ctl.status, statusColor: statusColors[ctl.status] || '#6B7280', data: ctl,
  };
}

function buildImplementationNode(imp: Implementation): ChainNode {
  const statusColors: Record<string, string> = {
    'Not Started': '#6B7280', 'In Progress': '#3B82F6', 'Completed': '#10B981',
    'Blocked': '#EF4444', 'Overdue': '#DC2626',
  };
  const budget = imp.budget;
  const budgetStr = `IDR ${(budget.spent / 1e6).toFixed(0)}M / ${(budget.allocated / 1e6).toFixed(0)}M`;
  return {
    type: 'implementation', id: imp.id, label: imp.name,
    subtitle: `Year ${imp.roadmapYear} • ${imp.progress}% • ${budgetStr}`,
    status: imp.status, statusColor: statusColors[imp.status] || '#6B7280', data: imp,
  };
}

function buildEvidenceNode(ev: Evidence): ChainNode {
  const statusColors: Record<string, string> = {
    'Valid': '#10B981', 'Expired': '#EF4444', 'Pending Review': '#F59E0B',
  };
  return {
    type: 'evidence', id: ev.id, label: ev.name,
    subtitle: `${ev.type} • Uploaded by ${ev.uploadedBy} • ${ev.fileSize}`,
    status: ev.status, statusColor: statusColors[ev.status] || '#6B7280', data: ev,
  };
}

function buildComplianceNode(req: ComplianceRequirement): ChainNode {
  const statusColors: Record<string, string> = {
    'Compliant': '#10B981', 'Partially Compliant': '#F59E0B',
    'Non-Compliance': '#EF4444', 'Non-Compliant': '#EF4444', 'Not Assessed': '#6B7280',
  };
  return {
    type: 'compliance', id: req.id, label: req.title,
    subtitle: `${req.regulation} ${req.article} • ${req.progress}%`,
    status: req.status, statusColor: statusColors[req.status] || '#6B7280', data: req,
  };
}

function buildKPINode(kpi: KPI): ChainNode {
  const pct = (kpi.currentValue / kpi.targetValue) * 100;
  const statusColor = pct >= 100 ? '#10B981' : pct >= 80 ? '#3B82F6' : pct >= 60 ? '#F59E0B' : '#EF4444';
  const status = pct >= 100 ? 'On Target' : pct >= 80 ? 'Near Target' : pct >= 60 ? 'Warning' : 'Critical';
  return {
    type: 'kpi', id: kpi.id, label: kpi.name,
    subtitle: `${kpi.currentValue}${kpi.unit === '%' ? '%' : ' ' + kpi.unit} / ${kpi.targetValue}${kpi.unit === '%' ? '%' : ' ' + kpi.unit} • ${kpi.trend}`,
    status, statusColor, data: kpi,
  };
}

function buildDecisionNode(dec: ExecutiveDecision): ChainNode {
  const statusColors: Record<string, string> = {
    'Pending': '#F59E0B', 'Approved': '#10B981', 'Rejected': '#EF4444', 'Deferred': '#6B7280',
  };
  return {
    type: 'decision', id: dec.id, label: dec.title,
    subtitle: `${dec.type} • ${dec.decidedBy}`,
    status: dec.status, statusColor: statusColors[dec.status] || '#6B7280', data: dec,
  };
}

function buildIncidentNode(inc: SecurityIncident): ChainNode {
  const sevColors: Record<string, string> = {
    'Critical': '#DC2626', 'High': '#EA580C', 'Medium': '#D97706', 'Low': '#059669', 'Info': '#2563EB',
  };
  return {
    type: 'incident', id: inc.id, label: inc.title,
    subtitle: `${inc.severity} • ${inc.type} • ${inc.assignee}`,
    status: inc.status, statusColor: sevColors[inc.severity] || '#6B7280', data: inc,
  };
}
// ===== CHAIN RESOLUTION =====

/**
 * Given any entity type and ID, resolve the entire connected chain.
 */
export function resolveChain(type: ChainNodeType, id: string, data: any): ResolvedChain {
  const { businessObjectives = [], risks = [], controls = [], implementations = [], kpis = [], executiveDecisions = [], complianceRequirements = [], incidents = [], evidences = [] } = data;
  const chain: ResolvedChain = {
    risks: [], controls: [], implementations: [], evidences: [],
    compliance: [], kpis: [], decisions: [],
    incidents: [], vulnerabilities: [], assets: [],
  };

  switch (type) {
    case 'business-objective':
      return resolveFromObjective(id, data);
    case 'risk':
      return resolveFromRisk(id, data);
    case 'control':
      return resolveFromControl(id, data);
    case 'implementation':
      return resolveFromImplementation(id, data);
    case 'evidence':
      return resolveFromEvidence(id, data);
    case 'compliance':
      return resolveFromCompliance(id, data);
    case 'kpi':
      return resolveFromKPI(id, data);
    case 'decision':
      return resolveFromDecision(id, data);
    case 'incident':
      return resolveFromIncident(id, data);
    default:
      return chain;
  }
}

function resolveFromObjective(objId: string, data: any): ResolvedChain {
  const { businessObjectives = [], risks = [], controls = [], implementations = [], kpis = [], executiveDecisions = [], complianceRequirements = [], incidents = [], evidences = [] } = data;
  const obj = businessObjectives.find(o => o.id === objId);
  if (!obj) return emptyChain();

  const relatedRisks = risks.filter(r => obj.riskIds.includes(r.id));
  const relatedControlIds = relatedRisks.flatMap(r => r.controlIds);
  const relatedControls = controls.filter(c => relatedControlIds.includes(c.id));
  const relatedImpls = implementations.filter(i => relatedControls.some(c => c.implementationId === i.id));
  const relatedEvidences = evidences.filter(e => relatedControlIds.includes(e.controlId));
  const relatedCompliance = complianceRequirements.filter(cr => cr.controlIds.some(cid => relatedControlIds.includes(cid)));
  const relatedKPIs = kpis.filter(k => obj.kpiIds.includes(k.id));
  const relatedDecisions = executiveDecisions.filter(d => d.relatedObjectiveId === objId);
  const relatedIncidents = incidents.filter(inc => inc.relatedRiskIds.some(rid => obj.riskIds.includes(rid)));

  return {
    objective: buildObjectiveNode(obj),
    risks: relatedRisks.map(buildRiskNode),
    controls: relatedControls.map(buildControlNode),
    implementations: relatedImpls.map(buildImplementationNode),
    evidences: relatedEvidences.map(buildEvidenceNode),
    compliance: relatedCompliance.map(buildComplianceNode),
    kpis: relatedKPIs.map(buildKPINode),
    decisions: relatedDecisions.map(buildDecisionNode),
    incidents: relatedIncidents.map(buildIncidentNode),
    vulnerabilities: [],
    assets: [],
  };
}

function resolveFromRisk(riskId: string, data: any): ResolvedChain {
  const { businessObjectives = [], risks = [], controls = [], implementations = [], kpis = [], executiveDecisions = [], complianceRequirements = [], incidents = [], evidences = [] } = data;
  const risk = risks.find(r => r.id === riskId);
  if (!risk) return emptyChain();

  const obj = businessObjectives.find(o => o.riskIds.includes(riskId));
  const relatedControls = controls.filter(c => risk.controlIds.includes(c.id));
  const relatedImpls = implementations.filter(i => relatedControls.some(c => c.implementationId === i.id));
  const relatedEvidences = evidences.filter(e => risk.controlIds.includes(e.controlId));
  const relatedCompliance = complianceRequirements.filter(cr => cr.controlIds.some(cid => risk.controlIds.includes(cid)));
  const relatedKPIs = obj ? kpis.filter(k => obj.kpiIds.includes(k.id)) : [];
  const relatedDecisions = executiveDecisions.filter(d => d.relatedRiskIds.includes(riskId));
  const relatedIncidents = incidents.filter(inc => inc.relatedRiskIds.includes(riskId));

  return {
    objective: obj ? buildObjectiveNode(obj) : undefined,
    risks: [buildRiskNode(risk)],
    controls: relatedControls.map(buildControlNode),
    implementations: relatedImpls.map(buildImplementationNode),
    evidences: relatedEvidences.map(buildEvidenceNode),
    compliance: relatedCompliance.map(buildComplianceNode),
    kpis: relatedKPIs.map(buildKPINode),
    decisions: relatedDecisions.map(buildDecisionNode),
    incidents: relatedIncidents.map(buildIncidentNode),
    vulnerabilities: [],
    assets: [],
  };
}

function resolveFromControl(ctlId: string, data: any): ResolvedChain {
  const { businessObjectives = [], risks = [], controls = [], implementations = [], kpis = [], executiveDecisions = [], complianceRequirements = [], incidents = [], evidences = [] } = data;
  const ctl = controls.find(c => c.id === ctlId);
  if (!ctl) return emptyChain();

  const risk = risks.find(r => r.controlIds.includes(ctlId));
  const obj = risk ? businessObjectives.find(o => o.riskIds.includes(risk.id)) : undefined;
  const impl = implementations.find(i => i.id === ctl.implementationId);
  const relatedEvidences = evidences.filter(e => e.controlId === ctlId);
  const relatedCompliance = complianceRequirements.filter(cr => cr.controlIds.includes(ctlId));
  const relatedKPIs = obj ? kpis.filter(k => obj.kpiIds.includes(k.id)) : [];
  const relatedDecisions = obj ? executiveDecisions.filter(d => d.relatedObjectiveId === obj.id) : [];

  return {
    objective: obj ? buildObjectiveNode(obj) : undefined,
    risks: risk ? [buildRiskNode(risk)] : [],
    controls: [buildControlNode(ctl)],
    implementations: impl ? [buildImplementationNode(impl)] : [],
    evidences: relatedEvidences.map(buildEvidenceNode),
    compliance: relatedCompliance.map(buildComplianceNode),
    kpis: relatedKPIs.map(buildKPINode),
    decisions: relatedDecisions.map(buildDecisionNode),
    incidents: [],
    vulnerabilities: [],
    assets: [],
  };
}

function resolveFromImplementation(impId: string, data: any): ResolvedChain {
  const { businessObjectives = [], risks = [], controls = [], implementations = [], kpis = [], executiveDecisions = [], complianceRequirements = [], incidents = [], evidences = [] } = data;
  const impl = implementations.find(i => i.id === impId);
  if (!impl) return emptyChain();

  const ctl = controls.find(c => c.implementationId === impId);
  const risk = ctl ? risks.find(r => r.controlIds.includes(ctl.id)) : undefined;
  const obj = risk ? businessObjectives.find(o => o.riskIds.includes(risk.id)) : undefined;
  const relatedEvidences = ctl ? evidences.filter(e => e.controlId === ctl.id) : [];
  const relatedCompliance = ctl ? complianceRequirements.filter(cr => cr.controlIds.includes(ctl.id)) : [];
  const relatedKPIs = obj ? kpis.filter(k => obj.kpiIds.includes(k.id)) : [];

  return {
    objective: obj ? buildObjectiveNode(obj) : undefined,
    risks: risk ? [buildRiskNode(risk)] : [],
    controls: ctl ? [buildControlNode(ctl)] : [],
    implementations: [buildImplementationNode(impl)],
    evidences: relatedEvidences.map(buildEvidenceNode),
    compliance: relatedCompliance.map(buildComplianceNode),
    kpis: relatedKPIs.map(buildKPINode),
    decisions: [],
    incidents: [],
    vulnerabilities: [],
    assets: [],
  };
}

function resolveFromEvidence(evId: string, data: any): ResolvedChain {
  const { businessObjectives = [], risks = [], controls = [], implementations = [], kpis = [], executiveDecisions = [], complianceRequirements = [], incidents = [], evidences = [] } = data;
  const ev = evidences.find(e => e.id === evId);
  if (!ev) return emptyChain();

  const ctl = controls.find(c => c.id === ev.controlId);
  const risk = ctl ? risks.find(r => r.controlIds.includes(ctl.id)) : undefined;
  const obj = risk ? businessObjectives.find(o => o.riskIds.includes(risk.id)) : undefined;
  const impl = ctl ? implementations.find(i => i.id === ctl.implementationId) : undefined;
  const relatedCompliance = ctl ? complianceRequirements.filter(cr => cr.controlIds.includes(ctl.id)) : [];
  const relatedKPIs = obj ? kpis.filter(k => obj.kpiIds.includes(k.id)) : [];
  const relatedDecisions = obj ? executiveDecisions.filter(d => d.relatedObjectiveId === obj.id) : [];

  return {
    objective: obj ? buildObjectiveNode(obj) : undefined,
    risks: risk ? [buildRiskNode(risk)] : [],
    controls: ctl ? [buildControlNode(ctl)] : [],
    implementations: impl ? [buildImplementationNode(impl)] : [],
    evidences: [buildEvidenceNode(ev)],
    compliance: relatedCompliance.map(buildComplianceNode),
    kpis: relatedKPIs.map(buildKPINode),
    decisions: relatedDecisions.map(buildDecisionNode),
    incidents: [],
    vulnerabilities: [],
    assets: [],
  };
}

function resolveFromCompliance(reqId: string, data: any): ResolvedChain {
  const { businessObjectives = [], risks = [], controls = [], implementations = [], kpis = [], executiveDecisions = [], complianceRequirements = [], incidents = [], evidences = [] } = data;
  const req = complianceRequirements.find(cr => cr.id === reqId);
  if (!req) return emptyChain();

  const relatedControls = controls.filter(c => req.controlIds.includes(c.id));
  const relatedRisks = risks.filter(r => relatedControls.some(c => r.controlIds.includes(c.id)));
  const relatedImpls = implementations.filter(i => relatedControls.some(c => c.implementationId === i.id));
  const relatedEvidences = evidences.filter(e => req.controlIds.includes(e.controlId));
  const relatedObjectives = businessObjectives.filter(o => relatedRisks.some(r => o.riskIds.includes(r.id)));

  return {
    objective: relatedObjectives.length > 0 ? buildObjectiveNode(relatedObjectives[0]) : undefined,
    risks: relatedRisks.map(buildRiskNode),
    controls: relatedControls.map(buildControlNode),
    implementations: relatedImpls.map(buildImplementationNode),
    evidences: relatedEvidences.map(buildEvidenceNode),
    compliance: [buildComplianceNode(req)],
    kpis: [],
    decisions: [],
    incidents: [],
    vulnerabilities: [],
    assets: [],
  };
}

function resolveFromKPI(kpiId: string, data: any): ResolvedChain {
  const { businessObjectives = [], risks = [], controls = [], implementations = [], kpis = [], executiveDecisions = [], complianceRequirements = [], incidents = [], evidences = [] } = data;
  const kpi = kpis.find(k => k.id === kpiId);
  if (!kpi) return emptyChain();

  const obj = businessObjectives.find(o => o.kpiIds.includes(kpiId));
  const relatedRisks = obj ? risks.filter(r => obj.riskIds.includes(r.id)) : [];
  const relatedControlIds = relatedRisks.flatMap(r => r.controlIds);
  const relatedControls = controls.filter(c => relatedControlIds.includes(c.id));
  const relatedEvidences = evidences.filter(e => relatedControlIds.includes(e.controlId));

  return {
    objective: obj ? buildObjectiveNode(obj) : undefined,
    risks: relatedRisks.map(buildRiskNode),
    controls: relatedControls.map(buildControlNode),
    implementations: [],
    evidences: relatedEvidences.map(buildEvidenceNode),
    compliance: [],
    kpis: [buildKPINode(kpi)],
    decisions: [],
    incidents: [],
    vulnerabilities: [],
    assets: [],
  };
}

function resolveFromDecision(decId: string, data: any): ResolvedChain {
  const { businessObjectives = [], risks = [], controls = [], implementations = [], kpis = [], executiveDecisions = [], complianceRequirements = [], incidents = [], evidences = [] } = data;
  const dec = executiveDecisions.find(d => d.id === decId);
  if (!dec) return emptyChain();

  const obj = businessObjectives.find(o => o.id === dec.relatedObjectiveId);
  const relatedRisks = risks.filter(r => dec.relatedRiskIds.includes(r.id));
  const relatedControlIds = relatedRisks.flatMap(r => r.controlIds);
  const relatedControls = controls.filter(c => relatedControlIds.includes(c.id));
  const relatedEvidences = evidences.filter(e => relatedControlIds.includes(e.controlId));
  const relatedKPIs = obj ? kpis.filter(k => obj.kpiIds.includes(k.id)) : [];

  return {
    objective: obj ? buildObjectiveNode(obj) : undefined,
    risks: relatedRisks.map(buildRiskNode),
    controls: relatedControls.map(buildControlNode),
    implementations: [],
    evidences: relatedEvidences.map(buildEvidenceNode),
    compliance: [],
    kpis: relatedKPIs.map(buildKPINode),
    decisions: [buildDecisionNode(dec)],
    incidents: [],
    vulnerabilities: [],
    assets: [],
  };
}

function resolveFromIncident(incId: string, data: any): ResolvedChain {
  const { businessObjectives = [], risks = [], controls = [], implementations = [], kpis = [], executiveDecisions = [], complianceRequirements = [], incidents = [], evidences = [] } = data;
  const inc = incidents.find(i => i.id === incId);
  if (!inc) return emptyChain();

  const relatedRisks = risks.filter(r => inc.relatedRiskIds.includes(r.id));
  const relatedControlIds = relatedRisks.flatMap(r => r.controlIds);
  const relatedControls = controls.filter(c => relatedControlIds.includes(c.id));
  const relatedImpls = implementations.filter(i => relatedControls.some(c => c.implementationId === i.id));
  const relatedEvidences = evidences.filter(e => relatedControlIds.includes(e.controlId));
  const relatedObjectives = businessObjectives.filter(o => relatedRisks.some(r => o.riskIds.includes(r.id)));

  return {
    objective: relatedObjectives.length > 0 ? buildObjectiveNode(relatedObjectives[0]) : undefined,
    risks: relatedRisks.map(buildRiskNode),
    controls: relatedControls.map(buildControlNode),
    implementations: relatedImpls.map(buildImplementationNode),
    evidences: relatedEvidences.map(buildEvidenceNode),
    compliance: [],
    kpis: [],
    decisions: [],
    incidents: [buildIncidentNode(inc)],
    vulnerabilities: [],
    assets: [],
  };
}

function emptyChain(): ResolvedChain {
  return {
    risks: [], controls: [], implementations: [], evidences: [],
    compliance: [], kpis: [], decisions: [],
    incidents: [], vulnerabilities: [], assets: [],
  };
}

// ===== CHAIN STEP DEFINITIONS =====

export const CHAIN_STEPS = [
  { key: 'objective', label: 'Business Objective', color: 'var(--color-accent-blue)' },
  { key: 'risks', label: 'Risk', color: 'var(--color-accent-red)' },
  { key: 'controls', label: 'Control', color: 'var(--color-accent-purple)' },
  { key: 'implementations', label: 'Implementation', color: 'var(--color-accent-cyan)' },
  { key: 'evidences', label: 'Evidence', color: 'var(--color-accent-emerald)' },
  { key: 'compliance', label: 'Compliance', color: 'var(--color-accent-purple)' },
  { key: 'kpis', label: 'KPI', color: 'var(--color-accent-amber)' },
  { key: 'decisions', label: 'Executive Decision', color: 'var(--color-accent-pink)' },
] as const;

export type ChainStepKey = typeof CHAIN_STEPS[number]['key'];

/**
 * Get a flat ordered list of all nodes in the chain for display.
 */
export function getChainStepNodes(chain: ResolvedChain): { step: typeof CHAIN_STEPS[number]; nodes: ChainNode[] }[] {
  return CHAIN_STEPS.map(step => {
    let nodes: ChainNode[] = [];
    if (step.key === 'objective') {
      nodes = chain.objective ? [chain.objective] : [];
    } else {
      nodes = chain[step.key] as ChainNode[];
    }
    return { step, nodes };
  }).filter(s => s.nodes.length > 0);
}

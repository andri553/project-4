/* ===== SECURENUSA EISMS — TypeScript Type Definitions ===== */

// ===== ENUMS & CONSTANTS =====

export type SatuNusaInitiative = 'Cross-Border QRIS' | 'Micro Insurance' | 'BPR Digital Savings';

export type RiskCategory =
  | 'Cybersecurity'
  | 'Data Privacy'
  | 'Regulatory'
  | 'Operational'
  | 'Third Party'
  | 'Technology'
  | 'Financial'
  | 'Reputational';

export type RiskStatus =
  | 'Identified'
  | 'Assessed'
  | 'Mitigated'
  | 'Accepted'
  | 'Transferred'
  | 'Closed';

export type ControlType = 'Preventive' | 'Detective' | 'Corrective' | 'Compensating';

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';

export type IncidentStatus =
  | 'New'
  | 'Triage'
  | 'Investigation'
  | 'Containment'
  | 'Eradication'
  | 'Recovery'
  | 'Post-Incident'
  | 'Closed';

export type ComplianceStatus = 'Compliant' | 'Partially Compliant' | 'Non-Compliant' | 'Not Assessed';

export type DocumentStatus = 'Draft' | 'In Review' | 'Approved' | 'Published' | 'Retired';

export type AssetCategory = 'Server' | 'Database' | 'Cloud Resource' | 'API' | 'Application' | 'Employee Device';

export type DataClassification = 'Public' | 'Internal' | 'Confidential' | 'Restricted';

export type TrendDirection = 'improving' | 'stable' | 'declining';

export type RoadmapYear = 1 | 2 | 3;

export type ThemeMode = 'light' | 'mature-dark';

// ===== USER & RBAC =====

export type UserRole =
  | 'super_admin'
  | 'ciso'
  | 'soc_analyst'
  | 'compliance_officer'
  | 'risk_manager'
  | 'it_infrastructure'
  | 'dev_team';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  department: string;
  title: string;
  lastLogin: string;
  mfaEnabled: boolean;
  status: 'Active' | 'Inactive' | 'Locked';
}

export interface Permission {
  module: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
}

// ===== CORE EISMS DATA CHAIN =====

export interface BusinessObjective {
  id: string;
  name: string;
  description: string;
  initiative: SatuNusaInitiative;
  owner: string;
  targetDate: string;
  status: 'Planning' | 'In Progress' | 'Completed' | 'Delayed' | 'At Risk';
  progress: number;
  riskIds: string[];
  kpiIds: string[];
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  businessObjectiveId: string;
  category: RiskCategory;
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  inherentScore: number;
  residualScore: number;
  owner: string;
  controlIds: string[];
  status: RiskStatus;
  treatmentPlan: TreatmentPlan;
  dateIdentified: string;
  lastReviewDate: string;
}

export interface TreatmentPlan {
  strategy: 'Mitigate' | 'Accept' | 'Transfer' | 'Avoid';
  description: string;
  dueDate: string;
  progress: number;
}

export interface Control {
  id: string;
  name: string;
  description: string;
  riskId: string;
  frameworks: string[];
  type: ControlType;
  implementationId: string;
  effectiveness: number;
  lastTested: string;
  testFrequency: 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual';
  evidenceIds: string[];
  owner: string;
  status: 'Implemented' | 'Partially Implemented' | 'Planned' | 'Not Implemented';
}

export interface Implementation {
  id: string;
  controlId: string;
  name: string;
  description: string;
  tasks: ImplementationTask[];
  progress: number;
  owner: string;
  startDate: string;
  deadline: string;
  budget: Budget;
  roadmapYear: RoadmapYear;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Blocked' | 'Overdue';
}

export interface ImplementationTask {
  id: string;
  title: string;
  assignee: string;
  status: 'To Do' | 'In Progress' | 'Done' | 'Blocked';
  dueDate: string;
}

export interface Budget {
  allocated: number;
  spent: number;
  currency: string;
}

export interface KPI {
  id: string;
  name: string;
  description: string;
  businessObjectiveId: string;
  category: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  trend: TrendDirection;
  trendData: number[];
  thresholds: {
    critical: number;
    warning: number;
    good: number;
  };
  sourceModule: string;
  lastUpdated: string;
}

export interface ExecutiveDecision {
  id: string;
  type: 'Approval' | 'Rejection' | 'Escalation' | 'Risk Acceptance' | 'Budget Allocation' | 'Policy Change';
  title: string;
  description: string;
  relatedObjectiveId: string;
  relatedRiskIds: string[];
  decidedBy: string;
  rationale: string;
  conditions: string[];
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Deferred';
  priority: Severity;
}

// ===== MODULE-SPECIFIC TYPES =====

export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: IncidentStatus;
  type: string;
  affectedAssetIds: string[];
  assignee: string;
  reporter: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  timeline: IncidentEvent[];
  rootCause?: string;
  lessonsLearned?: string;
  relatedRiskIds: string[];
}

export interface IncidentEvent {
  timestamp: string;
  action: string;
  actor: string;
  details: string;
}

export interface Vulnerability {
  id: string;
  title: string;
  description: string;
  cveId?: string;
  cvssScore: number;
  severity: Severity;
  affectedAssetId: string;
  status: 'Open' | 'In Progress' | 'Remediated' | 'Accepted' | 'False Positive';
  discoveredDate: string;
  slaDeadline: string;
  patchAvailable: boolean;
  assignee: string;
  remediationNotes?: string;
}

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  description: string;
  owner: string;
  department: string;
  classification: DataClassification;
  riskLevel: Severity;
  status: 'Active' | 'Maintenance' | 'Decommissioned';
  ipAddress?: string;
  location: string;
  vulnerabilityCount: number;
  lastScanDate: string;
  complianceStatus: ComplianceStatus;
}

export interface ComplianceRequirement {
  id: string;
  regulation: string;
  article: string;
  title: string;
  description: string;
  category: string;
  status: ComplianceStatus;
  controlIds: string[];
  evidenceIds: string[];
  gapDescription?: string;
  dueDate: string;
  assignee: string;
  progress: number;
}

export interface Evidence {
  id: string;
  name: string;
  type: 'Document' | 'Screenshot' | 'Log' | 'Certificate' | 'Report';
  controlId: string;
  requirementId?: string;
  uploadedBy: string;
  uploadedAt: string;
  fileSize: string;
  status: 'Valid' | 'Expired' | 'Pending Review';
}

export interface GovernanceDocument {
  id: string;
  title: string;
  type: 'Policy' | 'Standard' | 'Procedure' | 'Guideline';
  version: string;
  status: DocumentStatus;
  owner: string;
  approver: string;
  createdDate: string;
  lastModified: string;
  nextReviewDate: string;
  relatedControlIds: string[];
  description: string;
}

export interface RoadmapInitiative {
  id: string;
  name: string;
  description: string;
  year: RoadmapYear;
  quarter: string;
  category: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Delayed';
  progress: number;
  owner: string;
  budget: Budget;
  milestones: Milestone[];
  implementationIds: string[];
  dependencies: string[];
}

export interface Milestone {
  id: string;
  name: string;
  targetDate: string;
  status: 'Upcoming' | 'Completed' | 'Overdue';
}

export interface AuditRecord {
  id: string;
  type: 'Internal' | 'External';
  title: string;
  scope: string;
  auditor: string;
  status: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';
  startDate: string;
  endDate: string;
  findingsCount: number;
  criticalFindings: number;
  correctiveActions: CorrectiveAction[];
}

export interface CorrectiveAction {
  id: string;
  finding: string;
  action: string;
  owner: string;
  dueDate: string;
  status: 'Open' | 'In Progress' | 'Completed' | 'Overdue';
  priority: Severity;
}

export interface TrainingProgram {
  id: string;
  name: string;
  description: string;
  type: 'Course' | 'Phishing Simulation' | 'Quiz' | 'Workshop';
  targetAudience: string;
  completionRate: number;
  totalParticipants: number;
  completedParticipants: number;
  dueDate: string;
  status: 'Active' | 'Completed' | 'Scheduled';
}

export interface DataProtectionRecord {
  id: string;
  dataCategory: string;
  classification: DataClassification;
  storageLocation: string;
  encryptionStatus: 'Encrypted' | 'Partially Encrypted' | 'Not Encrypted';
  encryptionType?: string;
  retentionPeriod: string;
  backupStatus: 'Active' | 'Inactive' | 'Partial';
  dataOwner: string;
  accessControlled: boolean;
  piaCompleted: boolean;
}

// ===== NAVIGATION & UI =====

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  roles: UserRole[];
  children?: NavItem[];
  badge?: number;
  badgeType?: 'danger' | 'warning' | 'info';
}

export interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

// ===== CHART & WIDGET TYPES =====

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TrendData {
  labels: string[];
  datasets: {
    name: string;
    data: number[];
    color: string;
  }[];
}

export interface SecurityMaturity {
  identify: number;
  protect: number;
  detect: number;
  respond: number;
  recover: number;
}

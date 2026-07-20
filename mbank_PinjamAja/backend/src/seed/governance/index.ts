import type {
  BusinessObjective, Risk, Control, Implementation, KPI,
  ExecutiveDecision, SecurityIncident, Vulnerability, Asset,
  ComplianceRequirement, GovernanceDocument, RoadmapInitiative,
  AuditRecord, TrainingProgram, DataProtectionRecord, SecurityMaturity,
  Evidence,
} from '../../types/governance';

// ===== SECURITY MATURITY (NIST CSF) =====
export const securityMaturity: SecurityMaturity = {
  identify: 72,
  protect: 68,
  detect: 61,
  respond: 55,
  recover: 48,
};

// ===== BUSINESS OBJECTIVES (SatuNusa) =====
export const businessObjectives: BusinessObjective[] = [
  {
    id: 'BO-001',
    name: 'Cross-Border QRIS Payment Security',
    description: 'Ensure all cross-border QRIS payment flows comply with PADG 23/21 security standards and achieve end-to-end encryption for FX settlements.',
    initiative: 'Cross-Border QRIS',
    owner: 'Budi Santoso, CISSP',
    targetDate: '2026-09-30',
    status: 'In Progress',
    progress: 67,
    riskIds: ['R-001', 'R-002', 'R-003'],
    kpiIds: ['KPI-001', 'KPI-002', 'KPI-003'],
    priority: 'Critical',
  },
  {
    id: 'BO-002',
    name: 'Micro Insurance Data Protection',
    description: 'Implement comprehensive data protection controls for micro insurance user data, ensuring UU PDP compliance for sensitive health and financial data.',
    initiative: 'Micro Insurance',
    owner: 'Fajar Hidayat, CISA',
    targetDate: '2026-12-31',
    status: 'In Progress',
    progress: 42,
    riskIds: ['R-004', 'R-005'],
    kpiIds: ['KPI-004', 'KPI-005'],
    priority: 'High',
  },
  {
    id: 'BO-003',
    name: 'BPR Digital Savings Security Architecture',
    description: 'Design and implement security architecture for BPR digital savings integration, meeting OJK POJK 10/2022 requirements for biometric authentication and transaction security.',
    initiative: 'BPR Digital Savings',
    owner: 'Budi Santoso, CISSP',
    targetDate: '2027-03-31',
    status: 'Planning',
    progress: 18,
    riskIds: ['R-006', 'R-007'],
    kpiIds: ['KPI-006', 'KPI-007'],
    priority: 'High',
  },
];

// ===== RISKS =====
export const risks: Risk[] = [
  {
    id: 'R-001',
    title: 'Payment data interception during cross-border FX settlement',
    description: 'Man-in-the-middle attack risk on QRIS payment data during cross-border foreign exchange settlement process.',
    businessObjectiveId: 'BO-001',
    category: 'Cybersecurity',
    likelihood: 3,
    impact: 5,
    inherentScore: 15,
    residualScore: 6,
    owner: 'Hendra Wijaya',
    controlIds: ['CTL-001', 'CTL-002'],
    status: 'Mitigated',
    treatmentPlan: { strategy: 'Mitigate', description: 'Deploy mutual TLS 1.3 and certificate pinning on all QRIS gateway connections.', dueDate: '2026-08-15', progress: 75 },
    dateIdentified: '2026-01-15',
    lastReviewDate: '2026-06-20',
  },
  {
    id: 'R-002',
    title: 'Unauthorized access to QRIS merchant settlement data',
    description: 'Risk of unauthorized internal or external access to merchant settlement records and transaction logs.',
    businessObjectiveId: 'BO-001',
    category: 'Data Privacy',
    likelihood: 2,
    impact: 4,
    inherentScore: 8,
    residualScore: 4,
    owner: 'Dewi Anggraeni',
    controlIds: ['CTL-003'],
    status: 'Mitigated',
    treatmentPlan: { strategy: 'Mitigate', description: 'Implement RBAC with MFA and comprehensive audit logging.', dueDate: '2026-07-30', progress: 90 },
    dateIdentified: '2026-02-01',
    lastReviewDate: '2026-06-18',
  },
  {
    id: 'R-003',
    title: 'Non-compliance with Bank Indonesia PADG 23/21',
    description: 'Failure to meet BI regulatory requirements for cross-border QRIS payment processing security standards.',
    businessObjectiveId: 'BO-001',
    category: 'Regulatory',
    likelihood: 2,
    impact: 5,
    inherentScore: 10,
    residualScore: 4,
    owner: 'Fajar Hidayat, CISA',
    controlIds: ['CTL-004', 'CTL-005'],
    status: 'Assessed',
    treatmentPlan: { strategy: 'Mitigate', description: 'Complete regulatory mapping and implement all required security controls per PADG 23/21.', dueDate: '2026-09-01', progress: 55 },
    dateIdentified: '2026-01-20',
    lastReviewDate: '2026-06-22',
  },
  {
    id: 'R-004',
    title: 'Insurance policyholder PII data breach',
    description: 'Risk of personal identifiable information leakage for micro insurance policyholders including health data.',
    businessObjectiveId: 'BO-002',
    category: 'Data Privacy',
    likelihood: 3,
    impact: 5,
    inherentScore: 15,
    residualScore: 8,
    owner: 'Budi Santoso, CISSP',
    controlIds: ['CTL-006', 'CTL-007'],
    status: 'Assessed',
    treatmentPlan: { strategy: 'Mitigate', description: 'Implement AES-256 encryption at rest and tokenization for sensitive health data.', dueDate: '2026-10-31', progress: 35 },
    dateIdentified: '2026-03-10',
    lastReviewDate: '2026-06-15',
  },
  {
    id: 'R-005',
    title: 'UU PDP non-compliance for insurance data processing',
    description: 'Failure to obtain proper consent and implement data subject rights for insurance data processing under Indonesia PDP Law.',
    businessObjectiveId: 'BO-002',
    category: 'Regulatory',
    likelihood: 3,
    impact: 4,
    inherentScore: 12,
    residualScore: 6,
    owner: 'Fajar Hidayat, CISA',
    controlIds: ['CTL-008'],
    status: 'Identified',
    treatmentPlan: { strategy: 'Mitigate', description: 'Develop consent management framework and data subject rights portal.', dueDate: '2026-11-30', progress: 20 },
    dateIdentified: '2026-04-05',
    lastReviewDate: '2026-06-10',
  },
  {
    id: 'R-006',
    title: 'BPR API integration security vulnerabilities',
    description: 'Security vulnerabilities in API integration layer between PinjamAJA and BPR banking core systems.',
    businessObjectiveId: 'BO-003',
    category: 'Technology',
    likelihood: 4,
    impact: 4,
    inherentScore: 16,
    residualScore: 10,
    owner: 'Sari Maharani',
    controlIds: ['CTL-009'],
    status: 'Identified',
    treatmentPlan: { strategy: 'Mitigate', description: 'Implement API gateway with WAF, rate limiting, and comprehensive input validation.', dueDate: '2027-01-31', progress: 10 },
    dateIdentified: '2026-05-15',
    lastReviewDate: '2026-06-20',
  },
  {
    id: 'R-007',
    title: 'Biometric data storage non-compliance with POJK 10/2022',
    description: 'Risk of non-compliance with OJK biometric data storage and processing requirements.',
    businessObjectiveId: 'BO-003',
    category: 'Regulatory',
    likelihood: 3,
    impact: 5,
    inherentScore: 15,
    residualScore: 9,
    owner: 'Fajar Hidayat, CISA',
    controlIds: ['CTL-010'],
    status: 'Identified',
    treatmentPlan: { strategy: 'Mitigate', description: 'Implement certified biometric template storage with ISO 30107-3 compliance.', dueDate: '2027-02-28', progress: 5 },
    dateIdentified: '2026-05-20',
    lastReviewDate: '2026-06-18',
  },
  {
    id: 'R-008',
    title: 'Third-party payment gateway compromise',
    description: 'Supply chain risk from third-party payment gateway providers used in QRIS processing.',
    businessObjectiveId: 'BO-001',
    category: 'Third Party',
    likelihood: 2,
    impact: 5,
    inherentScore: 10,
    residualScore: 5,
    owner: 'Hendra Wijaya',
    controlIds: ['CTL-001'],
    status: 'Mitigated',
    treatmentPlan: { strategy: 'Transfer', description: 'Negotiate security SLAs with payment gateway vendors and obtain SOC 2 Type II reports.', dueDate: '2026-08-30', progress: 60 },
    dateIdentified: '2026-02-10',
    lastReviewDate: '2026-06-22',
  },
];

// ===== CONTROLS =====
export const controls: Control[] = [
  {
    id: 'CTL-001', name: 'End-to-end TLS 1.3 encryption for QRIS transactions', description: 'Enforce TLS 1.3 with certificate pinning on all QRIS payment gateway connections.', riskId: 'R-001', frameworks: ['ISO 27001 A.10.1', 'PADG 23/21 §5.2'], type: 'Preventive', implementationId: 'IMP-001', effectiveness: 92, lastTested: '2026-06-15', testFrequency: 'Monthly', evidenceIds: ['EV-001'], owner: 'Hendra Wijaya', status: 'Implemented',
  },
  {
    id: 'CTL-002', name: 'Network segmentation for payment processing', description: 'Isolate QRIS payment processing in a dedicated VLAN with firewall rules.', riskId: 'R-001', frameworks: ['ISO 27001 A.13.1', 'PADG 23/21 §5.4'], type: 'Preventive', implementationId: 'IMP-002', effectiveness: 88, lastTested: '2026-06-10', testFrequency: 'Quarterly', evidenceIds: ['EV-002'], owner: 'Hendra Wijaya', status: 'Implemented',
  },
  {
    id: 'CTL-003', name: 'RBAC with MFA for settlement data access', description: 'Multi-factor authentication and role-based access control for merchant settlement data.', riskId: 'R-002', frameworks: ['ISO 27001 A.9.2', 'POJK 10/2022 §3.1'], type: 'Preventive', implementationId: 'IMP-003', effectiveness: 95, lastTested: '2026-06-20', testFrequency: 'Monthly', evidenceIds: ['EV-003'], owner: 'Dewi Anggraeni', status: 'Implemented',
  },
  {
    id: 'CTL-004', name: 'BI regulatory compliance monitoring', description: 'Automated compliance monitoring against PADG 23/21 requirements.', riskId: 'R-003', frameworks: ['PADG 23/21 §4', 'PADG 23/21 §6'], type: 'Detective', implementationId: 'IMP-004', effectiveness: 72, lastTested: '2026-05-30', testFrequency: 'Monthly', evidenceIds: ['EV-004'], owner: 'Fajar Hidayat, CISA', status: 'Partially Implemented',
  },
  {
    id: 'CTL-005', name: 'Cross-border transaction audit trail', description: 'Complete audit logging for all cross-border QRIS transactions.', riskId: 'R-003', frameworks: ['PADG 23/21 §7.1', 'ISO 27001 A.12.4'], type: 'Detective', implementationId: 'IMP-005', effectiveness: 85, lastTested: '2026-06-18', testFrequency: 'Monthly', evidenceIds: ['EV-005'], owner: 'Dewi Anggraeni', status: 'Implemented',
  },
  {
    id: 'CTL-006', name: 'AES-256 encryption at rest for policyholder data', description: 'Encrypt all insurance policyholder personal data at rest using AES-256.', riskId: 'R-004', frameworks: ['UU PDP §34', 'ISO 27001 A.10.1'], type: 'Preventive', implementationId: 'IMP-006', effectiveness: 60, lastTested: '2026-06-01', testFrequency: 'Quarterly', evidenceIds: [], owner: 'Hendra Wijaya', status: 'Partially Implemented',
  },
  {
    id: 'CTL-007', name: 'Data tokenization for sensitive health records', description: 'Tokenize sensitive health-related fields in insurance applications.', riskId: 'R-004', frameworks: ['UU PDP §35', 'ISO 27001 A.10.1'], type: 'Preventive', implementationId: 'IMP-007', effectiveness: 40, lastTested: '2026-05-15', testFrequency: 'Quarterly', evidenceIds: [], owner: 'Sari Maharani', status: 'Planned',
  },
  {
    id: 'CTL-008', name: 'Consent management framework', description: 'Digital consent collection and management for insurance data processing.', riskId: 'R-005', frameworks: ['UU PDP §20', 'UU PDP §21', 'UU PDP §22'], type: 'Preventive', implementationId: 'IMP-008', effectiveness: 30, lastTested: '2026-04-20', testFrequency: 'Monthly', evidenceIds: [], owner: 'Fajar Hidayat, CISA', status: 'Planned',
  },
  {
    id: 'CTL-009', name: 'API gateway with WAF protection', description: 'Deploy API gateway with web application firewall for BPR integration endpoints.', riskId: 'R-006', frameworks: ['ISO 27001 A.14.1', 'POJK 10/2022 §4.3'], type: 'Preventive', implementationId: 'IMP-009', effectiveness: 15, lastTested: '2026-05-30', testFrequency: 'Monthly', evidenceIds: [], owner: 'Hendra Wijaya', status: 'Planned',
  },
  {
    id: 'CTL-010', name: 'Certified biometric template storage', description: 'ISO 30107-3 compliant biometric template storage and processing.', riskId: 'R-007', frameworks: ['POJK 10/2022 §3.2', 'ISO 30107-3'], type: 'Preventive', implementationId: 'IMP-010', effectiveness: 10, lastTested: '2026-05-01', testFrequency: 'Semi-Annual', evidenceIds: [], owner: 'Hendra Wijaya', status: 'Not Implemented',
  },
];

// ===== IMPLEMENTATIONS =====
export const implementations: Implementation[] = [
  {
    id: 'IMP-001', controlId: 'CTL-001', name: 'Deploy mutual TLS on QRIS gateway', description: 'Configure and deploy mutual TLS 1.3 with certificate pinning on all QRIS gateway servers.',
    tasks: [
      { id: 'T-001', title: 'Generate and distribute certificates', assignee: 'Hendra Wijaya', status: 'Done', dueDate: '2026-05-15' },
      { id: 'T-002', title: 'Configure TLS 1.3 on gateway servers', assignee: 'Hendra Wijaya', status: 'Done', dueDate: '2026-06-01' },
      { id: 'T-003', title: 'Implement certificate pinning in mobile SDK', assignee: 'Sari Maharani', status: 'In Progress', dueDate: '2026-07-15' },
    ],
    progress: 80, owner: 'Hendra Wijaya', startDate: '2026-04-01', deadline: '2026-08-15',
    budget: { allocated: 150000000, spent: 95000000, currency: 'IDR' }, roadmapYear: 1, status: 'In Progress',
  },
  {
    id: 'IMP-002', controlId: 'CTL-002', name: 'Payment network segmentation', description: 'Implement VLAN segmentation for QRIS payment processing infrastructure.',
    tasks: [
      { id: 'T-004', title: 'Design network segmentation architecture', assignee: 'Hendra Wijaya', status: 'Done', dueDate: '2026-04-30' },
      { id: 'T-005', title: 'Configure VLANs and firewall rules', assignee: 'Hendra Wijaya', status: 'Done', dueDate: '2026-05-31' },
      { id: 'T-006', title: 'Penetration test segmentation effectiveness', assignee: 'Dewi Anggraeni', status: 'Done', dueDate: '2026-06-15' },
    ],
    progress: 100, owner: 'Hendra Wijaya', startDate: '2026-03-15', deadline: '2026-06-15',
    budget: { allocated: 75000000, spent: 68000000, currency: 'IDR' }, roadmapYear: 1, status: 'Completed',
  },
  {
    id: 'IMP-003', controlId: 'CTL-003', name: 'MFA deployment for settlement access', description: 'Roll out multi-factor authentication for all users accessing merchant settlement data.',
    tasks: [
      { id: 'T-007', title: 'Integrate TOTP-based MFA provider', assignee: 'Sari Maharani', status: 'Done', dueDate: '2026-04-15' },
      { id: 'T-008', title: 'Enforce MFA policy for settlement access', assignee: 'Dewi Anggraeni', status: 'Done', dueDate: '2026-05-01' },
    ],
    progress: 100, owner: 'Dewi Anggraeni', startDate: '2026-03-01', deadline: '2026-05-01',
    budget: { allocated: 50000000, spent: 42000000, currency: 'IDR' }, roadmapYear: 1, status: 'Completed',
  },
  {
    id: 'IMP-004', controlId: 'CTL-004', name: 'BI compliance automation', description: 'Build automated compliance checking system against PADG 23/21.',
    tasks: [
      { id: 'T-009', title: 'Map PADG 23/21 requirements to controls', assignee: 'Fajar Hidayat, CISA', status: 'Done', dueDate: '2026-05-15' },
      { id: 'T-010', title: 'Develop automated compliance checks', assignee: 'Sari Maharani', status: 'In Progress', dueDate: '2026-08-01' },
      { id: 'T-011', title: 'Configure compliance alerting', assignee: 'Dewi Anggraeni', status: 'To Do', dueDate: '2026-08-30' },
    ],
    progress: 50, owner: 'Fajar Hidayat, CISA', startDate: '2026-04-01', deadline: '2026-09-01',
    budget: { allocated: 120000000, spent: 45000000, currency: 'IDR' }, roadmapYear: 1, status: 'In Progress',
  },
  {
    id: 'IMP-005', controlId: 'CTL-005', name: 'Transaction audit logging system', description: 'Implement comprehensive audit trail for all cross-border QRIS transactions.',
    tasks: [
      { id: 'T-012', title: 'Deploy centralized log aggregation', assignee: 'Hendra Wijaya', status: 'Done', dueDate: '2026-04-30' },
      { id: 'T-013', title: 'Implement transaction event logging', assignee: 'Sari Maharani', status: 'Done', dueDate: '2026-05-31' },
    ],
    progress: 100, owner: 'Dewi Anggraeni', startDate: '2026-03-15', deadline: '2026-05-31',
    budget: { allocated: 80000000, spent: 72000000, currency: 'IDR' }, roadmapYear: 1, status: 'Completed',
  },
  {
    id: 'IMP-006', controlId: 'CTL-006', name: 'Policyholder data encryption', description: 'Implement AES-256 encryption for all insurance policyholder personal data at rest.',
    tasks: [
      { id: 'T-014', title: 'Key management infrastructure setup', assignee: 'Hendra Wijaya', status: 'Done', dueDate: '2026-06-15' },
      { id: 'T-015', title: 'Encrypt existing policyholder database', assignee: 'Hendra Wijaya', status: 'In Progress', dueDate: '2026-09-30' },
      { id: 'T-016', title: 'Validate encryption coverage', assignee: 'Dewi Anggraeni', status: 'To Do', dueDate: '2026-10-15' },
    ],
    progress: 45, owner: 'Hendra Wijaya', startDate: '2026-05-01', deadline: '2026-10-31',
    budget: { allocated: 200000000, spent: 65000000, currency: 'IDR' }, roadmapYear: 1, status: 'In Progress',
  },
  {
    id: 'IMP-007', controlId: 'CTL-007', name: 'Health data tokenization', description: 'Implement tokenization for sensitive health-related fields in insurance applications.',
    tasks: [
      { id: 'T-017', title: 'Select tokenization solution', assignee: 'Sari Maharani', status: 'In Progress', dueDate: '2026-08-30' },
      { id: 'T-018', title: 'Integrate tokenization into data pipeline', assignee: 'Sari Maharani', status: 'To Do', dueDate: '2026-10-31' },
    ],
    progress: 20, owner: 'Sari Maharani', startDate: '2026-07-01', deadline: '2026-11-30',
    budget: { allocated: 180000000, spent: 25000000, currency: 'IDR' }, roadmapYear: 1, status: 'In Progress',
  },
  {
    id: 'IMP-008', controlId: 'CTL-008', name: 'Consent management platform', description: 'Build digital consent collection and management system for UU PDP compliance.',
    tasks: [
      { id: 'T-019', title: 'Design consent UI/UX flow', assignee: 'Sari Maharani', status: 'In Progress', dueDate: '2026-09-15' },
      { id: 'T-020', title: 'Implement consent API backend', assignee: 'Sari Maharani', status: 'To Do', dueDate: '2026-10-31' },
      { id: 'T-021', title: 'Integrate with data processing systems', assignee: 'Hendra Wijaya', status: 'To Do', dueDate: '2026-11-30' },
    ],
    progress: 15, owner: 'Fajar Hidayat, CISA', startDate: '2026-08-01', deadline: '2026-11-30',
    budget: { allocated: 250000000, spent: 18000000, currency: 'IDR' }, roadmapYear: 1, status: 'In Progress',
  },
  {
    id: 'IMP-009', controlId: 'CTL-009', name: 'API gateway for BPR integration', description: 'Deploy API gateway with WAF for secure BPR banking system integration.',
    tasks: [
      { id: 'T-022', title: 'Evaluate API gateway solutions', assignee: 'Hendra Wijaya', status: 'To Do', dueDate: '2026-11-30' },
      { id: 'T-023', title: 'Deploy and configure API gateway', assignee: 'Hendra Wijaya', status: 'To Do', dueDate: '2027-01-15' },
    ],
    progress: 5, owner: 'Hendra Wijaya', startDate: '2026-10-01', deadline: '2027-01-31',
    budget: { allocated: 300000000, spent: 0, currency: 'IDR' }, roadmapYear: 2, status: 'Not Started',
  },
  {
    id: 'IMP-010', controlId: 'CTL-010', name: 'Biometric storage compliance', description: 'Implement ISO 30107-3 compliant biometric template storage.',
    tasks: [
      { id: 'T-024', title: 'Select certified biometric vendor', assignee: 'Hendra Wijaya', status: 'To Do', dueDate: '2026-12-31' },
      { id: 'T-025', title: 'Implement biometric template storage', assignee: 'Sari Maharani', status: 'To Do', dueDate: '2027-02-15' },
    ],
    progress: 0, owner: 'Hendra Wijaya', startDate: '2026-11-01', deadline: '2027-02-28',
    budget: { allocated: 350000000, spent: 0, currency: 'IDR' }, roadmapYear: 2, status: 'Not Started',
  },
];

// ===== KPIs =====
export const kpis: KPI[] = [
  { id: 'KPI-001', name: 'QRIS Encryption Coverage', description: 'Percentage of QRIS transactions with end-to-end encryption.', businessObjectiveId: 'BO-001', category: 'Security', currentValue: 99.7, targetValue: 99.5, unit: '%', trend: 'improving', trendData: [97.2, 98.1, 98.8, 99.1, 99.5, 99.7], thresholds: { critical: 95, warning: 98, good: 99.5 }, sourceModule: 'data-protection', lastUpdated: '2026-06-25' },
  { id: 'KPI-002', name: 'Mean Time to Detect (MTTD)', description: 'Average time to detect security incidents.', businessObjectiveId: 'BO-001', category: 'Operations', currentValue: 3.2, targetValue: 4, unit: 'hours', trend: 'improving', trendData: [8.5, 6.2, 5.1, 4.3, 3.8, 3.2], thresholds: { critical: 8, warning: 6, good: 4 }, sourceModule: 'incidents', lastUpdated: '2026-06-25' },
  { id: 'KPI-003', name: 'Mean Time to Respond (MTTR)', description: 'Average time to respond to security incidents.', businessObjectiveId: 'BO-001', category: 'Operations', currentValue: 18.5, targetValue: 24, unit: 'hours', trend: 'improving', trendData: [48, 36, 28, 24, 21, 18.5], thresholds: { critical: 48, warning: 36, good: 24 }, sourceModule: 'incidents', lastUpdated: '2026-06-25' },
  { id: 'KPI-004', name: 'Insurance Data Encryption Rate', description: 'Percentage of policyholder data encrypted at rest.', businessObjectiveId: 'BO-002', category: 'Security', currentValue: 72.3, targetValue: 99, unit: '%', trend: 'improving', trendData: [35, 42, 51, 58, 65, 72.3], thresholds: { critical: 50, warning: 80, good: 95 }, sourceModule: 'data-protection', lastUpdated: '2026-06-25' },
  { id: 'KPI-005', name: 'UU PDP Compliance Score', description: 'Overall compliance score against Indonesia PDP Law requirements.', businessObjectiveId: 'BO-002', category: 'Compliance', currentValue: 68, targetValue: 90, unit: '%', trend: 'improving', trendData: [35, 42, 48, 55, 62, 68], thresholds: { critical: 50, warning: 70, good: 85 }, sourceModule: 'compliance', lastUpdated: '2026-06-25' },
  { id: 'KPI-006', name: 'POJK 10/2022 Compliance Score', description: 'Overall compliance score against OJK POJK 10/2022 requirements.', businessObjectiveId: 'BO-003', category: 'Compliance', currentValue: 45, targetValue: 90, unit: '%', trend: 'improving', trendData: [15, 22, 28, 35, 40, 45], thresholds: { critical: 40, warning: 60, good: 80 }, sourceModule: 'compliance', lastUpdated: '2026-06-25' },
  { id: 'KPI-007', name: 'Vulnerability SLA Compliance', description: 'Percentage of vulnerabilities remediated within SLA.', businessObjectiveId: 'BO-001', category: 'Operations', currentValue: 91.2, targetValue: 95, unit: '%', trend: 'stable', trendData: [82, 85, 88, 90, 91, 91.2], thresholds: { critical: 70, warning: 85, good: 95 }, sourceModule: 'vulnerability', lastUpdated: '2026-06-25' },
  { id: 'KPI-008', name: 'Security Awareness Completion', description: 'Percentage of employees who completed mandatory security training.', businessObjectiveId: 'BO-001', category: 'People', currentValue: 87.5, targetValue: 95, unit: '%', trend: 'improving', trendData: [62, 68, 74, 79, 84, 87.5], thresholds: { critical: 60, warning: 80, good: 90 }, sourceModule: 'awareness', lastUpdated: '2026-06-25' },
  { id: 'KPI-009', name: 'Control Effectiveness Score', description: 'Average effectiveness of implemented security controls.', businessObjectiveId: 'BO-001', category: 'Governance', currentValue: 76.8, targetValue: 85, unit: '%', trend: 'improving', trendData: [55, 60, 65, 70, 74, 76.8], thresholds: { critical: 50, warning: 65, good: 80 }, sourceModule: 'risk', lastUpdated: '2026-06-25' },
  { id: 'KPI-010', name: 'MFA Enrollment Rate', description: 'Percentage of users with MFA enabled.', businessObjectiveId: 'BO-001', category: 'Security', currentValue: 94.2, targetValue: 100, unit: '%', trend: 'improving', trendData: [72, 78, 83, 88, 92, 94.2], thresholds: { critical: 70, warning: 85, good: 95 }, sourceModule: 'iam', lastUpdated: '2026-06-25' },
  { id: 'KPI-011', name: 'Patch Compliance Rate', description: 'Percentage of systems with up-to-date security patches.', businessObjectiveId: 'BO-001', category: 'Operations', currentValue: 88.7, targetValue: 95, unit: '%', trend: 'stable', trendData: [75, 79, 82, 85, 87, 88.7], thresholds: { critical: 70, warning: 80, good: 90 }, sourceModule: 'vulnerability', lastUpdated: '2026-06-25' },
  { id: 'KPI-012', name: 'Critical Incidents (Monthly)', description: 'Number of critical security incidents per month.', businessObjectiveId: 'BO-001', category: 'Operations', currentValue: 1, targetValue: 2, unit: 'incidents', trend: 'improving', trendData: [5, 4, 3, 3, 2, 1], thresholds: { critical: 5, warning: 3, good: 2 }, sourceModule: 'incidents', lastUpdated: '2026-06-25' },
];

// ===== EXECUTIVE DECISIONS =====
export const executiveDecisions: ExecutiveDecision[] = [
  {
    id: 'DEC-001', type: 'Approval', title: 'QRIS Cross-Border Go-Live Security Clearance', description: 'Approve security readiness for cross-border QRIS payment processing launch.', relatedObjectiveId: 'BO-001', relatedRiskIds: ['R-001', 'R-002', 'R-003'], decidedBy: 'Budi Santoso, CISSP', rationale: 'All critical controls implemented. Residual risk within acceptable threshold. Encryption coverage exceeds 99.5% target.', conditions: ['Monthly penetration testing for first 6 months', 'Real-time transaction monitoring during first 90 days'], date: '2026-06-20', status: 'Approved', priority: 'Critical',
  },
  {
    id: 'DEC-002', type: 'Risk Acceptance', title: 'Temporary acceptance of partial encryption for insurance data', description: 'Accept temporary risk of incomplete encryption coverage for insurance policyholder data during phased rollout.', relatedObjectiveId: 'BO-002', relatedRiskIds: ['R-004'], decidedBy: 'Budi Santoso, CISSP', rationale: 'Encryption deployment in progress with 72.3% coverage. Full coverage expected by Q4 2026. Compensating controls (access restrictions, monitoring) in place.', conditions: ['Achieve 95% encryption by Sept 2026', 'Weekly progress reports to CISO', 'Enhanced monitoring on unencrypted segments'], date: '2026-06-18', status: 'Approved', priority: 'High',
  },
  {
    id: 'DEC-003', type: 'Budget Allocation', title: 'BPR Integration Security Budget Approval', description: 'Allocate IDR 650M for BPR digital savings security architecture implementation.', relatedObjectiveId: 'BO-003', relatedRiskIds: ['R-006', 'R-007'], decidedBy: 'Dr. Rina Kusuma', rationale: 'Critical investment to meet POJK 10/2022 compliance deadline. Budget covers API gateway, biometric storage, and security testing.', conditions: ['Quarterly budget utilization reports', 'Vendor selection by Q4 2026'], date: '2026-06-15', status: 'Pending', priority: 'High',
  },
  {
    id: 'DEC-004', type: 'Escalation', title: 'Consent Management Implementation Delay', description: 'Escalate delayed consent management platform development to executive review.', relatedObjectiveId: 'BO-002', relatedRiskIds: ['R-005'], decidedBy: 'Fajar Hidayat, CISA', rationale: 'Current progress at 15% against 45% target. Resource constraints in development team. UU PDP enforcement deadline approaching.', conditions: ['Assign additional 2 developers', 'Weekly status review with CISO'], date: '2026-06-22', status: 'Pending', priority: 'Critical',
  },
];

// ===== INCIDENTS =====
export const incidents: SecurityIncident[] = [
  {
    id: 'INC-2026-042', title: 'Suspicious API calls to QRIS settlement endpoint', description: 'Detected unusual volume of API calls from unregistered IP to QRIS settlement endpoint.', severity: 'High', status: 'Investigation', type: 'Unauthorized Access Attempt', affectedAssetIds: ['AST-001'], assignee: 'Dewi Anggraeni', reporter: 'SIEM Alert', createdAt: '2026-06-24T14:30:00Z', updatedAt: '2026-06-25T03:15:00Z', relatedRiskIds: ['R-001'],
    timeline: [
      { timestamp: '2026-06-24T14:30:00Z', action: 'Alert triggered', actor: 'SIEM System', details: 'Anomalous API call pattern detected – 450 calls/min from IP 203.x.x.45' },
      { timestamp: '2026-06-24T14:35:00Z', action: 'Triage started', actor: 'Dewi Anggraeni', details: 'Assigned to SOC Tier 2 for investigation' },
      { timestamp: '2026-06-24T15:00:00Z', action: 'IP blocked', actor: 'Dewi Anggraeni', details: 'Source IP blocked at WAF level. Investigating for data exfiltration.' },
    ],
  },
  {
    id: 'INC-2026-041', title: 'Phishing email targeting finance department', description: 'Sophisticated phishing campaign impersonating OJK sent to 12 finance department employees.', severity: 'Medium', status: 'Containment', type: 'Phishing', affectedAssetIds: ['AST-008'], assignee: 'Dewi Anggraeni', reporter: 'Employee Report', createdAt: '2026-06-23T09:15:00Z', updatedAt: '2026-06-24T16:00:00Z', relatedRiskIds: [],
    timeline: [
      { timestamp: '2026-06-23T09:15:00Z', action: 'Reported', actor: 'Finance Staff', details: 'Employee reported suspicious email claiming to be from OJK' },
      { timestamp: '2026-06-23T09:30:00Z', action: 'Confirmed phishing', actor: 'Dewi Anggraeni', details: 'Email analyzed – confirmed credential harvesting attempt' },
      { timestamp: '2026-06-23T10:00:00Z', action: 'Emails quarantined', actor: 'IT Security', details: 'All 12 emails quarantined. 2 employees clicked link – passwords reset.' },
    ],
  },
  {
    id: 'INC-2026-038', title: 'Critical vulnerability in payment library (CVE-2026-4821)', description: 'Critical RCE vulnerability discovered in third-party payment processing library.', severity: 'Critical', status: 'Recovery', type: 'Vulnerability Exploitation', affectedAssetIds: ['AST-001', 'AST-002'], assignee: 'Hendra Wijaya', reporter: 'Vulnerability Scanner', createdAt: '2026-06-18T08:00:00Z', updatedAt: '2026-06-22T14:00:00Z', resolvedAt: '2026-06-22T14:00:00Z', relatedRiskIds: ['R-001'],
    timeline: [
      { timestamp: '2026-06-18T08:00:00Z', action: 'Vulnerability detected', actor: 'Scanner', details: 'CVE-2026-4821 CVSS 9.8 – RCE in payment-lib v3.2.1' },
      { timestamp: '2026-06-18T09:00:00Z', action: 'Emergency patch initiated', actor: 'Sari Maharani', details: 'Library upgraded to v3.2.4 (patched version)' },
      { timestamp: '2026-06-19T14:00:00Z', action: 'Patch deployed', actor: 'Hendra Wijaya', details: 'Patched version deployed to all production servers' },
      { timestamp: '2026-06-22T14:00:00Z', action: 'Recovery confirmed', actor: 'Dewi Anggraeni', details: 'Post-patch scanning confirms no residual exposure' },
    ],
    rootCause: 'Third-party library vulnerability (supply chain risk)',
    lessonsLearned: 'Implement automated dependency scanning in CI/CD pipeline. Establish emergency patching SLA of 24 hours for critical CVEs.',
  },
];

// ===== VULNERABILITIES =====
export const vulnerabilities: Vulnerability[] = [
  { id: 'VLN-001', title: 'Outdated TLS configuration on API gateway', description: 'API gateway supports TLS 1.0 and 1.1 which are deprecated.', cveId: undefined, cvssScore: 7.5, severity: 'High', affectedAssetId: 'AST-001', status: 'In Progress', discoveredDate: '2026-06-10', slaDeadline: '2026-07-10', patchAvailable: true, assignee: 'Hendra Wijaya', remediationNotes: 'Disabling TLS 1.0/1.1 scheduled for maintenance window.' },
  { id: 'VLN-002', title: 'SQL injection in legacy reporting module', description: 'SQL injection vulnerability in the legacy financial reporting module query builder.', cveId: undefined, cvssScore: 9.1, severity: 'Critical', affectedAssetId: 'AST-005', status: 'Open', discoveredDate: '2026-06-20', slaDeadline: '2026-06-27', patchAvailable: false, assignee: 'Sari Maharani' },
  { id: 'VLN-003', title: 'Cross-site scripting in partner portal', description: 'Stored XSS vulnerability in partner portal comment system.', cveId: 'CVE-2026-5123', cvssScore: 6.1, severity: 'Medium', affectedAssetId: 'AST-006', status: 'Remediated', discoveredDate: '2026-05-15', slaDeadline: '2026-06-15', patchAvailable: true, assignee: 'Sari Maharani', remediationNotes: 'Input sanitization implemented and deployed.' },
  { id: 'VLN-004', title: 'Insufficient logging in authentication service', description: 'Authentication service does not log failed login attempts with sufficient detail.', cveId: undefined, cvssScore: 4.3, severity: 'Medium', affectedAssetId: 'AST-003', status: 'In Progress', discoveredDate: '2026-06-05', slaDeadline: '2026-07-05', patchAvailable: true, assignee: 'Sari Maharani' },
  { id: 'VLN-005', title: 'Unpatched OpenSSL on database servers', description: 'Database servers running OpenSSL 3.0.x with known vulnerability.', cveId: 'CVE-2026-3901', cvssScore: 8.2, severity: 'High', affectedAssetId: 'AST-004', status: 'Open', discoveredDate: '2026-06-22', slaDeadline: '2026-07-06', patchAvailable: true, assignee: 'Hendra Wijaya' },
  { id: 'VLN-006', title: 'Weak password policy on admin accounts', description: 'Administrative accounts allow passwords shorter than 12 characters.', cveId: undefined, cvssScore: 5.5, severity: 'Medium', affectedAssetId: 'AST-003', status: 'Remediated', discoveredDate: '2026-05-01', slaDeadline: '2026-05-31', patchAvailable: true, assignee: 'Dewi Anggraeni', remediationNotes: 'Password policy updated to require minimum 14 characters with complexity.' },
  { id: 'VLN-007', title: 'Missing rate limiting on KYC API', description: 'KYC verification API endpoint lacks rate limiting, vulnerable to brute force.', cveId: undefined, cvssScore: 6.8, severity: 'Medium', affectedAssetId: 'AST-007', status: 'In Progress', discoveredDate: '2026-06-15', slaDeadline: '2026-07-15', patchAvailable: true, assignee: 'Hendra Wijaya' },
];

// ===== ASSETS =====
export const assets: Asset[] = [
  { id: 'AST-001', name: 'QRIS Payment Gateway', category: 'Server', description: 'Primary gateway server processing cross-border QRIS transactions.', owner: 'Hendra Wijaya', department: 'IT Infrastructure', classification: 'Restricted', riskLevel: 'Critical', status: 'Active', ipAddress: '10.1.1.10', location: 'Jakarta DC-1', vulnerabilityCount: 1, lastScanDate: '2026-06-24', complianceStatus: 'Partially Compliant' },
  { id: 'AST-002', name: 'Payment Processing Engine', category: 'Server', description: 'Core payment processing and settlement engine.', owner: 'Hendra Wijaya', department: 'IT Infrastructure', classification: 'Restricted', riskLevel: 'Critical', status: 'Active', ipAddress: '10.1.1.11', location: 'Jakarta DC-1', vulnerabilityCount: 0, lastScanDate: '2026-06-24', complianceStatus: 'Compliant' },
  { id: 'AST-003', name: 'Authentication & IAM Server', category: 'Server', description: 'Central authentication and identity access management.', owner: 'Dewi Anggraeni', department: 'Security Operations', classification: 'Restricted', riskLevel: 'High', status: 'Active', ipAddress: '10.1.2.10', location: 'Jakarta DC-1', vulnerabilityCount: 2, lastScanDate: '2026-06-23', complianceStatus: 'Partially Compliant' },
  { id: 'AST-004', name: 'Transaction Ledger Database', category: 'Database', description: 'PostgreSQL database storing all transaction records and ledger data.', owner: 'Hendra Wijaya', department: 'IT Infrastructure', classification: 'Restricted', riskLevel: 'Critical', status: 'Active', ipAddress: '10.1.3.10', location: 'Jakarta DC-1', vulnerabilityCount: 1, lastScanDate: '2026-06-22', complianceStatus: 'Partially Compliant' },
  { id: 'AST-005', name: 'Financial Reporting System', category: 'Application', description: 'Legacy financial reporting and analytics application.', owner: 'Sari Maharani', department: 'Software Engineering', classification: 'Confidential', riskLevel: 'High', status: 'Active', location: 'Jakarta DC-2', vulnerabilityCount: 1, lastScanDate: '2026-06-20', complianceStatus: 'Non-Compliant' },
  { id: 'AST-006', name: 'Partner Portal', category: 'Application', description: 'Web portal for merchant and partner onboarding and management.', owner: 'Sari Maharani', department: 'Software Engineering', classification: 'Confidential', riskLevel: 'Medium', status: 'Active', location: 'Cloud – GCP', vulnerabilityCount: 0, lastScanDate: '2026-06-22', complianceStatus: 'Compliant' },
  { id: 'AST-007', name: 'KYC Verification API', category: 'API', description: 'API for customer KYC identity verification and biometric matching.', owner: 'Sari Maharani', department: 'Software Engineering', classification: 'Restricted', riskLevel: 'High', status: 'Active', location: 'Cloud – GCP', vulnerabilityCount: 1, lastScanDate: '2026-06-15', complianceStatus: 'Partially Compliant' },
  { id: 'AST-008', name: 'Corporate Endpoint Fleet', category: 'Employee Device', description: '342 corporate laptops and workstations across all departments.', owner: 'Hendra Wijaya', department: 'IT Infrastructure', classification: 'Internal', riskLevel: 'Medium', status: 'Active', location: 'All Offices', vulnerabilityCount: 12, lastScanDate: '2026-06-20', complianceStatus: 'Partially Compliant' },
];

// ===== COMPLIANCE REQUIREMENTS =====
export const complianceRequirements: ComplianceRequirement[] = [
  { id: 'REG-UU-PDP-001', regulation: 'UU PDP', article: 'Pasal 20-22', title: 'Legal basis for personal data processing', description: 'Establish and document legal basis for processing personal data.', category: 'Consent', status: 'Partially Compliant', controlIds: ['CTL-008'], evidenceIds: [], gapDescription: 'Consent management platform under development.', dueDate: '2026-10-31', assignee: 'Fajar Hidayat, CISA', progress: 40 },
  { id: 'REG-UU-PDP-002', regulation: 'UU PDP', article: 'Pasal 34-35', title: 'Data security and encryption', description: 'Implement appropriate security measures to protect personal data.', category: 'Security', status: 'Partially Compliant', controlIds: ['CTL-006', 'CTL-007'], evidenceIds: ['EV-001'], dueDate: '2026-12-31', assignee: 'Hendra Wijaya', progress: 55 },
  { id: 'REG-UU-PDP-003', regulation: 'UU PDP', article: 'Pasal 46', title: 'Data breach notification', description: 'Notify data subjects and authorities within 72 hours of a data breach.', category: 'Incident Response', status: 'Compliant', controlIds: ['CTL-005'], evidenceIds: ['EV-005'], dueDate: '2026-08-31', assignee: 'Dewi Anggraeni', progress: 100 },
  { id: 'REG-POJK-001', regulation: 'POJK 10/2022', article: '§3.1-3.2', title: 'Biometric authentication requirements', description: 'Implement biometric authentication for high-value transactions.', category: 'Authentication', status: 'Non-Compliant', controlIds: ['CTL-010'], evidenceIds: [], gapDescription: 'Biometric storage solution not yet implemented.', dueDate: '2027-03-31', assignee: 'Hendra Wijaya', progress: 10 },
  { id: 'REG-POJK-002', regulation: 'POJK 10/2022', article: '§4.1-4.3', title: 'Information security governance', description: 'Establish information security governance framework.', category: 'Governance', status: 'Compliant', controlIds: ['CTL-003', 'CTL-004'], evidenceIds: ['EV-003', 'EV-004'], dueDate: '2026-06-30', assignee: 'Budi Santoso, CISSP', progress: 92 },
  { id: 'REG-PADG-001', regulation: 'PADG 23/21', article: '§5.2-5.4', title: 'Cross-border transaction encryption', description: 'End-to-end encryption for all cross-border QRIS payment transactions.', category: 'Encryption', status: 'Compliant', controlIds: ['CTL-001', 'CTL-002'], evidenceIds: ['EV-001', 'EV-002'], dueDate: '2026-06-30', assignee: 'Hendra Wijaya', progress: 98 },
  { id: 'REG-PADG-002', regulation: 'PADG 23/21', article: '§7.1', title: 'Transaction audit trail', description: 'Maintain complete audit trail for all cross-border transactions.', category: 'Audit', status: 'Compliant', controlIds: ['CTL-005'], evidenceIds: ['EV-005'], dueDate: '2026-06-30', assignee: 'Dewi Anggraeni', progress: 100 },
  { id: 'REG-ISO-001', regulation: 'ISO 27001', article: 'A.9.2', title: 'User access management', description: 'Formal user registration and de-registration process.', category: 'Access Control', status: 'Compliant', controlIds: ['CTL-003'], evidenceIds: ['EV-003'], dueDate: '2026-12-31', assignee: 'Dewi Anggraeni', progress: 95 },
];

// ===== GOVERNANCE DOCUMENTS =====
export const governanceDocuments: GovernanceDocument[] = [
  { id: 'GOV-001', title: 'Information Security Policy', type: 'Policy', version: '3.1', status: 'Published', owner: 'Budi Santoso, CISSP', approver: 'Dr. Rina Kusuma', createdDate: '2024-01-15', lastModified: '2026-04-20', nextReviewDate: '2027-04-20', relatedControlIds: ['CTL-001', 'CTL-002', 'CTL-003'], description: 'Enterprise-wide information security policy establishing governance framework.' },
  { id: 'GOV-002', title: 'Data Protection & Privacy Standard', type: 'Standard', version: '2.0', status: 'Published', owner: 'Fajar Hidayat, CISA', approver: 'Budi Santoso, CISSP', createdDate: '2025-03-01', lastModified: '2026-03-15', nextReviewDate: '2027-03-15', relatedControlIds: ['CTL-006', 'CTL-007', 'CTL-008'], description: 'Standard for personal data protection aligned with UU PDP requirements.' },
  { id: 'GOV-003', title: 'Incident Response Procedure', type: 'Procedure', version: '2.2', status: 'Published', owner: 'Dewi Anggraeni', approver: 'Budi Santoso, CISSP', createdDate: '2024-06-01', lastModified: '2026-06-10', nextReviewDate: '2026-12-10', relatedControlIds: ['CTL-005'], description: 'Step-by-step procedure for security incident detection, response, and recovery.' },
  { id: 'GOV-004', title: 'Access Control Standard', type: 'Standard', version: '1.5', status: 'Published', owner: 'Dewi Anggraeni', approver: 'Budi Santoso, CISSP', createdDate: '2025-01-15', lastModified: '2026-02-28', nextReviewDate: '2027-02-28', relatedControlIds: ['CTL-003'], description: 'Standard for access control, authentication, and authorization management.' },
  { id: 'GOV-005', title: 'Cloud Security Guideline', type: 'Guideline', version: '1.0', status: 'In Review', owner: 'Hendra Wijaya', approver: 'Budi Santoso, CISSP', createdDate: '2026-05-01', lastModified: '2026-06-15', nextReviewDate: '2027-06-15', relatedControlIds: ['CTL-009'], description: 'Guideline for securing cloud-hosted applications and infrastructure.' },
  { id: 'GOV-006', title: 'Secure Software Development Lifecycle', type: 'Standard', version: '1.2', status: 'Draft', owner: 'Sari Maharani', approver: 'Budi Santoso, CISSP', createdDate: '2026-04-01', lastModified: '2026-06-20', nextReviewDate: '2027-06-20', relatedControlIds: ['CTL-007', 'CTL-009'], description: 'Standard for integrating security into the software development lifecycle.' },
];

// ===== ROADMAP INITIATIVES =====
export const roadmapInitiatives: RoadmapInitiative[] = [
  { id: 'RM-001', name: 'Governance Framework', description: 'Establish comprehensive information security governance framework with policies, standards, and procedures.', year: 1, quarter: 'Q1-Q2', category: 'Governance', status: 'Completed', progress: 100, owner: 'Budi Santoso, CISSP', budget: { allocated: 200000000, spent: 185000000, currency: 'IDR' }, milestones: [{ id: 'MS-001', name: 'Policy Framework Published', targetDate: '2026-03-31', status: 'Completed' }, { id: 'MS-002', name: 'RACI Matrix Established', targetDate: '2026-04-30', status: 'Completed' }], implementationIds: ['IMP-003', 'IMP-004'], dependencies: [] },
  { id: 'RM-002', name: 'Encryption Program', description: 'Deploy enterprise-wide encryption for data at rest and in transit.', year: 1, quarter: 'Q1-Q3', category: 'Security', status: 'In Progress', progress: 72, owner: 'Hendra Wijaya', budget: { allocated: 500000000, spent: 280000000, currency: 'IDR' }, milestones: [{ id: 'MS-003', name: 'TLS 1.3 on all gateways', targetDate: '2026-06-30', status: 'Completed' }, { id: 'MS-004', name: 'Full data-at-rest encryption', targetDate: '2026-10-31', status: 'Upcoming' }], implementationIds: ['IMP-001', 'IMP-006'], dependencies: [] },
  { id: 'RM-003', name: 'Security Awareness', description: 'Company-wide security awareness program with training, phishing simulations, and security champions.', year: 1, quarter: 'Q2-Q4', category: 'People', status: 'In Progress', progress: 65, owner: 'Dewi Anggraeni', budget: { allocated: 150000000, spent: 78000000, currency: 'IDR' }, milestones: [{ id: 'MS-005', name: 'Awareness platform launched', targetDate: '2026-05-31', status: 'Completed' }, { id: 'MS-006', name: '90% completion rate', targetDate: '2026-12-31', status: 'Upcoming' }], implementationIds: [], dependencies: ['RM-001'] },
  { id: 'RM-004', name: 'DevSecOps Pipeline', description: 'Integrate security into CI/CD pipeline with SAST, DAST, SCA, and secret scanning.', year: 2, quarter: 'Q1-Q2', category: 'Technology', status: 'Not Started', progress: 0, owner: 'Sari Maharani', budget: { allocated: 400000000, spent: 0, currency: 'IDR' }, milestones: [{ id: 'MS-007', name: 'SAST/DAST integrated', targetDate: '2027-03-31', status: 'Upcoming' }], implementationIds: [], dependencies: ['RM-001', 'RM-002'] },
  { id: 'RM-005', name: 'Cloud Security Posture', description: 'Implement CSPM and cloud security controls for GCP workloads.', year: 2, quarter: 'Q2-Q3', category: 'Technology', status: 'Not Started', progress: 0, owner: 'Hendra Wijaya', budget: { allocated: 350000000, spent: 0, currency: 'IDR' }, milestones: [{ id: 'MS-008', name: 'CSPM deployed', targetDate: '2027-06-30', status: 'Upcoming' }], implementationIds: ['IMP-009'], dependencies: ['RM-004'] },
  { id: 'RM-006', name: 'Secure SDLC', description: 'Formalize secure software development lifecycle across all engineering teams.', year: 2, quarter: 'Q2-Q4', category: 'Process', status: 'Not Started', progress: 0, owner: 'Sari Maharani', budget: { allocated: 250000000, spent: 0, currency: 'IDR' }, milestones: [{ id: 'MS-009', name: 'SDLC standard published', targetDate: '2027-06-30', status: 'Upcoming' }], implementationIds: [], dependencies: ['RM-004'] },
  { id: 'RM-007', name: 'SOC Operations Center', description: 'Establish 24/7 Security Operations Center with SIEM, SOAR, and threat hunting.', year: 3, quarter: 'Q1-Q2', category: 'Operations', status: 'Not Started', progress: 0, owner: 'Dewi Anggraeni', budget: { allocated: 800000000, spent: 0, currency: 'IDR' }, milestones: [{ id: 'MS-010', name: 'SIEM operational', targetDate: '2028-03-31', status: 'Upcoming' }], implementationIds: [], dependencies: ['RM-002', 'RM-005'] },
  { id: 'RM-008', name: 'Zero Trust Architecture', description: 'Implement Zero Trust network and identity architecture across the enterprise.', year: 3, quarter: 'Q2-Q4', category: 'Architecture', status: 'Not Started', progress: 0, owner: 'Hendra Wijaya', budget: { allocated: 600000000, spent: 0, currency: 'IDR' }, milestones: [{ id: 'MS-011', name: 'Zero Trust pilot complete', targetDate: '2028-06-30', status: 'Upcoming' }], implementationIds: [], dependencies: ['RM-005', 'RM-007'] },
  { id: 'RM-009', name: 'Continuous Monitoring', description: 'Deploy continuous security monitoring and automated compliance verification.', year: 3, quarter: 'Q3-Q4', category: 'Operations', status: 'Not Started', progress: 0, owner: 'Dewi Anggraeni', budget: { allocated: 450000000, spent: 0, currency: 'IDR' }, milestones: [{ id: 'MS-012', name: 'Continuous monitoring operational', targetDate: '2028-12-31', status: 'Upcoming' }], implementationIds: [], dependencies: ['RM-007', 'RM-008'] },
];

// ===== AUDIT RECORDS =====
export const auditRecords: AuditRecord[] = [
  { id: 'AUD-001', type: 'External', title: 'OJK Compliance Audit 2026', scope: 'POJK 10/2022 information security requirements', auditor: 'Deloitte Indonesia', status: 'In Progress', startDate: '2026-06-01', endDate: '2026-07-31', findingsCount: 4, criticalFindings: 1, correctiveActions: [{ id: 'CA-001', finding: 'Biometric storage not compliant', action: 'Implement ISO 30107-3 biometric template storage', owner: 'Hendra Wijaya', dueDate: '2027-02-28', status: 'Open', priority: 'Critical' }, { id: 'CA-002', finding: 'Incomplete access review process', action: 'Establish quarterly access certification', owner: 'Dewi Anggraeni', dueDate: '2026-09-30', status: 'In Progress', priority: 'High' }] },
  { id: 'AUD-002', type: 'Internal', title: 'Q2 2026 Internal Security Audit', scope: 'Payment processing infrastructure and data protection controls', auditor: 'Internal Audit Team', status: 'Completed', startDate: '2026-04-01', endDate: '2026-05-15', findingsCount: 7, criticalFindings: 0, correctiveActions: [{ id: 'CA-003', finding: 'Logging gaps in auth service', action: 'Enhance authentication event logging', owner: 'Sari Maharani', dueDate: '2026-07-31', status: 'In Progress', priority: 'Medium' }] },
  { id: 'AUD-003', type: 'External', title: 'UU PDP Readiness Assessment', scope: 'Personal data protection law compliance readiness', auditor: 'PwC Indonesia', status: 'Planned', startDate: '2026-09-01', endDate: '2026-10-31', findingsCount: 0, criticalFindings: 0, correctiveActions: [] },
];

// ===== TRAINING PROGRAMS =====
export const trainingPrograms: TrainingProgram[] = [
  { id: 'TRN-001', name: 'Security Awareness Fundamentals', description: 'Mandatory security awareness training for all employees.', type: 'Course', targetAudience: 'All Employees', completionRate: 87.5, totalParticipants: 342, completedParticipants: 299, dueDate: '2026-12-31', status: 'Active' },
  { id: 'TRN-002', name: 'Q2 Phishing Simulation', description: 'Simulated phishing campaign targeting all departments.', type: 'Phishing Simulation', targetAudience: 'All Employees', completionRate: 92, totalParticipants: 342, completedParticipants: 315, dueDate: '2026-06-30', status: 'Completed' },
  { id: 'TRN-003', name: 'Secure Coding Practices', description: 'Advanced secure coding training for development team.', type: 'Workshop', targetAudience: 'Development Team', completionRate: 78, totalParticipants: 45, completedParticipants: 35, dueDate: '2026-08-31', status: 'Active' },
  { id: 'TRN-004', name: 'UU PDP Compliance Training', description: 'Indonesia PDP Law compliance training for data handlers.', type: 'Course', targetAudience: 'Data Processing Staff', completionRate: 65, totalParticipants: 120, completedParticipants: 78, dueDate: '2026-09-30', status: 'Active' },
];

// ===== DATA PROTECTION RECORDS =====
export const dataProtectionRecords: DataProtectionRecord[] = [
  { id: 'DP-001', dataCategory: 'Customer PII', classification: 'Restricted', storageLocation: 'PostgreSQL – Jakarta DC-1', encryptionStatus: 'Encrypted', encryptionType: 'AES-256', retentionPeriod: '5 years', backupStatus: 'Active', dataOwner: 'Budi Santoso, CISSP', accessControlled: true, piaCompleted: true },
  { id: 'DP-002', dataCategory: 'Transaction Records', classification: 'Restricted', storageLocation: 'PostgreSQL – Jakarta DC-1', encryptionStatus: 'Encrypted', encryptionType: 'AES-256', retentionPeriod: '10 years', backupStatus: 'Active', dataOwner: 'Hendra Wijaya', accessControlled: true, piaCompleted: true },
  { id: 'DP-003', dataCategory: 'Insurance Health Data', classification: 'Restricted', storageLocation: 'PostgreSQL – Jakarta DC-2', encryptionStatus: 'Partially Encrypted', encryptionType: 'AES-256 (in progress)', retentionPeriod: '7 years', backupStatus: 'Active', dataOwner: 'Fajar Hidayat, CISA', accessControlled: true, piaCompleted: false },
  { id: 'DP-004', dataCategory: 'Employee Records', classification: 'Confidential', storageLocation: 'HR SaaS Platform', encryptionStatus: 'Encrypted', encryptionType: 'Provider-managed', retentionPeriod: 'Employment + 3 years', backupStatus: 'Active', dataOwner: 'HR Department', accessControlled: true, piaCompleted: true },
  { id: 'DP-005', dataCategory: 'Marketing Analytics', classification: 'Internal', storageLocation: 'Google BigQuery', encryptionStatus: 'Encrypted', encryptionType: 'Google-managed', retentionPeriod: '2 years', backupStatus: 'Active', dataOwner: 'Marketing Department', accessControlled: false, piaCompleted: false },
  { id: 'DP-006', dataCategory: 'Biometric Templates', classification: 'Restricted', storageLocation: 'To be determined', encryptionStatus: 'Not Encrypted', retentionPeriod: 'Active account duration', backupStatus: 'Inactive', dataOwner: 'Hendra Wijaya', accessControlled: false, piaCompleted: false },
];

export const evidences: Evidence[] = [
  {
    id: 'EV-001',
    name: 'QRIS_TLS_1.3_Cipher_Config.pdf',
    type: 'Certificate',
    controlId: 'CTL-001',
    requirementId: 'REG-PADG-001',
    uploadedBy: 'Hendra Wijaya',
    uploadedAt: '2026-06-15T09:00:00Z',
    fileSize: '1.2 MB',
    status: 'Valid',
  },
  {
    id: 'EV-002',
    name: 'Payment_VLAN_Isolation_Rules.conf',
    type: 'Log',
    controlId: 'CTL-002',
    requirementId: 'REG-PADG-001',
    uploadedBy: 'Hendra Wijaya',
    uploadedAt: '2026-06-10T10:30:00Z',
    fileSize: '45 KB',
    status: 'Valid',
  },
  {
    id: 'EV-003',
    name: 'IAM_Settlement_MFA_Enforcement_Report.pdf',
    type: 'Report',
    controlId: 'CTL-003',
    requirementId: 'REG-POJK-002',
    uploadedBy: 'Dewi Anggraeni',
    uploadedAt: '2026-06-20T14:45:00Z',
    fileSize: '3.4 MB',
    status: 'Valid',
  },
  {
    id: 'EV-004',
    name: 'PADG_23_21_Automated_Compliance_Check.json',
    type: 'Log',
    controlId: 'CTL-004',
    requirementId: 'REG-POJK-002',
    uploadedBy: 'Fajar Hidayat, CISA',
    uploadedAt: '2026-05-30T11:00:00Z',
    fileSize: '128 KB',
    status: 'Valid',
  },
  {
    id: 'EV-005',
    name: 'Cross_Border_QRIS_Audit_Trail_Log.csv',
    type: 'Log',
    controlId: 'CTL-005',
    requirementId: 'REG-PADG-002',
    uploadedBy: 'Dewi Anggraeni',
    uploadedAt: '2026-06-18T16:20:00Z',
    fileSize: '12.8 MB',
    status: 'Valid',
  },
];

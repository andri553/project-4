import { Router } from 'express';
import { securityController } from '../controllers/security.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Dashboard summary metric
router.get('/dashboard-summary', authMiddleware, securityController.getDashboardSummary);

// Governance Master Data for SecureNusa
router.get('/governance-data', authMiddleware, securityController.getGovernanceData);

// Demo Dataset Manager (Operational mock data)
router.post('/demo-dataset', authMiddleware, securityController.manageDemoDataset);

// CISO User directory read model
router.get('/users', authMiddleware, securityController.getUsers);

// Combined investigation profile
router.get('/investigation/user/:id', authMiddleware, securityController.getUserInvestigation);

// Transaction Security Center
router.get('/transactions', authMiddleware, securityController.getTransactions);
router.get('/transactions/summary', authMiddleware, securityController.getTransactionSummary);
router.get('/transactions/:id', authMiddleware, securityController.getTransactionDetail);
router.get('/transactions/:id/correlation', authMiddleware, securityController.getTransactionCorrelation);

// Enriched audit trails
router.get('/audit-logs', authMiddleware, securityController.getAuditLogs);

// Alerts and Security Events
router.get('/events', authMiddleware, securityController.getSecurityEvents);

// Real-Data KPI Metrics (dihitung dari database, bukan hardcoded)
router.get('/kpi-metrics', authMiddleware, securityController.getKpiMetrics);

// Escalated incidents
router.get('/incidents', authMiddleware, securityController.getSecurityIncidents);

// KYC Queue management
router.get('/kyc-pending', authMiddleware, securityController.getKycPending);
router.get('/kyc-history/:userId', authMiddleware, securityController.getKycHistory);
router.post('/kyc-approve/:id', authMiddleware, securityController.approveKyc);
router.post('/kyc-reject/:id', authMiddleware, securityController.rejectKyc);
router.post('/kyc-reupload/:id', authMiddleware, securityController.requestKycReupload);
router.post('/kyc-suspend/:id', authMiddleware, securityController.suspendKyc);
router.get('/kyc-metrics', authMiddleware, securityController.getKycMetrics);
router.get('/active-sessions-soc', authMiddleware, securityController.getActiveSessionsSOC);

// Incident response options
router.post('/block-user/:id', authMiddleware, securityController.blockUser);
router.post('/reset-session/:id', authMiddleware, securityController.resetSession);

// Data source controls
router.get('/datasource/status', authMiddleware, securityController.getDataSourceStatus);
router.post('/datasource/config', authMiddleware, securityController.setDataSourceConfig);
router.post('/datasource/archive', authMiddleware, securityController.archiveMockData);
router.post('/datasource/restore', authMiddleware, securityController.restoreMockData);

export default router;

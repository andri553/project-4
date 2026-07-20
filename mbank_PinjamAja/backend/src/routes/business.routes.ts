import { Router } from 'express';
import { businessController } from '../controllers/business.controller';
import { authMiddleware } from '../middleware/authMiddleware';
import { authLimiter } from '../middleware/securityMiddleware';

const router = Router();

// Auth routes
router.post('/auth/login', authLimiter, businessController.login);
router.post('/auth/logout', businessController.logout);
router.get('/auth/me', authMiddleware, businessController.me);

// Loans routes
router.post('/loans/apply', authMiddleware, businessController.applyLoan);
router.get('/loans', authMiddleware, businessController.getLoans);

// Savings / Transaction routes
router.post('/savings/deposit', authMiddleware, businessController.deposit);
router.post('/savings/withdraw', authMiddleware, businessController.withdraw);
router.post('/savings/transfer', authMiddleware, businessController.transfer);
router.get('/savings/transactions', authMiddleware, businessController.getTransactions);

// QRIS payment route
router.post('/qris/pay', authMiddleware, businessController.qrisPayment);

// KYC progression routes
router.post('/kyc/start', authMiddleware, businessController.startKYC);
router.post('/kyc/upload-ktp', authMiddleware, businessController.uploadKTP);
router.post('/kyc/selfie', authMiddleware, businessController.captureSelfie);
router.post('/kyc/face-match', authMiddleware, businessController.performFaceMatch);
router.post('/kyc/submit', authMiddleware, businessController.submitKYC);

// Notifications routes
router.get('/notifications', authMiddleware, businessController.getNotifications);
router.post('/notifications/read-all', authMiddleware, businessController.markAllNotificationsRead);
router.post('/notifications/:id/read', authMiddleware, businessController.markNotificationRead);

export default router;

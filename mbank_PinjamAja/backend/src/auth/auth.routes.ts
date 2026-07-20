import { Router } from 'express';
import { authController } from './auth.controller';
import { authMiddleware } from '../middleware/authMiddleware';
import { authLimiter } from '../middleware/securityMiddleware';
import { checkPermission } from '../middleware/rbacMiddleware';

const router = Router();

// Standard Auth Routes
router.post('/login', authLimiter, authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);
router.get('/me', authMiddleware, authController.me);

// Phone Onboarding & Biometrics Routes
router.post('/phone/send-otp', authLimiter, authController.sendOTP);
router.post('/phone/login-pin', authLimiter, authController.loginWithPhoneAndPin);
router.post('/phone/verify-otp', authController.verifyOTP);
router.post('/phone/register-profile', authController.registerProfile);
router.post('/phone/setup-pin', authController.setupPIN);
router.post('/phone/verify-pin', authController.verifyPIN);
router.post('/phone/biometric-unlock', authController.biometricUnlock);
router.post('/phone/update-biometrics', authMiddleware, authController.updateBiometrics);

router.get('/test-rbac', authMiddleware, checkPermission('view_executive'), (req: any, res: any) => {
  res.json({ success: true, message: 'RBAC Access Granted!' });
});

export default router;

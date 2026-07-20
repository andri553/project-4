import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// AI Chat endpoint - requires authentication
router.post('/message', authMiddleware, chatController.chat);

export default router;

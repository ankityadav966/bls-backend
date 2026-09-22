import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/login', authLimiter, AuthController.login);
router.post('/register', authLimiter, AuthController.register);
router.get('/me', authenticate, AuthController.getMe);
router.post('/refresh', AuthController.refreshToken);
router.post('/logout', AuthController.logout);

export default router;

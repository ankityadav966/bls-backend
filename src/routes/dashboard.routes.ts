import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { UserRole } from '../constants';

const router = Router();

router.use(authenticate);
router.get('/', authorize(UserRole.ADMIN, UserRole.STAFF), DashboardController.getAdminDashboard);
router.get('/stats', authorize(UserRole.ADMIN, UserRole.STAFF), DashboardController.getAdminDashboard);
router.get('/admin', authorize(UserRole.ADMIN, UserRole.STAFF), DashboardController.getAdminDashboard);

export default router;

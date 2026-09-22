import { Router } from 'express';
import { ServiceController } from '../controllers/service.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { UserRole } from '../constants';

const router = Router();

// Public routes (Cached)
router.get('/', ServiceController.getServices);
router.get('/categories', ServiceController.getCategories);
router.get('/:slug', ServiceController.getServiceBySlug);

// Admin routes
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

router.post('/', ServiceController.createService);
router.patch('/:id', ServiceController.updateService);

export default router;

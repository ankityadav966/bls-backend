import { Router } from 'express';
import { WorkController } from '../controllers/work.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { UserRole } from '../constants';

const router = Router();

router.use(authenticate);

router.get('/', WorkController.getWorkAssignments);
router.post('/', authorize(UserRole.ADMIN, UserRole.STAFF), WorkController.createWorkAssignment);
router.patch('/:id/progress', WorkController.updateWorkProgress);

export default router;

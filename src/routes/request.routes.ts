import { Router } from 'express';
import { RequestController } from '../controllers/request.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { UserRole } from '../constants';

const router = Router();

router.use(authenticate);

router.get('/', RequestController.getRequests);
router.post('/', authorize(UserRole.ADMIN, UserRole.STAFF, UserRole.CLIENT), RequestController.createRequest);
router.get('/:id', RequestController.getRequestById);
router.patch('/:id/assign', authorize(UserRole.ADMIN), RequestController.assignRequest);
router.patch('/:id/status', RequestController.updateRequestStatus);

export default router;

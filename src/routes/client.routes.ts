import { Router } from 'express';
import { ClientController } from '../controllers/client.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { UserRole } from '../constants';

const router = Router();

router.use(authenticate);

router.get('/', authorize(UserRole.ADMIN, UserRole.STAFF), ClientController.getClients);
router.post('/', authorize(UserRole.ADMIN, UserRole.STAFF), ClientController.createClient);
router.get('/:id', authorize(UserRole.ADMIN, UserRole.STAFF, UserRole.CLIENT), ClientController.getClientById);
router.patch('/:id', authorize(UserRole.ADMIN, UserRole.STAFF), ClientController.updateClient);
router.get('/:id/overview', authorize(UserRole.ADMIN, UserRole.STAFF, UserRole.CLIENT), ClientController.getClientOverview);

export default router;

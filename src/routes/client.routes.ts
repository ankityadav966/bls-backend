import { Router } from 'express';
import { ClientController } from '../controllers/client.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { UserRole } from '../constants';

const router = Router();

router.use(authenticate);

router.get('/', authorize(UserRole.ADMIN, UserRole.STAFF, UserRole.PARTNER), ClientController.getClients);
router.post('/', authorize(UserRole.ADMIN, UserRole.STAFF, UserRole.PARTNER), ClientController.createClient);
router.get('/:id', authorize(UserRole.ADMIN, UserRole.STAFF, UserRole.CLIENT, UserRole.PARTNER), ClientController.getClientById);
router.patch('/:id', authorize(UserRole.ADMIN, UserRole.STAFF), ClientController.updateClient);
router.get('/:id/overview', authorize(UserRole.ADMIN, UserRole.STAFF, UserRole.CLIENT, UserRole.PARTNER), ClientController.getClientOverview);

export default router;

import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { UserRole } from '../constants';

const router = Router();

router.use(authenticate);

router.get('/', InvoiceController.getInvoices);
router.get('/:id', InvoiceController.getInvoiceById);
router.post('/', authorize(UserRole.ADMIN, UserRole.STAFF), InvoiceController.createInvoice);
router.post('/:id/payment', authorize(UserRole.ADMIN, UserRole.STAFF), InvoiceController.recordPayment);

export default router;

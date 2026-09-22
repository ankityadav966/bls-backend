import { Router } from 'express';
import { PartnerController } from '../controllers/partner.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { apiLimiter } from '../middleware/rateLimit.middleware';
import { UserRole } from '../constants';

const router = Router();

// Public partner registration (From Public Website or Partner Portal)
router.post('/register', apiLimiter, PartnerController.registerPartner);

// Authenticated routes
router.use(authenticate);

// Partner Self Dashboard & Payouts
router.get('/me/dashboard', authorize(UserRole.PARTNER), PartnerController.getPartnerDashboard);
router.get('/me/payouts', authorize(UserRole.PARTNER), PartnerController.getPartnerPayouts);

// Admin & Partner profile endpoints
router.get('/', authorize(UserRole.ADMIN, UserRole.STAFF), PartnerController.getPartners);
router.get('/:id', authorize(UserRole.ADMIN, UserRole.STAFF, UserRole.PARTNER), PartnerController.getPartnerById);
router.patch('/:id/status', authorize(UserRole.ADMIN), PartnerController.updatePartnerStatus);

export default router;

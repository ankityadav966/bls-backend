import { Router } from 'express';
import { LeadController } from '../controllers/lead.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { apiLimiter } from '../middleware/rateLimit.middleware';
import { UserRole } from '../constants';

const router = Router();

// Public enquiry endpoint (From Public Website)
router.post('/public', apiLimiter, LeadController.submitPublicEnquiry);

// Admin & Staff CRM endpoints
router.use(authenticate);
router.use(authorize(UserRole.ADMIN, UserRole.STAFF));

router.get('/', LeadController.getLeads);
router.post('/', LeadController.createLead);
router.get('/:id', LeadController.getLeadById);
router.patch('/:id', LeadController.updateLead);
router.post('/:id/convert', LeadController.convertToClient);
router.delete('/:id', authorize(UserRole.ADMIN), LeadController.deleteLead);

export default router;

import { Router } from 'express';
import { MiscController } from '../controllers/misc.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { UserRole } from '../constants';

const router = Router();

// Public knowledge / FAQs
router.get('/knowledge', MiscController.getKnowledge);

// Authenticated routes
router.use(authenticate);

// Staff
router.get('/staff', authorize(UserRole.ADMIN), MiscController.getStaff);
router.post('/staff', authorize(UserRole.ADMIN), MiscController.createStaff);

// Follow-ups
router.get('/follow-ups', authorize(UserRole.ADMIN, UserRole.STAFF), MiscController.getFollowUps);
router.post('/follow-ups', authorize(UserRole.ADMIN, UserRole.STAFF), MiscController.createFollowUp);

// Tickets
router.get('/tickets', MiscController.getTickets);
router.post('/tickets', MiscController.createTicket);

// Notifications
router.get('/notifications', MiscController.getNotifications);
router.patch('/notifications/:id/read', MiscController.markNotificationRead);

// Settings
router.get('/settings', MiscController.getSettings);
router.patch('/settings', authorize(UserRole.ADMIN), MiscController.updateSettings);

// Activity Logs
router.get('/activity-logs', authorize(UserRole.ADMIN), MiscController.getActivityLogs);

export default router;

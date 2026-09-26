import { Router } from 'express';
import authRoutes from './auth.routes';
import leadRoutes from './lead.routes';
import partnerRoutes from './partner.routes';
import clientRoutes from './client.routes';
import serviceRoutes from './service.routes';
import requestRoutes from './request.routes';
import workRoutes from './work.routes';
import documentRoutes from './document.routes';
import invoiceRoutes from './invoice.routes';
import dashboardRoutes from './dashboard.routes';
import miscRoutes from './misc.routes';
import { LeadController } from '../controllers/lead.controller';
import { PartnerController } from '../controllers/partner.controller';
import { apiLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Compatibility aliases for existing Public Website forms
router.post('/enquiries', apiLimiter, LeadController.submitPublicEnquiry);
router.post('/partners', apiLimiter, PartnerController.registerPartner);

const v1Router = Router();

v1Router.post('/enquiries', apiLimiter, LeadController.submitPublicEnquiry);
v1Router.use('/auth', authRoutes);
v1Router.use('/leads', leadRoutes);
v1Router.use('/partners', partnerRoutes);
v1Router.use('/clients', clientRoutes);
v1Router.use('/services', serviceRoutes);
v1Router.use('/requests', requestRoutes);
v1Router.use('/work', workRoutes);
v1Router.use('/documents', documentRoutes);
v1Router.use('/invoices', invoiceRoutes);
v1Router.use('/dashboard', dashboardRoutes);
v1Router.use('/', miscRoutes);

router.use('/v1', v1Router);

export default router;

import { Request, Response, NextFunction } from 'express';
import { LeadModel } from '../models/Lead.model';
import { ClientModel } from '../models/Client.model';
import { ServiceRequestModel } from '../models/ServiceRequest.model';
import { ActivityLogModel } from '../models/ActivityLog.model';
import { NotificationModel } from '../models/Notification.model';
import { sendSuccess, sendPaginated } from '../utils/apiResponse';
import { AppError } from '../middleware/error.middleware';
import { LeadStatus, RequestStatus, ActivityAction } from '../constants';
import { QueueService } from '../services/queue.service';
import { logger } from '../utils/logger';

export class LeadController {
  // POST /api/v1/leads/public or /api/enquiries (Public Website Contact/Enquiry Form)
  static async submitPublicEnquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        fullName,
        name,
        email,
        phone,
        service,
        serviceRequired,
        message,
        notes,
        city,
        source = 'Public Website'
      } = req.body;

      const clientName = fullName || name;
      const clientService = serviceRequired || service || 'General Consultation';
      const clientMessage = message || notes || '';

      if (!clientName || !email || !phone) {
        throw new AppError('Full name, email, and phone number are required', 400);
      }

      // Generate Reference Code
      const count = await LeadModel.countDocuments();
      const referenceId = `LD-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      // Create Lead in MongoDB
      const lead = await LeadModel.create({
        referenceId,
        customerName: clientName.trim(),
        email: email.toLowerCase().trim(),
        mobile: phone.trim(),
        serviceInterested: clientService,
        requirement: clientMessage,
        city: city || 'New Delhi',
        leadSource: source,
        status: LeadStatus.NEW,
        notes: [],
        timeline: [
          {
            action: 'Enquiry Received',
            actor: 'Website Visitor',
            details: `Enquiry submitted for ${clientService}`,
            timestamp: new Date()
          }
        ]
      });

      // Send background notification / job
      await QueueService.addJob('email-notifications', {
        type: 'NEW_LEAD_ALERT',
        leadId: lead._id,
        email: lead.email,
        name: lead.customerName,
        service: lead.serviceInterested
      });

      // Create in-app notification for admin
      await NotificationModel.create({
        notificationId: `NOTIF-${Date.now()}`,
        title: 'New Website Enquiry Received',
        description: `${lead.customerName} submitted an enquiry for ${lead.serviceInterested}`,
        category: 'Enquiry',
        link: '/leads'
      });

      logger.info(`[LeadController] New lead received: ${lead.referenceId} (${lead.email})`);

      res.status(201).json({
        success: true,
        message: 'Thank you! Your enquiry has been submitted successfully. Our team will contact you within 24 hours.',
        referenceId: lead.referenceId,
        data: {
          referenceId: lead.referenceId,
          id: lead._id,
          status: lead.status
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/leads (Admin & Staff CRM)
  static async getLeads(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const status = req.query.status as string;
      const search = req.query.search as string;
      const source = req.query.source as string;

      const filter: any = {};

      if (status && status !== 'all') {
        filter.status = status;
      }
      if (source && source !== 'all') {
        filter.leadSource = source;
      }
      if (search) {
        filter.$or = [
          { customerName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { mobile: { $regex: search, $options: 'i' } },
          { referenceId: { $regex: search, $options: 'i' } },
          { serviceInterested: { $regex: search, $options: 'i' } }
        ];
      }

      const total = await LeadModel.countDocuments(filter);
      const leads = await LeadModel.find(filter)
        .populate('assignedStaffId', 'name email mobile department')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      sendPaginated(res, 'Leads fetched successfully', leads, page, limit, total);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/leads/:id
  static async getLeadById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lead = await LeadModel.findById(req.params.id)
        .populate('assignedStaffId', 'name email mobile department')
        .lean();

      if (!lead) {
        throw new AppError('Lead not found', 404);
      }

      sendSuccess(res, 'Lead retrieved', lead);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/leads (Admin manually create lead)
  static async createLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, customerName, email, phone, mobile, serviceRequired, serviceInterested, city, source = 'Manual Entry', estimatedValue, assignedStaffId, notes } = req.body;

      const leadName = customerName || name;
      const leadPhone = mobile || phone;
      const leadService = serviceInterested || serviceRequired;

      if (!leadName || !email || !leadPhone) {
        throw new AppError('Name, email, and phone are required', 400);
      }

      const count = await LeadModel.countDocuments();
      const referenceId = `LD-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      const lead = await LeadModel.create({
        referenceId,
        customerName: leadName,
        email: email.toLowerCase().trim(),
        mobile: leadPhone,
        serviceInterested: leadService || 'General Consultation',
        city: city || 'New Delhi',
        leadSource: source,
        estimatedValue: estimatedValue || 0,
        assignedStaffId,
        status: LeadStatus.NEW,
        notes: notes ? [{ author: 'Admin', content: notes, createdAt: new Date() }] : [],
        timeline: [
          {
            action: 'Lead Created',
            actor: 'Admin',
            details: 'Lead manually entered into CRM',
            timestamp: new Date()
          }
        ]
      });

      sendSuccess(res, 'Lead created successfully', lead, 201);
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/v1/leads/:id
  static async updateLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, assignedStaffId, assignedStaffName, notes, estimatedValue } = req.body;
      const authUser = (req as any).user;

      const lead = await LeadModel.findById(req.params.id);
      if (!lead) {
        throw new AppError('Lead not found', 404);
      }

      if (status) lead.status = status;
      if (assignedStaffId !== undefined) lead.assignedStaffId = assignedStaffId;
      if (assignedStaffName !== undefined) lead.assignedStaffName = assignedStaffName;
      if (estimatedValue !== undefined) lead.estimatedValue = estimatedValue;
      if (notes) {
        lead.notes.push({
          author: authUser.name || 'Staff',
          content: notes,
          createdAt: new Date()
        });
      }

      lead.timeline.push({
        action: 'Lead Updated',
        actor: authUser.name || 'Staff',
        details: `Status set to ${lead.status}`,
        timestamp: new Date()
      });

      await lead.save();

      // Log activity
      await ActivityLogModel.create({
        action: ActivityAction.UPDATE,
        actorId: authUser.userId,
        actorName: authUser.name,
        actorRole: authUser.role,
        entityType: 'LEAD',
        entityId: lead._id.toString(),
        details: { referenceId: lead.referenceId, status: lead.status }
      });

      sendSuccess(res, 'Lead updated successfully', lead);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/leads/:id/convert (Convert Qualified Lead -> Client + ServiceRequest)
  static async convertToClient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUser = (req as any).user;
      const lead = await LeadModel.findById(req.params.id);
      if (!lead) {
        throw new AppError('Lead not found', 404);
      }

      // Check if client already exists with this email
      let client = await ClientModel.findOne({ email: lead.email });
      if (!client) {
        const clientCount = await ClientModel.countDocuments();
        const clientCode = `CLI-${new Date().getFullYear()}-${String(clientCount + 1).padStart(4, '0')}`;

        client = await ClientModel.create({
          clientId: clientCode,
          clientName: lead.customerName,
          businessName: lead.customerName,
          email: lead.email,
          mobile: lead.mobile,
          city: lead.city || 'New Delhi',
          state: 'Delhi (07)',
          totalServices: 1,
          services: [lead.serviceInterested || 'General Consultation'],
          paymentStatus: 'Pending',
          accountStatus: 'Active',
          internalNotes: lead.requirement
        });
      }

      // Automatically create initial service request for client
      const reqCount = await ServiceRequestModel.countDocuments();
      const requestCode = `SR-${new Date().getFullYear()}-${String(reqCount + 1).padStart(4, '0')}`;

      const serviceRequest = await ServiceRequestModel.create({
        requestId: requestCode,
        clientName: client.clientName,
        clientId: client._id,
        service: lead.serviceInterested || 'General Consultation',
        category: 'Taxation & Advisory',
        requestSource: 'Public Website',
        assignedStaff: 'Unassigned',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: RequestStatus.SUBMITTED,
        feeAmount: lead.estimatedValue || 0,
        notes: [lead.requirement || 'Converted from lead enquiry']
      });

      // Update lead status
      lead.status = LeadStatus.CONVERTED;
      lead.convertedClientId = client._id;
      lead.timeline.push({
        action: 'Converted to Client',
        actor: authUser.name || 'Admin',
        details: `Converted to Client ${client.clientId}`,
        timestamp: new Date()
      });
      await lead.save();

      await ActivityLogModel.create({
        action: ActivityAction.CONVERT,
        actorId: authUser.userId,
        actorName: authUser.name,
        actorRole: authUser.role,
        entityType: 'LEAD',
        entityId: lead._id.toString(),
        details: { referenceId: lead.referenceId, clientId: client.clientId }
      });

      sendSuccess(res, 'Lead successfully converted to Client & Service Request', {
        client,
        serviceRequest,
        lead
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/v1/leads/:id
  static async deleteLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lead = await LeadModel.findByIdAndDelete(req.params.id);
      if (!lead) {
        throw new AppError('Lead not found', 404);
      }
      sendSuccess(res, 'Lead deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

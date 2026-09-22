import { Request, Response, NextFunction } from 'express';
import { ServiceRequestModel } from '../models/ServiceRequest.model';
import { PartnerModel } from '../models/Partner.model';
import { ClientModel } from '../models/Client.model';
import { ActivityLogModel } from '../models/ActivityLog.model';
import { NotificationModel } from '../models/Notification.model';
import { sendSuccess, sendPaginated } from '../utils/apiResponse';
import { AppError } from '../middleware/error.middleware';
import { RequestStatus, UserRole, ActivityAction } from '../constants';

export class RequestController {
  // GET /api/v1/requests (Multi-portal with RBAC)
  static async getRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUser = (req as any).user;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const status = req.query.status as string;
      const priority = req.query.priority as string;
      const search = req.query.search as string;

      const filter: any = {};

      // Role-based scoping
      if (authUser.role === UserRole.PARTNER) {
        const partner = await PartnerModel.findOne({
          $or: [{ userId: authUser.userId }, { email: authUser.email }]
        });
        if (!partner) {
          sendPaginated(res, 'Requests fetched', [], page, limit, 0);
          return;
        }
        filter.partnerId = partner._id;
      } else if (authUser.role === UserRole.CLIENT) {
        const client = await ClientModel.findOne({ email: authUser.email });
        if (!client) {
          sendPaginated(res, 'Requests fetched', [], page, limit, 0);
          return;
        }
        filter.clientId = client._id;
      }

      if (status && status !== 'all') {
        filter.status = status;
      }
      if (priority && priority !== 'all') {
        filter.priority = priority;
      }
      if (search) {
        filter.$or = [
          { requestId: { $regex: search, $options: 'i' } },
          { clientName: { $regex: search, $options: 'i' } },
          { service: { $regex: search, $options: 'i' } }
        ];
      }

      const total = await ServiceRequestModel.countDocuments(filter);
      const requests = await ServiceRequestModel.find(filter)
        .populate('clientId', 'clientName email mobile businessName')
        .populate('partnerId', 'partnerName firmName email mobile')
        .populate('assignedStaffId', 'name email mobile department')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      sendPaginated(res, 'Service requests fetched successfully', requests, page, limit, total);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/requests/:id
  static async getRequestById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUser = (req as any).user;
      const serviceReq = await ServiceRequestModel.findById(req.params.id)
        .populate('clientId', 'clientName email mobile businessName city gstin pan')
        .populate('partnerId', 'partnerName firmName email mobile qualification')
        .populate('assignedStaffId', 'name email mobile department')
        .lean();

      if (!serviceReq) {
        throw new AppError('Service request not found', 404);
      }

      // Security check: Partner can only see assigned
      if (authUser.role === UserRole.PARTNER) {
        const partner = await PartnerModel.findOne({
          $or: [{ userId: authUser.userId }, { email: authUser.email }]
        });
        if (!partner || serviceReq.partnerId?._id?.toString() !== partner._id.toString()) {
          throw new AppError('Unauthorized access to this service request', 403);
        }
      } else if (authUser.role === UserRole.CLIENT) {
        const client = await ClientModel.findOne({ email: authUser.email });
        if (!client || serviceReq.clientId?._id?.toString() !== client._id.toString()) {
          throw new AppError('Unauthorized access to this service request', 403);
        }
      }

      sendSuccess(res, 'Service request details', serviceReq);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/requests (Admin create)
  static async createRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId, clientName, service, serviceName, category, priority = 'Medium', dueDate, feeAmount, notes } = req.body;
      const authUser = (req as any).user;

      const reqService = service || serviceName;
      if (!clientId || !reqService) {
        throw new AppError('Client ID and service name are required', 400);
      }

      const client = await ClientModel.findById(clientId);
      const reqClientName = client ? client.clientName : (clientName || 'Client');

      const count = await ServiceRequestModel.countDocuments();
      const requestId = `SR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      const serviceReq = await ServiceRequestModel.create({
        requestId,
        clientName: reqClientName,
        clientId,
        service: reqService,
        category: category || 'Taxation & Advisory',
        priority,
        dueDate: dueDate || new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        feeAmount: feeAmount || 0,
        status: RequestStatus.SUBMITTED,
        notes: notes ? [notes] : []
      });

      await ActivityLogModel.create({
        action: ActivityAction.CREATE,
        actorId: authUser.userId,
        actorName: authUser.name,
        actorRole: authUser.role,
        entityType: 'SERVICE_REQUEST',
        entityId: serviceReq._id.toString(),
        details: { requestId: serviceReq.requestId, service: serviceReq.service }
      });

      sendSuccess(res, 'Service request created successfully', serviceReq, 201);
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/v1/requests/:id/assign (Admin assign staff/partner)
  static async assignRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { partnerId, partnerName, assignedStaffId, assignedStaff } = req.body;
      const authUser = (req as any).user;

      const serviceReq = await ServiceRequestModel.findById(req.params.id);
      if (!serviceReq) {
        throw new AppError('Service request not found', 404);
      }

      if (partnerId !== undefined) {
        serviceReq.partnerId = partnerId || undefined;
        if (partnerName) serviceReq.partnerName = partnerName;
      }
      if (assignedStaffId !== undefined) {
        serviceReq.assignedStaffId = assignedStaffId || undefined;
        if (assignedStaff) serviceReq.assignedStaff = assignedStaff;
      }

      await serviceReq.save();

      // Notify Partner if assigned
      if (partnerId) {
        const partner = await PartnerModel.findById(partnerId);
        if (partner && partner.userId) {
          await NotificationModel.create({
            notificationId: `NOTIF-${Date.now()}`,
            title: 'New Service Request Assigned',
            description: `You have been assigned request ${serviceReq.requestId} (${serviceReq.service})`,
            category: 'Service',
            link: '/service-requests',
            targetUserId: partner.userId
          });
        }
      }

      await ActivityLogModel.create({
        action: ActivityAction.ASSIGN,
        actorId: authUser.userId,
        actorName: authUser.name,
        actorRole: authUser.role,
        entityType: 'SERVICE_REQUEST',
        entityId: serviceReq._id.toString(),
        details: { requestId: serviceReq.requestId, assignedStaff: serviceReq.assignedStaff }
      });

      sendSuccess(res, 'Service request assigned successfully', serviceReq);
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/v1/requests/:id/status (Workflow status update)
  static async updateRequestStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, note } = req.body;
      const authUser = (req as any).user;

      const serviceReq = await ServiceRequestModel.findById(req.params.id);
      if (!serviceReq) {
        throw new AppError('Service request not found', 404);
      }

      // Partner can only update assigned requests
      if (authUser.role === UserRole.PARTNER) {
        const partner = await PartnerModel.findOne({
          $or: [{ userId: authUser.userId }, { email: authUser.email }]
        });
        if (!partner || serviceReq.partnerId?.toString() !== partner._id.toString()) {
          throw new AppError('Unauthorized to update this request', 403);
        }
      }

      serviceReq.status = status;
      if (note) {
        serviceReq.notes.push(note);
      }
      await serviceReq.save();

      await ActivityLogModel.create({
        action: ActivityAction.STATUS_CHANGE,
        actorId: authUser.userId,
        actorName: authUser.name,
        actorRole: authUser.role,
        entityType: 'SERVICE_REQUEST',
        entityId: serviceReq._id.toString(),
        details: { requestId: serviceReq.requestId, status: serviceReq.status }
      });

      sendSuccess(res, `Request status updated to ${status}`, serviceReq);
    } catch (error) {
      next(error);
    }
  }
}

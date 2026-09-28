import { Request, Response, NextFunction } from 'express';
import { ClientModel } from '../models/Client.model';
import { ServiceRequestModel } from '../models/ServiceRequest.model';
import { PartnerModel } from '../models/Partner.model';
import { DocumentModel } from '../models/Document.model';
import { InvoiceModel } from '../models/Invoice.model';
import { ActivityLogModel } from '../models/ActivityLog.model';
import { sendSuccess, sendPaginated } from '../utils/apiResponse';
import { AppError } from '../middleware/error.middleware';
import { UserRole, ActivityAction } from '../constants';
import { generateUniqueClientId } from '../utils/idGenerator';

export class ClientController {
  // GET /api/v1/clients (Admin, Staff & Partner)
  static async getClients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUser = (req as any).user;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const status = req.query.status as string;
      const search = req.query.search as string;

      const filter: any = {};

      // Role-based scoping for partner
      if (authUser?.role === UserRole.PARTNER) {
        const partner = await PartnerModel.findOne({
          $or: [{ userId: authUser.userId }, { email: authUser.email }]
        });
        if (partner) {
          const clientIds = await ServiceRequestModel.find({ partnerId: partner._id }).distinct('clientId');
          filter.$or = [
            { _id: { $in: clientIds } },
            { partnerId: partner._id }
          ];
        }
      }

      if (status && status !== 'all') {
        filter.accountStatus = status;
      }
      if (search) {
        filter.$or = [
          { clientName: { $regex: search, $options: 'i' } },
          { businessName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { mobile: { $regex: search, $options: 'i' } },
          { clientId: { $regex: search, $options: 'i' } },
          { pan: { $regex: search, $options: 'i' } },
          { gstin: { $regex: search, $options: 'i' } }
        ];
      }

      const total = await ClientModel.countDocuments(filter);
      const clients = await ClientModel.find(filter)
        .populate('partnerId', 'partnerName firmName email mobile')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      sendPaginated(res, 'Clients fetched successfully', clients, page, limit, total);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/clients/:id
  static async getClientById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const client = await ClientModel.findById(req.params.id)
        .populate('partnerId', 'partnerName firmName email mobile')
        .lean();

      if (!client) {
        throw new AppError('Client not found', 404);
      }

      sendSuccess(res, 'Client retrieved', client);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/clients (Admin create client)
  static async createClient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, clientName, email, phone, mobile, companyName, businessName, gstin, pan, city, state, address, services, notes } = req.body;
      const authUser = (req as any).user;

      const cName = clientName || name;
      const cMobile = mobile || phone;
      const bName = businessName || companyName || cName;

      if (!cName || !email || !cMobile) {
        throw new AppError('Client name, email, and phone are required', 400);
      }

      const existingClient = await ClientModel.findOne({ email: email.toLowerCase().trim() });
      if (existingClient) {
        throw new AppError('A client with this email already exists', 409);
      }

      // Generate Unique Client ID
      const clientId = await generateUniqueClientId();

      const client = await ClientModel.create({
        clientId,
        clientName: cName.trim(),
        businessName: bName.trim(),
        email: email.toLowerCase().trim(),
        mobile: cMobile.trim(),
        gstin,
        pan,
        city: city || 'New Delhi',
        state: state || 'Delhi (07)',
        address,
        services: Array.isArray(services) ? services : ['General Consultation'],
        totalServices: Array.isArray(services) ? services.length : 1,
        internalNotes: notes,
        paymentStatus: 'Pending',
        accountStatus: 'Active'
      });

      await ActivityLogModel.create({
        action: ActivityAction.CREATE,
        actorId: authUser.userId,
        actorName: authUser.name,
        actorRole: authUser.role,
        entityType: 'CLIENT',
        entityId: client._id.toString(),
        details: { clientId: client.clientId, clientName: client.clientName }
      });

      sendSuccess(res, 'Client created successfully', client, 201);
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/v1/clients/:id
  static async updateClient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUser = (req as any).user;
      const client = await ClientModel.findByIdAndUpdate(req.params.id, req.body, { new: true });

      if (!client) {
        throw new AppError('Client not found', 404);
      }

      await ActivityLogModel.create({
        action: ActivityAction.UPDATE,
        actorId: authUser.userId,
        actorName: authUser.name,
        actorRole: authUser.role,
        entityType: 'CLIENT',
        entityId: client._id.toString(),
        details: { clientId: client.clientId }
      });

      sendSuccess(res, 'Client updated successfully', client);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/clients/:id/overview (Client 360 Overview)
  static async getClientOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const client = await ClientModel.findById(req.params.id).lean();
      if (!client) {
        throw new AppError('Client not found', 404);
      }

      const [requests, documents, invoices] = await Promise.all([
        ServiceRequestModel.find({ clientId: client._id }).sort({ createdAt: -1 }).lean(),
        DocumentModel.find({ clientId: client._id }).sort({ createdAt: -1 }).lean(),
        InvoiceModel.find({ clientId: client._id }).sort({ createdAt: -1 }).lean()
      ]);

      sendSuccess(res, 'Client 360 overview retrieved', {
        client,
        requests,
        documents,
        invoices
      });
    } catch (error) {
      next(error);
    }
  }
}

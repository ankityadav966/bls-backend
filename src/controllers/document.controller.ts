import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { DocumentModel } from '../models/Document.model';
import { PartnerModel } from '../models/Partner.model';
import { ClientModel } from '../models/Client.model';
import { ServiceRequestModel } from '../models/ServiceRequest.model';
import { ActivityLogModel } from '../models/ActivityLog.model';
import { sendSuccess, sendPaginated } from '../utils/apiResponse';
import { AppError } from '../middleware/error.middleware';
import { DocumentStatus, ActivityAction, UserRole } from '../constants';
import { logger } from '../utils/logger';
import { uploadFileToCloudinary } from '../config/cloudinary';

export class DocumentController {
  // POST /api/v1/documents/upload
  static async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUser = (req as any).user;
      const file = req.file;

      if (!file) {
        throw new AppError('No file uploaded or file format rejected', 400);
      }

      const { title, documentType, serviceRequest, serviceRequestId, client, clientId, remarks } = req.body;

      const validClientId = clientId && mongoose.Types.ObjectId.isValid(clientId) ? new mongoose.Types.ObjectId(clientId) : undefined;
      const validUserId = authUser?.userId && mongoose.Types.ObjectId.isValid(authUser.userId) ? new mongoose.Types.ObjectId(authUser.userId) : undefined;

      const count = await DocumentModel.countDocuments();
      const documentId = `DOC-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      // Resolve linked service request if any
      let linkedSr: any = null;
      if (serviceRequestId && serviceRequestId !== 'GENERAL_VAULT') {
        linkedSr = await ServiceRequestModel.findOne({
          $or: [
            { requestId: serviceRequestId },
            ...(mongoose.Types.ObjectId.isValid(serviceRequestId) ? [{ _id: serviceRequestId }] : [])
          ]
        });
      }

      const resolvedClientName = client || (linkedSr ? linkedSr.clientName : authUser.name) || 'Client';
      const resolvedClientId = validClientId || (linkedSr && linkedSr.clientId ? (linkedSr.clientId._id || linkedSr.clientId) : undefined);
      const resolvedSrTitle = serviceRequest || (linkedSr ? linkedSr.service : 'General Advisory');
      const resolvedSrId = linkedSr ? linkedSr.requestId : (serviceRequestId !== 'GENERAL_VAULT' ? serviceRequestId : undefined);

      // Upload directly to Cloudinary into BLS folder
      let cloudFilePath = `/uploads/${file.filename}`;
      try {
        const cloudUpload = await uploadFileToCloudinary(file.path, 'documents', true);
        cloudFilePath = cloudUpload.secureUrl;
        logger.info(`[DocumentController] Document successfully uploaded to Cloudinary: ${cloudFilePath}`);
      } catch (cloudErr) {
        logger.warn('[DocumentController] Cloudinary upload error, using local fallback:', cloudErr);
      }

      const document = await DocumentModel.create({
        documentId,
        documentName: title || file.originalname,
        client: resolvedClientName,
        clientId: resolvedClientId && mongoose.Types.ObjectId.isValid(resolvedClientId) ? resolvedClientId : undefined,
        serviceRequest: resolvedSrTitle,
        serviceRequestId: resolvedSrId,
        documentType: documentType || 'Other',
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        fileMime: file.mimetype,
        filePath: cloudFilePath,
        reviewStatus: DocumentStatus.PENDING,
        remarks: remarks || '',
        uploadedBy: validUserId
      });

      // Update Service Request workflow status & documents count
      if (linkedSr) {
        linkedSr.documentsCount = (linkedSr.documentsCount || 0) + 1;
        const curStatus = (linkedSr.status || '').toLowerCase();
        if (!curStatus || curStatus.includes('submit') || curStatus.includes('pending')) {
          linkedSr.status = 'Documents Received';
        }
        await linkedSr.save();
      }

      if (validUserId) {
        await ActivityLogModel.create({
          action: ActivityAction.UPLOAD,
          actorId: validUserId,
          actorName: authUser.name,
          actorRole: authUser.role,
          entityType: 'DOCUMENT',
          entityId: document._id.toString(),
          details: { documentId: document.documentId, name: document.documentName }
        });
      }

      logger.info(`[DocumentController] Document uploaded: ${document.documentId} by ${authUser.name}`);

      sendSuccess(res, 'Document uploaded successfully', document, 201);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/documents
  static async getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUser = (req as any).user;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const status = req.query.status as string;
      const search = req.query.search as string;

      const filter: any = {};

      if (authUser.role === UserRole.PARTNER) {
        const partner = await PartnerModel.findOne({
          $or: [{ userId: authUser.userId }, { email: authUser.email }]
        });
        const assignedRequests = partner ? await ServiceRequestModel.find({ partnerId: partner._id }).distinct('requestId') : [];
        filter.$or = [
          { uploadedBy: authUser.userId },
          { serviceRequestId: { $in: assignedRequests } }
        ];
      } else if (authUser.role === UserRole.CLIENT) {
        const client = await ClientModel.findOne({ email: authUser.email });
        if (client) {
          filter.$or = [
            { clientId: client._id },
            { client: client.clientName }
          ];
        }
      }

      if (status && status !== 'all') filter.reviewStatus = status;
      if (search) {
        filter.$or = [
          { documentName: { $regex: search, $options: 'i' } },
          { documentId: { $regex: search, $options: 'i' } },
          { client: { $regex: search, $options: 'i' } },
          { serviceRequest: { $regex: search, $options: 'i' } }
        ];
      }

      const total = await DocumentModel.countDocuments(filter);
      const documents = await DocumentModel.find(filter)
        .populate('clientId', 'clientName email mobile businessName')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      sendPaginated(res, 'Documents fetched', documents, page, limit, total);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/documents/:id/download
  static async downloadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUser = (req as any).user;
      const document = await DocumentModel.findById(req.params.id);
      if (!document) {
        throw new AppError('Document not found', 404);
      }

      // Security check: Client and Partner ownership verification
      if (authUser.role === UserRole.CLIENT) {
        const client = await ClientModel.findOne({ email: authUser.email });
        if (!client || (document.clientId && document.clientId.toString() !== client._id.toString())) {
          throw new AppError('Unauthorized: You do not have permission to download this document', 403);
        }
      } else if (authUser.role === UserRole.PARTNER) {
        const partner = await PartnerModel.findOne({
          $or: [{ userId: authUser.userId }, { email: authUser.email }]
        });
        let hasAccess = false;
        if (document.uploadedBy?.toString() === authUser.userId) {
          hasAccess = true;
        } else if (document.serviceRequestId && partner) {
          const isMongoId = mongoose.Types.ObjectId.isValid(document.serviceRequestId);
          const reqQuery: any = { partnerId: partner._id };
          if (isMongoId) {
            reqQuery.$or = [{ _id: document.serviceRequestId }, { requestId: document.serviceRequestId }];
          } else {
            reqQuery.requestId = document.serviceRequestId;
          }
          const sReq = await ServiceRequestModel.findOne(reqQuery);
          if (sReq) hasAccess = true;
        }
        if (!hasAccess) {
          throw new AppError('Unauthorized: Partner does not have permission to download this client document', 403);
        }
      }

      const fileName = path.basename(document.filePath);
      const fullPath = path.join(process.cwd(), 'uploads', fileName);

      if (!fs.existsSync(fullPath)) {
        throw new AppError('File not found on server', 404);
      }

      res.download(fullPath, document.documentName);
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/v1/documents/:id/review (Admin approve/reject)
  static async reviewDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, remarks } = req.body;
      const authUser = (req as any).user;

      const document = await DocumentModel.findById(req.params.id);
      if (!document) {
        throw new AppError('Document not found', 404);
      }

      document.reviewStatus = status;
      if (remarks) document.remarks = remarks;
      await document.save();

      await ActivityLogModel.create({
        action: ActivityAction.REVIEW,
        actorId: authUser.userId,
        actorName: authUser.name,
        actorRole: authUser.role,
        entityType: 'DOCUMENT',
        entityId: document._id.toString(),
        details: { documentId: document.documentId, status: document.reviewStatus }
      });

      sendSuccess(res, `Document status updated to ${status}`, document);
    } catch (error) {
      next(error);
    }
  }
}

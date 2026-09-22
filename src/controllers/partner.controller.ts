import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { PartnerModel } from '../models/Partner.model';
import { UserModel } from '../models/User.model';
import { ServiceRequestModel } from '../models/ServiceRequest.model';
import { WorkAssignmentModel } from '../models/WorkAssignment.model';
import { ActivityLogModel } from '../models/ActivityLog.model';
import { NotificationModel } from '../models/Notification.model';
import { sendSuccess, sendPaginated } from '../utils/apiResponse';
import { AppError } from '../middleware/error.middleware';
import { PartnerStatus, UserRole, ActivityAction } from '../constants';
import { logger } from '../utils/logger';

export class PartnerController {
  // POST /api/v1/partners/register or /api/partners (Public Website / Partner Portal application)
  static async registerPartner(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        fullName,
        name,
        email,
        phone,
        mobile,
        firmName,
        practiceType,
        profession,
        qualification,
        city,
        state,
        password
      } = req.body;

      const partnerFullName = fullName || name;
      const partnerMobile = mobile || phone;
      const partnerQual = qualification || practiceType || profession || 'Chartered Accountant';

      if (!partnerFullName || !email || !partnerMobile) {
        throw new AppError('Full name, email, and phone number are required', 400);
      }

      const existingUser = await UserModel.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        throw new AppError('An account with this email already exists', 409);
      }

      // Generate Partner Code
      const partnerCount = await PartnerModel.countDocuments();
      const partnerId = `PTR-${new Date().getFullYear()}-${String(partnerCount + 1).padStart(4, '0')}`;

      // Create User account (Default password if not provided in public form)
      const userPassword = password || 'Partner@123';
      const passwordHash = await bcrypt.hash(userPassword, 12);

      const user = await UserModel.create({
        name: partnerFullName.trim(),
        email: email.toLowerCase().trim(),
        phone: partnerMobile.trim(),
        passwordHash,
        role: UserRole.PARTNER,
        status: 'ACTIVE'
      });

      // Create Partner Record
      const partner = await PartnerModel.create({
        partnerId,
        userId: user._id,
        partnerName: partnerFullName.trim(),
        email: email.toLowerCase().trim(),
        mobile: partnerMobile.trim(),
        firmName: firmName || `${partnerFullName}'s Firm`,
        qualification: partnerQual,
        city: city || 'New Delhi',
        state: state || 'Delhi',
        status: PartnerStatus.PENDING_APPROVAL,
        totalReferrals: 0,
        activeClientsCount: 0,
        commercials: []
      });

      user.partnerId = partner._id;
      await user.save();

      // Create Admin notification
      await NotificationModel.create({
        notificationId: `NOTIF-${Date.now()}`,
        title: 'New Partner Application',
        description: `${partner.partnerName} (${partner.qualification}, ${partner.city}) applied for partnership`,
        category: 'Partner',
        link: '/partners'
      });

      logger.info(`[PartnerController] New partner registered: ${partner.partnerId} (${partner.email})`);

      res.status(201).json({
        success: true,
        message: 'Partner application submitted successfully! Our partner onboarding team will review your application.',
        partnerCode: partner.partnerId,
        partnerId: partner.partnerId,
        data: {
          partnerId: partner.partnerId,
          partnerCode: partner.partnerId,
          id: partner._id,
          status: partner.status
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/partners (Admin list partners)
  static async getPartners(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const status = req.query.status as string;
      const search = req.query.search as string;

      const filter: any = {};
      if (status && status !== 'all') {
        filter.status = status;
      }
      if (search) {
        filter.$or = [
          { partnerName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { mobile: { $regex: search, $options: 'i' } },
          { partnerId: { $regex: search, $options: 'i' } },
          { firmName: { $regex: search, $options: 'i' } },
          { city: { $regex: search, $options: 'i' } }
        ];
      }

      const total = await PartnerModel.countDocuments(filter);
      const partners = await PartnerModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      sendPaginated(res, 'Partners fetched successfully', partners, page, limit, total);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/partners/:id (Admin or partner self)
  static async getPartnerById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUser = (req as any).user;
      const partner = await PartnerModel.findById(req.params.id).lean();

      if (!partner) {
        throw new AppError('Partner not found', 404);
      }

      // Partner can only access their own profile
      if (authUser.role === UserRole.PARTNER && partner.userId?.toString() !== authUser.userId && partner.email !== authUser.email) {
        throw new AppError('Unauthorized to view this partner profile', 403);
      }

      // Fetch assigned service requests count
      const assignedRequestsCount = await ServiceRequestModel.countDocuments({ partnerId: partner._id });
      const completedRequestsCount = await ServiceRequestModel.countDocuments({
        partnerId: partner._id,
        status: 'Completed'
      });

      sendSuccess(res, 'Partner retrieved', {
        ...partner,
        stats: {
          assignedRequestsCount,
          completedRequestsCount
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/v1/partners/:id/status (Admin approval / rejection)
  static async updatePartnerStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, remarks } = req.body;
      const authUser = (req as any).user;

      const partner = await PartnerModel.findById(req.params.id);
      if (!partner) {
        throw new AppError('Partner not found', 404);
      }

      partner.status = status;
      if (remarks) partner.notes = remarks;
      await partner.save();

      // Log activity
      await ActivityLogModel.create({
        action: ActivityAction.VERIFY,
        actorId: authUser.userId,
        actorName: authUser.name,
        actorRole: authUser.role,
        entityType: 'PARTNER',
        entityId: partner._id.toString(),
        details: { partnerId: partner.partnerId, status: partner.status }
      });

      sendSuccess(res, `Partner verification status updated to ${status}`, partner);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/partners/me/dashboard (Partner portal dashboard)
  static async getPartnerDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUser = (req as any).user;
      const partner = await PartnerModel.findOne({
        $or: [{ userId: authUser.userId }, { email: authUser.email }]
      });

      if (!partner) {
        throw new AppError('Partner profile not found', 404);
      }

      const [assignedRequests, activeTasks] = await Promise.all([
        ServiceRequestModel.find({ partnerId: partner._id })
          .populate('clientId', 'clientName email mobile businessName')
          .sort({ updatedAt: -1 })
          .limit(10)
          .lean(),
        WorkAssignmentModel.find({ assignedStaffId: partner._id })
          .sort({ dueDate: 1 })
          .limit(10)
          .lean()
      ]);

      const totalRequests = await ServiceRequestModel.countDocuments({ partnerId: partner._id });
      const completedRequests = await ServiceRequestModel.countDocuments({
        partnerId: partner._id,
        status: 'Completed'
      });
      const inProgressRequests = await ServiceRequestModel.countDocuments({
        partnerId: partner._id,
        status: 'Processing'
      });

      const totalEarnings = partner.commercials.reduce((acc, curr) => acc + (curr.commissionAmount || 0), 0);
      const pendingPayouts = partner.commercials
        .filter((c) => c.status === 'Pending')
        .reduce((acc, curr) => acc + (curr.commissionAmount || 0), 0);

      sendSuccess(res, 'Partner dashboard data', {
        partner: {
          id: partner._id,
          partnerId: partner.partnerId,
          partnerName: partner.partnerName,
          firmName: partner.firmName,
          qualification: partner.qualification,
          city: partner.city,
          status: partner.status,
          totalReferrals: partner.totalReferrals,
          activeClientsCount: partner.activeClientsCount,
          totalEarnings,
          pendingPayouts
        },
        stats: {
          totalRequests,
          completedRequests,
          inProgressRequests,
          pendingPayouts,
          totalEarnings
        },
        assignedRequests,
        activeTasks,
        recentPayouts: partner.commercials.slice(-5)
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/partners/me/payouts
  static async getPartnerPayouts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUser = (req as any).user;
      const partner = await PartnerModel.findOne({
        $or: [{ userId: authUser.userId }, { email: authUser.email }]
      });

      if (!partner) {
        throw new AppError('Partner profile not found', 404);
      }

      sendSuccess(res, 'Partner payouts retrieved', partner.commercials || []);
    } catch (error) {
      next(error);
    }
  }
}

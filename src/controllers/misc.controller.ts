import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { StaffModel } from '../models/Staff.model';
import { UserModel } from '../models/User.model';
import { FollowUpModel } from '../models/FollowUp.model';
import { SupportTicketModel } from '../models/SupportTicket.model';
import { KnowledgeModel } from '../models/Knowledge.model';
import { NotificationModel } from '../models/Notification.model';
import { ActivityLogModel } from '../models/ActivityLog.model';
import { SettingsModel } from '../models/Settings.model';
import { sendSuccess, sendPaginated } from '../utils/apiResponse';
import { AppError } from '../middleware/error.middleware';
import { UserRole } from '../constants';

export class MiscController {
  // Staff
  static async getStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const staff = await StaffModel.find().populate('userId', 'email status lastLogin').sort({ name: 1 }).lean();
      sendSuccess(res, 'Staff members fetched', staff);
    } catch (error) {
      next(error);
    }
  }

  static async createStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, phone, mobile, department, password = 'Staff@123' } = req.body;
      if (!name || !email) throw new AppError('Name and email required', 400);

      const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
      if (existingUser) throw new AppError('Email already registered', 409);

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await UserModel.create({
        name,
        email: email.toLowerCase(),
        phone: mobile || phone || '+91 98110 00000',
        passwordHash,
        role: UserRole.STAFF,
        status: 'ACTIVE'
      });

      const count = await StaffModel.countDocuments();
      const staffId = `STF-${String(count + 1).padStart(3, '0')}`;

      const staff = await StaffModel.create({
        staffId,
        userId: user._id,
        name,
        email: email.toLowerCase(),
        mobile: mobile || phone || '+91 98110 00000',
        department: department || 'Taxation & Regulatory',
        role: 'Staff',
        status: 'Active'
      });

      user.staffId = staff._id;
      await user.save();

      sendSuccess(res, 'Staff member created', staff, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  // Follow-ups
  static async getFollowUps(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const followUps = await FollowUpModel.find()
        .populate('assignedStaffId', 'name email mobile department')
        .sort({ followUpDate: 1 })
        .lean();
      sendSuccess(res, 'Follow-ups retrieved', followUps);
    } catch (error) {
      next(error);
    }
  }

  static async createFollowUp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUser = (req as any).user;
      const { title, customer, relatedType = 'Lead', relatedId, assignedStaff, assignedStaffId, followUpDate, notes, priority = 'Medium' } = req.body;

      const count = await FollowUpModel.countDocuments();
      const followUpId = `FLP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      const followUp = await FollowUpModel.create({
        followUpId,
        customer: customer || title || 'Prospective Client',
        relatedType,
        relatedId: relatedId || 'LD-GENERAL',
        assignedStaff: assignedStaff || authUser.name || 'Staff',
        assignedStaffId,
        followUpDate: followUpDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: notes || 'Scheduled consultation call',
        priority,
        status: 'Upcoming'
      });

      sendSuccess(res, 'Follow-up created', followUp, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  // Tickets
  static async getTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUser = (req as any).user;
      const filter: any = {};
      if (authUser.role === UserRole.CLIENT) {
        filter.requesterEmail = authUser.email;
      } else if (authUser.role === UserRole.PARTNER) {
        filter.requesterEmail = authUser.email;
      }

      const tickets = await SupportTicketModel.find(filter)
        .populate('assignedStaffId', 'name email mobile')
        .sort({ createdAt: -1 })
        .lean();
      sendSuccess(res, 'Tickets retrieved', tickets);
    } catch (error) {
      next(error);
    }
  }

  static async createTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUser = (req as any).user;
      const { subject, category, message, priority = 'Medium' } = req.body;

      if (!subject || !message) throw new AppError('Subject and message required', 400);

      const count = await SupportTicketModel.countDocuments();
      const ticketId = `TKT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      const ticket = await SupportTicketModel.create({
        ticketId,
        requester: authUser.name,
        requesterType: authUser.role === UserRole.PARTNER ? 'Partner' : 'Client',
        requesterEmail: authUser.email,
        subject,
        category: category || 'General Support',
        priority,
        status: 'Open',
        assignedStaff: 'Support Desk',
        createdDate: new Date().toISOString().split('T')[0],
        messages: [
          {
            sender: authUser.name,
            senderRole: authUser.role === UserRole.PARTNER ? 'Partner' : (authUser.role === UserRole.ADMIN ? 'Admin' : 'Client'),
            message,
            timestamp: new Date()
          }
        ]
      });

      sendSuccess(res, 'Ticket submitted', ticket, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  // Knowledge & FAQs
  static async getKnowledge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category } = req.query;
      const filter: any = { status: 'Published' };
      if (category) filter.category = category;

      const items = await KnowledgeModel.find(filter).sort({ title: 1 }).lean();
      sendSuccess(res, 'Knowledge items fetched', items);
    } catch (error) {
      next(error);
    }
  }

  // Notifications
  static async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notifications = await NotificationModel.find()
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();

      sendSuccess(res, 'Notifications retrieved', notifications);
    } catch (error) {
      next(error);
    }
  }

  static async markNotificationRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await NotificationModel.findByIdAndUpdate(req.params.id, { read: true });
      sendSuccess(res, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }

  // Settings
  static async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let settings = await SettingsModel.findOne();
      if (!settings) {
        settings = await SettingsModel.create({
          companyName: 'BLS AND COMPANY',
          email: 'info@blscompany.com',
          phone: '+91 11 4982 3000'
        });
      }
      sendSuccess(res, 'Settings fetched', settings);
    } catch (error) {
      next(error);
    }
  }

  static async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await SettingsModel.findOneAndUpdate({}, req.body, { upsert: true, new: true });
      sendSuccess(res, 'Settings updated', settings);
    } catch (error) {
      next(error);
    }
  }

  // Activity Logs
  static async getActivityLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 30;
      const total = await ActivityLogModel.countDocuments();
      const logs = await ActivityLogModel.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      sendPaginated(res, 'Activity logs fetched', logs, page, limit, total);
    } catch (error) {
      next(error);
    }
  }
}

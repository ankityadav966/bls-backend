import { Request, Response, NextFunction } from 'express';
import { WorkAssignmentModel } from '../models/WorkAssignment.model';
import { PartnerModel } from '../models/Partner.model';
import { ActivityLogModel } from '../models/ActivityLog.model';
import { sendSuccess, sendPaginated } from '../utils/apiResponse';
import { AppError } from '../middleware/error.middleware';
import { UserRole, ActivityAction } from '../constants';

export class WorkController {
  // GET /api/v1/work
  static async getWorkAssignments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUser = (req as any).user;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const status = req.query.status as string;

      const filter: any = {};
      if (authUser.role === UserRole.PARTNER) {
        const partner = await PartnerModel.findOne({
          $or: [{ userId: authUser.userId }, { email: authUser.email }]
        });
        if (!partner) {
          sendPaginated(res, 'Work assignments', [], page, limit, 0);
          return;
        }
        filter.$or = [
          { assignedStaff: partner.partnerName },
          { assignedStaffId: partner._id }
        ];
      }

      if (status && status !== 'all') {
        filter.status = status;
      }

      const total = await WorkAssignmentModel.countDocuments(filter);
      const assignments = await WorkAssignmentModel.find(filter)
        .populate('serviceRequest', 'requestId service status')
        .populate('clientId', 'clientName email mobile businessName')
        .sort({ dueDate: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      sendPaginated(res, 'Work assignments retrieved', assignments, page, limit, total);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/work (Admin create work assignment)
  static async createWorkAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, service, client, clientId, serviceRequestId, assignedStaff, assignedStaffId, dueDate, priority = 'Medium', checklist } = req.body;
      const authUser = (req as any).user;

      const count = await WorkAssignmentModel.countDocuments();
      const taskId = `TSK-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      const assignment = await WorkAssignmentModel.create({
        taskId,
        serviceRequestId: serviceRequestId || 'SR-GENERAL',
        client: client || 'Client',
        clientId,
        service: service || title || 'Advisory Task',
        assignedStaff: assignedStaff || 'Unassigned',
        assignedStaffId,
        startDate: new Date().toISOString().split('T')[0],
        dueDate: dueDate || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority,
        status: 'Pending',
        completionPercentage: 0,
        checklistItems: Array.isArray(checklist) ? checklist.map((t: string) => ({ text: t, completed: false })) : []
      });

      await ActivityLogModel.create({
        action: ActivityAction.CREATE,
        actorId: authUser.userId,
        actorName: authUser.name,
        actorRole: authUser.role,
        entityType: 'WORK_ASSIGNMENT',
        entityId: assignment._id.toString(),
        details: { taskId: assignment.taskId, service: assignment.service }
      });

      sendSuccess(res, 'Work task created', assignment, 201);
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/v1/work/:id/progress (Partner / Staff update completion %)
  static async updateWorkProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUser = (req as any).user;
      const { progressPercentage, completionPercentage, status, checklistItems } = req.body;
      const assignment = await WorkAssignmentModel.findById(req.params.id);

      if (!assignment) {
        throw new AppError('Work assignment not found', 404);
      }

      // Check Partner ownership
      if (authUser.role === UserRole.PARTNER) {
        const partner = await PartnerModel.findOne({
          $or: [{ userId: authUser.userId }, { email: authUser.email }]
        });
        if (!partner || (assignment.assignedStaff !== partner.partnerName && assignment.assignedStaffId?.toString() !== partner._id.toString())) {
          throw new AppError('Unauthorized to update this work assignment', 403);
        }
      }

      const percent = completionPercentage !== undefined ? completionPercentage : progressPercentage;
      if (percent !== undefined) {
        assignment.completionPercentage = Math.min(100, Math.max(0, percent));
        if (assignment.completionPercentage === 100) {
          assignment.status = 'Completed';
        } else if (assignment.completionPercentage > 0 && assignment.status === 'Pending') {
          assignment.status = 'In Progress';
        }
      }

      if (status) assignment.status = status;
      if (checklistItems) assignment.checklistItems = checklistItems;

      await assignment.save();
      sendSuccess(res, 'Work progress updated', assignment);
    } catch (error) {
      next(error);
    }
  }
}

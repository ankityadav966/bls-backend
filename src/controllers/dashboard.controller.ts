import { Request, Response, NextFunction } from 'express';
import { LeadModel } from '../models/Lead.model';
import { ClientModel } from '../models/Client.model';
import { PartnerModel } from '../models/Partner.model';
import { ServiceRequestModel } from '../models/ServiceRequest.model';
import { InvoiceModel } from '../models/Invoice.model';
import { ActivityLogModel } from '../models/ActivityLog.model';
import { sendSuccess } from '../utils/apiResponse';

export class DashboardController {
  // GET /api/v1/dashboard/admin
  static async getAdminDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [
        totalLeads,
        newLeads,
        totalClients,
        activeClients,
        totalPartners,
        pendingPartners,
        totalRequests,
        inProgressRequests,
        pendingRequests,
        completedRequests,
        invoiceAgg,
        recentLeads,
        recentRequests,
        recentActivity
      ] = await Promise.all([
        LeadModel.countDocuments(),
        LeadModel.countDocuments({ status: 'New' }),
        ClientModel.countDocuments(),
        ClientModel.countDocuments({ accountStatus: 'Active' }),
        PartnerModel.countDocuments(),
        PartnerModel.countDocuments({ status: 'Pending Approval' }),
        ServiceRequestModel.countDocuments(),
        ServiceRequestModel.countDocuments({ status: 'Processing' }),
        ServiceRequestModel.countDocuments({ status: 'Submitted' }),
        ServiceRequestModel.countDocuments({ status: 'Completed' }),
        InvoiceModel.aggregate([
          {
            $group: {
              _id: null,
              totalInvoiced: { $sum: '$total' },
              totalCollected: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'Paid'] }, '$total', 0]
                }
              },
              totalOutstanding: {
                $sum: {
                  $cond: [{ $ne: ['$status', 'Paid'] }, '$total', 0]
                }
              }
            }
          }
        ]),
        LeadModel.find().sort({ createdAt: -1 }).limit(5).lean(),
        ServiceRequestModel.find()
          .populate('clientId', 'clientName businessName')
          .populate('partnerId', 'partnerName firmName')
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
        ActivityLogModel.find().sort({ createdAt: -1 }).limit(10).lean()
      ]);

      const financial = invoiceAgg[0] || { totalInvoiced: 0, totalCollected: 0, totalOutstanding: 0 };

      sendSuccess(res, 'Admin dashboard metrics retrieved', {
        metrics: {
          totalLeads,
          newLeads,
          totalClients,
          activeClients,
          totalPartners,
          pendingPartners,
          totalRequests,
          inProgressRequests,
          pendingRequests,
          completedRequests,
          totalRevenue: financial.totalCollected,
          pendingRevenue: financial.totalOutstanding,
          totalInvoiced: financial.totalInvoiced
        },
        recentLeads,
        recentRequests,
        recentActivity
      });
    } catch (error) {
      next(error);
    }
  }
}

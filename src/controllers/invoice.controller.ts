import { Request, Response, NextFunction } from 'express';
import { InvoiceModel } from '../models/Invoice.model';
import { PaymentModel } from '../models/Payment.model';
import { ClientModel } from '../models/Client.model';
import { ActivityLogModel } from '../models/ActivityLog.model';
import { sendSuccess, sendPaginated } from '../utils/apiResponse';
import { AppError } from '../middleware/error.middleware';
import { PaymentStatus, ActivityAction } from '../constants';

export class InvoiceController {
  // GET /api/v1/invoices
  static async getInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
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
          { invoiceNumber: { $regex: search, $options: 'i' } },
          { clientName: { $regex: search, $options: 'i' } }
        ];
      }

      const total = await InvoiceModel.countDocuments(filter);
      const invoices = await InvoiceModel.find(filter)
        .populate('clientId', 'clientName email mobile businessName gstin pan address')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      sendPaginated(res, 'Invoices fetched', invoices, page, limit, total);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/invoices/:id
  static async getInvoiceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invoice = await InvoiceModel.findById(req.params.id)
        .populate('clientId', 'clientName email mobile businessName gstin pan address city state')
        .lean();

      if (!invoice) {
        throw new AppError('Invoice not found', 404);
      }

      // Fetch payment history for this invoice
      const payments = await PaymentModel.find({ invoiceNumber: invoice.invoiceNumber })
        .sort({ createdAt: -1 })
        .lean();

      sendSuccess(res, 'Invoice retrieved', {
        ...invoice,
        payments
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/invoices (Admin create invoice)
  static async createInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        clientId,
        clientName,
        items,
        dueDate,
        isInterstate = false,
        notes
      } = req.body;
      const authUser = (req as any).user;

      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new AppError('At least one invoice line item is required', 400);
      }

      let cName = clientName;
      let cGstin = '';
      let cAddress = '';

      if (clientId) {
        const client = await ClientModel.findById(clientId);
        if (client) {
          cName = client.clientName;
          cGstin = client.gstin || '';
          cAddress = client.address || `${client.city}, ${client.state}`;
        }
      }

      const count = await InvoiceModel.countDocuments();
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      // Calculate totals
      let subtotal = 0;
      const processedItems = items.map((item: any) => {
        const lineTotal = Number(item.amount || (item.quantity * item.rate) || 0);
        subtotal += lineTotal;
        return {
          description: item.description || 'Professional Advisory Fee',
          sacCode: item.sacCode || item.hsnSac || '998231',
          amount: lineTotal
        };
      });

      const totalGst = Math.round(subtotal * 0.18);
      const cgst = isInterstate ? 0 : Math.round(totalGst / 2);
      const sgst = isInterstate ? 0 : Math.round(totalGst / 2);
      const igst = isInterstate ? totalGst : 0;
      const total = subtotal + totalGst;

      const invoice = await InvoiceModel.create({
        invoiceNumber,
        clientId: clientId || undefined,
        clientName: cName || 'Direct Client',
        clientGstin: cGstin,
        clientAddress: cAddress,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: processedItems,
        subtotal,
        cgst,
        sgst,
        igst,
        total,
        status: 'Unpaid',
        notes
      });

      await ActivityLogModel.create({
        action: ActivityAction.CREATE,
        actorId: authUser.userId,
        actorName: authUser.name,
        actorRole: authUser.role,
        entityType: 'INVOICE',
        entityId: invoice._id.toString(),
        details: { invoiceNumber: invoice.invoiceNumber, total: invoice.total }
      });

      sendSuccess(res, 'Invoice generated successfully', invoice, 201);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/invoices/:id/payment (Record offline / online payment)
  static async recordPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { amount, paymentMethod, transactionRef } = req.body;
      const authUser = (req as any).user;

      if (!amount || amount <= 0) {
        throw new AppError('Valid payment amount required', 400);
      }

      const invoice = await InvoiceModel.findById(req.params.id);
      if (!invoice) {
        throw new AppError('Invoice not found', 404);
      }

      const count = await PaymentModel.countDocuments();
      const paymentId = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      const payment = await PaymentModel.create({
        paymentId,
        invoiceNumber: invoice.invoiceNumber,
        invoiceId: invoice._id,
        clientId: invoice.clientId,
        client: invoice.clientName,
        service: invoice.items[0]?.description || 'Professional Advisory',
        amount: Number(amount),
        paymentMethod: paymentMethod || 'Bank Transfer / NEFT',
        transactionRef: transactionRef || `TXN-${Date.now()}`,
        paymentStatus: PaymentStatus.PAID,
        paymentDate: new Date().toISOString().split('T')[0]
      });

      invoice.status = 'Paid';
      await invoice.save();

      await ActivityLogModel.create({
        action: ActivityAction.CREATE,
        actorId: authUser.userId,
        actorName: authUser.name,
        actorRole: authUser.role,
        entityType: 'PAYMENT',
        entityId: payment._id.toString(),
        details: { paymentId: payment.paymentId, amount: payment.amount }
      });

      sendSuccess(res, 'Payment recorded successfully', {
        payment,
        invoice
      }, 201);
    } catch (error) {
      next(error);
    }
  }
}

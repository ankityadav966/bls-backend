import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoiceLineItem {
  description: string;
  sacCode: string;
  amount: number;
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  clientId?: mongoose.Types.ObjectId;
  clientName: string;
  clientGstin?: string;
  clientAddress?: string;
  issueDate: string;
  dueDate: string;
  items: IInvoiceLineItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  status: 'Paid' | 'Unpaid' | 'Overdue';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', index: true },
    clientName: { type: String, required: true, index: true },
    clientGstin: { type: String },
    clientAddress: { type: String },
    issueDate: { type: String, required: true },
    dueDate: { type: String, required: true },
    items: [
      {
        description: { type: String, required: true },
        sacCode: { type: String, default: '998231' },
        amount: { type: Number, required: true },
      },
    ],
    subtotal: { type: Number, required: true },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['Paid', 'Unpaid', 'Overdue'],
      default: 'Unpaid',
      index: true,
    },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
export const InvoiceModel = Invoice;

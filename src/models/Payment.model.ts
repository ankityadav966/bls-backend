import mongoose, { Document, Schema } from 'mongoose';
import { PAYMENT_STATUS, PaymentStatusType } from '../constants/index.js';

export interface IPayment extends Document {
  paymentId: string;
  clientId?: mongoose.Types.ObjectId;
  client: string;
  service: string;
  invoiceNumber: string;
  invoiceId?: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  paymentStatus: PaymentStatusType;
  transactionRef?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    paymentId: { type: String, required: true, unique: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', index: true },
    client: { type: String, required: true, index: true },
    service: { type: String, required: true },
    invoiceNumber: { type: String, required: true, index: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, default: 'Bank Transfer / NEFT' },
    paymentDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },
    transactionRef: { type: String },
  },
  { timestamps: true }
);

PaymentSchema.index({ paymentStatus: 1, paymentDate: -1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
export const PaymentModel = Payment;

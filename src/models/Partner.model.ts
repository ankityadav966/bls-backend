import mongoose, { Document, Schema } from 'mongoose';
import { PARTNER_STATUS, PartnerStatusType } from '../constants/index.js';

export interface IPartnerCommercialRecord {
  month: string;
  clientCount: number;
  serviceRevenue: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'Settled' | 'Processing' | 'Pending';
  paidDate?: string;
}

export interface IPartner extends Document {
  partnerId: string;
  userId?: mongoose.Types.ObjectId;
  partnerName: string;
  email: string;
  mobile: string;
  city: string;
  state: string;
  qualification: string;
  firmName?: string;
  registrationDate: string;
  totalReferrals: number;
  activeClientsCount: number;
  status: PartnerStatusType;
  bankAccount?: string;
  ifsc?: string;
  bankName?: string;
  commercials: IPartnerCommercialRecord[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PartnerSchema = new Schema<IPartner>(
  {
    partnerId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    partnerName: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    mobile: { type: String, required: true, trim: true, index: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, default: 'India', trim: true },
    qualification: { type: String, required: true, trim: true },
    firmName: { type: String, trim: true },
    registrationDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
    totalReferrals: { type: Number, default: 0 },
    activeClientsCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: Object.values(PARTNER_STATUS),
      default: PARTNER_STATUS.PENDING_APPROVAL,
      index: true,
    },
    bankAccount: { type: String, trim: true },
    ifsc: { type: String, trim: true },
    bankName: { type: String, trim: true },
    commercials: [
      {
        month: { type: String, required: true },
        clientCount: { type: Number, default: 0 },
        serviceRevenue: { type: Number, default: 0 },
        commissionRate: { type: Number, default: 15 },
        commissionAmount: { type: Number, default: 0 },
        status: { type: String, enum: ['Settled', 'Processing', 'Pending'], default: 'Pending' },
        paidDate: { type: String },
      },
    ],
    notes: { type: String },
  },
  { timestamps: true }
);

PartnerSchema.index({ status: 1, createdAt: -1 });

export const Partner = mongoose.model<IPartner>('Partner', PartnerSchema);
export const PartnerModel = Partner;
export const PartnerPayoutModel = Partner;

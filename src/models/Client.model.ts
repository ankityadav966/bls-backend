import mongoose, { Document, Schema } from 'mongoose';

export interface IClient extends Document {
  clientId: string;
  clientName: string;
  businessName: string;
  email: string;
  mobile: string;
  pan?: string;
  gstin?: string;
  city: string;
  state: string;
  address?: string;
  totalServices: number;
  paymentStatus: 'Paid' | 'Pending' | 'Overdue' | 'Partially Paid';
  accountStatus: 'Active' | 'Inactive' | 'Suspended';
  services: string[];
  partnerId?: mongoose.Types.ObjectId;
  internalNotes?: string;
  joinedDate: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    clientId: { type: String, required: true, unique: true, index: true },
    clientName: { type: String, required: true, trim: true, index: true },
    businessName: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    mobile: { type: String, required: true, trim: true, index: true },
    pan: { type: String, uppercase: true, trim: true, index: true },
    gstin: { type: String, uppercase: true, trim: true, index: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, default: 'Delhi (07)', trim: true },
    address: { type: String, trim: true },
    totalServices: { type: Number, default: 1 },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'Overdue', 'Partially Paid'],
      default: 'Pending',
      index: true,
    },
    accountStatus: {
      type: String,
      enum: ['Active', 'Inactive', 'Suspended'],
      default: 'Active',
      index: true,
    },
    services: [{ type: String }],
    partnerId: { type: Schema.Types.ObjectId, ref: 'Partner', index: true },
    internalNotes: { type: String },
    joinedDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  },
  { timestamps: true }
);

ClientSchema.index({ accountStatus: 1, paymentStatus: 1 });

export const Client = mongoose.model<IClient>('Client', ClientSchema);
export const ClientModel = Client;

import mongoose, { Document, Schema } from 'mongoose';
import { REQUEST_STATUS, RequestStatusType, PRIORITY_LEVELS, PriorityType } from '../constants/index.js';

export interface IServiceRequest extends Document {
  requestId: string;
  clientName: string;
  clientId?: mongoose.Types.ObjectId;
  service: string;
  serviceId?: mongoose.Types.ObjectId;
  category: string;
  requestSource: 'Public Website' | 'Direct Client' | 'Partner Portal';
  partnerName?: string;
  partnerId?: mongoose.Types.ObjectId;
  assignedStaff: string;
  assignedStaffId?: mongoose.Types.ObjectId;
  submissionDate: string;
  dueDate: string;
  priority: PriorityType;
  status: RequestStatusType;
  feeAmount: number;
  notes: string[];
  documentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceRequestSchema = new Schema<IServiceRequest>(
  {
    requestId: { type: String, required: true, unique: true, index: true },
    clientName: { type: String, required: true, trim: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', index: true },
    service: { type: String, required: true, trim: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service' },
    category: { type: String, required: true, trim: true, index: true },
    requestSource: {
      type: String,
      enum: ['Public Website', 'Direct Client', 'Partner Portal'],
      default: 'Direct Client',
      index: true,
    },
    partnerName: { type: String, trim: true },
    partnerId: { type: Schema.Types.ObjectId, ref: 'Partner', index: true },
    assignedStaff: { type: String, default: 'Unassigned' },
    assignedStaffId: { type: Schema.Types.ObjectId, ref: 'Staff', index: true },
    submissionDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
    dueDate: { type: String, required: true },
    priority: {
      type: String,
      enum: Object.values(PRIORITY_LEVELS),
      default: PRIORITY_LEVELS.MEDIUM,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(REQUEST_STATUS),
      default: REQUEST_STATUS.SUBMITTED,
      index: true,
    },
    feeAmount: { type: Number, default: 0 },
    notes: [{ type: String }],
    documentsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ServiceRequestSchema.index({ status: 1, priority: 1, createdAt: -1 });

export const ServiceRequest = mongoose.model<IServiceRequest>('ServiceRequest', ServiceRequestSchema);
export const ServiceRequestModel = ServiceRequest;

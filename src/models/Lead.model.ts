import mongoose, { Document, Schema } from 'mongoose';
import { LEAD_STATUS, LeadStatusType } from '../constants/index.js';

export interface ILeadNote {
  author: string;
  content: string;
  createdAt: Date;
}

export interface ILeadTimeline {
  action: string;
  actor: string;
  details?: string;
  timestamp: Date;
}

export interface ILead extends Document {
  referenceId: string;
  customerName: string;
  mobile: string;
  email: string;
  city?: string;
  category?: string;
  serviceInterested: string;
  requirement?: string;
  leadSource: string;
  preferredContactMethod?: string;
  assignedStaffId?: mongoose.Types.ObjectId;
  assignedStaffName?: string;
  status: LeadStatusType;
  estimatedValue?: number;
  convertedClientId?: mongoose.Types.ObjectId;
  notes: ILeadNote[];
  timeline: ILeadTimeline[];
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    referenceId: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true, trim: true, index: true },
    mobile: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    city: { type: String, trim: true },
    category: { type: String, trim: true },
    serviceInterested: { type: String, required: true, trim: true },
    requirement: { type: String, trim: true },
    leadSource: { type: String, default: 'Public Website', index: true },
    preferredContactMethod: { type: String, default: 'Phone Call' },
    assignedStaffId: { type: Schema.Types.ObjectId, ref: 'Staff', index: true },
    assignedStaffName: { type: String, default: 'Unassigned' },
    status: {
      type: String,
      enum: Object.values(LEAD_STATUS),
      default: LEAD_STATUS.NEW,
      index: true,
    },
    estimatedValue: { type: Number, default: 0 },
    convertedClientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    notes: [
      {
        author: { type: String, required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    timeline: [
      {
        action: { type: String, required: true },
        actor: { type: String, required: true },
        details: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Compound indexes
LeadSchema.index({ status: 1, createdAt: -1 });
LeadSchema.index({ assignedStaffId: 1, status: 1 });

export const Lead = mongoose.model<ILead>('Lead', LeadSchema);
export const LeadModel = Lead;

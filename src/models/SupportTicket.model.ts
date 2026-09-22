import mongoose, { Document, Schema } from 'mongoose';
import { PRIORITY_LEVELS, PriorityType } from '../constants/index.js';

export interface ITicketMessage {
  sender: string;
  senderRole: 'Partner' | 'Client' | 'Staff' | 'Admin';
  message: string;
  timestamp: Date;
}

export interface ISupportTicket extends Document {
  ticketId: string;
  requester: string;
  requesterType: 'Partner' | 'Client';
  requesterEmail: string;
  subject: string;
  category: string;
  priority: PriorityType;
  assignedStaff: string;
  assignedStaffId?: mongoose.Types.ObjectId;
  createdDate: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  messages: ITicketMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    ticketId: { type: String, required: true, unique: true, index: true },
    requester: { type: String, required: true, index: true },
    requesterType: { type: String, enum: ['Partner', 'Client'], default: 'Client', index: true },
    requesterEmail: { type: String, required: true, lowercase: true, index: true },
    subject: { type: String, required: true, trim: true },
    category: { type: String, default: 'General', index: true },
    priority: {
      type: String,
      enum: Object.values(PRIORITY_LEVELS),
      default: PRIORITY_LEVELS.MEDIUM,
    },
    assignedStaff: { type: String, default: 'Unassigned' },
    assignedStaffId: { type: Schema.Types.ObjectId, ref: 'Staff' },
    createdDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open',
      index: true,
    },
    messages: [
      {
        sender: { type: String, required: true },
        senderRole: { type: String, enum: ['Partner', 'Client', 'Staff', 'Admin'], required: true },
        message: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
export const SupportTicketModel = SupportTicket;

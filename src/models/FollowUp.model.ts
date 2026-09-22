import mongoose, { Document, Schema } from 'mongoose';
import { PRIORITY_LEVELS, PriorityType } from '../constants/index.js';

export interface IFollowUp extends Document {
  followUpId: string;
  customer: string;
  relatedType: 'Lead' | 'Client';
  relatedId: string;
  assignedStaff: string;
  assignedStaffId?: mongoose.Types.ObjectId;
  followUpDate: string;
  followUpTime: string;
  notes: string;
  status: 'Today' | 'Upcoming' | 'Overdue' | 'Completed';
  priority: PriorityType;
  createdAt: Date;
  updatedAt: Date;
}

const FollowUpSchema = new Schema<IFollowUp>(
  {
    followUpId: { type: String, required: true, unique: true, index: true },
    customer: { type: String, required: true, index: true },
    relatedType: { type: String, enum: ['Lead', 'Client'], default: 'Lead' },
    relatedId: { type: String, required: true, index: true },
    assignedStaff: { type: String, required: true, index: true },
    assignedStaffId: { type: Schema.Types.ObjectId, ref: 'Staff' },
    followUpDate: { type: String, required: true, index: true },
    followUpTime: { type: String, default: '11:00 AM' },
    notes: { type: String, required: true },
    status: {
      type: String,
      enum: ['Today', 'Upcoming', 'Overdue', 'Completed'],
      default: 'Upcoming',
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(PRIORITY_LEVELS),
      default: PRIORITY_LEVELS.MEDIUM,
    },
  },
  { timestamps: true }
);

export const FollowUp = mongoose.model<IFollowUp>('FollowUp', FollowUpSchema);
export const FollowUpModel = FollowUp;

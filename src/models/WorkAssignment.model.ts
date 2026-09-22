import mongoose, { Document, Schema } from 'mongoose';
import { PRIORITY_LEVELS, PriorityType } from '../constants/index.js';

export interface IChecklistItem {
  text: string;
  completed: boolean;
}

export interface IWorkAssignment extends Document {
  taskId: string;
  serviceRequestId: string;
  serviceRequest?: mongoose.Types.ObjectId;
  client: string;
  clientId?: mongoose.Types.ObjectId;
  service: string;
  assignedStaff: string;
  assignedStaffId?: mongoose.Types.ObjectId;
  startDate: string;
  dueDate: string;
  priority: PriorityType;
  status: 'Pending' | 'In Progress' | 'Under Review' | 'Completed' | 'Overdue';
  completionPercentage: number;
  checklistItems: IChecklistItem[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WorkAssignmentSchema = new Schema<IWorkAssignment>(
  {
    taskId: { type: String, required: true, unique: true, index: true },
    serviceRequestId: { type: String, required: true, index: true },
    serviceRequest: { type: Schema.Types.ObjectId, ref: 'ServiceRequest' },
    client: { type: String, required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    service: { type: String, required: true },
    assignedStaff: { type: String, required: true, index: true },
    assignedStaffId: { type: Schema.Types.ObjectId, ref: 'Staff', index: true },
    startDate: { type: String, required: true },
    dueDate: { type: String, required: true, index: true },
    priority: {
      type: String,
      enum: Object.values(PRIORITY_LEVELS),
      default: PRIORITY_LEVELS.MEDIUM,
      index: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Under Review', 'Completed', 'Overdue'],
      default: 'Pending',
      index: true,
    },
    completionPercentage: { type: Number, default: 0 },
    checklistItems: [
      {
        text: { type: String, required: true },
        completed: { type: Boolean, default: false },
      },
    ],
    description: { type: String },
  },
  { timestamps: true }
);

WorkAssignmentSchema.index({ status: 1, dueDate: 1 });

export const WorkAssignment = mongoose.model<IWorkAssignment>('WorkAssignment', WorkAssignmentSchema);
export const WorkAssignmentModel = WorkAssignment;

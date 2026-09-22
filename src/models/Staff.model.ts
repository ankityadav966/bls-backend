import mongoose, { Document, Schema } from 'mongoose';

export interface IStaff extends Document {
  staffId: string;
  userId?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  mobile: string;
  department: string;
  role: 'Admin' | 'Manager' | 'Staff';
  assignedTasks: number;
  status: 'Active' | 'Inactive';
  avatar?: string;
  joinedDate: string;
  createdAt: Date;
  updatedAt: Date;
}

const StaffSchema = new Schema<IStaff>(
  {
    staffId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    mobile: { type: String, required: true, trim: true },
    department: { type: String, required: true, index: true },
    role: {
      type: String,
      enum: ['Admin', 'Manager', 'Staff'],
      default: 'Staff',
      index: true,
    },
    assignedTasks: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
      index: true,
    },
    avatar: { type: String },
    joinedDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  },
  { timestamps: true }
);

export const Staff = mongoose.model<IStaff>('Staff', StaffSchema);
export const StaffModel = Staff;

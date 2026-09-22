import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, UserRole } from '../constants/index.js';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';
  partnerId?: mongoose.Types.ObjectId;
  clientId?: mongoose.Types.ObjectId;
  staffId?: mongoose.Types.ObjectId;
  avatar?: string;
  lastLogin?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CLIENT,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true,
    },
    partnerId: { type: Schema.Types.ObjectId, ref: 'Partner' },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    staffId: { type: Schema.Types.ObjectId, ref: 'Staff' },
    avatar: { type: String },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// Indexes
UserSchema.index({ role: 1, status: 1 });

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.model<IUser>('User', UserSchema);
export const UserModel = User;

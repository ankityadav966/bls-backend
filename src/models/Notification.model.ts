import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  notificationId: string;
  title: string;
  description: string;
  category: 'Enquiry' | 'Partner' | 'Service' | 'Document' | 'Payment' | 'FollowUp' | 'Ticket';
  timestamp: string;
  read: boolean;
  link: string;
  targetRole?: string;
  targetUserId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    notificationId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['Enquiry', 'Partner', 'Service', 'Document', 'Payment', 'FollowUp', 'Ticket'],
      default: 'Enquiry',
      index: true,
    },
    timestamp: { type: String, default: 'Just now' },
    read: { type: Boolean, default: false, index: true },
    link: { type: String, default: '/dashboard' },
    targetRole: { type: String, default: 'ADMIN' },
    targetUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

NotificationSchema.index({ targetRole: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
export const NotificationModel = Notification;

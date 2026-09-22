import mongoose, { Document, Schema } from 'mongoose';

export interface IService extends Document {
  serviceId: string;
  name: string;
  category: string;
  baseFee: number;
  turnaroundDays: number;
  description: string;
  isActive: boolean;
  documentsRequired: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    serviceId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    category: { type: String, required: true, trim: true, index: true },
    baseFee: { type: Number, required: true },
    turnaroundDays: { type: Number, default: 7 },
    description: { type: String, required: true },
    isActive: { type: Boolean, default: true, index: true },
    documentsRequired: [{ type: String }],
  },
  { timestamps: true }
);

export const Service = mongoose.model<IService>('Service', ServiceSchema);
export const ServiceModel = Service;

import mongoose, { Document, Schema } from 'mongoose';
import { DOCUMENT_STATUS, DocumentStatusType } from '../constants/index.js';

export interface IDocument extends Document {
  documentId: string;
  documentName: string;
  client: string;
  clientId?: mongoose.Types.ObjectId;
  serviceRequest: string;
  serviceRequestId?: string;
  documentType: string;
  fileSize: string;
  fileMime: string;
  filePath: string;
  uploadDate: string;
  reviewStatus: DocumentStatusType;
  remarks?: string;
  uploadedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    documentId: { type: String, required: true, unique: true, index: true },
    documentName: { type: String, required: true, trim: true, index: true },
    client: { type: String, required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', index: true },
    serviceRequest: { type: String, required: true },
    serviceRequestId: { type: String, index: true },
    documentType: { type: String, required: true },
    fileSize: { type: String, required: true },
    fileMime: { type: String, default: 'application/pdf' },
    filePath: { type: String, required: true },
    uploadDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
    reviewStatus: {
      type: String,
      enum: Object.values(DOCUMENT_STATUS),
      default: DOCUMENT_STATUS.PENDING,
      index: true,
    },
    remarks: { type: String },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

DocumentSchema.index({ clientId: 1, reviewStatus: 1 });

export const DocumentModel = mongoose.model<IDocument>('Document', DocumentSchema);

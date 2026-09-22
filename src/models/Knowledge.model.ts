import mongoose, { Document, Schema } from 'mongoose';

export interface IKnowledge extends Document {
  articleId: string;
  title: string;
  category: string;
  author: string;
  status: 'Published' | 'Draft';
  lastUpdated: string;
  views: number;
  summary: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeSchema = new Schema<IKnowledge>(
  {
    articleId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true, index: true },
    category: { type: String, required: true, index: true },
    author: { type: String, required: true },
    status: { type: String, enum: ['Published', 'Draft'], default: 'Published', index: true },
    lastUpdated: { type: String, default: () => new Date().toISOString().split('T')[0] },
    views: { type: Number, default: 0 },
    summary: { type: String, required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

export const Knowledge = mongoose.model<IKnowledge>('Knowledge', KnowledgeSchema);
export const KnowledgeModel = Knowledge;

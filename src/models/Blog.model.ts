import mongoose, { Document, Schema } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  author: string;
  authorRole: string;
  readTime: string;
  featured: boolean;
  status: 'Published' | 'Draft';
  views: number;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    excerpt: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    coverImage: { type: String, default: '' },
    category: { type: String, required: true, default: 'General', index: true },
    tags: [{ type: String, trim: true }],
    author: { type: String, required: true, default: 'CA Bhanwar Lal Saini' },
    authorRole: { type: String, default: 'Senior Partner & Tax Advisor' },
    readTime: { type: String, default: '4 min read' },
    featured: { type: Boolean, default: false, index: true },
    status: { type: String, enum: ['Published', 'Draft'], default: 'Published', index: true },
    views: { type: Number, default: 0 },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Pre-validate slug generation if not provided
BlogSchema.pre('validate', function (next) {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);
  }
  next();
});

export const Blog = mongoose.model<IBlog>('Blog', BlogSchema);
export const BlogModel = Blog;

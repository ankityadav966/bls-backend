import { Request, Response } from 'express';
import { Blog, IBlog } from '../models/Blog.model';
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse';
import { logger } from '../utils/logger';

const calculateReadTime = (content: string): string => {
  const words = content ? content.trim().split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
};

export class BlogController {
  /**
   * Public: Get published blogs with filters, search, and pagination
   */
  public static async getPublicBlogs(req: Request, res: Response): Promise<any> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.max(1, Math.min(50, parseInt(req.query.limit as string) || 9));
      const skip = (page - 1) * limit;

      const { category, search, tag, featured } = req.query;

      const query: any = { status: 'Published' };

      if (category && category !== 'All') {
        query.category = { $regex: new RegExp(`^${category}$`, 'i') };
      }

      if (tag) {
        query.tags = { $in: [tag as string] };
      }

      if (featured === 'true') {
        query.featured = true;
      }

      if (search && typeof search === 'string' && search.trim() !== '') {
        const searchRegex = new RegExp(search.trim(), 'i');
        query.$or = [
          { title: searchRegex },
          { excerpt: searchRegex },
          { tags: { $in: [searchRegex] } },
          { author: searchRegex },
        ];
      }

      const [blogs, total] = await Promise.all([
        Blog.find(query)
          .sort({ featured: -1, publishedAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Blog.countDocuments(query),
      ]);

      return sendPaginated(res, 'Blogs fetched successfully', blogs, page, limit, total);
    } catch (error: any) {
      logger.error('[BlogController] getPublicBlogs error:', error);
      return sendError(res, error.message || 'Failed to fetch blogs', 500);
    }
  }

  /**
   * Public: Get single published blog by slug (or id) and fetch related articles
   */
  public static async getPublicBlogBySlug(req: Request, res: Response): Promise<any> {
    try {
      const { slug } = req.params;

      const blog = await Blog.findOneAndUpdate(
        { $or: [{ slug }, { _id: slug.match(/^[0-9a-fA-F]{24}$/) ? slug : null }], status: 'Published' },
        { $inc: { views: 1 } },
        { new: true }
      ).lean();

      if (!blog) {
        return sendError(res, 'Blog article not found or not published', 404);
      }

      // Fetch 3 related blogs from the same category
      const relatedBlogs = await Blog.find({
        _id: { $ne: blog._id },
        category: blog.category,
        status: 'Published',
      })
        .sort({ publishedAt: -1 })
        .limit(3)
        .lean();

      return sendSuccess(res, 'Blog article retrieved successfully', {
        blog,
        relatedBlogs,
      });
    } catch (error: any) {
      logger.error('[BlogController] getPublicBlogBySlug error:', error);
      return sendError(res, error.message || 'Failed to retrieve blog article', 500);
    }
  }

  /**
   * Admin: Get all blogs with analytics overview
   */
  public static async getAdminBlogs(req: Request, res: Response): Promise<any> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
      const skip = (page - 1) * limit;

      const { search, category, status } = req.query;
      const query: any = {};

      if (category && category !== 'All') {
        query.category = category;
      }

      if (status && status !== 'All') {
        query.status = status;
      }

      if (search && typeof search === 'string' && search.trim() !== '') {
        const searchRegex = new RegExp(search.trim(), 'i');
        query.$or = [
          { title: searchRegex },
          { excerpt: searchRegex },
          { author: searchRegex },
          { tags: { $in: [searchRegex] } },
        ];
      }

      const [blogs, total, totalPublished, totalDrafts, totalViewsAgg] = await Promise.all([
        Blog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Blog.countDocuments(query),
        Blog.countDocuments({ status: 'Published' }),
        Blog.countDocuments({ status: 'Draft' }),
        Blog.aggregate([{ $group: { _id: null, totalViews: { $sum: '$views' } } }]),
      ]);

      const totalViews = totalViewsAgg[0]?.totalViews || 0;

      return res.status(200).json({
        success: true,
        message: 'Admin blogs retrieved successfully',
        data: blogs,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          stats: {
            total,
            published: totalPublished,
            drafts: totalDrafts,
            totalViews,
          },
        },
      });
    } catch (error: any) {
      logger.error('[BlogController] getAdminBlogs error:', error);
      return sendError(res, error.message || 'Failed to fetch admin blogs', 500);
    }
  }

  /**
   * Admin: Upload local image file directly from user's system
   */
  public static async uploadCoverImage(req: Request, res: Response): Promise<any> {
    try {
      if (!req.file) {
        return sendError(res, 'No image file provided for upload', 400);
      }

      const relativePath = `/uploads/${req.file.filename}`;
      return sendSuccess(res, 'Image uploaded successfully', {
        filename: req.file.filename,
        path: relativePath,
        url: relativePath,
      });
    } catch (error: any) {
      logger.error('[BlogController] uploadCoverImage error:', error);
      return sendError(res, error.message || 'Image upload failed', 500);
    }
  }

  /**
   * Admin: Create a new blog post
   */
  public static async createBlog(req: Request, res: Response): Promise<any> {
    try {
      const {
        title,
        slug,
        excerpt,
        content,
        coverImage,
        category,
        tags,
        author,
        authorRole,
        readTime,
        featured,
        status,
      } = req.body;

      if (!title || !excerpt || !content) {
        return sendError(res, 'Title, excerpt, and content are required fields', 400);
      }

      // If file was uploaded with multipart/form-data
      let finalCoverImage = coverImage || '';
      if (req.file) {
        finalCoverImage = `/uploads/${req.file.filename}`;
      }

      // Clean and sanitize tags
      let parsedTags: string[] = [];
      if (Array.isArray(tags)) {
        parsedTags = tags;
      } else if (typeof tags === 'string') {
        try {
          parsedTags = JSON.parse(tags);
        } catch {
          parsedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
        }
      }

      // Generate or sanitize slug
      let generatedSlug = (slug || title)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      // Check unique slug collision
      const existing = await Blog.findOne({ slug: generatedSlug });
      if (existing) {
        generatedSlug = `${generatedSlug}-${Date.now().toString().slice(-4)}`;
      }

      // If admin confirmed to delete/replace previous blog(s)
      const shouldReplace = req.body.replacePrevious === true || req.body.replacePrevious === 'true';
      if (shouldReplace) {
        if (req.body.previousBlogId) {
          await Blog.findByIdAndDelete(req.body.previousBlogId);
          logger.info(`[BlogController] Deleted previous blog (${req.body.previousBlogId}) upon admin confirmation`);
        } else {
          await Blog.deleteMany({});
          logger.info('[BlogController] Deleted all previous blogs upon admin replacement confirmation');
        }
      }

      const blog = await Blog.create({
        title: title.trim(),
        slug: generatedSlug,
        excerpt: excerpt.trim(),
        content: content.trim(),
        coverImage: finalCoverImage,
        category: category || 'Taxation & Regulatory',
        tags: parsedTags,
        author: author || req.user?.name || 'CA Bhanwar Lal Saini',
        authorRole: authorRole || 'Senior Partner & Tax Advisor',
        readTime: readTime || calculateReadTime(content),
        featured: featured === true || featured === 'true',
        status: status || 'Published',
        publishedAt: status === 'Draft' ? undefined : new Date(),
      });

      logger.info(`[BlogController] Created blog: "${blog.title}" (${blog._id})`);
      return sendSuccess(res, 'Blog created successfully', blog, 201);
    } catch (error: any) {
      logger.error('[BlogController] createBlog error:', error);
      return sendError(res, error.message || 'Failed to create blog', 500);
    }
  }

  /**
   * Admin: Update blog
   */
  public static async updateBlog(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const updates = { ...req.body };

      if (req.file) {
        updates.coverImage = `/uploads/${req.file.filename}`;
      }

      if (updates.tags && typeof updates.tags === 'string') {
        try {
          updates.tags = JSON.parse(updates.tags);
        } catch {
          updates.tags = updates.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
        }
      }

      if (updates.content && !updates.readTime) {
        updates.readTime = calculateReadTime(updates.content);
      }

      if (updates.status === 'Published' && !updates.publishedAt) {
        updates.publishedAt = new Date();
      }

      const blog = await Blog.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
      if (!blog) {
        return sendError(res, 'Blog not found', 404);
      }

      logger.info(`[BlogController] Updated blog: "${blog.title}" (${blog._id})`);
      return sendSuccess(res, 'Blog updated successfully', blog);
    } catch (error: any) {
      logger.error('[BlogController] updateBlog error:', error);
      return sendError(res, error.message || 'Failed to update blog', 500);
    }
  }

  /**
   * Admin: Quick status toggle (Published <-> Draft)
   */
  public static async updateBlogStatus(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['Published', 'Draft'].includes(status)) {
        return sendError(res, 'Invalid status. Must be "Published" or "Draft".', 400);
      }

      const updateData: any = { status };
      if (status === 'Published') {
        updateData.publishedAt = new Date();
      }

      const blog = await Blog.findByIdAndUpdate(id, updateData, { new: true });
      if (!blog) {
        return sendError(res, 'Blog not found', 404);
      }

      return sendSuccess(res, `Blog status updated to ${status}`, blog);
    } catch (error: any) {
      logger.error('[BlogController] updateBlogStatus error:', error);
      return sendError(res, error.message || 'Failed to update blog status', 500);
    }
  }

  /**
   * Admin: Delete blog
   */
  public static async deleteBlog(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const blog = await Blog.findByIdAndDelete(id);
      if (!blog) {
        return sendError(res, 'Blog not found', 404);
      }

      logger.info(`[BlogController] Deleted blog: "${blog.title}" (${blog._id})`);
      return sendSuccess(res, 'Blog deleted successfully');
    } catch (error: any) {
      logger.error('[BlogController] deleteBlog error:', error);
      return sendError(res, error.message || 'Failed to delete blog', 500);
    }
  }
}

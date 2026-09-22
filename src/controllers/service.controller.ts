import { Request, Response, NextFunction } from 'express';
import { ServiceModel } from '../models/Service.model';
import { CacheService } from '../services/cache.service';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../middleware/error.middleware';

const SERVICES_CACHE_KEY = 'cache:public:services';
const CATEGORIES_CACHE_KEY = 'cache:public:categories';

export class ServiceController {
  // GET /api/v1/services (Public catalog)
  static async getServices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = req.query.category as string;
      const cacheKey = category ? `${SERVICES_CACHE_KEY}:${category}` : SERVICES_CACHE_KEY;

      const cached = await CacheService.get<any>(cacheKey);
      if (cached) {
        sendSuccess(res, 'Services fetched (cached)', cached);
        return;
      }

      const filter: any = { isActive: true };
      if (category && category !== 'all') {
        filter.category = category;
      }

      const services = await ServiceModel.find(filter).sort({ name: 1 }).lean();
      await CacheService.set(cacheKey, services, 3600); // 1 hour TTL

      sendSuccess(res, 'Services fetched successfully', services);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/services/categories
  static async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cached = await CacheService.get<any>(CATEGORIES_CACHE_KEY);
      if (cached) {
        sendSuccess(res, 'Categories fetched (cached)', cached);
        return;
      }

      const categories = await ServiceModel.distinct('category', { isActive: true });
      await CacheService.set(CATEGORIES_CACHE_KEY, categories, 3600);

      sendSuccess(res, 'Categories fetched successfully', categories);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/services/:id
  static async getServiceBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const service = await ServiceModel.findOne({
        $or: [{ serviceId: req.params.slug }, { name: { $regex: req.params.slug.replace(/-/g, ' '), $options: 'i' } }],
        isActive: true
      }).lean();

      if (!service) {
        throw new AppError('Service not found', 404);
      }
      sendSuccess(res, 'Service details fetched', service);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/services (Admin create)
  static async createService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, title, category, description, baseFee, basePrice, turnaroundDays, documentsRequired } = req.body;

      const serviceName = name || title;
      if (!serviceName || !category) {
        throw new AppError('Service name and category are required', 400);
      }

      const count = await ServiceModel.countDocuments();
      const serviceId = `SRV-${String(count + 1).padStart(3, '0')}`;

      const service = await ServiceModel.create({
        serviceId,
        name: serviceName,
        category,
        description: description || 'Professional advisory and regulatory filing service',
        baseFee: baseFee || basePrice || 5000,
        turnaroundDays: turnaroundDays || 7,
        documentsRequired: documentsRequired || ['PAN Card', 'Aadhaar Card'],
        isActive: true
      });

      // Invalidate public caches
      await CacheService.del(SERVICES_CACHE_KEY);
      await CacheService.del(CATEGORIES_CACHE_KEY);

      sendSuccess(res, 'Service created successfully', service, undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/v1/services/:id (Admin update)
  static async updateService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const service = await ServiceModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!service) {
        throw new AppError('Service not found', 404);
      }

      await CacheService.del(SERVICES_CACHE_KEY);
      await CacheService.del(CATEGORIES_CACHE_KEY);

      sendSuccess(res, 'Service updated successfully', service);
    } catch (error) {
      next(error);
    }
  }
}

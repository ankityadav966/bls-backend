import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserModel } from '../models/User.model';
import { PartnerModel } from '../models/Partner.model';
import { ClientModel } from '../models/Client.model';
import { StaffModel } from '../models/Staff.model';
import { ActivityLogModel } from '../models/ActivityLog.model';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../middleware/error.middleware';
import { UserRole, ActivityAction } from '../constants';
import { logger } from '../utils/logger';

// Generate JWT tokens
const generateTokens = (user: { _id: any; email: string; role: string; name: string }) => {
  const accessToken = jwt.sign(
    { userId: user._id.toString(), email: user.email, role: user.role, name: user.name },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as any }
  );

  const refreshToken = jwt.sign(
    { userId: user._id.toString(), email: user.email, role: user.role },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as any }
  );

  return { accessToken, refreshToken };
};

export class AuthController {
  // POST /api/v1/auth/login
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, portal } = req.body;

      if (!email || !password) {
        throw new AppError('Email and password are required', 400);
      }

      const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        throw new AppError('Invalid email or password', 401);
      }

      if (user.status !== 'ACTIVE') {
        throw new AppError('Account is inactive or pending approval. Please contact administration.', 403);
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new AppError('Invalid email or password', 401);
      }

      // Portal specific verification
      if (portal === 'admin' && user.role !== UserRole.ADMIN && user.role !== UserRole.STAFF) {
        throw new AppError('Access denied: Unauthorized for Admin portal', 403);
      }
      if (portal === 'partner' && user.role !== UserRole.PARTNER) {
        throw new AppError('Access denied: Unauthorized for Partner portal', 403);
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Find role-specific profile ID if exists
      let profileData: any = null;
      if (user.role === UserRole.PARTNER) {
        profileData = await PartnerModel.findOne({ $or: [{ userId: user._id }, { email: user.email }] }).lean();
      } else if (user.role === UserRole.CLIENT) {
        profileData = await ClientModel.findOne({ $or: [{ userId: user._id }, { email: user.email }] }).lean();
      } else if (user.role === UserRole.STAFF) {
        profileData = await StaffModel.findOne({ $or: [{ userId: user._id }, { email: user.email }] }).lean();
      }

      const { accessToken, refreshToken } = generateTokens(user);

      // Set cookie if appropriate
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Log activity
      await ActivityLogModel.create({
        action: ActivityAction.LOGIN,
        actorId: user._id,
        actorName: user.name,
        actorRole: user.role,
        entityType: 'AUTH',
        entityId: user._id.toString(),
        details: { email: user.email, portal }
      });

      sendSuccess(res, 'Logged in successfully', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
          profile: profileData
        },
        token: accessToken,
        accessToken,
        refreshToken
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/auth/register (Client or Partner initial registration)
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, phone, role = UserRole.CLIENT } = req.body;

      if (!name || !email || !password) {
        throw new AppError('Name, email, and password are required', 400);
      }

      // Prevent unauthorized admin creation via public register
      if (role === UserRole.ADMIN) {
        throw new AppError('Cannot register as Admin directly', 403);
      }

      const existingUser = await UserModel.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        throw new AppError('Email is already registered', 409);
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await UserModel.create({
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        phone,
        role,
        status: 'ACTIVE'
      });

      const { accessToken, refreshToken } = generateTokens(user);

      sendSuccess(res, 'Registration successful', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone
        },
        token: accessToken,
        accessToken,
        refreshToken
      }, 201);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/auth/me
  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUser = (req as any).user;
      const user = await UserModel.findById(authUser.userId).select('-passwordHash');
      if (!user) {
        throw new AppError('User not found', 404);
      }

      let profileData: any = null;
      if (user.role === UserRole.PARTNER) {
        profileData = await PartnerModel.findOne({ $or: [{ userId: user._id }, { email: user.email }] }).lean();
      } else if (user.role === UserRole.CLIENT) {
        profileData = await ClientModel.findOne({ $or: [{ userId: user._id }, { email: user.email }] }).lean();
      } else if (user.role === UserRole.STAFF) {
        profileData = await StaffModel.findOne({ $or: [{ userId: user._id }, { email: user.email }] }).lean();
      }

      sendSuccess(res, 'User profile fetched', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
          profile: profileData
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/auth/refresh
  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.refreshToken || req.body.refreshToken;
      if (!token) {
        throw new AppError('Refresh token required', 401);
      }

      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as any;
      const user = await UserModel.findById(decoded.userId);
      if (!user || user.status !== 'ACTIVE') {
        throw new AppError('Invalid refresh token or user inactive', 401);
      }

      const tokens = generateTokens(user);
      sendSuccess(res, 'Token refreshed', tokens);
    } catch (error) {
      next(new AppError('Invalid or expired refresh token', 401));
    }
  }

  // POST /api/v1/auth/logout
  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie('refreshToken');
      sendSuccess(res, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }
}

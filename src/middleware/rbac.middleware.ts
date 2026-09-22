import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse.js';
import { UserRole } from '../constants/index.js';

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): any => {
    if (!req.user) {
      return sendError(res, 'Unauthorized. Please sign in.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`,
        403
      );
    }

    next();
  };
};

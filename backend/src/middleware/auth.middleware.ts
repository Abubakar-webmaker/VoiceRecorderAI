import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../config/jwt';
import { User }              from '../models/User.model';
import { ApiError }          from '../utils/ApiError';
import { asyncHandler }      from '../utils/asyncHandler';
import type { UserRole }     from '../types/common.types';

// ─── Protect: Verify JWT ──────────────────────────────────────────
export const protect = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (token == null || token === '') {
      throw ApiError.unauthorized('Access token is required. Please log in.');
    }

    let decoded: ReturnType<typeof verifyAccessToken>;
    try {
      decoded = verifyAccessToken(token);
    } catch {
      throw ApiError.unauthorized('Invalid or expired access token. Please log in again.');
    }

    const user = await User.findById(decoded.userId).select('_id email role isActive');

    if (user == null) {
      throw ApiError.unauthorized('The account associated with this token no longer exists.');
    }

    if (!user.isActive) {
      throw ApiError.unauthorized('Your account has been deactivated. Please contact support.');
    }

    req.user   = user;
    req.userId = user._id.toString();

    next();
  },
);

// ─── Role Guard ───────────────────────────────────────────────────
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.user == null) {
      throw ApiError.unauthorized();
    }

    if (!roles.includes(req.user.role as UserRole)) {
      throw ApiError.forbidden(
        `This action requires ${roles.join(' or ')} access.`,
      );
    }

    next();
  };
};

// ─── Email Verified Guard ─────────────────────────────────────────
export const requireEmailVerified = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (req.user == null) throw ApiError.unauthorized();

    const user = await User.findById(req.userId).select('isEmailVerified');

    if (user?.isEmailVerified !== true) {
      throw ApiError.forbidden(
        'Please verify your email address to access this feature.',
      );
    }

    next();
  },
);

import type { Response, NextFunction } from 'express';
import { verifyAccessToken } from '@config/jwt';
import { UserModel, UserRole } from '@models/User.model';
import { ApiError } from '@utils/ApiError';
import { asyncHandler } from '@utils/asyncHandler';
import type { AuthRequest } from '@types/common.types';

// ─── Protect: Verify JWT ──────────────────────────────────────────
export const protect = asyncHandler(
  async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    let token: string | undefined;

    // Bearer token extract karo
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      throw ApiError.unauthorized('Access token is required. Please log in.');
    }

    // Token verify karo
    let decoded: ReturnType<typeof verifyAccessToken>;
    try {
      decoded = verifyAccessToken(token);
    } catch {
      throw ApiError.unauthorized('Invalid or expired access token. Please log in again.');
    }

    // User still exists aur active hai?
    const user = await UserModel.findById(decoded.userId).select(
      '_id email role isActive',
    );

    if (!user) {
      throw ApiError.unauthorized('The account associated with this token no longer exists.');
    }

    if (!user.isActive) {
      throw ApiError.unauthorized('Your account has been deactivated. Please contact support.');
    }

    // Request mein user attach karo
    req.user = {
      userId: user._id.toString(),
      email:  user.email,
      role:   user.role,
    };

    next();
  },
);

// ─── Role Guard ───────────────────────────────────────────────────
export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
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
  async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();

    const user = await UserModel.findById(req.user.userId).select('isEmailVerified');

    if (!user?.isEmailVerified) {
      throw ApiError.forbidden(
        'Please verify your email address to access this feature.',
      );
    }

    next();
  },
);
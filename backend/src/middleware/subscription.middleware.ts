import type { Request, Response, NextFunction } from 'express';
import { checkFeatureAccess } from '@services/subscription.service';
import { ApiError } from '@utils/ApiError';
import { asyncHandler } from '@utils/asyncHandler';

export const requireSubscriptionFeature = (feature: 'ai_processing' | 'storage_limit' | 'unlimited_folders') => {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const hasAccess = await checkFeatureAccess(req.userId!, feature);

    if (!hasAccess) {
      throw ApiError.forbidden(
        `Your current plan does not support ${feature.replace('_', ' ')}. Please upgrade to Pro.`
      );
    }

    next();
  });
};

import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { ApiError } from '@utils/ApiError';

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        field:   err.path.join('.'),
        message: err.message,
      }));

      next(ApiError.badRequest('Validation failed', errors));
      return;
    }

    // Sanitized + parsed data replace karo
    req.body = result.data;
    next();
  };
};

// Query params validate karne ke liye
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        field:   err.path.join('.'),
        message: err.message,
      }));

      next(ApiError.badRequest('Invalid query parameters', errors));
      return;
    }

    req.query = result.data as typeof req.query;
    next();
  };
};
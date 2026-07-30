import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { ApiError } from '@utils/ApiError';
import { logger } from '@utils/logger';
import { env } from '@config/env';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Error log karo
  logger.error(`[${req.method}] ${req.url} — ${err.message}`, {
    stack:  err.stack,
    body:   req.body,
    params: req.params,
    query:  req.query,
    userId: (req as { user?: { userId?: string } }).user?.userId,
  });

  let error: ApiError;

  // ─── Error Type Classification ──────────────────────────────
  if (err instanceof ApiError) {
    error = err;

  } else if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => ({
      field:   e.path,
      message: e.message,
    }));
    error = ApiError.badRequest('Validation failed', errors);

  } else if (err instanceof mongoose.Error.CastError) {
    error = ApiError.badRequest(
      `Invalid value "${String(err.value)}" for field "${err.path}"`,
    );

  } else if ((err as NodeJS.ErrnoException).code === '11000') {
    // MongoDB duplicate key
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue ?? {};
    const field    = Object.keys(keyValue)[0] ?? 'Field';
    const value    = Object.values(keyValue)[0];
    error = ApiError.conflict(`${field} "${String(value)}" is already in use.`);

  } else if (err instanceof TokenExpiredError) {
    error = ApiError.unauthorized('Your session has expired. Please log in again.');

  } else if (err instanceof JsonWebTokenError) {
    error = ApiError.unauthorized('Invalid authentication token.');

  } else {
    // Unknown errors
    error = ApiError.internal(
      env.NODE_ENV === 'production'
        ? 'An unexpected error occurred. Please try again.'
        : err.message,
    );
  }

  // ─── Response ───────────────────────────────────────────────
  res.status(error.statusCode).json({
    success:   false,
    message:   error.message,
    errors:    error.errors.length > 0 ? error.errors : undefined,
    timestamp: new Date().toISOString(),
    // Dev mein stack dikhao
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// 404 — Route not found
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  next(
    ApiError.notFound(`Route [${req.method}] ${req.url} does not exist.`),
  );
};
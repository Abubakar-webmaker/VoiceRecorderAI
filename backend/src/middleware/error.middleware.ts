import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { ApiError }  from '../utils/ApiError';
import { logger }    from '../utils/logger';
import { env }       from '../config/env';

// ─── Not Found Handler ────────────────────────────────────────────
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

// ─── Global Error Handler ─────────────────────────────────────────
export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req:  Request,
  res:   Response,
  _next: NextFunction,
): void => {
  let apiError: ApiError;

  // ── Already an ApiError ──────────────────────────────────────
  if (error instanceof ApiError) {
    apiError = error;
  }

  // ── Mongoose Validation Error ────────────────────────────────
  else if (error instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(error.errors).map((e) => ({
      field:   e.path,
      message: e.message,
    }));
    apiError = ApiError.unprocessable('Validation failed', errors);
  }

  // ── Mongoose Duplicate Key (E11000) ──────────────────────────
  else if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: number }).code === 11000
  ) {
    const keyValue = (error as { keyValue?: Record<string, unknown> }).keyValue ?? {};
    const field    = Object.keys(keyValue)[0] ?? 'field';
    apiError = ApiError.conflict(`${field} already exists`);
  }

  // ── Mongoose CastError (invalid ObjectId) ────────────────────
  else if (error instanceof mongoose.Error.CastError) {
    apiError = ApiError.badRequest(`Invalid ${error.path}: ${String(error.value)}`);
  }

  // ── JWT Errors ───────────────────────────────────────────────
  else if (error instanceof TokenExpiredError) {
    apiError = ApiError.unauthorized('Token has expired');
  }
  else if (error instanceof JsonWebTokenError) {
    apiError = ApiError.unauthorized('Invalid token');
  }

  // ── Unknown Error ────────────────────────────────────────────
  else {
    const message = error instanceof Error ? error.message : 'Internal server error';
    apiError = new ApiError(500, message, [], false);
  }

  // ── Log ──────────────────────────────────────────────────────
  if (apiError.statusCode >= 500) {
    logger.error('Server Error', {
      message:    apiError.message,
      statusCode: apiError.statusCode,
      stack:      error instanceof Error ? error.stack : undefined,
    });
  } else {
    logger.warn('Client Error', {
      message:    apiError.message,
      statusCode: apiError.statusCode,
    });
  }

  // ── Response ─────────────────────────────────────────────────
  res.status(apiError.statusCode).json({
    success:   false,
    message:   apiError.isOperational
      ? apiError.message
      : 'Something went wrong. Please try again.',
    errors:    apiError.errors.length > 0 ? apiError.errors : undefined,
    timestamp: new Date().toISOString(),
    // Stack only in development
    ...(env.NODE_ENV === 'development' && error instanceof Error
      ? { stack: error.stack }
      : {}),
  });
};

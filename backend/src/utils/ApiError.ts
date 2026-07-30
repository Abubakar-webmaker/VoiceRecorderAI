export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors: Array<{ field?: string; message: string }>;

  constructor(
    statusCode: number,
    message: string,
    errors: Array<{ field?: string; message: string }> = [],
    isOperational = true,
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    // Proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  // ─── Factory Methods ───────────────────────────────────────
  static badRequest(
    message: string,
    errors: Array<{ field?: string; message: string }> = [],
  ): ApiError {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized. Please log in.'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message = 'You do not have permission to access this resource.'): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message = 'The requested resource was not found.'): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, message);
  }

  static tooManyRequests(message = 'Too many requests. Please try again later.'): ApiError {
    return new ApiError(429, message);
  }

  static internal(message = 'An unexpected error occurred. Please try again.'): ApiError {
    return new ApiError(500, message, [], false);
  }
}
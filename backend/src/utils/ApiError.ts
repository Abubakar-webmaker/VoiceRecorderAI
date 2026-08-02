export class ApiError extends Error {
  public readonly statusCode:    number;
  public readonly errors:        unknown[];
  public readonly isOperational: boolean; // true = expected, false = programmer error

  constructor(
    statusCode:    number,
    message:       string,
    errors:        unknown[] = [],
    isOperational: boolean   = true,
  ) {
    super(message);
    this.name          = 'ApiError';
    this.statusCode    = statusCode;
    this.errors        = errors;
    this.isOperational = isOperational;

    // Maintains proper stack trace in V8
    Error.captureStackTrace(this, this.constructor);
  }

  // ─── Factory Methods ────────────────────────────────────────────
  static badRequest(message: string, errors: unknown[] = []): ApiError {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, message);
  }

  static unprocessable(message: string, errors: unknown[] = []): ApiError {
    return new ApiError(422, message, errors);
  }

  static tooManyRequests(message = 'Too many requests'): ApiError {
    return new ApiError(429, message);
  }

  static internal(message = 'Internal server error'): ApiError {
    return new ApiError(500, message, [], false);
  }

  static serviceUnavailable(message = 'Service temporarily unavailable'): ApiError {
    return new ApiError(503, message);
  }
}

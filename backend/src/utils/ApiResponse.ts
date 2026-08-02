import type { Response } from 'express';

// ─── Response Shape ───────────────────────────────────────────────
export interface ApiResponseShape<T> {
  success:   boolean;
  message:   string;
  data:      T;
  meta?:     PaginationMeta;
  timestamp: string;
}

export interface PaginationMeta {
  total:       number;
  page:        number;
  limit:       number;
  totalPages:  number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ─── ApiResponse Class ────────────────────────────────────────────
export class ApiResponse {
  // Success response
  static success<T>(
    res:        Response,
    data:       T,
    message     = 'Success',
    statusCode  = 200,
    meta?:      PaginationMeta,
  ): Response {
    const body: ApiResponseShape<T> = {
      success:   true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
    if (meta != null) body.meta = meta;
    return res.status(statusCode).json(body);
  }

  // Created response (201)
  static created<T>(res: Response, data: T, message = 'Created successfully'): Response {
    return ApiResponse.success(res, data, message, 201);
  }

  // No content (204)
  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  // Paginated list response
  static paginated<T>(
    res:        Response,
    data:       T[],
    total:      number,
    page:       number,
    limit:      number,
    message     = 'Success',
  ): Response {
    const totalPages  = Math.ceil(total / limit);
    const meta: PaginationMeta = {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
    return ApiResponse.success(res, data, message, 200, meta);
  }

  // Build pagination meta helper
  static buildMeta(total: number, page: number, limit: number): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }
}

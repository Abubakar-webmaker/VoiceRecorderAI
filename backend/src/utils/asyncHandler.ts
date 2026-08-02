import type { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRequestHandler = (
  req:  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
  res:  Response,
  next: NextFunction,
) => Promise<void | Response>;

/**
 * Wraps an async Express handler so any thrown error or rejected
 * promise is automatically forwarded to next() — no try/catch needed
 * in every controller.
 */
export const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

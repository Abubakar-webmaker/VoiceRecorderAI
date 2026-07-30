import type { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// Har controller mein try-catch likhne ki zarurat nahi
// Error automatically next() mein chala jayega
export const asyncHandler = (fn: AsyncFn): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
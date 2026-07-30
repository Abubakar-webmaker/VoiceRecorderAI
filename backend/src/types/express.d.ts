import type { JwtPayload } from '@config/jwt';

// Global Express namespace mein user property add karo
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};
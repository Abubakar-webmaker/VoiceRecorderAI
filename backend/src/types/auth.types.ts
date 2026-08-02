import type { Request } from 'express';
import type { IUser }   from '../models/User.model';

// Authenticated request — user is guaranteed to be set by protect middleware
export interface AuthRequest extends Request {
  user:   IUser;
  userId: string;
}

import type { IUser } from '../models/User.model';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      userId?: string;
      // For file uploads (multer)
      file?:  Express.Multer.File;
      files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
    }
  }
}

export {};

import type { Request, Response, NextFunction } from 'express';
import { audioUpload, avatarUpload }             from '@config/multer';
import { ApiError }                              from '@utils/ApiError';
import multer                                    from 'multer';

// ─── Single Audio Upload ──────────────────────────────────────────
export const uploadAudio = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const upload = audioUpload.single('audio'); // Field name 'audio'

  upload(req, res, (err: unknown) => {
    if (!err) {
      // File uploaded successfully
      if (!req.file) {
        return next(ApiError.badRequest('Audio file is required. Please attach an audio file.'));
      }
      return next();
    }

    // Multer error handling
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(
          ApiError.badRequest(
            'File is too large. Maximum allowed size is 150MB.',
          ),
        );
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return next(ApiError.badRequest('Only one audio file can be uploaded at a time.'));
      }
      return next(ApiError.badRequest(`Upload error: ${err.message}`));
    }

    // Custom ApiError (from fileFilter)
    if (err instanceof ApiError) {
      return next(err);
    }

    return next(ApiError.internal('File upload failed. Please try again.'));
  });
};

// ─── Avatar Upload ────────────────────────────────────────────────
export const uploadAvatar = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const upload = avatarUpload.single('avatar');

  upload(req, res, (err: unknown) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(ApiError.badRequest('Image is too large. Maximum size is 5MB.'));
      }
    }

    if (err instanceof ApiError) return next(err);

    return next(ApiError.internal('Image upload failed.'));
  });
};
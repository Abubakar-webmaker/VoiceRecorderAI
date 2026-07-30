import multer, { type FileFilterCallback } from 'multer';
import type { Request }                     from 'express';
import { ApiError }                         from '@utils/ApiError';

// ─── Constants ────────────────────────────────────────────────────
const MAX_AUDIO_SIZE_MB = 150; // 150MB max per file
const MAX_AUDIO_SIZE    = MAX_AUDIO_SIZE_MB * 1024 * 1024;

const MAX_AVATAR_SIZE_MB = 5;
const MAX_AVATAR_SIZE    = MAX_AVATAR_SIZE_MB * 1024 * 1024;

const ALLOWED_AUDIO_MIMES = new Set([
  'audio/mpeg',         // .mp3
  'audio/mp3',
  'audio/wav',          // .wav
  'audio/wave',
  'audio/x-wav',
  'audio/mp4',          // .m4a
  'audio/x-m4a',
  'audio/aac',          // .aac
  'audio/ogg',          // .ogg
  'audio/webm',         // .webm
  'audio/flac',         // .flac
  'video/mp4',          // Some devices mp4 as video send karte hain
  'video/webm',
]);

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

// ─── Memory Storage ───────────────────────────────────────────────
// File disk pe nahi — directly buffer mein
const memoryStorage = multer.memoryStorage();

// ─── Audio Filter ─────────────────────────────────────────────────
const audioFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb:   FileFilterCallback,
): void => {
  if (ALLOWED_AUDIO_MIMES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        `Invalid file type: "${file.mimetype}". Allowed: MP3, WAV, M4A, AAC, OGG, WEBM, FLAC`,
      ),
    );
  }
};

// ─── Image Filter ─────────────────────────────────────────────────
const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb:   FileFilterCallback,
): void => {
  if (ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `Invalid image type. Allowed: JPEG, PNG, WEBP`));
  }
};

// ─── Multer Instances ─────────────────────────────────────────────
export const audioUpload = multer({
  storage:   memoryStorage,
  fileFilter: audioFileFilter,
  limits: {
    fileSize:  MAX_AUDIO_SIZE,
    files:     1, // Ek baar mein 1 file
  },
});

export const avatarUpload = multer({
  storage:    memoryStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_AVATAR_SIZE,
    files:    1,
  },
});
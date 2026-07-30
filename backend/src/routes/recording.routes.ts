import { Router } from 'express';
import * as RecordingController from '@controllers/recording.controller';
import { protect }              from '@middleware/auth.middleware';
import { uploadAudio }          from '@middleware/upload.middleware';
import { validate, validateQuery } from '@middleware/validation.middleware';
import {
  createRecordingSchema,
  updateRecordingSchema,
  moveRecordingSchema,
  recordingQuerySchema,
  searchQuerySchema,
  bulkDeleteSchema,
} from '@validators/recording.validator';

const router = Router();

// All recording routes require authentication
router.use(protect);

// ─── Collection Routes ────────────────────────────────────────────

// POST   /api/v1/recordings        — Upload new recording
router.post(
  '/',
  uploadAudio,                      // Multer middleware first
  validate(createRecordingSchema),
  RecordingController.upload,
);

// GET    /api/v1/recordings        — Get all recordings (paginated + filtered)
router.get(
  '/',
  validateQuery(recordingQuerySchema),
  RecordingController.getAll,
);

// GET    /api/v1/recordings/favorites — Get favorite recordings
router.get('/favorites', RecordingController.getFavorites);

// GET    /api/v1/recordings/search    — Full-text search
router.get(
  '/search',
  validateQuery(searchQuerySchema),
  RecordingController.search,
);

// POST   /api/v1/recordings/bulk-delete — Delete multiple at once
router.post(
  '/bulk-delete',
  validate(bulkDeleteSchema),
  RecordingController.bulkDelete,
);

// ─── Item Routes ──────────────────────────────────────────────────

// GET    /api/v1/recordings/:id        — Get single recording
router.get('/:id', RecordingController.getOne);

// GET    /api/v1/recordings/:id/waveform — Get waveform data
router.get('/:id/waveform', RecordingController.getWaveform);

// GET    /api/v1/recordings/:id/download — Get signed download URL
router.get('/:id/download', RecordingController.download);

// PUT    /api/v1/recordings/:id        — Update recording metadata
router.put(
  '/:id',
  validate(updateRecordingSchema),
  RecordingController.update,
);

// DELETE /api/v1/recordings/:id        — Delete recording
router.delete('/:id', RecordingController.remove);

// PATCH  /api/v1/recordings/:id/favorite — Toggle favorite
router.patch('/:id/favorite', RecordingController.toggleFavorite);

// PATCH  /api/v1/recordings/:id/move    — Move to folder
router.patch(
  '/:id/move',
  validate(moveRecordingSchema),
  RecordingController.move,
);

// PATCH  /api/v1/recordings/:id/play    — Increment play count
router.patch('/:id/play', RecordingController.play);

// POST   /api/v1/recordings/:id/share   — Generate share link
router.post('/:id/share', RecordingController.share);

export { router as recordingRouter };
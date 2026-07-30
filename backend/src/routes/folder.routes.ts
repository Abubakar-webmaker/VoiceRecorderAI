import { Router } from 'express';
import * as FolderController from '@controllers/folder.controller';
import { protect }           from '@middleware/auth.middleware';
import { validate }          from '@middleware/validation.middleware';
import {
  createFolderSchema,
  updateFolderSchema,
  moveFolderSchema,
} from '@validators/folder.validator';

const router = Router();

// All folder routes require authentication
router.use(protect);

// POST   /api/v1/folders        — Create folder
router.post(
  '/',
  validate(createFolderSchema),
  FolderController.create,
);

// GET    /api/v1/folders        — Get all user folders
router.get('/', FolderController.getAll);

// GET    /api/v1/folders/:id    — Get folder + recordings
router.get('/:id', FolderController.getOne);

// PUT    /api/v1/folders/:id    — Update folder
router.put(
  '/:id',
  validate(updateFolderSchema),
  FolderController.update,
);

// PATCH  /api/v1/folders/:id/move — Move folder
router.patch(
  '/:id/move',
  validate(moveFolderSchema),
  FolderController.move,
);

// DELETE /api/v1/folders/:id   — Delete folder
router.delete('/:id', FolderController.remove);

export { router as folderRouter };
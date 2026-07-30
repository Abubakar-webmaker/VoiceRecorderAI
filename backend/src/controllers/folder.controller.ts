import type { Response }    from 'express';
import * as FolderService   from '@services/folder.service';
import { ApiResponse }      from '@utils/ApiResponse';
import { asyncHandler }     from '@utils/asyncHandler';
import type { AuthRequest } from '@types/common.types';
import type {
  CreateFolderInput,
  UpdateFolderInput,
  MoveFolderInput,
} from '@validators/folder.validator';

// ─── Create ───────────────────────────────────────────────────────
export const create = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const folder = await FolderService.createFolder(
      req.user!.userId,
      req.body as CreateFolderInput,
    );

    res.status(201).json(
      ApiResponse.created('Folder created successfully.', folder),
    );
  },
);

// ─── Get All ──────────────────────────────────────────────────────
export const getAll = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const folders = await FolderService.getUserFolders(req.user!.userId);

    res.status(200).json(
      ApiResponse.success('Folders fetched successfully.', folders),
    );
  },
);

// ─── Get One ──────────────────────────────────────────────────────
export const getOne = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const page  = Math.max(1, parseInt(String(req.query['page']  ?? '1'),  10));
    const limit = Math.min(50, parseInt(String(req.query['limit'] ?? '20'), 10));

    const result = await FolderService.getFolderWithRecordings(
      req.params['id'] ?? '',
      req.user!.userId,
      page,
      limit,
    );

    res.status(200).json(
      ApiResponse.success('Folder fetched successfully.', result),
    );
  },
);

// ─── Update ───────────────────────────────────────────────────────
export const update = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const folder = await FolderService.updateFolder(
      req.params['id'] ?? '',
      req.user!.userId,
      req.body as UpdateFolderInput,
    );

    res.status(200).json(
      ApiResponse.success('Folder updated successfully.', folder),
    );
  },
);

// ─── Move ─────────────────────────────────────────────────────────
export const move = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const folder = await FolderService.moveFolder(
      req.params['id'] ?? '',
      req.user!.userId,
      req.body as MoveFolderInput,
    );

    res.status(200).json(
      ApiResponse.success('Folder moved successfully.', folder),
    );
  },
);

// ─── Delete ───────────────────────────────────────────────────────
export const remove = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const moveToRoot =
      (req.query['moveToRoot'] as string | undefined) !== 'false';

    await FolderService.deleteFolder(
      req.params['id'] ?? '',
      req.user!.userId,
      moveToRoot,
    );

    res.status(200).json(
      ApiResponse.success('Folder deleted successfully.'),
    );
  },
);
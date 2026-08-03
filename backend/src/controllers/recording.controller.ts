import type { Response } from 'express';
import * as RecordingService from '@services/recording.service';
import { ApiResponse }       from '@utils/ApiResponse';
import { asyncHandler }      from '@utils/asyncHandler';
import { ApiError }          from '@utils/ApiError';
import type { AuthRequest }  from '@types/common.types';
import type {
  CreateRecordingInput,
  UpdateRecordingInput,
  MoveRecordingInput,
  RecordingQuery,
  SearchQuery,
  BulkDeleteInput,
} from '@validators/recording.validator';

// ─── Upload ───────────────────────────────────────────────────────
export const upload = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.file) {
      throw ApiError.badRequest('Audio file is required.');
    }

    const recording = await RecordingService.uploadRecording(
      req.user!.userId,
      req.file,
      req.body as CreateRecordingInput,
    );

    res.status(201).json(
      ApiResponse.created(res, recording, 'Recording uploaded successfully.'),
    );
  },
);

// ─── Get All ──────────────────────────────────────────────────────
export const getAll = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await RecordingService.getRecordings(
      req.user!.userId,
      req.query as RecordingQuery,
    );

    res.status(200).json(
      ApiResponse.success(res, result, 'Recordings fetched successfully.'),
    );
  },
);

// ─── Get Favorites ────────────────────────────────────────────────
export const getFavorites = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const page  = Math.max(1, parseInt(String(req.query['page']  ?? '1'),  10));
    const limit = Math.min(50, parseInt(String(req.query['limit'] ?? '20'), 10));

    const result = await RecordingService.getFavoriteRecordings(
      req.user!.userId,
      page,
      limit,
    );

    res.status(200).json(
      ApiResponse.success(res, result, 'Favorites fetched successfully.'),
    );
  },
);

// ─── Search ───────────────────────────────────────────────────────
export const search = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await RecordingService.searchRecordings(
      req.user!.userId,
      req.query as SearchQuery,
    );

    res.status(200).json(
      ApiResponse.success(res, result, 'Search results fetched.'),
    );
  },
);

// ─── Get Single ───────────────────────────────────────────────────
export const getOne = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const recording = await RecordingService.getRecordingById(
      req.params['id'] ?? '',
      req.user!.userId,
    );

    res.status(200).json(
      ApiResponse.success(res, recording, 'Recording fetched successfully.'),
    );
  },
);

// ─── Get Waveform ─────────────────────────────────────────────────
export const getWaveform = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const waveform = await RecordingService.getRecordingWaveform(
      req.params['id'] ?? '',
      req.user!.userId,
    );

    res.status(200).json(
      ApiResponse.success(res, { waveform }, 'Waveform data fetched.'),
    );
  },
);

// ─── Update ───────────────────────────────────────────────────────
export const update = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const recording = await RecordingService.updateRecording(
      req.params['id'] ?? '',
      req.user!.userId,
      req.body as UpdateRecordingInput,
    );

    res.status(200).json(
      ApiResponse.success(res, recording, 'Recording updated successfully.'),
    );
  },
);

// ─── Toggle Favorite ──────────────────────────────────────────────
export const toggleFavorite = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await RecordingService.toggleFavorite(
      req.params['id'] ?? '',
      req.user!.userId,
    );

    res.status(200).json(
      ApiResponse.success(
        res,
        result,
        result.isFavorite ? 'Added to favorites.' : 'Removed from favorites.',
      ),
    );
  },
);

// ─── Move to Folder ───────────────────────────────────────────────
export const move = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const recording = await RecordingService.moveRecording(
      req.params['id'] ?? '',
      req.user!.userId,
      req.body as MoveRecordingInput,
    );

    res.status(200).json(
      ApiResponse.success(res, recording, 'Recording moved successfully.'),
    );
  },
);

// ─── Play (increment play count) ─────────────────────────────────
export const play = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    await RecordingService.incrementPlayCount(
      req.params['id'] ?? '',
      req.user!.userId,
    );

    res.status(200).json(ApiResponse.success(res, null, 'Play count updated.'));
  },
);

// ─── Download ─────────────────────────────────────────────────────
export const download = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await RecordingService.getDownloadUrl(
      req.params['id'] ?? '',
      req.user!.userId,
    );

    res.status(200).json(
      ApiResponse.success(res, result, 'Download URL generated.'),
    );
  },
);

// ─── Delete ───────────────────────────────────────────────────────
export const remove = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    await RecordingService.deleteRecording(
      req.params['id'] ?? '',
      req.user!.userId,
    );

    res.status(200).json(ApiResponse.success(res, null, 'Recording deleted successfully.'));
  },
);

// ─── Bulk Delete ──────────────────────────────────────────────────
export const bulkDelete = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await RecordingService.bulkDeleteRecordings(
      req.user!.userId,
      req.body as BulkDeleteInput,
    );

    res.status(200).json(
      ApiResponse.success(
        res,
        result,
        `${result.deleted} recording(s) deleted successfully.`,
      ),
    );
  },
);

// ─── Share ────────────────────────────────────────────────────────
export const share = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const expiresInHours = parseInt(
      String((req.body as { expiresInHours?: string }).expiresInHours ?? '24'),
      10,
    );

    const result = await RecordingService.generateShareToken(
      req.params['id'] ?? '',
      req.user!.userId,
      expiresInHours,
    );

    res.status(200).json(
      ApiResponse.success(res, result, 'Share link generated successfully.'),
    );
  },
);
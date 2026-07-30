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
      ApiResponse.created('Recording uploaded successfully.', recording),
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
      ApiResponse.success('Recordings fetched successfully.', result),
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
      ApiResponse.success('Favorites fetched successfully.', result),
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
      ApiResponse.success('Search results fetched.', result),
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
      ApiResponse.success('Recording fetched successfully.', recording),
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
      ApiResponse.success('Waveform data fetched.', { waveform }),
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
      ApiResponse.success('Recording updated successfully.', recording),
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
        result.isFavorite ? 'Added to favorites.' : 'Removed from favorites.',
        result,
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
      ApiResponse.success('Recording moved successfully.', recording),
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

    res.status(200).json(ApiResponse.success('Play count updated.'));
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
      ApiResponse.success('Download URL generated.', result),
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

    res.status(200).json(ApiResponse.success('Recording deleted successfully.'));
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
        `${result.deleted} recording(s) deleted successfully.`,
        result,
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
      ApiResponse.success('Share link generated successfully.', result),
    );
  },
);
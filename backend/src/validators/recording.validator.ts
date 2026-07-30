import { z } from 'zod';
import { RecordingFormat, RecordingQuality } from '@models/Recording.model';

export const createRecordingSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(1,   'Title cannot be empty')
    .max(100, 'Title cannot exceed 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .trim()
    .optional()
    .default(''),
  folderId: z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, 'Invalid folder ID')
    .optional()
    .nullable(),
  duration: z
    .number({ required_error: 'Duration is required' })
    .min(1, 'Duration must be at least 1 second'),
  format: z
    .nativeEnum(RecordingFormat, { required_error: 'Audio format is required' }),
  quality: z
    .nativeEnum(RecordingQuality)
    .optional()
    .default(RecordingQuality.HIGH),
  sampleRate: z.number().optional().default(44100),
  channels:   z.number().min(1).max(2).optional().default(1),
  bitrate:    z.number().optional().default(128),
  tags: z
    .array(z.string().max(30))
    .max(10, 'Maximum 10 tags allowed')
    .optional()
    .default([]),
  waveform: z
    .array(z.number().min(0).max(1))
    .max(200, 'Waveform data cannot exceed 200 points')
    .optional()
    .default([]),
  recordedAt: z.string().datetime().optional(),
  language:   z.string().length(2).optional().default('en'),
});

export const updateRecordingSchema = z.object({
  title: z
    .string()
    .min(1,   'Title cannot be empty')
    .max(100, 'Title cannot exceed 100 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500)
    .trim()
    .optional(),
  tags: z
    .array(z.string().max(30))
    .max(10)
    .optional(),
  folderId: z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, 'Invalid folder ID')
    .nullable()
    .optional(),
});

export const moveRecordingSchema = z.object({
  folderId: z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, 'Invalid folder ID')
    .nullable(),
});

export const recordingQuerySchema = z.object({
  page:       z.string().optional().default('1'),
  limit:      z.string().optional().default('20'),
  sortBy:     z.enum(['createdAt', 'title', 'duration', 'fileSize', 'recordedAt'])
                .optional()
                .default('createdAt'),
  sortOrder:  z.enum(['asc', 'desc']).optional().default('desc'),
  folderId:   z.string().optional(),
  tags:       z.string().optional(), // Comma-separated
  isFavorite: z.string().optional(),
  status:     z.string().optional(),
});

export const searchQuerySchema = z.object({
  q:     z.string().min(1, 'Search query cannot be empty').max(100),
  page:  z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
});

export const bulkDeleteSchema = z.object({
  recordingIds: z
    .array(z.string().regex(/^[a-fA-F0-9]{24}$/))
    .min(1,  'At least one recording ID is required')
    .max(50, 'Cannot delete more than 50 recordings at once'),
});

export type CreateRecordingInput = z.infer<typeof createRecordingSchema>;
export type UpdateRecordingInput = z.infer<typeof updateRecordingSchema>;
export type MoveRecordingInput   = z.infer<typeof moveRecordingSchema>;
export type RecordingQuery       = z.infer<typeof recordingQuerySchema>;
export type SearchQuery          = z.infer<typeof searchQuerySchema>;
export type BulkDeleteInput      = z.infer<typeof bulkDeleteSchema>;
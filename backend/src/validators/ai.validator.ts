import { z } from 'zod';

const mongoIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, 'Invalid ID format');

// ─── Transcription ────────────────────────────────────────────────
export const transcribeSchema = z.object({
  recordingId: mongoIdSchema,
  language: z
    .string()
    .length(2, 'Use ISO 639-1 language code e.g. "en", "ur"')
    .optional(),
  prompt: z
    .string()
    .max(224, 'Whisper prompt cannot exceed 224 characters')
    .optional(),
});

// ─── Summary ──────────────────────────────────────────────────────
export const summarizeSchema = z.object({
  recordingId: mongoIdSchema,
  length: z
    .enum(['short', 'medium', 'long'])
    .optional()
    .default('medium'),
  customPrompt: z
    .string()
    .max(500)
    .optional(),
});

// ─── Translation ──────────────────────────────────────────────────
export const translateSchema = z.object({
  recordingId:    mongoIdSchema,
  targetLanguage: z
    .string()
    .length(2, 'Use ISO 639-1 language code e.g. "en", "ur"'),
  textToTranslate: z
    .string()
    .max(10_000)
    .optional(), // Agar override karna ho
});

// ─── Keywords ─────────────────────────────────────────────────────
export const keywordsSchema = z.object({
  recordingId: mongoIdSchema,
  maxKeywords: z
    .number()
    .int()
    .min(5)
    .max(20)
    .optional()
    .default(10),
});

// ─── Action Items ─────────────────────────────────────────────────
export const actionItemsSchema = z.object({
  recordingId:  mongoIdSchema,
  customPrompt: z.string().max(300).optional(),
});

// ─── AI Title ────────────────────────────────────────────────────
export const generateTitleSchema = z.object({
  recordingId: mongoIdSchema,
});

// ─── Full AI Process ──────────────────────────────────────────────
export const processAllSchema = z.object({
  recordingId: mongoIdSchema,
  language:    z.string().length(2).optional(),
  summaryLength: z
    .enum(['short', 'medium', 'long'])
    .optional()
    .default('medium'),
  generateTitle:       z.boolean().optional().default(true),
  generateKeywords:    z.boolean().optional().default(true),
  generateActionItems: z.boolean().optional().default(false),
  autoTranslate:       z.string().length(2).optional(), // Target lang
});

// ─── Chat ─────────────────────────────────────────────────────────
export const chatSchema = z.object({
  recordingId: mongoIdSchema,
  chatId:      mongoIdSchema.optional(), // Existing chat continue karo
  message:     z
    .string({ required_error: 'Message is required' })
    .min(1,     'Message cannot be empty')
    .max(2000,  'Message cannot exceed 2000 characters')
    .trim(),
});

export const updateChatTitleSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(100)
    .trim(),
});

export const updateActionItemSchema = z.object({
  completed: z.boolean(),
  task:      z.string().max(500).trim().optional(),
  priority:  z.enum(['low', 'medium', 'high']).optional(),
  assignee:  z.string().max(100).optional(),
  deadline:  z.string().optional(),
});

export const updateNotesSchema = z.object({
  text: z
    .string()
    .max(10_000, 'Notes cannot exceed 10,000 characters')
    .trim(),
});

// ─── Types ────────────────────────────────────────────────────────
export type TranscribeInput      = z.infer<typeof transcribeSchema>;
export type SummarizeInput       = z.infer<typeof summarizeSchema>;
export type TranslateInput       = z.infer<typeof translateSchema>;
export type KeywordsInput        = z.infer<typeof keywordsSchema>;
export type ActionItemsInput     = z.infer<typeof actionItemsSchema>;
export type GenerateTitleInput   = z.infer<typeof generateTitleSchema>;
export type ProcessAllInput      = z.infer<typeof processAllSchema>;
export type ChatInput            = z.infer<typeof chatSchema>;
export type UpdateChatTitleInput = z.infer<typeof updateChatTitleSchema>;
export type UpdateActionItemInput = z.infer<typeof updateActionItemSchema>;
export type UpdateNotesInput     = z.infer<typeof updateNotesSchema>;
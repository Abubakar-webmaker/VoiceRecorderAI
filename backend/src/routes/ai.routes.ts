import { Router } from 'express';
import * as AIController from '@controllers/ai.controller';
import { protect }       from '@middleware/auth.middleware';
import { validate }      from '@middleware/validation.middleware';
import rateLimit         from 'express-rate-limit';
import {
  transcribeSchema,
  summarizeSchema,
  translateSchema,
  keywordsSchema,
  actionItemsSchema,
  generateTitleSchema,
  processAllSchema,
  chatSchema,
  updateActionItemSchema,
  updateNotesSchema,
} from '@validators/ai.validator';

// ─── AI Rate Limiter (cost control) ──────────────────────────────
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max:      50,              // 50 AI requests per hour
  message: {
    success:   false,
    message:   'AI request limit reached. Please wait before making more requests.',
    timestamp: new Date().toISOString(),
  },
  keyGenerator: (req) =>
    (req as { user?: { userId?: string } }).user?.userId ?? req.ip ?? 'anonymous',
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max:      20,         // 20 chat messages per minute
  keyGenerator: (req) =>
    (req as { user?: { userId?: string } }).user?.userId ?? req.ip ?? 'anonymous',
});

const router = Router();

// All AI routes require authentication
router.use(protect);

// ─── General ──────────────────────────────────────────────────────

// GET  /api/v1/ai/languages — Get supported languages
router.get('/languages', AIController.getSupportedLanguages);

// ─── Recording-specific AI ────────────────────────────────────────

// GET  /api/v1/ai/recordings/:recordingId — Get full AI summary
router.get('/recordings/:recordingId', AIController.getAISummary);

// GET  /api/v1/ai/recordings/:recordingId/chats — Chat history
router.get('/recordings/:recordingId/chats', AIController.getChatHistory);

// ─── AI Operations ────────────────────────────────────────────────

// POST /api/v1/ai/transcribe — Transcribe recording
router.post(
  '/transcribe',
  aiLimiter,
  validate(transcribeSchema),
  AIController.transcribe,
);

// POST /api/v1/ai/summarize — Generate summary
router.post(
  '/summarize',
  aiLimiter,
  validate(summarizeSchema),
  AIController.summarize,
);

// POST /api/v1/ai/title — Generate AI title
router.post(
  '/title',
  aiLimiter,
  validate(generateTitleSchema),
  AIController.generateTitle,
);

// POST /api/v1/ai/keywords — Extract keywords
router.post(
  '/keywords',
  aiLimiter,
  validate(keywordsSchema),
  AIController.keywords,
);

// POST /api/v1/ai/action-items — Extract action items
router.post(
  '/action-items',
  aiLimiter,
  validate(actionItemsSchema),
  AIController.actionItems,
);

// POST /api/v1/ai/translate — Translate transcript
router.post(
  '/translate',
  aiLimiter,
  validate(translateSchema),
  AIController.translate,
);

// POST /api/v1/ai/process-all — Full AI pipeline
router.post(
  '/process-all',
  aiLimiter,
  validate(processAllSchema),
  AIController.processAll,
);

// ─── Chat ─────────────────────────────────────────────────────────

// POST /api/v1/ai/chat — Send chat message
router.post(
  '/chat',
  chatLimiter,
  validate(chatSchema),
  AIController.chat,
);

// GET  /api/v1/ai/chats/:chatId — Get full chat messages
router.get('/chats/:chatId', AIController.getChatMessages);

// DELETE /api/v1/ai/chats/:chatId — Delete chat
router.delete('/chats/:chatId', AIController.deleteChat);

// ─── Action Items Management ──────────────────────────────────────

// PATCH /api/v1/ai/recordings/:recordingId/action-items/:itemId
router.patch(
  '/recordings/:recordingId/action-items/:itemId',
  validate(updateActionItemSchema),
  AIController.updateActionItem,
);

// ─── Notes ────────────────────────────────────────────────────────

// PUT /api/v1/ai/recordings/:recordingId/notes — Update notes
router.put(
  '/recordings/:recordingId/notes',
  validate(updateNotesSchema),
  AIController.updateNotes,
);

export { router as aiRouter };
import type { Response }    from 'express';
import * as AIService        from '@services/ai.service';
import { ApiResponse }       from '@utils/ApiResponse';
import { asyncHandler }      from '@utils/asyncHandler';
import { ApiError }          from '@utils/ApiError';
import type { AuthRequest }  from '@types/common.types';
import type {
  TranscribeInput,
  SummarizeInput,
  TranslateInput,
  KeywordsInput,
  ActionItemsInput,
  GenerateTitleInput,
  ProcessAllInput,
  ChatInput,
  UpdateChatTitleInput,
  UpdateActionItemInput,
  UpdateNotesInput,
} from '@validators/ai.validator';

// ─── Get AI Summary (full doc) ────────────────────────────────────
export const getAISummary = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const aiSummary = await AIService.getAISummary(
      req.user!.userId,
      req.params['recordingId'] ?? '',
    );

    res.status(200).json(
      ApiResponse.success('AI summary fetched.', aiSummary),
    );
  },
);

// ─── Transcribe (HTTP trigger) ────────────────────────────────────
export const transcribe = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    // HTTP trigger — Socket.IO pe bhi progress milta hai agar connected ho
    const aiSummary = await AIService.transcribeRecording(
      req.user!.userId,
      req.body as TranscribeInput,
    );

    res.status(200).json(
      ApiResponse.success('Transcription completed.', {
        transcription: aiSummary.transcription,
        totalTokensUsed: aiSummary.totalTokensUsed,
      }),
    );
  },
);

// ─── Summarize ────────────────────────────────────────────────────
export const summarize = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const aiSummary = await AIService.generateSummary(
      req.user!.userId,
      req.body as SummarizeInput,
    );

    res.status(200).json(
      ApiResponse.success('Summary generated.', {
        summary: aiSummary.summary,
      }),
    );
  },
);

// ─── Generate Title ───────────────────────────────────────────────
export const generateTitle = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const aiSummary = await AIService.generateAITitle(
      req.user!.userId,
      req.body as GenerateTitleInput,
    );

    res.status(200).json(
      ApiResponse.success('AI title generated.', {
        aiTitle: aiSummary.aiTitle,
      }),
    );
  },
);

// ─── Extract Keywords ─────────────────────────────────────────────
export const keywords = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const aiSummary = await AIService.extractKeywords(
      req.user!.userId,
      req.body as KeywordsInput,
    );

    res.status(200).json(
      ApiResponse.success('Keywords extracted.', {
        keywords: aiSummary.keywords,
      }),
    );
  },
);

// ─── Extract Action Items ─────────────────────────────────────────
export const actionItems = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const aiSummary = await AIService.extractActionItems(
      req.user!.userId,
      req.body as ActionItemsInput,
    );

    res.status(200).json(
      ApiResponse.success('Action items extracted.', {
        actionItems: aiSummary.actionItems,
      }),
    );
  },
);

// ─── Translate ────────────────────────────────────────────────────
export const translate = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const aiSummary = await AIService.translateRecording(
      req.user!.userId,
      req.body as TranslateInput,
    );

    const { targetLanguage } = req.body as TranslateInput;
    const translation = aiSummary.translations.find(
      (t) => t.targetLanguage === targetLanguage,
    );

    res.status(200).json(
      ApiResponse.success('Translation completed.', { translation }),
    );
  },
);

// ─── Process All (Full Pipeline) ──────────────────────────────────
export const processAll = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const aiSummary = await AIService.processAllAI(
      req.user!.userId,
      req.body as ProcessAllInput,
    );

    res.status(200).json(
      ApiResponse.success('Full AI processing completed.', {
        transcription:   aiSummary.transcription,
        summary:         aiSummary.summary,
        aiTitle:         aiSummary.aiTitle,
        keywords:        aiSummary.keywords,
        totalTokensUsed: aiSummary.totalTokensUsed,
        totalCost:       aiSummary.totalCost,
      }),
    );
  },
);

// ─── Chat ─────────────────────────────────────────────────────────
export const chat = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await AIService.chatWithRecording(
      req.user!.userId,
      req.body as ChatInput,
    );

    res.status(200).json(
      ApiResponse.success('Chat response generated.', {
        chatId:     result.chat._id,
        reply:      result.reply,
        tokensUsed: result.tokensUsed,
        messages:   result.chat.messages.slice(-2), // Last user + assistant
      }),
    );
  },
);

// ─── Get Chat History ─────────────────────────────────────────────
export const getChatHistory = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const chats = await AIService.getChatHistory(
      req.user!.userId,
      req.params['recordingId'] ?? '',
    );

    res.status(200).json(
      ApiResponse.success('Chat history fetched.', chats),
    );
  },
);

// ─── Get Chat Messages ────────────────────────────────────────────
export const getChatMessages = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const chatDoc = await AIService.getChatById(
      req.user!.userId,
      req.params['chatId'] ?? '',
    );

    // System message filter karo — user ko show na karo
    const messages = chatDoc.messages.filter(
      (m) => m.role !== 'system',
    );

    res.status(200).json(
      ApiResponse.success('Chat messages fetched.', {
        chatId:     chatDoc._id,
        title:      chatDoc.title,
        messages,
        totalTokens: chatDoc.totalTokens,
      }),
    );
  },
);

// ─── Delete Chat ──────────────────────────────────────────────────
export const deleteChat = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    await AIService.deleteChat(
      req.user!.userId,
      req.params['chatId'] ?? '',
    );

    res.status(200).json(ApiResponse.success('Chat deleted.'));
  },
);

// ─── Update Action Item ───────────────────────────────────────────
export const updateActionItem = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const aiSummary = await AIService.updateActionItem(
      req.user!.userId,
      req.params['recordingId'] ?? '',
      req.params['itemId'] ?? '',
      req.body as UpdateActionItemInput,
    );

    res.status(200).json(
      ApiResponse.success('Action item updated.', {
        actionItems: aiSummary.actionItems,
      }),
    );
  },
);

// ─── Update Notes ─────────────────────────────────────────────────
export const updateNotes = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const aiSummary = await AIService.updateNotes(
      req.user!.userId,
      req.params['recordingId'] ?? '',
      req.body as UpdateNotesInput,
    );

    res.status(200).json(
      ApiResponse.success('Notes updated.', { notes: aiSummary.notes }),
    );
  },
);

// ─── Get Supported Languages ──────────────────────────────────────
export const getSupportedLanguages = asyncHandler(
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const { SUPPORTED_LANGUAGES } = await import('@config/openai');

    const languages = Object.entries(SUPPORTED_LANGUAGES).map(
      ([code, name]) => ({ code, name }),
    );

    res.status(200).json(
      ApiResponse.success('Supported languages fetched.', languages),
    );
  },
);
import { apiClient } from '@api/axios.instance';
import { ENDPOINTS } from '@api/endpoints';
import type { ApiResponse } from '@types/api.types';
import type {
  AISummaryDoc,
  AIChat,
  SupportedLanguage,
  AIActionItem,
} from '@types/ai.types';

// ─── Get AI Summary ───────────────────────────────────────────────
export const getAISummaryApi = async (
  recordingId: string,
): Promise<AISummaryDoc> => {
  const res = await apiClient.get<ApiResponse<AISummaryDoc>>(
    ENDPOINTS.AI.RECORDING_AI(recordingId),
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
};

// ─── Transcribe ───────────────────────────────────────────────────
export const transcribeApi = async (payload: {
  recordingId: string;
  language?:   string;
}): Promise<Partial<AISummaryDoc>> => {
  const res = await apiClient.post<ApiResponse<Partial<AISummaryDoc>>>(
    ENDPOINTS.AI.TRANSCRIBE,
    payload,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
};

// ─── Summarize ────────────────────────────────────────────────────
export const summarizeApi = async (payload: {
  recordingId:  string;
  length?:      'short' | 'medium' | 'long';
  customPrompt?: string;
}): Promise<Partial<AISummaryDoc>> => {
  const res = await apiClient.post<ApiResponse<Partial<AISummaryDoc>>>(
    ENDPOINTS.AI.SUMMARIZE,
    payload,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
};

// ─── Generate Title ───────────────────────────────────────────────
export const generateTitleApi = async (
  recordingId: string,
): Promise<Partial<AISummaryDoc>> => {
  const res = await apiClient.post<ApiResponse<Partial<AISummaryDoc>>>(
    ENDPOINTS.AI.TITLE,
    { recordingId },
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
};

// ─── Keywords ─────────────────────────────────────────────────────
export const extractKeywordsApi = async (payload: {
  recordingId:  string;
  maxKeywords?: number;
}): Promise<Partial<AISummaryDoc>> => {
  const res = await apiClient.post<ApiResponse<Partial<AISummaryDoc>>>(
    ENDPOINTS.AI.KEYWORDS,
    payload,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
};

// ─── Action Items ─────────────────────────────────────────────────
export const extractActionItemsApi = async (payload: {
  recordingId:   string;
  customPrompt?: string;
}): Promise<Partial<AISummaryDoc>> => {
  const res = await apiClient.post<ApiResponse<Partial<AISummaryDoc>>>(
    ENDPOINTS.AI.ACTION_ITEMS,
    payload,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
};

// ─── Translate ────────────────────────────────────────────────────
export const translateApi = async (payload: {
  recordingId:    string;
  targetLanguage: string;
}): Promise<Partial<AISummaryDoc>> => {
  const res = await apiClient.post<ApiResponse<Partial<AISummaryDoc>>>(
    ENDPOINTS.AI.TRANSLATE,
    payload,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
};

// ─── Process All ──────────────────────────────────────────────────
export const processAllApi = async (payload: {
  recordingId:         string;
  language?:           string;
  summaryLength?:      'short' | 'medium' | 'long';
  generateTitle?:      boolean;
  generateKeywords?:   boolean;
  generateActionItems?: boolean;
}): Promise<Partial<AISummaryDoc>> => {
  const res = await apiClient.post<ApiResponse<Partial<AISummaryDoc>>>(
    ENDPOINTS.AI.PROCESS_ALL,
    payload,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
};

// ─── Chat ─────────────────────────────────────────────────────────
export const chatApi = async (payload: {
  recordingId: string;
  chatId?:     string;
  message:     string;
}): Promise<{
  chatId:     string;
  reply:      string;
  tokensUsed: number;
  messages:   AIChat['messages'];
}> => {
  const res = await apiClient.post<ApiResponse<{
    chatId:     string;
    reply:      string;
    tokensUsed: number;
    messages:   AIChat['messages'];
  }>>(ENDPOINTS.AI.CHAT, payload);
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
};

// ─── Get Chat Messages ────────────────────────────────────────────
export const getChatApi = async (chatId: string): Promise<AIChat> => {
  const res = await apiClient.get<ApiResponse<AIChat>>(
    ENDPOINTS.AI.CHAT_DETAIL(chatId),
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
};

// ─── Get Chat History ─────────────────────────────────────────────
export const getChatHistoryApi = async (
  recordingId: string,
): Promise<AIChat[]> => {
  const res = await apiClient.get<ApiResponse<AIChat[]>>(
    ENDPOINTS.AI.RECORDING_CHATS(recordingId),
  );
  return res.data.data ?? [];
};

// ─── Update Action Item ───────────────────────────────────────────
export const updateActionItemApi = async (
  recordingId:  string,
  actionItemId: string,
  updates:      Partial<AIActionItem>,
): Promise<Partial<AISummaryDoc>> => {
  const res = await apiClient.patch<ApiResponse<Partial<AISummaryDoc>>>(
    ENDPOINTS.AI.ACTION_ITEM(recordingId, actionItemId),
    updates,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
};

// ─── Update Notes ─────────────────────────────────────────────────
export const updateNotesApi = async (
  recordingId: string,
  text:        string,
): Promise<Partial<AISummaryDoc>> => {
  const res = await apiClient.put<ApiResponse<Partial<AISummaryDoc>>>(
    ENDPOINTS.AI.NOTES(recordingId),
    { text },
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
};

// ─── Supported Languages ──────────────────────────────────────────
export const getLanguagesApi = async (): Promise<SupportedLanguage[]> => {
  const res = await apiClient.get<ApiResponse<SupportedLanguage[]>>(
    ENDPOINTS.AI.LANGUAGES,
  );
  return res.data.data ?? [];
};
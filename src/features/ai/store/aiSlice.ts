import {
  createSlice,
  createAsyncThunk,
  createSelector,
  type PayloadAction,
} from '@reduxjs/toolkit';
import type { RootState }   from '@store/index';
import type { AISummaryDoc, AIChat, SupportedLanguage } from '@types/ai.types';
import { AIStatus }         from '@types/recording.types';
import {
  getAISummaryApi, transcribeApi, summarizeApi,
  generateTitleApi, extractKeywordsApi, extractActionItemsApi,
  translateApi, processAllApi, chatApi, getChatApi,
  getChatHistoryApi, updateActionItemApi, updateNotesApi,
  getLanguagesApi,
} from '../services/ai.api';

// ─── State ────────────────────────────────────────────────────────
interface AIState {
  // AI Summary per recording (keyed by recordingId)
  summaries:          Record<string, AISummaryDoc>;

  // Current recording being viewed
  currentRecordingId: string | null;

  // Chat
  currentChat:        AIChat | null;
  chatHistory:        AIChat[];
  isChatLoading:      boolean;

  // Languages
  languages:          SupportedLanguage[];

  // Loading flags per operation
  isLoadingSummary:   boolean;
  isTranscribing:     boolean;
  isSummarizing:      boolean;
  isExtractingKw:     boolean;
  isExtractingActions: boolean;
  isTranslating:      boolean;
  isProcessingAll:    boolean;
  isGeneratingTitle:  boolean;
  isUpdatingNotes:    boolean;

  // Real-time socket progress
  socketProgress:     number;   // 0-100
  socketStep:         string | null;

  error: string | null;
}

const initialState: AIState = {
  summaries:           {},
  currentRecordingId:  null,
  currentChat:         null,
  chatHistory:         [],
  isChatLoading:       false,
  languages:           [],
  isLoadingSummary:    false,
  isTranscribing:      false,
  isSummarizing:       false,
  isExtractingKw:      false,
  isExtractingActions: false,
  isTranslating:       false,
  isProcessingAll:     false,
  isGeneratingTitle:   false,
  isUpdatingNotes:     false,
  socketProgress:      0,
  socketStep:          null,
  error:               null,
};

// ─── Thunks ───────────────────────────────────────────────────────
export const fetchAISummaryThunk = createAsyncThunk(
  'ai/fetchSummary',
  async (recordingId: string, { rejectWithValue }) => {
    try { return { recordingId, data: await getAISummaryApi(recordingId) }; }
    catch (e) { return rejectWithValue((e as { message?: string }).message); }
  },
);

export const transcribeThunk = createAsyncThunk(
  'ai/transcribe',
  async (payload: { recordingId: string; language?: string }, { rejectWithValue }) => {
    try { return { recordingId: payload.recordingId, data: await transcribeApi(payload) }; }
    catch (e) { return rejectWithValue((e as { message?: string }).message); }
  },
);

export const summarizeThunk = createAsyncThunk(
  'ai/summarize',
  async (
    payload: { recordingId: string; length?: 'short' | 'medium' | 'long'; customPrompt?: string },
    { rejectWithValue },
  ) => {
    try { return { recordingId: payload.recordingId, data: await summarizeApi(payload) }; }
    catch (e) { return rejectWithValue((e as { message?: string }).message); }
  },
);

export const generateTitleThunk = createAsyncThunk(
  'ai/generateTitle',
  async (recordingId: string, { rejectWithValue }) => {
    try { return { recordingId, data: await generateTitleApi(recordingId) }; }
    catch (e) { return rejectWithValue((e as { message?: string }).message); }
  },
);

export const extractKeywordsThunk = createAsyncThunk(
  'ai/extractKeywords',
  async (payload: { recordingId: string; maxKeywords?: number }, { rejectWithValue }) => {
    try { return { recordingId: payload.recordingId, data: await extractKeywordsApi(payload) }; }
    catch (e) { return rejectWithValue((e as { message?: string }).message); }
  },
);

export const extractActionItemsThunk = createAsyncThunk(
  'ai/extractActionItems',
  async (payload: { recordingId: string; customPrompt?: string }, { rejectWithValue }) => {
    try { return { recordingId: payload.recordingId, data: await extractActionItemsApi(payload) }; }
    catch (e) { return rejectWithValue((e as { message?: string }).message); }
  },
);

export const translateThunk = createAsyncThunk(
  'ai/translate',
  async (payload: { recordingId: string; targetLanguage: string }, { rejectWithValue }) => {
    try { return { recordingId: payload.recordingId, data: await translateApi(payload) }; }
    catch (e) { return rejectWithValue((e as { message?: string }).message); }
  },
);

export const processAllThunk = createAsyncThunk(
  'ai/processAll',
  async (
    payload: {
      recordingId: string;
      language?: string;
      summaryLength?: 'short' | 'medium' | 'long';
      generateTitle?: boolean;
      generateKeywords?: boolean;
      generateActionItems?: boolean;
    },
    { rejectWithValue },
  ) => {
    try { return { recordingId: payload.recordingId, data: await processAllApi(payload) }; }
    catch (e) { return rejectWithValue((e as { message?: string }).message); }
  },
);

export const chatThunk = createAsyncThunk(
  'ai/chat',
  async (
    payload: { recordingId: string; chatId?: string; message: string },
    { rejectWithValue },
  ) => {
    try { return await chatApi(payload); }
    catch (e) { return rejectWithValue((e as { message?: string }).message); }
  },
);

export const fetchChatThunk = createAsyncThunk(
  'ai/fetchChat',
  async (chatId: string, { rejectWithValue }) => {
    try { return await getChatApi(chatId); }
    catch (e) { return rejectWithValue((e as { message?: string }).message); }
  },
);

export const fetchChatHistoryThunk = createAsyncThunk(
  'ai/fetchChatHistory',
  async (recordingId: string, { rejectWithValue }) => {
    try { return await getChatHistoryApi(recordingId); }
    catch (e) { return rejectWithValue((e as { message?: string }).message); }
  },
);

export const updateActionItemThunk = createAsyncThunk(
  'ai/updateActionItem',
  async (
    payload: { recordingId: string; actionItemId: string; updates: Parameters<typeof updateActionItemApi>[2] },
    { getState, rejectWithValue },
  ) => {
    try {
      const result = await updateActionItemApi(
        payload.recordingId, payload.actionItemId, payload.updates,
      );
      return { recordingId: payload.recordingId, data: result };
    } catch (e) { return rejectWithValue((e as { message?: string }).message); }
  },
);

export const updateNotesThunk = createAsyncThunk(
  'ai/updateNotes',
  async (payload: { recordingId: string; text: string }, { rejectWithValue }) => {
    try { return { recordingId: payload.recordingId, data: await updateNotesApi(payload.recordingId, payload.text) }; }
    catch (e) { return rejectWithValue((e as { message?: string }).message); }
  },
);

export const fetchLanguagesThunk = createAsyncThunk(
  'ai/fetchLanguages',
  async (_, { rejectWithValue }) => {
    try { return await getLanguagesApi(); }
    catch (e) { return rejectWithValue((e as { message?: string }).message); }
  },
);

// ─── Helper to merge partial into existing summary ─────────────────
const mergeSummary = (
  state: AIState,
  recordingId: string,
  partial: Partial<AISummaryDoc>,
): void => {
  const existing = state.summaries[recordingId];
  if (existing) {
    state.summaries[recordingId] = { ...existing, ...partial } as AISummaryDoc;
  }
};

// ─── Slice ────────────────────────────────────────────────────────
const aiSlice = createSlice({
  name: 'ai',
  initialState,

  reducers: {
    setCurrentRecording: (state, action: PayloadAction<string | null>) => {
      state.currentRecordingId = action.payload;
      state.currentChat        = null;
      state.socketProgress     = 0;
      state.socketStep         = null;
    },
    clearAIError: (state) => {
      state.error = null;
    },
    clearChat: (state) => {
      state.currentChat = null;
    },
    // Real-time socket progress update
    setSocketProgress: (
      state,
      action: PayloadAction<{ progress: number; step: string }>,
    ) => {
      state.socketProgress = action.payload.progress;
      state.socketStep     = action.payload.step;
      // Derive loading flags from step
      state.isTranscribing  = action.payload.step === 'transcribing';
      state.isSummarizing   = action.payload.step === 'summarizing';
      state.isExtractingKw  = action.payload.step === 'keywords';
      state.isProcessingAll = action.payload.step !== 'done';
    },
    // Called when socket reports completion — merge data into summaries
    setSocketComplete: (
      state,
      action: PayloadAction<{ recordingId: string; data: Partial<AISummaryDoc> }>,
    ) => {
      state.isProcessingAll = false;
      state.isTranscribing  = false;
      state.isSummarizing   = false;
      state.socketProgress  = 100;
      state.socketStep      = 'done';
      mergeSummary(state, action.payload.recordingId, action.payload.data);
    },
    setSocketError: (state, action: PayloadAction<string>) => {
      state.isProcessingAll = false;
      state.isTranscribing  = false;
      state.isSummarizing   = false;
      state.socketProgress  = 0;
      state.socketStep      = null;
      state.error           = action.payload;
    },
    // Optimistic update for action item checkbox
    toggleActionItemOptimistic: (
      state,
      action: PayloadAction<{ recordingId: string; itemId: string }>,
    ) => {
      const summary = state.summaries[action.payload.recordingId];
      if (summary) {
        const item = summary.actionItems.items.find(
          (i) => i._id === action.payload.itemId,
        );
        if (item) item.completed = !item.completed;
      }
    },
  },

  extraReducers: (builder) => {
    // Fetch Summary
    builder
      .addCase(fetchAISummaryThunk.pending,   (state) => { state.isLoadingSummary = true; })
      .addCase(fetchAISummaryThunk.fulfilled, (state, action) => {
        state.isLoadingSummary = false;
        state.summaries[action.payload.recordingId] = action.payload.data;
      })
      .addCase(fetchAISummaryThunk.rejected,  (state, action) => {
        state.isLoadingSummary = false;
        state.error            = action.payload as string;
      });

    // Transcribe
    builder
      .addCase(transcribeThunk.pending,   (state) => { state.isTranscribing = true; state.error = null; })
      .addCase(transcribeThunk.fulfilled, (state, action) => {
        state.isTranscribing = false;
        mergeSummary(state, action.payload.recordingId, action.payload.data);
      })
      .addCase(transcribeThunk.rejected,  (state, action) => {
        state.isTranscribing = false;
        state.error = action.payload as string;
      });

    // Summarize
    builder
      .addCase(summarizeThunk.pending,   (state) => { state.isSummarizing = true; state.error = null; })
      .addCase(summarizeThunk.fulfilled, (state, action) => {
        state.isSummarizing = false;
        mergeSummary(state, action.payload.recordingId, action.payload.data);
      })
      .addCase(summarizeThunk.rejected,  (state, action) => {
        state.isSummarizing = false;
        state.error = action.payload as string;
      });

    // Generate Title
    builder
      .addCase(generateTitleThunk.pending,   (state) => { state.isGeneratingTitle = true; })
      .addCase(generateTitleThunk.fulfilled, (state, action) => {
        state.isGeneratingTitle = false;
        mergeSummary(state, action.payload.recordingId, action.payload.data);
      })
      .addCase(generateTitleThunk.rejected,  (state, action) => {
        state.isGeneratingTitle = false;
        state.error = action.payload as string;
      });

    // Keywords
    builder
      .addCase(extractKeywordsThunk.pending,   (state) => { state.isExtractingKw = true; })
      .addCase(extractKeywordsThunk.fulfilled, (state, action) => {
        state.isExtractingKw = false;
        mergeSummary(state, action.payload.recordingId, action.payload.data);
      })
      .addCase(extractKeywordsThunk.rejected,  (state, action) => {
        state.isExtractingKw = false;
        state.error = action.payload as string;
      });

    // Action Items
    builder
      .addCase(extractActionItemsThunk.pending,   (state) => { state.isExtractingActions = true; })
      .addCase(extractActionItemsThunk.fulfilled, (state, action) => {
        state.isExtractingActions = false;
        mergeSummary(state, action.payload.recordingId, action.payload.data);
      })
      .addCase(extractActionItemsThunk.rejected,  (state, action) => {
        state.isExtractingActions = false;
        state.error = action.payload as string;
      });

    // Translate
    builder
      .addCase(translateThunk.pending,   (state) => { state.isTranslating = true; })
      .addCase(translateThunk.fulfilled, (state, action) => {
        state.isTranslating = false;
        mergeSummary(state, action.payload.recordingId, action.payload.data);
      })
      .addCase(translateThunk.rejected,  (state, action) => {
        state.isTranslating = false;
        state.error = action.payload as string;
      });

    // Process All
    builder
      .addCase(processAllThunk.pending,   (state) => { state.isProcessingAll = true; state.error = null; })
      .addCase(processAllThunk.fulfilled, (state, action) => {
        state.isProcessingAll = false;
        mergeSummary(state, action.payload.recordingId, action.payload.data);
      })
      .addCase(processAllThunk.rejected,  (state, action) => {
        state.isProcessingAll = false;
        state.error = action.payload as string;
      });

    // Chat
    builder
      .addCase(chatThunk.pending, (state) => { state.isChatLoading = true; state.error = null; })
      .addCase(chatThunk.fulfilled, (state, action) => {
        state.isChatLoading = false;
        if (state.currentChat) {
          state.currentChat._id      = action.payload.chatId;
          state.currentChat.messages = [
            ...state.currentChat.messages.filter((m) => m.role !== 'system'),
            ...action.payload.messages.filter((m) => m.role !== 'system'),
          ];
        } else {
          state.currentChat = {
            _id:         action.payload.chatId,
            recordingId: '',
            title:       'Chat',
            messages:    action.payload.messages.filter((m) => m.role !== 'system'),
            totalTokens: action.payload.tokensUsed,
            totalCost:   0,
            createdAt:   new Date().toISOString(),
            updatedAt:   new Date().toISOString(),
          };
        }
      })
      .addCase(chatThunk.rejected, (state, action) => {
        state.isChatLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Full Chat
    builder
      .addCase(fetchChatThunk.fulfilled, (state, action) => {
        state.currentChat = action.payload;
      });

    // Chat History
    builder
      .addCase(fetchChatHistoryThunk.fulfilled, (state, action) => {
        state.chatHistory = action.payload;
      });

    // Update Action Item
    builder
      .addCase(updateActionItemThunk.fulfilled, (state, action) => {
        mergeSummary(state, action.payload.recordingId, action.payload.data);
      });

    // Update Notes
    builder
      .addCase(updateNotesThunk.pending,   (state) => { state.isUpdatingNotes = true; })
      .addCase(updateNotesThunk.fulfilled, (state, action) => {
        state.isUpdatingNotes = false;
        mergeSummary(state, action.payload.recordingId, action.payload.data);
      })
      .addCase(updateNotesThunk.rejected,  (state) => { state.isUpdatingNotes = false; });

    // Languages
    builder.addCase(fetchLanguagesThunk.fulfilled, (state, action) => {
      state.languages = action.payload;
    });
  },
});

export const {
  setCurrentRecording, clearAIError,
  clearChat, toggleActionItemOptimistic,
  setSocketProgress, setSocketComplete, setSocketError,
} = aiSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────
const aiState = (s: RootState) => s.ai;

export const selectCurrentAISummary = createSelector(
  [aiState, (_: RootState, recordingId: string) => recordingId],
  (s, id) => s.summaries[id] ?? null,
);
export const selectAIError          = createSelector(aiState, (s) => s.error);
export const selectIsTranscribing   = createSelector(aiState, (s) => s.isTranscribing);
export const selectIsSummarizing    = createSelector(aiState, (s) => s.isSummarizing);
export const selectIsProcessingAll  = createSelector(aiState, (s) => s.isProcessingAll);
export const selectIsExtractingKw   = createSelector(aiState, (s) => s.isExtractingKw);
export const selectIsExtractingAct  = createSelector(aiState, (s) => s.isExtractingActions);
export const selectIsTranslating    = createSelector(aiState, (s) => s.isTranslating);
export const selectIsLoadingSummary = createSelector(aiState, (s) => s.isLoadingSummary);
export const selectCurrentChat      = createSelector(aiState, (s) => s.currentChat);
export const selectChatHistory      = createSelector(aiState, (s) => s.chatHistory);
export const selectIsChatLoading    = createSelector(aiState, (s) => s.isChatLoading);
export const selectLanguages        = createSelector(aiState, (s) => s.languages);
export const selectSocketProgress  = createSelector(aiState, (s) => s.socketProgress);
export const selectSocketStep      = createSelector(aiState, (s) => s.socketStep);
export const selectIsGeneratingTitle = createSelector(aiState, (s) => s.isGeneratingTitle);

export default aiSlice.reducer;
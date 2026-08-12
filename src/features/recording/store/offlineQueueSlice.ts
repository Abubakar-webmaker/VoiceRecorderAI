import {
  createSlice,
  createAsyncThunk,
  createSelector,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { v4 as uuidv4 }       from 'uuid';
import type { RootState }      from '@store/index';
import type { QueueItem }      from '@services/audio/offlineQueue.service';
import {
  loadQueue, addToQueue,
  removeFromQueue, updateQueueItem, purgeInvalidItems,
} from '@services/audio/offlineQueue.service';
import { buildAudioFormData }  from '@services/audio/upload.builder';
import { uploadRecordingApi }  from '../services/recording.api';
import { addRecording }        from './recordingSlice';

// ─── State ────────────────────────────────────────────────────────
interface OfflineQueueState {
  items:         QueueItem[];
  isProcessing:  boolean;
  isSyncing:     boolean;
  error:         string | null;
  lastSyncAt:    string | null;
}

const initialState: OfflineQueueState = {
  items:        [],
  isProcessing: false,
  isSyncing:    false,
  error:        null,
  lastSyncAt:   null,
};

// ─── Thunks ───────────────────────────────────────────────────────
export const loadQueueThunk = createAsyncThunk(
  'offlineQueue/load',
  async () => {
    await purgeInvalidItems(); // Clean up missing files
    return loadQueue();
  },
);

export const enqueueRecordingThunk = createAsyncThunk(
  'offlineQueue/enqueue',
  async (
    payload: Omit<QueueItem, 'id' | 'createdAt' | 'retryCount' | 'status' | 'maxRetries'>,
  ) => {
    const item = await addToQueue({ ...payload, id: uuidv4() });
    return item;
  },
);

export const processQueueThunk = createAsyncThunk(
  'offlineQueue/process',
  async (_, { getState, dispatch }) => {
    const state  = getState() as RootState;
    const queue  = state.offlineQueue.items.filter(
      (i) => i.status === 'pending' && i.retryCount < i.maxRetries,
    );

    if (queue.length === 0) return [];

    const uploaded: string[] = [];

    for (const item of queue) {
      try {
        // Mark as uploading
        await updateQueueItem(item.id, { status: 'uploading' });
        dispatch(updateQueueItemAction({ id: item.id, updates: { status: 'uploading' } }));

        const formData = buildAudioFormData(item.filePath, {
          title:     item.title,
          duration:  item.duration,
          format:    item.format,
          quality:   'high',
          folderId:  item.folderId,
          waveform:  item.waveform,
          recordedAt: item.recordedAt,
        });

        const recording = await uploadRecordingApi(formData);

        // Success — remove from queue
        await removeFromQueue(item.id);
        dispatch(addRecording(recording));
        uploaded.push(item.id);

      } catch (err) {
        const newRetry = item.retryCount + 1;
        const status   = newRetry >= item.maxRetries ? 'failed' : 'pending';

        await updateQueueItem(item.id, {
          retryCount: newRetry,
          status,
          error: (err as { message?: string }).message,
        });

        dispatch(updateQueueItemAction({
          id: item.id,
          updates: { retryCount: newRetry, status, error: (err as { message?: string }).message },
        }));
      }
    }

    return uploaded;
  },
);

export const retryQueueItemThunk = createAsyncThunk(
  'offlineQueue/retry',
  async (id: string, { dispatch }) => {
    await updateQueueItem(id, { status: 'pending', retryCount: 0, error: undefined });
    dispatch(updateQueueItemAction({ id, updates: { status: 'pending', retryCount: 0 } }));
    void dispatch(processQueueThunk());
  },
);

export const removeQueueItemThunk = createAsyncThunk(
  'offlineQueue/remove',
  async (id: string) => {
    await removeFromQueue(id);
    return id;
  },
);

// ─── Slice ────────────────────────────────────────────────────────
const offlineQueueSlice = createSlice({
  name: 'offlineQueue',
  initialState,

  reducers: {
    updateQueueItemAction: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<QueueItem> }>,
    ) => {
      const idx = state.items.findIndex((i) => i.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...action.payload.updates };
      }
    },
    clearQueueError: (state) => { state.error = null; },
  },

  extraReducers: (builder) => {
    builder.addCase(loadQueueThunk.fulfilled, (state, action) => {
      state.items = action.payload;
    });

    builder.addCase(enqueueRecordingThunk.fulfilled, (state, action) => {
      state.items.push(action.payload);
    });

    builder
      .addCase(processQueueThunk.pending, (state) => {
        state.isSyncing = true;
        state.error     = null;
      })
      .addCase(processQueueThunk.fulfilled, (state, action) => {
        state.isSyncing  = false;
        state.lastSyncAt = new Date().toISOString();
        // Remove successfully uploaded items
        state.items = state.items.filter((i) => !action.payload.includes(i.id));
      })
      .addCase(processQueueThunk.rejected, (state, action) => {
        state.isSyncing = false;
        state.error     = action.payload as string;
      });

    builder.addCase(removeQueueItemThunk.fulfilled, (state, action) => {
      state.items = state.items.filter((i) => i.id !== action.payload);
    });
  },
});

export const { updateQueueItemAction, clearQueueError } = offlineQueueSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────
const qState = (s: RootState): OfflineQueueState => s.offlineQueue;
export const selectQueueItems    = createSelector(qState, (s) => s.items);
export const selectQueueCount    = createSelector(qState, (s) => s.items.length);
export const selectPendingCount  = createSelector(
  qState, (s) => s.items.filter((i) => i.status === 'pending').length,
);
export const selectIsSyncing     = createSelector(qState, (s) => s.isSyncing);
export const selectLastSyncAt    = createSelector(qState, (s) => s.lastSyncAt);

export default offlineQueueSlice.reducer;
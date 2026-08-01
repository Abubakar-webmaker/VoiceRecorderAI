import {
  createSlice,
  createAsyncThunk,
  createSelector,
  type PayloadAction,
} from '@reduxjs/toolkit';
import type { RootState }    from '@store/index';
import type { Recording }    from '@types/recording.types';
import {
  startRecording,
  pauseRecording,
  resumeRecording,
  stopRecording,
  discardRecording,
  getRecordingPath,
  getFileSize,
} from '@services/audio/recorder.service';
import { buildAudioFormData, generateDefaultTitle } from '@services/audio/upload.builder';
import { uploadRecordingApi } from '../services/recording.api';
import { addRecording }       from './recordingSlice';
import { ensureMicPermission } from '@services/audio/permission.service';

// ─── State Machine ────────────────────────────────────────────────
export enum RecorderState {
  IDLE       = 'idle',
  PREPARING  = 'preparing',   // Permission check
  RECORDING  = 'recording',
  PAUSED     = 'paused',
  STOPPING   = 'stopping',
  UPLOADING  = 'uploading',
  DONE       = 'done',
  ERROR      = 'error',
}

// ─── Max waveform samples kept in memory ──────────────────────────
const MAX_WAVEFORM_SAMPLES = 400;

interface RecorderSliceState {
  state:          RecorderState;
  filePath:       string | null;
  title:          string;
  folderId:       string | null;
  duration:       number;    // seconds
  amplitudeList:  number[];  // live waveform data
  currentAmplitude: number;  // 0-1
  uploadProgress: number;    // 0-100
  uploadedRecording: Recording | null;
  error:          string | null;
  recordedAt:     string | null;
}

const initialState: RecorderSliceState = {
  state:             RecorderState.IDLE,
  filePath:          null,
  title:             '',
  folderId:          null,
  duration:          0,
  amplitudeList:     [],
  currentAmplitude:  0,
  uploadProgress:    0,
  uploadedRecording: null,
  error:             null,
  recordedAt:        null,
};

// ─── Thunks ───────────────────────────────────────────────────────

// Start recording
export const startRecordingThunk = createAsyncThunk(
  'recorder/start',
  async (
    options: { title?: string; folderId?: string | null },
    { dispatch, rejectWithValue },
  ) => {
    try {
      // 1. Permission
      const hasPermission = await ensureMicPermission();
      if (!hasPermission) return rejectWithValue('Microphone permission denied.');

      // 2. Generate file path
      const path = getRecordingPath();

      // 3. Start recording
      await startRecording(path, (position, amplitude) => {
        dispatch(updateProgress({ position, amplitude }));
      });

      return {
        filePath:   path,
        title:      options.title ?? generateDefaultTitle(),
        folderId:   options.folderId ?? null,
        recordedAt: new Date().toISOString(),
      };
    } catch (e) {
      return rejectWithValue((e as { message?: string }).message ?? 'Failed to start recording');
    }
  },
);

// Pause recording
export const pauseRecordingThunk = createAsyncThunk(
  'recorder/pause',
  async (_, { rejectWithValue }) => {
    try {
      await pauseRecording();
    } catch (e) {
      return rejectWithValue((e as { message?: string }).message);
    }
  },
);

// Resume recording
export const resumeRecordingThunk = createAsyncThunk(
  'recorder/resume',
  async (_, { rejectWithValue }) => {
    try {
      await resumeRecording();
    } catch (e) {
      return rejectWithValue((e as { message?: string }).message);
    }
  },
);

// Stop + Upload
export const stopAndUploadThunk = createAsyncThunk(
  'recorder/stopAndUpload',
  async (_, { getState, dispatch, rejectWithValue }) => {
    const state = (getState() as RootState).recorder;

    try {
      // 1. Stop recording
      const filePath = await stopRecording();

      // 2. Get file size
      const fileSize = await getFileSize(filePath);

      // 3. Build FormData
      const formData = buildAudioFormData(filePath, {
        title:     state.title,
        duration:  state.duration,
        format:    'm4a',
        quality:   'high',
        folderId:  state.folderId,
        waveform:  state.amplitudeList,
        recordedAt: state.recordedAt ?? new Date().toISOString(),
      });

      // 4. Upload with progress
      const recording = await uploadRecordingApi(formData, (percent) => {
        dispatch(setUploadProgressRec(percent));
      });

      // 5. Add to recordings list
      dispatch(addRecording(recording));

      return recording;
    } catch (e) {
      return rejectWithValue(
        (e as { message?: string }).message ?? 'Upload failed. Please try again.',
      );
    }
  },
);

// Discard recording
export const discardRecordingThunk = createAsyncThunk(
  'recorder/discard',
  async (_, { getState }) => {
    const state = (getState() as RootState).recorder;
    if (state.filePath) {
      await discardRecording(state.filePath);
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────
const recorderSlice = createSlice({
  name: 'recorder',
  initialState,

  reducers: {
    updateProgress: (
      state,
      action: PayloadAction<{ position: number; amplitude: number }>,
    ) => {
      state.duration        = action.payload.position;
      state.currentAmplitude = action.payload.amplitude;

      // Keep rolling waveform
      state.amplitudeList.push(action.payload.amplitude);
      if (state.amplitudeList.length > MAX_WAVEFORM_SAMPLES) {
        state.amplitudeList.shift();
      }
    },
    setRecorderTitle: (state, action: PayloadAction<string>) => {
      state.title = action.payload;
    },
    setRecorderFolder: (state, action: PayloadAction<string | null>) => {
      state.folderId = action.payload;
    },
    setUploadProgressRec: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },
    resetRecorder: () => initialState,
    clearRecorderError: (state) => {
      state.error = null;
      state.state = RecorderState.IDLE;
    },
  },

  extraReducers: (builder) => {
    // Start
    builder
      .addCase(startRecordingThunk.pending, (state) => {
        state.state = RecorderState.PREPARING;
        state.error = null;
      })
      .addCase(startRecordingThunk.fulfilled, (state, action) => {
        state.state       = RecorderState.RECORDING;
        state.filePath    = action.payload.filePath;
        state.title       = action.payload.title;
        state.folderId    = action.payload.folderId;
        state.recordedAt  = action.payload.recordedAt;
        state.amplitudeList = [];
        state.duration    = 0;
      })
      .addCase(startRecordingThunk.rejected, (state, action) => {
        state.state = RecorderState.ERROR;
        state.error = action.payload as string;
      });

    // Pause
    builder
      .addCase(pauseRecordingThunk.fulfilled, (state) => {
        state.state = RecorderState.PAUSED;
      })
      .addCase(pauseRecordingThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Resume
    builder
      .addCase(resumeRecordingThunk.fulfilled, (state) => {
        state.state = RecorderState.RECORDING;
      });

    // Stop + Upload
    builder
      .addCase(stopAndUploadThunk.pending, (state) => {
        state.state          = RecorderState.UPLOADING;
        state.uploadProgress = 0;
      })
      .addCase(stopAndUploadThunk.fulfilled, (state, action) => {
        state.state             = RecorderState.DONE;
        state.uploadedRecording = action.payload;
        state.uploadProgress    = 100;
      })
      .addCase(stopAndUploadThunk.rejected, (state, action) => {
        state.state = RecorderState.ERROR;
        state.error = action.payload as string;
      });

    // Discard
    builder.addCase(discardRecordingThunk.fulfilled, () => initialState);
  },
});

export const {
  updateProgress, setRecorderTitle, setRecorderFolder,
  setUploadProgressRec, resetRecorder, clearRecorderError,
} = recorderSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────
const recState = (s: RootState) => s.recorder;
export const selectRecorderState      = createSelector(recState, (s) => s.state);
export const selectRecordingDuration  = createSelector(recState, (s) => s.duration);
export const selectAmplitudeList      = createSelector(recState, (s) => s.amplitudeList);
export const selectCurrentAmplitude   = createSelector(recState, (s) => s.currentAmplitude);
export const selectRecorderTitle      = createSelector(recState, (s) => s.title);
export const selectRecorderFolder     = createSelector(recState, (s) => s.folderId);
export const selectUploadProgressRec  = createSelector(recState, (s) => s.uploadProgress);
export const selectUploadedRecording  = createSelector(recState, (s) => s.uploadedRecording);
export const selectRecorderError      = createSelector(recState, (s) => s.error);
export const selectIsRecording        = createSelector(
  recState, (s) => s.state === RecorderState.RECORDING,
);
export const selectIsPaused           = createSelector(
  recState, (s) => s.state === RecorderState.PAUSED,
);
export const selectIsUploading        = createSelector(
  recState, (s) => s.state === RecorderState.UPLOADING,
);
export const selectIsDone             = createSelector(
  recState, (s) => s.state === RecorderState.DONE,
);
export const selectIsIdle             = createSelector(
  recState, (s) => s.state === RecorderState.IDLE || s.state === RecorderState.ERROR,
);

export default recorderSlice.reducer;
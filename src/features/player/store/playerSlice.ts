import {
  createSlice,
  createAsyncThunk,
  createSelector,
  type PayloadAction,
} from '@reduxjs/toolkit';
import TrackPlayer, { State as TrackState } from 'react-native-track-player';
import type { RootState } from '@store/index';
import type { Recording }  from '@types/recording.types';
import {
  loadTrack, playTrack, pauseTrack,
  seekTo, setSpeed, skipForward, skipBackward, stopTrack,
} from '@services/audio/player.service';
import { incrementPlayApi } from '@features/recording/services/recording.api';

// ─── Speed Options ────────────────────────────────────────────────
export const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
export type SpeedOption = (typeof SPEED_OPTIONS)[number];

// ─── State ────────────────────────────────────────────────────────
interface PlayerState {
  currentRecording: Recording | null;
  trackState:       TrackState;
  position:         number;   // seconds
  duration:         number;   // seconds
  speed:            SpeedOption;
  isLoading:        boolean;
  isMiniPlayer:     boolean;  // Mini player visible?
  error:            string | null;
}

const initialState: PlayerState = {
  currentRecording: null,
  trackState:       TrackState.None,
  position:         0,
  duration:         0,
  speed:            1,
  isLoading:        false,
  isMiniPlayer:     false,
  error:            null,
};

// ─── Thunks ───────────────────────────────────────────────────────
export const loadRecordingThunk = createAsyncThunk(
  'player/load',
  async (recording: Recording, { rejectWithValue }) => {
    try {
      if (!recording.cloud.secureUrl) {
        throw new Error('Audio file is not available.');
      }

      await loadTrack({
        id:       recording._id,
        url:      recording.cloud.secureUrl,
        title:    recording.title,
        artist:   'AI Voice Recorder',
        duration: recording.duration,
        artwork:  undefined,
      });

      await playTrack();

      // Increment play count (fire and forget)
      incrementPlayApi(recording._id).catch(() => { /* silent */ });

      return recording;
    } catch (e) {
      return rejectWithValue((e as { message?: string }).message ?? 'Failed to load audio');
    }
  },
);

export const togglePlayPauseThunk = createAsyncThunk(
  'player/togglePlayPause',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const trackState = state.player.trackState;

    if (trackState === TrackState.Playing) {
      await pauseTrack();
      return TrackState.Paused;
    } else {
      await playTrack();
      return TrackState.Playing;
    }
  },
);

export const seekThunk = createAsyncThunk(
  'player/seek',
  async (seconds: number) => {
    await seekTo(seconds);
    return seconds;
  },
);

export const setSpeedThunk = createAsyncThunk(
  'player/setSpeed',
  async (speed: SpeedOption) => {
    await setSpeed(speed);
    return speed;
  },
);

export const skipForwardThunk = createAsyncThunk(
  'player/skipForward',
  async () => { await skipForward(15); },
);

export const skipBackwardThunk = createAsyncThunk(
  'player/skipBackward',
  async () => { await skipBackward(15); },
);

export const stopPlayerThunk = createAsyncThunk(
  'player/stop',
  async () => { await stopTrack(); },
);

// ─── Slice ────────────────────────────────────────────────────────
const playerSlice = createSlice({
  name: 'player',
  initialState,

  reducers: {
    // Called by TrackPlayer event listener
    updateProgress: (state, action: PayloadAction<{ position: number; duration: number }>) => {
      state.position = action.payload.position;
      state.duration = action.payload.duration;
    },
    updateTrackState: (state, action: PayloadAction<TrackState>) => {
      state.trackState = action.payload;
    },
    setIsMiniPlayer: (state, action: PayloadAction<boolean>) => {
      state.isMiniPlayer = action.payload;
    },
    clearPlayerError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(loadRecordingThunk.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
        state.position  = 0;
      })
      .addCase(loadRecordingThunk.fulfilled, (state, action) => {
        state.isLoading       = false;
        state.currentRecording = action.payload;
        state.trackState       = TrackState.Playing;
        state.isMiniPlayer     = true;
      })
      .addCase(loadRecordingThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload as string;
      });

    builder.addCase(togglePlayPauseThunk.fulfilled, (state, action) => {
      state.trackState = action.payload;
    });

    builder.addCase(seekThunk.fulfilled, (state, action) => {
      state.position = action.payload;
    });

    builder.addCase(setSpeedThunk.fulfilled, (state, action) => {
      state.speed = action.payload;
    });

    builder.addCase(stopPlayerThunk.fulfilled, (state) => {
      state.currentRecording = null;
      state.trackState       = TrackState.None;
      state.position         = 0;
      state.duration         = 0;
      state.isMiniPlayer     = false;
    });
  },
});

export const {
  updateProgress, updateTrackState,
  setIsMiniPlayer, clearPlayerError,
} = playerSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────
const pState = (s: RootState) => s.player;
export const selectCurrentRecording = createSelector(pState, (s) => s.currentRecording);
export const selectTrackState       = createSelector(pState, (s) => s.trackState);
export const selectPosition         = createSelector(pState, (s) => s.position);
export const selectDuration         = createSelector(pState, (s) => s.duration);
export const selectSpeed            = createSelector(pState, (s) => s.speed);
export const selectIsPlayerLoading  = createSelector(pState, (s) => s.isLoading);
export const selectIsMiniPlayer     = createSelector(pState, (s) => s.isMiniPlayer);
export const selectIsPlaying        = createSelector(
  pState, (s) => s.trackState === TrackState.Playing,
);
export const selectProgressPercent  = createSelector(pState, (s) =>
  s.duration > 0 ? s.position / s.duration : 0,
);

export default playerSlice.reducer;
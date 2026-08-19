/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
  createSlice,
  createAsyncThunk,
  createSelector,
  type PayloadAction,
} from '@reduxjs/toolkit';
import type { RootState }     from '@store/index';
import type { UserSettings }  from '@types/settings.types';
import { DEFAULT_SETTINGS }   from '@types/settings.types';
import { getSettingsApi, updateSettingsApi } from '../services/settings.api';

// ─── State ────────────────────────────────────────────────────────
interface SettingsState {
  data:      UserSettings;
  isLoading: boolean;
  isSaving:  boolean;
  error:     string | null;
  lastSynced: string | null;
}

const initialState: SettingsState = {
  data:       DEFAULT_SETTINGS,
  isLoading:  false,
  isSaving:   false,
  error:      null,
  lastSynced: null,
};

// ─── Thunks ───────────────────────────────────────────────────────
export const fetchSettingsThunk = createAsyncThunk(
  'settings/fetch',
  async (_, { rejectWithValue }) => {
    try { return await getSettingsApi(); }
    catch (e) { return rejectWithValue((e as { message?: string }).message); }
  },
);

export const updateSettingsThunk = createAsyncThunk(
  'settings/update',
  async (updates: Partial<UserSettings>, { rejectWithValue }) => {
    try { return await updateSettingsApi(updates); }
    catch (e) { return rejectWithValue((e as { message?: string }).message); }
  },
);

// ─── Slice ────────────────────────────────────────────────────────
const settingsSlice = createSlice({
  name: 'settings',
  initialState,

  reducers: {
    // Optimistic update — UI immediately reflects change
    updateSettingsOptimistic: (
      state,
      action: PayloadAction<Partial<UserSettings>>,
    ) => {
      state.data = { ...state.data, ...action.payload } as UserSettings;
    },
    // Nested update helper
    updateNestedSetting: (
      state,
      action: PayloadAction<{
        section: keyof UserSettings;
        key:     string;
        value:   unknown;
      }>,
    ) => {
      const { section, key, value } = action.payload;
      const sectionData = state.data[section];
      if (typeof sectionData === 'object' && sectionData !== null) {
        (state.data[section] as Record<string, unknown>)[key] = value;
      }
    },
    clearSettingsError: (state): void => { state.error = null; },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchSettingsThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchSettingsThunk.fulfilled, (state, action) => {
        state.isLoading  = false;
        // Merge with defaults to ensure all keys exist
        state.data       = { ...DEFAULT_SETTINGS, ...action.payload };
        state.lastSynced = new Date().toISOString();
      })
      .addCase(fetchSettingsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload as string;
      });

    builder
      .addCase(updateSettingsThunk.pending, (state) => {
        state.isSaving = true;
      })
      .addCase(updateSettingsThunk.fulfilled, (state, action) => {
        state.isSaving   = false;
        state.data       = { ...DEFAULT_SETTINGS, ...action.payload };
        state.lastSynced = new Date().toISOString();
      })
      .addCase(updateSettingsThunk.rejected, (state, action) => {
        state.isSaving = false;
        state.error    = action.payload as string;
      });
  },
});

export const {
  updateSettingsOptimistic,
  updateNestedSetting,
  clearSettingsError,
} = settingsSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────
const sState = (s: RootState) => s.settings;
export const selectSettings         = createSelector(sState, (s) => s.data);
export const selectThemeMode        = createSelector(sState, (s) => s.data.theme);
export const selectRecordingSettings = createSelector(sState, (s) => s.data.recording);
export const selectAISettings       = createSelector(sState, (s) => s.data.ai);
export const selectNotifSettings    = createSelector(sState, (s) => s.data.notifications);
export const selectStorageSettings  = createSelector(sState, (s) => s.data.storage);
export const selectSettingsLoading  = createSelector(sState, (s) => s.isLoading);
export const selectSettingsSaving   = createSelector(sState, (s) => s.isSaving);

export default settingsSlice.reducer;

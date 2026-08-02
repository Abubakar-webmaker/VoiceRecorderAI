import {
  createSlice,
  createSelector,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { Appearance } from 'react-native';
import type { RootState } from '@store/index';
import type { ThemeMode } from '@types/settings.types';

interface ThemeState {
  mode:      ThemeMode;  // user preference
  isDark:    boolean;    // resolved value
}

const getSystemDark = (): boolean =>
  Appearance.getColorScheme() === 'dark';

const resolveIsDark = (mode: ThemeMode): boolean => {
  if (mode === 'dark')   return true;
  if (mode === 'light')  return false;
  return getSystemDark();
};

const initialState: ThemeState = {
  mode:   'dark',
  isDark: true,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,

  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.mode   = action.payload;
      state.isDark = resolveIsDark(action.payload);
    },
    // Called when system appearance changes
    syncSystemTheme: (state) => {
      if (state.mode === 'system') {
        state.isDark = getSystemDark();
      }
    },
  },
});

export const { setThemeMode, syncSystemTheme } = themeSlice.actions;

const tState = (s: RootState) => s.theme;
export const selectTheme    = createSelector(tState, (s) => s);
export const selectIsDark   = createSelector(tState, (s) => s.isDark);
export const selectThemeMode2 = createSelector(tState, (s) => s.mode);

export default themeSlice.reducer;
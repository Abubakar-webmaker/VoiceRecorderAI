import { useCallback } from 'react';
import useAppDispatch  from '@hooks/useAppDispatch';
import useAppSelector  from '@hooks/useAppSelector';
import {
  fetchSettingsThunk,
  updateSettingsThunk,
  updateSettingsOptimistic,
  updateNestedSetting,
  selectSettings,
  selectThemeMode,
  selectRecordingSettings,
  selectAISettings,
  selectNotifSettings,
  selectStorageSettings,
  selectSettingsLoading,
  selectSettingsSaving,
} from '../store/settingsSlice';
import { setThemeMode } from '../store/themeSlice';
import type { UserSettings, ThemeMode, AudioQuality, AudioFormat, SummaryLength }
  from '@types/settings.types';

const useSettings = () => {
  const dispatch = useAppDispatch();

  const settings          = useAppSelector(selectSettings);
  const themeMode         = useAppSelector(selectThemeMode);
  const recordingSettings = useAppSelector(selectRecordingSettings);
  const aiSettings        = useAppSelector(selectAISettings);
  const notifSettings     = useAppSelector(selectNotifSettings);
  const storageSettings   = useAppSelector(selectStorageSettings);
  const isLoading         = useAppSelector(selectSettingsLoading);
  const isSaving          = useAppSelector(selectSettingsSaving);

  // ─── Theme ──────────────────────────────────────────────────
  const changeTheme = useCallback(
    (mode: ThemeMode): void => {
      dispatch(updateSettingsOptimistic({ theme: mode }));
      dispatch(setThemeMode(mode));
      void dispatch(updateSettingsThunk({ theme: mode }));
    },
    [dispatch],
  );

  // ─── Generic nested setting updater ──────────────────────────
  const updateSetting = useCallback(
    <S extends keyof UserSettings>(
      section: S,
      key:     keyof UserSettings[S] & string,
      value:   UserSettings[S][keyof UserSettings[S]],
    ): void => {
      dispatch(updateNestedSetting({ section, key, value }));
      // Debounced backend sync could go here — Phase 11 mein
      void dispatch(updateSettingsThunk({
        [section]: {
          ...(settings[section] as object),
          [key]: value,
        },
      } as Partial<UserSettings>));
    },
    [dispatch, settings],
  );

  // ─── Recording Settings ──────────────────────────────────────
  const setAudioQuality = useCallback(
    (q: AudioQuality) => updateSetting('recording', 'quality', q),
    [updateSetting],
  );
  const setAudioFormat  = useCallback(
    (f: AudioFormat) => updateSetting('recording', 'format', f),
    [updateSetting],
  );
  const setAutoTranscribe = useCallback(
    (v: boolean) => updateSetting('recording', 'autoTranscribe', v),
    [updateSetting],
  );
  const setAutoSummarize = useCallback(
    (v: boolean) => updateSetting('recording', 'autoSummarize', v),
    [updateSetting],
  );

  // ─── AI Settings ──────────────────────────────────────────────
  const setAISummaryLength = useCallback(
    (l: SummaryLength) => updateSetting('ai', 'summaryLength', l),
    [updateSetting],
  );
  const setAILanguage = useCallback(
    (lang: string) => updateSetting('ai', 'defaultLanguage', lang),
    [updateSetting],
  );
  const setAutoKeywords = useCallback(
    (v: boolean) => updateSetting('ai', 'autoKeywords', v),
    [updateSetting],
  );

  // ─── Notification Settings ────────────────────────────────────
  const setPushNotif = useCallback(
    (v: boolean) => updateSetting('notifications', 'push', v),
    [updateSetting],
  );
  const setEmailNotif = useCallback(
    (v: boolean) => updateSetting('notifications', 'email', v),
    [updateSetting],
  );
  const setTranscriptionNotif = useCallback(
    (v: boolean) => updateSetting('notifications', 'transcriptionComplete', v),
    [updateSetting],
  );

  // ─── Storage Settings ─────────────────────────────────────────
  const setAutoSync = useCallback(
    (v: boolean) => updateSetting('storage', 'autoSync', v),
    [updateSetting],
  );
  const setSyncOnWifi = useCallback(
    (v: boolean) => updateSetting('storage', 'syncOnWifiOnly', v),
    [updateSetting],
  );

  const fetchSettings = useCallback(
    () => dispatch(fetchSettingsThunk()),
    [dispatch],
  );

  return {
    settings, themeMode, recordingSettings, aiSettings,
    notifSettings, storageSettings, isLoading, isSaving,
    changeTheme,
    setAudioQuality, setAudioFormat, setAutoTranscribe, setAutoSummarize,
    setAISummaryLength, setAILanguage, setAutoKeywords,
    setPushNotif, setEmailNotif, setTranscriptionNotif,
    setAutoSync, setSyncOnWifi,
    fetchSettings,
  };
};

export default useSettings;
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// ─── Auth Stack ───────────────────────────────────────────────────
export type AuthStackParamList = {
  Welcome:         undefined;
  Login:           undefined;
  Register:        undefined;
  ForgotPassword:  undefined;
  VerifyEmail:     { email: string };
  ResetPassword:   { token: string };
};

// ─── Home Stack ───────────────────────────────────────────────────
export type HomeStackParamList = {
  Home: undefined;
  Subscription: undefined;
};

// ─── Recordings Stack ─────────────────────────────────────────────
export type RecordingsStackParamList = {
  Recordings:    { folderId?: string; folderName?: string };
  RecordingDetail: { recordingId: string };
  FolderView:    { folderId: string; folderName: string };
  Player:        { recordingId: string };
};

// ─── Record Stack ─────────────────────────────────────────────────
export type RecordStackParamList = {
  Record: { folderId?: string };
};

// ─── Search Stack ─────────────────────────────────────────────────
export type SearchStackParamList = {
  Search: undefined;
};

// ─── Settings Stack ───────────────────────────────────────────────
export type SettingsStackParamList = {
  Settings:         undefined;
  Profile:          undefined;
  Subscription:     undefined;
  AppSettings:      undefined;
  NotificationPrefs: undefined;
  StorageManager:   undefined;
  About:            undefined;
};

// ─── Main Tab Navigator ───────────────────────────────────────────
export type MainTabParamList = {
  HomeTab:       NavigatorScreenParams<HomeStackParamList> | undefined;
  RecordingsTab: NavigatorScreenParams<RecordingsStackParamList> | undefined;
  RecordTab:     NavigatorScreenParams<RecordStackParamList> | undefined;  // Center tab — special
  SearchTab:     NavigatorScreenParams<SearchStackParamList> | undefined;
  SettingsTab:   NavigatorScreenParams<SettingsStackParamList> | undefined;
};

// ─── Root Navigator (Modal screens) ──────────────────────────────
export type RootStackParamList = {
  Main:       undefined;
  // Modal screens
  AIScreen:   { recordingId: string };
  AIChat:     { recordingId: string; chatId?: string };
  ShareSheet: { recordingId: string };
  FolderPicker: { currentFolderId?: string };
  NewFolder:  { parentId?: string };
  EditRecording: { recordingId: string };
};

// ─── Screen Props Helpers ─────────────────────────────────────────
export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type HomeScreenProps<T extends keyof HomeStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<HomeStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >;

export type RecordingsScreenProps<T extends keyof RecordingsStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<RecordingsStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >;

export type SettingsScreenProps<T extends keyof SettingsStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<SettingsStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >;

export type RootScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

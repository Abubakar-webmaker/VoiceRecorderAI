export const ENDPOINTS = {
  // ─── Auth ───────────────────────────────────────────────────
  AUTH: {
    REGISTER:             '/auth/register',
    LOGIN:                '/auth/login',
    LOGOUT:               '/auth/logout',
    LOGOUT_ALL:           '/auth/logout-all',
    REFRESH:              '/auth/refresh',
    ME:                   '/auth/me',
    VERIFY_EMAIL:         (token: string): string => `/auth/verify-email/${token}`,
    RESEND_VERIFICATION:  '/auth/resend-verification',
    FORGOT_PASSWORD:      '/auth/forgot-password',
    RESET_PASSWORD:       (token: string): string => `/auth/reset-password/${token}`,
    CHANGE_PASSWORD:      '/auth/change-password',
  },

  // ─── Recordings ─────────────────────────────────────────────
  RECORDINGS: {
    BASE:         '/recordings',
    DETAIL:       (id: string): string => `/recordings/${id}`,
    WAVEFORM:     (id: string): string => `/recordings/${id}/waveform`,
    DOWNLOAD:     (id: string): string => `/recordings/${id}/download`,
    FAVORITE:     (id: string): string => `/recordings/${id}/favorite`,
    MOVE:         (id: string): string => `/recordings/${id}/move`,
    PLAY:         (id: string): string => `/recordings/${id}/play`,
    SHARE:        (id: string): string => `/recordings/${id}/share`,
    BULK_DELETE:  '/recordings/bulk-delete',
    FAVORITES:    '/recordings/favorites',
    SEARCH:       '/recordings/search',
  },

  // ─── Folders ────────────────────────────────────────────────
  FOLDERS: {
    BASE:   '/folders',
    DETAIL: (id: string): string => `/folders/${id}`,
    MOVE:   (id: string): string => `/folders/${id}/move`,
  },

  // ─── AI ─────────────────────────────────────────────────────
  AI: {
    TRANSCRIBE:    '/ai/transcribe',
    SUMMARIZE:     '/ai/summarize',
    TITLE:         '/ai/title',
    KEYWORDS:      '/ai/keywords',
    ACTION_ITEMS:  '/ai/action-items',
    TRANSLATE:     '/ai/translate',
    PROCESS_ALL:   '/ai/process-all',
    CHAT:          '/ai/chat',
    LANGUAGES:     '/ai/languages',
    CHAT_DETAIL:   (chatId: string): string => `/ai/chats/${chatId}`,
    CHAT_DELETE:   (chatId: string): string => `/ai/chats/${chatId}`,
    RECORDING_AI:  (recordingId: string): string => `/ai/recordings/${recordingId}`,
    RECORDING_CHATS: (recordingId: string): string => `/ai/recordings/${recordingId}/chats`,
    ACTION_ITEM:   (recordingId: string, itemId: string): string =>
      `/ai/recordings/${recordingId}/action-items/${itemId}`,
    NOTES:         (recordingId: string): string => `/ai/recordings/${recordingId}/notes`,
  },

  // ─── Settings ────────────────────────────────────────────────
  SETTINGS: {
    BASE:   '/settings',
    UPDATE: '/settings',
  },

  // ─── User ────────────────────────────────────────────────────
  USER: {
    PROFILE:       '/users/profile',
    AVATAR:        '/users/avatar',
    DELETE:        '/users/delete',
  },
} as const;
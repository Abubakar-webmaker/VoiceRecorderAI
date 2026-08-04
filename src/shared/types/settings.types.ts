// ─── Theme ────────────────────────────────────────────────────────
export type ThemeMode = 'dark' | 'light' | 'system';

// ─── Recording quality & format ───────────────────────────────────
export type AudioQuality = 'low' | 'medium' | 'high';
export type AudioFormat  = 'mp3' | 'wav' | 'm4a' | 'aac';

// ─── AI Settings ──────────────────────────────────────────────────
export type SummaryLength = 'short' | 'medium' | 'long';

// ─── User Settings Document ───────────────────────────────────────
export interface UserSettings {
  theme:    ThemeMode;
  language: string;

  notifications: {
    push:                  boolean;
    email:                 boolean;
    transcriptionComplete: boolean;
    syncComplete:          boolean;
    weeklyReport:          boolean;
  };

  recording: {
    quality:        AudioQuality;
    format:         AudioFormat;
    autoTranscribe: boolean;
    autoSummarize:  boolean;
  };

  ai: {
    defaultLanguage: string;
    summaryLength:   SummaryLength;
    autoKeywords:    boolean;
    autoActionItems: boolean;
  };

  storage: {
    autoSync:            boolean;
    syncOnWifiOnly:      boolean;
    autoDelete:          boolean;
    autoDeleteAfterDays: number;
  };
}

// ─── Default Settings ─────────────────────────────────────────────
export const DEFAULT_SETTINGS: UserSettings = {
  theme:    'dark',
  language: 'en',

  notifications: {
    push:                  true,
    email:                 true,
    transcriptionComplete: true,
    syncComplete:          false,
    weeklyReport:          false,
  },

  recording: {
    quality:        'high',
    format:         'm4a',
    autoTranscribe: true,
    autoSummarize:  false,
  },

  ai: {
    defaultLanguage: 'en',
    summaryLength:   'medium',
    autoKeywords:    true,
    autoActionItems: false,
  },

  storage: {
    autoSync:            true,
    syncOnWifiOnly:      true,
    autoDelete:          false,
    autoDeleteAfterDays: 30,
  },
};

// ─── Subscription Tiers ───────────────────────────────────────────
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface SubscriptionFeature {
  label:      string;
  free:       boolean | string;
  pro:        boolean | string;
  enterprise: boolean | string;
}

export const SUBSCRIPTION_FEATURES: SubscriptionFeature[] = [
  {
    label:      'Storage',
    free:       '500 MB',
    pro:        '10 GB',
    enterprise: '100 GB',
  },
  {
    label:      'Recordings / Month',
    free:       '10',
    pro:        'Unlimited',
    enterprise: 'Unlimited',
  },
  {
    label:      'AI Transcription',
    free:       '5 / month',
    pro:        'Unlimited',
    enterprise: 'Unlimited',
  },
  {
    label:      'AI Summaries',
    free:       false,
    pro:        true,
    enterprise: true,
  },
  {
    label:      'AI Chat',
    free:       false,
    pro:        true,
    enterprise: true,
  },
  {
    label:      'Translation',
    free:       false,
    pro:        '5 languages',
    enterprise: 'All languages',
  },
  {
    label:      'Export (PDF/TXT)',
    free:       false,
    pro:        true,
    enterprise: true,
  },
  {
    label:      'Cloud Sync',
    free:       false,
    pro:        true,
    enterprise: true,
  },
  {
    label:      'Priority Support',
    free:       false,
    pro:        false,
    enterprise: true,
  },
  {
    label:      'Team Sharing',
    free:       false,
    pro:        false,
    enterprise: true,
  },
];

export const SUBSCRIPTION_PRICES = {
  free:       { monthly: 0,   yearly: 0 },
  pro:        { monthly: 9.99,  yearly: 79.99 },
  enterprise: { monthly: 29.99, yearly: 239.99 },
} as const;
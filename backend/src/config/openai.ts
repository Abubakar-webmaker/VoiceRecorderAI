import OpenAI from 'openai';
import { env } from './env';
import { logger } from '@utils/logger';

// ─── OpenAI Client ────────────────────────────────────────────────
export const openai = new OpenAI({
  apiKey:  env.OPENAI_API_KEY,
  timeout: 120_000,   // 2 min — audio transcription time lagta hai
  maxRetries: 3,      // Auto-retry on 429/500
});

// ─── Model Constants ─────────────────────────────────────────────
export const AI_MODELS = {
  WHISPER:    'whisper-1',
  GPT_4O:     'gpt-4o',
  GPT_4O_MINI:'gpt-4o-mini', // Cheaper for simple tasks
} as const;

// ─── Token Limits ────────────────────────────────────────────────
export const TOKEN_LIMITS = {
  SUMMARY:     1000,
  TRANSLATION: 2000,
  TITLE:       100,
  KEYWORDS:    300,
  ACTION_ITEMS:500,
  CHAT:        1500,
} as const;

// ─── Language Map ─────────────────────────────────────────────────
export const SUPPORTED_LANGUAGES: Record<string, string> = {
  en:    'English',
  ur:    'Urdu',
  hi:    'Hindi',
  ar:    'Arabic',
  es:    'Spanish',
  fr:    'French',
  de:    'German',
  zh:    'Chinese',
  ja:    'Japanese',
  ko:    'Korean',
  pt:    'Portuguese',
  ru:    'Russian',
  tr:    'Turkish',
  it:    'Italian',
  nl:    'Dutch',
};

// ─── Verify Connection ────────────────────────────────────────────
export const verifyOpenAIConnection = async (): Promise<void> => {
  try {
    await openai.models.retrieve(AI_MODELS.GPT_4O_MINI);
    logger.info('✅ OpenAI Connected Successfully');
  } catch (error) {
    logger.warn('⚠️  OpenAI connection could not be verified:', error);
  }
};
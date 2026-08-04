import type { AIStatus } from './recording.types';

// ─── Transcript ───────────────────────────────────────────────────
export interface TranscriptSegment {
  id:         number;
  start:      number;   // seconds
  end:        number;   // seconds
  text:       string;
  confidence: number;   // 0-1
  speaker?:   string;
}

// ─── Keywords ─────────────────────────────────────────────────────
export interface AIKeyword {
  word:      string;
  relevance: number;
  count:     number;
}

// ─── Action Items ─────────────────────────────────────────────────
export interface AIActionItem {
  _id:       string;
  task:      string;
  assignee?: string;
  deadline?: string;
  priority:  'low' | 'medium' | 'high';
  completed: boolean;
}

// ─── Translation ──────────────────────────────────────────────────
export interface AITranslation {
  targetLanguage:  string;
  languageName:    string;
  translatedText:  string;
  translatedAt:    string;
}

// ─── AI Summary Document ──────────────────────────────────────────
export interface AISummaryDoc {
  _id:         string;
  recordingId: string;
  userId:      string;

  transcription: {
    status:       AIStatus;
    fullText:     string;
    segments:     TranscriptSegment[];
    language:     string;
    languageName: string;
    confidence:   number;
    duration:     number;
    wordCount:    number;
    model:        string;
    processedAt:  string | null;
    error?:       string;
  };

  summary: {
    status:      AIStatus;
    text:        string;
    length:      'short' | 'medium' | 'long';
    processedAt: string | null;
    error?:      string;
  };

  keywords: {
    status:      AIStatus;
    items:       AIKeyword[];
    processedAt: string | null;
    error?:      string;
  };

  actionItems: {
    status:      AIStatus;
    items:       AIActionItem[];
    processedAt: string | null;
    error?:      string;
  };

  aiTitle: {
    status:      AIStatus;
    text:        string;
    processedAt: string | null;
    error?:      string;
  };

  translations: AITranslation[];

  notes: {
    status:      AIStatus;
    text:        string;
    isEdited:    boolean;
    editedAt:    string | null;
  };

  totalTokensUsed: number;
  totalCost:       number;
  createdAt:       string;
  updatedAt:       string;
}

// ─── Chat ─────────────────────────────────────────────────────────
export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  _id:        string;
  role:       ChatRole;
  content:    string;
  createdAt:  string;
  tokensUsed: number;
}

export interface AIChat {
  _id:         string;
  recordingId: string;
  title:       string;
  messages:    ChatMessage[];
  totalTokens: number;
  totalCost:   number;
  createdAt:   string;
  updatedAt:   string;
}

// ─── Supported Language ───────────────────────────────────────────
export interface SupportedLanguage {
  code: string;
  name: string;
}
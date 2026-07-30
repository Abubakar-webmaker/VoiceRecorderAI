import mongoose, { type Document, Schema } from 'mongoose';
import { AIStatus } from './Recording.model';

// ─── Sub-document Interfaces ──────────────────────────────────────
interface ITranscriptSegment {
  id:         number;
  start:      number;  // seconds
  end:        number;  // seconds
  text:       string;
  confidence: number;  // 0-1
  speaker?:   string;  // Speaker diarization (future)
}

interface IKeyword {
  word:       string;
  relevance:  number;  // 0-1 relevance score
  count:      number;  // Frequency in transcript
}

interface IActionItem {
  task:       string;
  assignee?:  string;
  deadline?:  string;
  priority:   'low' | 'medium' | 'high';
  completed:  boolean;
}

interface ITranslation {
  targetLanguage:  string;
  languageName:    string;
  translatedText:  string;
  translatedAt:    Date;
  tokensUsed:      number;
}

// ─── Main Interface ───────────────────────────────────────────────
export interface IAISummary extends Document {
  _id:               mongoose.Types.ObjectId;
  recordingId:       mongoose.Types.ObjectId;
  userId:            mongoose.Types.ObjectId;

  // Transcription
  transcription: {
    status:        AIStatus;
    fullText:      string;
    segments:      ITranscriptSegment[];
    language:      string;
    languageName:  string;
    confidence:    number;
    duration:      number;
    wordCount:     number;
    model:         string;
    processedAt:   Date | null;
    tokensUsed:    number;
    error?:        string;
  };

  // Summary
  summary: {
    status:      AIStatus;
    text:        string;
    length:      'short' | 'medium' | 'long';
    model:       string;
    processedAt: Date | null;
    tokensUsed:  number;
    error?:      string;
  };

  // Keywords
  keywords: {
    status:      AIStatus;
    items:       IKeyword[];
    model:       string;
    processedAt: Date | null;
    tokensUsed:  number;
    error?:      string;
  };

  // Action Items
  actionItems: {
    status:      AIStatus;
    items:       IActionItem[];
    model:       string;
    processedAt: Date | null;
    tokensUsed:  number;
    error?:      string;
  };

  // AI Generated Title
  aiTitle: {
    status:      AIStatus;
    text:        string;
    model:       string;
    processedAt: Date | null;
    tokensUsed:  number;
    error?:      string;
  };

  // Translations
  translations: ITranslation[];

  // Notes (user-editable + AI generated)
  notes: {
    status:      AIStatus;
    text:        string;
    isEdited:    boolean;  // User ne manually edit kiya
    editedAt:    Date | null;
    model:       string;
    processedAt: Date | null;
    tokensUsed:  number;
    error?:      string;
  };

  // Totals
  totalTokensUsed:  number;
  totalCost:        number;  // USD estimate

  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────
const transcriptSegmentSchema = new Schema<ITranscriptSegment>(
  {
    id:         { type: Number,  required: true },
    start:      { type: Number,  required: true, min: 0 },
    end:        { type: Number,  required: true, min: 0 },
    text:       { type: String,  required: true, trim: true },
    confidence: { type: Number,  default: 1, min: 0, max: 1 },
    speaker:    { type: String,  default: null },
  },
  { _id: false },
);

const keywordSchema = new Schema<IKeyword>(
  {
    word:      { type: String, required: true, trim: true },
    relevance: { type: Number, default: 1, min: 0, max: 1 },
    count:     { type: Number, default: 1, min: 1 },
  },
  { _id: false },
);

const actionItemSchema = new Schema<IActionItem>(
  {
    task:      { type: String, required: true, trim: true },
    assignee:  { type: String, default: null },
    deadline:  { type: String, default: null },
    priority:  { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    completed: { type: Boolean, default: false },
  },
  { _id: true },
);

const translationSchema = new Schema<ITranslation>(
  {
    targetLanguage:  { type: String, required: true },
    languageName:    { type: String, required: true },
    translatedText:  { type: String, required: true },
    translatedAt:    { type: Date, default: Date.now },
    tokensUsed:      { type: Number, default: 0 },
  },
  { _id: false },
);

const aiStatusDefaults = (defaultStatus = AIStatus.NONE) => ({
  status:      { type: String, enum: Object.values(AIStatus), default: defaultStatus },
  model:       { type: String, default: '' },
  processedAt: { type: Date, default: null },
  tokensUsed:  { type: Number, default: 0 },
  error:       { type: String, default: null },
});

const aiSummarySchema = new Schema<IAISummary>(
  {
    recordingId: {
      type:     Schema.Types.ObjectId,
      ref:      'Recording',
      required: true,
      unique:   true, // 1 recording = 1 AI summary doc
    },
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    transcription: {
      ...aiStatusDefaults(),
      fullText:     { type: String, default: '' },
      segments:     { type: [transcriptSegmentSchema], default: [] },
      language:     { type: String, default: 'en' },
      languageName: { type: String, default: 'English' },
      confidence:   { type: Number, default: 0, min: 0, max: 1 },
      duration:     { type: Number, default: 0 },
      wordCount:    { type: Number, default: 0 },
    },

    summary: {
      ...aiStatusDefaults(),
      text:   { type: String, default: '' },
      length: { type: String, enum: ['short', 'medium', 'long'], default: 'medium' },
    },

    keywords: {
      ...aiStatusDefaults(),
      items: { type: [keywordSchema], default: [] },
    },

    actionItems: {
      ...aiStatusDefaults(),
      items: { type: [actionItemSchema], default: [] },
    },

    aiTitle: {
      ...aiStatusDefaults(),
      text: { type: String, default: '' },
    },

    translations: {
      type:    [translationSchema],
      default: [],
    },

    notes: {
      ...aiStatusDefaults(),
      text:        { type: String, default: '' },
      isEdited:    { type: Boolean, default: false },
      editedAt:    { type: Date, default: null },
    },

    totalTokensUsed: { type: Number, default: 0 },
    totalCost:       { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// ─── Indexes ──────────────────────────────────────────────────────
aiSummarySchema.index({ recordingId: 1 }, { unique: true });
aiSummarySchema.index({ userId: 1, createdAt: -1 });
aiSummarySchema.index({ 'transcription.status': 1 });
aiSummarySchema.index({ 'summary.status': 1 });

export const AISummaryModel = mongoose.model<IAISummary>(
  'AISummary',
  aiSummarySchema,
);
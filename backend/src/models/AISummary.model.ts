import mongoose, { Schema, type Document } from 'mongoose';
import { AIStatus } from './Recording.model';

// ─── Sub-document interfaces ──────────────────────────────────────

export interface ITranscriptSegment {
  id:         number;
  start:      number;
  end:        number;
  text:       string;
  confidence: number;
}

export interface ITranscriptionResult {
  status:       AIStatus;
  fullText:     string;
  segments:     ITranscriptSegment[];
  language:     string;
  languageName: string;
  confidence:   number;
  duration:     number;
  wordCount:    number;
  model:        string;
  processedAt:  Date | null;
  tokensUsed:   number;
  error?:       string;
}

export interface ISummaryResult {
  status:      AIStatus;
  text:        string;
  length:      'short' | 'medium' | 'long';
  model:       string;
  processedAt: Date | null;
  tokensUsed:  number;
  error?:      string;
}

export interface IKeywordItem {
  word:      string;
  relevance: number;
  count:     number;
}

export interface IKeywordsResult {
  status:      AIStatus;
  items:       IKeywordItem[];
  model:       string;
  processedAt: Date | null;
  tokensUsed:  number;
  error?:      string;
}

export interface IActionItem {
  task:      string;
  assignee?: string;
  deadline?: string;
  priority:  'low' | 'medium' | 'high';
  completed: boolean;
}

export interface IActionItemsResult {
  status:      AIStatus;
  items:       IActionItem[];
  model:       string;
  processedAt: Date | null;
  tokensUsed:  number;
  error?:      string;
}

export interface IAITitleResult {
  status:      AIStatus;
  text:        string;
  model:       string;
  processedAt: Date | null;
  tokensUsed:  number;
  error?:      string;
}

export interface ITranslation {
  targetLanguage: string;
  languageName:   string;
  translatedText: string;
  translatedAt:   Date;
  tokensUsed:     number;
}

export interface INotesResult {
  text:     string;
  isEdited: boolean;
  editedAt: Date | null;
}

// ─── Main Interface ───────────────────────────────────────────────
export interface IAISummary extends Document {
  _id:            mongoose.Types.ObjectId;
  recordingId:    mongoose.Types.ObjectId;
  userId:         mongoose.Types.ObjectId;
  transcription:  ITranscriptionResult;
  summary:        ISummaryResult;
  keywords:       IKeywordsResult;
  actionItems:    IActionItemsResult;
  aiTitle:        IAITitleResult;
  translations:   ITranslation[];
  notes:          INotesResult;
  totalTokensUsed: number;
  totalCost:       number;
  createdAt:       Date;
  updatedAt:       Date;
}

// ─── Sub-schemas ──────────────────────────────────────────────────

const segmentSchema = new Schema<ITranscriptSegment>(
  {
    id:         { type: Number, required: true },
    start:      { type: Number, required: true },
    end:        { type: Number, required: true },
    text:       { type: String, required: true },
    confidence: { type: Number, default: 0.95 },
  },
  { _id: false },
);

const aiStatusEnum = Object.values(AIStatus);

const transcriptionSchema = new Schema<ITranscriptionResult>(
  {
    status:       { type: String, enum: aiStatusEnum, default: AIStatus.PENDING },
    fullText:     { type: String, default: '' },
    segments:     { type: [segmentSchema], default: [] },
    language:     { type: String, default: 'en' },
    languageName: { type: String, default: 'English' },
    confidence:   { type: Number, default: 0 },
    duration:     { type: Number, default: 0 },
    wordCount:    { type: Number, default: 0 },
    model:        { type: String, default: '' },
    processedAt:  { type: Date, default: null },
    tokensUsed:   { type: Number, default: 0 },
    error:        { type: String },
  },
  { _id: false },
);

const summarySchema = new Schema<ISummaryResult>(
  {
    status:      { type: String, enum: aiStatusEnum, default: AIStatus.PENDING },
    text:        { type: String, default: '' },
    length:      { type: String, enum: ['short', 'medium', 'long'], default: 'medium' },
    model:       { type: String, default: '' },
    processedAt: { type: Date, default: null },
    tokensUsed:  { type: Number, default: 0 },
    error:       { type: String },
  },
  { _id: false },
);

const keywordItemSchema = new Schema<IKeywordItem>(
  {
    word:      { type: String, required: true },
    relevance: { type: Number, default: 0 },
    count:     { type: Number, default: 1 },
  },
  { _id: false },
);

const keywordsSchema = new Schema<IKeywordsResult>(
  {
    status:      { type: String, enum: aiStatusEnum, default: AIStatus.PENDING },
    items:       { type: [keywordItemSchema], default: [] },
    model:       { type: String, default: '' },
    processedAt: { type: Date, default: null },
    tokensUsed:  { type: Number, default: 0 },
    error:       { type: String },
  },
  { _id: false },
);

const actionItemSchema = new Schema<IActionItem>(
  {
    task:      { type: String, required: true },
    assignee:  { type: String },
    deadline:  { type: String },
    priority:  { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    completed: { type: Boolean, default: false },
  },
  { _id: true },
);

const actionItemsSchema = new Schema<IActionItemsResult>(
  {
    status:      { type: String, enum: aiStatusEnum, default: AIStatus.PENDING },
    items:       { type: [actionItemSchema], default: [] },
    model:       { type: String, default: '' },
    processedAt: { type: Date, default: null },
    tokensUsed:  { type: Number, default: 0 },
    error:       { type: String },
  },
  { _id: false },
);

const aiTitleSchema = new Schema<IAITitleResult>(
  {
    status:      { type: String, enum: aiStatusEnum, default: AIStatus.PENDING },
    text:        { type: String, default: '' },
    model:       { type: String, default: '' },
    processedAt: { type: Date, default: null },
    tokensUsed:  { type: Number, default: 0 },
    error:       { type: String },
  },
  { _id: false },
);

const translationSchema = new Schema<ITranslation>(
  {
    targetLanguage: { type: String, required: true },
    languageName:   { type: String, required: true },
    translatedText: { type: String, required: true },
    translatedAt:   { type: Date, default: Date.now },
    tokensUsed:     { type: Number, default: 0 },
  },
  { _id: false },
);

const notesSchema = new Schema<INotesResult>(
  {
    text:     { type: String, default: '' },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
  },
  { _id: false },
);

// ─── Main Schema ──────────────────────────────────────────────────
const aiSummarySchema = new Schema<IAISummary>(
  {
    recordingId: {
      type:     Schema.Types.ObjectId,
      ref:      'Recording',
      required: true,
      unique:   true,
      index:    true,
    },
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    transcription:  { type: transcriptionSchema, default: () => ({}) },
    summary:        { type: summarySchema,        default: () => ({}) },
    keywords:       { type: keywordsSchema,       default: () => ({}) },
    actionItems:    { type: actionItemsSchema,    default: () => ({}) },
    aiTitle:        { type: aiTitleSchema,        default: () => ({}) },
    translations:   { type: [translationSchema],  default: [] },
    notes:          { type: notesSchema,          default: () => ({}) },
    totalTokensUsed: { type: Number, default: 0 },
    totalCost:       { type: Number, default: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────
aiSummarySchema.index({ userId: 1, 'transcription.status': 1 });
aiSummarySchema.index({ recordingId: 1 }, { unique: true });

export const AISummary = mongoose.model<IAISummary>('AISummary', aiSummarySchema);
export { AISummary as AISummaryModel };

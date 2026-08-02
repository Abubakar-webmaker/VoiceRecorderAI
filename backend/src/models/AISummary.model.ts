import mongoose, { Schema, type Document } from 'mongoose';
import type { AIProcessingStatus } from '../types/common.types';

export interface ITranslation {
  targetLanguage: string;
  languageName:   string;
  text:           string;
  translatedAt:   Date;
}

export interface IAISummary extends Document {
  _id:          mongoose.Types.ObjectId;
  recordingId:  mongoose.Types.ObjectId;
  userId:       mongoose.Types.ObjectId;
  // Transcription
  transcript:   string | null;
  transcriptLanguage: string | null;
  transcriptConfidence: number | null;
  // AI Generated
  summary:      string | null;
  aiTitle:      string | null;
  keywords:     string[];
  actionItems:  string[];
  notes:        string | null;
  // Translation
  translations: ITranslation[];
  // Processing
  status:       AIProcessingStatus;
  errorMessage: string | null;
  processingStartedAt: Date | null;
  processingCompletedAt: Date | null;
  // Tokens used (for billing/analytics)
  tokensUsed:   number;
  createdAt:    Date;
  updatedAt:    Date;
}

const translationSchema = new Schema<ITranslation>(
  {
    targetLanguage: { type: String, required: true },
    languageName:   { type: String, required: true },
    text:           { type: String, required: true },
    translatedAt:   { type: Date,   default: Date.now },
  },
  { _id: false },
);

const aiSummarySchema = new Schema<IAISummary>(
  {
    recordingId: {
      type:     Schema.Types.ObjectId,
      ref:      'Recording',
      required: true,
      unique:   true, // One AI result per recording
      index:    true,
    },
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    transcript:           { type: String, default: null },
    transcriptLanguage:   { type: String, default: null },
    transcriptConfidence: { type: Number, default: null, min: 0, max: 1 },
    summary:              { type: String, default: null },
    aiTitle:              { type: String, default: null },
    keywords:             { type: [String], default: [] },
    actionItems:          { type: [String], default: [] },
    notes:                { type: String, default: null },
    translations:         { type: [translationSchema], default: [] },
    status: {
      type:    String,
      enum:    ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index:   true,
    },
    errorMessage:           { type: String, default: null },
    processingStartedAt:    { type: Date,   default: null },
    processingCompletedAt:  { type: Date,   default: null },
    tokensUsed:             { type: Number, default: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────
aiSummarySchema.index({ userId: 1, status: 1 });
aiSummarySchema.index({ recordingId: 1 }, { unique: true });

export const AISummary = mongoose.model<IAISummary>('AISummary', aiSummarySchema);

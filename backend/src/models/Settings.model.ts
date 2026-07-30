import mongoose, { type Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    push: boolean;
    email: boolean;
    transcriptionComplete: boolean;
    syncComplete: boolean;
    weeklyReport: boolean;
  };
  recording: {
    quality: 'low' | 'medium' | 'high';
    format: 'mp3' | 'wav' | 'm4a';
    autoTranscribe: boolean;
    autoSummarize: boolean;
  };
  ai: {
    defaultLanguage: string;
    summaryLength: 'short' | 'medium' | 'long';
    autoKeywords: boolean;
    autoActionItems: boolean;
  };
  storage: {
    autoSync: boolean;
    syncOnWifiOnly: boolean;
    autoDelete: boolean;
    autoDeleteAfterDays: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
    language: {
      type: String,
      default: 'en',
    },
    notifications: {
      push:                   { type: Boolean, default: true },
      email:                  { type: Boolean, default: true },
      transcriptionComplete:  { type: Boolean, default: true },
      syncComplete:           { type: Boolean, default: false },
      weeklyReport:           { type: Boolean, default: false },
    },
    recording: {
      quality:        { type: String, enum: ['low', 'medium', 'high'], default: 'high' },
      format:         { type: String, enum: ['mp3', 'wav', 'm4a'], default: 'm4a' },
      autoTranscribe: { type: Boolean, default: true },
      autoSummarize:  { type: Boolean, default: false },
    },
    ai: {
      defaultLanguage: { type: String, default: 'en' },
      summaryLength:   { type: String, enum: ['short', 'medium', 'long'], default: 'medium' },
      autoKeywords:    { type: Boolean, default: true },
      autoActionItems: { type: Boolean, default: false },
    },
    storage: {
      autoSync:            { type: Boolean, default: true },
      syncOnWifiOnly:      { type: Boolean, default: true },
      autoDelete:          { type: Boolean, default: false },
      autoDeleteAfterDays: { type: Number, default: 30, min: 1, max: 365 },
    },
  },
  { timestamps: true },
);

settingsSchema.index({ userId: 1 }, { unique: true });

export const SettingsModel = mongoose.model<ISettings>('Settings', settingsSchema);
import mongoose, { Schema, type Document } from 'mongoose';

export type ThemePreference   = 'light' | 'dark' | 'system';
export type AudioQuality      = 'low' | 'medium' | 'high';
export type TranscribeLanguage = string; // ISO 639-1 code e.g. 'en', 'es'

export interface ISettings extends Document {
  _id:                  mongoose.Types.ObjectId;
  userId:               mongoose.Types.ObjectId;
  theme:                ThemePreference;
  language:             string;
  audioQuality:         AudioQuality;
  autoSync:             boolean;
  autoTranscribe:       boolean;
  transcribeLanguage:   TranscribeLanguage;
  notificationsEnabled: boolean;
  syncOnWifiOnly:       boolean;
  keepLocalCopy:        boolean;
  defaultFolderId:      mongoose.Types.ObjectId | null;
  createdAt:            Date;
  updatedAt:            Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true,
      index:    true,
    },
    theme: {
      type:    String,
      enum:    ['light', 'dark', 'system'],
      default: 'dark',
    },
    language: {
      type:    String,
      default: 'en',
    },
    audioQuality: {
      type:    String,
      enum:    ['low', 'medium', 'high'],
      default: 'high',
    },
    autoSync: {
      type:    Boolean,
      default: true,
    },
    autoTranscribe: {
      type:    Boolean,
      default: false,
    },
    transcribeLanguage: {
      type:    String,
      default: 'en',
    },
    notificationsEnabled: {
      type:    Boolean,
      default: true,
    },
    syncOnWifiOnly: {
      type:    Boolean,
      default: false,
    },
    keepLocalCopy: {
      type:    Boolean,
      default: true,
    },
    defaultFolderId: {
      type:    Schema.Types.ObjectId,
      ref:     'Folder',
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);

// Alias for services that import SettingsModel
export { Settings as SettingsModel };

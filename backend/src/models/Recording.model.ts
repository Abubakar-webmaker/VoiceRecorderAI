import mongoose, { Schema, type Document } from 'mongoose';
import type { SyncStatus } from '../types/common.types';

// ─── Enums ────────────────────────────────────────────────────────
export enum RecordingStatus {
  UPLOADING  = 'uploading',
  PROCESSING = 'processing',
  READY      = 'ready',
  FAILED     = 'failed',
}

export enum AIStatus {
  PENDING    = 'pending',
  PROCESSING = 'processing',
  COMPLETED  = 'completed',
  FAILED     = 'failed',
}

export enum RecordingFormat {
  M4A  = 'm4a',
  MP3  = 'mp3',
  WAV  = 'wav',
  AAC  = 'aac',
  OGG  = 'ogg',
  WEBM = 'webm',
}

export enum RecordingQuality {
  LOW    = 'low',
  MEDIUM = 'medium',
  HIGH   = 'high',
}

// ─── Sub-document interfaces ──────────────────────────────────────
export interface ICloudInfo {
  publicId:     string;
  url:          string;
  secureUrl:    string;
  format:       string;
  resourceType: string;
  bytes:        number;
  duration:     number;
}

export interface ISharingInfo {
  isShared:   boolean;
  shareToken: string | null;
  expiresAt:  Date | null;
}

export interface IAIInfo {
  transcriptionStatus: AIStatus;
  transcriptionId:     mongoose.Types.ObjectId | null;
  summaryStatus:       AIStatus;
  summaryId:           mongoose.Types.ObjectId | null;
  translationStatus:   AIStatus;
  language:            string | null;
  confidence:          number | null;
  processedAt:         Date | null;
}

// ─── Main Interface ───────────────────────────────────────────────
export interface IRecording extends Document {
  _id:         mongoose.Types.ObjectId;
  userId:      mongoose.Types.ObjectId;
  folderId:    mongoose.Types.ObjectId | null;
  title:       string;
  description: string | null;
  fileName:    string;
  // Cloud storage
  cloud:       ICloudInfo;
  // Local reference (not persisted to DB)
  localPath:   string | null;
  // Status
  status:      RecordingStatus;
  // Audio metadata
  duration:    number;
  fileSize:    number;
  format:      string;
  quality:     string | null;
  sampleRate:  number | null;
  bitrate:     number | null;
  channels:    number | null;
  waveform:    number[];
  // State
  isFavorite:  boolean;
  syncStatus:  SyncStatus;
  playCount:   number;
  lastPlayedAt: Date | null;
  // Sharing
  sharing:     ISharingInfo;
  // AI
  ai:          IAIInfo;
  // Tags
  tags:        string[];
  // Timestamps
  recordedAt:  Date;
  createdAt:   Date;
  updatedAt:   Date;
}

// ─── Schema ───────────────────────────────────────────────────────
const recordingSchema = new Schema<IRecording>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    folderId: {
      type:    Schema.Types.ObjectId,
      ref:     'Folder',
      default: null,
      index:   true,
    },
    title: {
      type:      String,
      required:  [true, 'Title is required'],
      trim:      true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: { type: String, default: null, trim: true },
    fileName:    { type: String, required: true, trim: true },

    cloud: {
      publicId:     { type: String, default: '' },
      url:          { type: String, default: '' },
      secureUrl:    { type: String, default: '' },
      format:       { type: String, default: '' },
      resourceType: { type: String, default: 'video' },
      bytes:        { type: Number, default: 0 },
      duration:     { type: Number, default: 0 },
    },

    localPath: { type: String, default: null },

    status: {
      type:    String,
      enum:    Object.values(RecordingStatus),
      default: RecordingStatus.UPLOADING,
      index:   true,
    },

    duration:   { type: Number, default: 0, min: 0 },
    fileSize:   { type: Number, default: 0, min: 0 },
    format:     { type: String, default: 'm4a' },
    quality:    { type: String, default: null },
    sampleRate: { type: Number, default: null },
    bitrate:    { type: Number, default: null },
    channels:   { type: Number, default: null },
    waveform:   { type: [Number], default: [] },

    isFavorite: { type: Boolean, default: false, index: true },
    syncStatus: {
      type:    String,
      enum:    ['local', 'syncing', 'synced', 'failed'],
      default: 'local',
      index:   true,
    },
    playCount:    { type: Number, default: 0 },
    lastPlayedAt: { type: Date, default: null },

    sharing: {
      isShared:   { type: Boolean, default: false },
      shareToken: { type: String, default: null },
      expiresAt:  { type: Date,   default: null },
    },

    ai: {
      transcriptionStatus: {
        type:    String,
        enum:    Object.values(AIStatus),
        default: AIStatus.PENDING,
      },
      transcriptionId: { type: Schema.Types.ObjectId, ref: 'AISummary', default: null },
      summaryStatus: {
        type:    String,
        enum:    Object.values(AIStatus),
        default: AIStatus.PENDING,
      },
      summaryId:         { type: Schema.Types.ObjectId, ref: 'AISummary', default: null },
      translationStatus: {
        type:    String,
        enum:    Object.values(AIStatus),
        default: AIStatus.PENDING,
      },
      language:    { type: String, default: null },
      confidence:  { type: Number, default: null },
      processedAt: { type: Date,   default: null },
    },

    tags:       { type: [String], default: [] },
    recordedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────
recordingSchema.index({ userId: 1, createdAt: -1 });
recordingSchema.index({ userId: 1, status: 1, createdAt: -1 });
recordingSchema.index({ userId: 1, isDeleted: 1, createdAt: -1 });
recordingSchema.index({ userId: 1, isFavorite: 1 });
recordingSchema.index({ userId: 1, folderId: 1 });
recordingSchema.index({ userId: 1, syncStatus: 1 });
recordingSchema.index({ title: 'text', tags: 'text' });

// ─── Virtual ──────────────────────────────────────────────────────
recordingSchema.virtual('isCloud').get(function () {
  return this.cloud.secureUrl !== '';
});

export const Recording      = mongoose.model<IRecording>('Recording', recordingSchema);
export { Recording as RecordingModel };

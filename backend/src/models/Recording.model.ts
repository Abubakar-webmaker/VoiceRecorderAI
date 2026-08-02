import mongoose, { Schema, type Document } from 'mongoose';
import type { SyncStatus } from '../types/common.types';

export interface IRecording extends Document {
  _id:          mongoose.Types.ObjectId;
  userId:       mongoose.Types.ObjectId;
  folderId:     mongoose.Types.ObjectId | null;
  title:        string;
  fileName:     string;
  // Cloud storage
  cloudPublicId: string | null;
  cloudUrl:      string | null;
  // Local reference (stored on device — not persisted to DB)
  localPath:    string | null;
  // Audio metadata
  duration:     number;   // seconds
  fileSize:     number;   // bytes
  mimeType:     string;
  sampleRate:   number | null;
  bitRate:      number | null;
  channels:     number | null;
  // State
  isFavorite:   boolean;
  syncStatus:   SyncStatus;
  isDeleted:    boolean;
  deletedAt:    Date | null;
  // Tags
  tags:         string[];
  // Timestamps
  recordedAt:   Date;
  createdAt:    Date;
  updatedAt:    Date;
}

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
    fileName: {
      type:     String,
      required: true,
      trim:     true,
    },
    cloudPublicId: { type: String, default: null },
    cloudUrl:      { type: String, default: null },
    localPath:     { type: String, default: null },
    duration: {
      type:    Number,
      default: 0,
      min:     [0, 'Duration cannot be negative'],
    },
    fileSize: {
      type:    Number,
      default: 0,
      min:     [0, 'File size cannot be negative'],
    },
    mimeType: {
      type:    String,
      default: 'audio/m4a',
    },
    sampleRate: { type: Number, default: null },
    bitRate:    { type: Number, default: null },
    channels:   { type: Number, default: null },
    isFavorite: {
      type:    Boolean,
      default: false,
      index:   true,
    },
    syncStatus: {
      type:    String,
      enum:    ['local', 'syncing', 'synced', 'failed'],
      default: 'local',
      index:   true,
    },
    isDeleted: {
      type:    Boolean,
      default: false,
      index:   true,
    },
    deletedAt: { type: Date, default: null },
    tags: {
      type:    [String],
      default: [],
    },
    recordedAt: {
      type:    Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────
recordingSchema.index({ userId: 1, createdAt: -1 });
recordingSchema.index({ userId: 1, isDeleted: 1, createdAt: -1 });
recordingSchema.index({ userId: 1, isFavorite: 1, isDeleted: 1 });
recordingSchema.index({ userId: 1, folderId: 1, isDeleted: 1 });
recordingSchema.index({ userId: 1, syncStatus: 1 });
// Full-text search on title and tags
recordingSchema.index({ title: 'text', tags: 'text' });

// ─── Virtual: isCloud ─────────────────────────────────────────────
recordingSchema.virtual('isCloud').get(function () {
  return this.cloudUrl != null;
});

export const Recording = mongoose.model<IRecording>('Recording', recordingSchema);

// Alias for services that import RecordingModel
export { Recording as RecordingModel };

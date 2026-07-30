import mongoose, { type Document, type Model, Schema } from 'mongoose';

// ─── Enums ────────────────────────────────────────────────────────
export enum RecordingStatus {
  PENDING    = 'pending',    // Upload queued
  UPLOADING  = 'uploading',  // Currently uploading
  READY      = 'ready',      // Available
  PROCESSING = 'processing', // AI processing
  FAILED     = 'failed',     // Upload/processing failed
}

export enum RecordingFormat {
  MP3  = 'mp3',
  WAV  = 'wav',
  M4A  = 'm4a',
  AAC  = 'aac',
  OGG  = 'ogg',
  WEBM = 'webm',
  FLAC = 'flac',
}

export enum RecordingQuality {
  LOW    = 'low',    // 64kbps
  MEDIUM = 'medium', // 128kbps
  HIGH   = 'high',   // 320kbps
}

export enum AIStatus {
  NONE        = 'none',
  PENDING     = 'pending',
  PROCESSING  = 'processing',
  COMPLETED   = 'completed',
  FAILED      = 'failed',
}

// ─── Sub-document Interfaces ──────────────────────────────────────
interface ICloudStorage {
  publicId:    string;  // Cloudinary public ID
  url:         string;  // CDN URL
  secureUrl:   string;  // HTTPS URL
  format:      string;
  resourceType: string; // 'video' for audio in Cloudinary
  bytes:       number;
  duration:    number;  // seconds
}

interface IAIProcessing {
  transcriptionStatus: AIStatus;
  transcriptionId?:    mongoose.Types.ObjectId; // AISummary ref
  summaryStatus:       AIStatus;
  summaryId?:          mongoose.Types.ObjectId;
  translationStatus:   AIStatus;
  language:            string;    // Detected language code
  confidence?:         number;    // STT confidence 0-1
  processedAt?:        Date;
}

interface ISharing {
  isShared:    boolean;
  shareToken?: string;    // Unique share link token
  sharedWith:  mongoose.Types.ObjectId[];  // User IDs
  expiresAt?:  Date;
  viewCount:   number;
}

// ─── Main Interface ───────────────────────────────────────────────
export interface IRecording extends Document {
  _id:          mongoose.Types.ObjectId;
  userId:       mongoose.Types.ObjectId;
  folderId:     mongoose.Types.ObjectId | null;
  title:        string;
  description:  string;
  duration:     number;    // seconds
  fileSize:     number;    // bytes
  format:       RecordingFormat;
  quality:      RecordingQuality;
  sampleRate:   number;    // Hz e.g. 44100
  channels:     number;    // 1 = mono, 2 = stereo
  bitrate:      number;    // kbps
  status:       RecordingStatus;
  cloud:        ICloudStorage;
  ai:           IAIProcessing;
  sharing:      ISharing;
  tags:         string[];
  isFavorite:   boolean;
  isPinned:     boolean;
  waveform:     number[];  // Amplitude array for visualization
  thumbnail?:   string;    // Waveform image URL
  playCount:    number;
  lastPlayedAt?: Date;
  recordedAt:   Date;      // Actual recording timestamp (offline support)
  createdAt:    Date;
  updatedAt:    Date;
}

interface IRecordingModel extends Model<IRecording> {
  findByUser(
    userId: string,
    options?: {
      folderId?:  string | null;
      page?:      number;
      limit?:     number;
      sortBy?:    string;
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<{ recordings: IRecording[]; total: number }>;
}

// ─── Schema ───────────────────────────────────────────────────────
const recordingSchema = new Schema<IRecording, IRecordingModel>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    folderId: {
      type:    Schema.Types.ObjectId,
      ref:     'Folder',
      default: null,
    },
    title: {
      type:      String,
      required:  [true, 'Recording title is required'],
      trim:      true,
      minlength: [1,   'Title cannot be empty'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type:      String,
      default:   '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
      trim:      true,
    },
    duration: {
      type:     Number,
      required: true,
      min:      [0, 'Duration cannot be negative'],
    },
    fileSize: {
      type:     Number,
      required: true,
      min:      [1, 'File size must be positive'],
    },
    format: {
      type:     String,
      enum:     Object.values(RecordingFormat),
      required: true,
    },
    quality: {
      type:    String,
      enum:    Object.values(RecordingQuality),
      default: RecordingQuality.HIGH,
    },
    sampleRate: {
      type:    Number,
      default: 44100,
    },
    channels: {
      type:    Number,
      default: 1,
      min:     1,
      max:     2,
    },
    bitrate: {
      type:    Number,
      default: 128,
    },
    status: {
      type:    String,
      enum:    Object.values(RecordingStatus),
      default: RecordingStatus.PENDING,
    },
    cloud: {
      publicId:     { type: String, default: '' },
      url:          { type: String, default: '' },
      secureUrl:    { type: String, default: '' },
      format:       { type: String, default: '' },
      resourceType: { type: String, default: 'video' },
      bytes:        { type: Number, default: 0 },
      duration:     { type: Number, default: 0 },
    },
    ai: {
      transcriptionStatus: {
        type:    String,
        enum:    Object.values(AIStatus),
        default: AIStatus.NONE,
      },
      transcriptionId: {
        type:    Schema.Types.ObjectId,
        ref:     'AISummary',
        default: null,
      },
      summaryStatus: {
        type:    String,
        enum:    Object.values(AIStatus),
        default: AIStatus.NONE,
      },
      summaryId: {
        type:    Schema.Types.ObjectId,
        ref:     'AISummary',
        default: null,
      },
      translationStatus: {
        type:    String,
        enum:    Object.values(AIStatus),
        default: AIStatus.NONE,
      },
      language:    { type: String, default: 'en' },
      confidence:  { type: Number, min: 0, max: 1, default: null },
      processedAt: { type: Date, default: null },
    },
    sharing: {
      isShared:   { type: Boolean, default: false },
      shareToken: { type: String, select: false, default: null },
      sharedWith: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      expiresAt:  { type: Date, default: null },
      viewCount:  { type: Number, default: 0 },
    },
    tags: {
      type:     [String],
      default:  [],
      validate: {
        validator: (tags: string[]) => tags.length <= 10,
        message:   'Maximum 10 tags allowed',
      },
    },
    isFavorite: {
      type:    Boolean,
      default: false,
    },
    isPinned: {
      type:    Boolean,
      default: false,
    },
    waveform: {
      type:    [Number],
      default: [],
    },
    thumbnail: {
      type:    String,
      default: null,
    },
    playCount: {
      type:    Number,
      default: 0,
      min:     0,
    },
    lastPlayedAt: {
      type:    Date,
      default: null,
    },
    recordedAt: {
      type:    Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        delete ret['sharing']?.shareToken;
        return ret;
      },
    },
  },
);

// ─── Indexes ──────────────────────────────────────────────────────
recordingSchema.index({ userId: 1, createdAt: -1 });
recordingSchema.index({ userId: 1, folderId: 1 });
recordingSchema.index({ userId: 1, isFavorite: 1 });
recordingSchema.index({ userId: 1, status: 1 });
recordingSchema.index({ userId: 1, tags: 1 });
recordingSchema.index({ userId: 1, recordedAt: -1 });
recordingSchema.index(
  { title: 'text', description: 'text', tags: 'text' },
  { name: 'recording_text_search' },
);
recordingSchema.index({ 'sharing.shareToken': 1 }, { sparse: true });
recordingSchema.index({ 'ai.transcriptionStatus': 1 });

// ─── Static Methods ───────────────────────────────────────────────
recordingSchema.static(
  'findByUser',
  async function (
    userId: string,
    options: {
      folderId?:  string | null;
      page?:      number;
      limit?:     number;
      sortBy?:    string;
      sortOrder?: 'asc' | 'desc';
    } = {},
  ): Promise<{ recordings: IRecording[]; total: number }> {
    const {
      folderId,
      page      = 1,
      limit     = 20,
      sortBy    = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const query: Record<string, unknown> = {
      userId,
      status: { $ne: RecordingStatus.FAILED },
    };

    if (folderId !== undefined) {
      query['folderId'] = folderId ?? null;
    }

    const skip      = (page - 1) * limit;
    const sortDir   = sortOrder === 'asc' ? 1 : -1;
    const sortQuery = { [sortBy]: sortDir };

    const [recordings, total] = await Promise.all([
      this.find(query)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .select('-waveform -__v')  // Waveform heavy hai, alag fetch karo
        .lean(),
      this.countDocuments(query),
    ]);

    return { recordings: recordings as IRecording[], total };
  },
);

export const RecordingModel = mongoose.model<IRecording, IRecordingModel>(
  'Recording',
  recordingSchema,
);
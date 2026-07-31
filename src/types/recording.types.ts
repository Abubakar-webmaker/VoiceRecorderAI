// ─── Enums ────────────────────────────────────────────────────────
export enum RecordingStatus {
  PENDING    = 'pending',
  UPLOADING  = 'uploading',
  READY      = 'ready',
  PROCESSING = 'processing',
  FAILED     = 'failed',
}

export enum AIStatus {
  NONE       = 'none',
  PENDING    = 'pending',
  PROCESSING = 'processing',
  COMPLETED  = 'completed',
  FAILED     = 'failed',
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
  LOW    = 'low',
  MEDIUM = 'medium',
  HIGH   = 'high',
}

// ─── Sub-interfaces ───────────────────────────────────────────────
export interface RecordingCloud {
  publicId:     string;
  url:          string;
  secureUrl:    string;
  format:       string;
  bytes:        number;
  duration:     number;
  resourceType: string;
}

export interface RecordingAI {
  transcriptionStatus: AIStatus;
  transcriptionId?:   string;
  summaryStatus:      AIStatus;
  summaryId?:         string;
  translationStatus:  AIStatus;
  language:           string;
  confidence?:        number;
  processedAt?:       string;
}

export interface RecordingSharing {
  isShared:   boolean;
  expiresAt?: string;
  viewCount:  number;
}

// ─── Main Recording Interface ─────────────────────────────────────
export interface Recording {
  _id:          string;
  userId:       string;
  folderId:     string | null;
  title:        string;
  description:  string;
  duration:     number;    // seconds
  fileSize:     number;    // bytes
  format:       RecordingFormat;
  quality:      RecordingQuality;
  sampleRate:   number;
  channels:     number;
  bitrate:      number;
  status:       RecordingStatus;
  cloud:        RecordingCloud;
  ai:           RecordingAI;
  sharing:      RecordingSharing;
  tags:         string[];
  isFavorite:   boolean;
  isPinned:     boolean;
  waveform:     number[];
  playCount:    number;
  lastPlayedAt?: string;
  recordedAt:   string;
  createdAt:    string;
  updatedAt:    string;
}

// ─── Folder Interface ─────────────────────────────────────────────
export interface Folder {
  _id:            string;
  userId:         string;
  parentId:       string | null;
  name:           string;
  description:    string;
  color:          string;
  icon:           string;
  isDefault:      boolean;
  isPinned:       boolean;
  recordingCount: number;
  totalSize:      number;
  path:           string;
  depth:          number;
  createdAt:      string;
  updatedAt:      string;
}

// ─── Query Params ─────────────────────────────────────────────────
export interface RecordingQueryParams {
  page?:      number;
  limit?:     number;
  sortBy?:    'createdAt' | 'title' | 'duration' | 'fileSize' | 'recordedAt';
  sortOrder?: 'asc' | 'desc';
  folderId?:  string | null;
  tags?:      string;
  isFavorite?: boolean;
}

export interface SearchQueryParams {
  q:      string;
  page?:  number;
  limit?: number;
}

// ─── Pagination ───────────────────────────────────────────────────
export interface PaginationInfo {
  currentPage:  number;
  totalPages:   number;
  totalItems:   number;
  itemsPerPage: number;
  hasNextPage:  boolean;
  hasPrevPage:  boolean;
}

// ─── Download ─────────────────────────────────────────────────────
export interface DownloadUrlResult {
  url:       string;
  filename:  string;
  expiresIn: number;
}

// ─── Share ────────────────────────────────────────────────────────
export interface ShareResult {
  shareToken: string;
  shareUrl:   string;
}

// ─── Filter Tab ───────────────────────────────────────────────────
export type FilterTab = 'all' | 'favorites' | 'pinned' | 'recent';

// ─── Helpers ──────────────────────────────────────────────────────
export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const getAIStatusColor = (status: AIStatus): string => {
  const map: Record<AIStatus, string> = {
    [AIStatus.NONE]:       '#3D4F73',
    [AIStatus.PENDING]:    '#FAAD14',
    [AIStatus.PROCESSING]: '#6366F1',
    [AIStatus.COMPLETED]:  '#4ECDC4',
    [AIStatus.FAILED]:     '#FF6B6B',
  };
  return map[status];
};
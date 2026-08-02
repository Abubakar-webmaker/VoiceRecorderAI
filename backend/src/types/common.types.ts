import { Types } from 'mongoose';

// ─── Pagination ───────────────────────────────────────────────────
export interface PaginationQuery {
  page:  number;
  limit: number;
  skip:  number;
}

export interface PaginationParams {
  page?:  string | number;
  limit?: string | number;
}

export const parsePagination = (params: PaginationParams): PaginationQuery => {
  const page  = Math.max(1, Number(params.page  ?? 1));
  const limit = Math.min(100, Math.max(1, Number(params.limit ?? 20)));
  return { page, limit, skip: (page - 1) * limit };
};

// ─── JWT Payload ──────────────────────────────────────────────────
export interface JwtAccessPayload {
  userId: string;
  email:  string;
  role:   UserRole;
  iat?:   number;
  exp?:   number;
}

export interface JwtRefreshPayload {
  userId:  string;
  tokenId: string; // Unique per token — for rotation tracking
  iat?:    number;
  exp?:    number;
}

// ─── User Roles ───────────────────────────────────────────────────
export type UserRole = 'user' | 'admin';

// ─── Subscription Plans ───────────────────────────────────────────
export type SubscriptionPlan   = 'free' | 'pro';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';

// ─── Recording Status ─────────────────────────────────────────────
export type SyncStatus = 'local' | 'syncing' | 'synced' | 'failed';

// ─── AI Processing Status ─────────────────────────────────────────
export type AIProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ─── Upload Result (Cloudinary) ───────────────────────────────────
export interface UploadResult {
  publicId:  string;
  secureUrl: string;
  url:       string;
  format:    string;
  bytes:     number;
  duration?: number;
  resourceType: string;
}

// ─── Sort Options ─────────────────────────────────────────────────
export type SortOrder = 'asc' | 'desc';

export interface SortParams {
  sortBy?:    string;
  sortOrder?: SortOrder;
}

// ─── MongoDB ObjectId helper ──────────────────────────────────────
export type ObjectId = Types.ObjectId;

export const toObjectId = (id: string): Types.ObjectId =>
  new Types.ObjectId(id);

export const isValidObjectId = (id: string): boolean =>
  Types.ObjectId.isValid(id);

// ─── Email Options ────────────────────────────────────────────────
export interface EmailOptions {
  to:      string;
  subject: string;
  html:    string;
  text?:   string;
}

// ─── Socket Events ────────────────────────────────────────────────
export const SOCKET_EVENTS = {
  // Transcription
  TRANSCRIPTION_STARTED:   'transcription:started',
  TRANSCRIPTION_PROGRESS:  'transcription:progress',
  TRANSCRIPTION_COMPLETED: 'transcription:completed',
  TRANSCRIPTION_FAILED:    'transcription:failed',

  // Sync
  SYNC_STARTED:   'sync:started',
  SYNC_COMPLETED: 'sync:completed',
  SYNC_FAILED:    'sync:failed',

  // AI
  AI_PROCESSING_STARTED:   'ai:processing:started',
  AI_PROCESSING_COMPLETED: 'ai:processing:completed',
  AI_PROCESSING_FAILED:    'ai:processing:failed',

  // Connection
  JOIN_ROOM:  'room:join',
  LEAVE_ROOM: 'room:leave',
} as const;

export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];

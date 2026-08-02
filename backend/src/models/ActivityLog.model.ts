import mongoose, { Schema, type Document } from 'mongoose';

// ActivityAction as both type and value (enum-like object)
export const ActivityAction = {
  REGISTER:       'auth.register',
  LOGIN:          'auth.login',
  LOGOUT:         'auth.logout',
  PASSWORD_RESET: 'auth.password_reset',
  EMAIL_VERIFIED: 'auth.email_verified',
  RECORDING_CREATE:   'recording.create',
  RECORDING_DELETE:   'recording.delete',
  RECORDING_UPDATE:   'recording.update',
  RECORDING_UPLOAD:   'recording.upload',
  RECORDING_DOWNLOAD: 'recording.download',
  RECORDING_FAVORITE: 'recording.favorite',
  AI_TRANSCRIBE:  'ai.transcribe',
  AI_SUMMARIZE:   'ai.summarize',
  AI_TRANSLATE:   'ai.translate',
  AI_CHAT:        'ai.chat',
  FOLDER_CREATE:  'folder.create',
  FOLDER_DELETE:  'folder.delete',
  SETTINGS_UPDATE: 'settings.update',
  SUBSCRIPTION_UPGRADE: 'subscription.upgrade',
  SUBSCRIPTION_CANCEL:  'subscription.cancel',
} as const;

export type ActivityAction = typeof ActivityAction[keyof typeof ActivityAction];

export interface IActivityLog extends Document {
  _id:       mongoose.Types.ObjectId;
  userId:    mongoose.Types.ObjectId;
  action:    ActivityAction;
  metadata:  Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    action: {
      type:     String,
      required: true,
      index:    true,
    },
    metadata: {
      type:    Schema.Types.Mixed,
      default: {},
    },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
// TTL: auto-delete logs older than 90 days
activityLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 },
);

export const ActivityLog = mongoose.model<IActivityLog>(
  'ActivityLog',
  activityLogSchema,
);

// Alias for services that import ActivityLogModel
export { ActivityLog as ActivityLogModel };

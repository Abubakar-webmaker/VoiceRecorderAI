import mongoose, { type Document, Schema } from 'mongoose';

export enum ActivityAction {
  LOGIN                 = 'login',
  LOGOUT                = 'logout',
  REGISTER              = 'register',
  PASSWORD_RESET        = 'password_reset',
  PASSWORD_CHANGED      = 'password_changed',
  EMAIL_VERIFIED        = 'email_verified',
  RECORDING_CREATED     = 'recording_created',
  RECORDING_DELETED     = 'recording_deleted',
  RECORDING_SHARED      = 'recording_shared',
  AI_TRANSCRIPTION      = 'ai_transcription',
  AI_SUMMARY            = 'ai_summary',
  SUBSCRIPTION_UPGRADED = 'subscription_upgraded',
  PROFILE_UPDATED       = 'profile_updated',
}

export interface IActivityLog extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: ActivityAction;
  description: string;
  metadata: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: Object.values(ActivityAction),
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: 'Unknown',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// Compound indexes
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

// Auto-delete after 90 days
activityLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 },
);

export const ActivityLogModel = mongoose.model<IActivityLog>(
  'ActivityLog',
  activityLogSchema,
);
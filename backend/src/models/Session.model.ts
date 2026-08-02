import mongoose, { Schema, type Document } from 'mongoose';

export interface ISession extends Document {
  _id:        mongoose.Types.ObjectId;
  userId:     mongoose.Types.ObjectId;
  tokenId:    string;   // Matches JwtRefreshPayload.tokenId
  deviceName: string | null;
  deviceType: string | null;
  platform:   string | null;
  appVersion: string | null;
  ipAddress:  string | null;
  userAgent:  string | null;
  isActive:   boolean;
  lastSeenAt: Date;
  expiresAt:  Date;
  createdAt:  Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    tokenId: {
      type:     String,
      required: true,
      unique:   true,
      index:    true,
    },
    deviceName: { type: String, default: null },
    deviceType: { type: String, default: null },
    platform:   { type: String, default: null },
    appVersion: { type: String, default: null },
    ipAddress:  { type: String, default: null },
    userAgent:  { type: String, default: null },
    isActive: {
      type:    Boolean,
      default: true,
      index:   true,
    },
    lastSeenAt: {
      type:    Date,
      default: Date.now,
    },
    expiresAt: {
      type:  Date,
      index: { expireAfterSeconds: 0 }, // TTL auto-delete
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────
sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ userId: 1, lastSeenAt: -1 });

export const Session = mongoose.model<ISession>('Session', sessionSchema);

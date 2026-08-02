import mongoose, { Schema, type Document } from 'mongoose';

export interface IRefreshToken extends Document {
  _id:        mongoose.Types.ObjectId;
  userId:     mongoose.Types.ObjectId;
  tokenHash:  string;   // bcrypt hash of the actual token
  tokenId:    string;   // UUID — matches JwtRefreshPayload.tokenId
  deviceInfo: string | null;
  ipAddress:  string | null;
  userAgent:  string | null;
  isRevoked:  boolean;
  expiresAt:  Date;
  createdAt:  Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    tokenHash: {
      type:     String,
      required: true,
      index:    true,
    },
    tokenId: {
      type:     String,
      required: true,
      unique:   true,
      index:    true,
    },
    deviceInfo: { type: String, default: null },
    ipAddress:  { type: String, default: null },
    userAgent:  { type: String, default: null },
    isRevoked: {
      type:    Boolean,
      default: false,
      index:   true,
    },
    expiresAt: {
      type:     Date,
      required: true,
      index:    { expireAfterSeconds: 0 }, // MongoDB TTL — auto-delete on expiry
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

// ─── Compound Indexes ─────────────────────────────────────────────
refreshTokenSchema.index({ userId: 1, isRevoked: 1 });
refreshTokenSchema.index({ tokenId: 1, isRevoked: 1 });

export const RefreshToken = mongoose.model<IRefreshToken>(
  'RefreshToken',
  refreshTokenSchema,
);

// Alias for services that import RefreshTokenModel
export { RefreshToken as RefreshTokenModel };

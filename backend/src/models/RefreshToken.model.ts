import mongoose, { type Document, Schema } from 'mongoose';

export interface IRefreshToken extends Document {
  _id: mongoose.Types.ObjectId;
  token: string;          // Hashed token
  userId: mongoose.Types.ObjectId;
  ipAddress?: string;
  userAgent?: string;
  isRevoked: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      // MongoDB TTL index — auto-delete expired tokens
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true },
);

// Compound index for fast lookup
refreshTokenSchema.index({ token: 1, isRevoked: 1 });
refreshTokenSchema.index({ userId: 1, isRevoked: 1 });

export const RefreshTokenModel = mongoose.model<IRefreshToken>(
  'RefreshToken',
  refreshTokenSchema,
);
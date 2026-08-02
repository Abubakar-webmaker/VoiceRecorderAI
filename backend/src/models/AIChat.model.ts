import mongoose, { Schema, type Document } from 'mongoose';

export type ChatRole = 'user' | 'assistant' | 'system';

export interface IChatMessage {
  role:      ChatRole;
  content:   string;
  timestamp: Date;
  tokens?:   number;
}

export interface IAIChat extends Document {
  _id:         mongoose.Types.ObjectId;
  recordingId: mongoose.Types.ObjectId;
  userId:      mongoose.Types.ObjectId;
  title:       string;
  messages:    IChatMessage[];
  totalTokens: number;
  isActive:    boolean;
  createdAt:   Date;
  updatedAt:   Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    role: {
      type:     String,
      enum:     ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type:     String,
      required: true,
      maxlength: [10_000, 'Message too long'],
    },
    timestamp: { type: Date, default: Date.now },
    tokens:    { type: Number, default: 0 },
  },
  { _id: false },
);

const aiChatSchema = new Schema<IAIChat>(
  {
    recordingId: {
      type:     Schema.Types.ObjectId,
      ref:      'Recording',
      required: true,
      index:    true,
    },
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    title: {
      type:    String,
      default: 'New Chat',
      trim:    true,
      maxlength: [200, 'Chat title too long'],
    },
    messages: {
      type:    [chatMessageSchema],
      default: [],
    },
    totalTokens: { type: Number, default: 0 },
    isActive:    { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────
aiChatSchema.index({ userId: 1, recordingId: 1 });
aiChatSchema.index({ userId: 1, createdAt: -1 });

export const AIChat = mongoose.model<IAIChat>('AIChat', aiChatSchema);

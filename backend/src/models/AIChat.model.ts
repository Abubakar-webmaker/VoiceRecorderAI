import mongoose, { Schema, type Document } from 'mongoose';

// ─── ChatRole as runtime enum (used as value in ai.service.ts) ────
export enum ChatRole {
  USER      = 'user',
  ASSISTANT = 'assistant',
  SYSTEM    = 'system',
}

export interface IChatMessage {
  _id:        mongoose.Types.ObjectId;
  role:       ChatRole;
  content:    string;
  tokensUsed: number;
  createdAt:  Date;
}

export interface IAIChat extends Document {
  _id:         mongoose.Types.ObjectId;
  recordingId: mongoose.Types.ObjectId;
  userId:      mongoose.Types.ObjectId;
  title:       string;
  model:       string;
  messages:    IChatMessage[];
  totalTokens: number;
  totalCost:   number;
  isActive:    boolean;
  createdAt:   Date;
  updatedAt:   Date;
}

// ─── Schemas ──────────────────────────────────────────────────────

const chatMessageSchema = new Schema<IChatMessage>(
  {
    role: {
      type:     String,
      enum:     Object.values(ChatRole),
      required: true,
    },
    content: {
      type:      String,
      required:  true,
      maxlength: [10_000, 'Message too long'],
    },
    tokensUsed: { type: Number, default: 0 },
    createdAt:  { type: Date, default: Date.now },
  },
  { _id: true },
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
      type:      String,
      default:   'New Chat',
      trim:      true,
      maxlength: [200, 'Chat title too long'],
    },
    model:       { type: String, default: 'gpt-4o' },
    messages:    { type: [chatMessageSchema], default: [] },
    totalTokens: { type: Number, default: 0 },
    totalCost:   { type: Number, default: 0 },
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
export { AIChat as AIChatModel };

import mongoose, { type Document, Schema } from 'mongoose';

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
  messages:    IChatMessage[];
  model:       string;
  totalTokens: number;
  totalCost:   number;
  isActive:    boolean;
  createdAt:   Date;
  updatedAt:   Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    role:       { type: String, enum: Object.values(ChatRole), required: true },
    content:    { type: String, required: true, trim: true },
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
    },
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    title: {
      type:      String,
      default:   'New Chat',
      maxlength: 100,
      trim:      true,
    },
    messages: {
      type:     [chatMessageSchema],
      default:  [],
      validate: {
        validator: (msgs: IChatMessage[]) => msgs.length <= 200,
        message:   'Chat history cannot exceed 200 messages',
      },
    },
    model:       { type: String, default: 'gpt-4o' },
    totalTokens: { type: Number, default: 0 },
    totalCost:   { type: Number, default: 0 },
    isActive:    { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  },
);

aiChatSchema.index({ recordingId: 1, userId: 1 });
aiChatSchema.index({ userId: 1, createdAt: -1 });

export const AIChatModel = mongoose.model<IAIChat>('AIChat', aiChatSchema);
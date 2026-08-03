import mongoose, { Schema, type Document } from 'mongoose';

// ─── Enums ────────────────────────────────────────────────────────
export enum FolderIcon {
  FOLDER    = 'folder',
  MUSIC     = 'music',
  MIC       = 'mic',
  STAR      = 'star',
  HEART     = 'heart',
  BRIEFCASE = 'briefcase',
  BOOK      = 'book',
  CAMERA    = 'camera',
  CHAT      = 'chat',
  CODE      = 'code',
}

export const FolderColor = {
  DEFAULT: '#6366F1',
  RED:     '#EF4444',
  ORANGE:  '#F97316',
  YELLOW:  '#EAB308',
  GREEN:   '#22C55E',
  TEAL:    '#14B8A6',
  BLUE:    '#3B82F6',
  PURPLE:  '#A855F7',
  PINK:    '#EC4899',
  GRAY:    '#6B7280',
} as const;

export type FolderColorValue = typeof FolderColor[keyof typeof FolderColor];

// ─── Interface ────────────────────────────────────────────────────
export interface IFolder extends Document {
  _id:            mongoose.Types.ObjectId;
  userId:         mongoose.Types.ObjectId;
  parentId:       mongoose.Types.ObjectId | null;
  name:           string;
  description:    string;
  color:          string;
  icon:           FolderIcon;
  isPinned:       boolean;
  isDefault:      boolean;
  depth:          number;
  path:           string;
  recordingCount: number;
  totalSize:      number;
  createdAt:      Date;
  updatedAt:      Date;
}

// ─── Schema ───────────────────────────────────────────────────────
const folderSchema = new Schema<IFolder>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    parentId: {
      type:    Schema.Types.ObjectId,
      ref:     'Folder',
      default: null,
      index:   true,
    },
    name: {
      type:      String,
      required:  [true, 'Folder name is required'],
      trim:      true,
      minlength: [1, 'Folder name cannot be empty'],
      maxlength: [100, 'Folder name cannot exceed 100 characters'],
    },
    description: { type: String, default: '', trim: true },
    color: {
      type:    String,
      default: FolderColor.DEFAULT,
      match:   [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color'],
    },
    icon: {
      type:    String,
      enum:    Object.values(FolderIcon),
      default: FolderIcon.FOLDER,
    },
    isPinned:       { type: Boolean, default: false },
    isDefault:      { type: Boolean, default: false },
    depth:          { type: Number, default: 0, min: 0, max: 3 },
    path:           { type: String, default: '' },
    recordingCount: { type: Number, default: 0 },
    totalSize:      { type: Number, default: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────
folderSchema.index({ userId: 1, name: 1, parentId: 1 }, { unique: true });
folderSchema.index({ userId: 1, createdAt: -1 });
folderSchema.index({ userId: 1, isPinned: 1 });

export const Folder = mongoose.model<IFolder>('Folder', folderSchema);
export { Folder as FolderModel };

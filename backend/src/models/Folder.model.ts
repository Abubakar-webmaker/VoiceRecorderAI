import mongoose, { type Document, type Model, Schema } from 'mongoose';

// ─── Enums ────────────────────────────────────────────────────────
export enum FolderColor {
  DEFAULT = '#6C63FF',
  RED     = '#FF6584',
  BLUE    = '#4ECDC4',
  GREEN   = '#52C41A',
  YELLOW  = '#FAAD14',
  PURPLE  = '#722ED1',
  PINK    = '#EB2F96',
  ORANGE  = '#FA541C',
}

export enum FolderIcon {
  FOLDER    = 'folder',
  WORK      = 'briefcase',
  PERSONAL  = 'person',
  SCHOOL    = 'school',
  MUSIC     = 'musical-notes',
  STAR      = 'star',
  HEART     = 'heart',
  BOOKMARK  = 'bookmark',
}

// ─── Interface ────────────────────────────────────────────────────
export interface IFolder extends Document {
  _id:             mongoose.Types.ObjectId;
  userId:          mongoose.Types.ObjectId;
  parentId:        mongoose.Types.ObjectId | null;  // Nested folders
  name:            string;
  description:     string;
  color:           string;
  icon:            string;
  isDefault:       boolean;     // "All Recordings" default folder
  isPinned:        boolean;
  recordingCount:  number;
  totalSize:       number;       // bytes
  path:            string;       // /parent/child — breadcrumb ke liye
  depth:           number;       // Nesting level (max 3)
  createdAt:       Date;
  updatedAt:       Date;
}

interface IFolderModel extends Model<IFolder> {
  findByUser(userId: string): Promise<IFolder[]>;
}

// ─── Schema ───────────────────────────────────────────────────────
const folderSchema = new Schema<IFolder, IFolderModel>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    parentId: {
      type:    Schema.Types.ObjectId,
      ref:     'Folder',
      default: null,
    },
    name: {
      type:      String,
      required:  [true, 'Folder name is required'],
      trim:      true,
      minlength: [1,  'Folder name cannot be empty'],
      maxlength: [50, 'Folder name cannot exceed 50 characters'],
    },
    description: {
      type:      String,
      default:   '',
      maxlength: [200, 'Description cannot exceed 200 characters'],
      trim:      true,
    },
    color: {
      type:    String,
      default: FolderColor.DEFAULT,
      match:   [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color hex code'],
    },
    icon: {
      type:    String,
      enum:    Object.values(FolderIcon),
      default: FolderIcon.FOLDER,
    },
    isDefault: {
      type:    Boolean,
      default: false,
    },
    isPinned: {
      type:    Boolean,
      default: false,
    },
    recordingCount: {
      type:    Number,
      default: 0,
      min:     0,
    },
    totalSize: {
      type:    Number,
      default: 0,
      min:     0,
    },
    path: {
      type:    String,
      default: '',
    },
    depth: {
      type:    Number,
      default: 0,
      min:     0,
      max:     [3, 'Maximum folder nesting depth is 3'],
    },
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

// ─── Indexes ──────────────────────────────────────────────────────
folderSchema.index({ userId: 1, name: 1 },            { unique: true });
folderSchema.index({ userId: 1, parentId: 1 });
folderSchema.index({ userId: 1, isPinned: -1 });
folderSchema.index({ userId: 1, isDefault: 1 });

// ─── Static Methods ───────────────────────────────────────────────
folderSchema.static(
  'findByUser',
  function (userId: string): Promise<IFolder[]> {
    return this.find({ userId })
      .sort({ isPinned: -1, isDefault: -1, name: 1 })
      .lean();
  },
);

export const FolderModel = mongoose.model<IFolder, IFolderModel>(
  'Folder',
  folderSchema,
);
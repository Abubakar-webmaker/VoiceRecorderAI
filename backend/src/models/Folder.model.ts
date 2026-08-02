import mongoose, { Schema, type Document } from 'mongoose';

export interface IFolder extends Document {
  _id:       mongoose.Types.ObjectId;
  userId:    mongoose.Types.ObjectId;
  name:      string;
  color:     string;
  icon:      string;
  createdAt: Date;
  updatedAt: Date;
}

const folderSchema = new Schema<IFolder>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    name: {
      type:      String,
      required:  [true, 'Folder name is required'],
      trim:      true,
      minlength: [1, 'Folder name cannot be empty'],
      maxlength: [100, 'Folder name cannot exceed 100 characters'],
    },
    color: {
      type:    String,
      default: '#6366F1',
      match:   [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color'],
    },
    icon: {
      type:    String,
      default: 'folder',
      trim:    true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────
folderSchema.index({ userId: 1, name: 1 }, { unique: true }); // No duplicate folder names per user
folderSchema.index({ userId: 1, createdAt: -1 });

export const Folder = mongoose.model<IFolder>('Folder', folderSchema);

// Alias for services that import FolderModel
export { Folder as FolderModel };

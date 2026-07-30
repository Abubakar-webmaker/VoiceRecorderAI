import mongoose            from 'mongoose';
import { FolderModel }     from '@models/Folder.model';
import { RecordingModel }  from '@models/Recording.model';
import { ApiError }        from '@utils/ApiError';
import type {
  CreateFolderInput,
  UpdateFolderInput,
  MoveFolderInput,
} from '@validators/folder.validator';
import type { IFolder } from '@models/Folder.model';

// ─── Create Folder ────────────────────────────────────────────────
export const createFolder = async (
  userId: string,
  data:   CreateFolderInput,
): Promise<IFolder> => {
  const { name, parentId, ...rest } = data;

  // Duplicate name check (same parent level)
  const existing = await FolderModel.findOne({
    userId,
    name,
    parentId: parentId ?? null,
  });

  if (existing) {
    throw ApiError.conflict(
      `A folder named "${name}" already exists ${parentId ? 'in this location' : 'at root level'}.`,
    );
  }

  let depth = 0;
  let path  = name;

  // Parent check + depth calculate karo
  if (parentId) {
    const parent = await FolderModel.findOne({
      _id:    parentId,
      userId,
    });

    if (!parent) {
      throw ApiError.notFound('Parent folder not found.');
    }

    if (parent.depth >= 3) {
      throw ApiError.badRequest(
        'Maximum folder nesting depth (3 levels) reached.',
      );
    }

    depth = parent.depth + 1;
    path  = `${parent.path}/${name}`;
  }

  const folder = await FolderModel.create({
    userId,
    name,
    parentId: parentId ?? null,
    depth,
    path,
    ...rest,
  });

  return folder;
};

// ─── Get All Folders ──────────────────────────────────────────────
export const getUserFolders = async (userId: string): Promise<IFolder[]> => {
  return FolderModel.findByUser(userId);
};

// ─── Get Folder By ID ─────────────────────────────────────────────
export const getFolderById = async (
  folderId: string,
  userId:   string,
): Promise<IFolder> => {
  const folder = await FolderModel.findOne({
    _id:    folderId,
    userId,
  });

  if (!folder) {
    throw ApiError.notFound('Folder not found.');
  }

  return folder;
};

// ─── Get Folder With Recordings ───────────────────────────────────
export const getFolderWithRecordings = async (
  folderId: string,
  userId:   string,
  page:     number,
  limit:    number,
): Promise<{
  folder:     IFolder;
  recordings: Awaited<ReturnType<typeof RecordingModel.findByUser>>['recordings'];
  total:      number;
}> => {
  const folder = await getFolderById(folderId, userId);

  const { recordings, total } = await RecordingModel.findByUser(userId, {
    folderId,
    page,
    limit,
    sortBy:    'createdAt',
    sortOrder: 'desc',
  });

  return { folder, recordings, total };
};

// ─── Update Folder ────────────────────────────────────────────────
export const updateFolder = async (
  folderId: string,
  userId:   string,
  data:     UpdateFolderInput,
): Promise<IFolder> => {
  const folder = await FolderModel.findOne({ _id: folderId, userId });

  if (!folder) throw ApiError.notFound('Folder not found.');

  if (folder.isDefault) {
    throw ApiError.forbidden('Default folders cannot be modified.');
  }

  // Name change pe duplicate check
  if (data.name && data.name !== folder.name) {
    const duplicate = await FolderModel.findOne({
      userId,
      name:     data.name,
      parentId: folder.parentId,
      _id:      { $ne: folder._id },
    });

    if (duplicate) {
      throw ApiError.conflict(
        `A folder named "${data.name}" already exists in this location.`,
      );
    }
  }

  Object.assign(folder, data);
  await folder.save();
  return folder;
};

// ─── Move Folder ──────────────────────────────────────────────────
export const moveFolder = async (
  folderId: string,
  userId:   string,
  data:     MoveFolderInput,
): Promise<IFolder> => {
  const folder = await FolderModel.findOne({ _id: folderId, userId });
  if (!folder) throw ApiError.notFound('Folder not found.');

  if (folder.isDefault) {
    throw ApiError.forbidden('Default folders cannot be moved.');
  }

  const newParentId = data.parentId;

  // Apne andar move nahi kar sakte
  if (newParentId === folderId) {
    throw ApiError.badRequest('A folder cannot be moved into itself.');
  }

  let newDepth = 0;
  let newPath  = folder.name;

  if (newParentId) {
    const newParent = await FolderModel.findOne({
      _id:    newParentId,
      userId,
    });

    if (!newParent) throw ApiError.notFound('Target parent folder not found.');

    if (newParent.depth >= 3) {
      throw ApiError.badRequest('Cannot move here — maximum nesting depth reached.');
    }

    // Circular reference check
    if (newParent.path.startsWith(`${folder.path}/`)) {
      throw ApiError.badRequest(
        'Cannot move a folder into one of its own subfolders.',
      );
    }

    newDepth = newParent.depth + 1;
    newPath  = `${newParent.path}/${folder.name}`;
  }

  folder.parentId = newParentId
    ? new mongoose.Types.ObjectId(newParentId)
    : null;
  folder.depth = newDepth;
  folder.path  = newPath;

  await folder.save();
  return folder;
};

// ─── Delete Folder ────────────────────────────────────────────────
export const deleteFolder = async (
  folderId: string,
  userId:   string,
  moveToRoot = true, // Recordings ko root mein move karo
): Promise<void> => {
  const folder = await FolderModel.findOne({ _id: folderId, userId });
  if (!folder) throw ApiError.notFound('Folder not found.');

  if (folder.isDefault) {
    throw ApiError.forbidden('Default folders cannot be deleted.');
  }

  // Child folders bhi delete karo
  const childFolders = await FolderModel.find({ userId, path: new RegExp(`^${folder.path}/`) });
  const childIds = childFolders.map((f) => f._id);
  const allFolderIds = [folder._id, ...childIds];

  if (moveToRoot) {
    // Recordings ko root mein move karo
    await RecordingModel.updateMany(
      { userId, folderId: { $in: allFolderIds } },
      { $set: { folderId: null } },
    );
  } else {
    // Recordings bhi delete karo
    const recordings = await RecordingModel.find({
      userId,
      folderId: { $in: allFolderIds },
    }).select('cloud.publicId');

    // Cloud se delete karo
    const { bulkDeleteFromCloud } = await import('./storage.service');
    const publicIds = recordings
      .map((r) => r.cloud.publicId)
      .filter(Boolean);

    if (publicIds.length > 0) {
      await bulkDeleteFromCloud(publicIds);
    }

    await RecordingModel.deleteMany({
      userId,
      folderId: { $in: allFolderIds },
    });
  }

  // Saare folders delete karo
  await FolderModel.deleteMany({ _id: { $in: allFolderIds } });
};

// ─── Sync Folder Stats ────────────────────────────────────────────
export const syncFolderStats = async (
  folderId: string,
): Promise<void> => {
  const [countResult] = await RecordingModel.aggregate<{
    count: number;
    totalSize: number;
  }>([
    { $match: { folderId: new mongoose.Types.ObjectId(folderId) } },
    {
      $group: {
        _id:       null,
        count:     { $sum: 1 },
        totalSize: { $sum: '$fileSize' },
      },
    },
  ]);

  await FolderModel.findByIdAndUpdate(folderId, {
    recordingCount: countResult?.count     ?? 0,
    totalSize:      countResult?.totalSize ?? 0,
  });
};
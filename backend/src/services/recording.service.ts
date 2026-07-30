import mongoose            from 'mongoose';
import crypto              from 'crypto';
import { RecordingModel, RecordingStatus }  from '@models/Recording.model';
import { UserModel }       from '@models/User.model';
import { FolderModel }     from '@models/Folder.model';
import {
  uploadAudioToCloud,
  deleteAudioFromCloud,
  bulkDeleteFromCloud,
  generateSignedUrl,
} from './storage.service';
import { syncFolderStats } from './folder.service';
import { ApiError }        from '@utils/ApiError';
import { logger }          from '@utils/logger';
import type {
  CreateRecordingInput,
  UpdateRecordingInput,
  MoveRecordingInput,
  RecordingQuery,
  SearchQuery,
  BulkDeleteInput,
} from '@validators/recording.validator';
import type { IRecording } from '@models/Recording.model';

// ─── Upload Recording ─────────────────────────────────────────────
export const uploadRecording = async (
  userId:     string,
  file:       Express.Multer.File,
  data:       CreateRecordingInput,
): Promise<IRecording> => {
  // 1. User storage limit check
  const user = await UserModel.findById(userId).select(
    'storageUsed storageLimit',
  );

  if (!user) throw ApiError.notFound('User not found.');

  if (user.storageUsed + file.size > user.storageLimit) {
    throw ApiError.badRequest(
      `Storage limit exceeded. Available: ${formatBytes(user.storageLimit - user.storageUsed)}. File size: ${formatBytes(file.size)}.`,
    );
  }

  // 2. Folder ownership verify karo
  if (data.folderId) {
    const folder = await FolderModel.findOne({
      _id:    data.folderId,
      userId,
    });
    if (!folder) {
      throw ApiError.notFound('Target folder not found.');
    }
  }

  // 3. Recording document create karo (PENDING status)
  const recording = await RecordingModel.create({
    userId,
    title:      data.title,
    description: data.description,
    folderId:   data.folderId ?? null,
    duration:   data.duration,
    fileSize:   file.size,
    format:     data.format,
    quality:    data.quality,
    sampleRate: data.sampleRate,
    channels:   data.channels,
    bitrate:    data.bitrate,
    tags:       data.tags,
    waveform:   data.waveform,
    recordedAt: data.recordedAt ? new Date(data.recordedAt) : new Date(),
    status:     RecordingStatus.UPLOADING,
    'ai.language': data.language,
  });

  try {
    // 4. Cloudinary pe upload karo
    const cloudResult = await uploadAudioToCloud(file.buffer, {
      userId,
      recordingId: recording._id.toString(),
      format:      data.format,
      filename:    data.title,
    });

    // 5. Recording update karo cloud info ke saath
    recording.cloud = {
      publicId:    cloudResult.publicId,
      url:         cloudResult.url,
      secureUrl:   cloudResult.secureUrl,
      format:      cloudResult.format,
      resourceType: cloudResult.resourceType,
      bytes:       cloudResult.bytes,
      duration:    cloudResult.duration || data.duration,
    };
    recording.status = RecordingStatus.READY;
    await recording.save();

    // 6. User storage update karo
    await UserModel.findByIdAndUpdate(userId, {
      $inc: { storageUsed: file.size },
    });

    // 7. Folder stats sync karo
    if (data.folderId) {
      await syncFolderStats(data.folderId);
    }

    logger.info(`Recording uploaded: ${recording._id.toString()} by user ${userId}`);
    return recording;
  } catch (error) {
    // Upload fail — document mark karo aur re-throw
    recording.status = RecordingStatus.FAILED;
    await recording.save();
    logger.error(`Recording upload failed for ${recording._id.toString()}:`, error);
    throw ApiError.internal(
      'Failed to upload recording to cloud storage. Please try again.',
    );
  }
};

// ─── Get All Recordings ───────────────────────────────────────────
export const getRecordings = async (
  userId: string,
  query:  RecordingQuery,
): Promise<{
  recordings: IRecording[];
  pagination: {
    currentPage:  number;
    totalPages:   number;
    totalItems:   number;
    itemsPerPage: number;
    hasNextPage:  boolean;
    hasPrevPage:  boolean;
  };
}> => {
  const page     = Math.max(1, parseInt(query.page  ?? '1',  10));
  const limit    = Math.min(50, parseInt(query.limit ?? '20', 10));

  const filter: Record<string, unknown> = {
    userId,
    status: { $ne: RecordingStatus.FAILED },
  };

  if (query.folderId !== undefined) {
    filter['folderId'] = query.folderId === 'null' ? null : query.folderId;
  }

  if (query.isFavorite === 'true') {
    filter['isFavorite'] = true;
  }

  if (query.tags) {
    filter['tags'] = { $in: query.tags.split(',').map((t) => t.trim()) };
  }

  const skip      = (page - 1) * limit;
  const sortDir   = query.sortOrder === 'asc' ? 1 : -1;
  const sortField = query.sortBy ?? 'createdAt';

  const [recordings, total] = await Promise.all([
    RecordingModel.find(filter)
      .sort({ [sortField]: sortDir })
      .skip(skip)
      .limit(limit)
      .select('-waveform -__v')
      .lean(),
    RecordingModel.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    recordings: recordings as IRecording[],
    pagination: {
      currentPage:  page,
      totalPages,
      totalItems:   total,
      itemsPerPage: limit,
      hasNextPage:  page < totalPages,
      hasPrevPage:  page > 1,
    },
  };
};

// ─── Get Single Recording ─────────────────────────────────────────
export const getRecordingById = async (
  recordingId: string,
  userId:      string,
): Promise<IRecording> => {
  const recording = await RecordingModel.findOne({
    _id:    recordingId,
    userId,
  }).populate('folderId', 'name color icon');

  if (!recording) {
    throw ApiError.notFound('Recording not found.');
  }

  return recording;
};

// ─── Get Recording Waveform ───────────────────────────────────────
export const getRecordingWaveform = async (
  recordingId: string,
  userId:      string,
): Promise<number[]> => {
  const recording = await RecordingModel.findOne(
    { _id: recordingId, userId },
    { waveform: 1 },
  );

  if (!recording) throw ApiError.notFound('Recording not found.');
  return recording.waveform ?? [];
};

// ─── Update Recording ─────────────────────────────────────────────
export const updateRecording = async (
  recordingId: string,
  userId:      string,
  data:        UpdateRecordingInput,
): Promise<IRecording> => {
  const recording = await RecordingModel.findOne({
    _id:    recordingId,
    userId,
  });

  if (!recording) throw ApiError.notFound('Recording not found.');

  // Folder change pe verify karo
  if (data.folderId !== undefined && data.folderId !== null) {
    const folder = await FolderModel.findOne({ _id: data.folderId, userId });
    if (!folder) throw ApiError.notFound('Target folder not found.');
  }

  const oldFolderId = recording.folderId?.toString();

  Object.assign(recording, {
    ...data,
    folderId: data.folderId !== undefined ? (data.folderId ?? null) : recording.folderId,
  });

  await recording.save();

  // Old aur new folder ka stats sync karo
  if (oldFolderId && oldFolderId !== data.folderId) {
    await syncFolderStats(oldFolderId);
  }
  if (data.folderId) {
    await syncFolderStats(data.folderId);
  }

  return recording;
};

// ─── Toggle Favorite ──────────────────────────────────────────────
export const toggleFavorite = async (
  recordingId: string,
  userId:      string,
): Promise<{ isFavorite: boolean }> => {
  const recording = await RecordingModel.findOne({
    _id:    recordingId,
    userId,
  }).select('isFavorite');

  if (!recording) throw ApiError.notFound('Recording not found.');

  recording.isFavorite = !recording.isFavorite;
  await recording.save();

  return { isFavorite: recording.isFavorite };
};

// ─── Move to Folder ───────────────────────────────────────────────
export const moveRecording = async (
  recordingId: string,
  userId:      string,
  data:        MoveRecordingInput,
): Promise<IRecording> => {
  const recording = await RecordingModel.findOne({ _id: recordingId, userId });
  if (!recording) throw ApiError.notFound('Recording not found.');

  if (data.folderId) {
    const folder = await FolderModel.findOne({ _id: data.folderId, userId });
    if (!folder) throw ApiError.notFound('Target folder not found.');
  }

  const oldFolderId = recording.folderId?.toString();
  recording.folderId = data.folderId
    ? new mongoose.Types.ObjectId(data.folderId)
    : null;

  await recording.save();

  // Folder stats update
  if (oldFolderId)   await syncFolderStats(oldFolderId);
  if (data.folderId) await syncFolderStats(data.folderId);

  return recording;
};

// ─── Increment Play Count ─────────────────────────────────────────
export const incrementPlayCount = async (
  recordingId: string,
  userId:      string,
): Promise<void> => {
  await RecordingModel.findOneAndUpdate(
    { _id: recordingId, userId },
    {
      $inc: { playCount: 1 },
      $set: { lastPlayedAt: new Date() },
    },
  );
};

// ─── Get Download URL ─────────────────────────────────────────────
export const getDownloadUrl = async (
  recordingId: string,
  userId:      string,
): Promise<{ url: string; filename: string; expiresIn: number }> => {
  const recording = await RecordingModel.findOne(
    { _id: recordingId, userId },
    { title: 1, format: 1, 'cloud.publicId': 1, 'cloud.secureUrl': 1 },
  );

  if (!recording) throw ApiError.notFound('Recording not found.');

  if (!recording.cloud.publicId) {
    throw ApiError.badRequest(
      'This recording is not yet available for download.',
    );
  }

  // Signed URL — 1 hour valid
  const signedUrl = generateSignedUrl(recording.cloud.publicId, 3600);
  const filename  = `${recording.title.replace(/[^a-zA-Z0-9]/g, '_')}.${recording.format}`;

  return {
    url:      signedUrl,
    filename,
    expiresIn: 3600,
  };
};

// ─── Delete Recording ─────────────────────────────────────────────
export const deleteRecording = async (
  recordingId: string,
  userId:      string,
): Promise<void> => {
  const recording = await RecordingModel.findOne({ _id: recordingId, userId });
  if (!recording) throw ApiError.notFound('Recording not found.');

  const { publicId } = recording.cloud;
  const folderId     = recording.folderId?.toString();
  const fileSize     = recording.fileSize;

  // DB se delete karo
  await RecordingModel.findByIdAndDelete(recordingId);

  // Cloud se delete karo (async — app block na ho)
  if (publicId) {
    deleteAudioFromCloud(publicId).catch((err: unknown) => {
      logger.error(`Failed to delete cloud asset: ${publicId}`, err);
    });
  }

  // User storage free karo
  await UserModel.findByIdAndUpdate(userId, {
    $inc: { storageUsed: -Math.max(0, fileSize) },
  });

  // Folder stats update karo
  if (folderId) await syncFolderStats(folderId);
};

// ─── Bulk Delete ──────────────────────────────────────────────────
export const bulkDeleteRecordings = async (
  userId: string,
  data:   BulkDeleteInput,
): Promise<{ deleted: number; failed: number }> => {
  const { recordingIds } = data;

  const recordings = await RecordingModel.find({
    _id:    { $in: recordingIds },
    userId,
  }).select('_id cloud.publicId fileSize folderId');

  if (recordings.length === 0) {
    throw ApiError.notFound('No recordings found to delete.');
  }

  const publicIds  = recordings.map((r) => r.cloud.publicId).filter(Boolean);
  const totalSize  = recordings.reduce((sum, r) => sum + r.fileSize, 0);
  const folderIds  = [...new Set(
    recordings.map((r) => r.folderId?.toString()).filter(Boolean) as string[],
  )];

  // DB delete
  const result = await RecordingModel.deleteMany({
    _id:    { $in: recordings.map((r) => r._id) },
    userId,
  });

  // Cloud delete (async)
  if (publicIds.length > 0) {
    bulkDeleteFromCloud(publicIds).catch((err: unknown) => {
      logger.error('Bulk cloud delete failed:', err);
    });
  }

  // User storage free karo
  if (totalSize > 0) {
    await UserModel.findByIdAndUpdate(userId, {
      $inc: { storageUsed: -totalSize },
    });
  }

  // Folders sync karo
  await Promise.all(folderIds.map(syncFolderStats));

  return {
    deleted: result.deletedCount,
    failed:  recordingIds.length - result.deletedCount,
  };
};

// ─── Search Recordings ────────────────────────────────────────────
export const searchRecordings = async (
  userId: string,
  query:  SearchQuery,
): Promise<{
  recordings: IRecording[];
  total:      number;
}> => {
  const page  = Math.max(1, parseInt(query.page  ?? '1',  10));
  const limit = Math.min(50, parseInt(query.limit ?? '20', 10));
  const skip  = (page - 1) * limit;

  const searchFilter = {
    userId,
    status: { $ne: RecordingStatus.FAILED },
    $text:  { $search: query.q },
  };

  const [recordings, total] = await Promise.all([
    RecordingModel.find(searchFilter, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limit)
      .select('-waveform -__v')
      .lean(),
    RecordingModel.countDocuments(searchFilter),
  ]);

  return { recordings: recordings as IRecording[], total };
};

// ─── Get Favorites ────────────────────────────────────────────────
export const getFavoriteRecordings = async (
  userId: string,
  page:   number,
  limit:  number,
): Promise<{ recordings: IRecording[]; total: number }> => {
  const skip = (page - 1) * limit;

  const filter = { userId, isFavorite: true, status: { $ne: RecordingStatus.FAILED } };

  const [recordings, total] = await Promise.all([
    RecordingModel.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-waveform -__v')
      .lean(),
    RecordingModel.countDocuments(filter),
  ]);

  return { recordings: recordings as IRecording[], total };
};

// ─── Generate Share Token ─────────────────────────────────────────
export const generateShareToken = async (
  recordingId: string,
  userId:      string,
  expiresInHours = 24,
): Promise<{ shareToken: string; shareUrl: string }> => {
  const recording = await RecordingModel.findOne({ _id: recordingId, userId });
  if (!recording) throw ApiError.notFound('Recording not found.');

  const shareToken = crypto.randomBytes(32).toString('hex');
  const expiresAt  = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

  recording.sharing.isShared   = true;
  recording.sharing.shareToken = shareToken;
  recording.sharing.expiresAt  = expiresAt;
  await recording.save();

  const shareUrl = `${process.env['CLIENT_URL'] ?? ''}/shared/${shareToken}`;

  return { shareToken, shareUrl };
};

// ─── Utility ──────────────────────────────────────────────────────
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
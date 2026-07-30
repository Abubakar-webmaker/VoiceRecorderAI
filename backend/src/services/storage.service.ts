import { cloudinary } from '@config/cloudinary';
import { ApiError }   from '@utils/ApiError';
import { logger }     from '@utils/logger';
import type { UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

// ─── Types ────────────────────────────────────────────────────────
export interface AudioUploadResult {
  publicId:    string;
  url:         string;
  secureUrl:   string;
  format:      string;
  bytes:       number;
  duration:    number;
  resourceType: string;
}

interface UploadOptions {
  userId:      string;
  recordingId: string;
  format:      string;
  filename:    string;
}

// ─── Buffer → Readable Stream ─────────────────────────────────────
const bufferToStream = (buffer: Buffer): Readable => {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
};

// ─── Audio Upload ─────────────────────────────────────────────────
export const uploadAudioToCloud = async (
  fileBuffer: Buffer,
  options:    UploadOptions,
): Promise<AudioUploadResult> => {
  try {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video', // Cloudinary audio = video resource
          public_id:     `${options.recordingId}`,
          folder:        `ai-voice-recorder/${options.userId}/recordings`,
          format:        options.format,
          overwrite:     true,
          use_filename:  true,
          unique_filename: false,
          tags:          [`user_${options.userId}`, 'audio', 'recording'],
          // Audio quality optimization
          audio_codec:   options.format === 'mp3' ? 'mp3' : undefined,
          bit_rate:      '128k',
        },
        (err, result) => {
          if (err || !result) {
            reject(err ?? new Error('Upload failed — no result returned'));
          } else {
            resolve(result);
          }
        },
      );

      bufferToStream(fileBuffer).pipe(uploadStream);
    });

    return {
      publicId:    result.public_id,
      url:         result.url,
      secureUrl:   result.secure_url,
      format:      result.format,
      bytes:       result.bytes,
      duration:    (result as { duration?: number }).duration ?? 0,
      resourceType: result.resource_type,
    };
  } catch (error) {
    logger.error('Cloudinary audio upload failed:', error);
    throw ApiError.internal(
      'Failed to upload audio to cloud storage. Please try again.',
    );
  }
};

// ─── Delete Audio ─────────────────────────────────────────────────
export const deleteAudioFromCloud = async (publicId: string): Promise<void> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'video',
      invalidate:    true, // CDN cache clear karo
    });

    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new Error(`Cloudinary delete failed: ${String(result.result)}`);
    }

    logger.info(`Cloudinary resource deleted: ${publicId}`);
  } catch (error) {
    // Delete fail hone pe app crash na kare — log karo
    logger.error(`Failed to delete Cloudinary resource: ${publicId}`, error);
  }
};

// ─── Bulk Delete ──────────────────────────────────────────────────
export const bulkDeleteFromCloud = async (publicIds: string[]): Promise<void> => {
  if (publicIds.length === 0) return;

  // Cloudinary max 100 delete per request allow karta hai
  const chunks = [];
  for (let i = 0; i < publicIds.length; i += 100) {
    chunks.push(publicIds.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    try {
      await cloudinary.api.delete_resources(chunk, {
        resource_type: 'video',
        invalidate:    true,
      });
    } catch (error) {
      logger.error('Bulk delete partial failure:', error);
    }
  }
};

// ─── Generate Signed URL (for private/secure downloads) ──────────
export const generateSignedUrl = (
  publicId:    string,
  expiresInSec = 3600, // 1 hour default
): string => {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSec;

  return cloudinary.url(publicId, {
    resource_type: 'video',
    secure:        true,
    sign_url:      true,
    expires_at:    expiresAt,
    type:          'authenticated',
  });
};

// ─── Avatar Upload ────────────────────────────────────────────────
export const uploadAvatarToCloud = async (
  fileBuffer: Buffer,
  userId:     string,
): Promise<{ url: string; publicId: string }> => {
  try {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          public_id:     `avatar`,
          folder:        `ai-voice-recorder/${userId}/avatar`,
          overwrite:     true,
          transformation: [
            { width: 300, height: 300, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (err, result) => {
          if (err || !result) reject(err ?? new Error('Avatar upload failed'));
          else resolve(result);
        },
      );
      bufferToStream(fileBuffer).pipe(uploadStream);
    });

    return {
      url:      result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    logger.error('Avatar upload failed:', error);
    throw ApiError.internal('Failed to upload profile picture. Please try again.');
  }
};

// ─── Get Resource Info ────────────────────────────────────────────
export const getCloudResourceInfo = async (
  publicId: string,
): Promise<{ duration: number; bytes: number } | null> => {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'video',
    });
    return {
      duration: (result as { duration?: number }).duration ?? 0,
      bytes:    (result as { bytes?: number }).bytes ?? 0,
    };
  } catch {
    return null;
  }
};
import { v2 as cloudinary } from 'cloudinary';
import { env }              from './env';
import { logger }           from '@utils/logger';

// Cloudinary configure karo
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key:    env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure:     true, // Always HTTPS
});

// Connection verify karo startup pe
export const verifyCloudinaryConnection = async (): Promise<void> => {
  try {
    const result = await cloudinary.api.ping();
    if (result.status === 'ok') {
      logger.info('✅ Cloudinary Connected Successfully');
    }
  } catch (error) {
    logger.error('❌ Cloudinary Connection Failed:', error);
    // Critical nahi — app still run kar sakti hai
  }
};

export { cloudinary };
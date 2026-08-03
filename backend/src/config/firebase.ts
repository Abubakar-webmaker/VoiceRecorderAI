import * as admin from 'firebase-admin';
import { env } from './env';
import { logger } from '@utils/logger';

const initializeFirebase = (): void => {
  try {
    if (admin.apps.length === 0) {
      // In production, use serviceAccountKey.json or environment variables
      // For now, initializing with project default if available
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      logger.info('Firebase Admin initialized successfully.');
    }
  } catch (error) {
    logger.error('Firebase Admin initialization failed:', error);
  }
};

export { admin, initializeFirebase };

import { admin } from '@config/firebase';
import { User } from '@models/User.model';
import { logger } from '@utils/logger';

export enum NotificationType {
  TRANSCRIPTION_COMPLETE = 'TRANSCRIPTION_COMPLETE',
  TRANSCRIPTION_FAILED   = 'TRANSCRIPTION_FAILED',
  AI_PROCESS_COMPLETE    = 'AI_PROCESS_COMPLETE',
  SYSTEM_ANNOUNCEMENT    = 'SYSTEM_ANNOUNCEMENT',
}

interface SendOptions {
  userId:  string;
  title:   string;
  body:    string;
  type:    NotificationType;
  data?:   Record<string, string>;
}

// ─── Send Push Notification ───────────────────────────────────────
export const sendPushNotification = async (
  options: SendOptions,
): Promise<void> => {
  try {
    const user = await User.findById(options.userId).select('fcmToken');

    if (!user?.fcmToken) {
      logger.debug(`Skipping notification: User ${options.userId} has no FCM token.`);
      return;
    }

    const message: admin.messaging.Message = {
      token: user.fcmToken,
      notification: {
        title: options.title,
        body:  options.body,
      },
      data: {
        ...options.data,
        type:      options.type,
        click_action: 'FLUTTER_NOTIFICATION_CLICK', // Legacy but still useful for some SDKs
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'default',
          sound:     'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    logger.info(`Push notification sent to User ${options.userId}: ${response}`);
  } catch (error) {
    logger.error(`Failed to send push notification to User ${options.userId}:`, error);
  }
};

// ─── Specific Notification Helpers ────────────────────────────────

export const notifyTranscriptionComplete = async (
  userId:      string,
  recordingId: string,
  title:       string,
): Promise<void> => {
  await sendPushNotification({
    userId,
    type:  NotificationType.TRANSCRIPTION_COMPLETE,
    title: 'Transcription Ready! 🎙️',
    body:  `Your recording "${title}" has been successfully transcribed.`,
    data:  { recordingId },
  });
};

export const notifyAIProcessComplete = async (
  userId:      string,
  recordingId: string,
  title:       string,
): Promise<void> => {
  await sendPushNotification({
    userId,
    type:  NotificationType.AI_PROCESS_COMPLETE,
    title: 'AI Analysis Finished ✨',
    body:  `Summary and action items for "${title}" are now available.`,
    data:  { recordingId },
  });
};

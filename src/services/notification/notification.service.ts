import notifee, {
  AndroidImportance,
  EventType,
  type Notification,
} from '@notifee/react-native';
import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  setBackgroundMessageHandler,
  requestPermission,
} from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { logger }   from '@utils/logger';

// ─── Channel IDs ──────────────────────────────────────────────────
export const CHANNEL = {
  DEFAULT: 'default',
  AI:      'ai_processing',
  UPLOAD:  'upload',
  SYNC:    'sync',
} as const;

// ─── Setup Notification Channels (Android) ────────────────────────
export const setupNotificationChannels = async (): Promise<void> => {
  if (Platform.OS !== 'android') return;

  await notifee.createChannels([
    {
      id:         CHANNEL.DEFAULT,
      name:       'General',
      importance: AndroidImportance.DEFAULT,
    },
    {
      id:          CHANNEL.AI,
      name:        'AI Processing',
      importance:  AndroidImportance.HIGH,
      description: 'Notifications for AI transcription and analysis',
    },
    {
      id:          CHANNEL.UPLOAD,
      name:        'Uploads',
      importance:  AndroidImportance.DEFAULT,
      description: 'Notifications for audio upload progress',
    },
    {
      id:          CHANNEL.SYNC,
      name:        'Sync',
      importance:  AndroidImportance.LOW,
      description: 'Cloud sync status notifications',
    },
  ]);
};

// ─── Request Permission ───────────────────────────────────────────
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const settings = await notifee.requestPermission();

    if (Platform.OS === 'android') {
      try {
        const status = await requestPermission(getMessaging(getApp()));
        const numericStatus = Number(status);
        return numericStatus === 1 || numericStatus === 2;
      } catch (err) {
        logger.warn('[Notification] Firebase messaging permission request skipped:', err);
      }
    }

    return Number(settings.authorizationStatus) >= 1;
  } catch (err) {
    logger.error('[Notification] Permission request failed:', err);
    return false;
  }
};

// ─── Get FCM Token ────────────────────────────────────────────────
export const getFCMToken = async (): Promise<string | null> => {
  try {
    const token = await getToken(getMessaging(getApp()));
    return token;
  } catch (err) {
    logger.warn('[Notification] Could not get FCM token:', err);
    return null;
  }
};

// ─── Display local notification ───────────────────────────────────
export const showLocalNotification = async (params: {
  title:    string;
  body:     string;
  channel?: string;
  data?:    Record<string, string>;
}): Promise<void> => {
  const { title, body, channel = CHANNEL.DEFAULT, data } = params;

  const notification: Notification = {
    title,
    body,
    data,
    android: {
      channelId:   channel,
      smallIcon:   'ic_launcher',
      importance:  AndroidImportance.DEFAULT,
      pressAction: { id: 'default' },
    },
    ios: {
      sound: 'default',
    },
  };

  await notifee.displayNotification(notification);
};

// ─── Transcription Complete ───────────────────────────────────────
export const notifyTranscriptionComplete = async (title: string): Promise<void> => {
  await showLocalNotification({
    title:   '✅ Transcription Complete',
    body:    `"${title}" has been transcribed successfully`,
    channel: CHANNEL.AI,
    data:    { type: 'transcription_complete', title },
  });
};

// ─── Upload Complete ──────────────────────────────────────────────
export const notifyUploadComplete = async (title: string): Promise<void> => {
  await showLocalNotification({
    title:   '☁️ Recording Saved',
    body:    `"${title}" has been uploaded to the cloud`,
    channel: CHANNEL.UPLOAD,
    data:    { type: 'upload_complete', title },
  });
};

// ─── Sync Complete ────────────────────────────────────────────────
export const notifySyncComplete = async (count: number): Promise<void> => {
  await showLocalNotification({
    title:   '🔄 Sync Complete',
    body:    `${count} recording${count !== 1 ? 's' : ''} synced to cloud`,
    channel: CHANNEL.SYNC,
    data:    { type: 'sync_complete', count: String(count) },
  });
};

// ─── Offline Queue Uploaded ───────────────────────────────────────
export const notifyOfflineUploaded = async (count: number): Promise<void> => {
  if (count === 0) return;
  await notifySyncComplete(count);
};

// ─── Handle Background Push ───────────────────────────────────────
export const setupBackgroundMessageHandler = (): void => {
  try {
    setBackgroundMessageHandler(getMessaging(getApp()), async (remoteMessage) => {
      logger.info('[Notification] Background message:', remoteMessage.data);
      return Promise.resolve();
    });
  } catch (err) {
    logger.error('[Notification] Failed to set background message handler:', err);
  }
};

// ─── Handle Foreground Push ───────────────────────────────────────
export const setupForegroundMessageHandler = (): (() => void) => {
  try {
    return onMessage(getMessaging(getApp()), async (remoteMessage) => {
      logger.info('[Notification] Foreground message:', remoteMessage.data);
      if (remoteMessage.notification) {
        await showLocalNotification({
          title: remoteMessage.notification.title ?? 'Notification',
          body:  remoteMessage.notification.body  ?? '',
          data:  remoteMessage.data as Record<string, string>,
        });
      }
    });
  } catch (err) {
    logger.error('[Notification] Failed to set foreground message handler:', err);
    return () => {};
  }
};

// ─── Handle Notification Press ────────────────────────────────────
export const setupNotificationPressHandler = (
  onPress: (data: Record<string, string>) => void,
): (() => void) => {
  return notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      const data = detail.notification?.data as Record<string, string> | undefined;
      if (data) onPress(data);
    }
  });
};

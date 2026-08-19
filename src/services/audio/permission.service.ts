import { Platform, Alert, Linking } from 'react-native';
import {
  request,
  check,
  PERMISSIONS,
  RESULTS,
  type PermissionStatus,
} from 'react-native-permissions';

export enum MicPermissionStatus {
  GRANTED  = 'granted',
  DENIED   = 'denied',
  BLOCKED  = 'blocked',
  UNKNOWN  = 'unknown',
}

// ─── Check mic permission ─────────────────────────────────────────
export const checkMicPermission = async (): Promise<MicPermissionStatus> => {
  try {
    const permission =
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.MICROPHONE
        : PERMISSIONS.ANDROID.RECORD_AUDIO;

    const result: PermissionStatus = await check(permission);

    switch (result) {
      case RESULTS.GRANTED:   return MicPermissionStatus.GRANTED;
      case RESULTS.DENIED:    return MicPermissionStatus.DENIED;
      case RESULTS.BLOCKED:   return MicPermissionStatus.BLOCKED;
      default:                return MicPermissionStatus.UNKNOWN;
    }
  } catch {
    return MicPermissionStatus.UNKNOWN;
  }
};

// ─── Request mic permission ───────────────────────────────────────
export const requestMicPermission = async (): Promise<MicPermissionStatus> => {
  try {
    const permission =
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.MICROPHONE
        : PERMISSIONS.ANDROID.RECORD_AUDIO;

    const result: PermissionStatus = await request(permission);

    switch (result) {
      case RESULTS.GRANTED:   return MicPermissionStatus.GRANTED;
      case RESULTS.DENIED:    return MicPermissionStatus.DENIED;
      case RESULTS.BLOCKED:   return MicPermissionStatus.BLOCKED;
      default:                return MicPermissionStatus.UNKNOWN;
    }
  } catch {
    return MicPermissionStatus.UNKNOWN;
  }
};

// ─── Ensure permission (check → request → alert) ──────────────────
export const ensureMicPermission = async (): Promise<boolean> => {
  const current = await checkMicPermission();

  if (current === MicPermissionStatus.GRANTED) return true;

  if (current === MicPermissionStatus.BLOCKED) {
    Alert.alert(
      'Microphone Access Required',
      'Please enable microphone access in Settings to record audio.',
      [
        { text: 'Cancel',       style: 'cancel' },
        { text: 'Open Settings', onPress: (): void => { void Linking.openSettings(); } },
      ],
    );
    return false;
  }

  const requested = await requestMicPermission();
  return requested === MicPermissionStatus.GRANTED;
};

// ─── Storage permission (Android only for saving files) ──────────
export const requestStoragePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  // Android 13+ doesn't need WRITE_EXTERNAL_STORAGE for app-specific dirs
  if (Platform.Version >= 33) return true;

  try {
    const result = await request(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE);
    return result === RESULTS.GRANTED;
  } catch {
    return false;
  }
};
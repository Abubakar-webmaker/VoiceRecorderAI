import { io, type Socket } from 'socket.io-client';
import Config               from 'react-native-config';
import { logger }           from '@utils/logger';

// ─── Event Types ──────────────────────────────────────────────────
export interface TranscriptionProgressEvent {
  recordingId: string;
  step:        'transcribing' | 'summarizing' | 'keywords' | 'title' | 'actions' | 'done';
  progress:    number; // 0-100
  message?:    string;
}

export interface TranscriptionCompleteEvent {
  recordingId: string;
  data:        Record<string, unknown>;
}

export interface TranscriptionErrorEvent {
  recordingId: string;
  message:     string;
}

// ─── Singleton Socket ─────────────────────────────────────────────
let socket: Socket | null = null;

export const getSocket = (): Socket | null => socket;

// ─── Connect ──────────────────────────────────────────────────────
export const connectSocket = (accessToken: string): Socket => {
  if (socket?.connected) return socket;

  const url = Config.SOCKET_URL ?? 'http://10.0.2.2:5000';

  socket = io(url, {
    auth:              { token: accessToken },
    transports:        ['websocket'],
    reconnection:      true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    timeout:           10_000,
  });

  socket.on('connect', () => {
    logger.info('[Socket] Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    logger.info('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    logger.error('[Socket] Connection error:', err.message);
  });

  return socket;
};

// ─── Disconnect ───────────────────────────────────────────────────
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    logger.info('[Socket] Disconnected manually');
  }
};

// ─── Update auth token (after refresh) ───────────────────────────
export const updateSocketToken = (accessToken: string): void => {
  if (socket) {
    socket.auth = { token: accessToken };
    if (!socket.connected) socket.connect();
  }
};

// ─── Start transcription via socket ──────────────────────────────
export const startTranscriptionSocket = (payload: {
  recordingId:     string;
  language?:       string;
  runFullPipeline: boolean;
}): void => {
  if (!socket?.connected) {
    logger.warn('[Socket] Not connected — cannot start transcription');
    return;
  }
  socket.emit('transcription:start', payload);
};

// ─── Cancel transcription ─────────────────────────────────────────
export const cancelTranscriptionSocket = (recordingId: string): void => {
  socket?.emit('transcription:cancel', { recordingId });
};

// ─── Subscribe to recording updates ──────────────────────────────
export const subscribeToRecording = (recordingId: string): void => {
  socket?.emit('recording:subscribe', { recordingId });
};

export const unsubscribeFromRecording = (recordingId: string): void => {
  socket?.emit('recording:unsubscribe', { recordingId });
};

// ─── Event listener helpers ───────────────────────────────────────
export const onTranscriptionProgress = (
  cb: (event: TranscriptionProgressEvent) => void,
): (() => void) => {
  socket?.on('transcription:progress', cb);
  return () => socket?.off('transcription:progress', cb);
};

export const onTranscriptionComplete = (
  cb: (event: TranscriptionCompleteEvent) => void,
): (() => void) => {
  socket?.on('transcription:complete', cb);
  return () => socket?.off('transcription:complete', cb);
};

export const onTranscriptionError = (
  cb: (event: TranscriptionErrorEvent) => void,
): (() => void) => {
  socket?.on('transcription:error', cb);
  return () => socket?.off('transcription:error', cb);
};

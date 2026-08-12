import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_STORAGE_KEY = '@AIVoiceRecorder:offlineQueue';

// ─── Queue Item ────────────────────────────────────────────────────
export interface QueueItem {
  id:           string;   // unique job ID
  filePath:     string;   // local audio file path
  title:        string;
  duration:     number;
  format:       string;
  folderId:     string | null;
  waveform:     number[];
  recordedAt:   string;
  createdAt:    string;
  retryCount:   number;
  maxRetries:   number;
  status:       'pending' | 'uploading' | 'failed';
  error?:       string;
}

// ─── Load queue from AsyncStorage ─────────────────────────────────
export const loadQueue = async (): Promise<QueueItem[]> => {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueueItem[];
  } catch {
    return [];
  }
};

// ─── Save queue to AsyncStorage ────────────────────────────────────
export const saveQueue = async (items: QueueItem[]): Promise<void> => {
  await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(items));
};

// ─── Add item to queue ────────────────────────────────────────────
export const addToQueue = async (item: Omit<QueueItem, 'createdAt' | 'retryCount' | 'status' | 'maxRetries'>): Promise<QueueItem> => {
  const queue = await loadQueue();
  const newItem: QueueItem = {
    ...item,
    createdAt:  new Date().toISOString(),
    retryCount: 0,
    maxRetries: 3,
    status:     'pending',
  };
  queue.push(newItem);
  await saveQueue(queue);
  return newItem;
};

// ─── Remove item from queue ───────────────────────────────────────
export const removeFromQueue = async (id: string): Promise<void> => {
  const queue   = await loadQueue();
  const updated = queue.filter((i) => i.id !== id);
  await saveQueue(updated);
};

// ─── Update queue item ────────────────────────────────────────────
export const updateQueueItem = async (
  id:      string,
  updates: Partial<QueueItem>,
): Promise<void> => {
  const queue = await loadQueue();
  const idx   = queue.findIndex((i) => i.id === id);
  if (idx !== -1) {
    queue[idx] = { ...queue[idx], ...updates };
    await saveQueue(queue);
  }
};

// ─── Check if local file still exists ────────────────────────────
export const validateQueueItem = async (item: QueueItem): Promise<boolean> => {
  try {
    return await RNFS.exists(item.filePath);
  } catch {
    return false;
  }
};

// ─── Purge items whose files are missing ──────────────────────────
export const purgeInvalidItems = async (): Promise<string[]> => {
  const queue   = await loadQueue();
  const removed: string[] = [];

  const valid = await Promise.all(
    queue.map(async (item) => {
      const exists = await validateQueueItem(item);
      if (!exists) removed.push(item.id);
      return exists ? item : null;
    }),
  );

  const filtered = valid.filter(Boolean) as QueueItem[];
  await saveQueue(filtered);
  return removed;
};
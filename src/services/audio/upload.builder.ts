import { Platform } from 'react-native';

interface RecordingMetadata {
  title:     string;
  duration:  number;
  format:    string;
  quality:   string;
  sampleRate?: number;
  channels?:   number;
  bitrate?:    number;
  tags?:       string[];
  waveform?:   number[];
  folderId?:   string | null;
  language?:   string;
  recordedAt?: string;
}

// ─── Build FormData for audio upload ─────────────────────────────
export const buildAudioFormData = (
  filePath: string,
  meta:     RecordingMetadata,
): FormData => {
  const formData = new FormData();

  // Audio file — React Native FormData format
  const fileUri = Platform.OS === 'ios'
    ? filePath.startsWith('file://')
      ? filePath
      : `file://${filePath}`
    : filePath;

  formData.append('audio', {
    uri:  fileUri,
    type: `audio/${meta.format}`,
    name: `${meta.title.replace(/[^a-zA-Z0-9]/g, '_')}.${meta.format}`,
  } as unknown as Blob);

  // Metadata fields
  formData.append('title',      meta.title);
  formData.append('duration',   String(Math.ceil(meta.duration)));
  formData.append('format',     meta.format);
  formData.append('quality',    meta.quality ?? 'high');
  formData.append('sampleRate', String(meta.sampleRate ?? 44100));
  formData.append('channels',   String(meta.channels   ?? 1));
  formData.append('bitrate',    String(meta.bitrate    ?? 128));
  formData.append('language',   meta.language ?? 'en');

  if (meta.recordedAt) formData.append('recordedAt', meta.recordedAt);
  if (meta.folderId)   formData.append('folderId',   meta.folderId);

  if (meta.tags && meta.tags.length > 0) {
    meta.tags.forEach((tag) => formData.append('tags', tag));
  }

  if (meta.waveform && meta.waveform.length > 0) {
    // Send top 200 points for waveform visualization
    const sampled = sampleArray(meta.waveform, 200);
    formData.append('waveform', JSON.stringify(sampled));
  }

  return formData;
};

// ─── Downsample array to N points ────────────────────────────────
const sampleArray = (arr: number[], targetLength: number): number[] => {
  if (arr.length <= targetLength) return arr;
  const result: number[] = [];
  const step = arr.length / targetLength;
  for (let i = 0; i < targetLength; i++) {
    const idx = Math.floor(i * step);
    result.push(parseFloat((arr[idx] ?? 0).toFixed(3)));
  }
  return result;
};

// ─── Generate AI-style title from timestamp ───────────────────────
export const generateDefaultTitle = (): string => {
  const now  = new Date();
  const hour = now.getHours();
  const time = now.toLocaleTimeString('en-US', {
    hour:   'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const prefix =
    hour < 6  ? 'Late Night Recording' :
    hour < 12 ? 'Morning Recording'    :
    hour < 17 ? 'Afternoon Recording'  :
    hour < 21 ? 'Evening Recording'    :
               'Night Recording';

  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${prefix} — ${dateStr} ${time}`;
};
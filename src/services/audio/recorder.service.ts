import AudioRecorderPlayer, {
  type AudioSet,
  type RecordBackType,
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  OutputFormatAndroidType,
} from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

// ─── Singleton instance ───────────────────────────────────────────
const recorderPlayer = new AudioRecorderPlayer();
recorderPlayer.setSubscriptionDuration(0.1); // Update every 100ms

// ─── Amplitude normalization ──────────────────────────────────────
// dB range: -160 (silence) to 0 (max)
export const normalizeAmplitude = (db: number): number => {
  const normalized = (db + 160) / 160;
  return Math.min(1, Math.max(0, normalized));
};

// ─── Audio format config ──────────────────────────────────────────
export const getAudioSet = (): AudioSet => {
  if (Platform.OS === 'ios') {
    return {
      AVFormatIDKeyIOS:              AVEncodingOption.aac,
      AVSampleRateKeyIOS:            44100,
      AVNumberOfChannelsKeyIOS:      1,
      AVEncoderAudioQualityKeyIOS:   AVEncoderAudioQualityIOSType.high,
      AVEncoderBitRateKeyIOS:        128000,
    };
  }

  return {
    AudioSourceAndroid:     AudioSourceAndroidType.MIC,
    OutputFormatAndroid:    OutputFormatAndroidType.MPEG_4,
    AudioEncoderAndroid:    AudioEncoderAndroidType.AAC,
    AudioSamplingRateAndroid: 44100,
    AudioChannelsAndroid:   1,
    AudioEncodingBitRateAndroid: 128000,
  };
};

// ─── Get recording path ───────────────────────────────────────────
export const getRecordingPath = (): string => {
  const timestamp = Date.now();
  const ext       = Platform.OS === 'ios' ? 'm4a' : 'm4a';
  const dir       = Platform.OS === 'ios'
    ? RNFS.CachesDirectoryPath
    : RNFS.ExternalCachesDirectoryPath ?? RNFS.CachesDirectoryPath;

  return `${dir}/recording_${timestamp}.${ext}`;
};

// ─── Start Recording ──────────────────────────────────────────────
export const startRecording = async (
  path:       string,
  onProgress: (position: number, amplitude: number) => void,
): Promise<void> => {
  const audioSet = getAudioSet();

  await recorderPlayer.startRecorder(path, audioSet, true);

  recorderPlayer.addRecordBackListener((e: RecordBackType) => {
    const position  = e.currentPosition / 1000; // ms → seconds
    const amplitude = normalizeAmplitude(e.currentMetering ?? -160);
    onProgress(position, amplitude);
  });
};

// ─── Pause Recording ──────────────────────────────────────────────
export const pauseRecording = async (): Promise<void> => {
  await recorderPlayer.pauseRecorder();
};

// ─── Resume Recording ─────────────────────────────────────────────
export const resumeRecording = async (): Promise<void> => {
  await recorderPlayer.resumeRecorder();
};

// ─── Stop Recording ───────────────────────────────────────────────
export const stopRecording = async (): Promise<string> => {
  const result = await recorderPlayer.stopRecorder();
  recorderPlayer.removeRecordBackListener();
  return result; // File path
};

// ─── Discard Recording ────────────────────────────────────────────
export const discardRecording = async (filePath: string): Promise<void> => {
  try {
    recorderPlayer.removeRecordBackListener();
    try { await recorderPlayer.stopRecorder(); } catch { /* already stopped */ }
    if (await RNFS.exists(filePath)) {
      await RNFS.unlink(filePath);
    }
  } catch (e) {
    console.warn('[Recorder] Discard error:', e);
  }
};

// ─── Get file size ────────────────────────────────────────────────
export const getFileSize = async (path: string): Promise<number> => {
  try {
    const stat = await RNFS.stat(path);
    return stat.size;
  } catch {
    return 0;
  }
};

export { recorderPlayer };
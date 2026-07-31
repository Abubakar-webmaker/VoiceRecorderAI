import TrackPlayer, {
  Capability,
  AppKilledPlaybackBehavior,
  type Track,
} from 'react-native-track-player';

let isSetup = false;

// ─── Setup (call once on app start) ──────────────────────────────
export const setupPlayer = async (): Promise<boolean> => {
  if (isSetup) return true;

  try {
    await TrackPlayer.setupPlayer({
      maxCacheSize:     1024 * 10, // 10MB cache
      autoHandleInterruptions: true,
    });

    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior:
          AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.Stop,
        Capability.SeekTo,
        Capability.JumpForward,
        Capability.JumpBackward,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.JumpBackward,
        Capability.JumpForward,
      ],
      progressUpdateEventInterval: 0.5, // 500ms update
      jumpInterval:                15,  // Skip 15 seconds
    });

    isSetup = true;
    return true;
  } catch (e) {
    console.warn('[PlayerService] Setup failed:', e);
    return false;
  }
};

// ─── Load Track ───────────────────────────────────────────────────
export const loadTrack = async (track: Track): Promise<void> => {
  await TrackPlayer.reset();
  await TrackPlayer.add(track);
};

// ─── Play ─────────────────────────────────────────────────────────
export const playTrack = async (): Promise<void> => {
  await TrackPlayer.play();
};

// ─── Pause ────────────────────────────────────────────────────────
export const pauseTrack = async (): Promise<void> => {
  await TrackPlayer.pause();
};

// ─── Seek ─────────────────────────────────────────────────────────
export const seekTo = async (seconds: number): Promise<void> => {
  await TrackPlayer.seekTo(seconds);
};

// ─── Set Speed ────────────────────────────────────────────────────
export const setSpeed = async (rate: number): Promise<void> => {
  await TrackPlayer.setRate(rate);
};

// ─── Skip Forward / Backward ──────────────────────────────────────
export const skipForward = async (seconds = 15): Promise<void> => {
  const pos = await TrackPlayer.getPosition();
  const dur = await TrackPlayer.getDuration();
  await TrackPlayer.seekTo(Math.min(dur, pos + seconds));
};

export const skipBackward = async (seconds = 15): Promise<void> => {
  const pos = await TrackPlayer.getPosition();
  await TrackPlayer.seekTo(Math.max(0, pos - seconds));
};

// ─── Stop ─────────────────────────────────────────────────────────
export const stopTrack = async (): Promise<void> => {
  await TrackPlayer.reset();
};
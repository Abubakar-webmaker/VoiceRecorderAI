import TrackPlayer, { Event } from 'react-native-track-player';

// Background mein play/pause/skip handle karo
// index.js mein register hoga
export const PlaybackService = async (): Promise<void> => {
  await Promise.resolve(); // satisfy require-await

  TrackPlayer.addEventListener(Event.RemotePlay, (): void => {
    void TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemotePause, (): void => {
    void TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemoteStop, (): void => {
    void TrackPlayer.stop();
  });

  TrackPlayer.addEventListener(Event.RemoteJumpForward, (e): void => {
    void (async (): Promise<void> => {
      const pos = await TrackPlayer.getPosition();
      await TrackPlayer.seekTo(pos + (e.interval ?? 15));
    })();
  });

  TrackPlayer.addEventListener(Event.RemoteJumpBackward, (e): void => {
    void (async (): Promise<void> => {
      const pos = await TrackPlayer.getPosition();
      await TrackPlayer.seekTo(Math.max(0, pos - (e.interval ?? 15)));
    })();
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, (e): void => {
    void TrackPlayer.seekTo(e.position);
  });
};
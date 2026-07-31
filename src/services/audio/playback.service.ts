import TrackPlayer, { Event } from 'react-native-track-player';

// Background mein play/pause/skip handle karo
// index.js mein register hoga
export const PlaybackService = async (): Promise<void> => {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    void TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    void TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    void TrackPlayer.stop();
  });

  TrackPlayer.addEventListener(Event.RemoteJumpForward, async (e) => {
    const pos = await TrackPlayer.getPosition();
    await TrackPlayer.seekTo(pos + (e.interval ?? 15));
  });

  TrackPlayer.addEventListener(Event.RemoteJumpBackward, async (e) => {
    const pos = await TrackPlayer.getPosition();
    await TrackPlayer.seekTo(Math.max(0, pos - (e.interval ?? 15)));
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, (e) => {
    void TrackPlayer.seekTo(e.position);
  });
};
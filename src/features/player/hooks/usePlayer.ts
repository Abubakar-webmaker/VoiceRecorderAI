import { useCallback, useEffect } from 'react';
import type { State as TrackState } from 'react-native-track-player';
import { useProgress } from 'react-native-track-player';
import useAppDispatch              from '@hooks/useAppDispatch';
import useAppSelector              from '@hooks/useAppSelector';
import {
  loadRecordingThunk,
  togglePlayPauseThunk,
  seekThunk,
  setSpeedThunk,
  skipForwardThunk,
  skipBackwardThunk,
  stopPlayerThunk,
  updateProgress,
  setIsMiniPlayer,
  selectCurrentRecording,
  selectTrackState,
  selectSpeed,
  selectIsPlayerLoading,
  selectIsMiniPlayer,
  selectIsPlaying,
  selectProgressPercent,
  type SpeedOption,
} from '../store/playerSlice';
import type { Recording } from '@shared/types/recording.types';

const usePlayer = (): {
  currentRecording: Recording | null;
  trackState: TrackState;
  position: number;
  duration: number;
  speed: SpeedOption;
  isLoading: boolean;
  isMiniPlayer: boolean;
  isPlaying: boolean;
  progressPercent: number;
  play: (recording: Recording) => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  changeSpeed: (s: SpeedOption) => void;
  skipFwd: () => void;
  skipBwd: () => void;
  stop: () => void;
  showMini: (show: boolean) => void;
} => {
  const dispatch = useAppDispatch();

  // TrackPlayer progress (position + duration)
  const { position, duration } = useProgress(500);

  // Sync progress to Redux
  useEffect(() => {
    dispatch(updateProgress({ position, duration }));
  }, [dispatch, position, duration]);

  const currentRecording = useAppSelector(selectCurrentRecording);
  const trackState       = useAppSelector(selectTrackState);
  const speed            = useAppSelector(selectSpeed);
  const isLoading        = useAppSelector(selectIsPlayerLoading);
  const isMiniPlayer     = useAppSelector(selectIsMiniPlayer);
  const isPlaying        = useAppSelector(selectIsPlaying);
  const progressPercent  = useAppSelector(selectProgressPercent);

  const play = useCallback(
    (recording: Recording) => { void dispatch(loadRecordingThunk(recording)); },
    [dispatch],
  );

  const togglePlay = useCallback(
    () => { void dispatch(togglePlayPauseThunk()); },
    [dispatch],
  );

  const seek = useCallback(
    (seconds: number) => { void dispatch(seekThunk(seconds)); },
    [dispatch],
  );

  const changeSpeed = useCallback(
    (s: SpeedOption) => { void dispatch(setSpeedThunk(s)); },
    [dispatch],
  );

  const skipFwd = useCallback(
    () => { void dispatch(skipForwardThunk()); },
    [dispatch],
  );

  const skipBwd = useCallback(
    () => { void dispatch(skipBackwardThunk()); },
    [dispatch],
  );

  const stop = useCallback(
    () => { void dispatch(stopPlayerThunk()); },
    [dispatch],
  );

  const showMini = useCallback(
    (show: boolean) => dispatch(setIsMiniPlayer(show)),
    [dispatch],
  );

  return {
    currentRecording, trackState, position, duration,
    speed, isLoading, isMiniPlayer, isPlaying, progressPercent,
    play, togglePlay, seek, changeSpeed, skipFwd, skipBwd, stop, showMini,
  };
};

export default usePlayer;
import { useCallback, useEffect } from 'react';
import { useProgress }            from 'react-native-track-player';
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
  selectPosition,
  selectDuration,
  selectSpeed,
  selectIsPlayerLoading,
  selectIsMiniPlayer,
  selectIsPlaying,
  selectProgressPercent,
  type SpeedOption,
} from '../store/playerSlice';
import type { Recording } from '@types/recording.types';

const usePlayer = () => {
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
    (recording: Recording) => dispatch(loadRecordingThunk(recording)),
    [dispatch],
  );

  const togglePlay = useCallback(
    () => dispatch(togglePlayPauseThunk()),
    [dispatch],
  );

  const seek = useCallback(
    (seconds: number) => dispatch(seekThunk(seconds)),
    [dispatch],
  );

  const changeSpeed = useCallback(
    (s: SpeedOption) => dispatch(setSpeedThunk(s)),
    [dispatch],
  );

  const skipFwd = useCallback(
    () => dispatch(skipForwardThunk()),
    [dispatch],
  );

  const skipBwd = useCallback(
    () => dispatch(skipBackwardThunk()),
    [dispatch],
  );

  const stop = useCallback(
    () => dispatch(stopPlayerThunk()),
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
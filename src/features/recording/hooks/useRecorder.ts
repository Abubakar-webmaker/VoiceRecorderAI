import { useCallback } from 'react';
import useAppDispatch   from '@hooks/useAppDispatch';
import useAppSelector   from '@hooks/useAppSelector';
import {
  startRecordingThunk,
  pauseRecordingThunk,
  resumeRecordingThunk,
  stopAndUploadThunk,
  discardRecordingThunk,
  setRecorderTitle,
  setRecorderFolder,
  resetRecorder,
  clearRecorderError,
  selectRecorderState,
  selectRecordingDuration,
  selectAmplitudeList,
  selectCurrentAmplitude,
  selectRecorderTitle,
  selectRecorderFolder,
  selectUploadProgressRec,
  selectUploadedRecording,
  selectRecorderError,
  selectIsRecording,
  selectIsPaused,
  selectIsUploading,
  selectIsDone,
  selectIsIdle,
} from '../store/recorderSlice';

import type { Recording } from '@shared/types/recording.types';
import type { RecorderState } from '../store/recorderSlice';

const useRecorder = (): {
  recorderState: RecorderState;
  duration: number;
  amplitudeList: number[];
  currentAmplitude: number;
  title: string;
  folderId: string | null;
  uploadProgress: number;
  uploadedRecording: Recording | null;
  error: string | null;
  isRecording: boolean;
  isPaused: boolean;
  isUploading: boolean;
  isDone: boolean;
  isIdle: boolean;
  start: (opts?: { title?: string; folderId?: string | null }) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  discard: () => void;
  reset: () => void;
  setTitle: (t: string) => void;
  setFolder: (id: string | null) => void;
  clearError: () => void;
} => {
  const dispatch = useAppDispatch();

  const recorderState    = useAppSelector(selectRecorderState);
  const duration         = useAppSelector(selectRecordingDuration);
  const amplitudeList    = useAppSelector(selectAmplitudeList);
  const currentAmplitude = useAppSelector(selectCurrentAmplitude);
  const title            = useAppSelector(selectRecorderTitle);
  const folderId         = useAppSelector(selectRecorderFolder);
  const uploadProgress   = useAppSelector(selectUploadProgressRec);
  const uploadedRecording = useAppSelector(selectUploadedRecording);
  const error            = useAppSelector(selectRecorderError);
  const isRecording      = useAppSelector(selectIsRecording);
  const isPaused         = useAppSelector(selectIsPaused);
  const isUploading      = useAppSelector(selectIsUploading);
  const isDone           = useAppSelector(selectIsDone);
  const isIdle           = useAppSelector(selectIsIdle);

  const start = useCallback(
    (opts?: { title?: string; folderId?: string | null }) => {
      void dispatch(startRecordingThunk(opts ?? {}));
    },
    [dispatch],
  );

  const pause  = useCallback(() => { void dispatch(pauseRecordingThunk()); },    [dispatch]);
  const resume = useCallback(() => { void dispatch(resumeRecordingThunk()); },   [dispatch]);
  const stop   = useCallback(() => { void dispatch(stopAndUploadThunk()); },     [dispatch]);
  const discard = useCallback(() => { void dispatch(discardRecordingThunk()); }, [dispatch]);
  const reset  = useCallback(() => { void dispatch(resetRecorder()); },          [dispatch]);

  const setTitle  = useCallback(
    (t: string) => dispatch(setRecorderTitle(t)),
    [dispatch],
  );
  const setFolder = useCallback(
    (id: string | null) => dispatch(setRecorderFolder(id)),
    [dispatch],
  );

  const clearError = useCallback(
    () => dispatch(clearRecorderError()),
    [dispatch],
  );

  return {
    recorderState, duration, amplitudeList, currentAmplitude,
    title, folderId, uploadProgress, uploadedRecording, error,
    isRecording, isPaused, isUploading, isDone, isIdle,
    start, pause, resume, stop, discard, reset, setTitle, setFolder, clearError,
  };
};

export default useRecorder;
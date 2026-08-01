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

const useRecorder = () => {
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
    (opts?: { title?: string; folderId?: string | null }) =>
      dispatch(startRecordingThunk(opts ?? {})),
    [dispatch],
  );

  const pause  = useCallback(() => dispatch(pauseRecordingThunk()),    [dispatch]);
  const resume = useCallback(() => dispatch(resumeRecordingThunk()),   [dispatch]);
  const stop   = useCallback(() => dispatch(stopAndUploadThunk()),     [dispatch]);
  const discard = useCallback(() => dispatch(discardRecordingThunk()), [dispatch]);
  const reset  = useCallback(() => dispatch(resetRecorder()),          [dispatch]);

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
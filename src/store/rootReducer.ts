import { combineReducers } from '@reduxjs/toolkit';
import authReducer         from '@features/auth/store/authSlice';
import recordingReducer    from '@features/recording/store/recordingSlice';
import recorderReducer     from '@features/recording/store/recorderSlice';
import folderReducer       from '@features/folder/store/folderSlice';
import playerReducer       from '@features/player/store/playerSlice';
import aiReducer           from '@features/ai/store/aiSlice';

const rootReducer = combineReducers({
  auth:      authReducer,
  recording: recordingReducer,
  recorder:  recorderReducer,
  folder:    folderReducer,
  player:    playerReducer,
  ai:        aiReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
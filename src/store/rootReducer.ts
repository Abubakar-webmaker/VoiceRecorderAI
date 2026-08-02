import { combineReducers } from '@reduxjs/toolkit';
import authReducer         from '@features/auth/store/authSlice';
import recordingReducer    from '@features/recording/store/recordingSlice';
import recorderReducer     from '@features/recording/store/recorderSlice';
import offlineQueueReducer from '@features/recording/store/offlineQueueSlice';
import folderReducer       from '@features/folder/store/folderSlice';
import playerReducer       from '@features/player/store/playerSlice';
import aiReducer           from '@features/ai/store/aiSlice';
import settingsReducer     from '@features/settings/store/settingsSlice';
import themeReducer        from '@features/settings/store/themeSlice';

const rootReducer = combineReducers({
  auth:         authReducer,
  recording:    recordingReducer,
  recorder:     recorderReducer,
  offlineQueue: offlineQueueReducer,
  folder:       folderReducer,
  player:       playerReducer,
  ai:           aiReducer,
  settings:     settingsReducer,
  theme:        themeReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
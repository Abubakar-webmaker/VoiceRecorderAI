import { combineReducers } from '@reduxjs/toolkit';

// Feature slices — Phase 3+ mein add honge
// import authReducer from '@features/auth/store/authSlice';
// import recordingReducer from '@features/recording/store/recordingSlice';
// import playerReducer from '@features/player/store/playerSlice';
// import aiReducer from '@features/ai/store/aiSlice';
// import folderReducer from '@features/folder/store/folderSlice';
// import settingsReducer from '@features/settings/store/settingsSlice';
// import themeReducer from '@features/theme/store/themeSlice';
// import subscriptionReducer from '@features/subscription/store/subscriptionSlice';

const rootReducer = combineReducers({
  // auth: authReducer,
  // recording: recordingReducer,
  // player: playerReducer,
  // ai: aiReducer,
  // folder: folderReducer,
  // settings: settingsReducer,
  // subscription: subscriptionReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
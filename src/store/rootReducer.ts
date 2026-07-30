import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '@features/auth/store/authSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  // recording, player, ai — Phase 3+ mein add honge
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
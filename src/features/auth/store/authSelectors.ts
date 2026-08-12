import { createSelector } from '@reduxjs/toolkit';
import type { RootState }  from '@store/index';

import type { AuthState } from './authSlice';

const authState = (state: RootState): AuthState => state.auth;

export const selectUser            = createSelector(authState, (s) => s.user);
export const selectAccessToken     = createSelector(authState, (s) => s.accessToken);
export const selectIsAuthenticated = createSelector(authState, (s) => s.isAuthenticated);
export const selectIsLoading       = createSelector(authState, (s) => s.isLoading);
export const selectIsInitialized   = createSelector(authState, (s) => s.isInitialized);
export const selectAuthError       = createSelector(authState, (s) => s.error);
export const selectSuccessMessage  = createSelector(authState, (s) => s.successMessage);
export const selectIsEmailVerified = createSelector(
  authState,
  (s) => s.user?.isEmailVerified ?? false,
);
export const selectUserRole        = createSelector(
  authState,
  (s) => s.user?.role ?? 'free',
);
export const selectStorageInfo     = createSelector(authState, (s) => ({
  used:    s.user?.storageUsed  ?? 0,
  limit:   s.user?.storageLimit ?? 0,
  percent: s.user !== null && s.user !== undefined
    ? Math.min(100, Math.round((s.user.storageUsed / s.user.storageLimit) * 100))
    : 0,
}));
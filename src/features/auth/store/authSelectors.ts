import { createSelector } from '@reduxjs/toolkit';
import type { RootState }  from '@store/rootReducer';
import type { AuthUser }   from '@shared/types/api.types';

export interface AuthState {
  user:            AuthUser | null;
  accessToken:     string | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  isInitialized:   boolean;
  error:           string | null;
  successMessage:  string | null;
}

const authState = (state: RootState): AuthState => state.auth as AuthState;

export const selectUser            = createSelector(authState, (s: AuthState) => s.user);
export const selectAccessToken     = createSelector(authState, (s: AuthState) => s.accessToken);
export const selectIsAuthenticated = createSelector(authState, (s: AuthState) => s.isAuthenticated);
export const selectIsLoading       = createSelector(authState, (s: AuthState) => s.isLoading);
export const selectIsInitialized   = createSelector(authState, (s: AuthState) => s.isInitialized);
export const selectAuthError       = createSelector(authState, (s: AuthState) => s.error);
export const selectSuccessMessage  = createSelector(authState, (s: AuthState) => s.successMessage);
export const selectIsEmailVerified = createSelector(
  authState,
  (s: AuthState) => s.user?.isEmailVerified ?? false,
);
export const selectUserRole        = createSelector(
  authState,
  (s: AuthState) => s.user?.role ?? 'free',
);
export const selectStorageInfo     = createSelector(authState, (s: AuthState) => ({
  used:    s.user?.storageUsed  ?? 0,
  limit:   s.user?.storageLimit ?? 0,
  percent: s.user !== null && s.user !== undefined
    ? Math.min(100, Math.round((s.user.storageUsed / s.user.storageLimit) * 100))
    : 0,
}));

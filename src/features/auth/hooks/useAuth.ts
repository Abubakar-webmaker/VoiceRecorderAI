import { useCallback } from 'react';
import useAppDispatch  from '@hooks/useAppDispatch';
import useAppSelector  from '@hooks/useAppSelector';
import {
  loginThunk,
  registerThunk,
  logoutThunk,
  logoutAllThunk,
  forgotPasswordThunk,
  resetPasswordThunk,
  changePasswordThunk,
  verifyEmailThunk,
  resendVerificationThunk,
  getMeThunk,
  clearError,
  clearSuccess,
} from '../store/authSlice';
import {
  selectUser,
  selectIsAuthenticated,
  selectIsLoading,
  selectAuthError,
  selectSuccessMessage,
  selectIsEmailVerified,
  selectUserRole,
  selectStorageInfo,
} from '../store/authSelectors';
import type {
  LoginPayload,
  RegisterPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  ChangePasswordPayload,
} from '@shared/types/api.types';
import type { AuthUser } from '@shared/types/api.types';
import type { AppDispatch } from '@store/index';

interface StorageInfo {
  used: number;
  limit: number;
  percent: number;
}

interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  isEmailVerified: boolean;
  userRole: string;
  storage: StorageInfo;
  login: (payload: LoginPayload) => Promise<any>;
  register: (payload: RegisterPayload) => Promise<any>;
  logout: () => Promise<any>;
  logoutAll: () => Promise<any>;
  forgotPassword: (payload: ForgotPasswordPayload) => Promise<any>;
  resetPassword: (payload: ResetPasswordPayload & { token: string }) => Promise<any>;
  changePassword: (payload: ChangePasswordPayload) => Promise<any>;
  verifyEmail: (token: string) => Promise<any>;
  resendVerification: () => Promise<any>;
  refreshProfile: () => Promise<any>;
  dismissError: () => void;
  dismissSuccess: () => void;
}

const useAuth = (): UseAuthReturn => {
  const dispatch = useAppDispatch();

  const user            = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading       = useAppSelector(selectIsLoading);
  const error           = useAppSelector(selectAuthError);
  const successMessage  = useAppSelector(selectSuccessMessage);
  const isEmailVerified = useAppSelector(selectIsEmailVerified);
  const userRole        = useAppSelector(selectUserRole);
  const storage         = useAppSelector(selectStorageInfo);

  const login = useCallback(
    (payload: LoginPayload) => dispatch(loginThunk(payload)),
    [dispatch],
  );

  const register = useCallback(
    (payload: RegisterPayload) => dispatch(registerThunk(payload)),
    [dispatch],
  );

  const logout = useCallback(
    () => dispatch(logoutThunk()),
    [dispatch],
  );

  const logoutAll = useCallback(
    () => dispatch(logoutAllThunk()),
    [dispatch],
  );

  const forgotPassword = useCallback(
    (payload: ForgotPasswordPayload) => dispatch(forgotPasswordThunk(payload)),
    [dispatch],
  );

  const resetPassword = useCallback(
    (payload: ResetPasswordPayload & { token: string }) =>
      dispatch(resetPasswordThunk(payload)),
    [dispatch],
  );

  const changePassword = useCallback(
    (payload: ChangePasswordPayload) => dispatch(changePasswordThunk(payload)),
    [dispatch],
  );

  const verifyEmail = useCallback(
    (token: string) => dispatch(verifyEmailThunk(token)),
    [dispatch],
  );

  const resendVerification = useCallback(
    () => dispatch(resendVerificationThunk()),
    [dispatch],
  );

  const refreshProfile = useCallback(
    () => dispatch(getMeThunk()),
    [dispatch],
  );

  const dismissError   = useCallback(() => dispatch(clearError()),   [dispatch]);
  const dismissSuccess = useCallback(() => dispatch(clearSuccess()), [dispatch]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    successMessage,
    isEmailVerified,
    userRole,
    storage,
    login,
    register,
    logout,
    logoutAll,
    forgotPassword,
    resetPassword,
    changePassword,
    verifyEmail,
    resendVerification,
    refreshProfile,
    dismissError,
    dismissSuccess,
  };
};

export default useAuth;

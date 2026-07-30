import { apiClient } from '@services/api/axios.instance';
import { ENDPOINTS } from '@services/api/endpoints';
import type {
  ApiResponse,
  LoginPayload,
  LoginResponseData,
  RegisterPayload,
  RegisterResponseData,
  RefreshTokenResponseData,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  ChangePasswordPayload,
  AuthUser,
} from '@types/api.types';

// ─── Register ─────────────────────────────────────────────────────
export const registerApi = async (
  payload: RegisterPayload,
): Promise<RegisterResponseData> => {
  const response = await apiClient.post<ApiResponse<RegisterResponseData>>(
    ENDPOINTS.AUTH.REGISTER,
    payload,
  );

  const data = response.data.data;
  if (data == null) throw new Error(response.data.message);
  return data;
};

// ─── Login ────────────────────────────────────────────────────────
export const loginApi = async (
  payload: LoginPayload,
): Promise<LoginResponseData> => {
  const response = await apiClient.post<ApiResponse<LoginResponseData>>(
    ENDPOINTS.AUTH.LOGIN,
    payload,
  );

  const data = response.data.data;
  if (data == null) throw new Error(response.data.message);
  return data;
};

// ─── Logout ───────────────────────────────────────────────────────
export const logoutApi = async (refreshToken: string): Promise<void> => {
  await apiClient.post(ENDPOINTS.AUTH.LOGOUT, { refreshToken });
};

// ─── Logout All Devices ───────────────────────────────────────────
export const logoutAllApi = async (): Promise<void> => {
  await apiClient.post(ENDPOINTS.AUTH.LOGOUT_ALL);
};

// ─── Get Current User ─────────────────────────────────────────────
export const getMeApi = async (): Promise<AuthUser> => {
  const response = await apiClient.get<ApiResponse<AuthUser>>(
    ENDPOINTS.AUTH.ME,
  );
  const data = response.data.data;
  if (data == null) throw new Error(response.data.message);
  return data;
};

// ─── Verify Email ─────────────────────────────────────────────────
export const verifyEmailApi = async (token: string): Promise<void> => {
  await apiClient.get(ENDPOINTS.AUTH.VERIFY_EMAIL(token));
};

// ─── Resend Verification ──────────────────────────────────────────
export const resendVerificationApi = async (): Promise<void> => {
  await apiClient.post(ENDPOINTS.AUTH.RESEND_VERIFICATION);
};

// ─── Forgot Password ──────────────────────────────────────────────
export const forgotPasswordApi = async (
  payload: ForgotPasswordPayload,
): Promise<void> => {
  await apiClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, payload);
};

// ─── Reset Password ───────────────────────────────────────────────
export const resetPasswordApi = async (
  token:   string,
  payload: ResetPasswordPayload,
): Promise<void> => {
  await apiClient.patch(ENDPOINTS.AUTH.RESET_PASSWORD(token), payload);
};

// ─── Change Password ──────────────────────────────────────────────
export const changePasswordApi = async (
  payload: ChangePasswordPayload,
): Promise<void> => {
  await apiClient.patch(ENDPOINTS.AUTH.CHANGE_PASSWORD, payload);
};

// ─── Update Profile ───────────────────────────────────────────────
export const updateProfileApi = async (
  payload: Partial<{ name: string; fcmToken: string }>,
): Promise<AuthUser> => {
  const response = await apiClient.patch<ApiResponse<AuthUser>>(
    ENDPOINTS.USER.PROFILE,
    payload,
  );
  const data = response.data.data;
  if (data == null) throw new Error(response.data.message);
  return data;
};
// ─── Base API Response ────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success:    boolean;
  message:    string;
  data:       T | null;
  timestamp:  string;
  errors?:    ApiError[];
}

export interface ApiError {
  field?:   string;
  message:  string;
}

export interface PaginationMeta {
  currentPage:  number;
  totalPages:   number;
  totalItems:   number;
  itemsPerPage: number;
  hasNextPage:  boolean;
  hasPrevPage:  boolean;
}

export interface PaginatedResponse<T> {
  data:       T[];
  pagination: PaginationMeta;
}

// ─── Auth Responses ───────────────────────────────────────────────
export interface AuthUser {
  id:              string;
  name:            string;
  email:           string;
  role:            UserRole;
  avatar:          string | null;
  isEmailVerified: boolean;
  storageUsed:     number;
  storageLimit:    number;
}

export interface LoginResponseData {
  user:         AuthUser;
  accessToken:  string;
  refreshToken: string;
}

export interface RegisterResponseData {
  user:         AuthUser;
  accessToken:  string;
  refreshToken: string;
}

export interface RefreshTokenResponseData {
  accessToken:  string;
  refreshToken: string;
}

export interface ProfileResponseData {
  user: AuthUser;
}

// ─── User Roles ───────────────────────────────────────────────────
export type UserRole = 'free' | 'pro' | 'enterprise' | 'admin';

// ─── Request Payloads ─────────────────────────────────────────────
export interface LoginPayload {
  email:    string;
  password: string;
  fcmToken?: string;
}

export interface RegisterPayload {
  name:            string;
  email:           string;
  password:        string;
  confirmPassword: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  password:        string;
  confirmPassword: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword:     string;
  confirmPassword: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}
import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from '@reduxjs/toolkit';

import {
  registerApi,
  loginApi,
  logoutApi,
  getMeApi,
  verifyEmailApi,
  resendVerificationApi,
  forgotPasswordApi,
  resetPasswordApi,
  changePasswordApi,
  logoutAllApi,
} from '../services/auth.api';

import {
  storeRefreshToken,
  clearRefreshToken,
  getRefreshToken,
} from '@services/storage/keychain.service';

import type {
  AuthUser,
  LoginPayload,
  RegisterPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  ChangePasswordPayload,
} from '@types/api.types';

// ─── State Interface ──────────────────────────────────────────────
interface AuthState {
  user:            AuthUser | null;
  accessToken:     string | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  isInitialized:   boolean; // App cold start check complete hua?
  error:           string | null;
  successMessage:  string | null;
}

const initialState: AuthState = {
  user:            null,
  accessToken:     null,
  isAuthenticated: false,
  isLoading:       false,
  isInitialized:   false,
  error:           null,
  successMessage:  null,
};

// ─── Async Thunks ─────────────────────────────────────────────────

// App cold start — silently check karo ki session valid hai ya nahi
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const stored = await getRefreshToken();
      if (stored == null) return null; // Koi session nahi

      // Try silent refresh — agar refresh token valid hai
      const { apiClient } = await import('@api/axios.instance');
      const response = await apiClient.post<{
        success: boolean;
        data: { accessToken: string };
      }>('/auth/refresh', { refreshToken: stored.refreshToken });

      const accessToken = response.data.data?.accessToken;
      if (accessToken == null) return null;

      // User profile fetch karo
      const { getMeApi: getMe } = await import('../services/auth.api');
      const user = await getMe();

      return { user, accessToken };
    } catch {
      await clearRefreshToken();
      return null;
    }
  },
);

// Register
export const registerThunk = createAsyncThunk(
  'auth/register',
  async (payload: RegisterPayload, { rejectWithValue }) => {
    try {
      const data = await registerApi(payload);
      await storeRefreshToken(payload.email, data.refreshToken);
      return data;
    } catch (error) {
      const msg = (error as { message?: string }).message
        ?? 'Registration failed. Please try again.';
      return rejectWithValue(msg);
    }
  },
);

// Login
export const loginThunk = createAsyncThunk(
  'auth/login',
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      const data = await loginApi(payload);
      await storeRefreshToken(payload.email, data.refreshToken);
      return data;
    } catch (error) {
      const msg = (error as { message?: string }).message
        ?? 'Invalid email or password.';
      return rejectWithValue(msg);
    }
  },
);

// Logout
export const logoutThunk = createAsyncThunk(
  'auth/logout',
  async (_, { getState, rejectWithValue }) => {
    try {
      const stored = await getRefreshToken();
      if (stored != null) {
        await logoutApi(stored.refreshToken).catch(() => {
          // Server error ignore karo — local logout karo
        });
      }
      await clearRefreshToken();
    } catch (error) {
      await clearRefreshToken(); // Always local logout
      return rejectWithValue((error as { message?: string }).message);
    }
  },
);

// Logout all devices
export const logoutAllThunk = createAsyncThunk(
  'auth/logoutAll',
  async (_, { rejectWithValue }) => {
    try {
      await logoutAllApi();
      await clearRefreshToken();
    } catch (error) {
      await clearRefreshToken();
      return rejectWithValue((error as { message?: string }).message);
    }
  },
);

// Get current user
export const getMeThunk = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      return await getMeApi();
    } catch (error) {
      return rejectWithValue((error as { message?: string }).message);
    }
  },
);

// Verify email
export const verifyEmailThunk = createAsyncThunk(
  'auth/verifyEmail',
  async (token: string, { rejectWithValue }) => {
    try {
      await verifyEmailApi(token);
    } catch (error) {
      return rejectWithValue(
        (error as { message?: string }).message
          ?? 'Email verification failed.',
      );
    }
  },
);

// Resend verification
export const resendVerificationThunk = createAsyncThunk(
  'auth/resendVerification',
  async (_, { rejectWithValue }) => {
    try {
      await resendVerificationApi();
    } catch (error) {
      return rejectWithValue((error as { message?: string }).message);
    }
  },
);

// Forgot password
export const forgotPasswordThunk = createAsyncThunk(
  'auth/forgotPassword',
  async (payload: ForgotPasswordPayload, { rejectWithValue }) => {
    try {
      await forgotPasswordApi(payload);
    } catch (error) {
      return rejectWithValue((error as { message?: string }).message);
    }
  },
);

// Reset password
export const resetPasswordThunk = createAsyncThunk(
  'auth/resetPassword',
  async (
    payload: ResetPasswordPayload & { token: string },
    { rejectWithValue },
  ) => {
    try {
      const { token, ...rest } = payload;
      await resetPasswordApi(token, rest);
    } catch (error) {
      return rejectWithValue((error as { message?: string }).message);
    }
  },
);

// Change password
export const changePasswordThunk = createAsyncThunk(
  'auth/changePassword',
  async (payload: ChangePasswordPayload, { rejectWithValue }) => {
    try {
      await changePasswordApi(payload);
      await clearRefreshToken(); // Force re-login on all devices
    } catch (error) {
      return rejectWithValue((error as { message?: string }).message);
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState,

  reducers: {
    // Interceptor se token refresh hone pe call hota hai
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },

    // User profile update
    updateUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.user != null) {
        state.user = { ...state.user, ...action.payload };
      }
    },

    // Error clear karo
    clearError: (state) => {
      state.error = null;
    },

    // Success message clear
    clearSuccess: (state) => {
      state.successMessage = null;
    },

    // Force logout (interceptor se call)
    forceLogout: (state) => {
      state.user            = null;
      state.accessToken     = null;
      state.isAuthenticated = false;
      state.error           = 'Your session has expired. Please log in again.';
    },
  },

  extraReducers: (builder) => {

    // ─── Initialize ─────────────────────────────────────────────
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading     = true;
        state.isInitialized = false;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading     = false;
        state.isInitialized = true;
        if (action.payload != null) {
          state.user            = action.payload.user;
          state.accessToken     = action.payload.accessToken;
          state.isAuthenticated = true;
        }
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isLoading     = false;
        state.isInitialized = true;
        state.isAuthenticated = false;
      });

    // ─── Register ────────────────────────────────────────────────
    builder
      .addCase(registerThunk.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.isLoading       = false;
        state.user            = action.payload.user;
        state.accessToken     = action.payload.accessToken;
        state.isAuthenticated = true;
        state.successMessage  = 'Account created! Please verify your email.';
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload as string;
      });

    // ─── Login ───────────────────────────────────────────────────
    builder
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading       = false;
        state.user            = action.payload.user;
        state.accessToken     = action.payload.accessToken;
        state.isAuthenticated = true;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload as string;
      });

    // ─── Logout ──────────────────────────────────────────────────
    builder
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user            = null;
        state.accessToken     = null;
        state.isAuthenticated = false;
        state.error           = null;
        state.successMessage  = null;
      })
      .addCase(logoutAllThunk.fulfilled, (state) => {
        state.user            = null;
        state.accessToken     = null;
        state.isAuthenticated = false;
      });

    // ─── Get Me ──────────────────────────────────────────────────
    builder
      .addCase(getMeThunk.fulfilled, (state, action) => {
        state.user = action.payload;
      });

    // ─── Verify Email ─────────────────────────────────────────────
    builder
      .addCase(verifyEmailThunk.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(verifyEmailThunk.fulfilled, (state) => {
        state.isLoading = false;
        if (state.user != null) {
          state.user.isEmailVerified = true;
        }
        state.successMessage = 'Email verified successfully!';
      })
      .addCase(verifyEmailThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload as string;
      });

    // ─── Resend Verification ──────────────────────────────────────
    builder
      .addCase(resendVerificationThunk.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(resendVerificationThunk.fulfilled, (state) => {
        state.isLoading      = false;
        state.successMessage = 'Verification email sent! Check your inbox.';
      })
      .addCase(resendVerificationThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload as string;
      });

    // ─── Forgot Password ──────────────────────────────────────────
    builder
      .addCase(forgotPasswordThunk.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(forgotPasswordThunk.fulfilled, (state) => {
        state.isLoading      = false;
        state.successMessage = 'Password reset link sent to your email.';
      })
      .addCase(forgotPasswordThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload as string;
      });

    // ─── Reset Password ───────────────────────────────────────────
    builder
      .addCase(resetPasswordThunk.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(resetPasswordThunk.fulfilled, (state) => {
        state.isLoading      = false;
        state.successMessage = 'Password reset successfully. Please log in.';
      })
      .addCase(resetPasswordThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload as string;
      });

    // ─── Change Password ──────────────────────────────────────────
    builder
      .addCase(changePasswordThunk.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(changePasswordThunk.fulfilled, (state) => {
        state.isLoading       = false;
        state.isAuthenticated = false;
        state.user            = null;
        state.accessToken     = null;
        state.successMessage  = 'Password changed. Please log in again.';
      })
      .addCase(changePasswordThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload as string;
      });
  },
});

export const {
  setAccessToken,
  updateUser,
  clearError,
  clearSuccess,
  forceLogout,
} = authSlice.actions;

export default authSlice.reducer;
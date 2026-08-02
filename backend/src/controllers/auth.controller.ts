import type { Request, Response } from 'express';
import * as AuthService from '@services/auth.service';
import { ApiResponse }  from '@utils/ApiResponse';
import { asyncHandler } from '@utils/asyncHandler';
import { ApiError }     from '@utils/ApiError';
import type { AuthRequest } from '@types/common.types';
import type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from '@validators/auth.validator';

// Cookie options (helper)
const refreshCookieOptions = (maxAge: number) => ({
  httpOnly:  true,
  secure:    process.env['NODE_ENV'] === 'production',
  sameSite:  'strict' as const,
  maxAge,
  path:      '/api/v1/auth/refresh',
});

// ─── Register ─────────────────────────────────────────────────────
export const register = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await AuthService.registerUser(req.body as RegisterInput, req);

    res.cookie(
      'refreshToken',
      result.tokens.refreshToken,
      refreshCookieOptions(7 * 24 * 60 * 60 * 1000),
    );

    res.status(201).json(
      ApiResponse.created(
        res,
        {
          user:        result.user,
          accessToken: result.tokens.accessToken,
        },
        'Account created successfully. Please verify your email address.',
      ),
    );
  },
);

// ─── Login ────────────────────────────────────────────────────────
export const login = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await AuthService.loginUser(req.body as LoginInput, req);

    res.cookie(
      'refreshToken',
      result.tokens.refreshToken,
      refreshCookieOptions(7 * 24 * 60 * 60 * 1000),
    );

    res.status(200).json(
      ApiResponse.success(
        res,
        {
          user:        result.user,
          accessToken: result.tokens.accessToken,
        },
        'Login successful.',
      ),
    );
  },
);

// ─── Refresh Token ────────────────────────────────────────────────
export const refreshToken = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Cookie ya body se token lo (mobile app ke liye body option)
    const rawToken: string =
      (req.cookies['refreshToken'] as string | undefined) ??
      ((req.body as { refreshToken?: string }).refreshToken ?? '');

    if (!rawToken) {
      throw ApiError.unauthorized('Refresh token is required.');
    }

    const tokens = await AuthService.refreshTokens(rawToken, req);

    // New cookie set karo
    res.cookie(
      'refreshToken',
      tokens.refreshToken,
      refreshCookieOptions(7 * 24 * 60 * 60 * 1000),
    );

    res.status(200).json(
      ApiResponse.success(
        res,
        { accessToken: tokens.accessToken },
        'Token refreshed successfully.',
      ),
    );
  },
);

// ─── Logout ───────────────────────────────────────────────────────
export const logout = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const rawToken: string =
      (req.cookies['refreshToken'] as string | undefined) ??
      ((req.body as { refreshToken?: string }).refreshToken ?? '');

    await AuthService.logoutUser(req.user!.userId, rawToken, req);

    res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
    res.status(200).json(ApiResponse.success(res, null, 'Logged out successfully.'));
  },
);

// ─── Logout All Devices ───────────────────────────────────────────
export const logoutAll = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    await AuthService.logoutAllDevices(req.user!.userId, req);

    res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
    res.status(200).json(
      ApiResponse.success(res, null, 'Logged out from all devices successfully.'),
    );
  },
);

// ─── Verify Email ─────────────────────────────────────────────────
export const verifyEmail = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { token } = req.params;
    if (!token) throw ApiError.badRequest('Verification token is required.');

    await AuthService.verifyUserEmail(token);

    res.status(200).json(
      ApiResponse.success(res, null, 'Email verified successfully. You can now log in.'),
    );
  },
);

// ─── Resend Verification ──────────────────────────────────────────
export const resendVerification = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    await AuthService.resendVerificationEmail(req.user!.userId);

    res.status(200).json(
      ApiResponse.success(
        res,
        null,
        'A new verification email has been sent. Please check your inbox.',
      ),
    );
  },
);

// ─── Forgot Password ──────────────────────────────────────────────
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body as ForgotPasswordInput;
    await AuthService.forgotPassword(email);

    // Same response always — don't expose if email exists
    res.status(200).json(
      ApiResponse.success(
        res,
        null,
        'If an account with that email exists, a password reset link has been sent.',
      ),
    );
  },
);

// ─── Reset Password ───────────────────────────────────────────────
export const resetPassword = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { token }    = req.params;
    const { password } = req.body as ResetPasswordInput;

    if (!token) throw ApiError.badRequest('Reset token is required.');

    await AuthService.resetPassword(token, password);

    res.status(200).json(
      ApiResponse.success(
        res,
        null,
        'Password reset successfully. Please log in with your new password.',
      ),
    );
  },
);

// ─── Change Password ──────────────────────────────────────────────
export const changePassword = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    await AuthService.changePassword(req.user!.userId, req.body as ChangePasswordInput);

    res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
    res.status(200).json(
      ApiResponse.success(
        res,
        null,
        'Password changed successfully. Please log in again on all your devices.',
      ),
    );
  },
);

// ─── Get Current User ─────────────────────────────────────────────
export const getMe = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const user = await AuthService.getProfile(req.user!.userId);

    res.status(200).json(
      ApiResponse.success(res, user, 'Profile fetched successfully.'),
    );
  },
);
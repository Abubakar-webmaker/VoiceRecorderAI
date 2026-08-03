import crypto from 'crypto';
import type { Request } from 'express';
import { UserModel, AuthProvider }            from '@models/User.model';
import { RefreshTokenModel }                  from '@models/RefreshToken.model';
import { SettingsModel }                      from '@models/Settings.model';
import { ActivityLogModel, ActivityAction }   from '@models/ActivityLog.model';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '@config/jwt';
import type { JwtRefreshPayload } from '@types/common.types';
import { sendVerificationEmail, sendPasswordResetEmail } from './email.service';
import { ApiError }  from '@utils/ApiError';
import { logger }    from '@utils/logger';
import type {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
} from '@validators/auth.validator';

// ─── Types ────────────────────────────────────────────────────────
interface AuthTokens {
  accessToken:  string;
  refreshToken: string;
}

interface UserData {
  id:              string;
  name:            string;
  email:           string;
  role:            string;
  avatar:          string | null;
  isEmailVerified: boolean;
  storageUsed:     number;
  storageLimit:    number;
}

interface AuthResult {
  user:   UserData;
  tokens: AuthTokens;
}

// ─── Private Helpers ──────────────────────────────────────────────

const buildUserData = (user: Awaited<ReturnType<typeof UserModel.findById>>): UserData => {
  if (!user) throw ApiError.notFound('User not found');
  return {
    id:              user._id.toString(),
    name:            user.name,
    email:           user.email,
    role:            user.role,
    avatar:          user.avatar ?? null,
    isEmailVerified: user.isEmailVerified,
    storageUsed:     user.storageUsed,
    storageLimit:    user.storageLimit,
  };
};

const issueTokens = async (
  payload: { userId: string; email: string; role: string },
  req:     Request,
): Promise<AuthTokens> => {
  const accessToken = generateAccessToken({
    userId: payload.userId,
    email:  payload.email,
    role:   payload.role as 'user' | 'admin',
  });

  const { token: rawRefreshToken, tokenId } = generateRefreshToken(payload.userId);

  // Hash karke DB mein store karo
  const tokenHash = crypto
    .createHash('sha256')
    .update(rawRefreshToken)
    .digest('hex');

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await RefreshTokenModel.create({
    tokenHash,
    tokenId,
    userId:    payload.userId,
    ipAddress: req.ip ?? null,
    userAgent: req.headers['user-agent'] ?? null,
    expiresAt,
  });

  return { accessToken, refreshToken: rawRefreshToken };
};

const logActivity = async (
  userId:      string,
  action:      ActivityAction,
  description: string,
  req:         Request,
  metadata:    Record<string, unknown> = {},
): Promise<void> => {
  try {
    await ActivityLogModel.create({
      userId,
      action,
      description,
      metadata,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] ?? '',
    });
  } catch (err) {
    // Activity log fail hona critical nahi — silently log karo
    logger.error('Activity log write failed:', err);
  }
};

// ─── Auth Operations ──────────────────────────────────────────────

export const registerUser = async (
  data: RegisterInput,
  req:  Request,
): Promise<AuthResult> => {
  const { name, email, password } = data;

  // Duplicate email check
  const existing = await UserModel.findByEmail(email);
  if (existing) {
    throw ApiError.conflict('An account with this email address already exists.');
  }

  // User create karo (password pre-save hook mein hash hoga)
  const user = await UserModel.create({
    name,
    email,
    password,
    authProvider: AuthProvider.LOCAL,
  });

  // Default settings create karo
  await SettingsModel.create({ userId: user._id });

  // Verification token generate karo
  const verificationToken = user.generateEmailVerificationToken();
  await user.save();

  // Verification email async bhejo (app ko block mat karo)
  sendVerificationEmail(email, name, verificationToken).catch((err: unknown) => {
    logger.error('Verification email failed:', err);
  });

  // Tokens issue karo
  const tokens = await issueTokens(
    { userId: user._id.toString(), email, role: user.role },
    req,
  );

  await logActivity(user._id.toString(), ActivityAction.REGISTER, 'New user registered', req);

  logger.info(`✅ New user registered: ${email}`);

  return { user: buildUserData(user), tokens };
};

export const loginUser = async (
  data: LoginInput,
  req:  Request,
): Promise<AuthResult> => {
// ... existing code
};

export const googleLogin = async (
  data: { email: string; name: string; googleId: string; avatar?: string; fcmToken?: string },
  req:  Request,
): Promise<AuthResult> => {
  const { email, name, googleId, avatar, fcmToken } = data;

  let user = await UserModel.findOne({ email });

  if (user) {
    // If user exists but was local, link googleId (optional policy)
    if (!user.googleId) user.googleId = googleId;
    user.authProvider = AuthProvider.GOOGLE;
    if (avatar && !user.avatar) user.avatar = avatar;
  } else {
    // New user via Google
    user = await UserModel.create({
      email,
      name,
      googleId,
      avatar,
      authProvider: AuthProvider.GOOGLE,
      isEmailVerified: true, // Google emails are pre-verified
    });

    // Default settings
    await SettingsModel.create({ userId: user._id });
  }

  if (!user.isActive) {
    throw ApiError.unauthorized('Your account has been deactivated.');
  }

  user.lastLogin = new Date();
  if (fcmToken) user.fcmToken = fcmToken;
  await user.save();

  const tokens = await issueTokens(
    { userId: user._id.toString(), email: user.email, role: user.role },
    req,
  );

  await logActivity(user._id.toString(), ActivityAction.LOGIN, 'User logged in via Google', req);

  return { user: buildUserData(user), tokens };
};

export const refreshTokens = async (
  rawRefreshToken: string,
  req:             Request,
): Promise<AuthTokens> => {
  // JWT signature verify karo
  let payload: JwtRefreshPayload;
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token. Please log in again.');
  }

  // Hashed token DB mein dhundho
  const tokenHash = crypto
    .createHash('sha256')
    .update(rawRefreshToken)
    .digest('hex');

  const stored = await RefreshTokenModel.findOne({
    tokenHash,
    tokenId:   payload.tokenId,
    userId:    payload.userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  });

  if (!stored) {
    // Possible token reuse attack — saare tokens revoke karo
    await RefreshTokenModel.updateMany(
      { userId: payload.userId },
      { isRevoked: true },
    );
    throw ApiError.unauthorized(
      'Refresh token is invalid or has been revoked. Please log in again.',
    );
  }

  // User active hai?
  const user = await UserModel.findById(payload.userId).select('_id email role isActive');
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('User account is inactive.');
  }

  // Old token revoke karo (Refresh Token Rotation)
  stored.isRevoked = true;
  await stored.save();

  // Naye tokens issue karo
  return issueTokens(
    { userId: user._id.toString(), email: user.email, role: user.role },
    req,
  );
};

export const logoutUser = async (
  userId:          string,
  rawRefreshToken: string | undefined,
  req:             Request,
): Promise<void> => {
  if (rawRefreshToken) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawRefreshToken)
      .digest('hex');

    await RefreshTokenModel.findOneAndUpdate(
      { tokenHash, userId },
      { isRevoked: true },
    );
  }

  await logActivity(userId, ActivityAction.LOGOUT, 'User logged out', req);
};

export const logoutAllDevices = async (
  userId: string,
  req:    Request,
): Promise<void> => {
  // Saare refresh tokens revoke karo
  await RefreshTokenModel.updateMany({ userId }, { isRevoked: true });

  await logActivity(userId, ActivityAction.LOGOUT, 'Logged out from all devices', req);
};

export const verifyUserEmail = async (rawToken: string): Promise<void> => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  const user = await UserModel.findOne({
    emailVerificationToken:   hashedToken,
    emailVerificationExpires: { $gt: new Date() },
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) {
    throw ApiError.badRequest(
      'Email verification link is invalid or has expired. Please request a new one.',
    );
  }

  user.isEmailVerified        = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  await logActivity(
    user._id.toString(),
    ActivityAction.EMAIL_VERIFIED,
    'Email address verified',
    {} as Request,
  );
};

export const resendVerificationEmail = async (userId: string): Promise<void> => {
  const user = await UserModel.findById(userId);
  if (!user) throw ApiError.notFound('User not found');

  if (user.isEmailVerified) {
    throw ApiError.badRequest('Email address is already verified.');
  }

  const token = user.generateEmailVerificationToken();
  await user.save();

  await sendVerificationEmail(user.email, user.name, token);
};

export const forgotPassword = async (email: string): Promise<void> => {
  const user = await UserModel.findByEmail(email);

  // Security: same response chahe email mile ya na mile
  if (!user || !user.isActive) return;

  const resetToken = user.generatePasswordResetToken();
  await user.save();

  try {
    await sendPasswordResetEmail(email, user.name, resetToken);
  } catch (err) {
    // Token clear karo agar email fail ho
    user.passwordResetToken   = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    throw ApiError.internal(
      'Failed to send password reset email. Please try again later.',
    );
  }
};

export const resetPassword = async (
  rawToken:    string,
  newPassword: string,
): Promise<void> => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  const user = await UserModel.findOne({
    passwordResetToken:   hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    throw ApiError.badRequest(
      'Password reset link is invalid or has expired. Please request a new one.',
    );
  }

  user.password             = newPassword;
  user.passwordResetToken   = undefined;
  user.passwordResetExpires = undefined;
  user.loginAttempts        = 0;
  user.lockUntil            = undefined;
  await user.save();

  // Security: saare refresh tokens revoke karo
  await RefreshTokenModel.updateMany({ userId: user._id }, { isRevoked: true });
};

export const changePassword = async (
  userId: string,
  data:   ChangePasswordInput,
): Promise<void> => {
  const { currentPassword, newPassword } = data;

  const user = await UserModel.findById(userId).select('+password');
  if (!user) throw ApiError.notFound('User not found');

  const isCurrentValid = await user.comparePassword(currentPassword);
  if (!isCurrentValid) {
    throw ApiError.unauthorized('Current password is incorrect.');
  }

  user.password = newPassword;
  await user.save();

  // Other devices ke tokens revoke karo
  await RefreshTokenModel.updateMany({ userId }, { isRevoked: true });
};

export const getProfile = async (userId: string): Promise<UserData> => {
  const user = await UserModel.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  return buildUserData(user);
};
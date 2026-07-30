import { z } from 'zod';

// ─── Password Rule (reusable) ─────────────────────────────────────
const passwordSchema = z
  .string()
  .min(8,   'Password must be at least 8 characters')
  .max(128, 'Password cannot exceed 128 characters')
  .regex(/[A-Z]/,               'Must contain at least one uppercase letter')
  .regex(/[a-z]/,               'Must contain at least one lowercase letter')
  .regex(/[0-9]/,               'Must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Must contain at least one special character');

// ─── Schemas ──────────────────────────────────────────────────────
export const registerSchema = z
  .object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(2,  'Name must be at least 2 characters')
      .max(50, 'Name cannot exceed 50 characters')
      .trim(),
    email: z
      .string({ required_error: 'Email is required' })
      .email('Please enter a valid email address')
      .toLowerCase()
      .trim(),
    password: passwordSchema,
    confirmPassword: z.string({ required_error: 'Please confirm your password' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z.string({ required_error: 'Password is required' }).min(1),
  fcmToken: z.string().optional(), // Push notification token
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
});

export const resetPasswordSchema = z
  .object({
    password:        passwordSchema,
    confirmPassword: z.string({ required_error: 'Please confirm your password' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string({ required_error: 'Current password is required' }).min(1),
    newPassword:     passwordSchema,
    confirmPassword: z.string({ required_error: 'Please confirm your password' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ['newPassword'],
  });

export const refreshTokenSchema = z.object({
  refreshToken: z.string({ required_error: 'Refresh token is required' }).min(1),
});

// ─── Types ────────────────────────────────────────────────────────
export type RegisterInput       = z.infer<typeof registerSchema>;
export type LoginInput          = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput  = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RefreshTokenInput   = z.infer<typeof refreshTokenSchema>;
import { Router } from 'express';
import * as AuthController from '@controllers/auth.controller';
import { protect, requireEmailVerified } from '@middleware/auth.middleware';
import { validate } from '@middleware/validation.middleware';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '@validators/auth.validator';

const router = Router();

// ─────────────────────────────────────────────────────────────────
// PUBLIC ROUTES (no token required)
// ─────────────────────────────────────────────────────────────────

// POST /api/v1/auth/register
router.post('/register', validate(registerSchema), AuthController.register);

// POST /api/v1/auth/login
router.post('/login', validate(loginSchema), AuthController.login);

// POST /api/v1/auth/refresh
router.post('/refresh', AuthController.refreshToken);

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', validate(forgotPasswordSchema), AuthController.forgotPassword);

// PATCH /api/v1/auth/reset-password/:token
router.patch(
  '/reset-password/:token',
  validate(resetPasswordSchema),
  AuthController.resetPassword,
);

// GET /api/v1/auth/verify-email/:token
router.get('/verify-email/:token', AuthController.verifyEmail);

// ─────────────────────────────────────────────────────────────────
// PROTECTED ROUTES (valid JWT required)
// ─────────────────────────────────────────────────────────────────
router.use(protect);

// POST /api/v1/auth/logout
router.post('/logout', AuthController.logout);

// POST /api/v1/auth/logout-all
router.post('/logout-all', AuthController.logoutAll);

// GET /api/v1/auth/me
router.get('/me', AuthController.getMe);

// POST /api/v1/auth/resend-verification
router.post('/resend-verification', AuthController.resendVerification);

// PATCH /api/v1/auth/change-password
router.patch(
  '/change-password',
  validate(changePasswordSchema),
  AuthController.changePassword,
);

export { router as authRouter };
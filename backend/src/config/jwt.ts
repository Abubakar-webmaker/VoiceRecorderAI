import jwt          from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { env }       from './env';
import type {
  JwtAccessPayload,
  JwtRefreshPayload,
  UserRole,
} from '../types/common.types';

// ─── Generate Access Token (15m) ──────────────────────────────────
export const generateAccessToken = (payload: {
  userId: string;
  email:  string;
  role:   UserRole;
}): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    issuer:    'ai-voice-recorder',
    audience:  'ai-voice-recorder-client',
  });
};

// ─── Generate Refresh Token (7d) ──────────────────────────────────
export const generateRefreshToken = (userId: string): {
  token:   string;
  tokenId: string;
} => {
  const tokenId = uuid();
  const payload: Omit<JwtRefreshPayload, 'iat' | 'exp'> = { userId, tokenId };

  const token = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    issuer:    'ai-voice-recorder',
    audience:  'ai-voice-recorder-client',
  });

  return { token, tokenId };
};

// ─── Verify Access Token ──────────────────────────────────────────
export const verifyAccessToken = (token: string): JwtAccessPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer:   'ai-voice-recorder',
    audience: 'ai-voice-recorder-client',
  }) as JwtAccessPayload;
};

// ─── Verify Refresh Token ─────────────────────────────────────────
export const verifyRefreshToken = (token: string): JwtRefreshPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer:   'ai-voice-recorder',
    audience: 'ai-voice-recorder-client',
  }) as JwtRefreshPayload;
};

// ─── Decode without verify (for expired token inspection) ─────────
export const decodeToken = (token: string): JwtAccessPayload | null => {
  try {
    return jwt.decode(token) as JwtAccessPayload;
  } catch {
    return null;
  }
};

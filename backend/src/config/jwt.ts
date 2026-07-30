import jwt from 'jsonwebtoken';
import { env } from './env';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const generateAccessToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    issuer: 'ai-voice-recorder',
    audience: 'ai-voice-recorder-client',
  });
};

export const generateRefreshToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: 'ai-voice-recorder',
    audience: 'ai-voice-recorder-client',
  });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: 'ai-voice-recorder',
    audience: 'ai-voice-recorder-client',
  }) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: 'ai-voice-recorder',
    audience: 'ai-voice-recorder-client',
  }) as JwtPayload;
};
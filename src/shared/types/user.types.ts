import type { AuthUser, UserRole } from './api.types';

export type { AuthUser, UserRole };

// Storage thresholds
export const STORAGE_TIERS = {
  free:       500 * 1024 * 1024,   // 500 MB
  pro:        10 * 1024 * 1024 * 1024,  // 10 GB
  enterprise: 100 * 1024 * 1024 * 1024, // 100 GB
} as const;

export const formatStorageSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k     = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i     = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const getStoragePercent = (used: number, limit: number): number => {
  if (limit === 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
};

export const isProUser = (role: UserRole): boolean =>
  role === 'pro' || role === 'enterprise' || role === 'admin';
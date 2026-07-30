import { createRef } from 'react';
import type { NavigationContainerRef, ParamListBase } from '@react-navigation/native';

// Global navigation ref — navigator ke bahar navigate karne ke liye
export const navigationRef =
  createRef<NavigationContainerRef<ParamListBase>>();

export const navigate = (name: string, params?: Record<string, unknown>): void => {
  navigationRef.current?.navigate(name as never, params as never);
};

export const goBack = (): void => {
  if (navigationRef.current?.canGoBack()) {
    navigationRef.current.goBack();
  }
};

export const reset = (routeName: string): void => {
  navigationRef.current?.reset({
    index:  0,
    routes: [{ name: routeName }],
  });
};

// ─── Format duration helper ───────────────────────────────────────
export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};
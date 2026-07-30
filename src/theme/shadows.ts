import { Platform } from 'react-native';

interface ShadowStyle {
  // iOS
  shadowColor?:   string;
  shadowOffset?:  { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?:  number;
  // Android
  elevation?: number;
}

const createShadow = (
  color:    string,
  offsetY:  number,
  blur:     number,
  opacity:  number,
  elevation: number,
): ShadowStyle => {
  if (Platform.OS === 'android') {
    return { elevation };
  }
  return {
    shadowColor:    color,
    shadowOffset:   { width: 0, height: offsetY },
    shadowOpacity:  opacity,
    shadowRadius:   blur,
  };
};

export const shadows = {
  none: {} as ShadowStyle,

  xs: createShadow('#000000', 1, 2,  0.15, 1),
  sm: createShadow('#000000', 2, 4,  0.20, 2),
  md: createShadow('#000000', 4, 8,  0.25, 4),
  lg: createShadow('#000000', 8, 16, 0.30, 8),
  xl: createShadow('#000000', 12, 24, 0.35, 12),

  // Colored glows (iOS only — for the recording button aura)
  primaryGlow: {
    shadowColor:   '#6366F1',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius:  20,
  } as ShadowStyle,

  recordingGlow: {
    shadowColor:   '#FF6B6B',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius:  24,
  } as ShadowStyle,

  aiGlow: {
    shadowColor:   '#4ECDC4',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius:  16,
  } as ShadowStyle,
} as const;
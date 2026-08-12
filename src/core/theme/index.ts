import { Platform } from 'react-native';

export const colors = {
  primary: {
    default: '#6C63FF',
    light: '#8F8AFF',
    muted: '#6C63FF20',
    surface: '#6C63FF10',
  },
  secondary: '#4ECDC4',
  bg: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
    elevated: '#FFFFFF',
    input: '#F0F2F5',
    overlay: 'rgba(0,0,0,0.5)',
    modal: '#FFFFFF',
  },
  card: '#F8F9FA',
  text: {
    primary: '#1A1A2E',
    secondary: '#4A5568',
    tertiary: '#A0AEC0',
    link: '#6C63FF',
    inverse: '#FFFFFF',
    disabled: '#A0AEC0',
  },
  border: {
    default: '#E2E8F0',
    focused: '#6C63FF',
    focus: '#6C63FF',
    error: '#FF6B6B',
  },
  error: {
    default: '#FF6B6B',
    surface: '#FF6B6B10',
    text: '#FF6B6B',
    light: '#FF8E8E',
  },
  warning: {
    default: '#FFD93D',
    surface: '#FFD93D10',
    text: '#D97706',
  },
  success: {
    default: '#4ECDC4',
    surface: '#4ECDC410',
    text: '#059669',
  },
  ai: {
    default: '#6C63FF',
    light: '#8F8AFF',
    surface: '#6C63FF10',
  },
  recording: {
    default: '#FF6B6B',
  },
  tab: {
    bg: '#FFFFFF',
    border: '#E2E8F0',
  }
};

export const spacing: Record<number | string, number> = {
  [0]: 0,
  [0.5]: 2,
  [1]: 4,
  [1.5]: 6,
  [2]: 8,
  [2.5]: 10,
  [3]: 12,
  [4]: 16,
  [5]: 20,
  [6]: 24,
  [7]: 28,
  [8]: 32,
  [10]: 40,
  [12]: 48,
  [16]: 64,
};

export const borderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

export const componentSize = {
  tabBar: 64,
  recordBtnMd: 64,
  avatarXs: 24,
  avatarSm: 32,
  avatarMd: 48,
  avatarLg: 64,
  avatarXl: 96,
  inputSm: 36,
  inputMd: 48,
  inputLg: 56,
};

export const iconSize = {
  xs: 12, sm: 16, md: 24, lg: 32, xl: 48,
};

export const textStyles = {
  h1: { fontSize: 32, fontWeight: '700' as const },
  h2: { fontSize: 24, fontWeight: '700' as const },
  h3: { fontSize: 20, fontWeight: '700' as const },
  h4: { fontSize: 18, fontWeight: '600' as const },
  h5: { fontSize: 16, fontWeight: '600' as const },
  bodyLg: { fontSize: 18, fontWeight: '400' as const },
  bodyMd: { fontSize: 16, fontWeight: '400' as const },
  bodySm: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  label: { fontSize: 14, fontWeight: '500' as const },
  labelSm: { fontSize: 12, fontWeight: '500' as const },
  buttonSm: { fontSize: 12, fontWeight: '600' as const },
  buttonMd: { fontSize: 14, fontWeight: '600' as const },
  buttonLg: { fontSize: 16, fontWeight: '600' as const },
  displaySm: { fontSize: 32, fontWeight: '700' as const },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
  },
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
};

export interface AppTheme {
  colors: typeof colors;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  componentSize: typeof componentSize;
  iconSize: typeof iconSize;
  textStyles: typeof textStyles;
  shadows: typeof shadows;
  isDark: boolean;
}

export const lightTheme: AppTheme = {
  colors,
  spacing,
  borderRadius,
  componentSize,
  iconSize,
  textStyles,
  shadows,
  isDark: false,
};

export const darkTheme: AppTheme = {
  ...lightTheme,
  isDark: true,
  colors: {
    ...colors,
    bg: {
      primary: '#121212',
      secondary: '#1E1E1E',
      elevated: '#1E1E1E',
      input: '#2D2D2D',
      overlay: 'rgba(0,0,0,0.7)',
      modal: '#1E1E1E',
    },
    card: '#1E1E1E',
    text: {
      primary: '#FFFFFF',
      secondary: '#A0AEC0',
      tertiary: '#718096',
      link: '#8F8AFF',
      inverse: '#121212',
      disabled: '#4A5568',
    },
    border: {
      default: '#2D2D2D',
      focused: '#8F8AFF',
      focus: '#8F8AFF',
      error: '#FF6B6B',
    },
  }
};

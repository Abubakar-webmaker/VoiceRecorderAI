import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const colors = {
  primary: {
    default: '#6C63FF',
    light: '#8F8AFF',
    muted: '#6C63FF20',
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
  text: {
    primary: '#1A1A2E',
    secondary: '#4A5568',
    tertiary: '#A0AEC0',
    link: '#6C63FF',
  },
  border: {
    default: '#E2E8F0',
    focused: '#6C63FF',
  },
  error: {
    default: '#FF6B6B',
    surface: '#FF6B6B10',
    text: '#FF6B6B',
  },
  warning: {
    default: '#FFD93D',
  },
  success: {
    default: '#4ECDC4',
  },
  ai: {
    default: '#6C63FF',
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

export const spacing = {
  [1]: 4, [2]: 8, [3]: 12, [4]: 16, [5]: 20, [6]: 24, [8]: 32, [10]: 40, [12]: 48,
};

export const borderRadius = {
  sm: 4, md: 8, lg: 12, xl: 16, '2xl': 20, '3xl': 24, full: 9999,
};

export const componentSize = {
  tabBar: 64,
  recordBtnMd: 64,
};

export interface AppTheme {
  colors: typeof colors;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  isDark: boolean;
}

export const lightTheme: AppTheme = {
  colors,
  spacing,
  borderRadius,
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
    text: {
      primary: '#FFFFFF',
      secondary: '#A0AEC0',
      tertiary: '#718096',
      link: '#8F8AFF',
    },
    border: {
      default: '#2D2D2D',
      focused: '#8F8AFF',
    },
  }
};

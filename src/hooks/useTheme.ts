import { useColorScheme }      from 'react-native';
import { darkTheme, lightTheme } from '@theme/index';
import type { AppTheme }         from '@theme/index';
import useAppSelector            from './useAppSelector';

interface UseThemeReturn {
  theme:    AppTheme;
  isDark:   boolean;
  isLight:  boolean;
  colors:   AppTheme['colors'];
  spacing:  AppTheme['spacing'];
  shadows:  AppTheme['shadows'];
  textStyles: AppTheme['textStyles'];
  borderRadius: AppTheme['borderRadius'];
  componentSize: AppTheme['componentSize'];
  iconSize: AppTheme['iconSize'];
}

const useTheme = (): UseThemeReturn => {
  const systemScheme = useColorScheme();

  // Redux mein theme preference store hogi — Phase 7 mein
  // const themePreference = useAppSelector((s) => s.settings?.theme ?? 'system');
  const themePreference = 'dark'; // Placeholder

  const isDark = themePreference === 'dark'
    ? true
    : themePreference === 'light'
    ? false
    : systemScheme === 'dark';

  const theme = isDark ? darkTheme : lightTheme;

  return {
    theme,
    isDark,
    isLight:       !isDark,
    colors:        theme.colors,
    spacing:       theme.spacing,
    shadows:       theme.shadows,
    textStyles:    theme.textStyles,
    borderRadius:  theme.borderRadius,
    componentSize: theme.componentSize,
    iconSize:      theme.iconSize,
  };
};

export default useTheme;
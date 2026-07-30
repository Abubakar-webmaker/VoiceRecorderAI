import { colors, lightColors, type ColorTheme } from './colors';
import { fontFamily, fontWeight, fontSize, lineHeight, letterSpacing, textStyles } from './typography';
import { spacing, borderRadius, layout, iconSize, componentSize } from './spacing';
import { shadows } from './shadows';

// ─── Dark Theme ───────────────────────────────────────────────────
export const darkTheme = {
  dark:          true,
  colors,
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  letterSpacing,
  textStyles,
  spacing,
  borderRadius,
  layout,
  iconSize,
  componentSize,
  shadows,
} as const;

// ─── Light Theme ──────────────────────────────────────────────────
export const lightTheme = {
  ...darkTheme,
  dark:   false,
  colors: lightColors,
} as const;

export type AppTheme = typeof darkTheme;

// Re-exports
export { colors, lightColors };
export { fontFamily, fontWeight, fontSize, lineHeight, letterSpacing, textStyles };
export { spacing, borderRadius, layout, iconSize, componentSize };
export { shadows };
export type { ColorTheme };
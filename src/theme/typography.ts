import { Platform } from 'react-native';

// ─── Font Families ────────────────────────────────────────────────
// Note: Custom fonts Phase 7 mein add honge
// Abhi system fonts use kar rahe hain
export const fontFamily = {
  // Display / Headings — tight tracking, strong weight
  display: Platform.select({
    ios:     'System',
    android: 'Roboto',
    default: 'System',
  }),
  // Body / UI — readable, neutral
  body: Platform.select({
    ios:     'System',
    android: 'Roboto',
    default: 'System',
  }),
  // Mono — for timestamps, durations, technical data
  mono: Platform.select({
    ios:     'Courier New',
    android: 'monospace',
    default: 'monospace',
  }),
} as const;

// ─── Font Weights ─────────────────────────────────────────────────
export const fontWeight = {
  thin:       '100' as const,
  extraLight: '200' as const,
  light:      '300' as const,
  regular:    '400' as const,
  medium:     '500' as const,
  semiBold:   '600' as const,
  bold:       '700' as const,
  extraBold:  '800' as const,
  black:      '900' as const,
} as const;

// ─── Font Sizes ───────────────────────────────────────────────────
export const fontSize = {
  xs:   10,
  sm:   12,
  base: 14,
  md:   16,
  lg:   18,
  xl:   20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 36,
  '6xl': 42,
  '7xl': 48,
} as const;

// ─── Line Heights ─────────────────────────────────────────────────
export const lineHeight = {
  tight:   1.2,
  snug:    1.35,
  normal:  1.5,
  relaxed: 1.65,
  loose:   2.0,
} as const;

// ─── Letter Spacing ───────────────────────────────────────────────
export const letterSpacing = {
  tighter: -0.8,
  tight:   -0.4,
  normal:   0,
  wide:     0.4,
  wider:    0.8,
  widest:   1.6,
} as const;

// ─── Type Scale ───────────────────────────────────────────────────
// Predefined text styles — use karo seedha
export const textStyles = {
  // Display
  displayLg: {
    fontSize:      fontSize['7xl'],
    fontWeight:    fontWeight.bold,
    lineHeight:    fontSize['7xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.tighter,
  },
  displayMd: {
    fontSize:      fontSize['5xl'],
    fontWeight:    fontWeight.bold,
    lineHeight:    fontSize['5xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.tighter,
  },
  displaySm: {
    fontSize:      fontSize['4xl'],
    fontWeight:    fontWeight.bold,
    lineHeight:    fontSize['4xl'] * lineHeight.snug,
    letterSpacing: letterSpacing.tight,
  },

  // Headings
  h1: {
    fontSize:      fontSize['3xl'],
    fontWeight:    fontWeight.bold,
    lineHeight:    fontSize['3xl'] * lineHeight.snug,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    fontSize:      fontSize['2xl'],
    fontWeight:    fontWeight.semiBold,
    lineHeight:    fontSize['2xl'] * lineHeight.snug,
    letterSpacing: letterSpacing.tight,
  },
  h3: {
    fontSize:      fontSize.xl,
    fontWeight:    fontWeight.semiBold,
    lineHeight:    fontSize.xl * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  h4: {
    fontSize:      fontSize.lg,
    fontWeight:    fontWeight.semiBold,
    lineHeight:    fontSize.lg * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  h5: {
    fontSize:      fontSize.md,
    fontWeight:    fontWeight.semiBold,
    lineHeight:    fontSize.md * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  h6: {
    fontSize:      fontSize.base,
    fontWeight:    fontWeight.semiBold,
    lineHeight:    fontSize.base * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Body
  bodyLg: {
    fontSize:      fontSize.md,
    fontWeight:    fontWeight.regular,
    lineHeight:    fontSize.md * lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
  },
  bodyMd: {
    fontSize:      fontSize.base,
    fontWeight:    fontWeight.regular,
    lineHeight:    fontSize.base * lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
  },
  bodySm: {
    fontSize:      fontSize.sm,
    fontWeight:    fontWeight.regular,
    lineHeight:    fontSize.sm * lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
  },

  // UI
  label: {
    fontSize:      fontSize.sm,
    fontWeight:    fontWeight.medium,
    lineHeight:    fontSize.sm * lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  },
  labelSm: {
    fontSize:      fontSize.xs,
    fontWeight:    fontWeight.medium,
    lineHeight:    fontSize.xs * lineHeight.normal,
    letterSpacing: letterSpacing.wider,
  },
  caption: {
    fontSize:      fontSize.xs,
    fontWeight:    fontWeight.regular,
    lineHeight:    fontSize.xs * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Mono (durations, timestamps)
  mono: {
    fontSize:      fontSize.sm,
    fontWeight:    fontWeight.medium,
    lineHeight:    fontSize.sm * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  monoLg: {
    fontSize:      fontSize.md,
    fontWeight:    fontWeight.semiBold,
    lineHeight:    fontSize.md * lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  },

  // Button
  buttonLg: {
    fontSize:      fontSize.md,
    fontWeight:    fontWeight.semiBold,
    lineHeight:    fontSize.md * lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  },
  buttonMd: {
    fontSize:      fontSize.base,
    fontWeight:    fontWeight.semiBold,
    lineHeight:    fontSize.base * lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  },
  buttonSm: {
    fontSize:      fontSize.sm,
    fontWeight:    fontWeight.semiBold,
    lineHeight:    fontSize.sm * lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  },
} as const;
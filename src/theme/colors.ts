// ─── Base Palette ─────────────────────────────────────────────────
// Yeh raw color values hain — seedha use mat karo
const palette = {
  // Navy Black (app background)
  navy: {
    950: '#040609',
    900: '#080B14',  // ← Primary background
    850: '#0C1020',
    800: '#0F1320',  // ← Card surface
    750: '#131929',
    700: '#181F33',  // ← Elevated surface
    600: '#1E273D',  // ← Input background
    500: '#2A3454',  // ← Border
    400: '#3D4F73',  // ← Subtle border
  },

  // Indigo Violet (primary brand color)
  indigo: {
    900: '#1E1B4B',
    800: '#312E81',
    700: '#3730A3',
    600: '#4338CA',
    500: '#4F46E5',
    400: '#6366F1',  // ← Primary
    300: '#818CF8',  // ← Primary light
    200: '#A5B4FC',
    100: '#C7D2FE',
    50:  '#EEF2FF',
  },

  // Coral (recording active state)
  coral: {
    700: '#C53030',
    600: '#E53E3E',
    500: '#FC4444',
    400: '#FF6B6B',  // ← Recording color
    300: '#FF8E8E',
    200: '#FFBDBD',
    100: '#FFE8E8',
  },

  // Mint Teal (AI / success states)
  mint: {
    700: '#0D9488',
    600: '#14B8A6',
    500: '#2DD4BF',
    400: '#4ECDC4',  // ← AI / success color
    300: '#6EE7E0',
    200: '#99F6F0',
    100: '#CCFBF8',
  },

  // Amber (warning)
  amber: {
    500: '#F59E0B',
    400: '#FBBF24',
    300: '#FCD34D',
    100: '#FEF3C7',
  },

  // Text
  white:   '#FFFFFF',
  off:     '#F0EFFA', // Slightly violet-tinted white
  neutral: {
    400: '#9DA8C7',  // Secondary text
    300: '#C4CCDF',  // Tertiary text
    200: '#D9E0EE',
    100: '#EEF1F9',
  },
} as const;

// ─── Semantic Tokens ──────────────────────────────────────────────
export const colors = {
  // Backgrounds
  bg: {
    primary:    palette.navy[900],
    secondary:  palette.navy[800],
    elevated:   palette.navy[700],
    input:      palette.navy[600],
    overlay:    'rgba(4, 6, 9, 0.85)',
    modal:      palette.navy[850],
  },

  // Borders
  border: {
    default:  palette.navy[500],
    subtle:   palette.navy[400],
    focus:    palette.indigo[400],
    error:    palette.coral[400],
  },

  // Brand
  primary: {
    default: palette.indigo[400],
    light:   palette.indigo[300],
    dark:    palette.indigo[600],
    muted:   `${palette.indigo[400]}20`,  // 12% opacity
    surface: `${palette.indigo[400]}15`,
  },

  // Recording
  recording: {
    default: palette.coral[400],
    light:   palette.coral[300],
    dark:    palette.coral[600],
    muted:   `${palette.coral[400]}20`,
    surface: `${palette.coral[400]}12`,
    pulse:   `${palette.coral[400]}35`,
  },

  // AI / Success
  ai: {
    default: palette.mint[400],
    light:   palette.mint[300],
    dark:    palette.mint[600],
    muted:   `${palette.mint[400]}20`,
    surface: `${palette.mint[400]}12`,
  },

  // Status
  success: {
    default: palette.mint[400],
    surface: `${palette.mint[400]}15`,
    text:    palette.mint[300],
  },
  warning: {
    default: palette.amber[400],
    surface: `${palette.amber[400]}15`,
    text:    palette.amber[300],
  },
  error: {
    default: palette.coral[400],
    surface: `${palette.coral[400]}15`,
    text:    palette.coral[300],
  },

  // Text
  text: {
    primary:   palette.off,
    secondary: palette.neutral[400],
    tertiary:  palette.neutral[300],
    disabled:  palette.navy[400],
    inverse:   palette.navy[900],
    link:      palette.indigo[300],
  },

  // Tab Bar
  tab: {
    active:   palette.indigo[400],
    inactive: palette.neutral[400],
    bg:       palette.navy[850],
    border:   palette.navy[500],
  },

  // Specific UI
  card:       palette.navy[800],
  cardHover:  palette.navy[750],
  skeleton:   palette.navy[700],
  shimmer:    palette.navy[600],

  // Raw palette export for special cases
  palette,
} as const;

// ─── Light Theme Colors ───────────────────────────────────────────
export const lightColors = {
  bg: {
    primary:   '#F8F9FF',
    secondary: '#FFFFFF',
    elevated:  '#FFFFFF',
    input:     '#F1F3FF',
    overlay:   'rgba(8, 11, 20, 0.6)',
    modal:     '#FFFFFF',
  },
  border: {
    default: '#DDE1F5',
    subtle:  '#EEF0FB',
    focus:   palette.indigo[500],
    error:   palette.coral[500],
  },
  primary: {
    default: palette.indigo[500],
    light:   palette.indigo[400],
    dark:    palette.indigo[600],
    muted:   `${palette.indigo[500]}15`,
    surface: `${palette.indigo[500]}10`,
  },
  recording: {
    default: palette.coral[500],
    light:   palette.coral[400],
    dark:    palette.coral[600],
    muted:   `${palette.coral[500]}15`,
    surface: `${palette.coral[500]}10`,
    pulse:   `${palette.coral[500]}30`,
  },
  ai: {
    default: palette.mint[600],
    light:   palette.mint[500],
    dark:    palette.mint[700],
    muted:   `${palette.mint[600]}15`,
    surface: `${palette.mint[600]}10`,
  },
  success: {
    default: palette.mint[600],
    surface: `${palette.mint[600]}12`,
    text:    palette.mint[700],
  },
  warning: {
    default: palette.amber[500],
    surface: `${palette.amber[500]}12`,
    text:    palette.amber[600] as string,
  },
  error: {
    default: palette.coral[500],
    surface: `${palette.coral[500]}12`,
    text:    palette.coral[600] as string,
  },
  text: {
    primary:   '#0F1320',
    secondary: '#4A5580',
    tertiary:  '#6E7BAA',
    disabled:  '#B0B8D4',
    inverse:   '#F0EFFA',
    link:      palette.indigo[600],
  },
  tab: {
    active:   palette.indigo[500],
    inactive: '#8A96C0',
    bg:       '#FFFFFF',
    border:   '#E8ECFB',
  },
  card:      '#FFFFFF',
  cardHover: '#F5F7FF',
  skeleton:  '#E8ECF8',
  shimmer:   '#F1F4FC',
  palette,
} as const;

export type ColorTheme = typeof colors;
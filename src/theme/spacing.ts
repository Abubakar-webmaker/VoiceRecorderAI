// ─── Base Scale (4px grid) ────────────────────────────────────────
export const spacing = {
  0:    0,
  0.5:  2,
  1:    4,
  1.5:  6,
  2:    8,
  2.5:  10,
  3:    12,
  3.5:  14,
  4:    16,
  5:    20,
  6:    24,
  7:    28,
  8:    32,
  9:    36,
  10:   40,
  11:   44,
  12:   48,
  14:   56,
  16:   64,
  18:   72,
  20:   80,
  24:   96,
  28:   112,
  32:   128,
} as const;

// ─── Border Radius ────────────────────────────────────────────────
export const borderRadius = {
  none:    0,
  xs:      4,
  sm:      8,
  md:      12,
  lg:      16,
  xl:      20,
  '2xl':   24,
  '3xl':   32,
  full:    9999,
} as const;

// ─── Layout ───────────────────────────────────────────────────────
export const layout = {
  screenHPadding: spacing[5],   // Horizontal screen padding
  screenVPadding: spacing[6],   // Vertical screen padding
  cardPadding:    spacing[4],
  sectionGap:     spacing[6],
  componentGap:   spacing[3],
  itemGap:        spacing[2],
} as const;

// ─── Icon Sizes ───────────────────────────────────────────────────
export const iconSize = {
  xs:  12,
  sm:  16,
  md:  20,
  lg:  24,
  xl:  28,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
} as const;

// ─── Component Sizes ──────────────────────────────────────────────
export const componentSize = {
  // Input / Button heights
  inputSm:   36,
  inputMd:   48,
  inputLg:   56,

  // Tap target (minimum 44pt for accessibility)
  tapTarget: 44,

  // Bottom Tab Bar
  tabBar:    80,
  tabBarIcon: 24,

  // Header
  headerHeight: 56,

  // Recording button (the signature element)
  recordBtnSm: 64,
  recordBtnMd: 80,
  recordBtnLg: 96,
  recordBtnXl: 120,

  // Avatar
  avatarXs:  24,
  avatarSm:  32,
  avatarMd:  40,
  avatarLg:  56,
  avatarXl:  80,
} as const;
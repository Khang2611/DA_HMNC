/**
 * Mauve Glass Banking — Refined Design Tokens v5
 *
 * Apple-inspired minimalist mobile banking system.
 * Two-tone surface architecture:
 * - Upper Region: Funkie Friday (#4A3F4B / refined softened #3E3440)
 * - Lower Region: Back in Black (#16131F)
 *
 * Liquid Glass surfaces:
 * - Floating Bottom Nav: Restored to original dark smoky-mauve rgba(30, 24, 38, 0.82)
 *   and delicate border rgba(193, 160, 172, 0.25).
 * - Background-only native blur softens scrolling text without adding any gray haze.
 */

export const Palette = {
  // Brand Colors
  primary: '#806C79', // Moonscape
  dark: '#16131F', // Back in Black
  light: '#F0D9E4', // Mountain Heather
  secondary: '#C1A0AC', // Decanting
  surface: '#4A3F4B', // Funkie Friday

  // Two-Tone Surface Architecture
  bg: '#16131F',           // Lower region base (Back in Black)
  upperSurface: '#3E3440', // Softened Funkie Friday for elevated upper region
  upperBorder: 'rgba(193, 160, 172, 0.12)',

  // Surface hierarchy for transaction & content cards
  surfaceL1: '#1E1826',    // slightly lifted card surface
  surfaceL2: '#201A27',    // lifted surface (transaction rows)
  surfaceL3: '#282132',    // top-level elevated surface

  // Ambient lighting / diffuse glows
  ambientMauve: 'rgba(128, 108, 121, 0.22)',
  glowMauve: 'rgba(128, 108, 121, 0.15)',
  glowDecanting: 'rgba(193, 160, 172, 0.10)',
  glowTopEdge: 'rgba(255, 255, 255, 0.18)',

  // Functional Neutrals
  white: '#FFFFFF',
  nearBlack: '#0D0B12',
  gray50: '#F9F8F9',
  gray100: '#F2EDF0',
  gray200: '#E2DAE0',
  gray300: '#C7BCC4',
  gray400: '#9E919B',
  gray500: '#7A6E78',
  gray600: '#5C515B',
  gray700: '#3D353D',
  gray800: '#262027',
  gray900: '#19151B',

  // Semantic Financial Colors
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#5856D6',

  // Financial Badges & Indicators
  incomeGreen: '#32D74B',
  expenseRed: '#FF453A',

  // Borders & Specular Highlights
  borderSubtle: 'rgba(240, 217, 228, 0.08)',
  borderMauve: 'rgba(193, 160, 172, 0.25)', // Restored original delicate border
  borderHighlight: 'rgba(255, 255, 255, 0.22)',
} as const;

export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  fontSize: {
    caption2: 11,
    caption1: 12,
    footnote: 13,
    subheadline: 15,
    callout: 16,
    body: 17,
    headline: 17,
    title3: 20,
    title2: 22,
    title1: 28,
    largeTitle: 34,
    balanceHero: 32,
  },
  lineHeight: {
    caption2: 13,
    caption1: 16,
    footnote: 18,
    subheadline: 20,
    callout: 21,
    body: 22,
    headline: 22,
    title3: 25,
    title2: 28,
    title1: 34,
    largeTitle: 41,
    balanceHero: 40,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  letterSpacing: {
    tighter: -0.5,
    tight: -0.2,
    normal: 0,
    wide: 0.2,
    wider: 0.4,
  },
} as const;

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 30, // 30dp for smooth upper section bottom curve
  pill: 9999,
  full: 9999,
} as const;

export const GlassEffect = {
  // Floating bottom nav: Calibrated Liquid Glass appearance
  // Over empty #16131F background it renders dark, rich, and identical to original pre-blur (RGB 29, 23, 37)
  // When scrolling over text, the text is softly blurred and visible through the glass (48% light transmission)
  dark: {
    backgroundColor: 'rgba(30, 24, 38, 0.82)', // Solid / non-blur fallback
    blurOverlayColor: 'rgba(193, 160, 172, 0.10)', // Calibrated frosted-glass tint overlay when native blur is active
    solidFallback: '#1E1826',
    borderColor: 'rgba(193, 160, 172, 0.25)',  // Original delicate border
    borderWidth: 1,
    blurIntensity: 10,
  },
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.70)',
    blurOverlayColor: 'rgba(255, 255, 255, 0.50)',
    solidFallback: '#F7EDF3',
    borderColor: 'rgba(128, 108, 121, 0.16)',
    borderWidth: 1,
    blurIntensity: 30,
  },
  // Account card: primary glass surface (replaces legacy card tokens with approved dark smoky-mauve frosted glass)
  card: {
    backgroundColor: 'rgba(30, 24, 38, 0.82)',
    blurOverlayColor: 'rgba(240, 217, 228, 0.06)',
    solidFallback: '#1E1826',
    borderColor: 'rgba(193, 160, 172, 0.25)',
    borderWidth: 1,
    blurIntensity: 10,
  },
  // Quick actions: relatively solid with subtle border
  subtle: {
    backgroundColor: 'rgba(44, 37, 56, 0.72)',
    blurOverlayColor: 'rgba(44, 37, 56, 0.72)',
    solidFallback: '#231D2A',
    borderColor: 'rgba(193, 160, 172, 0.18)',
    borderWidth: 1,
    blurIntensity: 15,
  },
} as const;

export const Shadows = {
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  glass: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 4,
  },
  floating: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

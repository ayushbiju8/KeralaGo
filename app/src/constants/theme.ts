/**
 * KeralaGo Design System — Theme Tokens
 *
 * Extracted directly from the reference UI mockups:
 *   - Green Ride-Hailing Map Interface
 *   - KeralaGo Ride Booking App UI Flow
 *   - KeralaGo Driver App UI Showcase
 *   - KeralaGo Admin App UI Showcase
 *
 * RULE: All components MUST derive colors, fonts, spacing, and radii
 *       exclusively from this file. Never hardcode raw hex/pixel values.
 */

// ─── Color Palette ────────────────────────────────────────────────────────────

export const Colors = {
  // Primary Brand — Kerala Forest Emerald
  primary: '#0F4A2B',
  primaryDark: '#092E1B',
  primaryLight: '#137A47',
  primaryVibrant: '#10B981',     // Live markers, active states
  primaryHover: '#0D3D24',

  // Soft Mint — Card tints, pill backgrounds, icon containers
  mint: '#E8F5E9',
  mintLight: '#F0FDF4',
  mintDark: '#C8E6C9',
  mintBorder: '#A7D7B4',

  // Status / Functional Colors
  success: '#10B981',            // Online badge, Verified, Completed
  warning: '#F59E0B',            // Star ratings, Busy, Surge, Peak hours
  danger: '#EF4444',             // SOS, Cancelled, Blacklist, Suspend, Danger
  info: '#3B82F6',               // Route polylines, water bodies, info badges
  pinkRide: '#EC4899',           // Pink Ride (Women-only service)
  onTrip: '#8B5CF6',             // On Trip indicator

  // Neutral Surfaces
  background: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceCard: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.4)',
  scrim: 'rgba(0, 0, 0, 0.6)',

  // Borders & Dividers
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocus: '#0F4A2B',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
  textGreen: '#0F4A2B',
  textLink: '#137A47',
  textDanger: '#EF4444',
  textWarning: '#D97706',

  // Pure
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Map
  mapRoute: '#0F4A2B',
  mapRouteBlue: '#3B82F6',
  mapPickup: '#10B981',
  mapDropoff: '#EF4444',
} as const;

export type ColorKey = keyof typeof Colors;

// ─── Typography Scale ──────────────────────────────────────────────────────────

export const FontFamily = {
  regular: undefined,   // System default (SF Pro / Roboto)
  medium: undefined,
  semiBold: undefined,
  bold: undefined,
} as const;

export const FontSize = {
  xs: 10,
  sm: 11,
  caption: 12,
  label: 13,
  body2: 14,
  body1: 15,
  h4: 16,
  h3: 18,
  h2: 22,
  h1: 28,
  display: 34,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
} as const;

export const LineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

// ─── Spacing Scale (4pt grid) ─────────────────────────────────────────────────

export const Spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export type SpacingKey = keyof typeof Spacing;

// ─── Border Radii ─────────────────────────────────────────────────────────────

export const Radii = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

export type RadiusKey = keyof typeof Radii;

// ─── Shadows / Elevation ──────────────────────────────────────────────────────

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  xl: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 28,
    elevation: 12,
  },
  // Brand-tinted card shadow
  card: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  // Float shadow for overlaid buttons
  float: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
} as const;

export type ShadowKey = keyof typeof Shadows;

// ─── Z-Index ──────────────────────────────────────────────────────────────────

export const ZIndex = {
  base: 0,
  card: 10,
  overlay: 100,
  modal: 200,
  toast: 300,
  tooltip: 400,
} as const;

// ─── Animation Durations ──────────────────────────────────────────────────────

export const Duration = {
  instant: 0,
  fast: 150,
  normal: 250,
  slow: 400,
  verySlow: 600,
} as const;

// ─── Icon Sizes ───────────────────────────────────────────────────────────────

export const IconSize = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  '2xl': 32,
} as const;

export type IconSizeKey = keyof typeof IconSize;

// ─── Avatar Sizes ─────────────────────────────────────────────────────────────

export const AvatarSize = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 64,
  xl: 88,
} as const;

export type AvatarSizeKey = keyof typeof AvatarSize;

// ─── Consolidated Theme Export ────────────────────────────────────────────────

export const Theme = {
  colors: Colors,
  fontSize: FontSize,
  fontWeight: FontWeight,
  fontFamily: FontFamily,
  lineHeight: LineHeight,
  spacing: Spacing,
  radii: Radii,
  shadows: Shadows,
  zIndex: ZIndex,
  duration: Duration,
  iconSize: IconSize,
  avatarSize: AvatarSize,
} as const;

export type Theme = typeof Theme;

export default Theme;

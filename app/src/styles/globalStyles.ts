/**
 * KeralaGo Design System — Global Utility Styles
 *
 * Common StyleSheet utilities shared across all components.
 * Import `gs` for flex, layout, and text utility styles.
 * Never use raw pixel values; always reference Theme tokens.
 */

import { StyleSheet } from 'react-native';
import { Colors, Spacing, Radii } from '../constants/theme';

export const gs = StyleSheet.create({
  // ── Flex Utilities ─────────────────────────────────────────
  flex1: { flex: 1 },
  flex0: { flex: 0 },
  row: { flexDirection: 'row' },
  col: { flexDirection: 'column' },
  wrap: { flexWrap: 'wrap' },

  // Alignment
  center: { alignItems: 'center', justifyContent: 'center' },
  alignCenter: { alignItems: 'center' },
  alignStart: { alignItems: 'flex-start' },
  alignEnd: { alignItems: 'flex-end' },
  justifyCenter: { justifyContent: 'center' },
  justifyStart: { justifyContent: 'flex-start' },
  justifyEnd: { justifyContent: 'flex-end' },
  justifyBetween: { justifyContent: 'space-between' },
  justifyAround: { justifyContent: 'space-around' },

  // Row shortcuts
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowEnd: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },

  // ── Positioning ────────────────────────────────────────────
  absolute: { position: 'absolute' },
  relative: { position: 'relative' },
  absoluteFill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },

  // ── Overflow ──────────────────────────────────────────────
  overflowHidden: { overflow: 'hidden' },

  // ── Background Colors ─────────────────────────────────────
  bgWhite: { backgroundColor: Colors.white },
  bgSurface: { backgroundColor: Colors.surface },
  bgPrimary: { backgroundColor: Colors.primary },
  bgMint: { backgroundColor: Colors.mint },
  bgMintLight: { backgroundColor: Colors.mintLight },
  bgTransparent: { backgroundColor: Colors.transparent },

  // ── Common Padding / Margin ────────────────────────────────
  p0: { padding: 0 },
  pXs: { padding: Spacing.xs },
  pSm: { padding: Spacing.sm },
  pMd: { padding: Spacing.md },
  pBase: { padding: Spacing.base },
  pLg: { padding: Spacing.lg },
  pXl: { padding: Spacing.xl },

  phBase: { paddingHorizontal: Spacing.base },
  phLg: { paddingHorizontal: Spacing.lg },
  pvSm: { paddingVertical: Spacing.sm },
  pvMd: { paddingVertical: Spacing.md },
  pvBase: { paddingVertical: Spacing.base },

  m0: { margin: 0 },
  mXs: { margin: Spacing.xs },
  mSm: { margin: Spacing.sm },
  mBase: { margin: Spacing.base },
  mhBase: { marginHorizontal: Spacing.base },
  mvSm: { marginVertical: Spacing.sm },
  mvMd: { marginVertical: Spacing.md },
  mvBase: { marginVertical: Spacing.base },

  // ── Border Radius ──────────────────────────────────────────
  rounded: { borderRadius: Radii.sm },
  roundedMd: { borderRadius: Radii.md },
  roundedLg: { borderRadius: Radii.lg },
  roundedFull: { borderRadius: Radii.full },

  // ── Common Borders ─────────────────────────────────────────
  border: { borderWidth: 1, borderColor: Colors.border },
  borderLight: { borderWidth: 1, borderColor: Colors.borderLight },
  borderPrimary: { borderWidth: 2, borderColor: Colors.primary },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: Colors.border },

  // ── Text Utilities ─────────────────────────────────────────
  textCenter: { textAlign: 'center' },
  textLeft: { textAlign: 'left' },
  textRight: { textAlign: 'right' },

  // ── Sizing ─────────────────────────────────────────────────
  fullWidth: { width: '100%' },
  fullHeight: { height: '100%' },

  // ── Screen containers ─────────────────────────────────────
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeContent: {
    flex: 1,
    paddingHorizontal: Spacing.base,
  },
});

export default gs;

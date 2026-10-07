/**
 * Atom: Badge
 *
 * Status and label chips used across all KeralaGo apps.
 * Variants: success (Online/Active) | warning (Busy) | danger (Offline/Cancelled/Blocked)
 *          | info (On Trip) | neutral | pink (Pink Ride)
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Typography from './Typography';
import { Colors, Spacing, Radii, FontSize } from '../../constants/theme';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'pink' | 'primary';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  /** Semantic color variant */
  variant?: BadgeVariant;
  /** Badge label text */
  label: string;
  /** Size */
  size?: BadgeSize;
  /** Show pulsing live dot before label */
  dot?: boolean;
  /** Override container style */
  style?: ViewStyle;
}

const variantConfig: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  success: { bg: '#DCFCE7', text: '#166534', dot: Colors.success },
  warning: { bg: '#FEF3C7', text: '#92400E', dot: Colors.warning },
  danger:  { bg: '#FEE2E2', text: '#991B1B', dot: Colors.danger },
  info:    { bg: '#DBEAFE', text: '#1E40AF', dot: Colors.info },
  neutral: { bg: Colors.surface, text: Colors.textSecondary, dot: Colors.textMuted },
  pink:    { bg: '#FCE7F3', text: '#9D174D', dot: Colors.pinkRide },
  primary: { bg: Colors.mint, text: Colors.primary, dot: Colors.primary },
};

const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  label,
  size = 'md',
  dot = false,
  style,
}) => {
  const config = variantConfig[variant];
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.base,
        isSmall ? styles.small : styles.medium,
        { backgroundColor: config.bg },
        style,
      ]}
    >
      {dot && (
        <View
          style={[
            styles.dot,
            { backgroundColor: config.dot },
          ]}
        />
      )}
      <Typography
        variant="xs"
        weight="semiBold"
        color={config.text}
        style={{ fontSize: isSmall ? FontSize.xs : FontSize.caption }}
      >
        {label}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.full,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
  },
  medium: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.xs,
  },
});

export default Badge;

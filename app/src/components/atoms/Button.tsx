/**
 * Atom: Button
 *
 * The single reusable button component for KeralaGo.
 * All CTAs across Customer, Driver, and Admin MUST use this component.
 *
 * Variants: primary | secondary | outline | ghost | danger | fab
 * Sizes: sm | md | lg
 */

import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  ActivityIndicator,
  View,
} from 'react-native';
import Typography from './Typography';
import { Colors, Spacing, Radii, FontSize, FontWeight, Shadows } from '../../constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'fab';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Button label text */
  label?: string;
  /** Show spinner instead of label */
  loading?: boolean;
  /** Disable interaction */
  disabled?: boolean;
  /** Optional icon node on the left of label */
  leftIcon?: React.ReactNode;
  /** Optional icon node on the right of label */
  rightIcon?: React.ReactNode;
  /** Full width */
  fullWidth?: boolean;
  /** Override container style */
  style?: ViewStyle;
  /** Override label style */
  labelStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  label,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  labelStyle,
  children,
  ...rest
}) => {
  const containerStyle: StyleProp<ViewStyle> = [
    styles.base,
    styles[`variant_${variant}`],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const labelColor = getLabelColor(variant, disabled);

  return (
    <TouchableOpacity
      style={containerStyle}
      disabled={disabled || loading}
      activeOpacity={0.75}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? Colors.white : Colors.primary}
        />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          {label ? (
            <Typography
              variant={size === 'sm' ? 'label' : 'body1'}
              weight="semiBold"
              color={labelColor}
              style={labelStyle}
            >
              {label}
            </Typography>
          ) : (
            children
          )}
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

function getLabelColor(variant: ButtonVariant, disabled: boolean): string {
  if (disabled) return Colors.textMuted;
  switch (variant) {
    case 'primary':    return Colors.white;
    case 'secondary':  return Colors.primary;
    case 'outline':    return Colors.primary;
    case 'ghost':      return Colors.primary;
    case 'danger':     return Colors.white;
    case 'fab':        return Colors.white;
    default:           return Colors.white;
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: { marginRight: Spacing.sm },
  iconRight: { marginLeft: Spacing.sm },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.45 },

  // Variants
  variant_primary: {
    backgroundColor: Colors.primary,
    ...Shadows.sm,
  },
  variant_secondary: {
    backgroundColor: Colors.mint,
    borderWidth: 0,
  },
  variant_outline: {
    backgroundColor: Colors.transparent,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  variant_ghost: {
    backgroundColor: Colors.transparent,
  },
  variant_danger: {
    backgroundColor: Colors.danger,
    ...Shadows.sm,
  },
  variant_fab: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
    ...Shadows.float,
  },

  // Sizes
  size_sm: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    minHeight: 32,
  },
  size_md: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    minHeight: 48,
  },
  size_lg: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.base,
    minHeight: 56,
  },
});

export default Button;

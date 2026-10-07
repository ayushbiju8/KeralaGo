/**
 * Atom: Typography
 *
 * The single text rendering component for KeralaGo.
 * All text across Customer, Driver, and Admin MUST use this component.
 *
 * Variants: h1 | h2 | h3 | h4 | body1 | body2 | caption | label | xs
 */

import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import { Colors, FontSize, FontWeight, LineHeight } from '../../constants/theme';

export type TypographyVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body1' | 'body2' | 'caption' | 'label' | 'xs';
export type TypographyWeight = 'regular' | 'medium' | 'semiBold' | 'bold' | 'extraBold';
export type TypographyAlign = 'left' | 'center' | 'right';

export interface TypographyProps extends Omit<TextProps, 'style'> {
  /** Semantic variant */
  variant?: TypographyVariant;
  /** Font weight override */
  weight?: TypographyWeight;
  /** Text color (hex or Colors key value) */
  color?: string;
  /** Text alignment */
  align?: TypographyAlign;
  /** Line clamp */
  numberOfLines?: number;
  /** Additional styles */
  style?: TextStyle | TextStyle[];
  children: React.ReactNode;
}

const variantStyles: Record<TypographyVariant, TextStyle> = {
  h1: {
    fontSize: FontSize.h1,
    fontWeight: FontWeight.bold,
    lineHeight: FontSize.h1 * LineHeight.tight,
    color: Colors.textPrimary,
  },
  h2: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    lineHeight: FontSize.h2 * LineHeight.tight,
    color: Colors.textPrimary,
  },
  h3: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semiBold,
    lineHeight: FontSize.h3 * LineHeight.normal,
    color: Colors.textPrimary,
  },
  h4: {
    fontSize: FontSize.h4,
    fontWeight: FontWeight.semiBold,
    lineHeight: FontSize.h4 * LineHeight.normal,
    color: Colors.textPrimary,
  },
  body1: {
    fontSize: FontSize.body1,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.body1 * LineHeight.normal,
    color: Colors.textPrimary,
  },
  body2: {
    fontSize: FontSize.body2,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.body2 * LineHeight.normal,
    color: Colors.textSecondary,
  },
  caption: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.caption * LineHeight.relaxed,
    color: Colors.textMuted,
  },
  label: {
    fontSize: FontSize.label,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.label * LineHeight.normal,
    color: Colors.textSecondary,
  },
  xs: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.xs * LineHeight.normal,
    color: Colors.textMuted,
  },
};

const weightMap: Record<TypographyWeight, TextStyle['fontWeight']> = {
  regular: FontWeight.regular,
  medium: FontWeight.medium,
  semiBold: FontWeight.semiBold,
  bold: FontWeight.bold,
  extraBold: FontWeight.extraBold,
};

const Typography: React.FC<TypographyProps> = ({
  variant = 'body1',
  weight,
  color,
  align,
  numberOfLines,
  style,
  children,
  ...rest
}) => {
  const computed: TextStyle = {
    ...variantStyles[variant],
    ...(weight && { fontWeight: weightMap[weight] }),
    ...(color && { color }),
    ...(align && { textAlign: align }),
  };

  return (
    <Text
      style={[computed, ...(Array.isArray(style) ? style : [style])]}
      numberOfLines={numberOfLines}
      {...rest}
    >
      {children}
    </Text>
  );
};

export default Typography;

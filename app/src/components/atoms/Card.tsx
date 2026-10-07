/**
 * Atom: Card
 *
 * Base surface container with ambient shadow, rounded corners, and white background.
 * Used as the foundational wrapper for all elevated content blocks.
 *
 * Every list card, modal panel, and info block across KeralaGo MUST use this atom.
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Colors, Radii, Shadows, RadiusKey, ShadowKey } from '../../constants/theme';

export interface CardProps {
  /** Card content */
  children: React.ReactNode;
  /** Shadow intensity */
  shadow?: ShadowKey;
  /** Border radius key */
  radius?: RadiusKey;
  /** Background color override */
  backgroundColor?: string;
  /** Make card tappable */
  onPress?: TouchableOpacityProps['onPress'];
  /** Active press opacity (when onPress is provided) */
  activeOpacity?: number;
  /** Show a border */
  bordered?: boolean;
  /** Border color */
  borderColor?: string;
  /** Override style */
  style?: StyleProp<ViewStyle>;
}

const Card: React.FC<CardProps> = ({
  children,
  shadow = 'sm',
  radius = 'lg',
  backgroundColor = Colors.surfaceCard,
  onPress,
  activeOpacity = 0.8,
  bordered = false,
  borderColor = Colors.border,
  style,
}) => {
  const containerStyle: StyleProp<ViewStyle> = [
    styles.base,
    Shadows[shadow] as ViewStyle,
    {
      borderRadius: Radii[radius],
      backgroundColor,
    },
    bordered && { borderWidth: 1, borderColor },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={containerStyle} onPress={onPress} activeOpacity={activeOpacity}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surfaceCard,
    overflow: 'hidden',
  },
});

export default Card;

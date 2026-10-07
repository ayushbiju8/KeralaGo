/**
 * Atom: Divider
 *
 * Hairline separator. Used between list items, profile sections, settings rows.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing } from '../../constants/theme';

export interface DividerProps {
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Color override */
  color?: string;
  /** Margin around the divider (vertical margin for horizontal, horizontal for vertical) */
  spacing?: number;
  /** Override style */
  style?: ViewStyle;
}

const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  color = Colors.border,
  spacing = 0,
  style,
}) => {
  if (orientation === 'vertical') {
    return (
      <View
        style={[
          styles.vertical,
          { backgroundColor: color, marginHorizontal: spacing },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.horizontal,
        { backgroundColor: color, marginVertical: spacing },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  horizontal: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
  },
  vertical: {
    height: '100%',
    width: StyleSheet.hairlineWidth,
  },
});

export default Divider;

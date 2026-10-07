/**
 * Atom: Radio
 *
 * Green radio button for single selection.
 * Used in: PaymentOptionItem, SegmentTabs (radio mode), Schedule repeat.
 */

import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle } from 'react-native';
import Typography from './Typography';
import { Colors, Spacing, Radii } from '../../constants/theme';

export interface RadioProps {
  /** Whether this option is selected */
  selected: boolean;
  /** Label displayed next to the radio */
  label?: string;
  /** Selection change callback */
  onSelect?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Container style */
  style?: ViewStyle;
}

const Radio: React.FC<RadioProps> = ({
  selected,
  label,
  onSelect,
  disabled = false,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.row, style]}
      onPress={onSelect}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={[styles.outer, selected && styles.outerSelected]}>
        {selected && <View style={styles.inner} />}
      </View>
      {label && (
        <Typography
          variant="body2"
          color={disabled ? Colors.textMuted : Colors.textPrimary}
          style={{ marginLeft: Spacing.sm }}
        >
          {label}
        </Typography>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  outer: {
    width: 20,
    height: 20,
    borderRadius: Radii.full,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerSelected: {
    borderColor: Colors.primary,
  },
  inner: {
    width: 10,
    height: 10,
    borderRadius: Radii.full,
    backgroundColor: Colors.primary,
  },
});

export default Radio;

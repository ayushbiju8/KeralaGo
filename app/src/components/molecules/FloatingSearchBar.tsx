/**
 * Molecule: FloatingSearchBar
 *
 * The prominent search pill at the top of the Customer home screen.
 * Composed of: Icon (search) + Typography (placeholder) + pill button ("Now ▼")
 *
 * Reference: Customer Home Map Interface (top search bar)
 */

import React from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Icon from '../atoms/Icon';
import Typography from '../atoms/Typography';
import { Colors, Spacing, Radii, Shadows } from '../../constants/theme';

export interface FloatingSearchBarProps {
  /** Placeholder text */
  placeholder?: string;
  /** Schedule/time selector label */
  timeLabel?: string;
  /** Called when the bar is tapped */
  onPress?: () => void;
  /** Called when the time selector is tapped */
  onTimeSelectorPress?: () => void;
  /** Override container style */
  style?: ViewStyle;
}

const FloatingSearchBar: React.FC<FloatingSearchBarProps> = ({
  placeholder = 'Where do you want to go?',
  timeLabel = 'Now',
  onPress,
  onTimeSelectorPress,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Search icon */}
      <Icon library="Ionicons" name="search" size="md" color={Colors.primary} />

      {/* Placeholder text */}
      <Typography
        variant="body1"
        color={Colors.textMuted}
        style={styles.placeholder}
        numberOfLines={1}
      >
        {placeholder}
      </Typography>

      {/* Time selector pill */}
      <TouchableOpacity
        style={styles.timePill}
        onPress={onTimeSelectorPress}
        activeOpacity={0.8}
      >
        <Icon library="Ionicons" name="time" size="sm" color={Colors.white} />
        <Typography
          variant="label"
          weight="semiBold"
          color={Colors.white}
          style={{ marginLeft: Spacing.xs }}
        >
          {timeLabel}
        </Typography>
        <Icon library="Ionicons" name="chevron-down" size="sm" color={Colors.white} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    ...Shadows.md,
  },
  placeholder: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
});

export default FloatingSearchBar;

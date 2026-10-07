/**
 * Atom: RatingStar
 *
 * Displays a star rating row with score and optional trip count.
 * Used in: DriverCard, CustomerProfile, TripCompleted, UserListItem.
 *
 * Modes:
 *   display — read-only stars with score text (e.g. "4.8 ★ (320 trips)")
 *   interactive — tappable star selection (e.g. rate your driver)
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Icon from './Icon';
import Typography from './Typography';
import { Colors, Spacing, IconSize } from '../../constants/theme';

export interface RatingStarProps {
  /** Current rating value (1–5) */
  value: number;
  /** Max stars */
  max?: number;
  /** Star icon size */
  size?: number;
  /** Show numeric score alongside stars */
  showScore?: boolean;
  /** Show trip count alongside */
  tripCount?: number;
  /** Interactive mode (tappable) */
  interactive?: boolean;
  /** Callback when a star is tapped */
  onRate?: (rating: number) => void;
  /** Container style */
  style?: ViewStyle;
}

const RatingStar: React.FC<RatingStarProps> = ({
  value,
  max = 5,
  size = IconSize.sm,
  showScore = false,
  tripCount,
  interactive = false,
  onRate,
  style,
}) => {
  return (
    <View style={[styles.row, style]}>
      {showScore && (
        <Typography
          variant="body2"
          weight="semiBold"
          color={Colors.textPrimary}
          style={{ marginRight: Spacing.xs }}
        >
          {value.toFixed(1)}
        </Typography>
      )}

      {Array.from({ length: max }, (_, i) => {
        const filled = i + 1 <= value;
        const half = !filled && i + 0.5 < value;

        const starName = filled ? 'star' : half ? 'star-half' : 'star-outline';
        const starColor = filled || half ? Colors.warning : Colors.border;

        if (interactive) {
          return (
            <TouchableOpacity
              key={i}
              onPress={() => onRate?.(i + 1)}
              activeOpacity={0.7}
              style={styles.starTouch}
            >
              <Icon
                library="Ionicons"
                name={starName}
                size={size}
                color={starColor}
              />
            </TouchableOpacity>
          );
        }

        return (
          <Icon
            key={i}
            library="Ionicons"
            name={starName}
            size={size}
            color={starColor}
            style={styles.star}
          />
        );
      })}

      {tripCount !== undefined && (
        <Typography
          variant="caption"
          color={Colors.textMuted}
          style={{ marginLeft: Spacing.xs }}
        >
          ({tripCount} trips)
        </Typography>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginHorizontal: 1,
  },
  starTouch: {
    marginHorizontal: 2,
    padding: 2,
  },
});

export default RatingStar;

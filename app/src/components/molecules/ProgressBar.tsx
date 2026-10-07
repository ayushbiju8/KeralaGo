/**
 * Molecule: ProgressBar
 *
 * Animated progress bar.
 * Used in:
 *  - Driver Home: "Today's Progress" bar
 *  - Customer active trip: trip progress tracker
 *
 * Reference: Driver Home — Today's Progress with gift milestone icon
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import Typography from '../atoms/Typography';
import { Colors, Spacing, Radii } from '../../constants/theme';

export interface ProgressBarProps {
  /** Progress value 0 to 1 */
  progress: number;
  /** Active fill color */
  color?: string;
  /** Track background color */
  trackColor?: string;
  /** Bar height */
  height?: number;
  /** Optional label above the bar */
  label?: string;
  /** Show percentage text */
  showPercentage?: boolean;
  /** Override container style */
  style?: ViewStyle;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = Colors.primary,
  trackColor = Colors.mintDark,
  height = 8,
  label,
  showPercentage = false,
  style,
}) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const clamped = Math.max(0, Math.min(1, progress));

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: clamped,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [clamped]);

  return (
    <View style={style}>
      {(label || showPercentage) && (
        <View style={styles.labelRow}>
          {label && (
            <Typography variant="label" color={Colors.textSecondary}>
              {label}
            </Typography>
          )}
          {showPercentage && (
            <Typography variant="caption" weight="semiBold" color={Colors.primary}>
              {Math.round(clamped * 100)}%
            </Typography>
          )}
        </View>
      )}
      <View style={[styles.track, { height, backgroundColor: trackColor, borderRadius: height / 2 }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              height,
              borderRadius: height / 2,
              backgroundColor: color,
              width: animatedWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  track: {
    overflow: 'hidden',
    width: '100%',
  },
  fill: {},
});

export default ProgressBar;

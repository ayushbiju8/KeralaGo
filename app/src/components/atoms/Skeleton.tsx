/**
 * Atom: Skeleton
 *
 * Lightweight, accessible, high-performance shimmer/skeleton placeholder.
 * Replaces blank or broken visual states while content or images are loading.
 *
 * Variants:
 * - rect: Standard rectangular content block
 * - circle: Circular container (avatars, icons, badges)
 * - text: Pill-shaped single line of typography
 * - card: Full container block with subtle border and elevation
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  ViewStyle,
  DimensionValue,
} from 'react-native';
import { Colors, Radii } from '../../constants/theme';

export type SkeletonVariant = 'rect' | 'circle' | 'text' | 'card';
export type SkeletonColorScheme = 'neutral' | 'mint' | 'light';

export interface SkeletonProps {
  /** Width of the skeleton item */
  width?: DimensionValue;
  /** Height of the skeleton item */
  height?: DimensionValue;
  /** Explicit border radius */
  borderRadius?: number;
  /** Visual variant type */
  variant?: SkeletonVariant;
  /** Color theme palette */
  colorScheme?: SkeletonColorScheme;
  /** Custom container style override */
  style?: ViewStyle | ViewStyle[];
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius,
  variant = 'rect',
  colorScheme = 'neutral',
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  // Interpolate opacity to create smooth, natural shimmer pulse
  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.38, 0.85],
  });

  // Calculate default border radius based on variant
  let computedRadius: number = Radii.md;
  if (borderRadius !== undefined) {
    computedRadius = borderRadius;
  } else if (variant === 'circle') {
    computedRadius = 999;
  } else if (variant === 'text') {
    computedRadius = Radii.sm;
  } else if (variant === 'card') {
    computedRadius = Radii.xl;
  }

  // Base background color selection
  let baseColor = '#E2E8F0';
  if (colorScheme === 'mint') {
    baseColor = '#E8F5E9';
  } else if (colorScheme === 'light') {
    baseColor = '#F1F5F9';
  }

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height: variant === 'circle' && typeof width === 'number' && height === 16 ? width : height,
          borderRadius: computedRadius,
          backgroundColor: baseColor,
          opacity,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
});

export default Skeleton;

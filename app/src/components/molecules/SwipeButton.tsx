/**
 * Molecule: SwipeButton
 *
 * A tactile swipe-to-confirm action slider for driver ride lifecycle execution
 * (e.g., "Arrived at Pickup", "Start Trip", "End Trip").
 *
 * Features:
 *  - Native PanResponder tracking with live-updating ref closures (prevents stale width bugs).
 *  - Supports both full rightward gesture swiping and tap-to-slide execution.
 *  - Smooth knob translation and active color trail.
 *  - Auto-resets on stage/label changes.
 *  - Scaled large dimensions (64pt height, 54pt knob) for comfortable thumb interaction.
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Animated,
  ViewStyle,
  LayoutChangeEvent,
  Text,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Icon from '../atoms/Icon';
import { Colors, Shadows } from '../../constants/theme';

export interface SwipeButtonProps {
  /** Label displayed in the track */
  label: string;
  /** Callback invoked when swipe passes completion threshold */
  onSwipeComplete: () => void;
  /** Visual variant: 'green' (default) or 'red' */
  variant?: 'green' | 'red';
  /** Custom icon node inside the circular knob */
  knobIcon?: React.ReactNode;
  /** Slider height in points (default 64) */
  height?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Container style overrides */
  style?: ViewStyle;
}

const DEFAULT_HEIGHT = 64;
const TRACK_PADDING = 5;
const SCREEN_WIDTH = Dimensions.get('window').width;

const SwipeButton: React.FC<SwipeButtonProps> = ({
  label,
  onSwipeComplete,
  variant = 'green',
  knobIcon,
  height = DEFAULT_HEIGHT,
  disabled = false,
  style,
}) => {
  // Approximate default track width until onLayout fires
  const initialWidth = SCREEN_WIDTH - 32;
  const [trackWidth, setTrackWidth] = useState(initialWidth);
  const pan = useRef(new Animated.Value(0)).current;

  const knobSize = height - TRACK_PADDING * 2;
  const calculatedMaxSwipe = Math.max(50, trackWidth - knobSize - TRACK_PADDING * 2);

  // Live mutable refs to prevent stale closure bugs in PanResponder
  const maxSwipeRef = useRef(calculatedMaxSwipe);
  const onSwipeCompleteRef = useRef(onSwipeComplete);
  const disabledRef = useRef(disabled);
  const isCompletedRef = useRef(false);

  // Keep refs synchronized on every render
  maxSwipeRef.current = calculatedMaxSwipe;
  onSwipeCompleteRef.current = onSwipeComplete;
  disabledRef.current = disabled;

  // Reset slider position whenever label changes (e.g. advancing from Stage 2 to Stage 3)
  useEffect(() => {
    isCompletedRef.current = false;
    pan.setValue(0);
  }, [label, pan]);

  const triggerCompletion = (duration = 180) => {
    isCompletedRef.current = true;
    Animated.timing(pan, {
      toValue: maxSwipeRef.current,
      duration,
      useNativeDriver: false,
    }).start(() => {
      onSwipeCompleteRef.current?.();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current && !isCompletedRef.current,
      onMoveShouldSetPanResponder: (_, gesture) =>
        !disabledRef.current &&
        !isCompletedRef.current &&
        (Math.abs(gesture.dx) > 3 || Math.abs(gesture.vx) > 0.1),

      onPanResponderMove: (_, gesture) => {
        if (disabledRef.current || isCompletedRef.current) return;
        const max = maxSwipeRef.current;
        if (max <= 0) return;

        // Rightward clamped drag
        if (gesture.dx > 0) {
          const clamped = Math.min(gesture.dx, max);
          pan.setValue(clamped);
        } else {
          pan.setValue(0);
        }
      },

      onPanResponderRelease: (_, gesture) => {
        if (disabledRef.current || isCompletedRef.current) return;
        const max = maxSwipeRef.current;
        const threshold = max * 0.40; // 40% swipe threshold or fast velocity

        // 1. Swiped past threshold or flicked with rightward velocity
        if (gesture.dx >= threshold || gesture.vx > 0.6) {
          triggerCompletion(160);
          return;
        }

        // 2. Direct tap on button without dragging (effortless fallback)
        if (Math.abs(gesture.dx) < 6 && Math.abs(gesture.dy) < 6) {
          triggerCompletion(240);
          return;
        }

        // 3. Otherwise snap back to start
        Animated.spring(pan, {
          toValue: 0,
          bounciness: 6,
          useNativeDriver: false,
        }).start();
      },

      onPanResponderTerminate: () => {
        if (!isCompletedRef.current) {
          Animated.spring(pan, {
            toValue: 0,
            bounciness: 6,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && Math.abs(width - trackWidth) > 2) {
      setTrackWidth(width);
      maxSwipeRef.current = Math.max(50, width - knobSize - TRACK_PADDING * 2);
    }
  };

  const isGreen = variant === 'green';
  const trackBgColor = isGreen ? '#0F4A2B' : '#DC2626';

  // Label text fades smoothly as knob moves rightward
  const labelOpacity = pan.interpolate({
    inputRange: [0, Math.max(1, calculatedMaxSwipe * 0.5), Math.max(2, calculatedMaxSwipe)],
    outputRange: [1, 0.4, 0.05],
    extrapolate: 'clamp',
  });

  // Highlight fill following the sliding knob
  const fillWidth = pan.interpolate({
    inputRange: [0, Math.max(1, calculatedMaxSwipe)],
    outputRange: [knobSize + TRACK_PADDING * 2, trackWidth],
    extrapolate: 'clamp',
  });

  return (
    <View
      onLayout={handleLayout}
      {...panResponder.panHandlers}
      style={[
        styles.track,
        {
          height,
          borderRadius: height / 2,
          backgroundColor: trackBgColor,
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      {/* Animated swipe fill behind the knob */}
      <Animated.View
        style={[
          styles.fillTrack,
          {
            width: fillWidth,
            height,
            borderRadius: height / 2,
            backgroundColor: isGreen ? '#166534' : '#B91C1C',
          },
        ]}
      />

      {/* Centered Track Label & Swipe Hint Arrows */}
      <Animated.View style={[styles.labelContainer, { opacity: labelOpacity }]}>
        <Text style={styles.labelText}>{label}</Text>
        <View style={styles.hintChevrons}>
          <Icon library="Ionicons" name="chevron-forward" size={15} color="rgba(255, 255, 255, 0.45)" />
          <Icon library="Ionicons" name="chevron-forward" size={15} color="rgba(255, 255, 255, 0.85)" style={{ marginLeft: -7 }} />
        </View>
      </Animated.View>

      {/* Draggable & Animatable Circular Knob */}
      <Animated.View
        style={[
          styles.knob,
          {
            width: knobSize,
            height: knobSize,
            borderRadius: knobSize / 2,
            top: TRACK_PADDING,
            left: TRACK_PADDING,
            transform: [{ translateX: pan }],
          },
        ]}
      >
        {knobIcon ?? (
          <Icon
            library="Ionicons"
            name="chevron-forward"
            size={24}
            color={isGreen ? '#166534' : '#DC2626'}
          />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    ...Shadows.md,
  },
  fillTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  labelContainer: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
  },
  labelText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  hintChevrons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
  },
  knob: {
    position: 'absolute',
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
    elevation: 6,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default SwipeButton;

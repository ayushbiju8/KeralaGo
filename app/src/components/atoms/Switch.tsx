/**
 * Atom: Switch
 *
 * Toggle switch with Kerala emerald active color.
 * Supports standard native switch and custom liquid glass glassmorphism variant.
 *
 * Used for: Online/Offline toggle (Driver), Notifications settings, App preferences.
 */

import React, { useRef, useEffect } from 'react';
import {
  Switch as RNSwitch,
  SwitchProps as RNSwitchProps,
  Platform,
  TouchableOpacity,
  View,
  StyleSheet,
  Animated,
} from 'react-native';
import { Colors } from '../../constants/theme';

export interface SwitchProps extends Omit<RNSwitchProps, 'trackColor' | 'thumbColor' | 'ios_backgroundColor'> {
  /** Current value */
  value: boolean;
  /** Change handler */
  onValueChange: (value: boolean) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Presentation variant: 'default' | 'glass' */
  variant?: 'default' | 'glass';
}

const Switch: React.FC<SwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
  variant = 'default',
  ...rest
}) => {
  const thumbAnim = useRef(new Animated.Value(value ? 22 : 2)).current;

  useEffect(() => {
    Animated.spring(thumbAnim, {
      toValue: value ? 22 : 2,
      useNativeDriver: true,
      bounciness: 6,
      speed: 14,
    }).start();
  }, [value, thumbAnim]);

  if (variant === 'glass') {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={disabled}
        onPress={() => onValueChange(!value)}
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled }}
        style={[
          styles.glassTrack,
          value ? styles.glassTrackActive : styles.glassTrackInactive,
          disabled && styles.disabled,
        ]}
      >
        {/* Top Liquid Glass Gloss Arc */}
        <View style={styles.glassGlossSheen} />

        {/* Animated 3D Liquid Glass Bead Thumb */}
        <Animated.View
          style={[
            styles.glassThumb,
            {
              transform: [{ translateX: thumbAnim }],
            },
          ]}
        >
          {/* Specular Bead Highlight */}
          <View style={styles.thumbGlossDot} />
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{
        false: Colors.border,
        true: Colors.primaryVibrant,
      }}
      thumbColor={Platform.OS === 'android' ? (value ? Colors.primary : Colors.white) : Colors.white}
      ios_backgroundColor={Colors.border}
      {...rest}
    />
  );
};

const styles = StyleSheet.create({
  glassTrack: {
    width: 51,
    height: 31,
    borderRadius: 16,
    position: 'relative',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.2,
  },
  glassTrackActive: {
    backgroundColor: '#34C759',
    borderTopColor: 'rgba(255, 255, 255, 0.60)',
    borderLeftColor: 'rgba(255, 255, 255, 0.35)',
    borderRightColor: 'rgba(255, 255, 255, 0.25)',
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.38,
    shadowRadius: 8,
    elevation: 4,
  },
  glassTrackInactive: {
    backgroundColor: 'rgba(120, 120, 128, 0.32)',
    borderTopColor: 'rgba(255, 255, 255, 0.30)',
    borderLeftColor: 'rgba(255, 255, 255, 0.18)',
    borderRightColor: 'rgba(255, 255, 255, 0.15)',
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  glassGlossSheen: {
    position: 'absolute',
    top: 1,
    left: 4,
    right: 4,
    height: 11,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  glassThumb: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 3.5,
    elevation: 4,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 3,
  },
  thumbGlossDot: {
    width: 7,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginLeft: 2,
    marginTop: 1,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Switch;

/**
 * Molecule: FloatingMapButton
 *
 * Circular elevated floating button displayed over the map.
 * Used for: Notification bell (with badge), Current Location target, SOS, Back arrow.
 *
 * Reference: Customer home map overlay buttons (bell, crosshair)
 *            Customer ride tracking (SOS, volume off)
 */

import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle } from 'react-native';
import Icon, { IconLibrary } from '../atoms/Icon';
import Typography from '../atoms/Typography';
import { Colors, Radii, Shadows, IconSize } from '../../constants/theme';

export interface FloatingMapButtonProps {
  /** Icon name */
  iconName: string;
  /** Icon library */
  iconLibrary?: IconLibrary;
  /** Icon size in pixels */
  iconSize?: number;
  /** Icon color */
  iconColor?: string;
  /** Button background color */
  backgroundColor?: string;
  /** Optional badge count (for notification bell) */
  badgeCount?: number;
  /** Button diameter */
  diameter?: number;
  /** Press handler */
  onPress?: () => void;
  /** Override container style */
  style?: ViewStyle;
}

const FloatingMapButton: React.FC<FloatingMapButtonProps> = ({
  iconName,
  iconLibrary = 'Ionicons',
  iconSize = IconSize.md,
  iconColor = Colors.textPrimary,
  backgroundColor = Colors.white,
  badgeCount,
  diameter = 44,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        Shadows.float as ViewStyle,
        {
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
          backgroundColor,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Icon library={iconLibrary} name={iconName} size={iconSize} color={iconColor} />

      {badgeCount !== undefined && badgeCount > 0 && (
        <View style={styles.badge}>
          <Typography variant="xs" weight="bold" color={Colors.white}>
            {badgeCount > 99 ? '99+' : badgeCount}
          </Typography>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
});

export default FloatingMapButton;

/**
 * Organism: NavigationHeader
 *
 * Consistent screen top header used across all KeralaGo screens.
 * Composed of: optional back button + title + optional right actions.
 *
 * Used in:
 *  - All Admin screens (Analytics, Management, Profile, Driver/Customer Detail)
 *  - All Driver screens (Earnings, Trips, Profile, Vehicle, Settings)
 *  - All Customer screens (Booking, Payment, Profile, Schedule, Safety)
 *
 * Reference: Virtually every detail and list screen in all 4 app showcases.
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Icon from '../atoms/Icon';
import Typography from '../atoms/Typography';
import { Colors, Spacing, Shadows } from '../../constants/theme';

export interface NavigationHeaderProps {
  /** Screen title */
  title: string;
  /** Show back arrow */
  showBack?: boolean;
  /** Back press handler */
  onBack?: () => void;
  /** Optional right action nodes (e.g. filter icon, edit button, 3-dot menu) */
  rightActions?: React.ReactNode;
  /** White/transparent vs. filled background */
  transparent?: boolean;
  /** Override container style */
  style?: ViewStyle;
}

const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  title,
  showBack = true,
  onBack,
  rightActions,
  transparent = false,
  style,
}) => {
  return (
    <View
      style={[
        styles.container,
        transparent ? styles.transparent : styles.solid,
        style,
      ]}
    >
      {/* Left: Back button */}
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <Icon library="Ionicons" name="chevron-back" size="lg" color={Colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Center: Title */}
      <Typography variant="h4" weight="semiBold" color={Colors.textPrimary} align="center" style={styles.title}>
        {title}
      </Typography>

      {/* Right: Actions */}
      <View style={styles.right}>
        {rightActions ?? <View style={styles.placeholder} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    minHeight: 56,
  },
  solid: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  transparent: {
    backgroundColor: Colors.transparent,
  },
  left: {
    width: 44,
    alignItems: 'flex-start',
  },
  backBtn: {
    padding: Spacing.xs,
    marginLeft: -Spacing.xs,
  },
  title: {
    flex: 1,
  },
  right: {
    width: 44,
    alignItems: 'flex-end',
  },
  placeholder: {
    width: 44,
  },
});

export default NavigationHeader;

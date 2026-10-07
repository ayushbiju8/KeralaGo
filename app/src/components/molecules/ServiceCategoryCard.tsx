/**
 * Molecule: ServiceCategoryCard
 *
 * Individual tile in the 2×4 service grid on the Customer Home screen.
 * Displays: icon/illustration container, service label, optional badge.
 *
 * Services: Ride, Bike, Auto, Pink Ride, Package, Share Taxi, Rentals, Schedule Ride
 *
 * Reference: Customer Home screen — "Suggestions" grid
 */

import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle } from 'react-native';
import Icon, { IconLibrary } from '../atoms/Icon';
import Typography from '../atoms/Typography';
import { Colors, Spacing, Radii, Shadows } from '../../constants/theme';

export interface ServiceCategoryCardProps {
  /** Service label */
  label: string;
  /** Ionicons icon name */
  iconName: string;
  /** Icon library */
  iconLibrary?: IconLibrary;
  /** Icon color */
  iconColor?: string;
  /** Icon container background */
  iconBg?: string;
  /** Optional badge content (e.g. pink shield for Pink Ride) */
  badge?: React.ReactNode;
  /** Press handler */
  onPress?: () => void;
  /** Override style */
  style?: ViewStyle;
}

const ServiceCategoryCard: React.FC<ServiceCategoryCardProps> = ({
  label,
  iconName,
  iconLibrary = 'Ionicons',
  iconColor = Colors.primary,
  iconBg = Colors.mint,
  badge,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Icon Container */}
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Icon library={iconLibrary} name={iconName} size="xl" color={iconColor} />
        {badge && <View style={styles.badgeWrap}>{badge}</View>}
      </View>

      {/* Label */}
      <Typography variant="label" weight="medium" color={Colors.textPrimary} align="center">
        {label}
      </Typography>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Shadows.xs,
  },
  badgeWrap: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
});

export default ServiceCategoryCard;

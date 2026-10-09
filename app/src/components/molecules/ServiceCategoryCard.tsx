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
import {
  TouchableOpacity,
  View,
  StyleSheet,
  ViewStyle,
  Image,
  ImageSourcePropType,
} from 'react-native';
import Icon, { IconLibrary } from '../atoms/Icon';
import Typography from '../atoms/Typography';
import { Colors, Spacing, Radii, Shadows } from '../../constants/theme';

export interface ServiceCategoryCardProps {
  /** Service label */
  label: string;
  /** Ionicons icon name */
  iconName?: string;
  /** Icon library */
  iconLibrary?: IconLibrary;
  /** Icon color */
  iconColor?: string;
  /** Icon container background */
  iconBg?: string;
  /** Optional badge content (e.g. pink shield for Pink Ride) */
  badge?: React.ReactNode;
  /** Optional image asset (e.g. 3D vehicle render) */
  imageSource?: ImageSourcePropType;
  /** Optional custom graphic element */
  customGraphic?: React.ReactNode;
  /** Press handler */
  onPress?: () => void;
  /** Override style */
  style?: ViewStyle;
}

const ServiceCategoryCard: React.FC<ServiceCategoryCardProps> = ({
  label,
  iconName = 'car',
  iconLibrary = 'Ionicons',
  iconColor = Colors.primary,
  iconBg = '#EDF8F1',
  badge,
  imageSource,
  customGraphic,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: iconBg }, style]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Top Graphic / Illustration */}
      <View style={styles.graphicWrap}>
        {imageSource ? (
          <Image source={imageSource} style={styles.imageAsset} resizeMode="contain" />
        ) : customGraphic ? (
          customGraphic
        ) : (
          <Icon library={iconLibrary} name={iconName} size={28} color={iconColor} />
        )}
      </View>

      {/* Optional Badge (e.g. pink shield on top right) */}
      {badge && <View style={styles.badgeWrap}>{badge}</View>}

      {/* Label */}
      <Typography
        variant="caption"
        weight="semiBold"
        color={Colors.textPrimary}
        align="center"
        numberOfLines={1}
        style={styles.label}
      >
        {label}
      </Typography>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '23%',
    height: 84,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: 2,
    position: 'relative',
  },
  graphicWrap: {
    width: 60,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageAsset: {
    width: 56,
    height: 42,
  },
  badgeWrap: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 2,
  },
  label: {
    marginTop: 2,
  },
});

export default ServiceCategoryCard;

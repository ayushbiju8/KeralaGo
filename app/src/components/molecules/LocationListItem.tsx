/**
 * Molecule: LocationListItem
 *
 * A single recent/saved location row in the customer's location history list.
 * Composed of: clock/pin icon in circular container + title + subtitle + chevron.
 *
 * Reference: Customer Home "Recent" list
 *            Customer Booking "Choose a ride" pickup/drop inputs
 */

import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle } from 'react-native';
import Icon, { IconLibrary } from '../atoms/Icon';
import Typography from '../atoms/Typography';
import Divider from '../atoms/Divider';
import { Colors, Spacing, Radii } from '../../constants/theme';

export type LocationListItemType = 'recent' | 'saved' | 'search';

export interface LocationListItemProps {
  /** Main location name */
  title: string;
  /** Sub-address detail */
  subtitle?: string;
  /** Icon type */
  iconName?: string;
  /** Icon library */
  iconLibrary?: IconLibrary;
  /** Icon background color */
  iconBg?: string;
  /** Icon color */
  iconColor?: string;
  /** Show divider below */
  showDivider?: boolean;
  /** Press handler */
  onPress?: () => void;
  /** Override style */
  style?: ViewStyle;
}

const LocationListItem: React.FC<LocationListItemProps> = ({
  title,
  subtitle,
  iconName = 'time-outline',
  iconLibrary = 'Ionicons',
  iconBg = Colors.surface,
  iconColor = Colors.textSecondary,
  showDivider = true,
  onPress,
  style,
}) => {
  return (
    <>
      <TouchableOpacity style={[styles.row, style]} onPress={onPress} activeOpacity={0.7}>
        {/* Icon circle */}
        <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
          <Icon library={iconLibrary} name={iconName} size="sm" color={iconColor} />
        </View>

        {/* Text */}
        <View style={styles.textBlock}>
          <Typography variant="body2" weight="medium" color={Colors.textPrimary} numberOfLines={1}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="caption" color={Colors.textMuted} numberOfLines={1}>
              {subtitle}
            </Typography>
          ) : null}
        </View>

        {/* Chevron */}
        <Icon library="Ionicons" name="chevron-forward" size="sm" color={Colors.textMuted} />
      </TouchableOpacity>

      {showDivider && <Divider style={styles.divider} />}
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  textBlock: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  divider: {
    marginLeft: 36 + Spacing.md,
  },
});

export default LocationListItem;

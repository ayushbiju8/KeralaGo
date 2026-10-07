/**
 * Molecule: RoutePointRow
 *
 * Displays the connected pickup and dropoff location points
 * with a vertical connector line between them.
 *
 * Used in:
 *  - Customer ride booking: "M B Hostel → Mar Athanasius College"
 *  - Driver incoming ride request: pickup address + drop address
 *  - Active ride bottom sheet: route display
 *  - Schedule Ride screen
 *
 * Reference: All ride booking and driver screens
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Icon from '../atoms/Icon';
import Typography from '../atoms/Typography';
import { Colors, Spacing, Radii } from '../../constants/theme';

export interface RoutePointRowProps {
  /** Pickup location name */
  pickup: string;
  /** Pickup sub-address */
  pickupSub?: string;
  /** Dropoff location name */
  dropoff: string;
  /** Dropoff sub-address */
  dropoffSub?: string;
  /** Show swap icon on right */
  showSwap?: boolean;
  /** Swap handler */
  onSwap?: () => void;
  /** Override container style */
  style?: ViewStyle;
}

const RoutePointRow: React.FC<RoutePointRowProps> = ({
  pickup,
  pickupSub,
  dropoff,
  dropoffSub,
  showSwap = false,
  onSwap,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Left: Visual connector */}
      <View style={styles.connector}>
        {/* Pickup circle */}
        <View style={styles.pickupDot} />
        {/* Line */}
        <View style={styles.line} />
        {/* Dropoff pin */}
        <Icon library="Ionicons" name="location-sharp" size="sm" color={Colors.danger} />
      </View>

      {/* Right: Text */}
      <View style={styles.textBlock}>
        {/* Pickup */}
        <View style={styles.locationRow}>
          <Typography variant="body2" weight="medium" color={Colors.textPrimary} numberOfLines={1}>
            {pickup}
          </Typography>
          {pickupSub ? (
            <Typography variant="caption" color={Colors.textMuted} numberOfLines={1}>
              {pickupSub}
            </Typography>
          ) : null}
        </View>

        <View style={styles.rowSpacer} />

        {/* Dropoff */}
        <View style={styles.locationRow}>
          <Typography variant="body2" weight="medium" color={Colors.textPrimary} numberOfLines={1}>
            {dropoff}
          </Typography>
          {dropoffSub ? (
            <Typography variant="caption" color={Colors.textMuted} numberOfLines={1}>
              {dropoffSub}
            </Typography>
          ) : null}
        </View>
      </View>

      {/* Swap icon */}
      {showSwap && (
        <Icon
          library="Ionicons"
          name="swap-vertical"
          size="md"
          color={Colors.textSecondary}
          style={styles.swapIcon}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  connector: {
    width: 20,
    alignItems: 'center',
    marginRight: Spacing.md,
    paddingTop: 2,
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: Radii.full,
    backgroundColor: Colors.primaryVibrant,
    borderWidth: 2,
    borderColor: Colors.white,
    // Ring
    shadowColor: Colors.primaryVibrant,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  textBlock: {
    flex: 1,
    justifyContent: 'space-between',
  },
  locationRow: {
    flex: 1,
    justifyContent: 'center',
  },
  rowSpacer: {
    height: Spacing.md,
  },
  swapIcon: {
    marginLeft: Spacing.sm,
    alignSelf: 'center',
  },
});

export default RoutePointRow;

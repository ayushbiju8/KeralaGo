/**
 * Organism: TripHistoryItem
 *
 * A single row in the bookings / trip history list.
 * Shows: trip ID, time ago, pickup → drop route, fare, status badge.
 *
 * Used in:
 *  - Customer Bookings screen (Recent tab)
 *  - Driver Trips screen (today/yesterday sections)
 *  - Admin Dashboard "Recent Ride Activity"
 *
 * Reference: Customer Bookings, Driver Trips, Admin Dashboard
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Icon from '../atoms/Icon';
import Typography from '../atoms/Typography';
import Badge, { BadgeVariant } from '../atoms/Badge';
import Divider from '../atoms/Divider';
import { Colors, Spacing, Radii } from '../../constants/theme';

export interface TripHistoryItemProps {
  /** Trip ID e.g. "#KG4582" */
  tripId: string;
  /** Time text e.g. "Today, 10:15 AM" or "2 min ago" */
  timeText: string;
  /** Pickup name */
  pickup: string;
  /** Dropoff name */
  dropoff: string;
  /** Fare amount */
  fare: number;
  /** Status variant */
  statusVariant?: BadgeVariant;
  /** Status label */
  statusLabel?: string;
  /** Show bottom divider */
  showDivider?: boolean;
  /** Press handler */
  onPress?: () => void;
  /** Override style */
  style?: ViewStyle;
}

const TripHistoryItem: React.FC<TripHistoryItemProps> = ({
  tripId,
  timeText,
  pickup,
  dropoff,
  fare,
  statusVariant = 'success',
  statusLabel = 'Completed',
  showDivider = true,
  onPress,
  style,
}) => {
  return (
    <>
      <TouchableOpacity style={[styles.row, style]} onPress={onPress} activeOpacity={0.75}>
        {/* Left: green location dot */}
        <View style={styles.dot} />

        {/* Info */}
        <View style={styles.info}>
          {/* Top row: ID + fare */}
          <View style={styles.topRow}>
            <Typography variant="label" weight="semiBold" color={Colors.primary}>
              {tripId}
            </Typography>
            <View style={styles.fareRow}>
              <Typography variant="body2" weight="bold" color={Colors.textPrimary}>
                ₹{fare}
              </Typography>
              {statusLabel && (
                <Badge variant={statusVariant} label={statusLabel} size="sm" style={{ marginLeft: Spacing.sm }} />
              )}
            </View>
          </View>

          {/* Route */}
          <View style={styles.routeRow}>
            <Icon library="Ionicons" name="location-sharp" size="xs" color={Colors.success} />
            <Typography variant="body2" color={Colors.textPrimary} numberOfLines={1} style={styles.routeText}>
              {pickup}
            </Typography>
          </View>
          <View style={[styles.routeRow, { marginTop: 2 }]}>
            <Icon library="Ionicons" name="flag" size="xs" color={Colors.danger} />
            <Typography variant="body2" color={Colors.textPrimary} numberOfLines={1} style={styles.routeText}>
              {dropoff}
            </Typography>
          </View>

          {/* Time */}
          <Typography variant="caption" color={Colors.textMuted} style={{ marginTop: Spacing.xs }}>
            {timeText}
          </Typography>
        </View>

        <Icon library="Ionicons" name="chevron-forward" size="sm" color={Colors.textMuted} />
      </TouchableOpacity>

      {showDivider && <Divider />}
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: Radii.full,
    backgroundColor: Colors.primary,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  fareRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  routeText: {
    flex: 1,
  },
});

export default TripHistoryItem;

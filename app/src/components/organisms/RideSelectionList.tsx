/**
 * Organism: RideSelectionList
 *
 * The "Choose a ride" list where customers select a vehicle type.
 * Each row shows: vehicle icon, service name, ETA, price range, selected border.
 *
 * Services: Car, Bike, Auto, Share Taxi, Pink Ride (women-only)
 *
 * Reference: Customer Booking — "Choose a ride" bottom sheet (2nd screen)
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle, FlatList } from 'react-native';
import Icon, { IconLibrary } from '../atoms/Icon';
import Typography from '../atoms/Typography';
import Badge from '../atoms/Badge';
import Card from '../atoms/Card';
import { Colors, Spacing, Radii } from '../../constants/theme';

export interface RideOption {
  id: string;
  label: string;
  iconName: string;
  iconLibrary?: IconLibrary;
  iconColor?: string;
  etaMinutes: number;
  priceMin: number;
  priceMax: number;
  /** For Pink Ride — women only label */
  womensOnly?: boolean;
  disabled?: boolean;
}

export interface RideSelectionListProps {
  /** Ride options to display */
  options: RideOption[];
  /** Currently selected option id */
  selectedId?: string;
  /** Selection change handler */
  onSelect: (id: string) => void;
  /** Override container style */
  style?: ViewStyle;
}

const RideSelectionList: React.FC<RideSelectionListProps> = ({
  options,
  selectedId,
  onSelect,
  style,
}) => {
  return (
    <View style={style}>
      {options.map((item) => {
        const isSelected = item.id === selectedId;

        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.row,
              isSelected && styles.rowSelected,
            ]}
            onPress={() => onSelect(item.id)}
            activeOpacity={0.8}
            disabled={item.disabled}
          >
            {/* Vehicle icon */}
            <View style={[styles.iconWrap, item.womensOnly && { backgroundColor: '#FCE7F3' }]}>
              <Icon
                library={item.iconLibrary ?? 'MaterialCommunityIcons'}
                name={item.iconName}
                size="xl"
                color={item.womensOnly ? Colors.pinkRide : (item.iconColor ?? Colors.primary)}
              />
            </View>

            {/* Info */}
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Typography variant="body2" weight="semiBold" color={Colors.textPrimary}>
                  {item.label}
                </Typography>
                {item.womensOnly && (
                  <Badge variant="pink" label="Women only" size="sm" style={{ marginLeft: Spacing.sm }} />
                )}
              </View>
              <Typography variant="caption" color={Colors.textMuted}>
                {item.etaMinutes} min away
              </Typography>
            </View>

            {/* Price */}
            <Typography variant="body2" weight="semiBold" color={Colors.textPrimary}>
              ₹{item.priceMin}–{item.priceMax}
            </Typography>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    borderColor: Colors.transparent,
    backgroundColor: Colors.surface,
  },
  rowSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.mintLight,
  },
  iconWrap: {
    width: 60,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.mint,
    borderRadius: Radii.md,
    marginRight: Spacing.md,
  },
  info: {
    flex: 1,
    marginRight: Spacing.sm,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default RideSelectionList;

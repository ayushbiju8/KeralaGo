/**
 * Molecule: SegmentTabs
 *
 * Segmented control tab switcher with a sliding pill indicator.
 *
 * Used in:
 *  - Driver Earnings: "Daily" | "Weekly" | "Monthly"
 *  - Driver Trips: "Completed" | "Cancelled"
 *  - Admin Analytics: date range pickers
 *  - Customer Bookings: "Recent" | "Scheduled"
 *
 * Reference: Driver Earnings/Trips screens, Customer Bookings tabs
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Typography from '../atoms/Typography';
import { Colors, Spacing, Radii, Shadows } from '../../constants/theme';

export interface SegmentOption {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
}

export interface SegmentTabsProps {
  /** Tab options */
  options: SegmentOption[];
  /** Currently selected tab id */
  selectedId: string;
  /** Selection change handler */
  onSelect: (id: string) => void;
  /** Override container style */
  style?: ViewStyle;
}

const SegmentTabs: React.FC<SegmentTabsProps> = ({
  options,
  selectedId,
  onSelect,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {options.map((opt) => {
        const isActive = opt.id === selectedId;
        return (
          <TouchableOpacity
            key={opt.id}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onSelect(opt.id)}
            activeOpacity={0.8}
          >
            <Typography
              variant="label"
              weight={isActive ? 'semiBold' : 'regular'}
              color={isActive ? Colors.primary : Colors.textMuted}
            >
              {opt.label}
            </Typography>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radii.full,
    padding: 3,
    alignSelf: 'flex-start',
  },
  tab: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radii.full,
  },
  tabActive: {
    backgroundColor: Colors.white,
    ...Shadows.xs,
  },
});

export default SegmentTabs;

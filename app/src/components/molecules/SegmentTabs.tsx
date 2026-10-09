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
  /** Visual variant: default (white pill), green (brand solid), mint (light green) */
  variant?: 'default' | 'green' | 'mint';
  /** Stretch tabs equally across full width (default true) */
  fullWidth?: boolean;
  /** Override container style */
  style?: ViewStyle;
}

const SegmentTabs: React.FC<SegmentTabsProps> = ({
  options,
  selectedId,
  onSelect,
  variant = 'default',
  fullWidth = true,
  style,
}) => {
  return (
    <View style={[styles.container, fullWidth && styles.containerFull, style]}>
      {options.map((opt) => {
        const isActive = opt.id === selectedId;

        let activeBg: string = Colors.white;
        let activeText: string = Colors.primary;

        if (variant === 'green') {
          activeBg = '#0F4A2B';
          activeText = Colors.white;
        } else if (variant === 'mint') {
          activeBg = '#DCFCE7';
          activeText = '#166534';
        }

        return (
          <TouchableOpacity
            key={opt.id}
            style={[
              styles.tab,
              fullWidth && styles.tabFull,
              isActive && { backgroundColor: activeBg, ...Shadows.xs },
            ]}
            onPress={() => onSelect(opt.id)}
            activeOpacity={0.8}
          >
            <Typography
              variant="label"
              weight={isActive ? 'semiBold' : 'regular'}
              color={isActive ? activeText : Colors.textSecondary}
              align={fullWidth ? 'center' : undefined}
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
    backgroundColor: '#F1F5F9',
    borderRadius: Radii.full,
    padding: 3,
    alignSelf: 'flex-start',
  },
  containerFull: {
    width: '100%',
    alignSelf: 'stretch',
  },
  tab: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs + 3,
    borderRadius: Radii.full,
  },
  tabFull: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: Colors.white,
    ...Shadows.xs,
  },
});

export default SegmentTabs;

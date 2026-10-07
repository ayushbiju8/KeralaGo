/**
 * Molecule: FilterPillBar
 *
 * Horizontal scrollable filter pills for list screens.
 *
 * Used in:
 *  - Admin Drivers screen: "All (185)", "Online (142)", "Offline (43)"
 *  - Admin Customers screen: "All (2,843)", "Active (2,610)", "Blocked (23)"
 *  - Admin Analytics tabs: "Overview", "Rides", "Drivers", "Customers"
 *  - Driver Bookings: "Completed" | "Cancelled"
 *
 * Reference: Admin Management screens, Driver trip list
 */

import React from 'react';
import { ScrollView, TouchableOpacity, StyleSheet, View, ViewStyle } from 'react-native';
import Typography from '../atoms/Typography';
import { Colors, Spacing, Radii } from '../../constants/theme';

export interface FilterPill {
  /** Unique pill identifier */
  id: string;
  /** Display label */
  label: string;
  /** Optional count to show in parens */
  count?: number;
}

export interface FilterPillBarProps {
  /** List of filter pills */
  pills: FilterPill[];
  /** Currently selected pill id */
  selectedId: string;
  /** Selection change handler */
  onSelect: (id: string) => void;
  /** Override container style */
  style?: ViewStyle;
}

const FilterPillBar: React.FC<FilterPillBarProps> = ({
  pills,
  selectedId,
  onSelect,
  style,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={style}
    >
      {pills.map((pill) => {
        const isSelected = pill.id === selectedId;
        return (
          <TouchableOpacity
            key={pill.id}
            style={[styles.pill, isSelected && styles.pillSelected]}
            onPress={() => onSelect(pill.id)}
            activeOpacity={0.75}
          >
            <Typography
              variant="label"
              weight={isSelected ? 'semiBold' : 'regular'}
              color={isSelected ? Colors.white : Colors.textSecondary}
            >
              {pill.label}
              {pill.count !== undefined ? ` (${pill.count.toLocaleString()})` : ''}
            </Typography>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
});

export default FilterPillBar;

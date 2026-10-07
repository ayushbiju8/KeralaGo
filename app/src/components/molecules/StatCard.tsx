/**
 * Molecule: StatCard
 *
 * Admin & Driver metric cards showing icon, title, large value, and trend pill.
 * Used in: Admin Dashboard stats (Active Rides, Online Drivers, Total Customers, Today's Revenue)
 *          Driver Home stats (Trips today, Earnings, Rating)
 *
 * Reference: Admin Dashboard top stats grid, Driver Home stats row
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Icon, { IconLibrary } from '../atoms/Icon';
import Typography from '../atoms/Typography';
import Badge from '../atoms/Badge';
import Card from '../atoms/Card';
import { Colors, Spacing, Radii } from '../../constants/theme';

export interface StatCardProps {
  /** Metric label */
  title: string;
  /** Primary metric value */
  value: string | number;
  /** Icon name */
  iconName: string;
  /** Icon library */
  iconLibrary?: IconLibrary;
  /** Icon color */
  iconColor?: string;
  /** Icon background */
  iconBg?: string;
  /** Trend text e.g. "+12%" or "-0.6%" */
  trend?: string;
  /** Whether trend is positive */
  trendPositive?: boolean;
  /** Override style */
  style?: ViewStyle;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  iconName,
  iconLibrary = 'Ionicons',
  iconColor = Colors.primary,
  iconBg = Colors.mint,
  trend,
  trendPositive = true,
  style,
}) => {
  return (
    <Card shadow="sm" radius="lg" style={[styles.card, style]}>
      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Icon library={iconLibrary} name={iconName} size="md" color={iconColor} />
      </View>

      {/* Value */}
      <Typography variant="h3" weight="bold" color={Colors.textPrimary}>
        {String(value)}
      </Typography>

      {/* Title */}
      <Typography variant="caption" color={Colors.textSecondary} numberOfLines={1}>
        {title}
      </Typography>

      {/* Trend */}
      {trend && (
        <Badge
          variant={trendPositive ? 'success' : 'danger'}
          label={trend}
          size="sm"
          style={styles.trend}
        />
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.base,
    gap: Spacing.xs,
    minWidth: 120,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  trend: {
    marginTop: Spacing.xs,
  },
});

export default StatCard;

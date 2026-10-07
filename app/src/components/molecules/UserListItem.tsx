/**
 * Molecule: UserListItem
 *
 * Driver or Customer list row in Admin management screens.
 * Composed of: Avatar + name + rating + status Badge + action chevron/menu.
 *
 * Used in:
 *  - Admin Drivers list
 *  - Admin Customers list
 *  - Recent Ride Activity on Admin Dashboard
 *
 * Reference: Admin App — Drivers and Customers list screens
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Avatar from '../atoms/Avatar';
import Typography from '../atoms/Typography';
import Badge, { BadgeVariant } from '../atoms/Badge';
import RatingStar from '../atoms/RatingStar';
import Icon from '../atoms/Icon';
import Divider from '../atoms/Divider';
import { Colors, Spacing } from '../../constants/theme';

export interface UserListItemProps {
  /** User's full name */
  name: string;
  /** Profile image URL */
  avatarSrc?: string;
  /** Rating (1–5) */
  rating?: number;
  /** Trip count */
  tripCount?: number;
  /** Status badge variant */
  statusVariant?: BadgeVariant;
  /** Status label text */
  statusLabel?: string;
  /** Sub info (e.g. vehicle plate, phone number) */
  subInfo?: string;
  /** Show dot on badge */
  statusDot?: boolean;
  /** Show bottom divider */
  showDivider?: boolean;
  /** Press handler */
  onPress?: () => void;
  /** Override style */
  style?: ViewStyle;
}

const UserListItem: React.FC<UserListItemProps> = ({
  name,
  avatarSrc,
  rating,
  tripCount,
  statusVariant = 'neutral',
  statusLabel,
  subInfo,
  statusDot = true,
  showDivider = true,
  onPress,
  style,
}) => {
  return (
    <>
      <TouchableOpacity style={[styles.row, style]} onPress={onPress} activeOpacity={0.75}>
        {/* Avatar */}
        <Avatar src={avatarSrc} name={name} size="md" style={{ marginRight: Spacing.md }} />

        {/* Info block */}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Typography variant="body2" weight="semiBold" color={Colors.textPrimary} numberOfLines={1} style={{ flex: 1 }}>
              {name}
            </Typography>
            {statusLabel && (
              <Badge variant={statusVariant} label={statusLabel} size="sm" dot={statusDot} />
            )}
          </View>

          {rating !== undefined && (
            <RatingStar value={rating} size={12} showScore tripCount={tripCount} />
          )}

          {subInfo && (
            <Typography variant="caption" color={Colors.textMuted} numberOfLines={1}>
              {subInfo}
            </Typography>
          )}
        </View>

        {/* Chevron */}
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
  },
  info: {
    flex: 1,
    gap: Spacing.xs,
    marginRight: Spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});

export default UserListItem;

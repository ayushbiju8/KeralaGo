/**
 * Molecule: InfoRow
 *
 * Reusable labeled info row used across profile, settings, and details screens.
 * Composed of: left icon (optional) + label + right value/chevron/switch.
 *
 * Used in:
 *  - Customer & Driver Profile: "Full Name", "Phone Number", "Email"
 *  - Settings: "Navigation App", "Distance Unit", "Language"
 *  - Admin Profile: "Permissions" rows
 *  - Vehicle Details: "Vehicle Type", "Model", "RC Status"
 *
 * Reference: Driver Profile, Customer Profile, Admin Profile screens
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Icon, { IconLibrary } from '../atoms/Icon';
import Typography from '../atoms/Typography';
import Switch from '../atoms/Switch';
import Divider from '../atoms/Divider';
import { Colors, Spacing, Radii } from '../../constants/theme';

export type InfoRowRightContent = 'chevron' | 'switch' | 'text' | 'badge' | 'none';

export interface InfoRowProps {
  /** Row label */
  label: string;
  /** Optional left icon name */
  iconName?: string;
  /** Icon library */
  iconLibrary?: IconLibrary;
  /** Icon color */
  iconColor?: string;
  /** Value text (for 'text' and 'chevron' right content) */
  value?: string;
  /** Value text color */
  valueColor?: string;
  /** Right content type */
  rightContent?: InfoRowRightContent;
  /** Switch value (required when rightContent = 'switch') */
  switchValue?: boolean;
  /** Switch change handler */
  onSwitchChange?: (value: boolean) => void;
  /** Right node override */
  rightNode?: React.ReactNode;
  /** Press handler (makes row tappable) */
  onPress?: () => void;
  /** Show bottom divider */
  showDivider?: boolean;
  /** Label color override */
  labelColor?: string;
  /** Override style */
  style?: ViewStyle;
}

const InfoRow: React.FC<InfoRowProps> = ({
  label,
  iconName,
  iconLibrary = 'Ionicons',
  iconColor = Colors.textSecondary,
  value,
  valueColor = Colors.textSecondary,
  rightContent = 'chevron',
  switchValue,
  onSwitchChange,
  rightNode,
  onPress,
  showDivider = true,
  labelColor = Colors.textPrimary,
  style,
}) => {
  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress
    ? { onPress, activeOpacity: 0.7 }
    : {};

  return (
    <>
      <Wrapper style={[styles.row, style]} {...wrapperProps}>
        {/* Left icon */}
        {iconName && (
          <View style={styles.iconWrap}>
            <Icon library={iconLibrary} name={iconName} size="md" color={iconColor} />
          </View>
        )}

        {/* Label */}
        <Typography variant="body2" color={labelColor} style={styles.label}>
          {label}
        </Typography>

        {/* Right content */}
        {rightNode ?? renderRight(rightContent, value, valueColor, switchValue, onSwitchChange)}
      </Wrapper>

      {showDivider && <Divider style={styles.divider} />}
    </>
  );
};

function renderRight(
  type: InfoRowRightContent,
  value?: string,
  valueColor?: string,
  switchValue?: boolean,
  onSwitchChange?: (v: boolean) => void,
): React.ReactNode {
  switch (type) {
    case 'chevron':
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {value && (
            <Typography variant="body2" color={valueColor} style={{ marginRight: Spacing.xs }}>
              {value}
            </Typography>
          )}
          <Icon library="Ionicons" name="chevron-forward" size="sm" color={Colors.textMuted} />
        </View>
      );
    case 'text':
      return (
        <Typography variant="body2" color={valueColor}>
          {value}
        </Typography>
      );
    case 'switch':
      return (
        <Switch
          value={switchValue ?? false}
          onValueChange={onSwitchChange ?? (() => {})}
        />
      );
    case 'none':
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    minHeight: 52,
  },
  iconWrap: {
    width: 32,
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  label: {
    flex: 1,
  },
  divider: {
    marginLeft: 32 + Spacing.md,
  },
});

export default InfoRow;

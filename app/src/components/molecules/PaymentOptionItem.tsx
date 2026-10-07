/**
 * Molecule: PaymentOptionItem
 *
 * A single payment method row with icon, label, subtitle, radio/check indicator.
 *
 * Used in:
 *  - Customer Payment Methods screen: UPI, Credit/Debit Card, Cash, Wallet
 *  - Customer Confirm Ride screen: payment method selector
 *
 * Reference: KeralaGo Ride Booking UI Flow — Payment Methods screen
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Icon, { IconLibrary } from '../atoms/Icon';
import Typography from '../atoms/Typography';
import Radio from '../atoms/Radio';
import Divider from '../atoms/Divider';
import { Colors, Spacing, Radii } from '../../constants/theme';

export interface PaymentOptionItemProps {
  /** Display label */
  label: string;
  /** Sub detail (e.g. "GPay, PhonePe, Paytm etc.") */
  subtitle?: string;
  /** Icon name */
  iconName: string;
  /** Icon library */
  iconLibrary?: IconLibrary;
  /** Icon color */
  iconColor?: string;
  /** Icon background */
  iconBg?: string;
  /** Whether this option is selected */
  selected?: boolean;
  /** Selection handler */
  onSelect?: () => void;
  /** Show bottom divider */
  showDivider?: boolean;
  /** Override container style */
  style?: ViewStyle;
}

const PaymentOptionItem: React.FC<PaymentOptionItemProps> = ({
  label,
  subtitle,
  iconName,
  iconLibrary = 'MaterialIcons',
  iconColor = Colors.primary,
  iconBg = Colors.mint,
  selected = false,
  onSelect,
  showDivider = true,
  style,
}) => {
  return (
    <>
      <TouchableOpacity style={[styles.row, style]} onPress={onSelect} activeOpacity={0.75}>
        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <Icon library={iconLibrary} name={iconName} size="md" color={iconColor} />
        </View>

        {/* Text */}
        <View style={styles.textBlock}>
          <Typography variant="body2" weight="medium" color={Colors.textPrimary}>
            {label}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color={Colors.textMuted}>
              {subtitle}
            </Typography>
          )}
        </View>

        {/* Radio */}
        <Radio selected={selected} onSelect={onSelect} />
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
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  textBlock: {
    flex: 1,
    marginRight: Spacing.sm,
  },
});

export default PaymentOptionItem;

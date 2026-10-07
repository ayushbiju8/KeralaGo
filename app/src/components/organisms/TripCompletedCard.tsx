/**
 * Organism: TripCompletedCard
 *
 * Shown at the end of every trip for both Customer and Driver.
 *
 * Customer view: trip fare, payment method, "Paid via UPI", rate driver.
 * Driver view: earnings breakdown (Base Fare + Distance), rate passenger.
 *
 * Reference:
 *  - Customer: "Trip Completed! ₹132" card
 *  - Driver: "Trip Completed ₹120 Your Earnings" screen
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Icon from '../atoms/Icon';
import Typography from '../atoms/Typography';
import Avatar from '../atoms/Avatar';
import RatingStar from '../atoms/RatingStar';
import Button from '../atoms/Button';
import Divider from '../atoms/Divider';
import Card from '../atoms/Card';
import { Colors, Spacing, Radii } from '../../constants/theme';

export interface FareBreakdownItem {
  label: string;
  amount: number;
}

export interface TripCompletedCardProps {
  /** Total amount */
  totalAmount: number;
  /** Payment label e.g. "Paid via UPI" or "Your Earnings" */
  paymentLabel?: string;
  /** Itemized fare breakdown */
  breakdown?: FareBreakdownItem[];
  /** Person to rate (driver or passenger) */
  rateeName?: string;
  /** Ratee avatar */
  rateeAvatar?: string;
  /** Ratee vehicle (driver view) */
  rateeVehicle?: string;
  /** "Rate your driver/passenger" label */
  rateLabel?: string;
  /** Current rating selection */
  ratingValue?: number;
  /** Rating selection handler */
  onRate?: (rating: number) => void;
  /** Done/CTA press */
  onDone: () => void;
  /** Override style */
  style?: ViewStyle;
}

const TripCompletedCard: React.FC<TripCompletedCardProps> = ({
  totalAmount,
  paymentLabel = 'Paid via UPI',
  breakdown,
  rateeName,
  rateeAvatar,
  rateeVehicle,
  rateLabel = 'Rate your driver',
  ratingValue = 0,
  onRate,
  onDone,
  style,
}) => {
  return (
    <Card shadow="lg" radius="2xl" style={[styles.card, style]}>
      {/* Checkmark */}
      <View style={styles.checkCircle}>
        <Icon library="Ionicons" name="checkmark" size="2xl" color={Colors.white} />
      </View>

      {/* Trip Completed */}
      <Typography variant="h3" weight="bold" color={Colors.textPrimary} align="center">
        Trip Completed!
      </Typography>

      {/* Amount */}
      <Typography variant="h1" weight="extraBold" color={Colors.primary} align="center">
        ₹{totalAmount}
      </Typography>

      <Typography variant="body2" color={Colors.textMuted} align="center">
        {paymentLabel}
      </Typography>

      {/* Fare Breakdown */}
      {breakdown && breakdown.length > 0 && (
        <>
          <Divider style={styles.divider} />
          {breakdown.map((item, i) => (
            <View key={i} style={styles.breakdownRow}>
              <Typography variant="body2" color={Colors.textSecondary}>
                {item.label}
              </Typography>
              <Typography variant="body2" weight="medium" color={Colors.textPrimary}>
                ₹{item.amount}
              </Typography>
            </View>
          ))}
          <Divider style={styles.divider} />
        </>
      )}

      {/* Rate the person */}
      {rateeName && (
        <View style={styles.rateSection}>
          <View style={styles.rateeRow}>
            <Avatar src={rateeAvatar} name={rateeName} size="sm" />
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <Typography variant="body2" weight="semiBold" color={Colors.textPrimary}>
                {rateeName}
              </Typography>
              {rateeVehicle && (
                <Typography variant="caption" color={Colors.textMuted}>
                  {rateeVehicle}
                </Typography>
              )}
            </View>
          </View>

          <Typography variant="label" color={Colors.textSecondary} style={{ marginTop: Spacing.md }}>
            {rateLabel}
          </Typography>
          <RatingStar
            value={ratingValue}
            size={28}
            interactive
            onRate={onRate}
            style={styles.stars}
          />
        </View>
      )}

      {/* Done CTA */}
      <Button
        variant="primary"
        size="lg"
        label="Done"
        fullWidth
        onPress={onDone}
        style={styles.doneBtn}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: Radii.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  divider: {
    marginVertical: Spacing.md,
    width: '100%',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: Spacing.xs,
  },
  rateSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  rateeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  stars: {
    marginTop: Spacing.sm,
  },
  doneBtn: {
    marginTop: Spacing.md,
    width: '100%',
  },
});

export default TripCompletedCard;

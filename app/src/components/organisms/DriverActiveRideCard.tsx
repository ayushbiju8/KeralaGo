/**
 * Organism: DriverActiveRideCard
 *
 * Shows the active ride info during a trip — passenger details, ETA, action CTA button.
 * Adapts to the 3 stages: Arriving → Arrived → On Trip → End Trip
 *
 * Reference: Driver App — Arriving at pickup, Pickup Passenger, On the way screens
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Avatar from '../atoms/Avatar';
import Typography from '../atoms/Typography';
import RatingStar from '../atoms/RatingStar';
import Icon from '../atoms/Icon';
import Button from '../atoms/Button';
import Card from '../atoms/Card';
import { Colors, Spacing, Radii } from '../../constants/theme';

export type ActiveRideStage = 'arriving' | 'arrived' | 'on_trip' | 'end_trip';

export interface DriverActiveRideCardProps {
  /** Passenger name */
  passengerName: string;
  /** Passenger avatar */
  passengerAvatar?: string;
  /** Passenger rating */
  passengerRating: number;
  /** Passenger trip count */
  passengerTripCount?: number;
  /** Pickup location */
  pickup: string;
  /** Dropoff location */
  dropoff: string;
  /** ETA text (e.g. "2 min • 800 m") */
  etaText?: string;
  /** Current stage of the ride */
  stage: ActiveRideStage;
  /** Primary CTA press handler */
  onCTAPress: () => void;
  /** Call passenger handler */
  onCall?: () => void;
  /** Message passenger handler */
  onMessage?: () => void;
  /** Override style */
  style?: ViewStyle;
}

const stageCTA: Record<ActiveRideStage, { label: string; variant: 'primary' | 'danger' }> = {
  arriving:  { label: 'Arrived at Pickup', variant: 'primary' },
  arrived:   { label: 'Start Trip',        variant: 'primary' },
  on_trip:   { label: 'End Trip',          variant: 'danger'  },
  end_trip:  { label: 'Done',              variant: 'primary' },
};

const DriverActiveRideCard: React.FC<DriverActiveRideCardProps> = ({
  passengerName,
  passengerAvatar,
  passengerRating,
  passengerTripCount,
  pickup,
  dropoff,
  etaText,
  stage,
  onCTAPress,
  onCall,
  onMessage,
  style,
}) => {
  const cta = stageCTA[stage];

  return (
    <Card shadow="lg" radius="2xl" style={[styles.card, style]}>
      {/* ETA Banner (for arriving stage) */}
      {etaText && stage === 'arriving' && (
        <View style={styles.etaBanner}>
          <Typography variant="body2" color={Colors.textSecondary}>
            {etaText}
          </Typography>
        </View>
      )}

      {/* Passenger Info */}
      <View style={styles.passengerRow}>
        <Avatar src={passengerAvatar} name={passengerName} size="md" />

        <View style={styles.passengerInfo}>
          <Typography variant="body1" weight="semiBold" color={Colors.textPrimary}>
            {passengerName}
          </Typography>
          <RatingStar
            value={passengerRating}
            size={13}
            showScore
            tripCount={passengerTripCount}
          />
        </View>

        {/* Action buttons */}
        <View style={styles.actionBtns}>
          <TouchableOpacity style={styles.actionBtn} onPress={onCall}>
            <Icon library="Ionicons" name="call" size="md" color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={onMessage}>
            <Icon library="Ionicons" name="chatbubble-ellipses" size="md" color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Route summary for on_trip */}
      {(stage === 'on_trip' || stage === 'end_trip') && (
        <View style={styles.routeSummary}>
          <View style={styles.routePoint}>
            <Icon library="Ionicons" name="location-sharp" size="sm" color={Colors.danger} />
            <Typography variant="body2" color={Colors.textSecondary} numberOfLines={1} style={{ flex: 1 }}>
              {pickup}
            </Typography>
          </View>
          <View style={styles.routePoint}>
            <Icon library="Ionicons" name="navigate" size="sm" color={Colors.primary} />
            <Typography variant="body2" color={Colors.textSecondary} numberOfLines={1} style={{ flex: 1 }}>
              {dropoff}
            </Typography>
          </View>
        </View>
      )}

      {/* CTA */}
      <Button
        variant={cta.variant}
        size="lg"
        label={cta.label}
        fullWidth
        onPress={onCTAPress}
        style={styles.cta}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.base,
    gap: Spacing.md,
  },
  etaBanner: {
    backgroundColor: Colors.mintLight,
    borderRadius: Radii.sm,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  passengerInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  actionBtns: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: Radii.full,
    backgroundColor: Colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeSummary: {
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cta: {},
});

export default DriverActiveRideCard;

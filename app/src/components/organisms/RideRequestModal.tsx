/**
 * Organism: RideRequestModal
 *
 * The new ride request popup shown to drivers.
 * Features: animated countdown ring, distance/ETA/fare, pickup+dropoff addresses, Accept/Decline CTAs.
 *
 * Reference: Driver App — New Ride Request screen (2nd screen in Driver showcase)
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import Card from '../atoms/Card';
import Typography from '../atoms/Typography';
import Button from '../atoms/Button';
import RoutePointRow from '../molecules/RoutePointRow';
import { Colors, Spacing, Radii } from '../../constants/theme';

export interface RideRequestModalProps {
  /** Minutes away */
  etaMinutes: number;
  /** Distance in km */
  distanceKm: number;
  /** Estimated fare in ₹ */
  estimatedFare: number;
  /** Pickup time in minutes */
  pickupTimeMinutes: number;
  /** Pickup location */
  pickup: string;
  /** Pickup sub-address */
  pickupSub?: string;
  /** Dropoff location */
  dropoff: string;
  /** Dropoff sub-address */
  dropoffSub?: string;
  /** Countdown total seconds */
  countdownSeconds?: number;
  /** Accept handler */
  onAccept: () => void;
  /** Decline handler */
  onDecline: () => void;
  /** Override style */
  style?: ViewStyle;
}

const RideRequestModal: React.FC<RideRequestModalProps> = ({
  etaMinutes,
  distanceKm,
  estimatedFare,
  pickupTimeMinutes,
  pickup,
  pickupSub,
  dropoff,
  dropoffSub,
  countdownSeconds = 20,
  onAccept,
  onDecline,
  style,
}) => {
  const [remaining, setRemaining] = useState(countdownSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animRing = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(animRing, {
      toValue: 0,
      duration: countdownSeconds * 1000,
      useNativeDriver: false,
    }).start();

    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <Card shadow="xl" radius="2xl" style={[styles.card, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Typography variant="h3" weight="bold" color={Colors.textPrimary}>
            {etaMinutes} min away
          </Typography>
        </View>

        {/* Countdown circle */}
        <View style={styles.countdownWrap}>
          <Typography variant="h3" weight="bold" color={Colors.primary}>
            {remaining}
          </Typography>
        </View>
      </View>

      {/* Route */}
      <RoutePointRow
        pickup={pickup}
        pickupSub={pickupSub}
        dropoff={dropoff}
        dropoffSub={dropoffSub}
        style={styles.route}
      />

      {/* Trip metrics */}
      <View style={styles.metrics}>
        <View style={styles.metricItem}>
          <Typography variant="h4" weight="bold" color={Colors.textPrimary}>
            {distanceKm} km
          </Typography>
          <Typography variant="caption" color={Colors.textMuted}>
            Distance
          </Typography>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Typography variant="h4" weight="bold" color={Colors.textPrimary}>
            ₹{estimatedFare}
          </Typography>
          <Typography variant="caption" color={Colors.textMuted}>
            Estimated Fare
          </Typography>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Typography variant="h4" weight="bold" color={Colors.textPrimary}>
            {pickupTimeMinutes} min
          </Typography>
          <Typography variant="caption" color={Colors.textMuted}>
            Pickup time
          </Typography>
        </View>
      </View>

      {/* CTAs */}
      <Button
        variant="primary"
        size="lg"
        label="Accept"
        fullWidth
        onPress={onAccept}
        style={styles.acceptBtn}
      />
      <Button
        variant="outline"
        size="lg"
        label="Decline"
        fullWidth
        onPress={onDecline}
        style={styles.declineBtn}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.xl,
    margin: Spacing.base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  countdownWrap: {
    width: 56,
    height: 56,
    borderRadius: Radii.full,
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  route: {
    marginBottom: Spacing.xl,
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metricDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },
  acceptBtn: {
    marginBottom: Spacing.md,
  },
  declineBtn: {},
});

export default RideRequestModal;

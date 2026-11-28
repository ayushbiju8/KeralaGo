/**
 * Molecule: SkeletonPresets
 *
 * Pre-composed, high-fidelity skeleton loading templates matching the exact layouts
 * of KeralaGo's core cards and screens:
 * - ServiceCategorySkeleton: Replicates ServiceCategoryCard in suggestions grid
 * - TripItemSkeleton: Replicates TripHistoryItem
 * - RideOptionSkeleton: Replicates RideSelectionList item
 * - StatCardSkeleton: Replicates 3-column performance metrics
 * - WalletCardSkeleton: Replicates CustomerWallet balance & transaction row
 * - VehicleCardSkeleton: Replicates Driver vehicle banner card
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Skeleton from '../atoms/Skeleton';
import Card from '../atoms/Card';
import { Colors, Spacing, Radii, Shadows } from '../../constants/theme';

/**
 * Skeleton for individual Service Category tile (Customer Home 2x4 grid)
 */
export const ServiceCategorySkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View style={[styles.serviceCard, style]}>
      <Skeleton width={44} height={44} variant="circle" colorScheme="mint" style={{ marginBottom: Spacing.xs }} />
      <Skeleton width={52} height={10} variant="text" colorScheme="neutral" />
    </View>
  );
};

/**
 * 2x4 Service Grid Skeleton Container
 */
export const ServiceGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <View style={styles.serviceGrid}>
      {Array.from({ length: count }).map((_, index) => (
        <ServiceCategorySkeleton key={index} />
      ))}
    </View>
  );
};

/**
 * Skeleton for Trip History Row (Customer / Driver Trips)
 */
export const TripItemSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <Card radius="xl" shadow="sm" style={[styles.tripCard, style]}>
      {/* Top row: Date & status badge */}
      <View style={styles.rowBetween}>
        <Skeleton width={110} height={12} variant="text" />
        <Skeleton width={70} height={22} borderRadius={Radii.full} colorScheme="mint" />
      </View>

      {/* Origin -> Destination points */}
      <View style={styles.routeCol}>
        <View style={styles.routeRow}>
          <Skeleton width={8} height={8} variant="circle" colorScheme="mint" style={{ marginRight: Spacing.sm }} />
          <Skeleton width="75%" height={12} variant="text" />
        </View>
        <View style={styles.routeRow}>
          <Skeleton width={8} height={8} variant="circle" colorScheme="neutral" style={{ marginRight: Spacing.sm }} />
          <Skeleton width="60%" height={12} variant="text" />
        </View>
      </View>

      {/* Bottom row: Vehicle & Fare */}
      <View style={[styles.rowBetween, { marginTop: Spacing.sm }]}>
        <Skeleton width={90} height={12} variant="text" />
        <Skeleton width={60} height={18} variant="text" colorScheme="mint" />
      </View>
    </Card>
  );
};

/**
 * Skeleton for Ride Selection Option (Booking flow)
 */
export const RideOptionSkeleton: React.FC = () => {
  return (
    <View style={styles.rideOptionRow}>
      <Skeleton width={56} height={36} borderRadius={Radii.md} colorScheme="mint" />
      <View style={styles.rideOptionInfo}>
        <Skeleton width={100} height={16} variant="text" style={{ marginBottom: 4 }} />
        <Skeleton width={65} height={11} variant="text" />
      </View>
      <Skeleton width={55} height={18} variant="text" />
    </View>
  );
};

/**
 * Skeleton for 3-Column Performance Stats Card (Driver Home / Earnings)
 */
export const StatCardSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View style={[styles.summaryCard, style]}>
      <View style={styles.summaryCol}>
        <Skeleton width={22} height={22} variant="circle" colorScheme="mint" style={{ marginBottom: 4 }} />
        <Skeleton width={42} height={16} variant="text" style={{ marginBottom: 2 }} />
        <Skeleton width={55} height={10} variant="text" />
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryCol}>
        <Skeleton width={22} height={22} variant="circle" colorScheme="mint" style={{ marginBottom: 4 }} />
        <Skeleton width={50} height={16} variant="text" style={{ marginBottom: 2 }} />
        <Skeleton width={65} height={10} variant="text" />
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryCol}>
        <Skeleton width={22} height={22} variant="circle" colorScheme="mint" style={{ marginBottom: 4 }} />
        <Skeleton width={32} height={16} variant="text" style={{ marginBottom: 2 }} />
        <Skeleton width={48} height={10} variant="text" />
      </View>
    </View>
  );
};

/**
 * Skeleton for Driver Vehicle Card
 */
export const VehicleCardSkeleton: React.FC = () => {
  return (
    <View style={styles.vehicleCard}>
      <Skeleton width={80} height={46} borderRadius={Radii.lg} colorScheme="mint" />
      <View style={{ flex: 1, marginLeft: Spacing.md }}>
        <Skeleton width={140} height={16} variant="text" style={{ marginBottom: 4 }} />
        <Skeleton width={95} height={12} variant="text" style={{ marginBottom: 6 }} />
        <Skeleton width={60} height={18} borderRadius={Radii.full} colorScheme="mint" />
      </View>
    </View>
  );
};

/**
 * Skeleton for Wallet Balance & Card
 */
export const WalletCardSkeleton: React.FC = () => {
  return (
    <View style={styles.walletCard}>
      <Skeleton width={90} height={12} variant="text" style={{ marginBottom: 8 }} />
      <Skeleton width={140} height={32} variant="text" style={{ marginBottom: 14 }} />
      <View style={styles.rowBetween}>
        <Skeleton width={110} height={36} borderRadius={Radii.full} colorScheme="mint" />
        <Skeleton width={110} height={36} borderRadius={Radii.full} colorScheme="light" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.sm,
  },
  serviceCard: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: Radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFF3F0',
    padding: Spacing.xs,
  },
  tripCard: {
    backgroundColor: Colors.white,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#EFF3F0',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeCol: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rideOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rideOptionInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: '#EFF3F0',
    ...Shadows.sm,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 44,
    backgroundColor: '#E2E8F0',
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: '#EFF3F0',
    ...Shadows.sm,
  },
  walletCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radii['2xl'],
    borderWidth: 1,
    borderColor: '#EFF3F0',
    ...Shadows.sm,
  },
});

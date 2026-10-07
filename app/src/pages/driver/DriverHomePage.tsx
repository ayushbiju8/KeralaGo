import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import {
  Typography,
  Avatar,
  Badge,
  Switch,
  Button,
  Icon,
} from '../../components/atoms';
import {
  StatCard,
  RoutePointRow,
} from '../../components/molecules';
import {
  BottomTabBar,
  RideRequestModal,
  TabItem,
} from '../../components/organisms';
import KeralaMapBackground from '../../components/molecules/KeralaMapBackground';
import { Colors, Spacing, Radii, Shadows } from '../../constants/theme';

const DRIVER_TABS: TabItem[] = [
  { id: 'dashboard', label: 'Duty', iconName: 'speedometer', iconNameInactive: 'speedometer-outline' },
  { id: 'earnings', label: 'Earnings', iconName: 'cash', iconNameInactive: 'cash-outline' },
  { id: 'trips', label: 'Trips', iconName: 'list', iconNameInactive: 'list-outline' },
  { id: 'profile', label: 'Profile', iconName: 'person', iconNameInactive: 'person-outline' },
];

const DriverHomePage: React.FC = () => {
  const { user, toggleRole, toggleDriverDuty } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showIncomingModal, setShowIncomingModal] = useState<boolean>(false);
  const [activeRideStarted, setActiveRideStarted] = useState<boolean>(false);

  const isOnline = user?.isOnline ?? true;

  const handleAcceptRide = () => {
    setShowIncomingModal(false);
    setActiveRideStarted(true);
    Alert.alert('Ride Accepted! 🚖', 'Navigate to pickup: Lulu Mall Gate 2, Edappally');
  };

  const handleDeclineRide = () => {
    setShowIncomingModal(false);
  };

  return (
    <View style={styles.root}>
      {/* ── Background Map / Heatmap ── */}
      <KeralaMapBackground showVehicles={isOnline} />

      {/* ── Top Header & Controls ── */}
      <SafeAreaView edges={['top']} style={styles.topContainer}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <View style={styles.driverProfileBlock}>
            <Avatar
              name={user?.name || 'Driver Suresh'}
              size="md"
              online={isOnline}
              verified={true}
            />
            <View>
              <View style={styles.nameRow}>
                <Typography variant="body1" weight="bold" color={Colors.textPrimary}>
                  {user?.name || 'Suresh Pillai'}
                </Typography>
                <Badge variant="warning" label="4.94 ★" size="sm" />
              </View>
              <Typography variant="xs" color={Colors.textMuted}>
                KL-07-CC-8291 • KeralaGO Auto Partner
              </Typography>
            </View>
          </View>

          {/* Duty Switch (Online / Offline) */}
          <View style={styles.dutyPill}>
            <View
              style={[
                styles.dutyDot,
                { backgroundColor: isOnline ? Colors.success : Colors.textMuted },
              ]}
            />
            <Typography
              variant="label"
              weight="bold"
              color={isOnline ? Colors.primaryDark : Colors.textMuted}
            >
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </Typography>
            <Switch
              value={isOnline}
              onValueChange={toggleDriverDuty}
            />
          </View>
        </View>

        {/* ── Prominent Role Switcher Banner ── */}
        <View style={styles.roleToggleBanner}>
          <View style={styles.roleToggleInfo}>
            <View style={[styles.roleIconCircle, { backgroundColor: Colors.mintLight }]}>
              <Icon
                library="Ionicons"
                name="person"
                size={18}
                color={Colors.primary}
              />
            </View>
            <View>
              <Typography variant="label" weight="bold" color={Colors.primaryDark}>
                Customer Mode Switch
              </Typography>
              <Typography variant="xs" color={Colors.textSecondary}>
                Switch between Customer & Driver apps
              </Typography>
            </View>
          </View>

          <View style={styles.switchWrapper}>
            <Typography
              variant="xs"
              weight="semiBold"
              color={user?.role === 'DRIVER' ? Colors.primary : Colors.textMuted}
            >
              {user?.role === 'DRIVER' ? 'DRIVER' : 'USER'}
            </Typography>
            <Switch
              value={user?.role === 'DRIVER'}
              onValueChange={toggleRole}
            />
          </View>
        </View>
      </SafeAreaView>

      {/* ── Bottom Drawer / Driver Stats Sheet ── */}
      <View style={styles.drawerCard}>
        <View style={styles.drawerHandle} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.drawerScrollContent}
        >
          {/* Quick Metrics */}
          <View style={styles.statsRow}>
            <StatCard
              title="Today's Earnings"
              value="₹1,840"
              iconName="cash-outline"
              trend="+14% today"
              trendPositive={true}
              style={{ flex: 1 }}
            />
            <StatCard
              title="Completed Trips"
              value="8"
              iconName="checkmark-circle-outline"
              trend="96% Accept"
              trendPositive={true}
              style={{ flex: 1 }}
            />
          </View>

          {/* Active Trip Status or Ready for Dispatch */}
          {activeRideStarted ? (
            <View style={styles.activeRideBox}>
              <View style={styles.activeRideHeader}>
                <Badge variant="info" label="In Progress" size="sm" />
                <Typography variant="xs" weight="bold" color={Colors.textMuted}>
                  PIN: 4821
                </Typography>
              </View>
              <RoutePointRow
                pickup="Lulu Mall Gate 2, Edappally"
                dropoff="Infopark Phase 1, Kakkanad"
              />
              <View style={styles.activeRideActions}>
                <Button
                  label="Call Passenger"
                  variant="outline"
                  size="sm"
                  onPress={() => Alert.alert('Call', 'Connecting to passenger...')}
                  style={{ flex: 1 }}
                />
                <Button
                  label="Complete Trip"
                  variant="primary"
                  size="sm"
                  onPress={() => {
                    setActiveRideStarted(false);
                    Alert.alert('Trip Completed! 🎉', '₹185 collected via UPI.');
                  }}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ) : (
            <View style={styles.dispatchBox}>
              <View style={styles.dispatchHeader}>
                <View style={styles.pulseDot} />
                <Typography variant="body2" weight="semiBold" color={Colors.textPrimary}>
                  {isOnline ? 'Searching for nearby bookings in Kochi...' : 'You are currently offline'}
                </Typography>
              </View>
              <Typography variant="caption" color={Colors.textSecondary} style={{ marginBottom: Spacing.sm }}>
                {isOnline
                  ? 'High demand area around Edappally & Kakkanad. 1.2x surge active.'
                  : 'Go online to start receiving ride requests.'}
              </Typography>

              {isOnline && (
                <Button
                  label="Simulate Incoming Ride Offer"
                  variant="secondary"
                  size="sm"
                  leftIcon={<Icon library="Ionicons" name="notifications-outline" size="sm" color={Colors.textPrimary} />}
                  onPress={() => setShowIncomingModal(true)}
                  fullWidth
                />
              )}
            </View>
          )}

          {/* Demand Hotspots */}
          <Typography variant="h4" weight="bold" color={Colors.textPrimary} style={{ marginTop: Spacing.md, marginBottom: Spacing.sm }}>
            Current Surge Areas (Kochi)
          </Typography>
          <View style={styles.hotspotsList}>
            <View style={styles.hotspotItem}>
              <View style={styles.hotspotDot} />
              <Typography variant="body2" weight="medium" color={Colors.textPrimary} style={{ flex: 1 }}>
                Lulu Mall, Edappally
              </Typography>
              <Badge variant="warning" label="1.4x Surge" size="sm" />
            </View>
            <View style={styles.hotspotItem}>
              <View style={styles.hotspotDot} />
              <Typography variant="body2" weight="medium" color={Colors.textPrimary} style={{ flex: 1 }}>
                Infopark Expressway, Kakkanad
              </Typography>
              <Badge variant="warning" label="1.2x Surge" size="sm" />
            </View>
          </View>
        </ScrollView>
      </View>

      {/* ── Incoming Ride Request Modal ── */}
      {showIncomingModal && (
        <RideRequestModal
          pickup="Lulu Mall Gate 2, Edappally, Kochi"
          dropoff="Infopark Phase 1, Kakkanad"
          distanceKm={6.4}
          estimatedFare={185}
          etaMinutes={4}
          pickupTimeMinutes={3}
          onAccept={handleAcceptRide}
          onDecline={handleDeclineRide}
        />
      )}

      {/* ── Driver Tab Bar ── */}
      <BottomTabBar
        tabs={DRIVER_TABS}
        activeTabId={activeTab}
        onTabPress={setActiveTab}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topContainer: {
    paddingHorizontal: Spacing.base,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  driverProfileBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dutyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  dutyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  roleToggleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.mintBorder,
    ...Shadows.sm,
  },
  roleToggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  roleIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  drawerCard: {
    flex: 1,
    marginTop: Spacing.md,
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radii['2xl'],
    borderTopRightRadius: Radii['2xl'],
    ...Shadows.lg,
  },
  drawerHandle: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  drawerScrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['2xl'],
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  dispatchBox: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radii.lg,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  dispatchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primaryVibrant,
  },
  activeRideBox: {
    backgroundColor: Colors.mintLight,
    padding: Spacing.md,
    borderRadius: Radii.lg,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.mintBorder,
  },
  activeRideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  activeRideActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  hotspotsList: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  hotspotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    gap: Spacing.sm,
  },
  hotspotDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.warning,
  },
});

export default DriverHomePage;

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import {
  Typography,
  Card,
  Divider,
  Icon,
} from '../../components/atoms';
import {
  DriverHeroCarBanner,
  KeralaMapBackground,
} from '../../components/molecules';
import {
  BottomTabBar,
  BottomSheet,
  RideRequestModal,
  TabItem,
} from '../../components/organisms';
import { Colors, Spacing, Radii, Shadows } from '../../constants/theme';

const DRIVER_TABS: TabItem[] = [
  { id: 'home', label: 'Home', iconName: 'home', iconNameInactive: 'home-outline' },
  { id: 'earnings', label: 'Earnings', iconName: 'stats-chart', iconNameInactive: 'stats-chart-outline' },
  { id: 'bookings', label: 'Rides', iconName: 'car-sport', iconNameInactive: 'car-sport-outline' },
  { id: 'profile', label: 'Profile', iconName: 'person', iconNameInactive: 'person-outline' },
];

export interface DriverHomePageProps {
  onNavigateTab?: (tabId: string) => void;
  onNavigateVehicleDetails?: () => void;
  activeTab?: string;
}

const DriverHomePage: React.FC<DriverHomePageProps> = ({
  onNavigateTab,
  onNavigateVehicleDetails,
  activeTab: controlledActiveTab,
}) => {
  const { user, toggleRole, toggleDriverDuty } = useAuth();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = Dimensions.get('window');

  const [internalTab, setInternalTab] = useState<string>('home');
  const activeTab = controlledActiveTab ?? internalTab;
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [showIncomingModal, setShowIncomingModal] = useState<boolean>(false);

  const handleTabSelect = (tabId: string) => {
    setInternalTab(tabId);
    if (onNavigateTab) {
      onNavigateTab(tabId);
    }
  };

  const isOnline = user?.isOnline ?? true;

  const handleAcceptRide = () => {
    // Proceed into navigation simulation stages ('arriving' -> 'arrived' -> 'on_trip' -> 'completed')
  };

  const handleDeclineRide = () => {
    setShowIncomingModal(false);
  };

  const handleCompleteRide = () => {
    setShowIncomingModal(false);
    Alert.alert('Trip Completed! 🎉', '₹120 has been credited to your daily earnings.');
  };

  const handleFuelPress = () => {
    Alert.alert('Fuel / CNG Stations', 'Finding nearest HP / IndianOil CNG station near Kothamangalam bypass.');
  };

  const handleVehicleCarePress = () => {
    Alert.alert('Vehicle Care', 'Certified workshops & car wash centers near MACE Junction.');
  };

  const handleSupportPress = () => {
    Alert.alert('KeralaGo 24/7 Driver Support', 'Connecting to Driver Helpline: 1800-425-GO-KL');
  };

  const handleSosPress = () => {
    Alert.alert(
      '🚨 SOS Emergency Alert',
      'This will instantly notify Kerala Police (112) & the KeralaGo 24/7 Emergency Response Team with your live coordinates Near MACE.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Trigger Emergency SOS',
          style: 'destructive',
          onPress: () => Alert.alert('Emergency Broadcast Sent', 'Live location broadcasted to authorities.'),
        },
      ]
    );
  };

  // Dimensions for collapsible bottom drawer
  const bottomBarHeight = 60 + insets.bottom;
  const mapOffsetY = insets.top + 105;
  const drawerExpandedTop = insets.top + 280;

  return (
    <View style={styles.root}>
      {/* ── 1. Full Screen Kerala Map Background (Highway 85, River, MACE Pin) ── */}
      <View style={StyleSheet.absoluteFill}>
        <KeralaMapBackground
          variant="driver"
          height={screenHeight}
          offsetY={mapOffsetY}
          onLocatePress={() => Alert.alert('GPS Location', 'Centered on current location: Near MACE, Kothamangalam.')}
          onLayersPress={() => Alert.alert('Map Layers', 'Switched to Traffic & Demand heatmap.')}
          onNavigatePress={() => Alert.alert('Navigation', 'Turn-by-turn navigation started towards high demand sector.')}
        />
      </View>

      {/* ── 2. Top Header Bar & Floating Dark Duty Capsule Pill ── */}
      <SafeAreaView edges={['top']} style={styles.safeHeaderArea}>
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          {/* Left Menu Button */}
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => setIsMenuOpen(true)}
            activeOpacity={0.7}
          >
            <Icon library="Ionicons" name="menu-outline" size={26} color={Colors.textPrimary} />
          </TouchableOpacity>

          {/* Center Logo & Subtitle */}
          <View style={styles.brandTitleCenter}>
            <View style={styles.logoRow}>
              <Icon
                library="MaterialCommunityIcons"
                name="palm-tree"
                size={22}
                color={Colors.primary}
                style={{ marginRight: 4 }}
              />
              <Typography variant="h3" weight="bold" color={Colors.primary}>
                KeralaGo
              </Typography>
            </View>
            <Typography variant="xs" weight="medium" color={Colors.textSecondary}>
              Driver
            </Typography>
          </View>

          {/* Right Notification Bell */}
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => Alert.alert('KeralaGO Notifications', 'No pending alerts.')}
            activeOpacity={0.7}
          >
            <Icon library="Ionicons" name="notifications-outline" size={24} color={Colors.textPrimary} />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>

        {/* Floating Dark Green Duty Capsule Pill */}
        <View style={styles.floatingBannerWrapper}>
          <DriverHeroCarBanner
            isOnline={isOnline}
            onToggleDuty={toggleDriverDuty}
            variant="floating-dark"
          />
        </View>
      </SafeAreaView>

      {/* ── 3. Collapsible Bottom Drawer (Pull down to view full map) ── */}
      <BottomSheet
        variant="drawer"
        expandedTop={drawerExpandedTop}
        bottomOffset={bottomBarHeight}
        collapsedPeekHeight={48}
        showHandle={true}
        style={styles.drawerCard}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.drawerScrollContent}
          bounces={false}
        >
          {/* ── Vehicle Card (Maruti Swift Dzire / KL 07 AB 1234 / Sedan) ── */}
          <TouchableOpacity
            style={styles.vehicleCard}
            activeOpacity={0.85}
            onPress={onNavigateVehicleDetails ?? (() => Alert.alert('Vehicle Details', 'Maruti Swift Dzire\nRegistration: KL 07 AB 1234\nCategory: Sedan\nFitness & Insurance: Valid'))}
          >
            <View style={styles.carImageContainer}>
              <Image
                source={require('../../../assets/images/white_sedan.jpg')}
                style={styles.vehicleThumb}
                resizeMode="contain"
              />
            </View>

            <View style={styles.vehicleInfoCol}>
              <Typography variant="body1" weight="bold" color={Colors.textPrimary}>
                Maruti Swift Dzire
              </Typography>
              <Typography variant="body2" weight="medium" color={Colors.textSecondary} style={{ marginTop: 2 }}>
                KL 07 AB 1234
              </Typography>
              <View style={styles.sedanBadge}>
                <Typography variant="xs" weight="bold" color="#166534">
                  Sedan
                </Typography>
              </View>
            </View>

            <Icon library="Ionicons" name="chevron-forward" size={22} color="#16A34A" />
          </TouchableOpacity>

          {/* ── Summary 3-Column Card (12 Trips / ₹1,240 / 4.8 Rating) ── */}
          <Card style={styles.summaryCard}>
            {/* Column 1: Trips today */}
            <View style={styles.summaryCol}>
              <Icon library="Ionicons" name="car-sport" size={22} color="#10B981" />
              <Typography variant="h2" weight="bold" color={Colors.textPrimary} style={{ marginTop: 4 }}>
                12
              </Typography>
              <Typography variant="caption" color={Colors.textSecondary} style={{ marginTop: 2 }}>
                Trips today
              </Typography>
              <Typography variant="caption" weight="bold" color="#10B981" style={{ marginTop: 2 }}>
                ↑ +20%
              </Typography>
            </View>

            <Divider orientation="vertical" style={styles.summaryDivider} />

            {/* Column 2: Earnings today */}
            <View style={styles.summaryCol}>
              <View style={styles.rupeeCircle}>
                <Typography variant="xs" weight="bold" color={Colors.white}>
                  ₹
                </Typography>
              </View>
              <Typography variant="h2" weight="bold" color={Colors.textPrimary} style={{ marginTop: 4 }}>
                ₹1,240
              </Typography>
              <Typography variant="caption" color={Colors.textSecondary} style={{ marginTop: 2 }}>
                Earnings today
              </Typography>
              <Typography variant="caption" weight="bold" color="#10B981" style={{ marginTop: 2 }}>
                ↑ +18%
              </Typography>
            </View>

            <Divider orientation="vertical" style={styles.summaryDivider} />

            {/* Column 3: Rating */}
            <View style={styles.summaryCol}>
              <Icon library="Ionicons" name="star" size={22} color="#10B981" />
              <Typography variant="h2" weight="bold" color={Colors.textPrimary} style={{ marginTop: 4 }}>
                4.8
              </Typography>
              <Typography variant="caption" color={Colors.textSecondary} style={{ marginTop: 2 }}>
                Rating
              </Typography>
              <Typography variant="xs" color={Colors.textMuted} style={{ marginTop: 2 }}>
                (128 reviews)
              </Typography>
            </View>
          </Card>

          {/* ── High Demand Alert Banner (+30%) ── */}
          <TouchableOpacity
            style={styles.highDemandCard}
            activeOpacity={0.85}
            onPress={() => setShowIncomingModal(true)}
          >
            <View style={styles.chartIconContainer}>
              <Icon library="Ionicons" name="stats-chart" size={22} color="#166534" />
            </View>

            <View style={styles.highDemandTextCol}>
              <Typography variant="body1" weight="bold" color={Colors.textPrimary}>
                High demand in your area
              </Typography>
              <Typography variant="caption" color={Colors.textSecondary} style={{ marginTop: 2 }}>
                More ride requests right now
              </Typography>
            </View>

            <View style={styles.demandRightGroup}>
              <View style={styles.demandBadge}>
                <Typography variant="caption" weight="bold" color="#166534">
                  +30%
                </Typography>
              </View>
              <Icon library="Ionicons" name="chevron-forward" size={20} color="#166534" />
            </View>
          </TouchableOpacity>

          {/* ── Today's Progress Section ── */}
          <View style={styles.sectionHeaderRow}>
            <Typography variant="h4" weight="bold" color={Colors.textPrimary}>
              Today's Progress
            </Typography>
            <TouchableOpacity
              onPress={() => Alert.alert('Earnings Progress Details', 'Target: ₹2,000\nCompleted: ₹1,240 (62%)\nRemaining: ₹760 to daily bonus')}
              style={styles.viewDetailsRow}
            >
              <Typography variant="body2" weight="bold" color={Colors.primary}>
                View details
              </Typography>
              <Icon library="Ionicons" name="chevron-forward" size={16} color={Colors.primary} style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>

          <Card style={styles.progressCard}>
            <View style={styles.progressTopRow}>
              <View style={styles.targetIconCircle}>
                <Icon library="Ionicons" name="checkmark-circle-outline" size={24} color="#0F4A2B" />
              </View>
              <View style={{ marginLeft: Spacing.md, flex: 1 }}>
                <Typography variant="h3" weight="bold" color={Colors.textPrimary}>
                  ₹1,240 <Typography variant="h3" weight="regular" color={Colors.textSecondary}>/ ₹2,000</Typography>
                </Typography>
                <Typography variant="caption" color={Colors.textSecondary} style={{ marginTop: 2 }}>
                  Earnings goal
                </Typography>
              </View>
            </View>

            <View style={styles.progressBarWrapper}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: '62%' }]} />
              </View>
              <Typography variant="caption" weight="bold" color={Colors.textSecondary} style={styles.progressPercentText}>
                62%
              </Typography>
            </View>
          </Card>

          {/* ── Quick Actions Section ── */}
          <View style={styles.sectionHeaderRow}>
            <Typography variant="h4" weight="bold" color={Colors.textPrimary}>
              Quick Actions
            </Typography>
          </View>

          <View style={styles.quickActionsRow}>
            {/* 1. Fuel / CNG */}
            <TouchableOpacity
              style={styles.actionCard}
              activeOpacity={0.75}
              onPress={handleFuelPress}
            >
              <Icon library="MaterialIcons" name="local-gas-station" size={28} color="#0F172A" />
              <Typography variant="xs" weight="medium" color={Colors.textSecondary} align="center" style={styles.actionLabel}>
                Fuel / {'\n'}CNG
              </Typography>
            </TouchableOpacity>

            {/* 2. Vehicle Care */}
            <TouchableOpacity
              style={styles.actionCard}
              activeOpacity={0.75}
              onPress={handleVehicleCarePress}
            >
              <Icon library="Ionicons" name="car-sport" size={28} color="#0F172A" />
              <Typography variant="xs" weight="medium" color={Colors.textSecondary} align="center" style={styles.actionLabel}>
                Vehicle{'\n'}Care
              </Typography>
            </TouchableOpacity>

            {/* 3. Support */}
            <TouchableOpacity
              style={styles.actionCard}
              activeOpacity={0.75}
              onPress={handleSupportPress}
            >
              <Icon library="Ionicons" name="headset" size={28} color="#0F172A" />
              <Typography variant="xs" weight="medium" color={Colors.textSecondary} align="center" style={styles.actionLabel}>
                Support
              </Typography>
            </TouchableOpacity>

            {/* 4. SOS */}
            <TouchableOpacity
              style={styles.sosCard}
              activeOpacity={0.75}
              onPress={handleSosPress}
            >
              <View style={styles.sosIconCircle}>
                <Icon library="Ionicons" name="alert" size={20} color={Colors.white} />
              </View>
              <Typography variant="caption" weight="bold" color="#EF4444" align="center" style={styles.sosLabel}>
                SOS
              </Typography>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </BottomSheet>

      {/* ── 4. Bottom Tab Navigation Bar (Home, Earnings, Rides, Profile) ── */}
      <BottomTabBar
        tabs={DRIVER_TABS}
        activeTabId={activeTab}
        onTabPress={handleTabSelect}
        style={styles.bottomTabBar}
      />

      {/* ── Incoming Ride Request Simulator Modal ── */}
      <RideRequestModal
        visible={showIncomingModal}
        pickup="M B Hostel"
        pickupSub="MACE Hostels Road, Kothamangalam"
        dropoff="Mar Athanasius College"
        dropoffSub="College Jn, Kothamangalam"
        distanceKm={2.8}
        estimatedFare={120}
        etaMinutes={5}
        pickupTimeMinutes={5}
        passengerName="Devarth"
        passengerRating={4.8}
        passengerTrips={32}
        countdownSeconds={20}
        onAccept={handleAcceptRide}
        onDecline={handleDeclineRide}
        onComplete={handleCompleteRide}
      />

      {/* ── Driver Menu & Role Switch BottomSheet ── */}
      <BottomSheet
        visible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        showBackdrop={true}
      >
        <View style={styles.menuSheetContent}>
          <View style={styles.menuHeader}>
            <View style={styles.menuAvatarCircle}>
              <Icon library="MaterialCommunityIcons" name="steering" size={28} color={Colors.primary} />
            </View>
            <View>
              <Typography variant="h3" weight="bold" color={Colors.textPrimary}>
                {user?.name || 'Suresh Pillai'}
              </Typography>
              <Typography variant="caption" color={Colors.textMuted}>
                KL-07-AB-1234 • Maruti Swift Dzire • 4.8 ★
              </Typography>
            </View>
          </View>

          <Divider style={{ marginVertical: Spacing.md }} />

          {/* Switch to Customer App Action */}
          <TouchableOpacity
            style={styles.menuItemRow}
            onPress={() => {
              setIsMenuOpen(false);
              toggleRole();
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.menuItemIcon, { backgroundColor: Colors.mintLight }]}>
              <Icon library="Ionicons" name="person" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Typography variant="body1" weight="bold" color={Colors.primaryDark}>
                Switch to Customer App
              </Typography>
              <Typography variant="caption" color={Colors.textSecondary}>
                Switch persona back to passenger mode
              </Typography>
            </View>
            <Icon library="Ionicons" name="swap-horizontal" size={20} color={Colors.primary} />
          </TouchableOpacity>

          {/* Test Incoming Request Action */}
          <TouchableOpacity
            style={styles.menuItemRow}
            onPress={() => {
              setIsMenuOpen(false);
              setShowIncomingModal(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.menuItemIcon, { backgroundColor: '#FEF3C7' }]}>
              <Icon library="Ionicons" name="flash" size={20} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Typography variant="body1" weight="bold" color={Colors.textPrimary}>
                Simulate Ride Offer
              </Typography>
              <Typography variant="caption" color={Colors.textSecondary}>
                Preview incoming dispatch modal
              </Typography>
            </View>
            <Icon library="Ionicons" name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#EDF6EF',
  },
  safeHeaderArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 15,
    backgroundColor: 'transparent',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.danger,
  },
  brandTitleCenter: {
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingBannerWrapper: {
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  drawerCard: {
    backgroundColor: Colors.white,
    ...Shadows.xl,
  },
  drawerScrollContent: {
    paddingBottom: Spacing['3xl'],
    paddingTop: Spacing.xs,
  },
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 25,
  },

  // ── Vehicle Details Card ──
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
  carImageContainer: {
    width: 85,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleThumb: {
    width: '100%',
    height: '100%',
  },
  vehicleInfoCol: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  sedanBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.full,
    marginTop: Spacing.xs,
  },

  // ── Summary Card (12 Trips / ₹1,240 / 4.8 Rating) ──
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
  rupeeCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryDivider: {
    height: 48,
    backgroundColor: '#E2E8F0',
  },

  // ── High Demand Card ──
  highDemandCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF7EE',
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    padding: Spacing.base,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: '#D4EAD9',
  },
  chartIconContainer: {
    width: 44,
    height: 44,
    borderRadius: Radii.lg,
    backgroundColor: '#D9EFE0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  highDemandTextCol: {
    flex: 1,
  },
  demandRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  demandBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },

  // ── Section Header Row ──
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.base,
    marginTop: Spacing.lg,
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // ── Today's Progress Card ──
  progressCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.sm,
    padding: Spacing.base,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: '#EFF3F0',
    ...Shadows.sm,
  },
  progressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0F4A2B',
    borderRadius: 4,
  },
  progressPercentText: {
    marginLeft: Spacing.md,
  },

  // ── Quick Actions ──
  quickActionsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.base,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFF3F0',
    ...Shadows.sm,
  },
  actionLabel: {
    marginTop: Spacing.xs,
    lineHeight: 14,
  },
  sosCard: {
    flex: 1,
    backgroundColor: '#FFF1F2',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    ...Shadows.sm,
  },
  sosIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosLabel: {
    marginTop: Spacing.xs,
  },

  // ── Menu Sheet Content ──
  menuSheetContent: {
    paddingBottom: Spacing.md,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: Radii.full,
    backgroundColor: Colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DriverHomePage;

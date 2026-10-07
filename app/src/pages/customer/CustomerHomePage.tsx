import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
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
  FloatingSearchBar,
  FloatingMapButton,
  ServiceCategoryCard,
  LocationListItem,
} from '../../components/molecules';
import {
  BottomSheet,
  BottomTabBar,
  RideSelectionList,
  RideOption,
  TabItem,
} from '../../components/organisms';
import KeralaMapBackground from '../../components/molecules/KeralaMapBackground';
import { Colors, Spacing, Radii, Shadows } from '../../constants/theme';

const { width } = Dimensions.get('window');

const CUSTOMER_TABS: TabItem[] = [
  { id: 'home', label: 'Home', iconName: 'map', iconNameInactive: 'map-outline' },
  { id: 'trips', label: 'Trips', iconName: 'time', iconNameInactive: 'time-outline' },
  { id: 'wallet', label: 'Wallet', iconName: 'wallet', iconNameInactive: 'wallet-outline' },
  { id: 'profile', label: 'Profile', iconName: 'person', iconNameInactive: 'person-outline' },
];

const RIDE_OPTIONS: RideOption[] = [
  {
    id: 'auto',
    label: 'Kerala Auto',
    iconName: 'rickshaw',
    iconLibrary: 'MaterialCommunityIcons',
    iconColor: '#F59E0B',
    etaMinutes: 2,
    priceMin: 45,
    priceMax: 60,
  },
  {
    id: 'car',
    label: 'KeralaGO Comfort',
    iconName: 'car-side',
    iconLibrary: 'MaterialCommunityIcons',
    iconColor: Colors.primary,
    etaMinutes: 4,
    priceMin: 120,
    priceMax: 150,
  },
  {
    id: 'pink',
    label: 'Pink Ride (Women)',
    iconName: 'shield-car',
    iconLibrary: 'MaterialCommunityIcons',
    iconColor: Colors.pinkRide,
    etaMinutes: 5,
    priceMin: 110,
    priceMax: 135,
    womensOnly: true,
  },
  {
    id: 'bike',
    label: 'KeralaGO Bike',
    iconName: 'motorbike',
    iconLibrary: 'MaterialCommunityIcons',
    iconColor: '#3B82F6',
    etaMinutes: 1,
    priceMin: 30,
    priceMax: 40,
  },
];

const CustomerHomePage: React.FC = () => {
  const { user, toggleRole } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [isBookingSheetOpen, setIsBookingSheetOpen] = useState<boolean>(false);
  const [selectedRideId, setSelectedRideId] = useState<string>('auto');
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);

  // Quick destinations
  const recentDestinations = [
    {
      id: '1',
      title: 'Lulu Mall, Edappally',
      subtitle: 'Kochi, Kerala • 4.2 km',
      iconName: 'bag-handle-outline',
    },
    {
      id: '2',
      title: 'Ernakulam South Railway Station',
      subtitle: 'Railway Station Rd, South Chalikkavattom • 2.8 km',
      iconName: 'train-outline',
    },
    {
      id: '3',
      title: 'Cochin International Airport (COK)',
      subtitle: 'Nedumbassery, Kochi • 24.5 km',
      iconName: 'airplane-outline',
    },
    {
      id: '4',
      title: 'Marine Drive Walkway',
      subtitle: 'Shanmugham Rd, Marine Drive, Ernakulam • 3.5 km',
      iconName: 'water-outline',
    },
  ];

  const handleSelectDestination = (title: string) => {
    setSelectedDestination(title);
    setIsBookingSheetOpen(true);
    setBookingSuccess(false);
  };

  const handleConfirmRide = () => {
    setBookingSuccess(true);
    setTimeout(() => {
      setIsBookingSheetOpen(false);
      setBookingSuccess(false);
      Alert.alert(
        'Ride Confirmed! 🚕',
        `Your KeralaGO ride to "${selectedDestination || 'Destination'}" has been requested. Driver Suresh is on the way!`
      );
    }, 1200);
  };

  return (
    <View style={styles.root}>
      {/* ── Background Map Layer ── */}
      <KeralaMapBackground
        showVehicles={true}
        activeDestination={selectedDestination}
      />

      {/* ── Safe Area Content Overlay ── */}
      <SafeAreaView edges={['top']} style={styles.topContainer}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <View style={styles.userInfoBlock}>
            <Avatar
              name={user?.name || 'Customer'}
              size="md"
              online={true}
              verified={true}
            />
            <View style={styles.greetingCol}>
              <View style={styles.greetingRow}>
                <Typography variant="body2" color={Colors.textMuted}>
                  Namaskaram,
                </Typography>
                <Badge variant="primary" label="Customer" size="sm" />
              </View>
              <Typography variant="h3" weight="bold" color={Colors.textPrimary}>
                {user?.name?.split(' ')[0] || 'User'} 👋
              </Typography>
            </View>
          </View>

          {/* Right Action Icons: SOS & Notifications */}
          <View style={styles.topActionsRow}>
            <FloatingMapButton
              iconName="notifications-outline"
              badgeCount={2}
              diameter={40}
              onPress={() => Alert.alert('KeralaGO Notifications', 'No new alerts.')}
            />
            <TouchableOpacity
              style={styles.sosButton}
              activeOpacity={0.8}
              onPress={() =>
                Alert.alert(
                  'KeralaGO SOS Emergency',
                  'Emergency response services alerted. Location shared with Kerala Police control room.',
                  [{ text: 'Dismiss', style: 'cancel' }]
                )
              }
            >
              <Icon library="Ionicons" name="alert-circle" size={16} color={Colors.white} />
              <Typography variant="xs" weight="bold" color={Colors.white}>
                SOS
              </Typography>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Prominent Role Switcher Banner ── */}
        <View style={styles.roleToggleBanner}>
          <View style={styles.roleToggleInfo}>
            <View style={styles.roleIconCircle}>
              <Icon
                library="MaterialCommunityIcons"
                name="steering"
                size={18}
                color={Colors.primary}
              />
            </View>
            <View>
              <Typography variant="label" weight="bold" color={Colors.primaryDark}>
                Driver Mode Switch
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

        {/* ── Search Bar ── */}
        <View style={styles.searchBarWrapper}>
          <FloatingSearchBar
            placeholder={selectedDestination ? `To: ${selectedDestination}` : 'Where do you want to go?'}
            timeLabel="Now"
            onPress={() => handleSelectDestination('Lulu Mall, Edappally')}
            onTimeSelectorPress={() => Alert.alert('Schedule Trip', 'Schedule rides across Kerala with KeralaGO.')}
          />
        </View>
      </SafeAreaView>

      {/* ── Bottom Sheet / Scrollable Suggestions Sheet ── */}
      <View style={styles.contentDrawer}>
        <View style={styles.drawerHandle} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.drawerScrollContent}
        >
          {/* Service Categories Grid */}
          <Typography variant="h4" weight="bold" color={Colors.textPrimary} style={styles.sectionTitle}>
            Suggestions & Ride Modes
          </Typography>

          <View style={styles.categoriesGrid}>
            <ServiceCategoryCard
              label="Auto"
              iconName="rickshaw"
              iconLibrary="MaterialCommunityIcons"
              iconColor="#B45309"
              iconBg="#FEF3C7"
              onPress={() => {
                setSelectedRideId('auto');
                handleSelectDestination('MG Road Central, Kochi');
              }}
            />
            <ServiceCategoryCard
              label="Comfort"
              iconName="car"
              iconLibrary="Ionicons"
              iconColor={Colors.primary}
              iconBg={Colors.mint}
              onPress={() => {
                setSelectedRideId('car');
                handleSelectDestination('Ernakulam South Station');
              }}
            />
            <ServiceCategoryCard
              label="Pink Ride"
              iconName="shield-checkmark"
              iconLibrary="Ionicons"
              iconColor={Colors.pinkRide}
              iconBg="#FCE7F3"
              badge={<Badge variant="pink" label="Women" size="sm" />}
              onPress={() => {
                setSelectedRideId('pink');
                handleSelectDestination('Marine Drive Promenade');
              }}
            />
            <ServiceCategoryCard
              label="Moto"
              iconName="two-wheeler"
              iconLibrary="MaterialIcons"
              iconColor="#2563EB"
              iconBg="#DBEAFE"
              onPress={() => {
                setSelectedRideId('bike');
                handleSelectDestination('Infopark Kakkanad');
              }}
            />
          </View>

          {/* Recent & Saved Locations */}
          <View style={styles.recentSectionHeader}>
            <Typography variant="h4" weight="bold" color={Colors.textPrimary}>
              Recent Destinations
            </Typography>
            <TouchableOpacity onPress={() => Alert.alert('Saved Places', 'All saved locations')}>
              <Typography variant="label" weight="semiBold" color={Colors.primary}>
                View all
              </Typography>
            </TouchableOpacity>
          </View>

          <View style={styles.recentListCard}>
            {recentDestinations.map((item) => (
              <LocationListItem
                key={item.id}
                title={item.title}
                subtitle={item.subtitle}
                iconName={item.iconName}
                onPress={() => handleSelectDestination(item.title)}
              />
            ))}
          </View>

          {/* Quick Info Banner */}
          <View style={styles.promoBanner}>
            <View style={styles.promoIcon}>
              <Icon library="Ionicons" name="leaf" size={20} color={Colors.primary} />
            </View>
            <View style={styles.promoText}>
              <Typography variant="body2" weight="bold" color={Colors.primaryDark}>
                Green Kerala Mobility Initiative
              </Typography>
              <Typography variant="caption" color={Colors.textSecondary}>
                Eco-friendly electric & hybrid rides now live across Kochi & Trivandrum.
              </Typography>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* ── Booking & Ride Selection Bottom Sheet ── */}
      <BottomSheet
        visible={isBookingSheetOpen}
        onClose={() => setIsBookingSheetOpen(false)}
        showBackdrop={true}
      >
        <View style={styles.bookingSheetContent}>
          <Typography variant="h3" weight="bold" color={Colors.textPrimary}>
            Select KeralaGO Ride
          </Typography>
          <Typography variant="caption" color={Colors.textMuted} style={{ marginBottom: Spacing.md }}>
            Destination: {selectedDestination || 'Selected Location'}
          </Typography>

          <RideSelectionList
            options={RIDE_OPTIONS}
            selectedId={selectedRideId}
            onSelect={setSelectedRideId}
          />

          <View style={styles.paymentMethodRow}>
            <View style={styles.paymentLeft}>
              <Icon library="Ionicons" name="cash-outline" size={20} color={Colors.primary} />
              <Typography variant="body2" weight="medium" color={Colors.textPrimary}>
                Cash / UPI on Arrival
              </Typography>
            </View>
            <Badge variant="success" label="Active" size="sm" />
          </View>

          <Button
            label={bookingSuccess ? 'Booking Ride...' : 'Confirm & Request Ride'}
            variant="primary"
            size="lg"
            fullWidth
            loading={bookingSuccess}
            onPress={handleConfirmRide}
          />
        </View>
      </BottomSheet>

      {/* ── Bottom Tab Bar ── */}
      <BottomTabBar
        tabs={CUSTOMER_TABS}
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
  userInfoBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  greetingCol: {
    justifyContent: 'center',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.danger,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radii.full,
    ...Shadows.sm,
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
    backgroundColor: Colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  searchBarWrapper: {
    marginTop: Spacing.sm,
  },
  contentDrawer: {
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
  sectionTitle: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  categoriesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  recentSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  recentListCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.mintLight,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginTop: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.mintBorder,
  },
  promoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoText: {
    flex: 1,
  },
  bookingSheetContent: {
    paddingBottom: Spacing.sm,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radii.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});

export default CustomerHomePage;

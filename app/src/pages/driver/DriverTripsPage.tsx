import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Typography,
  Card,
  Divider,
} from '../../components/atoms';
import {
  SegmentTabs,
  SegmentOption,
} from '../../components/molecules';
import {
  NavigationHeader,
  BottomTabBar,
  TripHistoryItem,
  TabItem,
} from '../../components/organisms';
import { Colors, Spacing, Radii, Shadows } from '../../constants/theme';

const TRIP_STATUS_OPTIONS: SegmentOption[] = [
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

interface TripRecord {
  id: string;
  time: string;
  dotColor: string;
  pickup: string;
  dropoff: string;
  fare: string;
}

const TODAY_TRIPS: TripRecord[] = [
  {
    id: 't1',
    time: '10:15 AM',
    dotColor: '#10B981',
    pickup: 'M B Hostel',
    dropoff: 'Mar Athanasius College',
    fare: '₹120',
  },
  {
    id: 't2',
    time: '09:42 AM',
    dotColor: '#EF4444',
    pickup: 'Kattuchira',
    dropoff: 'M B Hostel',
    fare: '₹85',
  },
  {
    id: 't3',
    time: '08:20 AM',
    dotColor: '#3B82F6',
    pickup: 'MACE',
    dropoff: 'Ernakulam Jn',
    fare: '₹165',
  },
  {
    id: 't4',
    time: '07:15 AM',
    dotColor: '#10B981',
    pickup: 'Collectorate',
    dropoff: 'Kothamangalam',
    fare: '₹110',
  },
];

const YESTERDAY_TRIPS: TripRecord[] = [
  {
    id: 'y1',
    time: '08:30 PM',
    dotColor: '#EF4444',
    pickup: 'Lulu Mall',
    dropoff: 'M B Hostel',
    fare: '₹150',
  },
  {
    id: 'y2',
    time: '06:10 PM',
    dotColor: '#EF4444',
    pickup: 'Mar Athanasius College',
    dropoff: 'Kattuchira',
    fare: '₹95',
  },
];

export interface DriverTripsPageProps {
  onBack?: () => void;
  activeTab?: string;
  onTabPress?: (id: string) => void;
  tabs?: TabItem[];
}

const DriverTripsPage: React.FC<DriverTripsPageProps> = ({
  onBack,
  activeTab = 'bookings',
  onTabPress = () => {},
  tabs = [],
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('completed');

  const handleTripPress = (trip: TripRecord) => {
    Alert.alert(
      'Trip Summary',
      `Route: ${trip.pickup} → ${trip.dropoff}\nTime: ${trip.time}\nFare: ${trip.fare}\nPayment: Cash / UPI Verified`,
    );
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeHeaderArea}>
        <NavigationHeader
          title="Trips"
          showBack={true}
          onBack={onBack}
        />
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Segment Filter Tabs (Completed / Cancelled) ── */}
        <View style={styles.segmentWrapper}>
          <SegmentTabs
            options={TRIP_STATUS_OPTIONS}
            selectedId={selectedStatus}
            onSelect={setSelectedStatus}
            variant="mint"
            style={styles.segmentTabs}
          />
        </View>

        {selectedStatus === 'completed' ? (
          <>
            {/* ── Section: Today ── */}
            <View style={styles.sectionHeaderRow}>
              <Typography variant="body1" weight="bold" color={Colors.textPrimary}>
                Today
              </Typography>
              <Typography variant="caption" color={Colors.textSecondary}>
                12 trips <Typography variant="caption" weight="bold" color={Colors.textPrimary}>₹1,240</Typography>
              </Typography>
            </View>

            <Card style={styles.tripsCard}>
              {TODAY_TRIPS.map((trip, idx) => (
                <TripHistoryItem
                  key={trip.id}
                  variant="compact"
                  timeText={trip.time}
                  dotColor={trip.dotColor}
                  pickup={trip.pickup}
                  dropoff={trip.dropoff}
                  fare={trip.fare}
                  showDivider={idx < TODAY_TRIPS.length - 1}
                  onPress={() => handleTripPress(trip)}
                />
              ))}
            </Card>

            {/* ── Section: Yesterday ── */}
            <View style={[styles.sectionHeaderRow, { marginTop: Spacing.xl }]}>
              <Typography variant="body1" weight="bold" color={Colors.textPrimary}>
                Yesterday
              </Typography>
              <Typography variant="caption" color={Colors.textSecondary}>
                14 trips <Typography variant="caption" weight="bold" color={Colors.textPrimary}>₹1,360</Typography>
              </Typography>
            </View>

            <Card style={styles.tripsCard}>
              {YESTERDAY_TRIPS.map((trip, idx) => (
                <TripHistoryItem
                  key={trip.id}
                  variant="compact"
                  timeText={trip.time}
                  dotColor={trip.dotColor}
                  pickup={trip.pickup}
                  dropoff={trip.dropoff}
                  fare={trip.fare}
                  showDivider={idx < YESTERDAY_TRIPS.length - 1}
                  onPress={() => handleTripPress(trip)}
                />
              ))}
            </Card>
          </>
        ) : (
          /* Empty Cancelled State */
          <View style={styles.emptyContainer}>
            <Typography variant="body1" weight="bold" color={Colors.textPrimary}>
              No cancelled trips today
            </Typography>
            <Typography variant="caption" color={Colors.textSecondary} style={{ marginTop: 4 }}>
              Great job maintaining a 100% completion rate!
            </Typography>
          </View>
        )}
      </ScrollView>

      {/* ── Bottom Tab Bar ── */}
      {tabs.length > 0 && (
        <BottomTabBar
          tabs={tabs}
          activeTabId={activeTab}
          onTabPress={onTabPress}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  safeHeaderArea: {
    backgroundColor: Colors.white,
  },
  scrollContent: {
    paddingBottom: Spacing['3xl'],
  },
  segmentWrapper: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  segmentTabs: {
    width: '100%',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: Radii.full,
    padding: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.xs,
  },
  tripsCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.base,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: '#EFF3F0',
    ...Shadows.sm,
  },
  emptyContainer: {
    padding: Spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
});

export default DriverTripsPage;

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { apiGet } from '../../services/apiClient';
import { Icon } from '../../components/atoms';
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
  const [driverTrips, setDriverTrips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    apiGet<any[]>('/driver/trips/', []).then((res) => {
      if (isMounted) {
        setDriverTrips(res.data || []);
        setIsLoading(false);
      }
    }).catch(() => {
      if (isMounted) {
        setDriverTrips([]);
        setIsLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, []);

  const filtered = driverTrips.filter((t) => (t.status || 'completed').toLowerCase() === selectedStatus);

  const handleTripPress = (trip: any) => {
    Alert.alert(
      'Trip Summary',
      `Route: ${trip.pickup} → ${trip.dropoff}\nEarnings: ${trip.earnings}\nStatus: ${trip.status}`,
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

        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Typography variant="body2" color={Colors.textMuted} style={{ marginTop: 10 }}>
              Loading driver trips...
            </Typography>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon library="Ionicons" name="car-outline" size={44} color={Colors.textMuted} />
            <Typography variant="h3" weight="bold" color={Colors.textPrimary} style={{ marginTop: 14 }}>
              No {selectedStatus === 'completed' ? 'Completed' : 'Cancelled'} Trips
            </Typography>
            <Typography variant="body2" color={Colors.textMuted} align="center" style={{ marginTop: 6, maxWidth: 260 }}>
              You don't have any {selectedStatus} rides logged under this driver account.
            </Typography>
          </View>
        ) : (
          <Card style={styles.tripsCard}>
            {filtered.map((trip, idx) => (
              <TripHistoryItem
                key={trip.id}
                variant="compact"
                timeText={trip.timeAgo || 'Recently'}
                dotColor={trip.status === 'cancelled' ? '#EF4444' : '#10B981'}
                pickup={trip.pickup}
                dropoff={trip.dropoff}
                fare={trip.earnings || '₹0'}
                showDivider={idx < filtered.length - 1}
                onPress={() => handleTripPress(trip)}
              />
            ))}
          </Card>
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

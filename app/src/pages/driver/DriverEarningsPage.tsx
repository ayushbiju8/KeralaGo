import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Typography,
  Card,
  Divider,
  Icon,
} from '../../components/atoms';
import {
  SegmentTabs,
  SegmentOption,
  InfoRow,
} from '../../components/molecules';
import {
  NavigationHeader,
  BottomTabBar,
  TabItem,
} from '../../components/organisms';
import { Colors, Spacing, Radii, Shadows } from '../../constants/theme';

const EARNINGS_SEGMENTS: SegmentOption[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

const CHART_DATA = [
  { time: '6', heightPct: 20 },
  { time: '9', heightPct: 60 },
  { time: '12', heightPct: 100 },
  { time: '15', heightPct: 75 },
  { time: '18', heightPct: 85 },
  { time: '21', heightPct: 30 },
];

export interface DriverEarningsPageProps {
  onBack?: () => void;
  activeTab?: string;
  onTabPress?: (id: string) => void;
  tabs?: TabItem[];
}

const DriverEarningsPage: React.FC<DriverEarningsPageProps> = ({
  onBack,
  activeTab = 'earnings',
  onTabPress = () => {},
  tabs = [],
}) => {
  const [selectedSegment, setSelectedSegment] = useState<string>('daily');

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeHeaderArea}>
        <NavigationHeader
          title="Earnings"
          showBack={true}
          onBack={onBack}
        />
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Segment Filter Tabs (Daily / Weekly / Monthly) ── */}
        <View style={styles.segmentWrapper}>
          <SegmentTabs
            options={EARNINGS_SEGMENTS}
            selectedId={selectedSegment}
            onSelect={setSelectedSegment}
            variant="green"
            style={styles.segmentTabs}
          />
        </View>

        {/* ── Main Earnings Card with Chart ── */}
        <Card style={styles.mainCard}>
          <Typography variant="body2" weight="bold" color={Colors.textPrimary} align="center">
            Today
          </Typography>
          <Typography variant="caption" color={Colors.textSecondary} align="center" style={{ marginTop: 2 }}>
            16 Sep 2026
          </Typography>

          {/* Large Earnings Value */}
          <Typography variant="h1" weight="bold" color={Colors.textPrimary} align="center" style={styles.earningsValue}>
            ₹1,240
          </Typography>
          <Typography variant="caption" color={Colors.textSecondary} align="center">
            Total Earnings
          </Typography>

          {/* 3 Metric Mini Cards */}
          <View style={styles.metricsRow}>
            {/* 1. Trips */}
            <View style={styles.metricCard}>
              <Typography variant="body1" weight="bold" color={Colors.textPrimary} align="center">
                12
              </Typography>
              <Typography variant="caption" color={Colors.textSecondary} align="center" style={{ marginTop: 2 }}>
                Trips
              </Typography>
            </View>

            {/* 2. Online Time */}
            <View style={styles.metricCard}>
              <Typography variant="body1" weight="bold" color={Colors.textPrimary} align="center">
                10h 20m
              </Typography>
              <Typography variant="caption" color={Colors.textSecondary} align="center" style={{ marginTop: 2 }}>
                Online Time
              </Typography>
            </View>

            {/* 3. Per Trip */}
            <View style={styles.metricCard}>
              <Typography variant="body1" weight="bold" color={Colors.textPrimary} align="center">
                ₹103
              </Typography>
              <Typography variant="caption" color={Colors.textSecondary} align="center" style={{ marginTop: 2 }}>
                Per Trip
              </Typography>
            </View>
          </View>

          {/* ── Hourly Bar Chart ── */}
          <View style={styles.chartContainer}>
            {/* Background horizontal band */}
            <View style={styles.chartBand} />

            <View style={styles.barsRow}>
              {CHART_DATA.map((item) => (
                <View key={item.time} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: `${item.heightPct}%` },
                      ]}
                    />
                  </View>
                  <Typography variant="xs" color={Colors.textSecondary} align="center" style={{ marginTop: 6 }}>
                    {item.time}
                  </Typography>
                </View>
              ))}
            </View>
          </View>
        </Card>

        {/* ── Earnings Breakdown Section ── */}
        <Typography variant="h4" weight="bold" color={Colors.textPrimary} style={styles.sectionTitle}>
          Earnings Breakdown
        </Typography>

        <Card style={styles.breakdownCard}>
          <InfoRow
            iconName="steering"
            iconLibrary="MaterialCommunityIcons"
            label="Trip Earnings"
            rightNode={<Typography variant="body1" weight="bold" color={Colors.textPrimary}>₹1,180</Typography>}
          />
          <InfoRow
            iconName="hand-coin"
            iconLibrary="MaterialCommunityIcons"
            label="Tips"
            rightNode={<Typography variant="body1" weight="bold" color={Colors.textPrimary}>₹60</Typography>}
          />
          <InfoRow
            iconName="gift-outline"
            label="Incentives"
            rightNode={<Typography variant="body1" weight="bold" color={Colors.textPrimary}>₹0</Typography>}
            showDivider={false}
          />
        </Card>
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
    alignItems: 'center',
  },
  segmentTabs: {
    width: '100%',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: Radii.full,
    padding: 4,
  },

  // ── Main Card ──
  mainCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.base,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: '#EFF3F0',
    ...Shadows.sm,
  },
  earningsValue: {
    fontSize: 32,
    marginTop: Spacing.xs,
    marginBottom: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F8FAF8',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: '#EFF3F0',
  },

  // ── Chart ──
  chartContainer: {
    marginTop: Spacing.xl,
    height: 110,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  chartBand: {
    position: 'absolute',
    bottom: 22,
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: '#E8F5E9',
    borderRadius: Radii.xs,
    opacity: 0.7,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 80,
    zIndex: 2,
  },
  barCol: {
    alignItems: 'center',
    width: 28,
  },
  barTrack: {
    height: 60,
    width: 14,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: 14,
    backgroundColor: '#0F4A2B',
    borderRadius: 3,
  },

  // ── Section Title ──
  sectionTitle: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },

  // ── Breakdown Card ──
  breakdownCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.base,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: '#EFF3F0',
    ...Shadows.sm,
  },
});

export default DriverEarningsPage;

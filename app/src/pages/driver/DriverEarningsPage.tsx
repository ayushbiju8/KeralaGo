import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiGet } from '../../services/apiClient';
import {
  Typography,
  Card,
  Divider,
  Icon,
  Badge,
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
import { Colors, Spacing, Radii, Shadows, FontSize } from '../../constants/theme';

const EARNINGS_SEGMENTS: SegmentOption[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

interface ChartBarItem {
  id: string;
  label: string;
  detailLabel: string;
  heightPct: number;
}

const CHART_SERIES: Record<string, ChartBarItem[]> = {
  daily: [
    { id: '6am', label: '6a', detailLabel: '6:00 AM – 9:00 AM', heightPct: 22 },
    { id: '9am', label: '9a', detailLabel: '9:00 AM – 12:00 PM', heightPct: 62 },
    { id: '12pm', label: '12p', detailLabel: '12:00 PM – 3:00 PM', heightPct: 100 },
    { id: '3pm', label: '3p', detailLabel: '3:00 PM – 6:00 PM', heightPct: 74 },
    { id: '6pm', label: '6p', detailLabel: '6:00 PM – 9:00 PM', heightPct: 88 },
    { id: '9pm', label: '9p', detailLabel: '9:00 PM – 12:00 AM', heightPct: 34 },
  ],
  weekly: [
    { id: 'mon', label: 'Mon', detailLabel: 'Monday', heightPct: 55 },
    { id: 'tue', label: 'Tue', detailLabel: 'Tuesday', heightPct: 70 },
    { id: 'wed', label: 'Wed', detailLabel: 'Wednesday', heightPct: 48 },
    { id: 'thu', label: 'Thu', detailLabel: 'Thursday', heightPct: 82 },
    { id: 'fri', label: 'Fri', detailLabel: 'Friday', heightPct: 95 },
    { id: 'sat', label: 'Sat', detailLabel: 'Saturday', heightPct: 100 },
    { id: 'sun', label: 'Sun', detailLabel: 'Sunday', heightPct: 64 },
  ],
  monthly: [
    { id: 'w1', label: 'Wk 1', detailLabel: 'Week 1', heightPct: 68 },
    { id: 'w2', label: 'Wk 2', detailLabel: 'Week 2', heightPct: 84 },
    { id: 'w3', label: 'Wk 3', detailLabel: 'Week 3', heightPct: 76 },
    { id: 'w4', label: 'Wk 4', detailLabel: 'Week 4 (Current)', heightPct: 100 },
  ],
};

function parseCurrency(value?: string | number | null): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getPeriodMeta(segment: string) {
  const now = new Date();
  const formattedToday = now.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const formattedMonth = now.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  if (segment === 'weekly') {
    return { title: 'This Week', subtitle: 'Last 7 days summary', caption: 'Weekly Total Earnings' };
  }
  if (segment === 'monthly') {
    return { title: 'This Month', subtitle: formattedMonth, caption: 'Monthly Total Earnings' };
  }
  return { title: 'Today', subtitle: formattedToday, caption: 'Total Earnings Today' };
}

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
  const [selectedBarId, setSelectedBarId] = useState<string | null>(null);
  const [earningsData, setEarningsData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEarnings = useCallback(async () => {
    const res = await apiGet<any>('/driver/earnings/', null);
    if (res.data) {
      setEarningsData(res.data);
    }
  }, []);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEarnings();
    setRefreshing(false);
  }, [fetchEarnings]);

  const handleSegmentChange = (id: string) => {
    setSelectedSegment(id);
    setSelectedBarId(null);
  };

  const summary = earningsData?.summary || {
    todayEarnings: '₹0.00',
    weeklyEarnings: '₹0.00',
    tripsCountToday: 0,
    onlineHoursToday: '0.0 hrs',
    acceptanceRate: '0%',
    currentBalance: '₹0.00',
  };

  const periodMeta = useMemo(() => getPeriodMeta(selectedSegment), [selectedSegment]);

  const activeTotalAmount = useMemo(() => {
    if (selectedSegment === 'weekly') {
      return parseCurrency(summary.weeklyEarnings);
    }
    return parseCurrency(summary.todayEarnings);
  }, [selectedSegment, summary.todayEarnings, summary.weeklyEarnings]);

  const tripsCount = summary.tripsCountToday ?? 0;
  const avgPerTrip = tripsCount > 0 ? activeTotalAmount / tripsCount : 0;
  const balanceAmount = parseCurrency(summary.currentBalance ?? summary.todayEarnings);

  const chartBars = CHART_SERIES[selectedSegment] || CHART_SERIES.daily;
  const peakBar = useMemo(
    () => chartBars.reduce((best, b) => (b.heightPct > best.heightPct ? b : best), chartBars[0]),
    [chartBars],
  );
  const activeBar = chartBars.find((b) => b.id === selectedBarId) || peakBar;

  const bankAccount = earningsData?.bankAccount;
  const maskedAccount = bankAccount?.accountNumber
    ? `•••• ${String(bankAccount.accountNumber).slice(-4)}`
    : null;

  const recentTransactions: any[] = Array.isArray(earningsData?.recentTransactions)
    ? earningsData.recentTransactions
    : [];

  const handleWithdraw = () => {
    if (balanceAmount <= 0) {
      Alert.alert('No Balance Available', 'Complete trips to build an available payout balance.');
      return;
    }
    if (!bankAccount) {
      Alert.alert(
        'Link Bank Account',
        'Please add your bank account details in Driver Profile before requesting a payout.',
      );
      return;
    }
    Alert.alert(
      'Payout Request',
      `Transfer ${formatInr(balanceAmount)} to ${bankAccount.bankName || 'Bank Account'} (${maskedAccount})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => Alert.alert('Submitted', 'Your payout request has been queued.'),
        },
      ],
    );
  };

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* ── Segment Filter Tabs (Daily / Weekly / Monthly) ── */}
        <View style={styles.segmentWrapper}>
          <SegmentTabs
            options={EARNINGS_SEGMENTS}
            selectedId={selectedSegment}
            onSelect={handleSegmentChange}
            variant="green"
            style={styles.segmentTabs}
          />
        </View>

        {/* ── Emerald Hero Earnings & Wallet Card ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Typography variant="body2" weight="bold" color={Colors.textInverse}>
                {periodMeta.title}
              </Typography>
              <Typography variant="caption" color={Colors.mintDark} style={styles.heroSubtitle}>
                {periodMeta.subtitle}
              </Typography>
            </View>
            <Badge
              variant="success"
              size="sm"
              dot={true}
              label={`Acceptance ${summary.acceptanceRate || '0%'}`}
            />
          </View>

          <Typography
            variant="h1"
            weight="extraBold"
            color={Colors.textInverse}
            style={styles.heroAmount}
          >
            {formatInr(activeTotalAmount)}
          </Typography>
          <Typography variant="caption" color={Colors.mintDark}>
            {periodMeta.caption}
          </Typography>

          {/* Wallet / Payout Strip */}
          <View style={styles.walletStrip}>
            <View style={styles.walletInfo}>
              <View style={styles.walletIconWrap}>
                <Icon library="Ionicons" name="wallet-outline" size="md" color={Colors.mint} />
              </View>
              <View>
                <Typography variant="xs" color={Colors.mintDark}>
                  Available Balance
                </Typography>
                <Typography variant="body1" weight="bold" color={Colors.textInverse}>
                  {formatInr(balanceAmount)}
                </Typography>
              </View>
            </View>

            <TouchableOpacity
              style={styles.withdrawBtn}
              onPress={handleWithdraw}
              activeOpacity={0.8}
            >
              <Typography variant="caption" weight="bold" color={Colors.primary}>
                {maskedAccount ? `Withdraw · ${maskedAccount}` : 'Withdraw'}
              </Typography>
              <Icon library="Ionicons" name="arrow-forward" size="sm" color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 3-Column KPI Strip ── */}
        <View style={styles.metricsRow}>
          <Card style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: Colors.mint }]}>
              <Icon library="Ionicons" name="car-outline" size="sm" color={Colors.primary} />
            </View>
            <Typography variant="h4" weight="bold" color={Colors.textPrimary} style={styles.metricValue}>
              {tripsCount}
            </Typography>
            <Typography variant="xs" color={Colors.textSecondary}>
              Trips Today
            </Typography>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: Colors.mint }]}>
              <Icon library="Ionicons" name="time-outline" size="sm" color={Colors.primary} />
            </View>
            <Typography variant="h4" weight="bold" color={Colors.textPrimary} style={styles.metricValue}>
              {summary.onlineHoursToday || '0.0 hrs'}
            </Typography>
            <Typography variant="xs" color={Colors.textSecondary}>
              Online Time
            </Typography>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: Colors.mint }]}>
              <Icon library="Ionicons" name="trending-up-outline" size="sm" color={Colors.primary} />
            </View>
            <Typography variant="h4" weight="bold" color={Colors.textPrimary} style={styles.metricValue}>
              {formatInr(avgPerTrip)}
            </Typography>
            <Typography variant="xs" color={Colors.textSecondary}>
              Avg / Trip
            </Typography>
          </Card>
        </View>

        {/* ── Interactive Activity Chart Card ── */}
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Typography variant="h4" weight="bold" color={Colors.textPrimary}>
                Activity Trend
              </Typography>
              <Typography variant="xs" color={Colors.textSecondary}>
                Tap a bar to inspect time slot
              </Typography>
            </View>
            <View style={styles.chartPill}>
              <Typography variant="xs" weight="semiBold" color={Colors.primary}>
                {activeBar.detailLabel} · {activeBar.heightPct}%
              </Typography>
            </View>
          </View>

          <View style={styles.chartContainer}>
            <View style={styles.chartBand} />
            <View style={styles.barsRow}>
              {chartBars.map((item) => {
                const isSelected = item.id === activeBar.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.barCol}
                    onPress={() => setSelectedBarId(item.id)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${item.heightPct}%`,
                            backgroundColor: isSelected ? Colors.primary : Colors.mintDark,
                          },
                        ]}
                      />
                    </View>
                    <Typography
                      variant="xs"
                      weight={isSelected ? 'bold' : 'regular'}
                      color={isSelected ? Colors.primary : Colors.textSecondary}
                      align="center"
                      style={styles.barLabel}
                    >
                      {item.label}
                    </Typography>
                  </TouchableOpacity>
                );
              })}
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
            iconColor={Colors.primary}
            label="Trip Earnings"
            rightNode={
              <Typography variant="body1" weight="bold" color={Colors.textPrimary}>
                {formatInr(activeTotalAmount)}
              </Typography>
            }
          />
          <InfoRow
            iconName="hand-coin"
            iconLibrary="MaterialCommunityIcons"
            iconColor={Colors.warning}
            label="Tips"
            rightNode={
              <Typography variant="body1" weight="bold" color={Colors.textPrimary}>
                ₹0.00
              </Typography>
            }
          />
          <InfoRow
            iconName="gift-outline"
            iconColor={Colors.primaryVibrant}
            label="Incentives & Surge"
            rightNode={
              <Typography variant="body1" weight="bold" color={Colors.textPrimary}>
                ₹0.00
              </Typography>
            }
            showDivider={false}
          />
          <Divider style={styles.totalDivider} />
          <View style={styles.netTotalRow}>
            <Typography variant="body2" weight="bold" color={Colors.textPrimary}>
              Net Earnings
            </Typography>
            <Typography variant="h3" weight="bold" color={Colors.primary}>
              {formatInr(activeTotalAmount)}
            </Typography>
          </View>
        </Card>

        {/* ── Recent Transactions / Ledger ── */}
        <View style={styles.sectionHeaderRow}>
          <Typography variant="h4" weight="bold" color={Colors.textPrimary}>
            Recent Transactions
          </Typography>
          {recentTransactions.length > 0 && (
            <Typography variant="caption" color={Colors.textSecondary}>
              Latest {recentTransactions.length}
            </Typography>
          )}
        </View>

        <Card style={styles.transactionsCard}>
          {recentTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Icon library="Ionicons" name="receipt-outline" size="lg" color={Colors.textMuted} />
              </View>
              <Typography variant="body2" weight="semiBold" color={Colors.textPrimary}>
                No transactions yet
              </Typography>
              <Typography variant="caption" color={Colors.textSecondary} align="center">
                Completed trip settlements and bank payouts will appear here.
              </Typography>
            </View>
          ) : (
            recentTransactions.map((tx, idx) => {
              const isCredit = Number(tx.amount) >= 0;
              const isLast = idx === recentTransactions.length - 1;
              return (
                <View key={tx.id || String(idx)}>
                  <View style={styles.txRow}>
                    <View
                      style={[
                        styles.txIconWrap,
                        { backgroundColor: isCredit ? Colors.mintLight : Colors.surface },
                      ]}
                    >
                      <Icon
                        library="Ionicons"
                        name={isCredit ? 'arrow-down-left' : 'arrow-up-right'}
                        size="sm"
                        color={isCredit ? Colors.success : Colors.danger}
                      />
                    </View>
                    <View style={styles.txBody}>
                      <Typography variant="body2" weight="semiBold" color={Colors.textPrimary}>
                        {tx.description || tx.type || 'Trip Settlement'}
                      </Typography>
                      <Typography variant="xs" color={Colors.textSecondary}>
                        {tx.date || ''}
                      </Typography>
                    </View>
                    <Typography
                      variant="body2"
                      weight="bold"
                      color={isCredit ? Colors.success : Colors.danger}
                    >
                      {isCredit ? '+' : '-'}{formatInr(Math.abs(Number(tx.amount || 0)))}
                    </Typography>
                  </View>
                  {!isLast && <Divider />}
                </View>
              );
            })
          )}
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
    backgroundColor: Colors.surface,
  },
  safeHeaderArea: {
    backgroundColor: Colors.white,
  },
  scrollContent: {
    paddingBottom: Spacing['3xl'],
  },
  segmentWrapper: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    alignItems: 'center',
  },
  segmentTabs: {
    width: '100%',
    justifyContent: 'space-between',
    backgroundColor: Colors.borderLight,
    borderRadius: Radii.full,
    padding: Spacing.xs,
  },

  // ── Hero Card ──
  heroCard: {
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.xs,
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    ...Shadows.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroSubtitle: {
    marginTop: 2,
  },
  heroAmount: {
    fontSize: FontSize.display,
    marginTop: Spacing.md,
    letterSpacing: -0.5,
  },
  walletStrip: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.primaryLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  walletIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radii.md,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.mint,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.full,
  },

  // ── KPI Strip ──
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    ...Shadows.xs,
  },
  metricIconBox: {
    width: 30,
    height: 30,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  metricValue: {
    marginBottom: 2,
  },

  // ── Chart Card ──
  chartCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    padding: Spacing.base,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  chartPill: {
    backgroundColor: Colors.mintLight,
    borderWidth: 1,
    borderColor: Colors.mintBorder,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
  },
  chartContainer: {
    marginTop: Spacing.lg,
    height: 112,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  chartBand: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: Colors.mintLight,
    borderRadius: Radii.xs,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 92,
    zIndex: 2,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    height: 68,
    width: 18,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radii.xs,
    overflow: 'hidden',
  },
  barFill: {
    width: 18,
    borderRadius: Radii.xs,
  },
  barLabel: {
    marginTop: Spacing.xs,
  },

  // ── Section Titles ──
  sectionTitle: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  sectionHeaderRow: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // ── Breakdown Card ──
  breakdownCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  totalDivider: {
    marginVertical: Spacing.sm,
  },
  netTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xs,
  },

  // ── Transactions Card ──
  transactionsCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    padding: Spacing.base,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.xs,
  },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  txIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txBody: {
    flex: 1,
    gap: 2,
  },
});

export default DriverEarningsPage;

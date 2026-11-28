import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { fetchCustomerDashboard, topUpWallet } from '../../../services/tripService';
import { apiPost } from '../../../services/apiClient';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Typography,
  Card,
  Button,
  Badge,
  Icon,
  Divider,
  Skeleton,
} from '../../../components/atoms';
import { PaymentOptionItem, WalletCardSkeleton, TripItemSkeleton } from '../../../components/molecules';
import { NavigationHeader } from '../../../components/organisms';
import { Colors, Spacing, Radii } from '../../../constants/theme';
import { customerData } from '../../../data';
const DEFAULT_PAYMENT_OPTIONS = [
  { id: 'upi', title: 'UPI (GPay, PhonePe, Paytm)', subtitle: 'Instant 0% transaction fee', iconName: 'flash-outline' },
  { id: 'card', title: 'Credit / Debit Card', subtitle: 'Visa, MasterCard, RuPay', iconName: 'card-outline' },
];

const CustomerWalletView: React.FC = () => {
  const [selectedMethod, setSelectedMethod] = useState<string>('upi');
  const [balance, setBalance] = useState<number>(customerData.walletData.balance);
  const [transactions, setTransactions] = useState<any[]>(customerData.walletData.transactions || []);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    fetchCustomerDashboard()
      .then((res) => {
        if (isMounted && res.data?.wallet) {
          if (typeof res.data.wallet.balance === 'number') {
            setBalance(res.data.wallet.balance);
          }
          if (Array.isArray(res.data.wallet.transactions) && res.data.wallet.transactions.length > 0) {
            setTransactions(res.data.wallet.transactions);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddMoney = () => {
    Alert.alert(
      'Top-Up KeralaGO Wallet',
      'Select top-up amount via Razorpay / UPI Intent (GPay, PhonePe, Paytm):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '+ ₹200',
          onPress: () => executeTopUp(200),
        },
        {
          text: '+ ₹500',
          onPress: () => executeTopUp(500),
        },
        {
          text: '+ ₹1,000',
          onPress: () => executeTopUp(1000),
        },
      ]
    );
  };

  const executeTopUp = async (amount: number) => {
    try {
      const orderRes = await apiPost<any>('/payments/create-order/', { amount });
      const topUpRes = await topUpWallet(amount);
      if (topUpRes.data?.success) {
        setBalance(topUpRes.data.new_balance);
        setTransactions((prev) => [
          {
            id: `tx_${Date.now()}`,
            title: `UPI Top-Up (${orderRes.data?.orderId || 'Razorpay'})`,
            date: 'Just now',
            amount: `+₹${amount.toFixed(2)}`,
            isCredit: true,
          },
          ...prev,
        ]);
        Alert.alert(
          'Wallet Recharged! 💳',
          `₹${amount} added successfully to your KeralaGO Wallet.\nOrder: ${orderRes.data?.orderId || 'Complete'}`
        );
      }
    } catch (err: any) {
      Alert.alert('Top-up Error', err?.message || 'Could not initiate UPI payment');
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeHeader}>
        <NavigationHeader
          title="KeralaGO Wallet"
          showBack={false}
        />
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isLoading ? (
          <>
            <WalletCardSkeleton />
            <View style={{ paddingHorizontal: Spacing.base, marginTop: Spacing.lg }}>
              <Skeleton width={140} height={18} variant="text" style={{ marginBottom: Spacing.md }} />
              <TripItemSkeleton />
              <TripItemSkeleton />
            </View>
          </>
        ) : (
          <>
            {/* ── Balance Hero Card ── */}
            <Card shadow="md" radius="xl" style={styles.balanceCard}>
              <View style={styles.balanceHeaderRow}>
                <View>
                  <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                    Available Balance
                  </Typography>
                  <Typography variant="h1" weight="extraBold" color={Colors.white}>
                    ₹{balance.toFixed(2)}
                  </Typography>
                </View>
                <View style={styles.walletIconCircle}>
                  <Icon library="Ionicons" name="wallet" size={28} color={Colors.mint} />
                </View>
              </View>

              <View style={styles.ecoCreditsRow}>
                <Badge
                  variant="success"
                  label={`+₹${customerData.walletData.cashbackEarned.toFixed(0)} Cashback Earned`}
                  size="md"
                />
                <Badge
                  variant="primary"
                  label={`${customerData.walletData.greenEcoKm} Green KM`}
                  size="md"
                />
              </View>

              <View style={styles.balanceActionsRow}>
                <Button
                  label="+ Add Money"
                  variant="secondary"
                  size="md"
                  onPress={handleAddMoney}
                  style={{ flex: 1 }}
                />
                <Button
                  label="Transfer to Bank"
                  variant="ghost"
                  size="md"
                  onPress={() => Alert.alert('Bank Payout', 'Payout feature linked with UPI AutoPay.')}
                  labelStyle={{ color: Colors.white }}
                  style={{ flex: 1, borderColor: 'rgba(255, 255, 255, 0.3)', borderWidth: 1 }}
                />
              </View>
            </Card>

            {/* ── Saved Payment Methods ── */}
            <Typography variant="h4" weight="bold" color={Colors.textPrimary} style={styles.sectionTitle}>
              Saved Payment Methods
            </Typography>

            <Card shadow="sm" radius="lg" style={styles.methodsCard}>
              {customerData.walletData.paymentOptions.map((opt: any, index: number) => (
                <PaymentOptionItem
                  key={opt.id}
                  label={opt.title}
                  subtitle={opt.subtitle}
                  iconName={opt.iconName}
                  iconLibrary="Ionicons"
                  iconColor={Colors.primary}
                  iconBg={Colors.mintLight}
                  selected={selectedMethod === opt.id}
                  onSelect={() => setSelectedMethod(opt.id)}
                  showDivider={index < customerData.walletData.paymentOptions.length - 1}
                />
              ))}
            </Card>

        {/* ── Recent Transactions ── */}
        <Typography variant="h4" weight="bold" color={Colors.textPrimary} style={styles.sectionTitle}>
          Recent Activity
        </Typography>

        <Card shadow="sm" radius="lg" style={styles.transactionsCard}>
          {transactions.length === 0 ? (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <Icon library="Ionicons" name="receipt-outline" size={32} color={Colors.textMuted} />
              <Typography variant="body2" color={Colors.textMuted} style={{ marginTop: 8 }}>
                No recent transactions
              </Typography>
            </View>
          ) : (
            transactions.map((tx, index) => (
              <View key={tx.id}>
                <View style={styles.txRow}>
                  <View style={[styles.txIconCircle, { backgroundColor: tx.isCredit ? Colors.mintLight : Colors.surface }]}>
                    <Icon
                      library="Ionicons"
                      name={tx.isCredit ? 'arrow-down' : 'arrow-up'}
                      size={16}
                      color={tx.isCredit ? Colors.primary : Colors.textMuted}
                    />
                  </View>
                  <View style={styles.txInfo}>
                    <Typography variant="body2" weight="semiBold" color={Colors.textPrimary}>
                      {tx.title}
                    </Typography>
                    <Typography variant="caption" color={Colors.textMuted}>
                      {tx.date} • {tx.type}
                    </Typography>
                  </View>
                  <Typography
                    variant="body1"
                    weight="bold"
                    color={tx.isCredit ? Colors.primary : Colors.textPrimary}
                  >
                    {tx.amount}
                  </Typography>
                </View>
                {index < transactions.length - 1 && <Divider spacing={4} />}
              </View>
            ))
          )}
        </Card>
      </>
    )}
  </ScrollView>
</View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeHeader: {
    backgroundColor: Colors.white,
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: Spacing['3xl'],
  },
  balanceCard: {
    backgroundColor: Colors.primaryDark,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  balanceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  walletIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ecoCreditsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  balanceActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  methodsCard: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.sm,
  },
  transactionsCard: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  txIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
});

export default CustomerWalletView;

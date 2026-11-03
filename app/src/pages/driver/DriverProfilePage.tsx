import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import {
  Typography,
  Card,
  Avatar,
  Divider,
  Icon,
  Badge,
} from '../../components/atoms';
import { InfoRow } from '../../components/molecules';
import {
  NavigationHeader,
  BottomTabBar,
  TabItem,
} from '../../components/organisms';
import { Colors, Spacing, Radii, Shadows } from '../../constants/theme';

export interface DriverProfilePageProps {
  onBack?: () => void;
  onNavigateVehicleDetails?: () => void;
  activeTab?: string;
  onTabPress?: (id: string) => void;
  tabs?: TabItem[];
}

const DriverProfilePage: React.FC<DriverProfilePageProps> = ({
  onBack,
  onNavigateVehicleDetails,
  activeTab = 'profile',
  onTabPress = () => {},
  tabs = [],
}) => {
  const { user, toggleRole, logout } = useAuth();

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        const confirmed = window.confirm('Are you sure you want to log out of KeralaGo Driver?');
        if (confirmed) {
          logout();
        }
      } else {
        logout();
      }
    } else {
      Alert.alert(
        'Log Out',
        'Are you sure you want to log out of KeralaGo Driver?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Log Out',
            style: 'destructive',
            onPress: logout,
          },
        ]
      );
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeHeaderArea}>
        <NavigationHeader
          title="Profile"
          showBack={true}
          onBack={onBack}
          rightActions={
            <TouchableOpacity
              onPress={() => Alert.alert('Driver Settings', 'App preferences & system configuration.')}
              activeOpacity={0.7}
              style={styles.settingsBtn}
            >
              <Icon library="Ionicons" name="settings-outline" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          }
        />
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Driver Header: Avatar, Name, Rating ── */}
        <View style={styles.profileHeader}>
          <Avatar
            name={user?.name || 'Driver Partner'}
            size="xl"
            online={user?.isOnline ?? false}
            style={styles.avatar}
          />

          <View style={styles.nameRow}>
            <Typography variant="h3" weight="bold" color={Colors.textPrimary}>
              {user?.name || 'Driver Partner'}
            </Typography>
          </View>

          <View style={styles.ratingRow}>
            <Typography variant="body2" weight="bold" color={Colors.textPrimary}>
              {user?.rating ? Number(user.rating).toFixed(1) : 'No rating yet'}
            </Typography>
            {user?.rating && <Icon library="Ionicons" name="star" size={15} color="#EAB308" style={{ marginHorizontal: 3 }} />}
            <Typography variant="caption" color={Colors.textSecondary}>
              ({user?.totalRides ?? 0} trips)
            </Typography>
          </View>
        </View>

        {/* ── 3-Column Stats Card ── */}
        <Card style={styles.statsCard}>
          <View style={styles.statsCol}>
            <Typography variant="h3" weight="bold" color={Colors.textPrimary}>
              {user?.totalRides ?? 0}
            </Typography>
            <Typography variant="caption" color={Colors.textSecondary} style={{ marginTop: 2 }}>
              Total Trips
            </Typography>
          </View>

          <Divider orientation="vertical" style={styles.statsDivider} />

          <View style={styles.statsCol}>
            <Typography variant="h3" weight="bold" color={Colors.textPrimary}>
              {user?.rating ? Number(user.rating).toFixed(1) : '—'}
            </Typography>
            <Typography variant="caption" color={Colors.textSecondary} style={{ marginTop: 2 }}>
              Rating
            </Typography>
          </View>

          <Divider orientation="vertical" style={styles.statsDivider} />

          <View style={styles.statsCol}>
            <Typography variant="h3" weight="bold" color={Colors.textPrimary}>
              {user?.role === 'DRIVER' ? 'Partner' : 'Driver'}
            </Typography>
            <Typography variant="caption" color={Colors.textSecondary} style={{ marginTop: 2 }}>
              Role
            </Typography>
          </View>
        </Card>

        {/* ── Component-Based Menu List with InfoRow ── */}
        <Card style={styles.menuCard}>
          <InfoRow
            iconName="id-card-outline"
            label="Personal Information"
            rightContent="chevron"
            onPress={() => Alert.alert('Personal Information', 'Driver License, Phone & Address verified with Kerala MVD.')}
          />
          <InfoRow
            iconName="car-outline"
            label="Vehicle Details"
            rightContent="chevron"
            onPress={onNavigateVehicleDetails}
          />
          <InfoRow
            iconName="document-text-outline"
            label="Documents"
            rightNode={
              <View style={styles.badgeChevronWrap}>
                <Badge variant="success" label="Verified" size="sm" style={{ marginRight: Spacing.xs }} />
                <Icon library="Ionicons" name="chevron-forward" size="sm" color={Colors.textMuted} />
              </View>
            }
            onPress={() => Alert.alert('Documents', 'RC, Driving License, Insurance, PUC all Verified.')}
          />
          <InfoRow
            iconName="business-outline"
            label="Bank Account"
            rightContent="chevron"
            onPress={() => Alert.alert('Bank Account', 'State Bank of India (SBI) •••• 4829 linked for daily payouts.')}
          />
          <InfoRow
            iconName="notifications-outline"
            label="Notifications"
            rightContent="chevron"
            onPress={() => Alert.alert('Notifications', 'Push alerts enabled for high surge & incentives.')}
          />
          <InfoRow
            iconName="globe-outline"
            label="Language"
            value="English"
            rightContent="chevron"
            onPress={() => Alert.alert('Language', 'Supported: English, Malayalam, Hindi')}
          />
          <InfoRow
            iconName="help-circle-outline"
            label="Help & Support"
            rightContent="chevron"
            onPress={() => Alert.alert('Help & Support', 'Driver Support Helpline & FAQs')}
          />
          <InfoRow
            iconName="log-out-outline"
            iconColor={Colors.danger}
            label="Log Out"
            labelColor={Colors.danger}
            rightNode={<Icon library="Ionicons" name="chevron-forward" size="sm" color={Colors.danger} />}
            showDivider={false}
            onPress={handleLogout}
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
  settingsBtn: {
    padding: Spacing.xs,
  },
  scrollContent: {
    paddingBottom: Spacing['3xl'],
  },

  // ── Profile Header ──
  profileHeader: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  avatar: {
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  // ── Stats Card ──
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: '#EFF3F0',
    ...Shadows.sm,
  },
  statsCol: {
    flex: 1,
    alignItems: 'center',
  },
  statsDivider: {
    height: 38,
    backgroundColor: '#E2E8F0',
  },

  // ── Menu List ──
  menuCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.lg,
    borderRadius: Radii.xl,
    paddingHorizontal: Spacing.base,
    borderWidth: 1,
    borderColor: '#EFF3F0',
    ...Shadows.sm,
  },
  badgeChevronWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default DriverProfilePage;

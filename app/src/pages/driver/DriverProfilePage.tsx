import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Switch,
  Platform,
  ActivityIndicator,
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
  Button,
} from '../../components/atoms';
import { InfoRow } from '../../components/molecules';
import {
  NavigationHeader,
  BottomTabBar,
  TabItem,
} from '../../components/organisms';
import { Colors, Spacing, Radii, Shadows } from '../../constants/theme';
import { apiGet, apiPatch } from '../../services/apiClient';

export interface DriverProfilePageProps {
  onBack?: () => void;
  onNavigateVehicleDetails?: () => void;
  activeTab?: string;
  onTabPress?: (id: string) => void;
  tabs?: TabItem[];
}

interface DriverDocumentItem {
  id: string;
  type: string;
  title: string;
  number: string;
  status: string;
  updatedAt: string;
}

const DRIVER_BANKS = [
  'State Bank of India (SBI)',
  'Federal Bank',
  'HDFC Bank',
  'Canara Bank',
  'South Indian Bank',
  'Kerala Gramin Bank',
];

const NAVIGATION_PROVIDERS = ['Google Maps', 'Apple Maps', 'Waze'];
const DRIVER_LANGUAGES = ['English', 'മലയാളം (Malayalam)', 'हिंदी (Hindi)'];

const DriverProfilePage: React.FC<DriverProfilePageProps> = ({
  onBack,
  onNavigateVehicleDetails,
  activeTab = 'profile',
  onTabPress = () => {},
  tabs = [],
}) => {
  const { user, toggleRole, refreshProfile, logout } = useAuth();

  // ── Driver Profile Data ──
  const [driverData, setDriverData] = useState<any>(null);
  const [documents, setDocuments] = useState<DriverDocumentItem[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);

  // ── Modal Visibility States ──
  const [personalModalVisible, setPersonalModalVisible] = useState<boolean>(false);
  const [documentsModalVisible, setDocumentsModalVisible] = useState<boolean>(false);
  const [bankModalVisible, setBankModalVisible] = useState<boolean>(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState<boolean>(false);
  const [supportModalVisible, setSupportModalVisible] = useState<boolean>(false);

  // ── Personal Details Form State ──
  const [nameInput, setNameInput] = useState<string>(user?.name || '');
  const [emailInput, setEmailInput] = useState<string>(user?.email || '');
  const [licenseInput, setLicenseInput] = useState<string>('');
  const [navProvider, setNavProvider] = useState<string>('Google Maps');
  const [autoAccept, setAutoAccept] = useState<boolean>(false);
  const [isSavingPersonal, setIsSavingPersonal] = useState<boolean>(false);

  // ── Bank Payout Details Form State ──
  const [bankName, setBankName] = useState<string>('State Bank of India (SBI)');
  const [bankHolder, setBankHolder] = useState<string>('');
  const [bankAccount, setBankAccount] = useState<string>('');
  const [bankIfsc, setBankIfsc] = useState<string>('');
  const [isSavingBank, setIsSavingBank] = useState<boolean>(false);

  // ── Settings Form State ──
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
  const [surgeAlerts, setSurgeAlerts] = useState<boolean>(true);
  const [soundAlerts, setSoundAlerts] = useState<boolean>(true);

  // Fetch full driver profile from backend
  const loadDriverProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      const res = await apiGet<any>('/driver/profile/', null);
      if (res.data) {
        setDriverData(res.data);
        const d = res.data.driver;
        if (d) {
          setNameInput(d.name || user?.name || '');
          setEmailInput(d.email || user?.email || '');
          setLicenseInput(d.licenseNumber || '');
          setNavProvider(d.navigationProvider || 'Google Maps');
          setAutoAccept(!!d.autoAcceptRides);
          setBankHolder(d.bankAccountHolder || d.name || '');
          setBankAccount(d.bankAccountNumber || '');
          setBankIfsc(d.bankIfsc || '');
        }
        if (res.data.documents) {
          setDocuments(res.data.documents);
        }
      }
    } catch {
      // Keep existing data
    } finally {
      setIsLoadingProfile(false);
    }
  }, [user]);

  useEffect(() => {
    loadDriverProfile();
  }, [loadDriverProfile]);

  // Save Personal Details
  const handleSavePersonal = async () => {
    if (!nameInput.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    setIsSavingPersonal(true);
    try {
      await apiPatch('/driver/profile/update/', {
        name: nameInput.trim(),
        email: emailInput.trim(),
        licenseNumber: licenseInput.trim(),
        navigationProvider: navProvider,
        autoAcceptRides: autoAccept,
      });
      if (refreshProfile) await refreshProfile();
      await loadDriverProfile();
      setPersonalModalVisible(false);
      Alert.alert('Success', 'Personal information updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not update personal details.');
    } finally {
      setIsSavingPersonal(false);
    }
  };

  // Save Bank Details
  const handleSaveBank = async () => {
    if (!bankAccount.trim() || !bankIfsc.trim() || !bankHolder.trim()) {
      Alert.alert('Required Fields', 'Please enter account holder name, account number, and IFSC code.');
      return;
    }
    setIsSavingBank(true);
    try {
      await apiPatch('/driver/profile/update/', {
        bankAccountHolder: bankHolder.trim(),
        bankAccountNumber: bankAccount.trim(),
        bankIfsc: bankIfsc.trim().toUpperCase(),
      });
      await loadDriverProfile();
      setBankModalVisible(false);
      Alert.alert('Success', 'Bank payout details updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not update bank details.');
    } finally {
      setIsSavingBank(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        const confirmed = window.confirm('Are you sure you want to log out of KeralaGo Driver?');
        if (confirmed) logout();
      } else {
        logout();
      }
    } else {
      Alert.alert(
        'Log Out',
        'Are you sure you want to log out of KeralaGo Driver?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log Out', style: 'destructive', onPress: logout },
        ]
      );
    }
  };

  const driverInfo = driverData?.driver;
  const vehicleInfo = driverData?.vehicle;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeHeaderArea}>
        <NavigationHeader
          title="Profile"
          showBack={true}
          onBack={onBack}
          rightActions={
            <TouchableOpacity
              onPress={() => setSettingsModalVisible(true)}
              activeOpacity={0.7}
              style={styles.settingsBtn}
            >
              <Icon library="Ionicons" name="settings-outline" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          }
        />
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── Driver Header: Avatar, Name, Rating ── */}
        <View style={styles.profileHeader}>
          <Avatar
            name={driverInfo?.name || user?.name || 'Driver Partner'}
            size="xl"
            online={driverInfo?.isOnline ?? user?.isOnline ?? false}
            style={styles.avatar}
          />

          <View style={styles.nameRow}>
            <Typography variant="h3" weight="bold" color={Colors.textPrimary}>
              {driverInfo?.name || user?.name || 'Driver Partner'}
            </Typography>
          </View>

          <View style={styles.ratingRow}>
            <Typography variant="body2" weight="bold" color={Colors.textPrimary}>
              {driverInfo?.rating ? Number(driverInfo.rating).toFixed(1) : (user?.rating ? Number(user.rating).toFixed(1) : 'No rating yet')}
            </Typography>
            {(driverInfo?.rating || user?.rating) && (
              <Icon library="Ionicons" name="star" size={15} color="#EAB308" style={{ marginHorizontal: 3 }} />
            )}
            <Typography variant="caption" color={Colors.textSecondary}>
              ({driverInfo?.totalTrips ?? user?.totalRides ?? 0} trips)
            </Typography>
          </View>
        </View>

        {/* ── 3-Column Stats Card ── */}
        <Card style={styles.statsCard}>
          <View style={styles.statsCol}>
            <Typography variant="h3" weight="bold" color={Colors.textPrimary}>
              {driverInfo?.totalTrips ?? user?.totalRides ?? 0}
            </Typography>
            <Typography variant="caption" color={Colors.textSecondary} style={{ marginTop: 2 }}>
              Total Trips
            </Typography>
          </View>

          <Divider orientation="vertical" style={styles.statsDivider} />

          <View style={styles.statsCol}>
            <Typography variant="h3" weight="bold" color={Colors.textPrimary}>
              {driverInfo?.rating ? Number(driverInfo.rating).toFixed(1) : (user?.rating ? Number(user.rating).toFixed(1) : '—')}
            </Typography>
            <Typography variant="caption" color={Colors.textSecondary} style={{ marginTop: 2 }}>
              Rating
            </Typography>
          </View>

          <Divider orientation="vertical" style={styles.statsDivider} />

          <View style={styles.statsCol}>
            <Typography variant="h3" weight="bold" color={Colors.textPrimary}>
              Partner
            </Typography>
            <Typography variant="caption" color={Colors.textSecondary} style={{ marginTop: 2 }}>
              Status
            </Typography>
          </View>
        </Card>

        {/* ── Switch to Passenger / Rider Mode Action Card ── */}
        <TouchableOpacity style={styles.switchRiderCard} onPress={toggleRole} activeOpacity={0.8}>
          <View style={styles.switchRiderLeft}>
            <View style={styles.switchRiderIconBadge}>
              <Icon library="Ionicons" name="person" size={20} color="#0F4A2B" />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Typography variant="body1" weight="bold" color="#0F172A">
                Switch to Passenger Mode
              </Typography>
              <Typography variant="xs" color="#64748B">
                Book rides as a passenger using this account
              </Typography>
            </View>
          </View>
          <View style={styles.switchRiderBtnPill}>
            <Typography variant="xs" weight="bold" color="#0F4A2B">
              Switch →
            </Typography>
          </View>
        </TouchableOpacity>

        {/* ── Menu List with Real Database Integrations ── */}
        <Card style={styles.menuCard}>
          <InfoRow
            iconName="id-card-outline"
            label="Personal Information"
            value={driverInfo?.licenseNumber ? `License: ${driverInfo.licenseNumber}` : undefined}
            rightContent="chevron"
            onPress={() => setPersonalModalVisible(true)}
          />
          <InfoRow
            iconName="car-outline"
            label="Vehicle Details"
            value={vehicleInfo ? `${vehicleInfo.plate} • ${vehicleInfo.make} ${vehicleInfo.model}` : 'Register Vehicle'}
            rightContent="chevron"
            onPress={onNavigateVehicleDetails}
          />
          <InfoRow
            iconName="document-text-outline"
            label="Compliance & Documents"
            rightNode={
              <View style={styles.badgeChevronWrap}>
                <Badge
                  variant="success"
                  label={documents.length > 0 ? `${documents.length} Verified` : 'Verified'}
                  size="sm"
                  style={{ marginRight: Spacing.xs }}
                />
                <Icon library="Ionicons" name="chevron-forward" size="sm" color={Colors.textMuted} />
              </View>
            }
            onPress={() => setDocumentsModalVisible(true)}
          />
          <InfoRow
            iconName="business-outline"
            label="Bank Account & Payouts"
            value={
              driverInfo?.bankAccountNumber
                ? `•••• ${driverInfo.bankAccountNumber.slice(-4)} (${driverInfo.bankIfsc})`
                : 'Link Bank Account'
            }
            rightContent="chevron"
            onPress={() => setBankModalVisible(true)}
          />
          <InfoRow
            iconName="notifications-outline"
            label="Driver Settings & Alerts"
            value={surgeAlerts ? 'Surge alerts ON' : undefined}
            rightContent="chevron"
            onPress={() => setSettingsModalVisible(true)}
          />
          <InfoRow
            iconName="globe-outline"
            label="Language"
            value={selectedLanguage}
            rightContent="chevron"
            onPress={() => setSettingsModalVisible(true)}
          />
          <InfoRow
            iconName="help-circle-outline"
            label="Driver Help & Support"
            rightContent="chevron"
            onPress={() => setSupportModalVisible(true)}
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
        <BottomTabBar tabs={tabs} activeTabId={activeTab} onTabPress={onTabPress} />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          1. DRIVER PERSONAL INFORMATION MODAL
         ═══════════════════════════════════════════════════════════════════════ */}
      <Modal visible={personalModalVisible} transparent animationType="fade" onRequestClose={() => setPersonalModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Typography variant="h3" weight="bold" color="#0F172A">
                Driver Personal Details
              </Typography>
              <TouchableOpacity onPress={() => setPersonalModalVisible(false)}>
                <Icon library="Ionicons" name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Typography variant="caption" weight="semiBold" color="#64748B" style={styles.inputLabel}>
                FULL NAME *
              </Typography>
              <TextInput
                style={styles.modalInput}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Partner Name"
              />

              <Typography variant="caption" weight="semiBold" color="#64748B" style={[styles.inputLabel, { marginTop: 12 }]}>
                EMAIL ADDRESS
              </Typography>
              <TextInput
                style={styles.modalInput}
                value={emailInput}
                onChangeText={setEmailInput}
                placeholder="e.g. driver@keralago.in"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Typography variant="caption" weight="semiBold" color="#64748B" style={[styles.inputLabel, { marginTop: 12 }]}>
                PHONE NUMBER (VERIFIED)
              </Typography>
              <TextInput
                style={[styles.modalInput, { backgroundColor: '#F1F5F9' }]}
                value={driverInfo?.phone || user?.phone || ''}
                editable={false}
              />

              <Typography variant="caption" weight="semiBold" color="#64748B" style={[styles.inputLabel, { marginTop: 12 }]}>
                DRIVING LICENSE NUMBER *
              </Typography>
              <TextInput
                style={styles.modalInput}
                value={licenseInput}
                onChangeText={setLicenseInput}
                placeholder="e.g. KL-07-2022-0045892"
                autoCapitalize="characters"
              />

              <Typography variant="caption" weight="semiBold" color="#64748B" style={[styles.inputLabel, { marginTop: 12 }]}>
                DEFAULT NAVIGATION APP
              </Typography>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                {NAVIGATION_PROVIDERS.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.pill, navProvider === p ? styles.pillActive : styles.pillInactive]}
                    onPress={() => setNavProvider(p)}
                  >
                    <Typography variant="xs" weight="bold" color={navProvider === p ? '#FFFFFF' : '#475569'}>
                      {p}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.prefRow}>
                <View style={{ flex: 1 }}>
                  <Typography variant="body2" weight="bold" color="#0F172A">
                    Auto-Accept Rides
                  </Typography>
                  <Typography variant="xs" color="#64748B">
                    Automatically accept trip pings in active route
                  </Typography>
                </View>
                <Switch
                  value={autoAccept}
                  onValueChange={setAutoAccept}
                  trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
                  thumbColor={autoAccept ? '#16A34A' : '#F1F5F9'}
                />
              </View>

              <View style={{ marginTop: 20 }}>
                <Button
                  label={isSavingPersonal ? 'Saving...' : 'Save Changes'}
                  variant="primary"
                  size="md"
                  fullWidth
                  disabled={isSavingPersonal}
                  onPress={handleSavePersonal}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          2. DRIVER DOCUMENTS & COMPLIANCE MODAL
         ═══════════════════════════════════════════════════════════════════════ */}
      <Modal visible={documentsModalVisible} transparent animationType="fade" onRequestClose={() => setDocumentsModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Typography variant="h3" weight="bold" color="#0F172A">
                Compliance & Documents
              </Typography>
              <TouchableOpacity onPress={() => setDocumentsModalVisible(false)}>
                <Icon library="Ionicons" name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.mvdBadge}>
                <Icon library="Ionicons" name="shield-checkmark" size={18} color="#059669" />
                <Typography variant="xs" weight="bold" color="#065F46" style={{ marginLeft: 6 }}>
                  Verified with Kerala Motor Vehicles Department (MVD)
                </Typography>
              </View>

              {documents.length === 0 ? (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <Icon library="Ionicons" name="document-text-outline" size={36} color="#94A3B8" />
                  <Typography variant="body2" color="#64748B" style={{ marginTop: 8 }}>
                    No documents uploaded yet.
                  </Typography>
                </View>
              ) : (
                documents.map((doc) => (
                  <View key={doc.id} style={styles.docItemCard}>
                    <View style={styles.docLeftCol}>
                      <View style={styles.docIconWrap}>
                        <Icon library="Ionicons" name="document-text" size={20} color="#0F4A2B" />
                      </View>
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Typography variant="body2" weight="bold" color="#0F172A">
                          {doc.title}
                        </Typography>
                        <Typography variant="xs" color="#64748B" style={{ marginTop: 2 }}>
                          {doc.number}
                        </Typography>
                        <Typography variant="xs" color="#94A3B8" style={{ marginTop: 1 }}>
                          Verified on {doc.updatedAt}
                        </Typography>
                      </View>
                    </View>
                    <Badge
                      variant={doc.status === 'APPROVED' ? 'success' : 'warning'}
                      label={doc.status === 'APPROVED' ? 'Verified' : doc.status}
                      size="sm"
                    />
                  </View>
                ))
              )}

              <View style={{ marginTop: 16 }}>
                <Button
                  label="Done"
                  variant="outline"
                  size="md"
                  fullWidth
                  onPress={() => setDocumentsModalVisible(false)}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          3. BANK ACCOUNT & DAILY PAYOUTS MODAL
         ═══════════════════════════════════════════════════════════════════════ */}
      <Modal visible={bankModalVisible} transparent animationType="fade" onRequestClose={() => setBankModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Typography variant="h3" weight="bold" color="#0F172A">
                  Bank Account & Payouts
                </Typography>
                <Typography variant="xs" color="#64748B" style={{ marginTop: 2 }}>
                  Daily earnings disbursed directly at midnight
                </Typography>
              </View>
              <TouchableOpacity onPress={() => setBankModalVisible(false)}>
                <Icon library="Ionicons" name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Typography variant="caption" weight="semiBold" color="#64748B" style={styles.inputLabel}>
                SELECT BANK
              </Typography>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {DRIVER_BANKS.map((b) => (
                  <TouchableOpacity
                    key={b}
                    style={[styles.pill, bankName === b ? styles.pillActive : styles.pillInactive]}
                    onPress={() => setBankName(b)}
                  >
                    <Typography variant="xs" weight="bold" color={bankName === b ? '#FFFFFF' : '#475569'}>
                      {b}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Typography variant="caption" weight="semiBold" color="#64748B" style={styles.inputLabel}>
                ACCOUNT HOLDER NAME *
              </Typography>
              <TextInput
                style={styles.modalInput}
                value={bankHolder}
                onChangeText={setBankHolder}
                placeholder="As per bank passbook"
              />

              <Typography variant="caption" weight="semiBold" color="#64748B" style={[styles.inputLabel, { marginTop: 12 }]}>
                BANK ACCOUNT NUMBER *
              </Typography>
              <TextInput
                style={styles.modalInput}
                value={bankAccount}
                onChangeText={setBankAccount}
                placeholder="e.g. 39820194821"
                keyboardType="numeric"
              />

              <Typography variant="caption" weight="semiBold" color="#64748B" style={[styles.inputLabel, { marginTop: 12 }]}>
                IFSC CODE *
              </Typography>
              <TextInput
                style={styles.modalInput}
                value={bankIfsc}
                onChangeText={setBankIfsc}
                placeholder="e.g. SBIN0001234"
                autoCapitalize="characters"
              />

              <View style={styles.payoutNotice}>
                <Icon library="Ionicons" name="cash-outline" size={18} color="#0F4A2B" />
                <Typography variant="xs" color="#2D5A3F" style={{ marginLeft: 8, flex: 1, lineHeight: 18 }}>
                  KeralaGO settles 100% of driver fares directly via NEFT/IMPS with zero commission on meter auto rides.
                </Typography>
              </View>

              <View style={{ marginTop: 20 }}>
                <Button
                  label={isSavingBank ? 'Saving...' : 'Save Bank Details'}
                  variant="primary"
                  size="md"
                  fullWidth
                  disabled={isSavingBank}
                  onPress={handleSaveBank}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          4. DRIVER SETTINGS & LANGUAGE MODAL
         ═══════════════════════════════════════════════════════════════════════ */}
      <Modal visible={settingsModalVisible} transparent animationType="fade" onRequestClose={() => setSettingsModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Typography variant="h3" weight="bold" color="#0F172A">
                Driver Settings & Language
              </Typography>
              <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
                <Icon library="Ionicons" name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Typography variant="body2" weight="bold" color="#0F172A" style={{ marginBottom: 8 }}>
              App Language
            </Typography>
            <View style={{ gap: 8, marginBottom: 16 }}>
              {DRIVER_LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[styles.langRow, selectedLanguage === lang && styles.langRowActive]}
                  onPress={() => setSelectedLanguage(lang)}
                >
                  <Typography variant="body2" weight={selectedLanguage === lang ? 'bold' : 'regular'} color="#0F172A">
                    {lang}
                  </Typography>
                  {selectedLanguage === lang && (
                    <Icon library="Ionicons" name="checkmark-circle" size={18} color="#16A34A" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.prefRow}>
              <View style={{ flex: 1 }}>
                <Typography variant="body2" weight="bold" color="#0F172A">
                  High Surge Alerts
                </Typography>
                <Typography variant="xs" color="#64748B">
                  Notify when nearby zones experience peak demand
                </Typography>
              </View>
              <Switch
                value={surgeAlerts}
                onValueChange={setSurgeAlerts}
                trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
                thumbColor={surgeAlerts ? '#16A34A' : '#F1F5F9'}
              />
            </View>

            <View style={styles.prefRow}>
              <View style={{ flex: 1 }}>
                <Typography variant="body2" weight="bold" color="#0F172A">
                  Sound Alert on Ride Ping
                </Typography>
                <Typography variant="xs" color="#64748B">
                  Play audible chime for incoming ride offers
                </Typography>
              </View>
              <Switch
                value={soundAlerts}
                onValueChange={setSoundAlerts}
                trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
                thumbColor={soundAlerts ? '#16A34A' : '#F1F5F9'}
              />
            </View>

            <View style={{ marginTop: 18, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12, alignItems: 'center' }}>
              <Typography variant="xs" color="#94A3B8">
                KeralaGO Driver Partner App • v2.4.0 (Build 2026)
              </Typography>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          5. DRIVER HELP & SUPPORT MODAL
         ═══════════════════════════════════════════════════════════════════════ */}
      <Modal visible={supportModalVisible} transparent animationType="fade" onRequestClose={() => setSupportModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Typography variant="h3" weight="bold" color="#0F172A">
                Driver Partner Support
              </Typography>
              <TouchableOpacity onPress={() => setSupportModalVisible(false)}>
                <Icon library="Ionicons" name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12 }}>
              <View style={styles.helplineBanner}>
                <Icon library="Ionicons" name="call" size={20} color="#0F4A2B" />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Typography variant="body2" weight="bold" color="#0F4A2B">
                    Driver Support: 0484-2889900
                  </Typography>
                  <Typography variant="xs" color="#2D5A3F">
                    24x7 Dedicated Partner Operations Desk
                  </Typography>
                </View>
              </View>

              <View style={styles.faqCard}>
                <Typography variant="body2" weight="bold" color="#0F172A">
                  Daily Payout Schedule
                </Typography>
                <Typography variant="xs" color="#64748B" style={{ marginTop: 4, lineHeight: 18 }}>
                  Earnings from UPI and in-app payments are credited directly to your registered bank account every night at 11:59 PM.
                </Typography>
              </View>

              <View style={styles.faqCard}>
                <Typography variant="body2" weight="bold" color="#0F172A">
                  Zero Commission Policy
                </Typography>
                <Typography variant="xs" color="#64748B" style={{ marginTop: 4, lineHeight: 18 }}>
                  Kerala Auto drivers keep 100% of standard government meter fares with 0% platform deductions.
                </Typography>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: '#EFF3F0',
    ...Shadows.sm,
  },
  statsCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsDivider: {
    height: 36,
  },
  switchRiderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EDF8F1',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
  },
  switchRiderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchRiderIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRiderBtnPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  menuCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.base,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputLabel: {
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 6,
  },
  pillActive: {
    backgroundColor: '#0F4A2B',
    borderColor: '#0F4A2B',
  },
  pillInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
  },
  mvdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  docItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  docLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  docIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EDF8F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payoutNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 10,
    marginTop: 14,
  },
  helplineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF8F1',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 14,
    borderRadius: 12,
  },
  faqCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  langRowActive: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
});

export default DriverProfilePage;

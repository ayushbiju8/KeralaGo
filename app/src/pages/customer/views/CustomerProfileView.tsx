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
import { Typography, Icon, Button, Badge, Card } from '../../../components/atoms';
import { Colors, Spacing, Radii, Shadows } from '../../../constants/theme';
import { useAuth } from '../../../hooks/useAuth';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../../services/apiClient';

interface CustomerProfileViewProps {
  onLogout?: () => void;
  onToggleRole?: () => void;
  currentRole?: string;
}

interface SavedLocationItem {
  id: string;
  label: string;
  title: string;
  subtitle?: string;
  address?: string;
  iconName?: string;
}

interface SavedPaymentMethodItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  identifier?: string;
  isDefault: boolean;
}

interface EmergencyContactItem {
  id: string;
  name: string;
  phone: string;
  relation: string;
  isPrimary: boolean;
}

const ADDRESS_LABEL_OPTIONS = ['Home', 'Work', 'College', 'Other'];
const RELATION_OPTIONS = ['Parent', 'Spouse', 'Sibling', 'Friend', 'Other'];
const LANGUAGE_OPTIONS = ['English', 'മലയാളം (Malayalam)', 'हिंदी (Hindi)'];

const CustomerProfileView: React.FC<CustomerProfileViewProps> = ({
  onLogout,
  onToggleRole,
  currentRole,
}) => {
  const { user, isDriver, openDriverRegistration, toggleRole, updateProfile, refreshProfile, logout } = useAuth();

  // ── 1. Profile State ──
  const [userName, setUserName] = useState<string>(user?.name || '');
  const [userEmail, setUserEmail] = useState<string>(user?.email || '');
  const [userPhone, setUserPhone] = useState<string>(user?.phone || '');
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [editNameInput, setEditNameInput] = useState<string>(userName);
  const [editEmailInput, setEditEmailInput] = useState<string>(userEmail);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  // ── 2. Preferences State ──
  const [preferencesModalVisible, setPreferencesModalVisible] = useState<boolean>(false);
  const [quietRide, setQuietRide] = useState<boolean>(false);
  const [acPreferred, setAcPreferred] = useState<boolean>(true);
  const [cashlessOnly, setCashlessOnly] = useState<boolean>(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState<boolean>(false);

  // ── 3. Saved Addresses State ──
  const [addressesModalVisible, setAddressesModalVisible] = useState<boolean>(false);
  const [savedLocations, setSavedLocations] = useState<SavedLocationItem[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState<boolean>(false);
  const [showAddAddressForm, setShowAddAddressForm] = useState<boolean>(false);
  const [newAddressLabel, setNewAddressLabel] = useState<string>('Home');
  const [newAddressTitle, setNewAddressTitle] = useState<string>('');
  const [newAddressFull, setNewAddressFull] = useState<string>('');
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState<boolean>(false);

  // ── 4. Payment Methods State ──
  const [paymentModalVisible, setPaymentModalVisible] = useState<boolean>(false);
  const [savedPayments, setSavedPayments] = useState<SavedPaymentMethodItem[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoadingPayments, setIsLoadingPayments] = useState<boolean>(false);
  const [showAddPaymentForm, setShowAddPaymentForm] = useState<boolean>(false);
  const [newPaymentType, setNewPaymentType] = useState<'UPI' | 'CARD'>('UPI');
  const [newUpiVpa, setNewUpiVpa] = useState<string>('');
  const [newCardTitle, setNewCardTitle] = useState<string>('');
  const [newCardNumber, setNewCardNumber] = useState<string>('');
  const [isSavingPayment, setIsSavingPayment] = useState<boolean>(false);

  // ── 5. Safety & Emergency Contacts State ──
  const [safetyModalVisible, setSafetyModalVisible] = useState<boolean>(false);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContactItem[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState<boolean>(false);
  const [showAddContactForm, setShowAddContactForm] = useState<boolean>(false);
  const [newContactName, setNewContactName] = useState<string>('');
  const [newContactPhone, setNewContactPhone] = useState<string>('');
  const [newContactRelation, setNewContactRelation] = useState<string>('Parent');
  const [isSavingContact, setIsSavingContact] = useState<boolean>(false);

  // ── 6. Settings & Support State ──
  const [settingsModalVisible, setSettingsModalVisible] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [supportModalVisible, setSupportModalVisible] = useState<boolean>(false);
  const [inviteModalVisible, setInviteModalVisible] = useState<boolean>(false);

  // Sync user from AuthContext
  useEffect(() => {
    if (user?.name) {
      setUserName(user.name);
      setEditNameInput(user.name);
    }
    if (user?.email) {
      setUserEmail(user.email);
      setEditEmailInput(user.email);
    }
    if (user?.phone) {
      setUserPhone(user.phone);
    }
  }, [user]);

  // Fetch full customer profile data from database on mount
  const loadProfileData = useCallback(async () => {
    try {
      const res = await apiGet<any>('/customer/profile/', null);
      if (res.data) {
        if (res.data.name) setUserName(res.data.name);
        if (res.data.email) setUserEmail(res.data.email);
        if (res.data.walletBalance !== undefined) setWalletBalance(res.data.walletBalance);
        if (res.data.preferences) {
          setQuietRide(!!res.data.preferences.quietRide);
          setAcPreferred(res.data.preferences.acPreferred !== false);
          setCashlessOnly(!!res.data.preferences.cashlessOnly);
        }
      }
    } catch {
      // Keep existing states
    }
  }, []);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // ── Locations Handlers ──
  const loadLocations = useCallback(async () => {
    setIsLoadingLocations(true);
    try {
      const res = await apiGet<SavedLocationItem[]>('/customer/locations/', []);
      if (res.data) {
        setSavedLocations(res.data);
      }
    } finally {
      setIsLoadingLocations(false);
    }
  }, []);

  const handleOpenAddresses = () => {
    setAddressesModalVisible(true);
    loadLocations();
  };

  const handleSaveAddress = async () => {
    if (!newAddressTitle.trim() || !newAddressFull.trim()) {
      Alert.alert('Required Fields', 'Please enter both location name and full address.');
      return;
    }
    setIsSavingAddress(true);
    try {
      const icon =
        newAddressLabel === 'Home'
          ? 'home-outline'
          : newAddressLabel === 'Work'
          ? 'briefcase-outline'
          : newAddressLabel === 'College'
          ? 'school-outline'
          : 'location-outline';

      if (editingLocationId) {
        await apiPatch(`/customer/locations/${editingLocationId}/`, {
          label: newAddressLabel,
          title: newAddressTitle.trim(),
          address: newAddressFull.trim(),
          iconName: icon,
        });
      } else {
        await apiPost('/customer/locations/', {
          label: newAddressLabel,
          title: newAddressTitle.trim(),
          address: newAddressFull.trim(),
          icon,
        });
      }
      setShowAddAddressForm(false);
      setEditingLocationId(null);
      setNewAddressTitle('');
      setNewAddressFull('');
      await loadLocations();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save address.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    Alert.alert('Delete Address', 'Are you sure you want to remove this saved address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await apiDelete(`/customer/locations/${id}/`);
          loadLocations();
        },
      },
    ]);
  };

  // ── Payment Methods Handlers ──
  const loadPayments = useCallback(async () => {
    setIsLoadingPayments(true);
    try {
      const res = await apiGet<any>('/customer/payment-methods/', { wallet: { balance: 0 }, methods: [] });
      if (res.data) {
        setSavedPayments(res.data.methods || []);
        if (res.data.wallet) {
          setWalletBalance(res.data.wallet.balance);
        }
      }
    } finally {
      setIsLoadingPayments(false);
    }
  }, []);

  const handleOpenPayments = () => {
    setPaymentModalVisible(true);
    loadPayments();
  };

  const handleSavePaymentMethod = async () => {
    if (newPaymentType === 'UPI') {
      if (!newUpiVpa.trim() || !newUpiVpa.includes('@')) {
        Alert.alert('Invalid UPI ID', 'Please enter a valid UPI VPA (e.g. username@okaxis).');
        return;
      }
      setIsSavingPayment(true);
      try {
        await apiPost('/customer/payment-methods/', {
          type: 'UPI',
          title: 'UPI (Google Pay / PhonePe)',
          subtitle: newUpiVpa.trim(),
          identifier: newUpiVpa.trim(),
          isDefault: true,
        });
        setNewUpiVpa('');
        setShowAddPaymentForm(false);
        await loadPayments();
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Could not save UPI method.');
      } finally {
        setIsSavingPayment(false);
      }
    } else {
      if (!newCardTitle.trim() || newCardNumber.trim().length < 4) {
        Alert.alert('Invalid Card Details', 'Please enter the cardholder name and at least the last 4 digits.');
        return;
      }
      setIsSavingPayment(true);
      try {
        const last4 = newCardNumber.trim().slice(-4);
        await apiPost('/customer/payment-methods/', {
          type: 'CARD',
          title: newCardTitle.trim(),
          subtitle: `•••• ${last4}`,
          identifier: last4,
          isDefault: true,
        });
        setNewCardTitle('');
        setNewCardNumber('');
        setShowAddPaymentForm(false);
        await loadPayments();
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Could not save card method.');
      } finally {
        setIsSavingPayment(false);
      }
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    Alert.alert('Remove Payment Method', 'Are you sure you want to remove this payment method?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await apiDelete(`/customer/payment-methods/${id}/`);
          loadPayments();
        },
      },
    ]);
  };

  const handleSetDefaultPayment = async (id: string) => {
    await apiPost(`/customer/payment-methods/${id}/`, {});
    loadPayments();
  };

  // ── Safety & Emergency Contacts Handlers ──
  const loadEmergencyContacts = useCallback(async () => {
    setIsLoadingContacts(true);
    try {
      const res = await apiGet<EmergencyContactItem[]>('/customer/emergency-contacts/', []);
      if (res.data) {
        setEmergencyContacts(res.data);
      }
    } finally {
      setIsLoadingContacts(false);
    }
  }, []);

  const handleOpenSafety = () => {
    setSafetyModalVisible(true);
    loadEmergencyContacts();
  };

  const handleSaveContact = async () => {
    if (!newContactName.trim() || !newContactPhone.trim()) {
      Alert.alert('Required Fields', 'Please enter name and phone number for the emergency contact.');
      return;
    }
    setIsSavingContact(true);
    try {
      await apiPost('/customer/emergency-contacts/', {
        name: newContactName.trim(),
        phone: newContactPhone.trim(),
        relation: newContactRelation,
        isPrimary: emergencyContacts.length === 0,
      });
      setNewContactName('');
      setNewContactPhone('');
      setShowAddContactForm(false);
      await loadEmergencyContacts();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not add emergency contact.');
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    Alert.alert('Remove Contact', 'Are you sure you want to remove this emergency contact?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await apiDelete(`/customer/emergency-contacts/${id}/`);
          loadEmergencyContacts();
        },
      },
    ]);
  };

  // ── Edit Profile Save ──
  const handleSaveProfile = async () => {
    const trimmedName = editNameInput.trim();
    const trimmedEmail = editEmailInput.trim();
    if (!trimmedName) {
      Alert.alert('Name Required', 'Please enter your full name.');
      return;
    }

    setIsSavingProfile(true);
    try {
      await apiPatch('/customer/profile/update/', {
        name: trimmedName,
        email: trimmedEmail,
      });
      setUserName(trimmedName);
      setUserEmail(trimmedEmail);
      await updateProfile(trimmedName);
      if (refreshProfile) await refreshProfile();
      setEditModalVisible(false);
      Alert.alert('Success', 'Profile details updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ── Preferences Save ──
  const handleSavePreferences = async () => {
    setIsSavingPreferences(true);
    try {
      await apiPatch('/customer/profile/update/', {
        quietRide,
        acPreferred,
        cashlessOnly,
      });
      setPreferencesModalVisible(false);
      Alert.alert('Saved', 'Your ride preferences have been saved.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save preferences.');
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleLogout = () => {
    const performLogout = onLogout || logout;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        const confirmed = window.confirm('Are you sure you want to log out of KeralaGO?');
        if (confirmed) performLogout();
      } else {
        performLogout();
      }
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out of KeralaGO?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: performLogout },
      ]);
    }
  };

  const initialLetter = (userName.trim().charAt(0) || 'K').toUpperCase();

  const menuItems = [
    {
      id: 'payment',
      title: 'Payment Methods',
      iconName: 'card-outline',
      subtitle: savedPayments.length > 0 ? `${savedPayments.length} linked` : 'UPI, Cards & Wallet',
      onPress: handleOpenPayments,
    },
    {
      id: 'addresses',
      title: 'Your Addresses',
      iconName: 'location-outline',
      subtitle: savedLocations.length > 0 ? `${savedLocations.length} saved places` : 'Add Home & Work',
      onPress: handleOpenAddresses,
    },
    {
      id: 'preferences',
      title: 'Ride Preferences',
      iconName: 'shield-checkmark-outline',
      subtitle: acPreferred ? 'AC preferred' : 'Standard',
      onPress: () => setPreferencesModalVisible(true),
    },
    {
      id: 'safety',
      title: 'Safety & Emergency SOS',
      iconName: 'shield-outline',
      subtitle: emergencyContacts.length > 0 ? `${emergencyContacts.length} contacts linked` : '24x7 Helpline: 112',
      onPress: handleOpenSafety,
    },
    {
      id: 'invite',
      title: 'Invite Friends',
      iconName: 'people-outline',
      subtitle: 'Earn ₹50 for referrals',
      onPress: () => setInviteModalVisible(true),
    },
    {
      id: 'help',
      title: 'Help & FAQs',
      iconName: 'help-circle-outline',
      subtitle: 'Ride guide & cancellation info',
      onPress: () => setSupportModalVisible(true),
    },
    {
      id: 'settings',
      title: 'Language & Settings',
      iconName: 'settings-outline',
      subtitle: selectedLanguage,
      onPress: () => setSettingsModalVisible(true),
    },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Top Header ── */}
        <View style={styles.headerRow}>
          <Typography variant="h2" weight="bold" color="#0F172A">
            Profile
          </Typography>

          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => setSettingsModalVisible(true)}
            activeOpacity={0.7}
          >
            <Icon library="Ionicons" name="settings-outline" size={22} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* ── User Profile Card ── */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Typography variant="h1" weight="bold" color="#FFFFFF" style={styles.avatarText}>
              {initialLetter}
            </Typography>
          </View>

          <View style={styles.userDetailsCol}>
            <Typography variant="h3" weight="bold" color="#0F172A">
              {userName}
            </Typography>
            <Typography variant="body2" color="#64748B" style={styles.phoneText}>
              {userPhone}
            </Typography>
            {userEmail ? (
              <Typography variant="xs" color="#94A3B8" numberOfLines={1}>
                {userEmail}
              </Typography>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => {
              setEditNameInput(userName);
              setEditEmailInput(userEmail);
              setEditModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Typography variant="body2" weight="semiBold" color="#16A34A" style={styles.editText}>
              Edit
            </Typography>
            <Icon library="Ionicons" name="chevron-forward" size={16} color="#16A34A" />
          </TouchableOpacity>
        </View>

        {/* ── Menu Items Card ── */}
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => {
            const isLast = index === menuItems.length - 1;
            return (
              <View key={item.id}>
                <TouchableOpacity style={styles.menuItemRow} onPress={item.onPress} activeOpacity={0.65}>
                  <View style={styles.menuIconWrap}>
                    <Icon library="Ionicons" name={item.iconName} size={21} color="#0F172A" />
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Typography variant="body1" weight="semiBold" color="#0F172A">
                      {item.title}
                    </Typography>
                    {item.subtitle ? (
                      <Typography variant="xs" color="#94A3B8" style={{ marginTop: 2 }}>
                        {item.subtitle}
                      </Typography>
                    ) : null}
                  </View>

                  <Icon library="Ionicons" name="chevron-forward" size={18} color="#94A3B8" />
                </TouchableOpacity>

                {!isLast && <View style={styles.menuDivider} />}
              </View>
            );
          })}
        </View>

        {/* ── Driver Partner Mode Switcher / Become a Partner Banner ── */}
        {isDriver ? (
          <View style={styles.roleCard}>
            <View style={styles.roleLeft}>
              <View style={styles.roleIconBadge}>
                <Icon library="MaterialCommunityIcons" name="steering" size={20} color="#0F4A2B" />
              </View>
              <View style={styles.roleTextWrap}>
                <Typography variant="body1" weight="bold" color="#0F172A">
                  Driver Partner Mode
                </Typography>
                <Typography variant="xs" color="#64748B">
                  Switch to driver console & trip dispatch
                </Typography>
              </View>
            </View>

            <TouchableOpacity style={styles.switchRoleBtn} onPress={onToggleRole || toggleRole} activeOpacity={0.8}>
              <Typography variant="xs" weight="bold" color="#0F4A2B">
                Switch 🚖
              </Typography>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.partnerBannerCard}>
            <View style={styles.partnerBadge}>
              <Icon library="Ionicons" name="sparkles" size={12} color="#047857" />
              <Typography variant="xs" weight="bold" color="#047857" style={{ marginLeft: 4 }}>
                ₹35,000+/mo Potential • 0% Commission on Auto
              </Typography>
            </View>

            <Typography variant="body1" weight="bold" color="#0F172A" style={{ marginTop: 8 }}>
              Drive & Earn with KeralaGO
            </Typography>
            <Typography variant="xs" color="#475569" style={{ marginTop: 4, lineHeight: 18 }}>
              Turn your Auto, Car, or Bike into daily earnings. Instant onboarding, daily bank payouts, and flexible transit hours across Kerala.
            </Typography>

            <TouchableOpacity style={styles.registerPartnerBtn} onPress={openDriverRegistration} activeOpacity={0.85}>
              <Icon library="MaterialCommunityIcons" name="steering" size={16} color="#FFFFFF" />
              <Typography variant="xs" weight="bold" color="#FFFFFF" style={{ marginLeft: 6 }}>
                Register Vehicle & Drive →
              </Typography>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Log Out Button ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Icon library="Ionicons" name="log-out-outline" size={19} color="#DC2626" />
          <Typography variant="body2" weight="semiBold" color="#DC2626" style={{ marginLeft: 8 }}>
            Log Out
          </Typography>
        </TouchableOpacity>
      </ScrollView>

      {/* ═══════════════════════════════════════════════════════════════════════
          1. EDIT PERSONAL DETAILS MODAL
         ═══════════════════════════════════════════════════════════════════════ */}
      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Typography variant="h3" weight="bold" color="#0F172A">
                Edit Personal Details
              </Typography>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Icon library="Ionicons" name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Typography variant="caption" weight="semiBold" color="#64748B" style={styles.inputLabel}>
              FULL NAME *
            </Typography>
            <TextInput
              style={styles.modalInput}
              value={editNameInput}
              onChangeText={setEditNameInput}
              placeholder="Your Full Name"
              placeholderTextColor="#94A3B8"
            />

            <Typography variant="caption" weight="semiBold" color="#64748B" style={[styles.inputLabel, { marginTop: 14 }]}>
              EMAIL ADDRESS
            </Typography>
            <TextInput
              style={styles.modalInput}
              value={editEmailInput}
              onChangeText={setEditEmailInput}
              placeholder="e.g. yourname@gmail.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Typography variant="caption" weight="semiBold" color="#64748B" style={[styles.inputLabel, { marginTop: 14 }]}>
              PHONE NUMBER (VERIFIED)
            </Typography>
            <TextInput
              style={[styles.modalInput, { backgroundColor: '#F1F5F9' }]}
              value={userPhone}
              editable={false}
              placeholderTextColor="#94A3B8"
            />

            <View style={styles.modalActionRow}>
              <Button
                label={isSavingProfile ? 'Saving...' : 'Save Changes'}
                variant="primary"
                size="md"
                fullWidth
                disabled={isSavingProfile}
                onPress={handleSaveProfile}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          2. PAYMENT METHODS MODAL
         ═══════════════════════════════════════════════════════════════════════ */}
      <Modal visible={paymentModalVisible} transparent animationType="fade" onRequestClose={() => setPaymentModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Typography variant="h3" weight="bold" color="#0F172A">
                  Payment Methods
                </Typography>
                <Typography variant="xs" color="#64748B" style={{ marginTop: 2 }}>
                  KeralaGO Wallet: ₹{walletBalance.toFixed(2)}
                </Typography>
              </View>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Icon library="Ionicons" name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
              {isLoadingPayments ? (
                <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 24 }} />
              ) : savedPayments.length === 0 ? (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <Icon library="Ionicons" name="card-outline" size={32} color="#94A3B8" />
                  <Typography variant="body2" color="#64748B" style={{ marginTop: 8 }}>
                    No payment methods linked yet.
                  </Typography>
                </View>
              ) : (
                savedPayments.map((p) => (
                  <View key={p.id} style={styles.paymentMethodRow}>
                    <View style={styles.addressIconWrap}>
                      <Icon
                        library="Ionicons"
                        name={p.type === 'UPI' ? 'phone-portrait-outline' : 'card-outline'}
                        size={18}
                        color="#0F4A2B"
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Typography variant="body2" weight="bold" color="#0F172A">
                          {p.title}
                        </Typography>
                        {p.isDefault && (
                          <Badge variant="success" label="Default" size="sm" style={{ marginLeft: 8 }} />
                        )}
                      </View>
                      <Typography variant="xs" color="#64748B">
                        {p.subtitle}
                      </Typography>
                    </View>
                    {!p.isDefault && (
                      <TouchableOpacity
                        onPress={() => handleSetDefaultPayment(p.id)}
                        style={{ paddingHorizontal: 8, paddingVertical: 4 }}
                      >
                        <Typography variant="xs" weight="semiBold" color="#16A34A">
                          Set Default
                        </Typography>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => handleDeletePaymentMethod(p.id)} style={{ padding: 4 }}>
                      <Icon library="Ionicons" name="trash-outline" size={18} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                ))
              )}

              {/* Add Payment Form Toggle */}
              {showAddPaymentForm ? (
                <View style={styles.subFormCard}>
                  <Typography variant="body2" weight="bold" color="#0F172A" style={{ marginBottom: 10 }}>
                    Add Payment Method
                  </Typography>

                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    {(['UPI', 'CARD'] as const).map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.pill, newPaymentType === t ? styles.pillActive : styles.pillInactive]}
                        onPress={() => setNewPaymentType(t)}
                      >
                        <Typography variant="xs" weight="bold" color={newPaymentType === t ? '#FFFFFF' : '#475569'}>
                          {t === 'UPI' ? 'UPI ID' : 'Debit/Credit Card'}
                        </Typography>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {newPaymentType === 'UPI' ? (
                    <>
                      <Typography variant="caption" weight="semiBold" color="#64748B" style={styles.inputLabel}>
                        UPI ID (VPA) *
                      </Typography>
                      <TextInput
                        style={styles.modalInput}
                        value={newUpiVpa}
                        onChangeText={setNewUpiVpa}
                        placeholder="e.g. mobile@okaxis or name@paytm"
                        autoCapitalize="none"
                      />
                    </>
                  ) : (
                    <>
                      <Typography variant="caption" weight="semiBold" color="#64748B" style={styles.inputLabel}>
                        CARDHOLDER / BANK NAME *
                      </Typography>
                      <TextInput
                        style={styles.modalInput}
                        value={newCardTitle}
                        onChangeText={setNewCardTitle}
                        placeholder="e.g. SBI Global Visa Debit"
                      />
                      <Typography variant="caption" weight="semiBold" color="#64748B" style={[styles.inputLabel, { marginTop: 10 }]}>
                        CARD NUMBER (LAST 4 DIGITS) *
                      </Typography>
                      <TextInput
                        style={styles.modalInput}
                        value={newCardNumber}
                        onChangeText={setNewCardNumber}
                        placeholder="e.g. 4821"
                        maxLength={4}
                        keyboardType="numeric"
                      />
                    </>
                  )}

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                    <Button
                      label="Cancel"
                      variant="outline"
                      size="sm"
                      style={{ flex: 1 }}
                      onPress={() => setShowAddPaymentForm(false)}
                    />
                    <Button
                      label={isSavingPayment ? 'Saving...' : 'Link Method'}
                      variant="primary"
                      size="sm"
                      style={{ flex: 1 }}
                      disabled={isSavingPayment}
                      onPress={handleSavePaymentMethod}
                    />
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addDashedBtn}
                  onPress={() => setShowAddPaymentForm(true)}
                  activeOpacity={0.7}
                >
                  <Icon library="Ionicons" name="add-circle-outline" size={20} color="#0F4A2B" />
                  <Typography variant="body2" weight="bold" color="#0F4A2B" style={{ marginLeft: 6 }}>
                    + Link New UPI / Card
                  </Typography>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          3. SAVED ADDRESSES MODAL
         ═══════════════════════════════════════════════════════════════════════ */}
      <Modal visible={addressesModalVisible} transparent animationType="fade" onRequestClose={() => setAddressesModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Typography variant="h3" weight="bold" color="#0F172A">
                Your Addresses
              </Typography>
              <TouchableOpacity onPress={() => setAddressesModalVisible(false)}>
                <Icon library="Ionicons" name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
              {isLoadingLocations ? (
                <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 24 }} />
              ) : savedLocations.length === 0 ? (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <Icon library="Ionicons" name="location-outline" size={32} color="#94A3B8" />
                  <Typography variant="body2" color="#64748B" style={{ marginTop: 8 }}>
                    No saved addresses yet
                  </Typography>
                </View>
              ) : (
                savedLocations.map((item) => (
                  <View key={item.id} style={styles.addressRow}>
                    <View style={styles.addressIconWrap}>
                      <Icon library="Ionicons" name={item.iconName || 'location-sharp'} size={18} color="#0F4A2B" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Typography variant="body2" weight="bold" color="#0F172A">
                        {item.label} ({item.title})
                      </Typography>
                      <Typography variant="xs" color="#64748B">
                        {item.subtitle || item.address}
                      </Typography>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setEditingLocationId(item.id);
                        setNewAddressLabel(item.label || 'Home');
                        setNewAddressTitle(item.title || '');
                        setNewAddressFull(item.subtitle || item.address || '');
                        setShowAddAddressForm(true);
                      }}
                      style={{ padding: 4, marginRight: 6 }}
                    >
                      <Icon library="Ionicons" name="create-outline" size={18} color="#16A34A" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteAddress(item.id)} style={{ padding: 4 }}>
                      <Icon library="Ionicons" name="trash-outline" size={18} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                ))
              )}

              {/* Add Address Form Toggle */}
              {showAddAddressForm ? (
                <View style={styles.subFormCard}>
                  <Typography variant="body2" weight="bold" color="#0F172A" style={{ marginBottom: 10 }}>
                    {editingLocationId ? 'Edit Address' : 'Add New Address'}
                  </Typography>

                  <Typography variant="caption" weight="semiBold" color="#64748B" style={styles.inputLabel}>
                    CATEGORY LABEL
                  </Typography>
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                    {ADDRESS_LABEL_OPTIONS.map((lbl) => (
                      <TouchableOpacity
                        key={lbl}
                        style={[styles.pill, newAddressLabel === lbl ? styles.pillActive : styles.pillInactive]}
                        onPress={() => setNewAddressLabel(lbl)}
                      >
                        <Typography variant="xs" weight="bold" color={newAddressLabel === lbl ? '#FFFFFF' : '#475569'}>
                          {lbl}
                        </Typography>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Typography variant="caption" weight="semiBold" color="#64748B" style={styles.inputLabel}>
                    PLACE NAME / SHORT TITLE *
                  </Typography>
                  <TextInput
                    style={styles.modalInput}
                    value={newAddressTitle}
                    onChangeText={setNewAddressTitle}
                    placeholder="e.g. My Apartment, Infopark Phase 1"
                  />

                  <Typography variant="caption" weight="semiBold" color="#64748B" style={[styles.inputLabel, { marginTop: 10 }]}>
                    COMPLETE ADDRESS / LANDMARK *
                  </Typography>
                  <TextInput
                    style={[styles.modalInput, { height: 60, textAlignVertical: 'top' }]}
                    value={newAddressFull}
                    onChangeText={setNewAddressFull}
                    placeholder="e.g. Door 4B, Skyline Riverdale, Kakkanad, Kochi"
                    multiline
                  />

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                    <Button
                      label="Cancel"
                      variant="outline"
                      size="sm"
                      style={{ flex: 1 }}
                      onPress={() => {
                        setShowAddAddressForm(false);
                        setEditingLocationId(null);
                      }}
                    />
                    <Button
                      label={isSavingAddress ? 'Saving...' : 'Save Address'}
                      variant="primary"
                      size="sm"
                      style={{ flex: 1 }}
                      disabled={isSavingAddress}
                      onPress={handleSaveAddress}
                    />
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addDashedBtn}
                  onPress={() => {
                    setEditingLocationId(null);
                    setNewAddressTitle('');
                    setNewAddressFull('');
                    setShowAddAddressForm(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Icon library="Ionicons" name="add-circle-outline" size={20} color="#0F4A2B" />
                  <Typography variant="body2" weight="bold" color="#0F4A2B" style={{ marginLeft: 6 }}>
                    + Add New Address
                  </Typography>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          4. RIDE PREFERENCES MODAL
         ═══════════════════════════════════════════════════════════════════════ */}
      <Modal visible={preferencesModalVisible} transparent animationType="fade" onRequestClose={() => setPreferencesModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Typography variant="h3" weight="bold" color="#0F172A">
                Ride Preferences
              </Typography>
              <TouchableOpacity onPress={() => setPreferencesModalVisible(false)}>
                <Icon library="Ionicons" name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.prefRow}>
              <View style={{ flex: 1 }}>
                <Typography variant="body2" weight="bold" color="#0F172A">
                  Quiet Ride
                </Typography>
                <Typography variant="xs" color="#64748B">
                  Minimal conversation preferred during trips
                </Typography>
              </View>
              <Switch
                value={quietRide}
                onValueChange={setQuietRide}
                trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
                thumbColor={quietRide ? '#16A34A' : '#F1F5F9'}
              />
            </View>

            <View style={styles.prefRow}>
              <View style={{ flex: 1 }}>
                <Typography variant="body2" weight="bold" color="#0F172A">
                  AC Preferred
                </Typography>
                <Typography variant="xs" color="#64748B">
                  Request air-conditioned vehicle cabin
                </Typography>
              </View>
              <Switch
                value={acPreferred}
                onValueChange={setAcPreferred}
                trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
                thumbColor={acPreferred ? '#16A34A' : '#F1F5F9'}
              />
            </View>

            <View style={styles.prefRow}>
              <View style={{ flex: 1 }}>
                <Typography variant="body2" weight="bold" color="#0F172A">
                  Digital Payments Only
                </Typography>
                <Typography variant="xs" color="#64748B">
                  Request cashless settlement by default
                </Typography>
              </View>
              <Switch
                value={cashlessOnly}
                onValueChange={setCashlessOnly}
                trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
                thumbColor={cashlessOnly ? '#16A34A' : '#F1F5F9'}
              />
            </View>

            <View style={{ marginTop: 20 }}>
              <Button
                label={isSavingPreferences ? 'Saving...' : 'Save Preferences'}
                variant="primary"
                size="md"
                fullWidth
                disabled={isSavingPreferences}
                onPress={handleSavePreferences}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          5. SAFETY & EMERGENCY CONTACTS MODAL
         ═══════════════════════════════════════════════════════════════════════ */}
      <Modal visible={safetyModalVisible} transparent animationType="fade" onRequestClose={() => setSafetyModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Typography variant="h3" weight="bold" color="#0F172A">
                Safety & Emergency Contacts
              </Typography>
              <TouchableOpacity onPress={() => setSafetyModalVisible(false)}>
                <Icon library="Ionicons" name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
              {/* Emergency Banner */}
              <View style={styles.emergencyBanner}>
                <Icon library="Ionicons" name="call" size={20} color="#DC2626" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Typography variant="body2" weight="bold" color="#991B1B">
                    National Emergency Helpline: 112
                  </Typography>
                  <Typography variant="xs" color="#B91C1C">
                    24x7 Police, Ambulance & Highway Patrol
                  </Typography>
                </View>
              </View>

              <Typography variant="body2" weight="bold" color="#0F172A" style={{ marginTop: 14, marginBottom: 8 }}>
                Trusted Emergency Contacts
              </Typography>

              {isLoadingContacts ? (
                <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 20 }} />
              ) : emergencyContacts.length === 0 ? (
                <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                  <Typography variant="body2" color="#64748B">
                    No emergency contacts added yet.
                  </Typography>
                </View>
              ) : (
                emergencyContacts.map((c) => (
                  <View key={c.id} style={styles.addressRow}>
                    <View style={styles.addressIconWrap}>
                      <Icon library="Ionicons" name="shield-checkmark" size={18} color="#0F4A2B" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Typography variant="body2" weight="bold" color="#0F172A">
                        {c.name} ({c.relation})
                      </Typography>
                      <Typography variant="xs" color="#64748B">
                        {c.phone}
                      </Typography>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteContact(c.id)} style={{ padding: 4 }}>
                      <Icon library="Ionicons" name="trash-outline" size={18} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                ))
              )}

              {/* Add Contact Form Toggle */}
              {showAddContactForm ? (
                <View style={styles.subFormCard}>
                  <Typography variant="body2" weight="bold" color="#0F172A" style={{ marginBottom: 10 }}>
                    Add Trusted Contact
                  </Typography>

                  <Typography variant="caption" weight="semiBold" color="#64748B" style={styles.inputLabel}>
                    CONTACT NAME *
                  </Typography>
                  <TextInput
                    style={styles.modalInput}
                    value={newContactName}
                    onChangeText={setNewContactName}
                    placeholder="e.g. Ramesh (Father)"
                  />

                  <Typography variant="caption" weight="semiBold" color="#64748B" style={[styles.inputLabel, { marginTop: 10 }]}>
                    PHONE NUMBER *
                  </Typography>
                  <TextInput
                    style={styles.modalInput}
                    value={newContactPhone}
                    onChangeText={setNewContactPhone}
                    placeholder="e.g. +91 94471 23456"
                    keyboardType="phone-pad"
                  />

                  <Typography variant="caption" weight="semiBold" color="#64748B" style={[styles.inputLabel, { marginTop: 10 }]}>
                    RELATIONSHIP
                  </Typography>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {RELATION_OPTIONS.map((rel) => (
                      <TouchableOpacity
                        key={rel}
                        style={[styles.pill, newContactRelation === rel ? styles.pillActive : styles.pillInactive]}
                        onPress={() => setNewContactRelation(rel)}
                      >
                        <Typography variant="xs" weight="bold" color={newContactRelation === rel ? '#FFFFFF' : '#475569'}>
                          {rel}
                        </Typography>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    <Button
                      label="Cancel"
                      variant="outline"
                      size="sm"
                      style={{ flex: 1 }}
                      onPress={() => setShowAddContactForm(false)}
                    />
                    <Button
                      label={isSavingContact ? 'Saving...' : 'Add Contact'}
                      variant="primary"
                      size="sm"
                      style={{ flex: 1 }}
                      disabled={isSavingContact}
                      onPress={handleSaveContact}
                    />
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addDashedBtn}
                  onPress={() => setShowAddContactForm(true)}
                  activeOpacity={0.7}
                >
                  <Icon library="Ionicons" name="person-add-outline" size={20} color="#0F4A2B" />
                  <Typography variant="body2" weight="bold" color="#0F4A2B" style={{ marginLeft: 6 }}>
                    + Add Emergency Contact
                  </Typography>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          6. SETTINGS & LANGUAGE MODAL
         ═══════════════════════════════════════════════════════════════════════ */}
      <Modal visible={settingsModalVisible} transparent animationType="fade" onRequestClose={() => setSettingsModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Typography variant="h3" weight="bold" color="#0F172A">
                Settings & Preferences
              </Typography>
              <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
                <Icon library="Ionicons" name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Typography variant="body2" weight="bold" color="#0F172A" style={{ marginBottom: 8 }}>
              App Language
            </Typography>
            <View style={{ gap: 8, marginBottom: 16 }}>
              {LANGUAGE_OPTIONS.map((lang) => (
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
                  Push Notifications
                </Typography>
                <Typography variant="xs" color="#64748B">
                  Receive live driver arrival and trip updates
                </Typography>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
                thumbColor={notificationsEnabled ? '#16A34A' : '#F1F5F9'}
              />
            </View>

            <View style={{ marginTop: 18, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12, alignItems: 'center' }}>
              <Typography variant="xs" color="#94A3B8">
                KeralaGO Passenger App • v2.4.0 (Build 2026)
              </Typography>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          7. HELP & SUPPORT MODAL
         ═══════════════════════════════════════════════════════════════════════ */}
      <Modal visible={supportModalVisible} transparent animationType="fade" onRequestClose={() => setSupportModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Typography variant="h3" weight="bold" color="#0F172A">
                Help & FAQs
              </Typography>
              <TouchableOpacity onPress={() => setSupportModalVisible(false)}>
                <Icon library="Ionicons" name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12 }}>
              <View style={styles.faqCard}>
                <Typography variant="body2" weight="bold" color="#0F172A">
                  1. How are fares calculated?
                </Typography>
                <Typography variant="xs" color="#64748B" style={{ marginTop: 4, lineHeight: 18 }}>
                  Standard meter regulated rates per km prescribed by Kerala Motor Vehicles Department (MVD) with 0% hidden surge.
                </Typography>
              </View>

              <View style={styles.faqCard}>
                <Typography variant="body2" weight="bold" color="#0F172A">
                  2. What is Pink Ride?
                </Typography>
                <Typography variant="xs" color="#64748B" style={{ marginTop: 4, lineHeight: 18 }}>
                  KeralaGO Pink Rides are exclusively operated by verified women driver partners for women passengers.
                </Typography>
              </View>

              <View style={styles.faqCard}>
                <Typography variant="body2" weight="bold" color="#0F172A">
                  3. 24x7 Passenger Support
                </Typography>
                <Typography variant="xs" color="#64748B" style={{ marginTop: 4 }}>
                  Toll-Free Helpline: 1800-425-KRLGO (1800 425 465)
                </Typography>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          8. INVITE FRIENDS MODAL
         ═══════════════════════════════════════════════════════════════════════ */}
      <Modal visible={inviteModalVisible} transparent animationType="fade" onRequestClose={() => setInviteModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { alignItems: 'center' }]}>
            <View style={styles.referralIconCircle}>
              <Icon library="Ionicons" name="gift" size={36} color="#0F4A2B" />
            </View>

            <Typography variant="h3" weight="bold" color="#0F172A" style={{ marginTop: 14 }}>
              Invite Friends & Earn ₹50
            </Typography>
            <Typography variant="body2" color="#64748B" align="center" style={{ marginTop: 6, lineHeight: 20 }}>
              Share your referral code. When a friend completes their first ride, both of you earn ₹50 in your KeralaGO Wallet!
            </Typography>

            <View style={styles.codeBox}>
              <Typography variant="h3" weight="bold" color="#0F4A2B">
                KERALAGO-{userPhone.slice(-4) || '2026'}
              </Typography>
            </View>

            <Button
              label="Share Referral Link"
              variant="primary"
              size="md"
              fullWidth
              style={{ marginTop: 18 }}
              onPress={() => {
                Alert.alert('Referral Code Copied', `KERALAGO-${userPhone.slice(-4) || '2026'} copied to clipboard!`);
                setInviteModalVisible(false);
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing['3xl'],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 6,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  avatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#0F4A2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    lineHeight: 34,
  },
  userDetailsCol: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  phoneText: {
    marginTop: 2,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  editText: {
    marginRight: 2,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  roleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roleIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EDF8F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTextWrap: {
    marginLeft: 12,
    flex: 1,
  },
  switchRoleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#EDF8F1',
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  partnerBannerCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    marginBottom: 16,
  },
  partnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  registerPartnerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F4A2B',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 14,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginTop: 4,
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
  modalActionRow: {
    marginTop: 20,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  addressIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDF8F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  subFormCard: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 14,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  pillActive: {
    backgroundColor: '#0F4A2B',
    borderColor: '#0F4A2B',
  },
  pillInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
  },
  addDashedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#0F4A2B',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 14,
    backgroundColor: '#F0FDF4',
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: 12,
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
  faqCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  referralIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#EDF8F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBox: {
    backgroundColor: '#EDF8F1',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#0F4A2B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
});

export default CustomerProfileView;

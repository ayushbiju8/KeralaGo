import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Switch,
  Share,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, Icon, Button, Badge } from '../../../components/atoms';
import { Colors, Spacing, Radii, Shadows } from '../../../constants/theme';
import { useAuth } from '../../../hooks/useAuth';
import { apiGet, apiPatch } from '../../../services/apiClient';
import { customerData } from '../../../data';

interface CustomerProfileViewProps {
  onLogout?: () => void;
  onToggleRole?: () => void;
  currentRole?: string;
  /** Called when user taps Payment Methods — navigates to Wallet tab */
  onNavigateToWallet?: () => void;
}

interface MenuItem {
  id: string;
  title: string;
  iconName: string;
  iconLibrary?: 'Ionicons' | 'MaterialCommunityIcons';
  onPress: () => void;
}

/**
 * Page: CustomerProfileView
 *
 * Exact replication of Profile screen from KeralaGo Ride Booking App UI Flow:
 * - Dynamically connected to PostgreSQL/SQLite database via useAuth
 * - Header: "Profile" title with right Settings gear icon
 * - User card: Emerald circular avatar with initial letter, dynamic Name, Phone, and "Edit >" button
 * - Menu Items Card:
 *   1. Payment Methods
 *   2. Your Addresses
 *   3. Ride Preferences
 *   4. Safety & Support
 *   5. Invite Friends
 *   6. Help & FAQs
 *   7. About KeralaGo
 * - Bottom role switcher and Log Out CTA
 */
const CustomerProfileView: React.FC<CustomerProfileViewProps> = ({
  onLogout,
  onToggleRole,
  currentRole,
  onNavigateToWallet,
}) => {
  const { user, updateProfile, logout } = useAuth();
  const [savedLocations, setSavedLocations] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    apiGet<any[]>('/customer/locations/', []).then((res) => {
      if (isMounted && res.data) {
        setSavedLocations(res.data);
      }
    });
    return () => { isMounted = false; };
  }, []);

  const handleLogout = () => {
    const performLogout = onLogout || logout;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        const confirmed = window.confirm('Are you sure you want to log out of KeralaGO?');
        if (confirmed) {
          performLogout();
        }
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
  const [userName, setUserName] = useState<string>(user?.name || '');
  const [userPhone, setUserPhone] = useState<string>(user?.phone || '');
  const [userGender, setUserGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>((user?.gender as any) || 'FEMALE');
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [editNameInput, setEditNameInput] = useState<string>(userName);
  const [editPhoneInput, setEditPhoneInput] = useState<string>(userPhone);
  const [editGenderInput, setEditGenderInput] = useState<'MALE' | 'FEMALE' | 'OTHER'>((user?.gender as any) || 'FEMALE');

  // Sync state whenever authenticated user data is fetched or updated in database
  useEffect(() => {
    if (user?.name) {
      setUserName(user.name);
      setEditNameInput(user.name);
    }
    if (user?.phone) {
      setUserPhone(user.phone);
      setEditPhoneInput(user.phone);
    }
    if (user?.gender) {
      setUserGender(user.gender as any);
      setEditGenderInput(user.gender as any);
    }
  }, [user]);

  // Preference switches
  const [preferencesModalVisible, setPreferencesModalVisible] = useState<boolean>(false);
  const [quietRide, setQuietRide] = useState<boolean>(true);
  const [acPreferred, setAcPreferred] = useState<boolean>(true);
  const [cashlessOnly, setCashlessOnly] = useState<boolean>(false);

  // Addresses modal state
  const [addressesModalVisible, setAddressesModalVisible] = useState<boolean>(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>(customerData.savedLocations);
  const [showAddAddressForm, setShowAddAddressForm] = useState<boolean>(false);
  const [newAddressLabel, setNewAddressLabel] = useState<string>('Home');
  const [newAddressTitle, setNewAddressTitle] = useState<string>('');
  const [newAddressSubtitle, setNewAddressSubtitle] = useState<string>('');

  // Other profile modals
  const [safetyModalVisible, setSafetyModalVisible] = useState<boolean>(false);
  const [inviteModalVisible, setInviteModalVisible] = useState<boolean>(false);
  const [helpModalVisible, setHelpModalVisible] = useState<boolean>(false);
  const [aboutModalVisible, setAboutModalVisible] = useState<boolean>(false);
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('faq1');

  const initialLetter = (userName.trim().charAt(0) || 'K').toUpperCase();

  const handleSaveProfile = async () => {
    const trimmedName = editNameInput.trim();
    if (trimmedName) {
      setUserName(trimmedName);
      setUserGender(editGenderInput);
      await updateProfile(trimmedName, undefined, editGenderInput);
      await apiPatch('/customer/profile/update/', { name: trimmedName, gender: editGenderInput });
    }
    setEditModalVisible(false);
  };

  const handleAddNewAddress = () => {
    if (!newAddressTitle.trim()) {
      Alert.alert('Required', 'Please enter a name for this address.');
      return;
    }
    const newEntry = {
      id: `saved-${Date.now()}`,
      label: newAddressLabel,
      title: newAddressTitle.trim(),
      subtitle: newAddressSubtitle.trim() || 'Kothamangalam, Kerala',
      iconName: 'location-outline',
    };
    setSavedAddresses((prev) => [...prev, newEntry]);
    setNewAddressTitle('');
    setNewAddressSubtitle('');
    setShowAddAddressForm(false);
  };

  const handleDeleteAddress = (id: string) => {
    setSavedAddresses((prev) => prev.filter((item) => item.id !== id));
  };

  const handleShareInvite = async () => {
    try {
      await Share.share({
        message: 'Join KeralaGo! Use my invite code KERALAGO50 for ₹50 off your first ride: https://keralago.in/invite/KERALAGO50',
      });
    } catch (error) {
      // User cancelled
    }
  };

  const FAQS = [
    {
      id: 'faq1',
      question: 'How do I book a ride?',
      answer:
        'Tap the destination bar on the Home screen, type where you want to go or pick from the map. Choose your preferred vehicle (Auto, Ride, Bike, Pink Ride) and tap "Book Ride".',
    },
    {
      id: 'faq2',
      question: 'What is Pink Ride for women?',
      answer:
        'Pink Ride is KeralaGo’s dedicated women-exclusive taxi and auto service driven by verified women drivers, offering extra safety, verified badges, and 24/7 route tracking.',
    },
    {
      id: 'faq3',
      question: 'How are fares calculated?',
      answer:
        'All fares follow rates approved by the Kerala Motor Vehicles Department (MVD). Fares are calculated dynamically based on real Google road distance and estimated travel time with zero hidden charges.',
    },
    {
      id: 'faq4',
      question: 'Which payment methods are accepted?',
      answer:
        'We support UPI (Google Pay, PhonePe, Paytm), KeralaGo In-App Wallet, Credit/Debit cards (RuPay, Visa, Mastercard), and Cash directly to the driver at destination.',
    },
    {
      id: 'faq5',
      question: 'How do I report a lost item or safety issue?',
      answer:
        'Go to the "Bookings" tab, select your trip, and tap "Report Driver / Issue". For active emergencies, tap the red SOS button or dial Kerala 112 immediately.',
    },
  ];

  const menuItems: MenuItem[] = [
    {
      id: 'payment',
      title: 'Payment Methods',
      iconName: 'card-outline',
      onPress: () => {
        if (onNavigateToWallet) {
          onNavigateToWallet();
        } else {
          Alert.alert(
            'Payment Methods',
            '• UPI (GPay, PhonePe, Paytm)\n• Credit / Debit Card (Visa, RuPay, MC)\n• KeralaGo Wallet\n• Cash on Trip End'
          );
        }
      },
    },
    {
      id: 'addresses',
      title: 'Your Addresses',
      iconName: 'location-outline',
      onPress: () => setAddressesModalVisible(true),
    },
    {
      id: 'preferences',
      title: 'Ride Preferences',
      iconName: 'shield-checkmark-outline',
      onPress: () => setPreferencesModalVisible(true),
    },
    {
      id: 'safety',
      title: 'Safety & Support',
      iconName: 'shield-outline',
      onPress: () => setSafetyModalVisible(true),
    },
    {
      id: 'invite',
      title: 'Invite Friends',
      iconName: 'people-outline',
      onPress: () => setInviteModalVisible(true),
    },
    {
      id: 'help',
      title: 'Help & FAQs',
      iconName: 'help-circle-outline',
      onPress: () => setHelpModalVisible(true),
    },
    {
      id: 'about',
      title: 'About KeralaGo',
      iconName: 'information-circle-outline',
      onPress: () => setAboutModalVisible(true),
    },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Header matching reference UI: "Profile" title + Settings gear ── */}
        <View style={styles.headerRow}>
          <Typography variant="h2" weight="bold" color="#0F172A">
            Profile
          </Typography>

          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => {
              Alert.alert('Settings', 'App Settings & Notifications', [
                { text: 'OK' },
              ]);
            }}
            activeOpacity={0.7}
          >
            <Icon library="Ionicons" name="settings-outline" size={22} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* ── User Profile Card matching reference UI ── */}
        <View style={styles.profileCard}>
          {/* Circular Emerald Avatar with initial letter */}
          <View style={styles.avatarCircle}>
            <Typography variant="h1" weight="bold" color="#FFFFFF" style={styles.avatarText}>
              {initialLetter}
            </Typography>
          </View>

          {/* User Details */}
          <View style={styles.userDetailsCol}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <Typography variant="h3" weight="bold" color="#0F172A">
                {userName}
              </Typography>
              {userGender === 'FEMALE' && (
                <Badge label="Pink Cab Verified" variant="success" size="sm" />
              )}
            </View>
            <Typography variant="body2" color="#64748B" style={styles.phoneText}>
              {userPhone}
            </Typography>
          </View>

          {/* "Edit >" Button */}
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => {
              setEditNameInput(userName);
              setEditPhoneInput(userPhone);
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

        {/* ── Exact 7 Menu Items Card from reference UI ── */}
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => {
            const isLast = index === menuItems.length - 1;

            return (
              <View key={item.id}>
                <TouchableOpacity
                  style={styles.menuItemRow}
                  onPress={item.onPress}
                  activeOpacity={0.65}
                >
                  <View style={styles.menuIconWrap}>
                    <Icon
                      library={item.iconLibrary || 'Ionicons'}
                      name={item.iconName}
                      size={21}
                      color="#0F172A"
                    />
                  </View>

                  <Typography
                    variant="body1"
                    weight="semiBold"
                    color="#0F172A"
                    style={styles.menuItemTitle}
                  >
                    {item.title}
                  </Typography>

                  <Icon library="Ionicons" name="chevron-forward" size={18} color="#94A3B8" />
                </TouchableOpacity>

                {!isLast && <View style={styles.menuDivider} />}
              </View>
            );
          })}
        </View>

        {/* ── Driver Partner Mode Switcher (Seamless pair programming) ── */}
        {onToggleRole && (
          <View style={styles.roleCard}>
            <View style={styles.roleLeft}>
              <View style={styles.roleIconBadge}>
                <Icon
                  library="MaterialCommunityIcons"
                  name="steering"
                  size={20}
                  color="#0F4A2B"
                />
              </View>
              <View style={styles.roleTextWrap}>
                <Typography variant="body1" weight="bold" color="#0F172A">
                  Driver Partner Mode
                </Typography>
                <Typography variant="xs" color="#64748B">
                  Switch to driver app interface
                </Typography>
              </View>
            </View>

            <TouchableOpacity
              style={styles.switchRoleBtn}
              onPress={onToggleRole}
              activeOpacity={0.8}
            >
              <Typography variant="xs" weight="bold" color="#0F4A2B">
                Switch
              </Typography>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Log Out Button ── */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Icon library="Ionicons" name="log-out-outline" size={19} color="#DC2626" />
          <Typography variant="body2" weight="semiBold" color="#DC2626" style={{ marginLeft: 8 }}>
            Log Out
          </Typography>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Typography variant="h3" weight="bold" color="#0F172A">
                Edit Profile
              </Typography>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Icon library="Ionicons" name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Typography variant="caption" weight="semiBold" color="#64748B" style={styles.inputLabel}>
              FULL NAME
            </Typography>
            <TextInput
              style={styles.modalInput}
              value={editNameInput}
              onChangeText={setEditNameInput}
              placeholder="Your Name"
              placeholderTextColor="#94A3B8"
            />

            <Typography variant="caption" weight="semiBold" color="#64748B" style={[styles.inputLabel, { marginTop: 14 }]}>
              PHONE NUMBER
            </Typography>
            <TextInput
              style={styles.modalInput}
              value={editPhoneInput}
              onChangeText={setEditPhoneInput}
              placeholder="+91 98765 43210"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
            />

            <Typography variant="caption" weight="semiBold" color="#64748B" style={[styles.inputLabel, { marginTop: 14 }]}>
              PASSENGER GENDER (REQUIRED FOR PINK CAB SAFETY)
            </Typography>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
              {(['FEMALE', 'MALE', 'OTHER'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.labelChip,
                    editGenderInput === g && { backgroundColor: '#0F4A2B', borderColor: '#0F4A2B' }
                  ]}
                  onPress={() => setEditGenderInput(g)}
                  activeOpacity={0.8}
                >
                  <Typography
                    variant="xs"
                    weight="bold"
                    color={editGenderInput === g ? '#FFFFFF' : '#475569'}
                  >
                    {g === 'FEMALE' ? 'Female (Pink Cab)' : g === 'MALE' ? 'Male' : 'Other'}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActionRow}>
              <Button
                label="Save Changes"
                variant="primary"
                size="md"
                fullWidth
                onPress={handleSaveProfile}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Saved Addresses Modal (Add / Edit / Delete) ── */}
      <Modal visible={addressesModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Typography variant="h3" weight="bold" color="#0F172A">
                Your Addresses
              </Typography>
              <TouchableOpacity onPress={() => setAddressesModalVisible(false)}>
                <Icon library="Ionicons" name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {savedAddresses.map((item) => (
                <View key={item.id} style={styles.addressRow}>
                  <View style={styles.addressIconWrap}>
                    <Icon library="Ionicons" name="location-sharp" size={18} color="#0F4A2B" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Badge label={item.label} variant="neutral" size="sm" />
                      <Typography variant="body2" weight="bold" color="#0F172A" style={{ marginLeft: 6 }}>
                        {item.title}
                      </Typography>
                    </View>
                    <Typography variant="xs" color="#64748B" style={{ marginTop: 2 }}>
                      {item.subtitle}
                    </Typography>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteAddress(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ padding: 4 }}
                  >
                    <Icon library="Ionicons" name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}

              {showAddAddressForm ? (
                <View style={styles.addAddressForm}>
                  <Typography variant="caption" weight="bold" color="#0F172A" style={{ marginBottom: 6 }}>
                    LABEL
                  </Typography>
                  <View style={styles.labelChipsRow}>
                    {['Home', 'Work', 'College', 'Other'].map((lbl) => (
                      <TouchableOpacity
                        key={lbl}
                        style={[styles.labelChip, newAddressLabel === lbl && styles.labelChipActive]}
                        onPress={() => setNewAddressLabel(lbl)}
                      >
                        <Typography
                          variant="xs"
                          weight="bold"
                          color={newAddressLabel === lbl ? '#FFFFFF' : '#475569'}
                        >
                          {lbl}
                        </Typography>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TextInput
                    style={[styles.modalInput, { marginTop: 10 }]}
                    placeholder="Place name (e.g. MACE Main Gate)"
                    value={newAddressTitle}
                    onChangeText={setNewAddressTitle}
                    placeholderTextColor="#94A3B8"
                  />
                  <TextInput
                    style={[styles.modalInput, { marginTop: 8 }]}
                    placeholder="Area / Landmark (e.g. Kothamangalam)"
                    value={newAddressSubtitle}
                    onChangeText={setNewAddressSubtitle}
                    placeholderTextColor="#94A3B8"
                  />

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Button
                        label="Cancel"
                        variant="outline"
                        size="sm"
                        fullWidth
                        onPress={() => setShowAddAddressForm(false)}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button
                        label="Save Address"
                        variant="primary"
                        size="sm"
                        fullWidth
                        onPress={handleAddNewAddress}
                      />
                    </View>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addAddressBtn}
                  onPress={() => setShowAddAddressForm(true)}
                  activeOpacity={0.7}
                >
                  <Icon library="Ionicons" name="add-circle-outline" size={20} color="#16A34A" />
                  <Typography variant="body2" weight="bold" color="#16A34A" style={{ marginLeft: 8 }}>
                    + Add New Address
                  </Typography>
                </TouchableOpacity>
              )}
            </ScrollView>

            <View style={{ marginTop: 16 }}>
              <Button
                label="Done"
                variant="primary"
                size="md"
                fullWidth
                onPress={() => setAddressesModalVisible(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Safety & Emergency Support Modal ── */}
      <Modal visible={safetyModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.addressIconWrap, { backgroundColor: '#FEE2E2', marginRight: 10 }]}>
                  <Icon library="Ionicons" name="shield-checkmark" size={20} color="#DC2626" />
                </View>
                <Typography variant="h3" weight="bold" color="#0F172A">
                  Safety & Emergency
                </Typography>
              </View>
              <TouchableOpacity onPress={() => setSafetyModalVisible(false)}>
                <Icon library="Ionicons" name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.sosEmergencyBanner}
              onPress={() => {
                Linking.openURL('tel:112').catch(() => {
                  Alert.alert('Emergency Call', 'Dialing Kerala Police Control: 112');
                });
              }}
              activeOpacity={0.8}
            >
              <View style={styles.sosCircle}>
                <Typography variant="h3" weight="bold" color="#FFFFFF">
                  SOS
                </Typography>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Typography variant="body1" weight="bold" color="#FFFFFF">
                  Call Police Helpline 112
                </Typography>
                <Typography variant="xs" color="#FEE2E2">
                  Immediate GPS distress dispatch to local PCR
                </Typography>
              </View>
            </TouchableOpacity>

            <View style={styles.safetyInfoList}>
              <View style={styles.safetyInfoItem}>
                <Icon library="Ionicons" name="checkmark-circle" size={18} color="#16A34A" />
                <Typography variant="caption" color="#334155" style={{ marginLeft: 8, flex: 1 }}>
                  100% verified drivers with Kerala Police Clearance Certificate
                </Typography>
              </View>
              <View style={styles.safetyInfoItem}>
                <Icon library="Ionicons" name="checkmark-circle" size={18} color="#16A34A" />
                <Typography variant="caption" color="#334155" style={{ marginLeft: 8, flex: 1 }}>
                  Live GPS route tracking shared with KeralaGO control room
                </Typography>
              </View>
              <View style={styles.safetyInfoItem}>
                <Icon library="Ionicons" name="checkmark-circle" size={18} color="#16A34A" />
                <Typography variant="caption" color="#334155" style={{ marginLeft: 8, flex: 1 }}>
                  Pink Ride women-exclusive fleet with vetted female captains
                </Typography>
              </View>
            </View>

            <View style={{ marginTop: 16 }}>
              <Button
                label="Close"
                variant="outline"
                size="md"
                fullWidth
                onPress={() => setSafetyModalVisible(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Invite Friends & Earn Modal ── */}
      <Modal visible={inviteModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Typography variant="h3" weight="bold" color="#0F172A">
                Invite Friends
              </Typography>
              <TouchableOpacity onPress={() => setInviteModalVisible(false)}>
                <Icon library="Ionicons" name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.inviteHeroCard}>
              <View style={styles.giftIconWrap}>
                <Icon library="Ionicons" name="gift" size={32} color="#16A34A" />
              </View>
              <Typography variant="h3" weight="bold" color="#0F172A" align="center" style={{ marginTop: 8 }}>
                Give ₹50, Get ₹50
              </Typography>
              <Typography variant="caption" color="#64748B" align="center" style={{ marginTop: 4, paddingHorizontal: 16 }}>
                Share your invite code with friends. They get ₹50 off their 1st trip, and you get ₹50 in your KeralaGo Wallet!
              </Typography>

              <View style={styles.referralCodeBox}>
                <Typography variant="h3" weight="bold" color="#0F4A2B" style={{ letterSpacing: 2 }}>
                  KERALAGO50
                </Typography>
              </View>
            </View>

            <View style={{ marginTop: 16, gap: 10 }}>
              <Button
                label="Share Referral Link"
                variant="primary"
                size="md"
                fullWidth
                leftIcon={<Icon library="Ionicons" name="share-social-outline" size={18} color="#FFFFFF" />}
                onPress={handleShareInvite}
              />
              <Button
                label="Done"
                variant="outline"
                size="md"
                fullWidth
                onPress={() => setInviteModalVisible(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Help & FAQs Modal ── */}
      <Modal visible={helpModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Typography variant="h3" weight="bold" color="#0F172A">
                Help & FAQs
              </Typography>
              <TouchableOpacity onPress={() => setHelpModalVisible(false)}>
                <Icon library="Ionicons" name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              {FAQS.map((faq) => {
                const isExpanded = expandedFaqId === faq.id;
                return (
                  <View key={faq.id} style={styles.faqCard}>
                    <TouchableOpacity
                      style={styles.faqHeader}
                      onPress={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                      activeOpacity={0.7}
                    >
                      <Typography variant="body2" weight="bold" color="#0F172A" style={{ flex: 1 }}>
                        {faq.question}
                      </Typography>
                      <Icon
                        library="Ionicons"
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                    {isExpanded && (
                      <Typography variant="caption" color="#475569" style={styles.faqAnswer}>
                        {faq.answer}
                      </Typography>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            <View style={{ marginTop: 14 }}>
              <Button
                label="24/7 Helpline: 1800-425-4646"
                variant="outline"
                size="md"
                fullWidth
                leftIcon={<Icon library="Ionicons" name="call-outline" size={17} color="#0F4A2B" />}
                onPress={() => {
                  Linking.openURL('tel:18004254646').catch(() => {
                    Alert.alert('Support Helpline', 'Toll-free customer care: 1800-425-4646');
                  });
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── About KeralaGo Modal ── */}
      <Modal visible={aboutModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Typography variant="h3" weight="bold" color="#0F172A">
                About KeralaGo
              </Typography>
              <TouchableOpacity onPress={() => setAboutModalVisible(false)}>
                <Icon library="Ionicons" name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <View style={styles.aboutEmblemBadge}>
                <Icon library="Ionicons" name="car-sport" size={28} color="#0F4A2B" />
              </View>
              <Typography variant="h2" weight="bold" color="#0F172A" style={{ marginTop: 8 }}>
                KeralaGo
              </Typography>
              <Typography variant="caption" weight="semiBold" color="#16A34A" style={{ marginTop: 2 }}>
                God's Own Ride Aggregator • v1.0.0
              </Typography>
              <Typography variant="xs" color="#64748B" align="center" style={{ marginTop: 10, paddingHorizontal: 12 }}>
                Built in Kerala for Kerala. Powered by official Kerala MVD standardized tariff and fair driver earnings.
              </Typography>
            </View>

            <View style={styles.aboutInfoBox}>
              <View style={styles.aboutRow}>
                <Typography variant="caption" color="#64748B">
                  Regulatory Compliance:
                </Typography>
                <Typography variant="caption" weight="bold" color="#0F172A">
                  Kerala MVD Approved
                </Typography>
              </View>
              <View style={styles.aboutRow}>
                <Typography variant="caption" color="#64748B">
                  Customer Support:
                </Typography>
                <Typography variant="caption" weight="bold" color="#0F4A2B">
                  support@keralago.in
                </Typography>
              </View>
              <View style={styles.aboutRow}>
                <Typography variant="caption" color="#64748B">
                  License & Privacy:
                </Typography>
                <Typography variant="caption" weight="bold" color="#0F172A">
                  Standard Terms Apply
                </Typography>
              </View>
            </View>

            <View style={{ marginTop: 16 }}>
              <Button
                label="Close"
                variant="primary"
                size="md"
                fullWidth
                onPress={() => setAboutModalVisible(false)}
              />
            </View>
          </View>
        </View>
      </Modal>



      {/* ── Ride Preferences Modal ── */}
      <Modal visible={preferencesModalVisible} transparent animationType="fade">
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
                  Keep vehicle cabin cooled
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

            <View style={{ marginTop: 16 }}>
              <Button
                label="Save Preferences"
                variant="primary"
                size="md"
                fullWidth
                onPress={() => setPreferencesModalVisible(false)}
              />
            </View>
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
    borderColor: '#F1F5F9',
    ...Shadows.xs,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: Spacing.md,
    ...Shadows.xs,
  },
  avatarCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    lineHeight: 34,
  },
  userDetailsCol: {
    flex: 1,
    marginLeft: 14,
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
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.xs,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  menuIconWrap: {
    width: 26,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  menuItemTitle: {
    flex: 1,
    marginLeft: 8,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F8FAFC',
    marginLeft: 50,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: Spacing.md,
    ...Shadows.xs,
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
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#EDF8F1',
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: '#BBF7D0',
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
    maxWidth: 400,
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
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  modalActionRow: {
    marginTop: 20,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  addressIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EDF8F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  addAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderStyle: 'dashed',
  },
  addAddressForm: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  labelChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  labelChip: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: Radii.full,
    backgroundColor: '#E2E8F0',
  },
  labelChipActive: {
    backgroundColor: '#16A34A',
  },
  sosEmergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Shadows.md,
  },
  sosCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyInfoList: {
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 14,
  },
  safetyInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inviteHeroCard: {
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  giftIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralCodeBox: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#16A34A',
    borderStyle: 'dashed',
  },
  faqCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  faqAnswer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    lineHeight: 18,
  },
  aboutEmblemBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EDF8F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutInfoBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    marginTop: 6,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default CustomerProfileView;

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, Icon, Button, Badge } from '../../../components/atoms';
import { Colors, Spacing, Radii, Shadows } from '../../../constants/theme';
import { customerData } from '../../../data';

interface CustomerProfileViewProps {
  onLogout?: () => void;
  onToggleRole?: () => void;
  currentRole?: string;
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
 * - Header: "Profile" title with right Settings gear icon
 * - User card: Emerald circular avatar with initial letter "D", Name ("Devarth"), Phone, and "Edit >" button
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
}) => {
  const [userName, setUserName] = useState<string>('Devarth');
  const [userPhone, setUserPhone] = useState<string>('+91 98765 43210');
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [editNameInput, setEditNameInput] = useState<string>(userName);
  const [editPhoneInput, setEditPhoneInput] = useState<string>(userPhone);

  // Preference switches
  const [preferencesModalVisible, setPreferencesModalVisible] = useState<boolean>(false);
  const [quietRide, setQuietRide] = useState<boolean>(true);
  const [acPreferred, setAcPreferred] = useState<boolean>(true);
  const [cashlessOnly, setCashlessOnly] = useState<boolean>(false);

  // Addresses modal
  const [addressesModalVisible, setAddressesModalVisible] = useState<boolean>(false);

  const initialLetter = (userName.trim().charAt(0) || 'D').toUpperCase();

  const handleSaveProfile = () => {
    if (editNameInput.trim()) {
      setUserName(editNameInput.trim());
    }
    if (editPhoneInput.trim()) {
      setUserPhone(editPhoneInput.trim());
    }
    setEditModalVisible(false);
  };

  const menuItems: MenuItem[] = [
    {
      id: 'payment',
      title: 'Payment Methods',
      iconName: 'card-outline',
      onPress: () => {
        Alert.alert(
          'Payment Methods',
          '• UPI (GPay, PhonePe, Paytm)\n• Credit / Debit Card (Visa, RuPay, MC)\n• KeralaGo Wallet (₹0.00)\n• Cash on Trip End'
        );
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
      onPress: () => {
        Alert.alert(
          'Safety & Support',
          'KeralaGO 24x7 Safety Helpline: 112\n\n• Live trip sharing with family\n• 24x7 In-app emergency SOS\n• Verified drivers with police clearance'
        );
      },
    },
    {
      id: 'invite',
      title: 'Invite Friends',
      iconName: 'people-outline',
      onPress: () => {
        Alert.alert(
          'Invite Friends',
          'Share your referral code "KERALAGO50" to give friends ₹50 off their first ride and earn ₹50 in your wallet!'
        );
      },
    },
    {
      id: 'help',
      title: 'Help & FAQs',
      iconName: 'help-circle-outline',
      onPress: () => {
        Alert.alert(
          'Help & FAQs',
          '1. How do I book a ride?\n2. What is Pink Ride for women?\n3. How do fares work across Kerala?\n4. How to contact my driver?'
        );
      },
    },
    {
      id: 'about',
      title: 'About KeralaGo',
      iconName: 'information-circle-outline',
      onPress: () => {
        Alert.alert(
          'About KeralaGo',
          'KeralaGo v2.4.0 (Build 2026)\n\nDeveloped for seamless commuting across Kerala.\nAccredited with Kerala Motor Vehicles Department (MVD).\n\nMade with ❤️ for God\'s Own Country'
        );
      },
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
            <Typography variant="h3" weight="bold" color="#0F172A">
              {userName}
            </Typography>
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
        {onLogout && (
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => {
              Alert.alert('Log Out', 'Are you sure you want to log out of KeralaGO?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log Out', style: 'destructive', onPress: onLogout },
              ]);
            }}
            activeOpacity={0.7}
          >
            <Icon library="Ionicons" name="log-out-outline" size={19} color="#DC2626" />
            <Typography variant="body2" weight="semiBold" color="#DC2626" style={{ marginLeft: 8 }}>
              Log Out
            </Typography>
          </TouchableOpacity>
        )}
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

      {/* ── Saved Addresses Modal ── */}
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

            {customerData.savedLocations.map((item) => (
              <View key={item.id} style={styles.addressRow}>
                <View style={styles.addressIconWrap}>
                  <Icon library="Ionicons" name="location-sharp" size={18} color="#0F4A2B" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Typography variant="body2" weight="bold" color="#0F172A">
                    {item.label} ({item.title})
                  </Typography>
                  <Typography variant="xs" color="#64748B">
                    {item.subtitle}
                  </Typography>
                </View>
              </View>
            ))}

            <View style={{ marginTop: 16 }}>
              <Button
                label="Done"
                variant="outline"
                size="md"
                fullWidth
                onPress={() => setAddressesModalVisible(false)}
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
});

export default CustomerProfileView;

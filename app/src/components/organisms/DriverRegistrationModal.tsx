import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Typography, Icon, Button, Card } from '../atoms';
import { Colors, Spacing, Radii, Shadows } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';

export interface DriverRegistrationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const KERALA_DISTRICTS = [
  'Ernakulam',
  'Thiruvananthapuram',
  'Kozhikode',
  'Thrissur',
  'Kottayam',
  'Kollam',
  'Palakkad',
  'Malappuram',
  'Kannur',
  'Alappuzha',
  'Idukki',
  'Pathanamthitta',
  'Kasaragod',
  'Wayanad',
];

const VEHICLE_CATEGORIES = [
  {
    code: 'AUTO',
    name: 'Kerala Auto',
    icon: 'rickshaw',
    iconLibrary: 'MaterialCommunityIcons' as const,
    capacity: 3,
    description: '3-seater meter auto • 0% platform commission',
    popularModel: 'Bajaj RE / TVS King',
  },
  {
    code: 'STANDARD',
    name: 'KeralaGO Ride',
    icon: 'car',
    iconLibrary: 'Ionicons' as const,
    capacity: 4,
    description: '4-seater sedan / hatchback • AC preferred',
    popularModel: 'Maruti Dzire / WagonR',
  },
  {
    code: 'BIKE',
    name: 'KeralaGO Bike',
    icon: 'bicycle',
    iconLibrary: 'Ionicons' as const,
    capacity: 1,
    description: 'Single passenger swift urban transit',
    popularModel: 'Hero Splendor / Honda Activa',
  },
  {
    code: 'PINK',
    name: 'Pink Ride',
    icon: 'shield-checkmark',
    iconLibrary: 'Ionicons' as const,
    capacity: 4,
    description: 'Exclusive for verified women drivers',
    popularModel: 'Hyundai Aura / Tata Tiago',
  },
];

const KERALA_BANKS = [
  'State Bank of India (SBI)',
  'Federal Bank',
  'HDFC Bank',
  'Canara Bank',
  'South Indian Bank',
  'Kerala Gramin Bank',
];

export const DriverRegistrationModal: React.FC<DriverRegistrationModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { user, registerDriver } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Form State
  const [district, setDistrict] = useState<string>('Ernakulam');
  const [licenseNumber, setLicenseNumber] = useState<string>('KL-07-2022-0045892');
  const [experienceYears, setExperienceYears] = useState<number>(3);

  const [categoryCode, setCategoryCode] = useState<string>('AUTO');
  const [regNumber, setRegNumber] = useState<string>('KL 07 CA 4589');
  const [make, setMake] = useState<string>('Bajaj');
  const [model, setModel] = useState<string>('RE Auto Compact');
  const [manufactureYear, setManufactureYear] = useState<string>('2023');
  const [color, setColor] = useState<string>('Traditional Yellow & Green');
  const [capacity, setCapacity] = useState<number>(3);

  const [bankName, setBankName] = useState<string>('State Bank of India (SBI)');
  const [bankAccountHolder, setBankAccountHolder] = useState<string>(user?.name || 'Driver Partner');
  const [bankAccountNumber, setBankAccountNumber] = useState<string>('39820194821');
  const [bankIfsc, setBankIfsc] = useState<string>('SBIN0001234');

  const selectedCategory = VEHICLE_CATEGORIES.find((c) => c.code === categoryCode) || VEHICLE_CATEGORIES[0];

  const handleCategorySelect = (cat: typeof VEHICLE_CATEGORIES[0]) => {
    setCategoryCode(cat.code);
    setCapacity(cat.capacity);
    if (cat.code === 'AUTO') {
      setMake('Bajaj');
      setModel('RE Auto Compact');
      setColor('Traditional Yellow & Green');
    } else if (cat.code === 'BIKE') {
      setMake('Hero');
      setModel('Splendor Plus');
      setColor('Black & Red');
    } else {
      setMake('Maruti Suzuki');
      setModel('Dzire Tour');
      setColor('White');
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!licenseNumber.trim()) {
        Alert.alert('Required', 'Please enter your driving license number.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!regNumber.trim()) {
        Alert.alert('Required', 'Please enter your vehicle registration number.');
        return;
      }
      if (!make.trim() || !model.trim()) {
        Alert.alert('Required', 'Please enter the vehicle make and model.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      if (!bankAccountNumber.trim() || !bankIfsc.trim()) {
        Alert.alert('Required', 'Please enter your bank account number and IFSC code.');
        return;
      }
      setStep(5);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onClose();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await registerDriver({
        license_number: licenseNumber.trim(),
        district,
        experience_years: experienceYears,
        vehicle_category_code: categoryCode,
        registration_number: regNumber.trim().toUpperCase(),
        make: make.trim(),
        model: model.trim(),
        manufacture_year: parseInt(manufactureYear, 10) || 2023,
        color: color.trim(),
        capacity,
        bank_name: bankName,
        bank_account_holder_name: bankAccountHolder.trim(),
        bank_account_number: bankAccountNumber.trim(),
        bank_ifsc: bankIfsc.trim().toUpperCase(),
      });

      if (res.success) {
        setIsCompleted(true);
        if (onSuccess) onSuccess();
      } else {
        Alert.alert('Registration Failed', res.message || 'Could not complete registration. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProgressHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity onPress={handleBack} style={styles.closeBtn} activeOpacity={0.7}>
          <Icon library="Ionicons" name={step === 1 ? 'close' : 'arrow-back'} size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Typography variant="body1" weight="bold" color="#0F172A">
            {isCompleted ? 'Partner Activated' : 'Become a Driver Partner'}
          </Typography>
          <Typography variant="xs" color="#64748B">
            {isCompleted ? 'Instant Platform Onboarding' : `Step ${step} of 5 • Uber-style Instant Setup`}
          </Typography>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {!isCompleted && (
        <View style={styles.progressTrack}>
          {[1, 2, 3, 4, 5].map((s) => (
            <View
              key={s}
              style={[
                styles.progressBarSegment,
                s <= step ? styles.progressBarActive : styles.progressBarInactive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {renderProgressHeader()}

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ═══════════════════════════════════════════════════════════════════════
              SUCCESS CELEBRATION SCREEN
             ═══════════════════════════════════════════════════════════════════════ */}
          {isCompleted ? (
            <View style={styles.successContainer}>
              <View style={styles.successIconBadge}>
                <Icon library="Ionicons" name="checkmark-circle" size={68} color={Colors.primary} />
              </View>

              <Typography variant="h2" weight="bold" color="#0F172A" align="center" style={{ marginTop: 20 }}>
                Welcome to KeralaGO!
              </Typography>
              <Typography variant="body1" color="#475569" align="center" style={{ marginTop: 8, paddingHorizontal: 20 }}>
                Your driver partner profile and {selectedCategory.name} ({regNumber}) have been verified and activated in the database.
              </Typography>

              <Card style={styles.successCard}>
                <View style={styles.successCardRow}>
                  <Typography variant="xs" color="#64748B">Partner Name</Typography>
                  <Typography variant="body2" weight="bold" color="#0F172A">{user?.name || 'Driver Partner'}</Typography>
                </View>
                <View style={styles.successCardRow}>
                  <Typography variant="xs" color="#64748B">Vehicle Plate</Typography>
                  <Typography variant="body2" weight="bold" color="#0F4A2B">{regNumber}</Typography>
                </View>
                <View style={styles.successCardRow}>
                  <Typography variant="xs" color="#64748B">Service Category</Typography>
                  <Typography variant="body2" weight="bold" color="#0F172A">{selectedCategory.name}</Typography>
                </View>
                <View style={[styles.successCardRow, { borderBottomWidth: 0 }]}>
                  <Typography variant="xs" color="#64748B">Payout Account</Typography>
                  <Typography variant="body2" weight="bold" color="#0F172A">{bankName.split('(')[0]}</Typography>
                </View>
              </Card>

              <TouchableOpacity
                style={styles.launchConsoleBtn}
                onPress={() => {
                  onClose();
                }}
                activeOpacity={0.85}
              >
                <Typography variant="body1" weight="bold" color="#FFFFFF">
                  Launch Driver Console 🚀
                </Typography>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* ═══════════════════════════════════════════════════════════════════════
                  STEP 1: DRIVER PROFILE & LICENSE
                 ═══════════════════════════════════════════════════════════════════════ */}
              {step === 1 && (
                <View style={styles.stepContainer}>
                  <View style={styles.stepBanner}>
                    <Icon library="MaterialCommunityIcons" name="card-account-details-outline" size={26} color="#0F4A2B" />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Typography variant="body1" weight="bold" color="#0F4A2B">
                        Driver & License Profile
                      </Typography>
                      <Typography variant="xs" color="#2D5A3F">
                        Provide official Kerala MVD registered details
                      </Typography>
                    </View>
                  </View>

                  <Typography variant="xs" weight="bold" color="#64748B" style={styles.fieldLabel}>
                    FULL NAME (AS PER LICENSE)
                  </Typography>
                  <TextInput
                    style={[styles.input, { backgroundColor: '#F8FAFC' }]}
                    value={user?.name || ''}
                    editable={false}
                    placeholder="Full Name"
                  />

                  <Typography variant="xs" weight="bold" color="#64748B" style={styles.fieldLabel}>
                    MOBILE NUMBER
                  </Typography>
                  <TextInput
                    style={[styles.input, { backgroundColor: '#F8FAFC' }]}
                    value={user?.phone || ''}
                    editable={false}
                    placeholder="Mobile Number"
                  />

                  <Typography variant="xs" weight="bold" color="#64748B" style={styles.fieldLabel}>
                    DRIVING LICENSE NUMBER *
                  </Typography>
                  <TextInput
                    style={styles.input}
                    value={licenseNumber}
                    onChangeText={setLicenseNumber}
                    placeholder="e.g. KL-07-2022-0045892"
                    autoCapitalize="characters"
                  />

                  <Typography variant="xs" weight="bold" color="#64748B" style={styles.fieldLabel}>
                    OPERATING KERALA DISTRICT *
                  </Typography>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
                    {KERALA_DISTRICTS.map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[
                          styles.pill,
                          district === d ? styles.pillActive : styles.pillInactive,
                        ]}
                        onPress={() => setDistrict(d)}
                        activeOpacity={0.7}
                      >
                        <Typography
                          variant="xs"
                          weight="bold"
                          color={district === d ? '#FFFFFF' : '#475569'}
                        >
                          {d}
                        </Typography>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Typography variant="xs" weight="bold" color="#64748B" style={styles.fieldLabel}>
                    YEARS OF DRIVING EXPERIENCE
                  </Typography>
                  <View style={styles.expRow}>
                    {[1, 2, 3, 5, 8].map((yr) => (
                      <TouchableOpacity
                        key={yr}
                        style={[
                          styles.expBtn,
                          experienceYears === yr ? styles.expBtnActive : styles.expBtnInactive,
                        ]}
                        onPress={() => setExperienceYears(yr)}
                      >
                        <Typography
                          variant="xs"
                          weight="bold"
                          color={experienceYears === yr ? '#FFFFFF' : '#475569'}
                        >
                          {yr}+ yrs
                        </Typography>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* ═══════════════════════════════════════════════════════════════════════
                  STEP 2: VEHICLE DETAILS & CATEGORY
                 ═══════════════════════════════════════════════════════════════════════ */}
              {step === 2 && (
                <View style={styles.stepContainer}>
                  <View style={styles.stepBanner}>
                    <Icon library="Ionicons" name="car-sport-outline" size={26} color="#0F4A2B" />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Typography variant="body1" weight="bold" color="#0F4A2B">
                        Select Vehicle Category
                      </Typography>
                      <Typography variant="xs" color="#2D5A3F">
                        Choose the transit service you intend to operate
                      </Typography>
                    </View>
                  </View>

                  <View style={styles.catGrid}>
                    {VEHICLE_CATEGORIES.map((cat) => {
                      const isSelected = categoryCode === cat.code;
                      return (
                        <TouchableOpacity
                          key={cat.code}
                          style={[
                            styles.catCard,
                            isSelected ? styles.catCardActive : styles.catCardInactive,
                          ]}
                          onPress={() => handleCategorySelect(cat)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.catCardTop}>
                            <View style={[styles.catIconWrap, isSelected && { backgroundColor: '#0F4A2B' }]}>
                              <Icon
                                library={cat.iconLibrary}
                                name={cat.icon}
                                size={22}
                                color={isSelected ? '#FFFFFF' : '#0F4A2B'}
                              />
                            </View>
                            <View style={styles.capacityBadge}>
                              <Icon library="Ionicons" name="people" size={12} color="#0F4A2B" />
                              <Typography variant="xs" weight="bold" color="#0F4A2B" style={{ marginLeft: 3 }}>
                                {cat.capacity}
                              </Typography>
                            </View>
                          </View>

                          <Typography variant="body2" weight="bold" color="#0F172A" style={{ marginTop: 8 }}>
                            {cat.name}
                          </Typography>
                          <Typography variant="xs" color="#64748B" style={{ marginTop: 2 }}>
                            {cat.description}
                          </Typography>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Typography variant="xs" weight="bold" color="#64748B" style={styles.fieldLabel}>
                    REGISTRATION NUMBER (NUMBER PLATE) *
                  </Typography>
                  <TextInput
                    style={styles.input}
                    value={regNumber}
                    onChangeText={setRegNumber}
                    placeholder="e.g. KL 07 CA 4589"
                    autoCapitalize="characters"
                  />

                  <View style={styles.formRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Typography variant="xs" weight="bold" color="#64748B" style={styles.fieldLabel}>
                        MAKE (MANUFACTURER) *
                      </Typography>
                      <TextInput
                        style={styles.input}
                        value={make}
                        onChangeText={setMake}
                        placeholder="e.g. Bajaj, Maruti"
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Typography variant="xs" weight="bold" color="#64748B" style={styles.fieldLabel}>
                        MODEL *
                      </Typography>
                      <TextInput
                        style={styles.input}
                        value={model}
                        onChangeText={setModel}
                        placeholder="e.g. RE Compact, Dzire"
                      />
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Typography variant="xs" weight="bold" color="#64748B" style={styles.fieldLabel}>
                        YEAR
                      </Typography>
                      <TextInput
                        style={styles.input}
                        value={manufactureYear}
                        onChangeText={setManufactureYear}
                        placeholder="2023"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Typography variant="xs" weight="bold" color="#64748B" style={styles.fieldLabel}>
                        COLOR
                      </Typography>
                      <TextInput
                        style={styles.input}
                        value={color}
                        onChangeText={setColor}
                        placeholder="Yellow & Green"
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* ═══════════════════════════════════════════════════════════════════════
                  STEP 3: DOCUMENT VERIFICATION PREVIEW
                 ═══════════════════════════════════════════════════════════════════════ */}
              {step === 3 && (
                <View style={styles.stepContainer}>
                  <View style={styles.stepBanner}>
                    <Icon library="Ionicons" name="shield-checkmark-outline" size={26} color="#0F4A2B" />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Typography variant="body1" weight="bold" color="#0F4A2B">
                        Digital Document Verification
                      </Typography>
                      <Typography variant="xs" color="#2D5A3F">
                        Pre-verified against Kerala Motor Vehicles Department (MVD)
                      </Typography>
                    </View>
                  </View>

                  {[
                    {
                      title: 'Driving License',
                      subtitle: `License No: ${licenseNumber}`,
                      status: 'VERIFIED',
                      icon: 'id-card-outline',
                    },
                    {
                      title: 'Registration Certificate (RC)',
                      subtitle: `Plate: ${regNumber} • ${make} ${model}`,
                      status: 'VERIFIED',
                      icon: 'document-text-outline',
                    },
                    {
                      title: 'Commercial Insurance Policy',
                      subtitle: 'Valid until Nov 2027 • National Insurance',
                      status: 'ACTIVE',
                      icon: 'shield-outline',
                    },
                    {
                      title: 'State Pollution (PUC)',
                      subtitle: 'Valid until Apr 2027 • Green Certified',
                      status: 'ACTIVE',
                      icon: 'leaf-outline',
                    },
                  ].map((doc, idx) => (
                    <View key={idx} style={styles.docCard}>
                      <View style={styles.docLeft}>
                        <View style={styles.docIconWrap}>
                          <Icon library="Ionicons" name={doc.icon} size={20} color="#0F4A2B" />
                        </View>
                        <View style={{ marginLeft: 12 }}>
                          <Typography variant="body2" weight="bold" color="#0F172A">
                            {doc.title}
                          </Typography>
                          <Typography variant="xs" color="#64748B">
                            {doc.subtitle}
                          </Typography>
                        </View>
                      </View>
                      <View style={styles.verifiedBadge}>
                        <Icon library="Ionicons" name="checkmark-circle" size={14} color="#059669" />
                        <Typography variant="xs" weight="bold" color="#059669" style={{ marginLeft: 4 }}>
                          {doc.status}
                        </Typography>
                      </View>
                    </View>
                  ))}

                  <View style={styles.fastTrackNotice}>
                    <Icon library="Ionicons" name="flash" size={16} color="#F59E0B" />
                    <Typography variant="xs" color="#78350F" style={{ marginLeft: 8, flex: 1 }}>
                      Fast-Track Partner Activation enabled. Your documents are verified instantly for testing and live dispatch.
                    </Typography>
                  </View>
                </View>
              )}

              {/* ═══════════════════════════════════════════════════════════════════════
                  STEP 4: BANK ACCOUNT FOR PAYOUTS
                 ═══════════════════════════════════════════════════════════════════════ */}
              {step === 4 && (
                <View style={styles.stepContainer}>
                  <View style={styles.stepBanner}>
                    <Icon library="Ionicons" name="wallet-outline" size={26} color="#0F4A2B" />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Typography variant="body1" weight="bold" color="#0F4A2B">
                        Daily Payout Bank Details
                      </Typography>
                      <Typography variant="xs" color="#2D5A3F">
                        Earned trip fares are disbursed directly every night
                      </Typography>
                    </View>
                  </View>

                  <Typography variant="xs" weight="bold" color="#64748B" style={styles.fieldLabel}>
                    SELECT BANK *
                  </Typography>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
                    {KERALA_BANKS.map((b) => (
                      <TouchableOpacity
                        key={b}
                        style={[
                          styles.pill,
                          bankName === b ? styles.pillActive : styles.pillInactive,
                        ]}
                        onPress={() => setBankName(b)}
                        activeOpacity={0.7}
                      >
                        <Typography
                          variant="xs"
                          weight="bold"
                          color={bankName === b ? '#FFFFFF' : '#475569'}
                        >
                          {b}
                        </Typography>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Typography variant="xs" weight="bold" color="#64748B" style={styles.fieldLabel}>
                    ACCOUNT HOLDER NAME *
                  </Typography>
                  <TextInput
                    style={styles.input}
                    value={bankAccountHolder}
                    onChangeText={setBankAccountHolder}
                    placeholder="Account Holder Name"
                  />

                  <Typography variant="xs" weight="bold" color="#64748B" style={styles.fieldLabel}>
                    BANK ACCOUNT NUMBER *
                  </Typography>
                  <TextInput
                    style={styles.input}
                    value={bankAccountNumber}
                    onChangeText={setBankAccountNumber}
                    placeholder="Account Number"
                    keyboardType="numeric"
                  />

                  <Typography variant="xs" weight="bold" color="#64748B" style={styles.fieldLabel}>
                    IFSC CODE *
                  </Typography>
                  <TextInput
                    style={styles.input}
                    value={bankIfsc}
                    onChangeText={setBankIfsc}
                    placeholder="e.g. SBIN0001234"
                    autoCapitalize="characters"
                  />
                </View>
              )}

              {/* ═══════════════════════════════════════════════════════════════════════
                  STEP 5: REVIEW & ACTIVATE
                 ═══════════════════════════════════════════════════════════════════════ */}
              {step === 5 && (
                <View style={styles.stepContainer}>
                  <View style={styles.stepBanner}>
                    <Icon library="Ionicons" name="ribbon-outline" size={26} color="#0F4A2B" />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Typography variant="body1" weight="bold" color="#0F4A2B">
                        Review Partner Application
                      </Typography>
                      <Typography variant="xs" color="#2D5A3F">
                        One-click partner onboarding and vehicle link
                      </Typography>
                    </View>
                  </View>

                  <Card style={styles.reviewCard}>
                    <Typography variant="body2" weight="bold" color="#0F172A" style={{ marginBottom: 12 }}>
                      Summary of Registration
                    </Typography>

                    <View style={styles.reviewRow}>
                      <Typography variant="xs" color="#64748B">Driver</Typography>
                      <Typography variant="xs" weight="bold" color="#0F172A">{user?.name} ({user?.phone})</Typography>
                    </View>

                    <View style={styles.reviewRow}>
                      <Typography variant="xs" color="#64748B">District</Typography>
                      <Typography variant="xs" weight="bold" color="#0F172A">{district}</Typography>
                    </View>

                    <View style={styles.reviewRow}>
                      <Typography variant="xs" color="#64748B">Driving License</Typography>
                      <Typography variant="xs" weight="bold" color="#0F172A">{licenseNumber}</Typography>
                    </View>

                    <View style={styles.reviewRow}>
                      <Typography variant="xs" color="#64748B">Vehicle</Typography>
                      <Typography variant="xs" weight="bold" color="#0F4A2B">{make} {model} ({regNumber})</Typography>
                    </View>

                    <View style={styles.reviewRow}>
                      <Typography variant="xs" color="#64748B">Category</Typography>
                      <Typography variant="xs" weight="bold" color="#0F172A">{selectedCategory.name}</Typography>
                    </View>

                    <View style={[styles.reviewRow, { borderBottomWidth: 0 }]}>
                      <Typography variant="xs" color="#64748B">Payout Bank</Typography>
                      <Typography variant="xs" weight="bold" color="#0F172A">{bankName.split('(')[0]} •••• {bankAccountNumber.slice(-4)}</Typography>
                    </View>
                  </Card>

                  <View style={styles.agreementNotice}>
                    <Icon library="Ionicons" name="information-circle-outline" size={18} color="#0F4A2B" />
                    <Typography variant="xs" color="#2D5A3F" style={{ marginLeft: 8, flex: 1, lineHeight: 18 }}>
                      By tapping Activate, you agree to the KeralaGO Driver Partner terms, zero surge fare regulations, and customer safety commitments.
                    </Typography>
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* ── Persistent Bottom Action Buttons ── */}
        {!isCompleted && (
          <View style={styles.bottomBar}>
            {step > 1 && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                <Typography variant="body2" weight="bold" color="#475569">
                  Back
                </Typography>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                step === 1 && { flex: 1 },
                isSubmitting && { opacity: 0.8 },
              ]}
              onPress={step === 5 ? handleSubmit : handleNext}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Typography variant="body2" weight="bold" color="#FFFFFF">
                  {step === 5 ? 'Activate Driver Account 🚖' : 'Continue →'}
                </Typography>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  progressTrack: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
  },
  progressBarSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressBarActive: {
    backgroundColor: '#0F4A2B',
  },
  progressBarInactive: {
    backgroundColor: '#E2E8F0',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  stepContainer: {
    flex: 1,
  },
  stepBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  fieldLabel: {
    marginTop: 14,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  pillsScroll: {
    marginTop: 4,
    marginBottom: 6,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  pillActive: {
    backgroundColor: '#0F4A2B',
    borderColor: '#0F4A2B',
  },
  pillInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  expRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  expBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  expBtnActive: {
    backgroundColor: '#0F4A2B',
    borderColor: '#0F4A2B',
  },
  expBtnInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  catGrid: {
    gap: 12,
    marginBottom: 10,
  },
  catCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  catCardActive: {
    borderColor: '#0F4A2B',
    backgroundColor: '#F0FDF4',
  },
  catCardInactive: {
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  catCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  formRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  docLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  docIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  fastTrackNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  reviewCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  agreementNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 10,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  backButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    flex: 2,
    backgroundColor: '#0F4A2B',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIconBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCard: {
    width: '100%',
    padding: 16,
    marginTop: 24,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  successCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  launchConsoleBtn: {
    width: '100%',
    backgroundColor: '#0F4A2B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
});

export default DriverRegistrationModal;


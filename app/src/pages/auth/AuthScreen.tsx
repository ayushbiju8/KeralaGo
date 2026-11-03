import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { Typography, Button, Badge, Icon, Card } from '../../components/atoms';
import { Colors, Spacing, Radii, Shadows } from '../../constants/theme';
import { UserRole } from '../../types/user';
import { initMsg91Widget } from '../../services/msg91Widget';

type AuthTab = 'LOGIN' | 'REGISTER';
type Channel = 'MOBILE' | 'EMAIL';

interface PresetAccount {
  label: string;
  identifier: string;
  channel: Channel;
  role: UserRole;
  desc: string;
}

const PRESET_ACCOUNTS: PresetAccount[] = [
  { label: 'Arun Kumar', identifier: '9847012345', channel: 'MOBILE', role: 'USER', desc: 'Customer' },
  { label: 'Suresh Pillai', identifier: '9447198765', channel: 'MOBILE', role: 'DRIVER', desc: 'Driver' },
  { label: 'Admin Ops', identifier: '9999900000', channel: 'MOBILE', role: 'ADMIN', desc: 'Superuser' },
  { label: 'Verified Gmail', identifier: 'couplespaceofficial@gmail.com', channel: 'EMAIL', role: 'USER', desc: 'Gmail SMTP' },
];

const AuthScreen: React.FC = () => {
  const { loginWithCredentials, sendOtp, isLoading } = useAuth();

  // Tab: LOGIN vs REGISTER
  const [activeTab, setActiveTab] = useState<AuthTab>('LOGIN');
  const [step, setStep] = useState<'INPUT' | 'OTP'>('INPUT');
  const [channel, setChannel] = useState<Channel>('MOBILE');

  // Form Fields
  const [fullName, setFullName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [emailAddress, setEmailAddress] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('USER');

  // Verification state
  const [otpCode, setOtpCode] = useState<string>('');
  const [requestId, setRequestId] = useState<string>('');
  const [demoHint, setDemoHint] = useState<string>('');
  const [infoMessage, setInfoMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [resendTimer, setResendTimer] = useState<number>(30);

  useEffect(() => {
    initMsg91Widget();
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (step === 'OTP' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendTimer]);

  const switchTab = (tab: AuthTab) => {
    setActiveTab(tab);
    setErrorMessage('');
    setInfoMessage('');
    setStep('INPUT');
    setOtpCode('');
    setRequestId('');
  };

  const handleSendOtp = async () => {
    setErrorMessage('');
    setInfoMessage('');

    if (activeTab === 'REGISTER' && !fullName.trim()) {
      setErrorMessage('Please enter your Full Name to register.');
      return;
    }

    if (channel === 'MOBILE') {
      const cleanPhone = phoneNumber.trim().replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        setErrorMessage('Please enter a valid 10-digit mobile number.');
        return;
      }

      try {
        const res = await sendOtp({
          mode: activeTab,
          mobileNumber: cleanPhone,
          role: selectedRole,
          fullName: activeTab === 'REGISTER' ? fullName.trim() : undefined,
        });

        if (res && res.success) {
          if (res.request_id) {
            setRequestId(res.request_id);
          }
          setInfoMessage(res.message || `Code sent to +91 ${cleanPhone}`);
          setDemoHint(res.dev_otp || '');
          setOtpCode(''); // Clean input, wait for user entry
          setStep('OTP');
          setResendTimer(30);
        } else {
          setErrorMessage(res?.message || 'Failed to dispatch verification code.');
        }
      } catch (err: any) {
        // Display real error without fallback
        setErrorMessage(err.message || 'Error communicating with authentication server.');
      }
    } else {
      const cleanEmail = emailAddress.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
        setErrorMessage('Please enter a valid email address.');
        return;
      }

      try {
        const res = await sendOtp({
          mode: activeTab,
          email: cleanEmail,
          role: selectedRole,
          fullName: activeTab === 'REGISTER' ? fullName.trim() : undefined,
        });

        if (res && res.success) {
          setInfoMessage(res.message || `Verification code sent to ${cleanEmail}`);
          setDemoHint(res.dev_otp || '');
          setOtpCode(''); // Clean input, wait for user entry
          setStep('OTP');
          setResendTimer(30);
        } else {
          setErrorMessage(res?.message || 'Failed to dispatch verification email.');
        }
      } catch (err: any) {
        // Display real error without fallback
        setErrorMessage(err.message || 'Error communicating with authentication server.');
      }
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMessage('');
    if (!otpCode || otpCode.trim().length === 0) {
      setErrorMessage('Please enter the 4-digit verification code.');
      return;
    }

    try {
      const params =
        channel === 'MOBILE'
          ? {
              mode: activeTab,
              mobileNumber: phoneNumber.trim(),
              otp: otpCode.trim(),
              requestId: requestId || undefined,
              role: selectedRole,
              fullName: activeTab === 'REGISTER' ? fullName.trim() : undefined,
            }
          : {
              mode: activeTab,
              email: emailAddress.trim().toLowerCase(),
              otp: otpCode.trim(),
              role: selectedRole,
              fullName: activeTab === 'REGISTER' ? fullName.trim() : undefined,
            };

      const res = await loginWithCredentials(params);
      if (!res.success) {
        setErrorMessage(res.message || 'Invalid verification code. Please check and try again.');
      }
    } catch (err: any) {
      // Display real error without fallback
      setErrorMessage(err.message || 'Verification failed. Please check the code.');
    }
  };

  const handleSelectPreset = (preset: PresetAccount) => {
    setChannel(preset.channel);
    setSelectedRole(preset.role);
    if (preset.channel === 'MOBILE') {
      setPhoneNumber(preset.identifier);
    } else {
      setEmailAddress(preset.identifier);
    }
    setErrorMessage('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inner}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Brand Header */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <Icon library="Ionicons" name="navigate" size={32} color={Colors.white} />
            </View>
            <Typography variant="h1" weight="bold" color={Colors.primary} align="center">
              KeralaGO
            </Typography>
            <Typography variant="body1" color={Colors.textSecondary} align="center">
              God's Own Ride-Hailing Platform
            </Typography>
          </View>

          {/* Form Card */}
          <Card shadow="md" style={styles.card}>
            {/* Top Switcher: Login vs Register */}
            {step === 'INPUT' && (
              <View style={styles.authTabSwitcher}>
                <TouchableOpacity
                  style={[styles.authTab, activeTab === 'LOGIN' && styles.authTabActive]}
                  onPress={() => switchTab('LOGIN')}
                  activeOpacity={0.8}
                >
                  <Icon
                    library="Ionicons"
                    name="log-in-outline"
                    size="sm"
                    color={activeTab === 'LOGIN' ? Colors.white : Colors.textSecondary}
                  />
                  <Typography
                    variant="body2"
                    weight="bold"
                    color={activeTab === 'LOGIN' ? Colors.white : Colors.textSecondary}
                  >
                    Login
                  </Typography>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.authTab, activeTab === 'REGISTER' && styles.authTabActive]}
                  onPress={() => switchTab('REGISTER')}
                  activeOpacity={0.8}
                >
                  <Icon
                    library="Ionicons"
                    name="person-add-outline"
                    size="sm"
                    color={activeTab === 'REGISTER' ? Colors.white : Colors.textSecondary}
                  />
                  <Typography
                    variant="body2"
                    weight="bold"
                    color={activeTab === 'REGISTER' ? Colors.white : Colors.textSecondary}
                  >
                    Register
                  </Typography>
                </TouchableOpacity>
              </View>
            )}

            {/* Error Banner */}
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Icon library="Ionicons" name="alert-circle" size={20} color={Colors.danger} />
                <Typography variant="caption" color={Colors.danger} style={{ marginLeft: Spacing.xs, flex: 1, lineHeight: 18 }}>
                  {errorMessage}
                </Typography>
              </View>
            ) : null}

            {/* Info Banner */}
            {infoMessage && step === 'OTP' ? (
              <View style={styles.infoBanner}>
                <Icon library="Ionicons" name="checkmark-circle" size={18} color={Colors.primary} />
                <Typography variant="caption" color={Colors.primary} style={{ marginLeft: Spacing.xs, flex: 1 }}>
                  {infoMessage}
                </Typography>
              </View>
            ) : null}

            {step === 'INPUT' ? (
              <>
                <Typography variant="h4" weight="bold" color={Colors.textPrimary} style={{ marginTop: Spacing.sm }}>
                  {activeTab === 'LOGIN' ? 'Login to KeralaGO' : 'Register New Account'}
                </Typography>
                <Typography variant="caption" color={Colors.textMuted} style={{ marginBottom: Spacing.md }}>
                  {activeTab === 'LOGIN'
                    ? 'Enter your registered mobile number or email to login'
                    : 'Create your account with your full name and mobile/email'}
                </Typography>

                {/* Registration: Full Name */}
                {activeTab === 'REGISTER' && (
                  <>
                    <Typography variant="label" weight="semiBold" color={Colors.textSecondary} style={{ marginBottom: Spacing.xs }}>
                      Full Name *
                    </Typography>
                    <View style={styles.inputRow}>
                      <View style={styles.inputPrefix}>
                        <Icon library="Ionicons" name="person" size={18} color={Colors.primary} />
                      </View>
                      <TextInput
                        style={styles.textInput}
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="e.g. Ayush Biju"
                        placeholderTextColor={Colors.textMuted}
                        autoCapitalize="words"
                      />
                    </View>
                  </>
                )}

                {/* Channel Selector: Mobile vs Email */}
                <Typography variant="label" weight="semiBold" color={Colors.textSecondary} style={{ marginTop: Spacing.sm, marginBottom: Spacing.xs }}>
                  Verify With:
                </Typography>
                <View style={styles.channelRow}>
                  <TouchableOpacity
                    style={[styles.channelBtn, channel === 'MOBILE' && styles.channelBtnActive]}
                    onPress={() => {
                      setChannel('MOBILE');
                      setErrorMessage('');
                    }}
                  >
                    <Icon
                      library="Ionicons"
                      name="phone-portrait-outline"
                      size="sm"
                      color={channel === 'MOBILE' ? Colors.white : Colors.textSecondary}
                    />
                    <Typography
                      variant="caption"
                      weight="semiBold"
                      color={channel === 'MOBILE' ? Colors.white : Colors.textSecondary}
                    >
                      Mobile (MSG91)
                    </Typography>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.channelBtn, channel === 'EMAIL' && styles.channelBtnActive]}
                    onPress={() => {
                      setChannel('EMAIL');
                      setErrorMessage('');
                    }}
                  >
                    <Icon
                      library="Ionicons"
                      name="mail-outline"
                      size="sm"
                      color={channel === 'EMAIL' ? Colors.white : Colors.textSecondary}
                    />
                    <Typography
                      variant="caption"
                      weight="semiBold"
                      color={channel === 'EMAIL' ? Colors.white : Colors.textSecondary}
                    >
                      Email (Gmail)
                    </Typography>
                  </TouchableOpacity>
                </View>

                {/* Mobile Input */}
                {channel === 'MOBILE' ? (
                  <>
                    <Typography variant="label" weight="semiBold" color={Colors.textSecondary} style={{ marginTop: Spacing.sm, marginBottom: Spacing.xs }}>
                      Mobile Number *
                    </Typography>
                    <View style={styles.inputRow}>
                      <View style={styles.inputPrefix}>
                        <Typography variant="body1" weight="semiBold" color={Colors.textPrimary}>
                          🇮🇳 +91
                        </Typography>
                      </View>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="phone-pad"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        placeholder="10-digit mobile number"
                        placeholderTextColor={Colors.textMuted}
                        maxLength={10}
                      />
                    </View>
                  </>
                ) : (
                  <>
                    <Typography variant="label" weight="semiBold" color={Colors.textSecondary} style={{ marginTop: Spacing.sm, marginBottom: Spacing.xs }}>
                      Email Address *
                    </Typography>
                    <View style={styles.inputRow}>
                      <View style={styles.inputPrefix}>
                        <Icon library="Ionicons" name="mail" size={18} color={Colors.primary} />
                      </View>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={emailAddress}
                        onChangeText={setEmailAddress}
                        placeholder="e.g. name@example.com"
                        placeholderTextColor={Colors.textMuted}
                      />
                    </View>
                  </>
                )}

                {/* Role Selector */}
                <Typography variant="label" weight="semiBold" color={Colors.textSecondary} style={{ marginTop: Spacing.base, marginBottom: Spacing.xs }}>
                  Access Role:
                </Typography>
                <View style={styles.roleTabs}>
                  <TouchableOpacity
                    style={[styles.roleTab, selectedRole === 'USER' && styles.roleTabActive]}
                    onPress={() => setSelectedRole('USER')}
                  >
                    <Icon
                      library="Ionicons"
                      name="person"
                      size="sm"
                      color={selectedRole === 'USER' ? Colors.white : Colors.textSecondary}
                    />
                    <Typography
                      variant="caption"
                      weight="semiBold"
                      color={selectedRole === 'USER' ? Colors.white : Colors.textSecondary}
                    >
                      Customer
                    </Typography>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.roleTab, selectedRole === 'DRIVER' && styles.roleTabActive]}
                    onPress={() => setSelectedRole('DRIVER')}
                  >
                    <Icon
                      library="MaterialCommunityIcons"
                      name="steering"
                      size="sm"
                      color={selectedRole === 'DRIVER' ? Colors.white : Colors.textSecondary}
                    />
                    <Typography
                      variant="caption"
                      weight="semiBold"
                      color={selectedRole === 'DRIVER' ? Colors.white : Colors.textSecondary}
                    >
                      Driver Partner
                    </Typography>
                  </TouchableOpacity>

                  {activeTab === 'LOGIN' && (
                    <TouchableOpacity
                      style={[styles.roleTab, selectedRole === 'ADMIN' && styles.roleTabActive]}
                      onPress={() => setSelectedRole('ADMIN')}
                    >
                      <Icon
                        library="Ionicons"
                        name="shield-checkmark"
                        size="sm"
                        color={selectedRole === 'ADMIN' ? Colors.white : Colors.textSecondary}
                      />
                      <Typography
                        variant="caption"
                        weight="semiBold"
                        color={selectedRole === 'ADMIN' ? Colors.white : Colors.textSecondary}
                      >
                        Admin
                      </Typography>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Existing DB Accounts (For quick test in LOGIN mode) */}
                {activeTab === 'LOGIN' && (
                  <>
                    <Typography variant="caption" weight="medium" color={Colors.textMuted} style={{ marginTop: Spacing.base, marginBottom: Spacing.xs }}>
                      Quick-Fill Existing Accounts:
                    </Typography>
                    <View style={styles.chipsRow}>
                      {PRESET_ACCOUNTS.map((acc) => {
                        const isMatch =
                          (acc.channel === 'MOBILE' && phoneNumber === acc.identifier) ||
                          (acc.channel === 'EMAIL' && emailAddress === acc.identifier);
                        return (
                          <TouchableOpacity
                            key={acc.identifier}
                            style={[styles.seedChip, isMatch && styles.seedChipActive]}
                            onPress={() => handleSelectPreset(acc)}
                          >
                            <Typography
                              variant="caption"
                              weight={isMatch ? 'bold' : 'medium'}
                              color={isMatch ? Colors.primary : Colors.textSecondary}
                            >
                              {acc.label} ({acc.desc})
                            </Typography>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                )}

                {/* Submit Button */}
                <Button
                  label={
                    isLoading
                      ? 'Sending Code...'
                      : activeTab === 'LOGIN'
                      ? 'Send Login Code'
                      : 'Register & Send Code'
                  }
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isLoading}
                  onPress={handleSendOtp}
                  style={{ marginTop: Spacing.lg }}
                />

                {/* Tab switch link */}
                <View style={styles.switchLinkContainer}>
                  <Typography variant="body2" color={Colors.textSecondary}>
                    {activeTab === 'LOGIN' ? "Don't have an account? " : 'Already registered? '}
                  </Typography>
                  <TouchableOpacity onPress={() => switchTab(activeTab === 'LOGIN' ? 'REGISTER' : 'LOGIN')}>
                    <Typography variant="body2" weight="bold" color={Colors.primary}>
                      {activeTab === 'LOGIN' ? 'Register here' : 'Login here'}
                    </Typography>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {/* Step 2: Enter OTP */}
                <View style={styles.otpHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Typography variant="h4" weight="bold" color={Colors.textPrimary}>
                      {activeTab === 'LOGIN' ? 'Verify Login' : 'Verify Registration'}
                    </Typography>
                    <Typography variant="caption" color={Colors.textMuted} style={{ marginTop: 2 }}>
                      {channel === 'MOBILE'
                        ? `Code sent to +91 ${phoneNumber}`
                        : `Code sent to ${emailAddress}`}
                    </Typography>
                  </View>
                  <TouchableOpacity onPress={() => setStep('INPUT')} style={styles.editBtn}>
                    <Typography variant="caption" weight="semiBold" color={Colors.primary}>
                      Edit Details
                    </Typography>
                  </TouchableOpacity>
                </View>

                {demoHint ? (
                  <View style={styles.hintContainer}>
                    <Badge variant="neutral" label={`Demo Code: ${demoHint}`} size="sm" />
                  </View>
                ) : null}

                {/* OTP Input - Starts Empty */}
                <TextInput
                  style={styles.otpInput}
                  keyboardType="number-pad"
                  value={otpCode}
                  onChangeText={setOtpCode}
                  placeholder="• • • •"
                  placeholderTextColor={Colors.textMuted}
                  maxLength={6}
                  autoFocus
                />

                {/* Timer & Resend */}
                <View style={styles.resendRow}>
                  {resendTimer > 0 ? (
                    <Typography variant="caption" color={Colors.textMuted}>
                      Resend code in {resendTimer}s
                    </Typography>
                  ) : (
                    <TouchableOpacity onPress={handleSendOtp} disabled={isLoading}>
                      <Typography variant="caption" weight="bold" color={Colors.primary}>
                        Resend Code
                      </Typography>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Submit Button */}
                <Button
                  label={
                    isLoading
                      ? 'Verifying...'
                      : activeTab === 'LOGIN'
                      ? `Sign In as ${selectedRole}`
                      : `Complete Registration`
                  }
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isLoading}
                  onPress={handleVerifyOtp}
                  style={{ marginTop: Spacing.base }}
                />

                <Button
                  label="Back"
                  variant="ghost"
                  size="sm"
                  fullWidth
                  onPress={() => setStep('INPUT')}
                  style={{ marginTop: Spacing.xs }}
                />
              </>
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  inner: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xl,
    justifyContent: 'center',
    flexGrow: 1,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: Radii.xl,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.md,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii['2xl'],
    padding: Spacing.lg,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  authTabSwitcher: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: 4,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  authTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radii.md,
    gap: Spacing.xs,
  },
  authTabActive: {
    backgroundColor: Colors.primary,
    ...Shadows.sm,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: Radii.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  channelRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  channelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  channelBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.lg,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  inputPrefix: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  roleTabs: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  seedChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  seedChipActive: {
    backgroundColor: Colors.mintLight,
    borderColor: Colors.primary,
  },
  switchLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  otpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  editBtn: {
    padding: Spacing.xs,
  },
  hintContainer: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  otpInput: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.md,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 8,
    textAlign: 'center',
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    marginVertical: Spacing.md,
  },
  resendRow: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
});

export default AuthScreen;

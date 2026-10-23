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

interface SeedAccount {
  label: string;
  phone: string;
  role: UserRole;
  desc: string;
}

const SEED_ACCOUNTS: SeedAccount[] = [
  { label: 'Arun Kumar', phone: '9847012345', role: 'USER', desc: 'Passenger / Customer' },
  { label: 'Suresh Pillai', phone: '9447198765', role: 'DRIVER', desc: 'Auto Partner' },
  { label: 'Admin Portal', phone: '9999999999', role: 'ADMIN', desc: 'Ops & Superuser' },
];

const AuthScreen: React.FC = () => {
  const { loginWithCredentials, sendOtp, isLoading } = useAuth();

  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phoneNumber, setPhoneNumber] = useState<string>('9847012345');
  const [selectedRole, setSelectedRole] = useState<UserRole>('USER');
  const [otpCode, setOtpCode] = useState<string>('1234');
  const [devOtp, setDevOtp] = useState<string>('1234');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [resendTimer, setResendTimer] = useState<number>(30);

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

  const handleSendOtp = async () => {
    setErrorMessage('');
    const clean = phoneNumber.trim().replace(/\D/g, '');
    if (clean.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      const res = await sendOtp(clean, selectedRole);
      if (res && res.success) {
        setDevOtp(res.dev_otp || '1234');
        setOtpCode(res.dev_otp || '1234');
        setStep('OTP');
        setResendTimer(30);
      } else {
        setErrorMessage(res.message || 'Could not send verification code.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error communicating with database.');
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMessage('');
    if (!otpCode || otpCode.trim().length === 0) {
      setErrorMessage('Please enter the 4-digit code.');
      return;
    }

    try {
      const res = await loginWithCredentials(
        phoneNumber,
        otpCode.trim(),
        selectedRole
      );
      if (!res.success) {
        setErrorMessage(res.message || 'Invalid code. Use default 1234.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Please try again.');
    }
  };

  const handleSelectSeed = (acc: SeedAccount) => {
    setPhoneNumber(acc.phone);
    setSelectedRole(acc.role);
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
              God's Own Ride-Hailing Experience
            </Typography>
            <Badge
              variant="success"
              label="Connected to PostgreSQL / SQLite DB"
              size="md"
              style={{ marginTop: Spacing.sm }}
            />
          </View>

          {/* Form Card */}
          <Card variant="elevated" style={styles.card}>
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Icon library="Ionicons" name="alert-circle" size={18} color={Colors.danger} />
                <Typography variant="caption" color={Colors.danger} style={{ marginLeft: Spacing.xs, flex: 1 }}>
                  {errorMessage}
                </Typography>
              </View>
            ) : null}

            {step === 'PHONE' ? (
              <>
                <Typography variant="h4" weight="bold" color={Colors.textPrimary}>
                  Sign In to KeralaGO
                </Typography>
                <Typography variant="caption" color={Colors.textMuted} style={{ marginBottom: Spacing.base }}>
                  Verified Mobile & Role-Based Access Control (RBAC)
                </Typography>

                {/* Phone Input */}
                <Typography variant="label" weight="semiBold" color={Colors.textSecondary} style={{ marginBottom: Spacing.xs }}>
                  Mobile Number
                </Typography>
                <View style={styles.phoneInputRow}>
                  <View style={styles.countryCode}>
                    <Typography variant="body1" weight="semiBold" color={Colors.textPrimary}>
                      🇮🇳 +91
                    </Typography>
                  </View>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="10-digit number"
                    placeholderTextColor={Colors.textMuted}
                    maxLength={10}
                  />
                </View>

                {/* RBAC Role Selector */}
                <Typography variant="label" weight="semiBold" color={Colors.textSecondary} style={{ marginTop: Spacing.base, marginBottom: Spacing.xs }}>
                  Select Access Role:
                </Typography>
                <View style={styles.roleTabs}>
                  <TouchableOpacity
                    style={[styles.roleTab, selectedRole === 'USER' && styles.roleTabActive]}
                    onPress={() => setSelectedRole('USER')}
                    activeOpacity={0.8}
                  >
                    <Icon
                      library="Ionicons"
                      name="person"
                      size="sm"
                      color={selectedRole === 'USER' ? Colors.white : Colors.textSecondary}
                    />
                    <Typography
                      variant="body2"
                      weight="semiBold"
                      color={selectedRole === 'USER' ? Colors.white : Colors.textSecondary}
                    >
                      Customer
                    </Typography>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.roleTab, selectedRole === 'DRIVER' && styles.roleTabActive]}
                    onPress={() => setSelectedRole('DRIVER')}
                    activeOpacity={0.8}
                  >
                    <Icon
                      library="MaterialCommunityIcons"
                      name="steering"
                      size="sm"
                      color={selectedRole === 'DRIVER' ? Colors.white : Colors.textSecondary}
                    />
                    <Typography
                      variant="body2"
                      weight="semiBold"
                      color={selectedRole === 'DRIVER' ? Colors.white : Colors.textSecondary}
                    >
                      Driver
                    </Typography>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.roleTab, selectedRole === 'ADMIN' && styles.roleTabActive]}
                    onPress={() => setSelectedRole('ADMIN')}
                    activeOpacity={0.8}
                  >
                    <Icon
                      library="Ionicons"
                      name="shield-checkmark"
                      size="sm"
                      color={selectedRole === 'ADMIN' ? Colors.white : Colors.textSecondary}
                    />
                    <Typography
                      variant="body2"
                      weight="semiBold"
                      color={selectedRole === 'ADMIN' ? Colors.white : Colors.textSecondary}
                    >
                      Admin
                    </Typography>
                  </TouchableOpacity>
                </View>

                {/* Quick-fill Seed Accounts */}
                <Typography variant="caption" weight="medium" color={Colors.textMuted} style={{ marginTop: Spacing.base, marginBottom: Spacing.xs }}>
                  Quick-fill Seed Database Accounts:
                </Typography>
                <View style={styles.chipsRow}>
                  {SEED_ACCOUNTS.map((acc) => {
                    const isSelected = phoneNumber === acc.phone && selectedRole === acc.role;
                    return (
                      <TouchableOpacity
                        key={acc.phone}
                        style={[styles.seedChip, isSelected && styles.seedChipActive]}
                        onPress={() => handleSelectSeed(acc)}
                      >
                        <Typography
                          variant="caption"
                          weight={isSelected ? 'bold' : 'medium'}
                          color={isSelected ? Colors.primary : Colors.textSecondary}
                        >
                          {acc.label} ({acc.role})
                        </Typography>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Submit Button */}
                <Button
                  label={isLoading ? 'Requesting OTP...' : 'Get Verification Code'}
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isLoading}
                  onPress={handleSendOtp}
                  style={{ marginTop: Spacing.lg }}
                />
              </>
            ) : (
              <>
                <View style={styles.otpHeaderRow}>
                  <View>
                    <Typography variant="h4" weight="bold" color={Colors.textPrimary}>
                      Enter 4-Digit Code
                    </Typography>
                    <Typography variant="caption" color={Colors.textMuted}>
                      Sent to +91 {phoneNumber}
                    </Typography>
                  </View>
                  <TouchableOpacity onPress={() => setStep('PHONE')} style={styles.editPhoneBtn}>
                    <Typography variant="caption" weight="semiBold" color={Colors.primary}>
                      Edit Phone
                    </Typography>
                  </TouchableOpacity>
                </View>

                {/* Dev OTP Helper */}
                <View style={styles.devOtpContainer}>
                  <Badge variant="success" label={`Development OTP: ${devOtp}`} size="md" />
                  <Typography variant="caption" color={Colors.textSecondary} style={{ marginTop: Spacing.xs }}>
                    Auto-generated from database OTP challenge.
                  </Typography>
                </View>

                {/* OTP Input */}
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
                    <TouchableOpacity onPress={handleSendOtp}>
                      <Typography variant="caption" weight="bold" color={Colors.primary}>
                        Resend Code
                      </Typography>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Submit Button */}
                <Button
                  label={isLoading ? 'Verifying...' : `Verify & Enter as ${selectedRole}`}
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
                  onPress={() => setStep('PHONE')}
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radii.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.lg,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  countryCode: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
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
  otpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  editPhoneBtn: {
    padding: Spacing.xs,
  },
  devOtpContainer: {
    backgroundColor: Colors.mintLight,
    padding: Spacing.md,
    borderRadius: Radii.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
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

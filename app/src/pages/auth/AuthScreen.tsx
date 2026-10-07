import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { Typography, Button, Badge, Icon } from '../../components/atoms';
import { Colors, Spacing, Radii, Shadows } from '../../constants/theme';

const AuthScreen: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('9847012345');
  const [selectedRole, setSelectedRole] = useState<'USER' | 'DRIVER'>('USER');

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inner}
      >
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
            label="Kochi • Trivandrum • Kozhikode"
            size="md"
            style={{ marginTop: Spacing.sm }}
          />
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Typography variant="h4" weight="bold" color={Colors.textPrimary}>
            Enter Mobile Number
          </Typography>
          <Typography variant="caption" color={Colors.textMuted} style={{ marginBottom: Spacing.base }}>
            We'll send a 4-digit verification code to sign in
          </Typography>

          {/* Input field with +91 flag */}
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

          {/* Role selector buttons before login */}
          <Typography variant="label" weight="semiBold" color={Colors.textSecondary} style={{ marginTop: Spacing.base, marginBottom: Spacing.xs }}>
            Sign In As:
          </Typography>
          <View style={styles.roleTabs}>
            <TouchableOpacity
              style={[
                styles.roleTab,
                selectedRole === 'USER' && styles.roleTabActive,
              ]}
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
                Customer (User)
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleTab,
                selectedRole === 'DRIVER' && styles.roleTabActive,
              ]}
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
                Driver Partner
              </Typography>
            </TouchableOpacity>
          </View>

          {/* Action button */}
          <Button
            label={isLoading ? 'Signing In...' : `Continue as ${selectedRole === 'USER' ? 'Customer' : 'Driver'}`}
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            onPress={() => login(selectedRole)}
            style={{ marginTop: Spacing.lg }}
          />
        </View>
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
    justifyContent: 'center',
    paddingHorizontal: Spacing.base,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: Radii.xl,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
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
    gap: Spacing.sm,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radii.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
});

export default AuthScreen;

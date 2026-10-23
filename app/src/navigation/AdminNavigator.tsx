import React from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { Typography, Button, Badge, Card, Icon } from '../components/atoms';
import { Colors, Spacing, Radii, Shadows } from '../constants/theme';

export default function AdminNavigator() {
  const { user, logout } = useAuth();

  const handleOpenDjangoAdmin = () => {
    Linking.openURL('http://localhost:8000/admin/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Badge variant="warning" label="ADMINISTRATOR PORTAL" size="md" />
          <Typography variant="h2" weight="bold" color={Colors.primary} style={{ marginTop: Spacing.sm }}>
            KeralaGO Admin Console
          </Typography>
          <Typography variant="body2" color={Colors.textSecondary}>
            Operations, Driver KYC & Fleet Governance
          </Typography>
        </View>

        {/* Admin Card */}
        <Card variant="elevated" style={styles.card}>
          <View style={styles.row}>
            <View style={styles.avatarCircle}>
              <Icon library="Ionicons" name="shield-checkmark" size={32} color={Colors.white} />
            </View>
            <View style={{ marginLeft: Spacing.md, flex: 1 }}>
              <Typography variant="h4" weight="bold" color={Colors.textPrimary}>
                {user?.name || 'KeralaGO Admin'}
              </Typography>
              <Typography variant="caption" color={Colors.textMuted}>
                {user?.phone || '+91 99999 99999'}
              </Typography>
              <Badge variant="success" label="Role: Superuser (ADMIN)" size="sm" style={{ marginTop: Spacing.xs, alignSelf: 'flex-start' }} />
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Typography variant="h3" weight="bold" color={Colors.primary}>
                38
              </Typography>
              <Typography variant="caption" color={Colors.textSecondary}>
                DB Tables
              </Typography>
            </View>
            <View style={styles.statBox}>
              <Typography variant="h3" weight="bold" color={Colors.primary}>
                7
              </Typography>
              <Typography variant="caption" color={Colors.textSecondary}>
                Seeded Accounts
              </Typography>
            </View>
            <View style={styles.statBox}>
              <Typography variant="h3" weight="bold" color={Colors.primary}>
                100%
              </Typography>
              <Typography variant="caption" color={Colors.textSecondary}>
                RBAC Enforced
              </Typography>
            </View>
          </View>

          <Button
            label="Open Django Web Admin"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleOpenDjangoAdmin}
            style={{ marginTop: Spacing.base }}
          />

          <Typography variant="caption" color={Colors.textMuted} align="center" style={{ marginTop: Spacing.sm }}>
            Django Admin URL: http://localhost:8000/admin
          </Typography>
        </Card>

        {/* Logout CTA */}
        <Button
          label="Sign Out of Admin"
          variant="outline"
          size="md"
          fullWidth
          onPress={logout}
          style={{ marginTop: Spacing.xl }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    padding: Spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  card: {
    width: '100%',
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    backgroundColor: Colors.white,
    ...Shadows.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Spacing.lg,
    backgroundColor: Colors.mintLight,
    padding: Spacing.md,
    borderRadius: Radii.md,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
});

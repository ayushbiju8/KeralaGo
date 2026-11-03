import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { apiGet } from '../../services/apiClient';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Typography,
  Card,
  Icon,
} from '../../components/atoms';
import { InfoRow } from '../../components/molecules';
import { NavigationHeader } from '../../components/organisms';
import { Colors, Spacing, Radii, Shadows } from '../../constants/theme';

export interface DriverVehicleDetailsPageProps {
  onBack?: () => void;
}

const DriverVehicleDetailsPage: React.FC<DriverVehicleDetailsPageProps> = ({
  onBack,
}) => {
  const [vehicleData, setVehicleData] = useState<any>(null);
  const [complianceData, setComplianceData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    apiGet<any>('/driver/vehicle/', null).then((res) => {
      if (isMounted) {
        if (res.data && res.data.vehicle) {
          setVehicleData(res.data.vehicle);
          setComplianceData(res.data.compliance);
        } else {
          setVehicleData(null);
          setComplianceData(null);
        }
        setIsLoading(false);
      }
    }).catch(() => {
      if (isMounted) {
        setVehicleData(null);
        setIsLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, []);

  const handleEditPress = () => {
    Alert.alert('Vehicle Documents', 'To register or update vehicle details, submit verification documents to Kerala MVD portal.');
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeHeaderArea}>
        <NavigationHeader
          title="Vehicle Details"
          showBack={true}
          onBack={onBack}
          rightActions={
            <TouchableOpacity onPress={handleEditPress} activeOpacity={0.7} style={styles.editBtn}>
              <Typography variant="body2" weight="bold" color={Colors.primary}>
                Add/Edit
              </Typography>
            </TouchableOpacity>
          }
        />
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isLoading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Typography variant="body2" color={Colors.textMuted} style={{ marginTop: 12 }}>
              Loading vehicle details...
            </Typography>
          </View>
        ) : !vehicleData ? (
          <View style={{ paddingVertical: 60, alignItems: 'center', paddingHorizontal: 24 }}>
            <Icon library="Ionicons" name="car-outline" size={54} color={Colors.textMuted} />
            <Typography variant="h3" weight="bold" color={Colors.textPrimary} style={{ marginTop: 16 }}>
              No Vehicle Registered
            </Typography>
            <Typography variant="body2" color={Colors.textMuted} align="center" style={{ marginTop: 8, lineHeight: 20 }}>
              You do not have any registered vehicle under this account. Please upload your RC and vehicle documents to become a registered partner.
            </Typography>
            <TouchableOpacity
              onPress={handleEditPress}
              style={{
                marginTop: 24,
                backgroundColor: Colors.primary,
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 8,
              }}
            >
              <Typography variant="body2" weight="bold" color={Colors.white}>
                Register a Vehicle
              </Typography>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── Top Vehicle Showcase ── */}
            <View style={styles.vehicleShowcase}>
              <Typography variant="h3" weight="bold" color={Colors.textPrimary} align="center" style={styles.vehicleName}>
                {vehicleData.make} {vehicleData.model} - {vehicleData.color}
              </Typography>
              <Typography variant="body1" weight="bold" color={Colors.textSecondary} align="center">
                {vehicleData.plate}
              </Typography>
            </View>

            {/* ── Specifications & Legal Verification Status Card with InfoRow ── */}
            <Card style={styles.detailsCard}>
              <InfoRow label="Vehicle Category" value={vehicleData.category || 'Vehicle'} rightContent="text" />
              <InfoRow label="Model" value={`${vehicleData.make} ${vehicleData.model}`} rightContent="text" />
              <InfoRow label="Color" value={vehicleData.color} rightContent="text" />
              <InfoRow
                label="Registration Number"
                value={vehicleData.plate}
                rightContent="text"
                valueColor={Colors.textPrimary}
              />
              <InfoRow label="Year" value={String(vehicleData.year || '')} rightContent="text" />
              <InfoRow
                label="RC Status"
                rightNode={
                  <View style={styles.verifiedBadge}>
                    <Icon library="Ionicons" name="checkmark-circle" size={15} color="#166534" style={{ marginRight: 3 }} />
                    <Typography variant="xs" weight="bold" color="#166534">
                      {complianceData?.rcStatus || 'Verified'}
                    </Typography>
                  </View>
                }
              />
              <InfoRow
                label="Insurance Status"
                rightNode={
                  <View style={styles.verifiedBadge}>
                    <Icon library="Ionicons" name="checkmark-circle" size={15} color="#166534" style={{ marginRight: 3 }} />
                    <Typography variant="xs" weight="bold" color="#166534">
                      {complianceData?.insuranceStatus || 'Verified'}
                    </Typography>
                  </View>
                }
              />
              <InfoRow
                label="PUC Status"
                rightNode={
                  <View style={styles.verifiedBadge}>
                    <Icon library="Ionicons" name="checkmark-circle" size={15} color="#166534" style={{ marginRight: 3 }} />
                    <Typography variant="xs" weight="bold" color="#166534">
                      {complianceData?.pollutionStatus || 'Verified'}
                    </Typography>
                  </View>
                }
                showDivider={false}
              />
            </Card>
          </>
        )}
      </ScrollView>
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
  editBtn: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  scrollContent: {
    paddingBottom: Spacing['3xl'],
  },

  // ── Top Vehicle Showcase ──
  vehicleShowcase: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.base,
  },
  vehicleImage: {
    width: 260,
    height: 140,
    marginBottom: Spacing.md,
  },
  vehicleName: {
    marginBottom: 4,
  },

  // ── Details Card ──
  detailsCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    borderRadius: Radii.xl,
    paddingHorizontal: Spacing.base,
    borderWidth: 1,
    borderColor: '#EFF3F0',
    ...Shadows.sm,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
});

export default DriverVehicleDetailsPage;

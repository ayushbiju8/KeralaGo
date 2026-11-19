import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { apiGet, apiPatch } from '../../services/apiClient';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Typography,
  Card,
  Icon,
  Button,
  Badge,
} from '../../components/atoms';
import { InfoRow } from '../../components/molecules';
import { NavigationHeader, DriverRegistrationModal } from '../../components/organisms';
import { useAuth } from '../../hooks/useAuth';
import { Colors, Spacing, Radii, Shadows } from '../../constants/theme';

export interface DriverVehicleDetailsPageProps {
  onBack?: () => void;
}

const DriverVehicleDetailsPage: React.FC<DriverVehicleDetailsPageProps> = ({
  onBack,
}) => {
  const { isDriverRegistrationOpen, openDriverRegistration, closeDriverRegistration } = useAuth();
  const [vehicleData, setVehicleData] = useState<any>(null);
  const [complianceData, setComplianceData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Edit Vehicle Modal state
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [makeInput, setMakeInput] = useState<string>('');
  const [modelInput, setModelInput] = useState<string>('');
  const [plateInput, setPlateInput] = useState<string>('');
  const [colorInput, setColorInput] = useState<string>('');
  const [yearInput, setYearInput] = useState<string>('');
  const [capacityInput, setCapacityInput] = useState<string>('4');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const loadVehicleData = () => {
    setIsLoading(true);
    apiGet<any>('/driver/vehicle/', null).then((res) => {
      if (res.data && res.data.vehicle) {
        setVehicleData(res.data.vehicle);
        setComplianceData(res.data.compliance);
        prefillForm(res.data.vehicle);
      } else {
        setVehicleData(null);
        setComplianceData(null);
      }
      setIsLoading(false);
    }).catch(() => {
      setVehicleData(null);
      setIsLoading(false);
    });
  };

  const prefillForm = (v: any) => {
    if (!v) return;
    setMakeInput(v.make || '');
    setModelInput(v.model || '');
    setPlateInput(v.plate || '');
    setColorInput(v.color || '');
    setYearInput(v.year ? String(v.year) : '');
    setCapacityInput(v.seatingCapacity ? String(v.seatingCapacity) : '4');
  };

  useEffect(() => {
    let isMounted = true;
    apiGet<any>('/driver/vehicle/', null).then((res) => {
      if (isMounted) {
        if (res.data && res.data.vehicle) {
          setVehicleData(res.data.vehicle);
          setComplianceData(res.data.compliance);
          prefillForm(res.data.vehicle);
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
    if (vehicleData) {
      prefillForm(vehicleData);
      setEditModalVisible(true);
    } else {
      openDriverRegistration();
    }
  };

  const handleSaveVehicle = async () => {
    if (!makeInput.trim() || !modelInput.trim() || !plateInput.trim()) {
      Alert.alert('Required Fields', 'Please enter make, model, and registration number.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await apiPatch<any>('/driver/vehicle/update/', {
        make: makeInput.trim(),
        model: modelInput.trim(),
        plate: plateInput.trim().toUpperCase(),
        color: colorInput.trim() || 'White',
        year: yearInput.trim() ? parseInt(yearInput.trim(), 10) : new Date().getFullYear(),
        capacity: capacityInput.trim() ? parseInt(capacityInput.trim(), 10) : 4,
      });

      if (res.data && res.data.vehicle) {
        setVehicleData((prev: any) => ({
          ...prev,
          ...res.data.vehicle,
        }));
        Alert.alert('Success', 'Vehicle specifications updated successfully.');
        setEditModalVisible(false);
      } else {
        Alert.alert('Update Failed', res.error || 'Could not update vehicle details.');
      }
    } catch {
      Alert.alert('Error', 'Network request failed. Please check connection.');
    } finally {
      setIsSaving(false);
    }
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
                {vehicleData ? 'Edit Details' : 'Register'}
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
              Loading vehicle details from backend...
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
              onPress={openDriverRegistration}
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
              <View style={styles.vehicleBadgeWrap}>
                <Icon library="Ionicons" name="car-sport" size={32} color={Colors.primary} />
              </View>
              <Typography variant="h2" weight="bold" color={Colors.textPrimary} align="center" style={styles.vehicleName}>
                {vehicleData.make} {vehicleData.model}
              </Typography>
              <View style={styles.plateTag}>
                <Typography variant="body2" weight="bold" color="#0F4A2B">
                  {vehicleData.plate}
                </Typography>
              </View>
            </View>

            {/* ── Specifications & Legal Verification Status Card with InfoRow ── */}
            <Card style={styles.detailsCard}>
              <InfoRow label="Vehicle Category" value={vehicleData.category || 'Standard Taxi / Auto'} rightContent="text" />
              <InfoRow label="Make & Brand" value={vehicleData.make} rightContent="text" />
              <InfoRow label="Model" value={vehicleData.model} rightContent="text" />
              <InfoRow label="Color" value={vehicleData.color} rightContent="text" />
              <InfoRow
                label="Registration Number"
                value={vehicleData.plate}
                rightContent="text"
                valueColor={Colors.textPrimary}
              />
              <InfoRow label="Year of Manufacture" value={String(vehicleData.year || '2022')} rightContent="text" />
              <InfoRow label="Seating Capacity" value={`${vehicleData.seatingCapacity || 4} Passengers`} rightContent="text" />
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
                label="Pollution (PUC) Status"
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

            <View style={{ marginHorizontal: Spacing.base, marginTop: 16 }}>
              <Button
                label="Edit Vehicle Details"
                variant="primary"
                size="md"
                fullWidth
                onPress={handleEditPress}
              />
            </View>
          </>
        )}
      </ScrollView>

      {/* ── Edit Vehicle Modal ── */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Typography variant="h3" weight="bold" color="#0F172A">
                  Edit Vehicle Details
                </Typography>
                <Typography variant="xs" color="#64748B">
                  Update active vehicle information
                </Typography>
              </View>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon library="Ionicons" name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              <View style={{ marginBottom: 12 }}>
                <Typography variant="xs" weight="bold" color="#475569" style={styles.inputLabel}>
                  MAKE / BRAND *
                </Typography>
                <TextInput
                  value={makeInput}
                  onChangeText={setMakeInput}
                  placeholder="e.g. Maruti Suzuki, Bajaj, Hyundai"
                  placeholderTextColor="#94A3B8"
                  style={styles.modalInput}
                />
              </View>

              <View style={{ marginBottom: 12 }}>
                <Typography variant="xs" weight="bold" color="#475569" style={styles.inputLabel}>
                  MODEL *
                </Typography>
                <TextInput
                  value={modelInput}
                  onChangeText={setModelInput}
                  placeholder="e.g. Dzire, RE Compact, Ertiga"
                  placeholderTextColor="#94A3B8"
                  style={styles.modalInput}
                />
              </View>

              <View style={{ marginBottom: 12 }}>
                <Typography variant="xs" weight="bold" color="#475569" style={styles.inputLabel}>
                  REGISTRATION NUMBER (PLATE) *
                </Typography>
                <TextInput
                  value={plateInput}
                  onChangeText={setPlateInput}
                  placeholder="e.g. KL-07-CB-4821"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                  style={styles.modalInput}
                />
              </View>

              <View style={{ marginBottom: 12 }}>
                <Typography variant="xs" weight="bold" color="#475569" style={styles.inputLabel}>
                  VEHICLE COLOR
                </Typography>
                <TextInput
                  value={colorInput}
                  onChangeText={setColorInput}
                  placeholder="e.g. White, Silver, Yellow"
                  placeholderTextColor="#94A3B8"
                  style={styles.modalInput}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Typography variant="xs" weight="bold" color="#475569" style={styles.inputLabel}>
                    YEAR
                  </Typography>
                  <TextInput
                    value={yearInput}
                    onChangeText={setYearInput}
                    placeholder="2022"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    style={styles.modalInput}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Typography variant="xs" weight="bold" color="#475569" style={styles.inputLabel}>
                    SEATS
                  </Typography>
                  <TextInput
                    value={capacityInput}
                    onChangeText={setCapacityInput}
                    placeholder="4"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    style={styles.modalInput}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Button
                    label="Cancel"
                    variant="outline"
                    size="md"
                    fullWidth
                    onPress={() => setEditModalVisible(false)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    label={isSaving ? 'Saving...' : 'Save Details'}
                    variant="primary"
                    size="md"
                    fullWidth
                    loading={isSaving}
                    onPress={handleSaveVehicle}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Driver / Vehicle Registration Modal ── */}
      <DriverRegistrationModal
        visible={isDriverRegistrationOpen}
        onClose={closeDriverRegistration}
        onSuccess={loadVehicleData}
      />
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
  vehicleBadgeWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  vehicleName: {
    marginBottom: 6,
  },
  plateTag: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#0F4A2B',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 8,
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

  // ── Modal Styles ──
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
});

export default DriverVehicleDetailsPage;

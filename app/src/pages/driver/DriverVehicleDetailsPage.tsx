import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { apiGet, apiPost } from '../../services/apiClient';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Typography,
  Card,
  Icon,
  ShimmerImage,
  Button,
} from '../../components/atoms';
import { InfoRow } from '../../components/molecules';
import { NavigationHeader, DocumentVerificationRow } from '../../components/organisms';
import { Colors, Spacing, Radii, Shadows } from '../../constants/theme';

export interface DriverVehicleDetailsPageProps {
  onBack?: () => void;
}

const DriverVehicleDetailsPage: React.FC<DriverVehicleDetailsPageProps> = ({
  onBack,
}) => {
  const [vehicleData, setVehicleData] = useState<any>(null);
  const [complianceData, setComplianceData] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadDocuments = () => {
    apiGet<any[]>('/driver/documents/', []).then((res) => {
      if (res.data) setDocuments(res.data);
    }).catch(() => {});
  };

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      apiGet<any>('/driver/vehicle/', null),
      apiGet<any[]>('/driver/documents/', []),
    ]).then(([vehRes, docRes]) => {
      if (isMounted) {
        if (vehRes.data && vehRes.data.vehicle) {
          setVehicleData(vehRes.data.vehicle);
          setComplianceData(vehRes.data.compliance);
        } else {
          setVehicleData(null);
          setComplianceData(null);
        }
        if (docRes.data) {
          setDocuments(docRes.data);
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

  const handleUploadDocument = (docType: string) => {
    Alert.alert(
      'Upload Document',
      `Upload new proof for ${docType.replace('_', ' ')}:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upload from Camera/Files',
          onPress: async () => {
            try {
              const res = await apiPost<any>('/driver/documents/', {
                documentType: docType,
                fileUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600',
              });
              if (res.data?.success) {
                Alert.alert('Upload Submitted ✅', `${docType} uploaded successfully. Awaiting Admin verification.`);
                loadDocuments();
              }
            } catch (err: any) {
              Alert.alert('Upload Error', err?.message || 'Failed to submit document');
            }
          },
        },
      ]
    );
  };

  const handleEditPress = () => {
    Alert.alert(
      'Driver KYC Verification',
      'Select document to upload or update:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Driving License', onPress: () => handleUploadDocument('DRIVING_LICENSE') },
        { text: 'Vehicle RC Book', onPress: () => handleUploadDocument('RC') },
        { text: 'Commercial Insurance', onPress: () => handleUploadDocument('INSURANCE') },
        { text: 'Pollution Certificate (PUC)', onPress: () => handleUploadDocument('POLICE_CLEARANCE') },
      ]
    );
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

            {/* ── KYC Compliance Documents Section ── */}
            <View style={{ paddingHorizontal: Spacing.base, marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
              <Typography variant="body1" weight="bold" color={Colors.textPrimary}>
                KYC & Compliance Documents
              </Typography>
              <Typography variant="caption" color={Colors.textSecondary}>
                Mandatory Kerala MVD verified certificates
              </Typography>
            </View>

            <Card style={styles.detailsCard}>
              {documents.length > 0 ? (
                documents.map((doc, idx) => (
                  <TouchableOpacity
                    key={doc.type || idx}
                    activeOpacity={0.8}
                    onPress={() => handleUploadDocument(doc.type)}
                  >
                    <DocumentVerificationRow
                      label={doc.title}
                      status={doc.status === 'APPROVED' ? 'verified' : (doc.status === 'PENDING' ? 'pending' : 'rejected')}
                      showDivider={idx < documents.length - 1}
                    />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={{ paddingVertical: 18, alignItems: 'center' }}>
                  <Typography variant="caption" color={Colors.textMuted}>
                    No documents uploaded yet. Tap below to upload.
                  </Typography>
                  <Button
                    label="Upload KYC Documents"
                    variant="outline"
                    size="sm"
                    onPress={handleEditPress}
                    style={{ marginTop: 10 }}
                  />
                </View>
              )}
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

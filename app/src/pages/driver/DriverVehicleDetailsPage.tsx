import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
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
  const handleEditPress = () => {
    Alert.alert('Edit Vehicle Information', 'To update RC or vehicle details, submit verification documents to Kerala MVD portal.');
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
                Edit
              </Typography>
            </TouchableOpacity>
          }
        />
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Top Vehicle Showcase ── */}
        <View style={styles.vehicleShowcase}>
          <Image
            source={require('../../../assets/images/white_sedan.jpg')}
            style={styles.vehicleImage}
            resizeMode="contain"
          />

          <Typography variant="h3" weight="bold" color={Colors.textPrimary} align="center" style={styles.vehicleName}>
            Maruti Swift - White
          </Typography>
          <Typography variant="body1" weight="bold" color={Colors.textSecondary} align="center">
            KL 07 AB 1234
          </Typography>
        </View>

        {/* ── Specifications & Legal Verification Status Card with InfoRow ── */}
        <Card style={styles.detailsCard}>
          <InfoRow label="Vehicle Type" value="Car" rightContent="text" />
          <InfoRow label="Model" value="Maruti Swift" rightContent="text" />
          <InfoRow label="Color" value="White" rightContent="text" />
          <InfoRow
            label="Registration Number"
            value="KL 07 AB 1234"
            rightContent="text"
            valueColor={Colors.textPrimary}
          />
          <InfoRow label="Year" value="2022" rightContent="text" />
          <InfoRow
            label="RC Status"
            rightNode={
              <View style={styles.verifiedBadge}>
                <Icon library="Ionicons" name="checkmark-circle" size={15} color="#166534" style={{ marginRight: 3 }} />
                <Typography variant="xs" weight="bold" color="#166534">
                  Verified
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
                  Verified
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
                  Verified
                </Typography>
              </View>
            }
            showDivider={false}
          />
        </Card>
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

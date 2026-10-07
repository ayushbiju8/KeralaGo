import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Icon from '../atoms/Icon';
import Typography from '../atoms/Typography';
import { Colors, Radii, Shadows } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

interface KeralaMapBackgroundProps {
  showVehicles?: boolean;
  activeDestination?: string | null;
}

const KeralaMapBackground: React.FC<KeralaMapBackgroundProps> = ({
  showVehicles = true,
  activeDestination,
}) => {
  return (
    <View style={styles.container}>
      {/* Background ground & terrain */}
      <View style={styles.terrainBase} />

      {/* Kerala Backwaters / Vembanad Lake waterway ribbon */}
      <View style={styles.waterway} />
      <View style={styles.waterwayBranch} />

      {/* Simulated Road Grid */}
      <View style={[styles.road, styles.nh66Highway]} />
      <View style={[styles.road, styles.cochinSeaportRoad]} />
      <View style={[styles.road, styles.mgRoad]} />
      <View style={[styles.road, styles.ringRoad]} />
      <View style={[styles.road, styles.crossRoad1]} />
      <View style={[styles.road, styles.crossRoad2]} />
      <View style={[styles.road, styles.crossRoad3]} />

      {/* Kochi Metro Elevated Viaduct line */}
      <View style={styles.metroLine} />

      {/* Landmark badges on map */}
      <View style={[styles.landmarkPin, { top: height * 0.22, left: width * 0.15 }]}>
        <View style={styles.landmarkDot} />
        <Typography variant="xs" weight="medium" color={Colors.textSecondary}>
          Fort Kochi
        </Typography>
      </View>

      <View style={[styles.landmarkPin, { top: height * 0.32, right: width * 0.12 }]}>
        <View style={[styles.landmarkDot, { backgroundColor: Colors.primary }]} />
        <Typography variant="xs" weight="medium" color={Colors.textSecondary}>
          Kakkanad InfoPark
        </Typography>
      </View>

      <View style={[styles.landmarkPin, { top: height * 0.15, right: width * 0.28 }]}>
        <View style={styles.landmarkDot} />
        <Typography variant="xs" weight="medium" color={Colors.textSecondary}>
          Aluva Metro
        </Typography>
      </View>

      {/* Active route preview if destination selected */}
      {activeDestination && (
        <View style={styles.routePolyline} />
      )}

      {/* User's current location pin with pulse aura */}
      <View style={[styles.userLocationContainer, { top: height * 0.38, left: width * 0.44 }]}>
        <View style={styles.pulseAura} />
        <View style={styles.userPinCenter}>
          <Icon library="Ionicons" name="navigate" size={14} color={Colors.white} />
        </View>
        <View style={styles.userLabelBubble}>
          <Typography variant="xs" weight="semiBold" color={Colors.primary}>
            You are here • MG Road
          </Typography>
        </View>
      </View>

      {/* Nearby live cabs/autos/bikes */}
      {showVehicles && (
        <>
          {/* Kerala Auto Rickshaw nearby */}
          <View style={[styles.vehicleMarker, { top: height * 0.34, left: width * 0.28 }]}>
            <View style={[styles.vehicleBadge, { backgroundColor: '#F59E0B' }]}>
              <Icon library="MaterialCommunityIcons" name="rickshaw" size={16} color={Colors.white} />
            </View>
            <View style={styles.vehicleEtaTag}>
              <Typography variant="xs" weight="bold" color={Colors.textPrimary}>2m</Typography>
            </View>
          </View>

          {/* KeralaGo Car nearby */}
          <View style={[styles.vehicleMarker, { top: height * 0.44, right: width * 0.25 }]}>
            <View style={[styles.vehicleBadge, { backgroundColor: Colors.primary }]}>
              <Icon library="Ionicons" name="car" size={15} color={Colors.white} />
            </View>
            <View style={styles.vehicleEtaTag}>
              <Typography variant="xs" weight="bold" color={Colors.textPrimary}>4m</Typography>
            </View>
          </View>

          {/* Pink Ride Cab nearby */}
          <View style={[styles.vehicleMarker, { top: height * 0.26, left: width * 0.55 }]}>
            <View style={[styles.vehicleBadge, { backgroundColor: Colors.pinkRide }]}>
              <Icon library="Ionicons" name="shield-checkmark" size={14} color={Colors.white} />
            </View>
            <View style={styles.vehicleEtaTag}>
              <Typography variant="xs" weight="bold" color={Colors.pinkRide}>5m</Typography>
            </View>
          </View>

          {/* Moto Bike nearby */}
          <View style={[styles.vehicleMarker, { top: height * 0.48, left: width * 0.38 }]}>
            <View style={[styles.vehicleBadge, { backgroundColor: '#3B82F6' }]}>
              <Icon library="MaterialIcons" name="two-wheeler" size={16} color={Colors.white} />
            </View>
            <View style={styles.vehicleEtaTag}>
              <Typography variant="xs" weight="bold" color={Colors.textPrimary}>1m</Typography>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    backgroundColor: '#F3F6F4',
  },
  terrainBase: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#EAF1ED',
  },
  waterway: {
    position: 'absolute',
    top: 0,
    left: width * 0.08,
    width: 32,
    height: height,
    backgroundColor: '#C5E0FB',
    opacity: 0.85,
    transform: [{ rotate: '15deg' }, { scaleX: 1.4 }],
  },
  waterwayBranch: {
    position: 'absolute',
    top: height * 0.28,
    left: width * 0.02,
    width: 140,
    height: 24,
    backgroundColor: '#C5E0FB',
    opacity: 0.8,
    borderRadius: Radii.full,
    transform: [{ rotate: '-25deg' }],
  },
  road: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderColor: '#DFE8E2',
    borderWidth: 1,
  },
  nh66Highway: {
    top: -50,
    left: width * 0.48,
    width: 24,
    height: height + 100,
    transform: [{ rotate: '-12deg' }],
    backgroundColor: '#FFFDF0',
    borderColor: '#F3E5AB',
  },
  cochinSeaportRoad: {
    top: -50,
    right: width * 0.18,
    width: 18,
    height: height + 100,
    transform: [{ rotate: '8deg' }],
  },
  mgRoad: {
    top: height * 0.36,
    left: -50,
    width: width + 100,
    height: 18,
    transform: [{ rotate: '4deg' }],
  },
  ringRoad: {
    top: height * 0.2,
    left: -50,
    width: width + 100,
    height: 14,
    transform: [{ rotate: '-8deg' }],
  },
  crossRoad1: {
    top: height * 0.52,
    left: -30,
    width: width + 60,
    height: 12,
  },
  crossRoad2: {
    top: height * 0.1,
    left: width * 0.25,
    width: 14,
    height: 350,
    transform: [{ rotate: '40deg' }],
  },
  crossRoad3: {
    top: height * 0.32,
    left: width * 0.3,
    width: 12,
    height: 300,
    transform: [{ rotate: '-35deg' }],
  },
  metroLine: {
    position: 'absolute',
    top: -50,
    left: width * 0.52,
    width: 4,
    height: height + 100,
    backgroundColor: '#0F4A2B',
    transform: [{ rotate: '-12deg' }],
    opacity: 0.6,
  },
  landmarkPin: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.sm,
    ...Shadows.xs,
  },
  landmarkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textMuted,
  },
  routePolyline: {
    position: 'absolute',
    top: height * 0.32,
    left: width * 0.45,
    width: 110,
    height: 90,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderColor: Colors.primaryVibrant,
    borderStyle: 'dashed',
  },
  userLocationContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseAura: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 74, 43, 0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(15, 74, 43, 0.3)',
  },
  userPinCenter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: Colors.white,
    ...Shadows.sm,
  },
  userLabelBubble: {
    position: 'absolute',
    top: 30,
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.mintBorder,
    ...Shadows.xs,
  },
  vehicleMarker: {
    position: 'absolute',
    alignItems: 'center',
  },
  vehicleBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    ...Shadows.sm,
  },
  vehicleEtaTag: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xs,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginTop: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.xs,
  },
});

export default KeralaMapBackground;

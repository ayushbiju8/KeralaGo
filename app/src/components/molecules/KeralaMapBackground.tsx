import React from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, ViewStyle } from 'react-native';
import Icon from '../atoms/Icon';
import Typography from '../atoms/Typography';
import { Colors, Radii, Shadows, Spacing } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

export interface KeralaMapBackgroundProps {
  showVehicles?: boolean;
  activeDestination?: string | null;
  variant?: 'customer' | 'driver';
  height?: number;
  offsetY?: number;
  style?: ViewStyle;
  onLocatePress?: () => void;
  onLayersPress?: () => void;
  onNavigatePress?: () => void;
}

const KeralaMapBackground: React.FC<KeralaMapBackgroundProps> = ({
  showVehicles = true,
  activeDestination,
  variant = 'customer',
  height: customHeight,
  offsetY = 0,
  style,
  onLocatePress,
  onLayersPress,
  onNavigatePress,
}) => {
  if (variant === 'driver') {
    const mapH = customHeight ?? 270;
    const offY = offsetY ?? 0;
    return (
      <View style={[styles.driverContainer, { height: mapH }, style]}>
        {/* Terrain Base */}
        <View style={styles.driverTerrain} />

        {/* River on the left */}
        <View style={styles.driverRiver} />
        <View style={[styles.driverRiverCurve, { top: 60 + offY }]} />

        {/* Secondary roads */}
        <View style={[styles.driverRoadMinor1, { top: 70 + offY }]} />
        <View style={styles.driverRoadMinor2} />
        <View style={styles.driverRoadMinor3} />

        {/* Extra road in lower area for full map view */}
        {mapH > 400 && (
          <View style={[styles.driverRoadMinorLower, { top: 340 + offY }]} />
        )}

        {/* Yellow NH-85 Highway */}
        <View style={styles.driverHighway85} />

        {/* Highway 85 Badge Shield */}
        <View style={[styles.highwayShield, { top: 130 + offY }]}>
          <Typography variant="xs" weight="bold" color="#1E293B">
            85
          </Typography>
        </View>

        {/* MACE College Landmark Pin */}
        <View style={[styles.maceLandmark, { top: 48 + offY }]}>
          <View style={styles.maceIconWrap}>
            <Icon library="MaterialIcons" name="school" size={12} color="#64748B" />
          </View>
          <View>
            <Typography variant="xs" weight="bold" color="#334155" style={{ fontSize: 9 }}>
              MACE
            </Typography>
            <Typography variant="xs" color="#64748B" style={{ fontSize: 8 }}>
              Mar Athanasius
            </Typography>
            <Typography variant="xs" color="#64748B" style={{ fontSize: 8 }}>
              College of Engineering
            </Typography>
          </View>
        </View>

        {/* Location Pin Badge: "Near MACE / Kothamangalam" */}
        <View style={[styles.locationPinCard, { top: 38 + offY }]}>
          <View style={styles.locationPinCircle}>
            <Icon library="Ionicons" name="location-sharp" size={16} color={Colors.white} />
          </View>
          <View style={{ marginLeft: 6 }}>
            <Typography variant="caption" weight="bold" color={Colors.textPrimary}>
              Near MACE
            </Typography>
            <Typography variant="xs" color={Colors.textSecondary} style={{ fontSize: 10 }}>
              Kothamangalam
            </Typography>
          </View>
        </View>

        {/* Blue Current Location Radar Pulse & Center Dot */}
        <View style={[styles.driverBlueDotAura, { top: 112 + offY }]}>
          <View style={styles.driverBlueDotRing} />
          <View style={styles.driverBlueDotCenter} />
        </View>

        {/* Driver Car on Road */}
        <View style={[styles.driverCarMarker, { top: 138 + offY }]}>
          <View style={styles.carBodyShadow} />
          <View style={styles.carBody}>
            {/* Windshield & Roof */}
            <View style={styles.carRoof} />
            <View style={styles.carWindshield} />
            <View style={styles.carRearWindow} />
          </View>
        </View>

        {/* Floating Map Controls on Right */}
        <View style={[styles.floatingControlsColumn, { top: 36 + offY }]}>
          <TouchableOpacity
            style={styles.floatingMapBtn}
            activeOpacity={0.8}
            onPress={onLocatePress}
          >
            <Icon library="Ionicons" name="locate" size={20} color={Colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.floatingMapBtn}
            activeOpacity={0.8}
            onPress={onLayersPress}
          >
            <Icon library="Ionicons" name="layers-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.floatingMapBtn}
            activeOpacity={0.8}
            onPress={onNavigatePress}
          >
            <Icon library="Ionicons" name="navigate" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Extra Landmark in Lower Area when Drawer is Pulled Down */}
        {mapH > 400 && (
          <View style={[styles.kothamangalamLandmark, { top: 310 + offY }]}>
            <View style={styles.landmarkDotTown} />
            <View>
              <Typography variant="xs" weight="bold" color="#334155" style={{ fontSize: 9 }}>
                Kothamangalam Town
              </Typography>
              <Typography variant="xs" color="#64748B" style={{ fontSize: 8 }}>
                Municipal Junction
              </Typography>
            </View>
          </View>
        )}
      </View>
    );
  }

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

  // ── Driver Variant Styles ──
  driverContainer: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#EDF6EF',
  },
  driverTerrain: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#EDF6EF',
  },
  driverRiver: {
    position: 'absolute',
    top: -20,
    bottom: -20,
    left: width * 0.12,
    width: 44,
    backgroundColor: '#BAE6FD',
    transform: [{ rotate: '12deg' }],
  },
  driverRiverCurve: {
    position: 'absolute',
    top: 60,
    left: -20,
    width: width * 0.35,
    height: 120,
    backgroundColor: '#BAE6FD',
    borderRadius: 80,
    transform: [{ rotate: '-18deg' }],
  },
  driverRoadMinor1: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    transform: [{ rotate: '4deg' }],
  },
  driverRoadMinor2: {
    position: 'absolute',
    bottom: 40,
    left: -20,
    right: -20,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    transform: [{ rotate: '-12deg' }],
  },
  driverRoadMinor3: {
    position: 'absolute',
    top: -20,
    bottom: -20,
    left: width * 0.65,
    width: 10,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    transform: [{ rotate: '20deg' }],
  },
  driverHighway85: {
    position: 'absolute',
    top: -40,
    bottom: -40,
    left: width * 0.36,
    width: 28,
    backgroundColor: '#FDE047',
    borderColor: '#EAB308',
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    transform: [{ rotate: '-32deg' }],
  },
  highwayShield: {
    position: 'absolute',
    top: 130,
    left: width * 0.68,
    width: 22,
    height: 18,
    backgroundColor: '#FDE047',
    borderColor: '#CA8A04',
    borderWidth: 1,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  maceLandmark: {
    position: 'absolute',
    top: 48,
    left: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radii.sm,
    ...Shadows.xs,
    zIndex: 6,
  },
  maceIconWrap: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationPinCard: {
    position: 'absolute',
    top: 38,
    left: width * 0.36,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
    zIndex: 8,
  },
  locationPinCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0F4A2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverBlueDotAura: {
    position: 'absolute',
    top: 112,
    left: width * 0.48,
    zIndex: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverBlueDotRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
  },
  driverBlueDotCenter: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#2563EB',
    borderWidth: 2.5,
    borderColor: Colors.white,
  },
  driverCarMarker: {
    position: 'absolute',
    top: 138,
    left: width * 0.52,
    zIndex: 8,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-32deg' }],
  },
  carBodyShadow: {
    position: 'absolute',
    bottom: -2,
    width: 22,
    height: 38,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  carBody: {
    width: 20,
    height: 36,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#94A3B8',
    alignItems: 'center',
  },
  carWindshield: {
    width: 14,
    height: 7,
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    marginTop: 4,
  },
  carRoof: {
    width: 14,
    height: 11,
    backgroundColor: '#E2E8F0',
  },
  carRearWindow: {
    width: 12,
    height: 5,
    backgroundColor: '#334155',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  floatingControlsColumn: {
    position: 'absolute',
    right: 14,
    top: 36,
    zIndex: 9,
    gap: 8,
  },
  floatingMapBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  driverRoadMinorLower: {
    position: 'absolute',
    left: -20,
    right: -20,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    transform: [{ rotate: '8deg' }],
  },
  kothamangalamLandmark: {
    position: 'absolute',
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    ...Shadows.xs,
    zIndex: 6,
  },
  landmarkDotTown: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});

export default KeralaMapBackground;

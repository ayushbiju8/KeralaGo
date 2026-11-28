/**
 * Screen: MapScreen (Core Mapping, Routing & Live Telemetry Engine)
 *
 * Integrates:
 * - Phase 1: Raw GPS Capture & Reverse Geocoding + Google Places Autocomplete
 * - Phase 2: Google Routes API (TRAFFIC_AWARE) backend calculation
 * - Phase 3: Encoded Polyline decoding & Thick Blue route rendering with camera auto-fitting
 * - Phase 4: Real-time Socket.IO Telemetry + Google Snap-to-Roads with Smooth LERP Marker
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { io, Socket } from 'socket.io-client';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radii, Shadows, FontSize } from '../../constants/theme';
import { useDeviceLocation } from '../../hooks/useDeviceLocation';
import { PlacesAutocompleteInput } from '../../components/molecules/PlacesAutocompleteInput';
import { RouteMapView } from '../../components/organisms/RouteMapView';
import {
  calculateRouteWithBackend,
  PlaceLocation,
  BACKEND_URL,
} from '../../services/googleMapsService';
import { LatLng } from '../../utils/decodePolyline';

export const MapScreen: React.FC = () => {
  // Phase 1: Device GPS location & Reverse Geocoded address
  const { coords: pickupCoords, address: pickupAddress, isLoading: isLocating } =
    useDeviceLocation();

  // Phase 1: Drop-off destination selection
  const [dropoffLocation, setDropoffLocation] = useState<PlaceLocation | null>(null);

  // Phase 2: Route calculation state
  const [isCalculatingRoute, setIsCalculatingRoute] = useState<boolean>(false);
  const [routeData, setRouteData] = useState<{
    encodedPolyline: string;
    distanceKm: number;
    etaMinutes: number;
    formattedDuration: string;
  } | null>(null);

  // Phase 4: Driver Live Telemetry State
  const [driverLocation, setDriverLocation] = useState<LatLng | null>(null);
  const [driverBearing, setDriverBearing] = useState<number>(0);
  const [driverSpeed, setDriverSpeed] = useState<number>(0);
  const [isSnapped, setIsSnapped] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);

  // Phase 2 Trigger: When both pickup and drop-off are available, calculate route
  useEffect(() => {
    if (!pickupCoords || !dropoffLocation) return;

    let isMounted = true;
    setIsCalculatingRoute(true);

    calculateRouteWithBackend(pickupCoords, {
      latitude: dropoffLocation.latitude,
      longitude: dropoffLocation.longitude,
    })
      .then((data) => {
        if (isMounted) {
          setRouteData(data);
          setIsCalculatingRoute(false);
        }
      })
      .catch((err) => {
        console.error('[MapScreen] Route calculation error:', err);
        if (isMounted) setIsCalculatingRoute(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pickupCoords, dropoffLocation]);

  // Phase 4: Connect to backend Socket.IO for real-time snapped telemetry
  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[MapScreen] Connected to telemetry engine');
      socket.emit('ride:join', { rideId: 'ride_kl_07_9842', role: 'customer' });
    });

    // Listen for snapped, drift-corrected coordinates broadcast from backend
    socket.on('driver:location_update', (telemetry: any) => {
      if (telemetry?.coordinate) {
        setDriverLocation({
          latitude: telemetry.coordinate.latitude,
          longitude: telemetry.coordinate.longitude,
        });
        if (typeof telemetry.bearing === 'number') {
          setDriverBearing(telemetry.bearing);
        }
        if (typeof telemetry.speed === 'number') {
          setDriverSpeed(telemetry.speed);
        }
        setIsSnapped(!!telemetry.isSnapped);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Phase 3 & 4: Full-Screen Map Presentation */}
      <RouteMapView
        encodedPolyline={routeData?.encodedPolyline}
        pickupLocation={pickupCoords}
        pickupAddress={pickupAddress}
        dropoffLocation={
          dropoffLocation
            ? {
                latitude: dropoffLocation.latitude,
                longitude: dropoffLocation.longitude,
              }
            : null
        }
        dropoffAddress={dropoffLocation?.address}
        driverLocation={driverLocation}
        driverBearing={driverBearing}
        driverVehicleType="car"
      />

      {/* Floating Top Controls (Phase 1: Location & Search Inputs) */}
      <SafeAreaView style={styles.topSafeArea}>
        <View style={styles.headerContainer}>
          {/* Pickup Address Pill */}
          <View style={styles.pickupPill}>
            <View style={styles.greenDot} />
            <Text style={styles.pickupPillText} numberOfLines={1}>
              {isLocating
                ? 'Detecting pickup...'
                : pickupAddress || 'Current Location'}
            </Text>
          </View>

          {/* Drop-off Autocomplete Input */}
          <PlacesAutocompleteInput
            placeholder="Search destination in Kerala..."
            onLocationSelect={(selected) => setDropoffLocation(selected)}
            style={styles.autocompleteWrapper}
          />
        </View>
      </SafeAreaView>

      {/* Loading Overlay while Google Routes API is computing */}
      {isCalculatingRoute && (
        <View style={styles.calculatingBadge}>
          <ActivityIndicator size="small" color={Colors.white} />
          <Text style={styles.calculatingText}>Calculating traffic-aware route...</Text>
        </View>
      )}

      {/* Bottom Route Summary & Telemetry HUD Card */}
      {routeData && (
        <View style={styles.bottomCard}>
          <View style={styles.routeHeader}>
            <View>
              <Text style={styles.etaText}>{routeData.formattedDuration}</Text>
              <Text style={styles.distanceText}>{routeData.distanceKm} km fastest route</Text>
            </View>
            <View style={styles.trafficBadge}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
              <Text style={styles.trafficText}>Traffic Aware</Text>
            </View>
          </View>

          {/* Live Telemetry Status Pill */}
          <View style={styles.telemetryStatus}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: driverLocation ? Colors.success : Colors.warning },
              ]}
            />
            <Text style={styles.telemetryStatusText}>
              {driverLocation
                ? `Live Driver Snapped: ${driverSpeed} km/h ${isSnapped ? '(Road Snapped)' : ''}`
                : 'Connecting to driver telemetry...'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  topSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerContainer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  pickupPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primaryVibrant,
    marginRight: Spacing.sm,
  },
  pickupPillText: {
    fontSize: FontSize.body2,
    color: Colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  autocompleteWrapper: {
    marginTop: Spacing.xs,
  },
  calculatingBadge: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 74, 43, 0.9)', // Kerala Emerald brand
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.lg,
    zIndex: 50,
  },
  calculatingText: {
    color: Colors.white,
    fontSize: FontSize.body2,
    fontWeight: '600',
  },
  bottomCard: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.base,
    right: Spacing.base,
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.lg,
    zIndex: 90,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  etaText: {
    fontSize: FontSize.h2,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  distanceText: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  trafficBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.mint,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
    gap: 4,
  },
  trafficText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
  telemetryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  telemetryStatusText: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});

export default MapScreen;

/**
 * Organism: RouteMapView (Native: iOS / Android)
 *
 * Production-grade native MapView:
 * - Uses PROVIDER_GOOGLE for hardware-accelerated vector rendering on both iOS and Android
 * - Custom Kerala green map style (matches the KeralaGo emerald brand palette)
 * - Smooth animated camera fitting with fitToCoordinates + animateCamera
 * - Thick road-cased route polyline (casing + fill, like Uber/Google Maps)
 * - Animated driver marker via AnimatedCarMarker (LERP smooth movement)
 * - Custom branded pickup and dropoff pins
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/theme';
import { decodePolyline, LatLng } from '../../utils/decodePolyline';
import { AnimatedCarMarker } from './AnimatedCarMarker';

// Custom KeralaGo map style — clean, minimal, lush green terrain matching the brand
const KERALA_MAP_STYLE = [
  { featureType: 'all', elementType: 'geometry', stylers: [{ color: '#F0F5F1' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#D7EEDF' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#CEEAD6' }] },
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'labels.text', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#93C5FD' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#2563EB' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#E2E8F0' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#F8FAFC' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#CBD5E1' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#64748B' }] },
  { featureType: 'transit', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
];

export interface RouteMapViewProps {
  encodedPolyline?: string;
  pickupLocation?: LatLng | null;
  pickupAddress?: string | null;
  dropoffLocation?: LatLng | null;
  dropoffAddress?: string | null;
  driverLocation?: LatLng | null;
  driverBearing?: number;
  driverVehicleType?: 'car' | 'auto';
  onMapReady?: () => void;
}

export const RouteMapView: React.FC<RouteMapViewProps> = ({
  encodedPolyline,
  pickupLocation,
  pickupAddress,
  dropoffLocation,
  dropoffAddress,
  driverLocation,
  driverBearing = 0,
  driverVehicleType = 'car',
  onMapReady,
}) => {
  const mapRef = useRef<MapView | null>(null);

  const routeCoordinates = useMemo(() => {
    if (!encodedPolyline) return [];
    return decodePolyline(encodedPolyline);
  }, [encodedPolyline]);

  // Auto-fit camera to show the entire route + markers, with padding for bottom sheet
  useEffect(() => {
    if (!mapRef.current) return;

    const pointsToFit: LatLng[] = [];

    if (pickupLocation) pointsToFit.push(pickupLocation);
    if (dropoffLocation) pointsToFit.push(dropoffLocation);
    if (driverLocation) pointsToFit.push(driverLocation);

    if (routeCoordinates.length > 0) {
      // Sample start, midpoint and end for bounding box calculation
      pointsToFit.push(routeCoordinates[0]);
      pointsToFit.push(routeCoordinates[Math.floor(routeCoordinates.length / 2)]);
      pointsToFit.push(routeCoordinates[routeCoordinates.length - 1]);
    }

    if (pointsToFit.length >= 2) {
      // Small delay so mapRef is fully mounted before fitting
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(pointsToFit, {
          edgePadding: { top: 100, right: 60, bottom: 220, left: 60 },
          animated: true,
        });
      }, 300);
    } else if (pickupLocation) {
      mapRef.current.animateCamera(
        {
          center: {
            latitude: pickupLocation.latitude,
            longitude: pickupLocation.longitude,
          },
          zoom: 16,
          pitch: 0,
          heading: 0,
        },
        { duration: 800 }
      );
    }
  }, [pickupLocation, dropoffLocation, routeCoordinates.length]);

  const initialRegion = {
    latitude: pickupLocation?.latitude || 10.0538,
    longitude: pickupLocation?.longitude || 76.6192,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        customMapStyle={KERALA_MAP_STYLE}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsCompass={false}
        showsTraffic={false}
        showsBuildings={true}
        showsIndoors={false}
        rotateEnabled={true}
        pitchEnabled={false}
        mapType="standard"
        onMapReady={onMapReady}
      >
        {/* Route casing (dark border behind the route line, like Google Maps / Uber) */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="rgba(15, 74, 43, 0.6)"
            strokeWidth={8}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Main vibrant emerald route line */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={Colors.primaryVibrant || '#10B981'}
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Pickup Pin — green circle with radio icon */}
        {pickupLocation && (
          <Marker
            coordinate={pickupLocation}
            title="Pickup"
            description={pickupAddress || 'Current Location'}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
          >
            <View style={styles.pickupPinContainer}>
              <View style={styles.pinBubbleGreen}>
                <Ionicons name="radio-button-on" size={16} color={Colors.white} />
              </View>
              <View style={styles.pinStemGreen} />
            </View>
          </Marker>
        )}

        {/* Dropoff Pin — red teardrop with location icon */}
        {dropoffLocation && (
          <Marker
            coordinate={dropoffLocation}
            title="Drop-off"
            description={dropoffAddress || 'Destination'}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
          >
            <View style={styles.dropoffPinContainer}>
              <View style={styles.pinBubbleRed}>
                <Ionicons name="location-sharp" size={18} color={Colors.white} />
              </View>
              <View style={styles.pinStemRed} />
            </View>
          </Marker>
        )}

        {/* Live animated driver marker — LERP smooth movement */}
        {driverLocation && (
          <AnimatedCarMarker
            coordinate={driverLocation}
            bearing={driverBearing}
            duration={3000}
            vehicleType={driverVehicleType}
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
  },
  pickupPinContainer: {
    alignItems: 'center',
  },
  pinBubbleGreen: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primaryVibrant || '#10B981',
    borderWidth: 2.5,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  pinStemGreen: {
    width: 3,
    height: 8,
    backgroundColor: Colors.primaryVibrant || '#10B981',
  },
  dropoffPinContainer: {
    alignItems: 'center',
  },
  pinBubbleRed: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.danger || '#EF4444',
    borderWidth: 2.5,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  pinStemRed: {
    width: 3,
    height: 8,
    backgroundColor: Colors.danger || '#EF4444',
  },
});

export default RouteMapView;

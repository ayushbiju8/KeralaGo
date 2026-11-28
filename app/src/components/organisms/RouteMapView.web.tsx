/**
 * Organism: RouteMapView (Web Compatibility)
 *
 * Web-compatible rendering that eliminates react-native-maps Fabric codegen errors
 * while rendering the route geometry, pickup/dropoff markers, and live vehicle telemetry.
 */

import React, { useMemo } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import Svg, { Polyline as SvgPolyline, Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Spacing, FontSize } from '../../constants/theme';
import { decodePolyline, LatLng } from '../../utils/decodePolyline';
import { AnimatedCarMarker } from './AnimatedCarMarker';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

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
  const routeCoordinates = useMemo(() => {
    if (!encodedPolyline) return [];
    return decodePolyline(encodedPolyline);
  }, [encodedPolyline]);

  // Project geographic coordinates into SVG viewport space [0..width, 0..height]
  const { pointsString, pickupPos, dropoffPos, driverPos } = useMemo(() => {
    const allCoords: LatLng[] = [...routeCoordinates];
    if (pickupLocation) allCoords.push(pickupLocation);
    if (dropoffLocation) allCoords.push(dropoffLocation);
    if (driverLocation) allCoords.push(driverLocation);

    if (allCoords.length === 0) {
      return { pointsString: '', pickupPos: null, dropoffPos: null, driverPos: null };
    }

    let minLat = allCoords[0].latitude;
    let maxLat = allCoords[0].latitude;
    let minLng = allCoords[0].longitude;
    let maxLng = allCoords[0].longitude;

    for (const c of allCoords) {
      if (c.latitude < minLat) minLat = c.latitude;
      if (c.latitude > maxLat) maxLat = c.latitude;
      if (c.longitude < minLng) minLng = c.longitude;
      if (c.longitude > maxLng) maxLng = c.longitude;
    }

    const latSpan = Math.max(maxLat - minLat, 0.005);
    const lngSpan = Math.max(maxLng - minLng, 0.005);

    const padding = 60;
    const w = WINDOW_WIDTH;
    const h = WINDOW_HEIGHT;

    const project = (coord: LatLng) => {
      // Invert latitude because SVG Y increases downward
      const x = padding + ((coord.longitude - minLng) / lngSpan) * (w - padding * 2);
      const y = h - padding - ((coord.latitude - minLat) / latSpan) * (h - padding * 2);
      return { x, y };
    };

    const pts = routeCoordinates.map((c) => {
      const p = project(c);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(' ');

    return {
      pointsString: pts,
      pickupPos: pickupLocation ? project(pickupLocation) : null,
      dropoffPos: dropoffLocation ? project(dropoffLocation) : null,
      driverPos: driverLocation ? project(driverLocation) : null,
    };
  }, [routeCoordinates, pickupLocation, dropoffLocation, driverLocation]);

  React.useEffect(() => {
    if (onMapReady) onMapReady();
  }, [onMapReady]);

  return (
    <View style={styles.container}>
      {/* Background stylized grid for web rendering */}
      <View style={styles.mapGrid}>
        <View style={styles.gridLineHorizontal} />
        <View style={styles.gridLineHorizontal2} />
        <View style={styles.gridLineVertical} />
        <View style={styles.waterFeature} />
      </View>

      {/* SVG Route Geometry */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="routeGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#2563EB" stopOpacity="1" />
            <Stop offset="1" stopColor="#3B82F6" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {pointsString ? (
          <>
            {/* Route glow / shadow */}
            <SvgPolyline
              points={pointsString}
              fill="none"
              stroke="rgba(59, 130, 246, 0.3)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Main thick blue route line */}
            <SvgPolyline
              points={pointsString}
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : null}
      </Svg>

      {/* Pickup Marker */}
      {pickupPos && (
        <View style={[styles.markerAbsolute, { left: pickupPos.x - 16, top: pickupPos.y - 36 }]}>
          <View style={styles.pinBubbleGreen}>
            <Ionicons name="radio-button-on" size={14} color={Colors.white} />
          </View>
          <View style={styles.pinStemGreen} />
        </View>
      )}

      {/* Dropoff Marker */}
      {dropoffPos && (
        <View style={[styles.markerAbsolute, { left: dropoffPos.x - 16, top: dropoffPos.y - 36 }]}>
          <View style={styles.pinBubbleRed}>
            <Ionicons name="location-sharp" size={16} color={Colors.white} />
          </View>
          <View style={styles.pinStemRed} />
        </View>
      )}

      {/* Live Animated Driver Car Marker */}
      {driverPos && driverLocation && (
        <View style={[styles.markerAbsolute, { left: driverPos.x - 24, top: driverPos.y - 24 }]}>
          <AnimatedCarMarker
            coordinate={driverLocation}
            bearing={driverBearing}
            duration={3000}
            vehicleType={driverVehicleType}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#EEF2F6', // Subtle map terrain gray
  },
  mapGrid: {
    ...StyleSheet.absoluteFill,
    opacity: 0.6,
  },
  gridLineHorizontal: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: '#E2E8F0',
  },
  gridLineHorizontal2: {
    position: 'absolute',
    top: '65%',
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: '#E2E8F0',
  },
  gridLineVertical: {
    position: 'absolute',
    left: '45%',
    top: 0,
    bottom: 0,
    width: 14,
    backgroundColor: '#E2E8F0',
  },
  waterFeature: {
    position: 'absolute',
    left: '10%',
    top: '20%',
    width: 120,
    height: 220,
    borderRadius: 60,
    backgroundColor: '#DBEAFE',
    opacity: 0.5,
  },
  markerAbsolute: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 50,
  },
  pinBubbleGreen: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryVibrant || '#10B981',
    borderWidth: 2,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  pinStemGreen: {
    width: 3,
    height: 6,
    backgroundColor: Colors.primaryVibrant || '#10B981',
  },
  pinBubbleRed: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.danger || '#EF4444',
    borderWidth: 2,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  pinStemRed: {
    width: 3,
    height: 6,
    backgroundColor: Colors.danger || '#EF4444',
  },
});

export default RouteMapView;

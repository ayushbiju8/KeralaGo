/**
 * Organism: AnimatedCarMarker (Native: iOS / Android)
 *
 * Uses react-native-maps Marker.Animated and AnimatedRegion for native platforms.
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Platform } from 'react-native';
import { Marker, AnimatedRegion } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/theme';
import { LatLng } from '../../utils/decodePolyline';
import { calculateBearing } from '../../utils/geoMath';

export interface AnimatedCarMarkerProps {
  coordinate: LatLng;
  bearing?: number;
  duration?: number;
  vehicleType?: 'car' | 'auto';
}

export const AnimatedCarMarker: React.FC<AnimatedCarMarkerProps> = ({
  coordinate,
  bearing,
  duration = 3000,
  vehicleType = 'car',
}) => {
  const animatedCoordinate = useRef(
    new AnimatedRegion({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    })
  ).current;

  const animatedBearing = useRef(new Animated.Value(bearing || 0)).current;
  const prevCoordRef = useRef<LatLng>(coordinate);
  const currentBearingRef = useRef<number>(bearing || 0);

  useEffect(() => {
    const prev = prevCoordRef.current;
    const target = coordinate;

    if (prev.latitude === target.latitude && prev.longitude === target.longitude) {
      return;
    }

    const targetBearing =
      typeof bearing === 'number'
        ? bearing
        : calculateBearing(prev, target);

    const prevBearing = currentBearingRef.current;
    let diffBearing = (targetBearing - prevBearing) % 360;
    if (diffBearing > 180) diffBearing -= 360;
    if (diffBearing < -180) diffBearing += 360;
    const continuousTargetBearing = prevBearing + diffBearing;

    animatedCoordinate
      .timing({
        latitude: target.latitude,
        longitude: target.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
        duration,
      } as any)
      .start();

    Animated.timing(animatedBearing, {
      toValue: continuousTargetBearing,
      duration: duration * 0.7,
      useNativeDriver: false,
    }).start(() => {
      currentBearingRef.current = continuousTargetBearing % 360;
    });

    prevCoordRef.current = target;
  }, [coordinate.latitude, coordinate.longitude, bearing, duration]);

  const rotationInterpolate = animatedBearing.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  return (
    <Marker.Animated
      coordinate={animatedCoordinate as any}
      anchor={{ x: 0.5, y: 0.5 }}
      flat={true}
    >
      <Animated.View
        style={[
          styles.markerContainer,
          {
            transform: [{ rotate: rotationInterpolate }],
          },
        ]}
      >
        <View style={styles.radarHalo} />
        <View style={styles.vehicleBubble}>
          <Ionicons
            name={vehicleType === 'auto' ? 'flash' : 'car'}
            size={18}
            color={Colors.white}
          />
        </View>
      </Animated.View>
    </Marker.Animated>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarHalo: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  vehicleBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
});

export default AnimatedCarMarker;

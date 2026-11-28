/**
 * Organism: AnimatedCarMarker (Web Compatibility)
 *
 * Web-safe marker rendering that avoids importing native-only Fabric codegen modules.
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
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
  const animatedBearing = useRef(new Animated.Value(bearing || 0)).current;
  const prevCoordRef = useRef<LatLng>(coordinate);
  const currentBearingRef = useRef<number>(bearing || 0);

  useEffect(() => {
    const prev = prevCoordRef.current;
    const target = coordinate;

    const targetBearing =
      typeof bearing === 'number' ? bearing : calculateBearing(prev, target);

    const prevB = currentBearingRef.current;
    let diffB = (targetBearing - prevB) % 360;
    if (diffB > 180) diffB -= 360;
    if (diffB < -180) diffB += 360;
    const continuousBearing = prevB + diffB;

    Animated.timing(animatedBearing, {
      toValue: continuousBearing,
      duration: duration * 0.7,
      useNativeDriver: false,
    }).start(() => {
      currentBearingRef.current = continuousBearing % 360;
    });

    prevCoordRef.current = target;
  }, [coordinate, bearing, duration]);

  const rotationInterpolate = animatedBearing.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  return (
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

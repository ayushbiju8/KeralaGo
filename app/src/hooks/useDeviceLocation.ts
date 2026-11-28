/**
 * Hook: useDeviceLocation
 *
 * Phase 1: Captures the user's raw device GPS coordinates with high accuracy
 * using expo-location on native (Android/iOS) and navigator.geolocation on Web.
 * Automatically triggers reverse geocoding to resolve a street address.
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { reverseGeocode } from '../services/googleMapsService';
import { LatLng } from '../utils/decodePolyline';

export interface DeviceLocationState {
  coords: LatLng | null;
  address: string | null;
  isLoading: boolean;
  error: string | null;
  accuracy: number | null;
}

export function useDeviceLocation() {
  const [state, setState] = useState<DeviceLocationState>({
    coords: null,
    address: null,
    isLoading: true,
    error: null,
    accuracy: null,
  });

  const fetchCoordinates = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const kochiFallback: LatLng = { latitude: 9.9816, longitude: 76.2999 };

    try {
      // ── Native (Android / iOS): Use expo-location for real hardware GPS ──
      if (Platform.OS !== 'web') {
        try {
          const Location = await import('expo-location');

          // Request foreground location permission
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            console.warn('[useDeviceLocation] Location permission denied');
            const readableAddress = await reverseGeocode(kochiFallback);
            setState({
              coords: kochiFallback,
              address: readableAddress || 'Kochi, Kerala',
              isLoading: false,
              error: 'Location permission denied',
              accuracy: 50,
            });
            return;
          }

          // Get current GPS position with high accuracy
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });

          const currentCoords: LatLng = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };

          const readableAddress = await reverseGeocode(currentCoords);

          setState({
            coords: currentCoords,
            address: readableAddress || 'Current Location',
            isLoading: false,
            error: null,
            accuracy: pos.coords.accuracy || 10,
          });
          return;
        } catch (nativeErr: any) {
          console.warn('[useDeviceLocation] expo-location error, falling back:', nativeErr.message);
        }
      }

      // ── Web: Use navigator.geolocation ──
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const currentCoords: LatLng = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            };
            const readableAddress = await reverseGeocode(currentCoords);
            setState({
              coords: currentCoords,
              address: readableAddress || 'Current Location',
              isLoading: false,
              error: null,
              accuracy: pos.coords.accuracy || 10,
            });
          },
          (err) => {
            console.warn('[useDeviceLocation] Web geolocation error:', err.message);
            setState({
              coords: kochiFallback,
              address: 'MG Road, Ernakulam, Kochi',
              isLoading: false,
              error: err.message,
              accuracy: 50,
            });
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
        );
      } else {
        // Last resort fallback
        const readableAddress = await reverseGeocode(kochiFallback);
        setState({
          coords: kochiFallback,
          address: readableAddress || 'Kochi, Kerala',
          isLoading: false,
          error: null,
          accuracy: 10,
        });
      }
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err.message || 'Failed to obtain GPS coordinates',
      }));
    }
  }, []);

  useEffect(() => {
    fetchCoordinates();
  }, [fetchCoordinates]);

  return {
    ...state,
    refreshLocation: fetchCoordinates,
  };
}

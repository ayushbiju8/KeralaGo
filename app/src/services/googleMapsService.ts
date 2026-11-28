/**
 * Google Maps Platform API & Live Telemetry Service (Web & Mobile)
 *
 * Implements:
 * 1. Current GPS Location capture with Reverse Geocoding
 * 2. Live Google Places Autocomplete API (Real-time address & landmark search)
 * 3. Place Details Geocoding (Exact Lat/Lng coordinates for pinned locations)
 * 4. Google Directions Routing Engine with turn-by-turn geometry & OSRM fallback
 */

import { Platform } from 'react-native';
import { LatLng } from '../utils/decodePolyline';

export const GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  'AIzaSyAAvUnGPNnqkYWc6lUF4ktF6FF5KW66kZo';

export const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5001';

export interface PlacePrediction {
  placeId: string;
  primaryText: string;
  secondaryText: string;
  fullText: string;
  distanceMeters?: number;
  distanceKm?: number;
  distanceText?: string;
}

export interface PlaceLocation {
  latitude: number;
  longitude: number;
  address: string;
  placeId?: string;
  title?: string;
  subtitle?: string;
}

export interface RouteResult {
  path: Array<{ lat: number; lng: number }>;
  distanceKm: number;
  durationMins: number;
  encodedPolyline?: string;
  formattedDuration?: string;
  destStreet?: string;
}

/**
 * Ensures the Google Maps JavaScript SDK is loaded on Web.
 */
export async function ensureGoogleMapsLoaded(): Promise<any> {
  if (Platform.OS !== 'web') return null;

  const patchGeocoder = (maps: any) => {
    if (maps?.Geocoder) {
      maps.Geocoder.prototype.geocode = function (_req: any, callback: any) {
        if (typeof callback === 'function') callback([], 'OK');
        return Promise.resolve({ results: [] });
      };
    }
  };

  const g = (globalThis as any).google;
  if (g?.maps?.Map) {
    patchGeocoder(g.maps);
    return g.maps;
  }

  return new Promise((resolve) => {
    const existing = document.getElementById('google-maps-sdk-script');
    if (existing) {
      existing.addEventListener('load', () => {
        const maps = (globalThis as any).google?.maps;
        patchGeocoder(maps);
        resolve(maps);
      });
      if ((globalThis as any).google?.maps?.Map) {
        const maps = (globalThis as any).google.maps;
        patchGeocoder(maps);
        resolve(maps);
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-sdk-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry,marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const maps = (globalThis as any).google?.maps;
      patchGeocoder(maps);
      resolve(maps);
    };
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
}

/**
 * Capture current GPS coordinates using browser or device location.
 */
export async function getCurrentGPSLocation(): Promise<{
  latitude: number;
  longitude: number;
  address: string;
}> {
  const fallback = {
    latitude: 10.0538,
    longitude: 76.6192,
    address: 'Mar Athanasius College of Engineering, Kothamangalam',
  };

  // ── Native (Android / iOS): Use expo-location for real hardware GPS ──
  if (Platform.OS !== 'web') {
    try {
      const Location = await import('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const addr = await reverseGeocode({ latitude: lat, longitude: lng });
          return { latitude: lat, longitude: lng, address: addr || 'Current Location' };
        } catch {
          return { latitude: lat, longitude: lng, address: `GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})` };
        }
      }
    } catch (nativeErr: any) {
      console.warn('[getCurrentGPSLocation] expo-location error:', nativeErr.message);
    }
    return fallback;
  }

  // ── Web: Use navigator.geolocation ──
  return new Promise((resolve) => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          try {
            const addr = await reverseGeocode({ latitude: lat, longitude: lng });
            resolve({
              latitude: lat,
              longitude: lng,
              address: addr || 'Current Location',
            });
          } catch {
            resolve({
              latitude: lat,
              longitude: lng,
              address: `GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
            });
          }
        },
        (err) => {
          console.warn('[Geolocation] Position unavailable, using default center:', err.message);
          resolve(fallback);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
      );
    } else {
      resolve(fallback);
    }
  });
}

/**
 * Reverse Geocode: Convert Lat/Lng into a human-readable street address.
 * Uses high-reliability Kerala landmark proximity check & OpenStreetMap Nominatim reverse geocoding.
 * (Bypasses Google Maps billing-gated Geocoding API)
 */
export async function reverseGeocode(coords: LatLng): Promise<string> {
  // 1. Proximity check against primary Kerala campus landmark (MACE)
  const dLat = coords.latitude - 10.0538;
  const dLng = coords.longitude - 76.6192;
  const distFromMACE = Math.sqrt(dLat * dLat + dLng * dLng);
  if (distFromMACE < 0.003) {
    return 'Mar Athanasius College of Engineering, Kothamangalam';
  }

  // 2. OpenStreetMap Nominatim reverse geocode (Free, no billing or key required)
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.display_name) {
        // Return a clean, concise address (first 3-4 segments)
        const parts = data.display_name.split(',');
        if (parts.length > 2) {
          return parts.slice(0, 3).map((p: string) => p.trim()).join(', ');
        }
        return data.display_name;
      }
    }
  } catch (err) {
    console.warn('[ReverseGeocode] Nominatim error, falling back:', err);
  }

  return `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
}

export interface AutocompleteOptions {
  origin?: { latitude: number; longitude: number };
  sessionToken?: string;
  radiusMeters?: number;
}

/**
 * Queries Google Places Autocomplete API for search suggestions.
 * Uses Google Places API (New) with origin proximity bias & distance calculation.
 * Returns suggestions sorted by distance from the user's pickup / current location.
 */
export async function fetchPlacesAutocomplete(
  query: string,
  optionsOrToken?: string | AutocompleteOptions
): Promise<PlacePrediction[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const cleanQuery = query.trim();

  // Extract origin coordinates (from "from" location / pickup)
  const origin =
    typeof optionsOrToken === 'object' && optionsOrToken?.origin
      ? optionsOrToken.origin
      : { latitude: 10.0538, longitude: 76.6192 };

  // Max radius for Google Places API (New) circle is 50,000 meters
  const radius = Math.min(
    50000.0,
    typeof optionsOrToken === 'object' && optionsOrToken?.radiusMeters
      ? optionsOrToken.radiusMeters
      : 50000.0
  );

  // 1. Primary: Google Places API (New) REST Endpoint with origin & locationBias
  if (GOOGLE_MAPS_API_KEY) {
    try {
      const newPlacesRes = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        },
        body: JSON.stringify({
          input: cleanQuery,
          includedRegionCodes: ['in'],
          origin: {
            latitude: origin.latitude,
            longitude: origin.longitude,
          },
          locationBias: {
            circle: {
              center: {
                latitude: origin.latitude,
                longitude: origin.longitude,
              },
              radius: radius,
            },
          },
        }),
      });

      if (newPlacesRes.ok) {
        const newPlacesData = await newPlacesRes.json();
        if (newPlacesData.suggestions && newPlacesData.suggestions.length > 0) {
          const list: PlacePrediction[] = newPlacesData.suggestions.map((s: any) => {
            const pred = s.placePrediction;
            const distM = pred?.distanceMeters;
            const distKm =
              typeof distM === 'number' ? Math.round((distM / 1000) * 10) / 10 : undefined;
            const distText =
              typeof distM === 'number'
                ? distM < 1000
                  ? `${distM} m`
                  : `${distKm} km`
                : undefined;

            return {
              placeId: pred?.placeId,
              primaryText: pred?.structuredFormat?.mainText?.text || pred?.text?.text || cleanQuery,
              secondaryText: pred?.structuredFormat?.secondaryText?.text || '',
              fullText: pred?.text?.text || '',
              distanceMeters: distM,
              distanceKm: distKm,
              distanceText: distText,
            };
          });

          // Sort suggestions by proximity from the user's "from" location
          list.sort((a, b) => {
            if (typeof a.distanceMeters === 'number' && typeof b.distanceMeters === 'number') {
              return a.distanceMeters - b.distanceMeters;
            }
            if (typeof a.distanceMeters === 'number') return -1;
            if (typeof b.distanceMeters === 'number') return 1;
            return 0;
          });

          return list;
        }
      } else {
        const errJson = await newPlacesRes.json().catch(() => ({}));
        console.warn('[PlacesAutocomplete] API responded non-ok:', newPlacesRes.status, errJson);
      }
    } catch (newPlacesErr) {
      console.warn('[PlacesAutocomplete] Places (New) fetch error:', newPlacesErr);
    }
  }

  // 2. OpenStreetMap / Nominatim fallback biased around the user's origin
  try {
    const lat = origin.latitude;
    const lng = origin.longitude;
    const viewbox = `${(lng - 0.5).toFixed(3)},${(lat + 0.5).toFixed(3)},${(lng + 0.5).toFixed(3)},${(lat - 0.5).toFixed(3)}`;
    const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      cleanQuery
    )}&countrycodes=in&viewbox=${viewbox}&bounded=0&limit=8`;

    const res = await fetch(osmUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (res.ok) {
      const osmData = await res.json();
      if (Array.isArray(osmData) && osmData.length > 0) {
        return osmData.map((item: any) => {
          const parts = (item.display_name || '').split(',');
          const primary = parts[0]?.trim() || item.name || cleanQuery;
          const secondary = parts.slice(1, 4).join(',').trim();
          const itemLat = parseFloat(item.lat);
          const itemLng = parseFloat(item.lon);
          let distKm: number | undefined;
          let distText: string | undefined;
          if (!isNaN(itemLat) && !isNaN(itemLng)) {
            const dLat = itemLat - lat;
            const dLng = itemLng - lng;
            distKm = Math.round(Math.sqrt(dLat * dLat + dLng * dLng) * 111 * 10) / 10;
            distText = `${distKm} km`;
          }
          return {
            placeId: `osm_${item.osm_id}_${item.lat}_${item.lon}`,
            primaryText: primary,
            secondaryText: secondary,
            fullText: item.display_name,
            distanceKm: distKm,
            distanceText: distText,
          };
        });
      }
    }
  } catch (osmErr) {
    console.warn('[PlacesAutocomplete] Fallback search error:', osmErr);
  }

  return [];
}

/**
 * Resolves a place prediction into precise geographic coordinates (Lat/Lng).
 * Uses Places API (New) REST details endpoint.
 */
export async function fetchPlaceCoordinates(
  placeId: string,
  sessionToken?: string
): Promise<PlaceLocation | null> {
  if (!placeId) return null;

  // Handle OSM synthetic ID: "osm_id_lat_lon"
  if (placeId.startsWith('osm_')) {
    if (placeId.startsWith('osm_local_')) {
      const key = decodeURIComponent(placeId.replace('osm_local_', ''));
      const fallbackLat = 10.0538;
      const fallbackLng = 76.6192;
      return {
        latitude: fallbackLat,
        longitude: fallbackLng,
        address: key,
        placeId,
        title: key,
      };
    }
    const parts = placeId.split('_');
    if (parts.length >= 4) {
      const lat = parseFloat(parts[2]);
      const lng = parseFloat(parts[3]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return {
          latitude: lat,
          longitude: lng,
          address: 'Selected Location',
          placeId,
        };
      }
    }
  }

  // 1. Primary: Google Places API (New) REST Endpoint
  if (GOOGLE_MAPS_API_KEY) {
    try {
      const newDetailRes = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
        headers: {
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,location',
        },
      });
      if (newDetailRes.ok) {
        const newDetail = await newDetailRes.json();
        if (newDetail?.location) {
          return {
            latitude: newDetail.location.latitude,
            longitude: newDetail.location.longitude,
            address: newDetail.formattedAddress || newDetail.displayName?.text || 'Selected Location',
            placeId,
            title: newDetail.displayName?.text || newDetail.formattedAddress,
            subtitle: newDetail.formattedAddress,
          };
        }
      }
    } catch (newDetailErr) {
      console.warn('[PlaceDetails] Places (New) details fetch error:', newDetailErr);
    }
  }

  // 2. REST API legacy fallback
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address,name&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === 'OK' && data.result?.geometry?.location) {
      const loc = data.result.geometry.location;
      return {
        latitude: loc.lat,
        longitude: loc.lng,
        address: data.result.formatted_address || data.result.name,
        placeId,
        title: data.result.name,
        subtitle: data.result.formatted_address,
      };
    }
  } catch (error) {
    console.error('[PlaceDetails] Network error:', error);
  }

  return null;
}

/**
 * Calculates real driving road route between pickup and dropoff coordinates.
 * Priority:
 * 1. Google Routes API (New) — REST endpoint (replaces legacy DirectionsService)
 * 2. OSRM real driving road network (free, no API key needed)
 */
export async function calculateDrivingRoute(
  pickup: LatLng,
  dropoff: LatLng
): Promise<RouteResult> {
  // 1. Google Routes API (New) — works on both Web and Native
  if (GOOGLE_MAPS_API_KEY) {
    try {
      const routesRes = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask':
            'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.endLocation,routes.legs.duration,routes.legs.distanceMeters',
        },
        body: JSON.stringify({
          origin: {
            location: {
              latLng: { latitude: pickup.latitude, longitude: pickup.longitude },
            },
          },
          destination: {
            location: {
              latLng: { latitude: dropoff.latitude, longitude: dropoff.longitude },
            },
          },
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE',
          computeAlternativeRoutes: false,
          languageCode: 'en-IN',
          units: 'METRIC',
        }),
      });

      if (routesRes.ok) {
        const routesData = await routesRes.json();
        const route = routesData?.routes?.[0];
        if (route) {
          const distKm = Math.round((route.distanceMeters / 1000) * 10) / 10;
          const durSecs = parseInt(route.duration?.replace('s', '') || '300', 10);
          const durMins = Math.round(durSecs / 60);
          const encoded = route.polyline?.encodedPolyline || '';

          // Decode the encoded polyline into {lat, lng} path
          const { decodePolyline } = await import('../utils/decodePolyline');
          const decoded = decodePolyline(encoded);
          const path = decoded.map((c) => ({ lat: c.latitude, lng: c.longitude }));

          return {
            path: path.length > 0 ? path : [
              { lat: pickup.latitude, lng: pickup.longitude },
              { lat: dropoff.latitude, lng: dropoff.longitude },
            ],
            distanceKm: distKm,
            durationMins: durMins,
            encodedPolyline: encoded,
            formattedDuration: `${durMins} min${durMins !== 1 ? 's' : ''}`,
            destStreet: route.legs?.[0]?.endLocation?.latLng
              ? `${route.legs[0].endLocation.latLng.latitude.toFixed(4)}, ${route.legs[0].endLocation.latLng.longitude.toFixed(4)}`
              : undefined,
          };
        }
      }
    } catch (routesErr) {
      console.warn('[Directions] Routes API (New) failed, using OSRM fallback:', routesErr);
    }
  }

  // 2. OSRM Real Road Driving Network
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${pickup.longitude},${pickup.latitude};${dropoff.longitude},${dropoff.latitude}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coords: [number, number][] = route.geometry.coordinates;
        const path = coords.map(([lng, lat]) => ({ lat, lng }));
        const destStreet = data.waypoints?.[1]?.name?.trim();
        const distKm = Math.round((route.distance / 1000) * 10) / 10;
        const durMins = Math.round(route.duration / 60);

        return {
          path,
          distanceKm: distKm,
          durationMins: durMins,
          destStreet: destStreet || undefined,
          formattedDuration: `${durMins} mins`,
        };
      }
    }
  } catch (osrmErr) {
    console.warn('[Directions] OSRM route fetch error:', osrmErr);
  }

  // Direct line fallback
  const dLat = dropoff.latitude - pickup.latitude;
  const dLng = dropoff.longitude - pickup.longitude;
  const straightDist = Math.round(Math.sqrt(dLat * dLat + dLng * dLng) * 111 * 10) / 10;
  return {
    path: [
      { lat: pickup.latitude, lng: pickup.longitude },
      { lat: dropoff.latitude, lng: dropoff.longitude },
    ],
    distanceKm: Math.max(1.0, straightDist),
    durationMins: Math.max(3, Math.round(straightDist * 2.2)),
    formattedDuration: `${Math.max(3, Math.round(straightDist * 2.2))} mins`,
  };
}

/**
 * Encodes an array of { lat, lng } points into a Google Maps encoded polyline string.
 * Implements the standard Google Polyline Encoding Algorithm.
 */
export function encodePathToPolyline(path: Array<{ lat: number; lng: number }>): string {
  let output = '';
  let prevLat = 0;
  let prevLng = 0;

  const encodeValue = (value: number): string => {
    let v = Math.round(value * 1e5);
    v = v < 0 ? ~(v << 1) : v << 1;
    let result = '';
    while (v >= 0x20) {
      result += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
      v >>= 5;
    }
    result += String.fromCharCode(v + 63);
    return result;
  };

  for (const point of path) {
    output += encodeValue(point.lat - prevLat);
    output += encodeValue(point.lng - prevLng);
    prevLat = point.lat;
    prevLng = point.lng;
  }
  return output;
}

/**
 * Calculates a traffic-aware driving route between pickup and dropoff.
 * Returns an encoded polyline string compatible with react-native-maps Polyline decoding,
 * along with distance, ETA, and formatted duration.
 *
 * Used by MapScreen.tsx for full-screen routing flow.
 */
export async function calculateRouteWithBackend(
  pickup: LatLng,
  dropoff: LatLng
): Promise<{
  encodedPolyline: string;
  distanceKm: number;
  etaMinutes: number;
  formattedDuration: string;
}> {
  const result = await calculateDrivingRoute(pickup, dropoff);
  const encodedPolyline = encodePathToPolyline(result.path);
  return {
    encodedPolyline,
    distanceKm: result.distanceKm,
    etaMinutes: result.durationMins,
    formattedDuration: result.formattedDuration || `${result.durationMins} mins`,
  };
}

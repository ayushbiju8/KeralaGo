import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  Platform,
  TouchableOpacity,
  ViewStyle,
  Animated,
} from 'react-native';
import Icon from '../atoms/Icon';
import Typography from '../atoms/Typography';
import { Colors, Shadows, Radii } from '../../constants/theme';
import { calculateDrivingRoute, reverseGeocode } from '../../services/googleMapsService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  'AIzaSyAAvUnGPNnqkYWc6lUF4ktF6FF5KW66kZo';

let NativeMapView: any = null;
let NativeMarker: any = null;
let NativePolyline: any = null;

if (Platform.OS !== 'web') {
  try {
    const maps = require('react-native-maps');
    NativeMapView = maps.default || maps.MapView;
    NativeMarker = maps.Marker;
    NativePolyline = maps.Polyline;
  } catch (err) {
    console.warn('[KeralaMapBackground] react-native-maps not loaded:', err);
  }
}

export interface LocationPoint {
  title: string;
  lat: number;
  lng: number;
  top?: number;
  left?: number;
  subtitle?: string;
  distanceKm?: number;
  durationMins?: number;
}

export const KNOWN_LOCATIONS: Record<string, LocationPoint> = {
  'Mar Athanasius College of Engineering': {
    title: 'Mar Athanasius College of Engineering',
    lat: 10.0538,
    lng: 76.6192,
    top: SCREEN_HEIGHT * 0.225,
    left: SCREEN_WIDTH * 0.38,
    subtitle: 'College Junction, Kothamangalam',
  },
  'M B Hostel': {
    title: 'M B Hostel',
    lat: 10.0570,
    lng: 76.6230,
    top: SCREEN_HEIGHT * 0.32,
    left: SCREEN_WIDTH * 0.60,
    subtitle: 'Near MACE, Kothamangalam',
  },
  'kattuchira': {
    title: 'kattuchira',
    lat: 10.0490,
    lng: 76.6260,
    top: SCREEN_HEIGHT * 0.40,
    left: SCREEN_WIDTH * 0.70,
    subtitle: 'College Road, Kothamangalam',
  },
  'Kozhippilly Junction': {
    title: 'Kozhippilly Junction',
    lat: 10.0610,
    lng: 76.6120,
    top: SCREEN_HEIGHT * 0.12,
    left: SCREEN_WIDTH * 0.25,
    subtitle: 'Aluva - Munnar Highway, Kothamangalam',
  },
  'St. George Basilica': {
    title: 'St. George Basilica',
    lat: 10.0630,
    lng: 76.6280,
    top: SCREEN_HEIGHT * 0.18,
    left: SCREEN_WIDTH * 0.75,
    subtitle: 'High School Rd, Kothamangalam',
  },
  'KSRTC Bus Stand': {
    title: 'KSRTC Bus Stand',
    lat: 10.0585,
    lng: 76.6210,
    top: SCREEN_HEIGHT * 0.15,
    left: SCREEN_WIDTH * 0.48,
    subtitle: 'Main KSRTC Terminal, Kothamangalam',
  },
  'Aluva Metro Station': {
    title: 'Aluva Metro Station',
    lat: 10.1098,
    lng: 76.3533,
    top: SCREEN_HEIGHT * 0.10,
    left: SCREEN_WIDTH * 0.18,
    subtitle: 'Kochi Metro Feeder Terminal, Aluva',
  },
};

export const findNearestOrFormatLocation = (lat: number, lng: number): LocationPoint => {
  let closestKey = '';
  let minDistance = Infinity;

  for (const [key, loc] of Object.entries(KNOWN_LOCATIONS)) {
    const dLat = loc.lat - lat;
    const dLng = loc.lng - lng;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    if (dist < minDistance) {
      minDistance = dist;
      closestKey = key;
    }
  }

  // If within ~500m of a known location, snap to landmark
  if (minDistance < 0.005 && closestKey) {
    const loc = KNOWN_LOCATIONS[closestKey];
    return {
      title: loc.title,
      subtitle: loc.subtitle || 'Kothamangalam',
      lat: loc.lat,
      lng: loc.lng,
      top: loc.top,
      left: loc.left,
    };
  }

  // If within ~1.5km of a known location, specify near landmark
  if (minDistance < 0.015 && closestKey) {
    return {
      title: `Near ${closestKey}`,
      subtitle: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
      lat,
      lng,
      top: SCREEN_HEIGHT * 0.28,
      left: SCREEN_WIDTH * 0.55,
    };
  }

  return {
    title: 'Pinned Destination',
    subtitle: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
    lat,
    lng,
    top: SCREEN_HEIGHT * 0.28,
    left: SCREEN_WIDTH * 0.55,
  };
};

/**
 * Fetches real driving route following actual roads from OSRM
 */
export const fetchRoadRoute = async (
  pLat: number,
  pLng: number,
  dLat: number,
  dLng: number
): Promise<{
  path: Array<{ lat: number; lng: number }>;
  distanceKm: number;
  durationMins: number;
  destStreet?: string;
} | null> => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${pLng},${pLat};${dLng},${dLat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const coords: [number, number][] = route.geometry.coordinates;
      const path = coords.map(([lng, lat]) => ({ lat, lng }));
      const destStreet = data.waypoints?.[1]?.name?.trim();
      return {
        path,
        distanceKm: Math.round((route.distance / 1000) * 10) / 10,
        durationMins: Math.round(route.duration / 60),
        destStreet: destStreet || undefined,
      };
    }
  } catch (err) {
    console.warn('Real road route fetch error:', err);
  }
  return null;
};

export const getLocationPoint = (name?: string | null): LocationPoint => {
  if (!name) return KNOWN_LOCATIONS['Mar Athanasius College of Engineering'];
  if (KNOWN_LOCATIONS[name]) return KNOWN_LOCATIONS[name];
  const lower = name.toLowerCase();
  for (const key of Object.keys(KNOWN_LOCATIONS)) {
    if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) {
      return KNOWN_LOCATIONS[key];
    }
  }
  return {
    title: name,
    lat: 10.0560,
    lng: 76.6220,
    top: SCREEN_HEIGHT * 0.32,
    left: SCREEN_WIDTH * 0.60,
    subtitle: 'Kothamangalam',
  };
};

export interface KeralaMapBackgroundProps {
  showVehicles?: boolean;
  activeDestination?: string | null;
  pickupLocation?: string;
  pickupCoords?: { lat: number; lng: number } | null;
  variant?: 'customer' | 'driver';
  height?: number;
  offsetY?: number;
  style?: ViewStyle;
  onLocatePress?: () => void;
  onLayersPress?: () => void;
  onNavigatePress?: () => void;
  /** Callback triggered when user taps/pins a location on the map */
  onMapClick?: (point: LocationPoint) => void;
  /** Whether the map is in interactive pin-on-map mode */
  isPinMode?: boolean;
  /** Explicitly pinned dropoff point */
  pinnedPoint?: LocationPoint | null;
  destinationPoint?: LocationPoint | null;
  destinationCoords?: { lat: number; lng: number } | null;
  /** Live real-time driver GPS coordinates streaming from telemetry socket */
  driverCoords?: { lat: number; lng: number; bearing?: number; vehicleType?: 'car' | 'auto' | 'bike' } | null;
}

/**
 * Reusable Mini Vehicle Component for the Map Overlay
 */
const MapVehicle: React.FC<{
  type: 'car' | 'auto' | 'bike';
  rotation?: string;
  style?: any;
}> = ({ type, rotation = '0deg', style }) => {
  if (type === 'car') {
    return (
      <View style={[styles.vehicleContainer, { transform: [{ rotate: rotation }] }, style]}>
        <View style={styles.carBody}>
          <View style={styles.carWindshieldFront} />
          <View style={styles.carRoof} />
          <View style={styles.carWindshieldRear} />
        </View>
      </View>
    );
  }

  if (type === 'auto') {
    return (
      <View style={[styles.vehicleContainer, { transform: [{ rotate: rotation }] }, style]}>
        <View style={styles.autoBody}>
          <View style={styles.autoYellowRoof}>
            <View style={styles.autoWindshield} />
          </View>
          <View style={styles.autoGreenBase} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.vehicleContainer, { transform: [{ rotate: rotation }] }, style]}>
      <View style={styles.bikeBody}>
        <View style={styles.bikeWheelFront} />
        <View style={styles.bikeTank} />
        <View style={styles.bikeWheelRear} />
      </View>
    </View>
  );
};

// Lush Green KeralaGO Custom Google Maps Styling matching reference UI
const KERALA_MAP_STYLE = [
  { featureType: 'all', elementType: 'geometry', stylers: [{ color: '#F0F5F1' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#D7EEDF' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#CEEAD6' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#93C5FD' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#2563EB' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#E2E8F0' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#F8FAFC' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#CBD5E1' }] },
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'all', stylers: [{ visibility: 'off' }] },
];

/**
 * Molecule: KeralaMapBackground
 *
 * Real Live Google Map of Kothamangalam / Mar Athanasius College of Engineering:
 * - Direct Google Maps JavaScript SDK instance on Web for both Customer & Driver pages
 * - Interactive zooming, panning, and real-time street map rendering
 * - Prominent "Pickup Point >" callout with pin in customer mode
 * - Driver location beacon, Highway 85 / MACE landmarks & floating map controls in driver mode
 * - Stationed live vehicles (sedans, auto-rickshaws, bikes) on real streets
 * - Dynamic route polyline when selecting destinations
 */
const KeralaMapBackground: React.FC<KeralaMapBackgroundProps> = ({
  showVehicles = true,
  activeDestination,
  pickupLocation,
  pickupCoords = null,
  variant = 'customer',
  height: customHeight,
  offsetY = 0,
  style,
  onLocatePress,
  onLayersPress,
  onNavigatePress,
  onMapClick,
  isPinMode = false,
  pinnedPoint = null,
  destinationPoint = null,
  destinationCoords = null,
  driverCoords = null,
}) => {
  const mapDivRef = useRef<any>(null);
  const googleMapInstance = useRef<any>(null);
  const pickupMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const directionsServiceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const routeCasingPolylineRef = useRef<any>(null);
  const mapClickListenerRef = useRef<any>(null);
  const etaWindowRef = useRef<any>(null);

  const isPinModeRef = useRef(isPinMode);
  isPinModeRef.current = isPinMode;

  const pinBounceAnim = useRef(new Animated.Value(0)).current;
  const pinShadowScale = useRef(new Animated.Value(1)).current;
  const pinShadowOpacity = useRef(new Animated.Value(0.7)).current;

  const liftPin = () => {
    Animated.parallel([
      Animated.timing(pinBounceAnim, {
        toValue: -18,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(pinShadowScale, {
        toValue: 0.55,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(pinShadowOpacity, {
        toValue: 0.35,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const dropPin = () => {
    Animated.parallel([
      Animated.spring(pinBounceAnim, {
        toValue: 0,
        friction: 6,
        tension: 110,
        useNativeDriver: true,
      }),
      Animated.spring(pinShadowScale, {
        toValue: 1,
        friction: 6,
        tension: 110,
        useNativeDriver: true,
      }),
      Animated.timing(pinShadowOpacity, {
        toValue: 0.7,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const isDriver = variant === 'driver';
  const pickupPoint = pickupCoords
    ? {
        title: pickupLocation || 'Pickup Location',
        lat: pickupCoords.lat,
        lng: pickupCoords.lng,
        top: 0,
        left: 0,
      }
    : getLocationPoint(pickupLocation || (isDriver ? 'Mar Athanasius College of Engineering' : undefined));

  const destPoint =
    pinnedPoint ||
    destinationPoint ||
    (destinationCoords
      ? {
          title: activeDestination || 'Destination',
          lat: destinationCoords.lat,
          lng: destinationCoords.lng,
          top: 0,
          left: 0,
        }
      : null) ||
    (activeDestination ? getLocationPoint(activeDestination) : null);

  // Sync Google Maps markers & route on activeDestination / pickupLocation change
  const syncGoogleMapRoute = () => {
    const google = (globalThis as any).google;
    if (!google?.maps || !googleMapInstance.current) return;

    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }
    if (routeCasingPolylineRef.current) {
      routeCasingPolylineRef.current.setMap(null);
      routeCasingPolylineRef.current = null;
    }
    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setMap(null);
      pickupMarkerRef.current = null;
    }
    if (destMarkerRef.current) {
      destMarkerRef.current.setMap(null);
      destMarkerRef.current = null;
    }
    if (etaWindowRef.current) {
      if (typeof etaWindowRef.current.setMap === 'function') {
        etaWindowRef.current.setMap(null);
      } else if (typeof etaWindowRef.current.close === 'function') {
        etaWindowRef.current.close();
      }
      etaWindowRef.current = null;
    }

    const pLatLng = new google.maps.LatLng(pickupPoint.lat, pickupPoint.lng);

    // Current Location Pin ("Where we are currently in") with pulsing halo and callout pill
    const userAvatarSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg width="60" height="74" viewBox="0 0 60 74" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="pillShadow" x="0" y="0" width="60" height="34" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.22"/>
    </filter>
  </defs>
  <!-- Floating Callout Pill -->
  <g filter="url(#pillShadow)">
    <rect x="4" y="2" width="52" height="20" rx="10" fill="#065F46"/>
    <text x="30" y="15" fill="#FFFFFF" font-size="8.5" font-family="-apple-system, sans-serif" font-weight="700" text-anchor="middle" letter-spacing="0.4">YOU ARE HERE</text>
    <path d="M26 22 L30 26 L34 22 Z" fill="#065F46"/>
  </g>
  <!-- Outer Soft Mint Radar Ring -->
  <circle cx="30" cy="50" r="18" fill="#10B981" fill-opacity="0.18"/>
  <circle cx="30" cy="50" r="13" fill="#10B981" fill-opacity="0.32"/>
  <!-- Crisp White Ring -->
  <circle cx="30" cy="50" r="9.5" fill="#FFFFFF"/>
  <!-- Vibrant Emerald Core -->
  <circle cx="30" cy="50" r="6.5" fill="#059669"/>
  <!-- Center White Dot -->
  <circle cx="30" cy="50" r="2.5" fill="#FFFFFF"/>
</svg>
`)}`;

    pickupMarkerRef.current = new google.maps.Marker({
      position: pLatLng,
      map: googleMapInstance.current,
      title: isDriver ? 'Driver Location' : `You are here: ${pickupPoint.title}`,
      zIndex: 12,
      icon: {
        url: userAvatarSvg,
        scaledSize: new google.maps.Size(60, 74),
        anchor: new google.maps.Point(30, 50),
      },
    });

    // ── Live Moving Driver Vehicle Marker from Telemetry WebSocket ──
    if (driverCoords && googleMapInstance.current) {
      const dPos = new google.maps.LatLng(driverCoords.lat, driverCoords.lng);
      const bearing = Math.round(driverCoords.bearing || 0);
      const driverVehicleSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="carGlow" x="0" y="0" width="44" height="44" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.25"/>
    </filter>
  </defs>
  <g filter="url(#carGlow)" transform="rotate(${bearing}, 22, 22)">
    <circle cx="22" cy="22" r="19" fill="#10B981" fill-opacity="0.2"/>
    <rect x="13.5" y="7" width="17" height="30" rx="8.5" fill="#047857"/>
    <rect x="15" y="8.5" width="14" height="27" rx="7" fill="#10B981"/>
    <path d="M16 14 L28 14 L26 18 L18 18 Z" fill="#064E3B"/>
    <rect x="17" y="19.5" width="10" height="7" rx="2" fill="#F8FAFC"/>
    <path d="M17 28 L27 28 L26 31 L18 31 Z" fill="#064E3B"/>
    <circle cx="16" cy="8" r="1.5" fill="#FEF08A"/>
    <circle cx="28" cy="8" r="1.5" fill="#FEF08A"/>
  </g>
</svg>
`)}`;

      if (driverMarkerRef.current) {
        driverMarkerRef.current.setPosition(dPos);
        driverMarkerRef.current.setIcon({
          url: driverVehicleSvg,
          scaledSize: new google.maps.Size(44, 44),
          anchor: new google.maps.Point(22, 22),
        });
      } else {
        driverMarkerRef.current = new google.maps.Marker({
          position: dPos,
          map: googleMapInstance.current,
          title: 'Assigned Driver Vehicle',
          zIndex: 25,
          icon: {
            url: driverVehicleSvg,
            scaledSize: new google.maps.Size(44, 44),
            anchor: new google.maps.Point(22, 22),
          },
        });
      }
    } else if (driverMarkerRef.current) {
      driverMarkerRef.current.setMap(null);
      driverMarkerRef.current = null;
    }

    if (isPinMode) {
      // In pin mode, map centers on selected/pinned spot under the interactive center pin
      if (destPoint) {
        googleMapInstance.current.setCenter(new google.maps.LatLng(destPoint.lat, destPoint.lng));
        googleMapInstance.current.setZoom(16);
      }
      return;
    }

    if (destPoint) {
      const dLatLng = new google.maps.LatLng(destPoint.lat, destPoint.lng);

      const isSameLocation =
        Math.abs(pickupPoint.lat - destPoint.lat) < 0.0001 &&
        Math.abs(pickupPoint.lng - destPoint.lng) < 0.0001;

      // Lighter, pleasing modern Rose-Coral Destination Marker Pin
      const destinationSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg width="40" height="52" viewBox="0 0 40 52" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="roseGrad" x1="20" y1="2" x2="20" y2="46" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FB7185"/>
      <stop offset="100%" stop-color="#E11D48"/>
    </linearGradient>
  </defs>
  <!-- Modern Rose-Coral Pin -->
  <path d="M20 2 C10.6 2 3 9.6 3 19 C3 31.5 17.8 45.2 19.3 46.5 C19.7 46.9 20.3 46.9 20.7 46.5 C22.2 45.2 37 31.5 37 19 C37 9.6 29.4 2 20 2 Z" fill="url(#roseGrad)"/>
  <!-- Inner White Halo -->
  <circle cx="20" cy="18" r="7.5" fill="#FFFFFF"/>
  <!-- Center Dot -->
  <circle cx="20" cy="18" r="3.5" fill="#E11D48"/>
</svg>
`)}`;

      destMarkerRef.current = new google.maps.Marker({
        position: dLatLng,
        map: googleMapInstance.current,
        title: `Dropoff: ${destPoint.title}`,
        animation: google.maps.Animation.DROP,
        zIndex: 12,
        icon: {
          url: destinationSvg,
          scaledSize: new google.maps.Size(40, 52),
          anchor: new google.maps.Point(20, 47),
        },
      });

      if (isSameLocation) {
        googleMapInstance.current.setCenter(pLatLng);
        googleMapInstance.current.setZoom(16);
        return;
      }

      // Immediately frame both pickup and destination so map animates without delay
      const safeBottomPadding = Math.min(Math.round(SCREEN_HEIGHT * 0.44), 310);
      const initialBounds = new google.maps.LatLngBounds();
      initialBounds.extend(pLatLng);
      initialBounds.extend(dLatLng);
      googleMapInstance.current.fitBounds(initialBounds, {
        top: 90,
        bottom: safeBottomPadding,
        left: 50,
        right: 50,
      });

      // Fetch actual real driving road route following real streets, curves & highways
      calculateDrivingRoute(
        { latitude: pickupPoint.lat, longitude: pickupPoint.lng },
        { latitude: destPoint.lat, longitude: destPoint.lng }
      ).then((routeInfo) => {
        if (!googleMapInstance.current) return;

        if (routePolylineRef.current) {
          routePolylineRef.current.setMap(null);
          routePolylineRef.current = null;
        }
        if (routeCasingPolylineRef.current) {
          routeCasingPolylineRef.current.setMap(null);
          routeCasingPolylineRef.current = null;
        }

        const roadPath =
          routeInfo && routeInfo.path && routeInfo.path.length > 1
            ? routeInfo.path
            : [
                { lat: pickupPoint.lat, lng: pickupPoint.lng },
                { lat: destPoint.lat, lng: destPoint.lng },
              ];

        // Clean white casing border for light, modern, floating route effect
        routeCasingPolylineRef.current = new google.maps.Polyline({
          path: roadPath,
          geodesic: true,
          strokeColor: '#FFFFFF',
          strokeOpacity: 0.95,
          strokeWeight: 7.5,
          map: googleMapInstance.current,
        });

        // Lighter, pleasing vibrant emerald route line matching KeralaGo theme
        routePolylineRef.current = new google.maps.Polyline({
          path: roadPath,
          geodesic: true,
          strokeColor: '#10B981',
          strokeOpacity: 1.0,
          strokeWeight: 4,
          map: googleMapInstance.current,
        });

        // Clean floating ETA pill above dropoff pin via Google Maps OverlayView (Zero white card / X button)
        if (routeInfo && (routeInfo.formattedDuration || routeInfo.durationMins)) {
          const durationStr = routeInfo.formattedDuration || `${routeInfo.durationMins} mins`;
          const distStr = `${routeInfo.distanceKm} km`;

          if (google.maps.OverlayView) {
            class EtaOverlay extends google.maps.OverlayView {
              private div: HTMLDivElement | null = null;
              private pos: any;

              constructor(pos: any) {
                super();
                this.pos = pos;
              }

              onAdd() {
                const div = document.createElement('div');
                div.style.position = 'absolute';
                div.style.pointerEvents = 'none';
                div.style.cursor = 'default';
                div.style.zIndex = '999';
                div.innerHTML = `
                  <div style="background:#0F172A;color:#FFFFFF;padding:5px 12px;border-radius:14px;font-family:system-ui,-apple-system,sans-serif;font-size:12px;font-weight:700;display:flex;align-items:center;gap:6px;box-shadow:0 4px 14px rgba(0,0,0,0.3);white-space:nowrap;border:1.5px solid rgba(255,255,255,0.25);transform:translate(-50%, -100%) translateY(-54px);">
                    <span style="color:#34D399;font-size:12px;line-height:1;">●</span>
                    <span>${durationStr}</span>
                    <span style="color:#94A3B8;font-size:11px;font-weight:600;">(${distStr})</span>
                  </div>
                `;
                this.div = div;
                const panes = this.getPanes();
                panes?.floatPane?.appendChild(div);
              }

              draw() {
                const projection = this.getProjection();
                if (!projection || !this.div) return;
                const pixel = projection.fromLatLngToDivPixel(this.pos);
                if (pixel) {
                  this.div.style.left = `${pixel.x}px`;
                  this.div.style.top = `${pixel.y}px`;
                }
              }

              onRemove() {
                if (this.div?.parentNode) {
                  this.div.parentNode.removeChild(this.div);
                  this.div = null;
                }
              }
            }

            const overlay = new EtaOverlay(dLatLng);
            overlay.setMap(googleMapInstance.current);
            etaWindowRef.current = overlay;
          }
        }

        // Refine Google Map bounds to show the entire real road route
        const bounds = new google.maps.LatLngBounds();
        roadPath.forEach((pt) => bounds.extend(new google.maps.LatLng(pt.lat, pt.lng)));
        googleMapInstance.current.fitBounds(bounds, {
          top: 90,
          bottom: safeBottomPadding,
          left: 50,
          right: 50,
        });
      });
    } else {
      // In home/idle view: Center slightly south so the "You are here" pin sits in the visible upper half of screen
      const latOffset = 0.0035;
      googleMapInstance.current.setCenter(new google.maps.LatLng(pickupPoint.lat - latOffset, pickupPoint.lng));
      googleMapInstance.current.setZoom(16);
    }
  };

  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  // Initialize Live Google Map on Web
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Inject clean styling for Google Maps InfoWindows (removes default white balloon & 'X' close button)
    const styleId = 'gm-clean-infowindow-style';
    if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.innerHTML = `
        .gm-style-iw-c {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
          border-radius: 0 !important;
        }
        .gm-style-iw-d {
          overflow: visible !important;
          padding: 0 !important;
        }
        .gm-style-iw-tc, .gm-ui-hover-effect {
          display: none !important;
        }
      `;
      document.head.appendChild(styleEl);
    }

    let isMounted = true;

    const initMap = () => {
      const google = (globalThis as any).google;
      if (!isMounted || !google?.maps?.Map || !mapDivRef.current) return;

      // Disarm legacy billing-gated Geocoder calls on window
      if (google.maps?.Geocoder) {
        google.maps.Geocoder.prototype.geocode = function (_req: any, cb: any) {
          if (typeof cb === 'function') cb([], 'OK');
          return Promise.resolve({ results: [] });
        };
      }

      try {
        if (!googleMapInstance.current) {
          const initialCenterLat =
            isDriver || isPinModeRef.current || destPoint
              ? pickupPoint.lat
              : pickupPoint.lat - 0.0035;
          googleMapInstance.current = new google.maps.Map(mapDivRef.current, {
            center: { lat: initialCenterLat, lng: pickupPoint.lng },
            zoom: 16,
            disableDefaultUI: true,
            zoomControl: false,
            mapTypeControl: false,
            scaleControl: false,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: false,
            gestureHandling: 'greedy',
            styles: KERALA_MAP_STYLE,
          });

          // Uber & Rapido center pin drag interaction: Lift pin while moving
          googleMapInstance.current.addListener('dragstart', () => {
            if (isPinModeRef.current) {
              liftPin();
            }
          });

          // Map idle: Drop pin and reverse-geocode the center location
          googleMapInstance.current.addListener('idle', async () => {
            if (isPinModeRef.current) {
              dropPin();
              const center = googleMapInstance.current.getCenter();
              if (!center) return;
              const lat = center.lat();
              const lng = center.lng();

              let fullAddress = '';
              try {
                fullAddress = await reverseGeocode({ latitude: lat, longitude: lng });
              } catch {}

              let title = 'Pinned Location';
              let subtitle = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
              if (fullAddress && !fullAddress.includes(lat.toFixed(4))) {
                const parts = fullAddress.split(',');
                title = parts[0]?.trim() || fullAddress;
                subtitle = parts.slice(1, 4).join(',').trim() || fullAddress;
              } else {
                const nearest = findNearestOrFormatLocation(lat, lng);
                title = nearest.title;
                subtitle = nearest.subtitle || subtitle;
              }

              let distanceKm: number | undefined;
              let durationMins: number | undefined;
              try {
                const routeData = await calculateDrivingRoute(
                  { latitude: pickupPoint.lat, longitude: pickupPoint.lng },
                  { latitude: lat, longitude: lng }
                );
                if (routeData) {
                  distanceKm = routeData.distanceKm;
                  durationMins = routeData.durationMins;
                }
              } catch {}

              onMapClickRef.current?.({
                title,
                subtitle,
                lat,
                lng,
                distanceKm,
                durationMins,
              });
            }
          });

          // Click anywhere on map: Smoothly pan center to clicked point like Uber
          mapClickListenerRef.current = googleMapInstance.current.addListener('click', (event: any) => {
            if (!event?.latLng) return;
            if (isPinModeRef.current) {
              liftPin();
              googleMapInstance.current.panTo(event.latLng);
            }
          });

          syncGoogleMapRoute();
        }
      } catch (e) {
        console.warn('Google Maps initialization note:', e);
      }
    };

    const checkAndInit = () => {
      const g = (globalThis as any).google;
      if (g?.maps?.Map) {
        initMap();
      }
    };

    if (Platform.OS === 'web') {
      const google = (globalThis as any).google;
      if (google?.maps?.Map) {
        initMap();
      } else {
        const scriptId = 'google-maps-sdk-script';
        let script = document.getElementById(scriptId) as HTMLScriptElement;

        if (!script) {
          script = document.createElement('script');
          script.id = scriptId;
          script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry,marker`;
          script.async = true;
          script.defer = true;
          document.head.appendChild(script);
        }

        script.addEventListener('load', checkAndInit);

        // Safe polling in case script loaded before event listener was attached
        const pollInterval = setInterval(() => {
          if ((globalThis as any).google?.maps?.Map) {
            clearInterval(pollInterval);
            initMap();
          }
        }, 150);

        setTimeout(() => clearInterval(pollInterval), 8000);
      }
    }

    return () => {
      isMounted = false;
      if (mapClickListenerRef.current && (globalThis as any).google?.maps?.event) {
        (globalThis as any).google.maps.event.removeListener(mapClickListenerRef.current);
      }
      if (etaWindowRef.current) {
        if (typeof etaWindowRef.current.setMap === 'function') {
          etaWindowRef.current.setMap(null);
        } else if (typeof etaWindowRef.current.close === 'function') {
          etaWindowRef.current.close();
        }
        etaWindowRef.current = null;
      }
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
        directionsRendererRef.current = null;
      }
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
        routePolylineRef.current = null;
      }
      if (routeCasingPolylineRef.current) {
        routeCasingPolylineRef.current.setMap(null);
        routeCasingPolylineRef.current = null;
      }
      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.setMap(null);
        pickupMarkerRef.current = null;
      }
      if (destMarkerRef.current) {
        destMarkerRef.current.setMap(null);
        destMarkerRef.current = null;
      }
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setMap(null);
        driverMarkerRef.current = null;
      }
    };
  }, []);

  // Update route, driver position and cursor on prop change
  useEffect(() => {
    if (googleMapInstance.current) {
      googleMapInstance.current.setOptions({
        draggableCursor: isPinMode ? 'crosshair' : null,
      });
    }
    syncGoogleMapRoute();
  }, [activeDestination, pickupLocation, pickupCoords, pinnedPoint, destinationPoint, destinationCoords, isPinMode, driverCoords]);

  return (
    <View
      style={[
        styles.container,
        customHeight ? { height: customHeight } : null,
        style,
      ]}
    >
      {/* ── Native Google Map on Mobile (requires development build; Expo Go uses styled fallback below) ── */}
      {Platform.OS !== 'web' && NativeMapView && !(Constants as any)?.expoGoConfig ? (
        <NativeMapView
          loadingEnabled={true}
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: pickupPoint?.lat || 10.0538,
            longitude: pickupPoint?.lng || 76.6192,
            latitudeDelta: 0.035,
            longitudeDelta: 0.035,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={false}
          onPress={(e: any) => {
            const coord = e?.nativeEvent?.coordinate;
            if (coord && onMapClick) {
              onMapClick({
                title: 'Selected Pin',
                subtitle: `Lat: ${coord.latitude.toFixed(4)}, Lng: ${coord.longitude.toFixed(4)}`,
                lat: coord.latitude,
                lng: coord.longitude,
              });
            }
          }}
        >
          {pickupPoint && (
            <NativeMarker
              coordinate={{ latitude: pickupPoint.lat, longitude: pickupPoint.lng }}
              title={pickupLocation || 'Pickup Point'}
              pinColor="#10B981"
            />
          )}
          {destPoint && (
            <NativeMarker
              coordinate={{ latitude: destPoint.lat, longitude: destPoint.lng }}
              title={destPoint.title || 'Destination'}
              pinColor="#DC2626"
            />
          )}
          {driverCoords && (
            <NativeMarker
              coordinate={{ latitude: driverCoords.lat, longitude: driverCoords.lng }}
              title="Driver"
              pinColor="#065F46"
            />
          )}
        </NativeMapView>
      ) : (
        <>
          {/* ── Base Styled Terrain Background (Fallback / Web) ── */}
          <View style={styles.baseTerrain}>
            <View style={[styles.greenParcel, { top: SCREEN_HEIGHT * 0.04 + offsetY, left: -20, width: 150, height: 120, borderRadius: 32 }]} />
            <View style={[styles.greenParcel, { top: SCREEN_HEIGHT * 0.12 + offsetY, left: SCREEN_WIDTH * 0.22, width: 130, height: 100, borderRadius: 28 }]} />
            <View style={[styles.greenParcel, { top: SCREEN_HEIGHT * 0.22 + offsetY, left: SCREEN_WIDTH * 0.05, width: 140, height: 130, borderRadius: 32 }]} />
            <View style={[styles.riverCurveMain, { top: -20 + offsetY }]} />
            <View style={[styles.kozhippillyRoad, { top: SCREEN_HEIGHT * 0.10 + offsetY }]}>
              <Text style={styles.roadLabelText}>Kozhippilly - College Junction Rd</Text>
            </View>
            <View style={[styles.riverBridge, { top: SCREEN_HEIGHT * 0.14 + offsetY }]} />
            <View style={[styles.riverBankRoad, { top: -30 + offsetY }]} />
            <View style={[styles.roadResidential1, { top: SCREEN_HEIGHT * 0.16 + offsetY }]} />
            <View style={[styles.roadResidential2, { top: SCREEN_HEIGHT * 0.23 + offsetY }]} />
            <View style={[styles.roadResidential3, { top: SCREEN_HEIGHT * 0.28 + offsetY }]} />
          </View>

          {/* ── Real Live Google Map Container on Web ── */}
          {Platform.OS === 'web' && (
            <View
              ref={mapDivRef}
              style={styles.googleMapDiv}
            />
          )}
        </>
      )}

      {/* ── Uber & Rapido Fixed Interactive Center Pin ── */}
      {isPinMode && (
        <View pointerEvents="none" style={styles.centerPinContainer}>
          <Animated.View
            style={[
              styles.centerPinPill,
              { transform: [{ translateY: pinBounceAnim }] },
            ]}
          >
            <Text style={styles.centerPinPillText} numberOfLines={1}>
              {pinnedPoint?.title || 'Dropoff Location'}
            </Text>
            <View style={styles.centerPinPillPointer} />
          </Animated.View>

          <Animated.View
            style={[
              styles.centerPinIconWrap,
              { transform: [{ translateY: pinBounceAnim }] },
            ]}
          >
            <Icon library="Ionicons" name="location-sharp" size={46} color="#DC2626" />
            <View style={styles.centerPinHole} />
          </Animated.View>

          <Animated.View
            style={[
              styles.centerPinShadow,
              {
                transform: [{ scale: pinShadowScale }],
                opacity: pinShadowOpacity,
              },
            ]}
          />
        </View>
      )}

      {/* ── Overlaid Interactive Markers & Vehicle Layer ── */}
      <View style={styles.overlayLayer} pointerEvents="box-none">
        {/* Customer Mode: "Pickup Point >" Pin Callout & Destination Marker (Native mobile fallback only) */}
        {!isDriver && Platform.OS !== 'web' && (
          <View style={[styles.pickupPointRoot, { top: pickupPoint.top, left: pickupPoint.left }]}>
            <View style={styles.calloutPill}>
              <Text style={styles.calloutText} numberOfLines={1}>
                {pickupLocation && pickupLocation.length > 20
                  ? pickupLocation.substring(0, 18) + '...'
                  : (pickupLocation || 'Pickup Point')}
              </Text>
              <Icon library="Ionicons" name="chevron-forward" size={13} color={Colors.white} />
            </View>
            <View style={styles.calloutTriangle} />

            {/* Pin Marker */}
            <View style={styles.pinSymbolWrap}>
              <Icon library="Ionicons" name="location-sharp" size={38} color="#0F4A2B" />
              <View style={styles.pinWhiteCircle} />
            </View>
            <View style={styles.pinGroundShadow} />
          </View>
        )}

        {/* Customer Mode: Destination Marker (Native mobile fallback only) */}
        {!isDriver && Platform.OS !== 'web' && destPoint && (
          <View
            style={[
              styles.destinationMarkerRoot,
              {
                top: destPoint.top,
                left: destPoint.left,
              },
            ]}
          >
            <View style={styles.destCalloutPill}>
              <Text style={styles.destCalloutText}>{destPoint.title}</Text>
            </View>
            <Icon library="Ionicons" name="location-sharp" size={32} color="#DC2626" />
          </View>
        )}

        {/* Driver Mode: Location Beacon & Floating Controls */}
        {isDriver && (
          <>
            {/* Location Pin Badge: "Near MACE / Kothamangalam" */}
            <View style={[styles.driverLocationPinCard, { top: 48 + offsetY }]}>
              <View style={styles.driverLocationPinCircle}>
                <Icon library="Ionicons" name="location-sharp" size={15} color={Colors.white} />
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

            {/* MACE College Landmark Pin */}
            <View style={[styles.maceLandmark, { top: 58 + offsetY }]}>
              <View style={styles.maceIconWrap}>
                <Icon library="MaterialIcons" name="school" size={12} color="#64748B" />
              </View>
              <View>
                <Typography variant="xs" weight="bold" color="#334155" style={{ fontSize: 9 }}>
                  MACE
                </Typography>
                <Typography variant="xs" color="#64748B" style={{ fontSize: 8 }}>
                  College of Engineering
                </Typography>
              </View>
            </View>

            {/* Blue Location Dot with Radar Ring */}
            <View style={[styles.driverBlueDotAura, { top: 120 + offsetY }]}>
              <View style={styles.driverBlueDotRing} />
              <View style={styles.driverBlueDotCenter} />
            </View>

            {/* Driver Sedan on Road */}
            <View style={[styles.driverCarMarker, { top: 148 + offsetY }]}>
              <View style={styles.carBodyShadow} />
              <View style={styles.carBody}>
                <View style={styles.carWindshieldFront} />
                <View style={styles.carRoof} />
                <View style={styles.carWindshieldRear} />
              </View>
            </View>

            {/* Floating Controls Column on Right (Locate, Layers, Navigate) */}
            <View style={[styles.floatingControlsColumn, { top: 42 + offsetY }]}>
              {onLocatePress && (
                <TouchableOpacity
                  style={styles.floatingMapBtn}
                  activeOpacity={0.8}
                  onPress={onLocatePress}
                >
                  <Icon library="Ionicons" name="locate" size={20} color={Colors.primary} />
                </TouchableOpacity>
              )}

              {onLayersPress && (
                <TouchableOpacity
                  style={styles.floatingMapBtn}
                  activeOpacity={0.8}
                  onPress={onLayersPress}
                >
                  <Icon library="Ionicons" name="layers-outline" size={20} color={Colors.primary} />
                </TouchableOpacity>
              )}

              {onNavigatePress && (
                <TouchableOpacity
                  style={styles.floatingMapBtn}
                  activeOpacity={0.8}
                  onPress={onNavigatePress}
                >
                  <Icon library="Ionicons" name="navigate" size={20} color={Colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          </>
        )}


      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#EDF3EE',
    overflow: 'hidden',
  },
  baseTerrain: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#EEF5EF',
    zIndex: 1,
  },
  googleMapDiv: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  overlayLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 3,
  },
  greenParcel: {
    position: 'absolute',
    backgroundColor: '#D7ECD9',
    opacity: 0.85,
  },
  riverCurveMain: {
    position: 'absolute',
    top: -20,
    right: -40,
    width: SCREEN_WIDTH * 0.42,
    height: SCREEN_HEIGHT * 0.65,
    backgroundColor: '#8BC4F2',
    borderTopLeftRadius: 180,
    borderBottomLeftRadius: 220,
    transform: [{ rotate: '12deg' }],
    opacity: 0.9,
  },
  kozhippillyRoad: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.10,
    left: -40,
    width: SCREEN_WIDTH * 1.25,
    height: 18,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#D1D5DB',
    transform: [{ rotate: '24deg' }],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    ...Shadows.xs,
  },
  roadLabelText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.2,
  },
  riverBridge: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.14,
    right: SCREEN_WIDTH * 0.14,
    width: 28,
    height: 22,
    backgroundColor: '#CBD5E1',
    borderRadius: 3,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#94A3B8',
    transform: [{ rotate: '24deg' }],
    zIndex: 3,
  },
  riverBankRoad: {
    position: 'absolute',
    top: -30,
    right: SCREEN_WIDTH * 0.10,
    width: 14,
    height: SCREEN_HEIGHT * 0.65,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#D1D5DB',
    transform: [{ rotate: '16deg' }],
    zIndex: 2,
  },
  roadResidential1: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.16,
    left: -20,
    width: SCREEN_WIDTH * 0.70,
    height: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    transform: [{ rotate: '-32deg' }],
    zIndex: 1,
  },
  roadResidential2: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.23,
    left: SCREEN_WIDTH * 0.12,
    width: SCREEN_WIDTH * 0.65,
    height: 11,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    transform: [{ rotate: '-28deg' }],
    zIndex: 1,
  },
  roadResidential3: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.28,
    left: SCREEN_WIDTH * 0.05,
    width: SCREEN_WIDTH * 0.75,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    transform: [{ rotate: '-25deg' }],
    zIndex: 1,
  },
  pickupPointRoot: {
    position: 'absolute',
    width: 140,
    alignItems: 'center',
    zIndex: 6,
    transform: [{ translateX: -70 }, { translateY: -74 }],
  },
  calloutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F4A2B',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    ...Shadows.md,
  },
  calloutText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
    marginRight: 2,
  },
  calloutTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#0F4A2B',
    marginBottom: 1,
  },
  pinSymbolWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 38,
    width: 38,
  },
  pinWhiteCircle: {
    position: 'absolute',
    top: 9,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  pinGroundShadow: {
    width: 16,
    height: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 74, 43, 0.35)',
    marginTop: -3,
  },
  destinationMarkerRoot: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 7,
    transform: [{ translateX: -40 }, { translateY: -46 }],
  },
  destCalloutPill: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginBottom: 2,
    ...Shadows.md,
  },
  destCalloutText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  vehicleContainer: {
    position: 'absolute',
    zIndex: 5,
  },
  carBodyShadow: {
    position: 'absolute',
    bottom: -2,
    width: 18,
    height: 30,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  carBody: {
    width: 16,
    height: 28,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
    ...Shadows.sm,
  },
  carWindshieldFront: {
    width: 10,
    height: 4,
    backgroundColor: '#334155',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  carRoof: {
    width: 11,
    height: 10,
    backgroundColor: '#F8FAFC',
  },
  carWindshieldRear: {
    width: 10,
    height: 3,
    backgroundColor: '#334155',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  autoBody: {
    width: 15,
    height: 24,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#047857',
    ...Shadows.sm,
  },
  autoYellowRoof: {
    width: '100%',
    height: 11,
    backgroundColor: '#FACC15',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  autoWindshield: {
    width: 10,
    height: 3,
    backgroundColor: '#1E293B',
    marginTop: 1,
    borderRadius: 1,
  },
  autoGreenBase: {
    width: '100%',
    height: 13,
    backgroundColor: '#059669',
  },
  bikeBody: {
    width: 7,
    height: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.xs,
  },
  bikeWheelFront: {
    width: 4,
    height: 5,
    backgroundColor: '#1E293B',
    borderRadius: 2,
  },
  bikeTank: {
    width: 6,
    height: 7,
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  bikeWheelRear: {
    width: 4,
    height: 5,
    backgroundColor: '#1E293B',
    borderRadius: 2,
  },
  driverLocationPinCard: {
    position: 'absolute',
    left: SCREEN_WIDTH * 0.30,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
    zIndex: 8,
  },
  driverLocationPinCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0F4A2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  maceLandmark: {
    position: 'absolute',
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
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
  driverBlueDotAura: {
    position: 'absolute',
    left: SCREEN_WIDTH * 0.48,
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
    left: SCREEN_WIDTH * 0.52,
    zIndex: 8,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-28deg' }],
  },
  floatingControlsColumn: {
    position: 'absolute',
    right: 14,
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
  centerPinContainer: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 35,
    transform: [{ translateX: -80 }, { translateY: -44 }],
    width: 160,
  },
  centerPinPill: {
    backgroundColor: '#0F172A',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    ...Shadows.md,
  },
  centerPinPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  centerPinPillPointer: {
    position: 'absolute',
    bottom: -4,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#0F172A',
  },
  centerPinIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPinHole: {
    position: 'absolute',
    top: 13,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  centerPinShadow: {
    width: 18,
    height: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    marginTop: -2,
  },
});

export default KeralaMapBackground;

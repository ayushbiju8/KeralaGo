import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  Platform,
} from 'react-native';
import Icon from '../atoms/Icon';
import Typography from '../atoms/Typography';
import { Colors, Shadows } from '../../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  'AIzaSyDu10Bl1_cUfbKLQ4asg-drGffOOW79FrE';

export interface LocationPoint {
  title: string;
  lat: number;
  lng: number;
  top: number;
  left: number;
  subtitle?: string;
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
 * - Direct Google Maps JavaScript SDK instance on Web
 * - Interactive zooming, panning, and real-time street map rendering
 * - Prominent "Pickup Point >" callout with concentric pulsing radar rings
 * - Stationed live vehicles (sedans, auto-rickshaws, bikes) on real streets
 * - Dynamic route polyline when selecting destinations
 */
const KeralaMapBackground: React.FC<KeralaMapBackgroundProps> = ({
  showVehicles = true,
  activeDestination,
  pickupLocation,
}) => {
  const mapDivRef = useRef<any>(null);
  const googleMapInstance = useRef<any>(null);
  const pickupMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const directionsServiceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);

  const pickupPoint = getLocationPoint(pickupLocation);
  const destPoint = activeDestination ? getLocationPoint(activeDestination) : null;

  // Sync Google Maps markers & route on activeDestination / pickupLocation change
  const syncGoogleMapRoute = () => {
    const google = (globalThis as any).google;
    if (!google?.maps || !googleMapInstance.current) return;

    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }
    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setMap(null);
      pickupMarkerRef.current = null;
    }
    if (destMarkerRef.current) {
      destMarkerRef.current.setMap(null);
      destMarkerRef.current = null;
    }

    const pLatLng = new google.maps.LatLng(pickupPoint.lat, pickupPoint.lng);

    // Pickup Marker (Pin Icon)
    pickupMarkerRef.current = new google.maps.Marker({
      position: pLatLng,
      map: googleMapInstance.current,
      title: `Pickup: ${pickupPoint.title}`,
      icon: {
        path: 'M 0,0 C -2,-18 -9,-20 -9,-27 A 9,9 0 1,1 9,-27 C 9,-20 2,-18 0,0 Z',
        scale: 1.1,
        fillColor: '#0F4A2B',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        anchor: new google.maps.Point(0, 0),
      },
    });

    if (destPoint) {
      const dLatLng = new google.maps.LatLng(destPoint.lat, destPoint.lng);

      // Destination Marker
      destMarkerRef.current = new google.maps.Marker({
        position: dLatLng,
        map: googleMapInstance.current,
        title: `Dropoff: ${destPoint.title}`,
        icon: {
          path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: '#DC2626',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
      });

      // Real driving road route via DirectionsService (No straight lines)
      try {
        if (google.maps.DirectionsService && google.maps.DirectionsRenderer) {
          if (!directionsServiceRef.current) {
            directionsServiceRef.current = new google.maps.DirectionsService();
          }

          const renderer = new google.maps.DirectionsRenderer({
            map: googleMapInstance.current,
            suppressMarkers: true,
            preserveViewport: true,
            polylineOptions: {
              strokeColor: '#0F4A2B',
              strokeOpacity: 0.9,
              strokeWeight: 5,
            },
          });
          directionsRendererRef.current = renderer;

          directionsServiceRef.current.route(
            {
              origin: pLatLng,
              destination: dLatLng,
              travelMode: google.maps.TravelMode.DRIVING,
            },
            (result: any, status: any) => {
              if (status === google.maps.DirectionsStatus.OK) {
                renderer.setDirections(result);
              }
            }
          );
        }
      } catch (err) {
        // Do not render any mock straight lines
      }

      const bounds = new google.maps.LatLngBounds();
      bounds.extend(pLatLng);
      bounds.extend(dLatLng);
      googleMapInstance.current.fitBounds(bounds, {
        top: 90,
        bottom: Math.round(SCREEN_HEIGHT * 0.54),
        left: 50,
        right: 50,
      });
    } else {
      googleMapInstance.current.setCenter(pLatLng);
      googleMapInstance.current.setZoom(16);
    }
  };

  // Initialize Live Google Map on Web
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    let isMounted = true;

    const initMap = () => {
      const google = (globalThis as any).google;
      if (!isMounted || !google?.maps || !mapDivRef.current) return;

      try {
        if (!googleMapInstance.current) {
          googleMapInstance.current = new google.maps.Map(mapDivRef.current, {
            center: { lat: pickupPoint.lat, lng: pickupPoint.lng },
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

          syncGoogleMapRoute();
        }
      } catch (e) {
        console.warn('Google Maps initialization note:', e);
      }
    };

    const google = (globalThis as any).google;
    if (google?.maps) {
      initMap();
    } else {
      const scriptId = 'google-maps-sdk-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement;

      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }

      script.addEventListener('load', initMap);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Update route on prop change
  useEffect(() => {
    syncGoogleMapRoute();
  }, [activeDestination, pickupLocation]);

  return (
    <View style={styles.container}>
      {/* ── Base Styled Terrain Background (Ensures zero blank flash) ── */}
      <View style={styles.baseTerrain}>
        <View style={[styles.greenParcel, { top: SCREEN_HEIGHT * 0.04, left: -20, width: 150, height: 120, borderRadius: 32 }]} />
        <View style={[styles.greenParcel, { top: SCREEN_HEIGHT * 0.12, left: SCREEN_WIDTH * 0.22, width: 130, height: 100, borderRadius: 28 }]} />
        <View style={[styles.greenParcel, { top: SCREEN_HEIGHT * 0.22, left: SCREEN_WIDTH * 0.05, width: 140, height: 130, borderRadius: 32 }]} />
        <View style={styles.riverCurveMain} />
        <View style={styles.kozhippillyRoad}>
          <Text style={styles.roadLabelText}>Kozhippilly - College Junction Rd</Text>
        </View>
        <View style={styles.riverBridge} />
        <View style={styles.riverBankRoad} />
        <View style={styles.roadResidential1} />
        <View style={styles.roadResidential2} />
        <View style={styles.roadResidential3} />
      </View>

      {/* ── Real Live Google Map Container ── */}
      {Platform.OS === 'web' && (
        <View
          ref={mapDivRef}
          style={styles.googleMapDiv}
        />
      )}

      {/* ── Overlaid Interactive Markers & Vehicle Layer ── */}
      <View style={styles.overlayLayer} pointerEvents="box-none">

        {/* Pickup / Current Location Pin Marker */}
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

          {/* Pin Marker instead of concentric circles */}
          <View style={styles.pinSymbolWrap}>
            <Icon library="Ionicons" name="location-sharp" size={38} color="#0F4A2B" />
            <View style={styles.pinWhiteCircle} />
          </View>
          <View style={styles.pinGroundShadow} />
        </View>

        {/* Destination Marker */}
        {destPoint && (
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

        {/* Live Moving Vehicles Stationed on Kothamangalam Roads */}
        {showVehicles && (
          <>
            {/* White car on Kozhippilly road */}
            <MapVehicle type="car" rotation="-26deg" style={{ top: SCREEN_HEIGHT * 0.14, left: SCREEN_WIDTH * 0.27 }} />

            {/* White car crossing bridge over river */}
            <MapVehicle type="car" rotation="32deg" style={{ top: SCREEN_HEIGHT * 0.14, right: SCREEN_WIDTH * 0.17 }} />

            {/* Green sports bike on hostel road */}
            <MapVehicle type="bike" rotation="-15deg" style={{ top: SCREEN_HEIGHT * 0.22, right: SCREEN_WIDTH * 0.08 }} />

            {/* Auto rickshaw near college junction */}
            <MapVehicle type="auto" rotation="-10deg" style={{ top: SCREEN_HEIGHT * 0.26, right: SCREEN_WIDTH * 0.14 }} />

            {/* White car on residential road */}
            <MapVehicle type="car" rotation="30deg" style={{ top: SCREEN_HEIGHT * 0.26, left: SCREEN_WIDTH * 0.18 }} />

            {/* Auto rickshaw below pickup point */}
            <MapVehicle type="auto" rotation="65deg" style={{ top: SCREEN_HEIGHT * 0.32, left: SCREEN_WIDTH * 0.32 }} />
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
  vehicleContainer: {
    position: 'absolute',
    zIndex: 5,
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
});

export default KeralaMapBackground;

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Text,
  Alert,
  Dimensions,
  Animated,
  PanResponder,
  Image,
  Platform,
  Modal,
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Typography,
  Avatar,
  Badge,
  Button,
  Icon,
  Card,
  RatingStar,
  ShimmerImage,
  Skeleton,
} from '../../../components/atoms';
import {
  FloatingSearchBar,
  FloatingMapButton,
  ServiceCategoryCard,
  LocationListItem,
  RoutePointRow,
  ProgressBar,
  KeralaMapBackground,
  LocationPoint,
  getLocationPoint,
  KNOWN_LOCATIONS,
  SheetDecorativeWave,
  ServiceGridSkeleton,
} from '../../../components/molecules';
import {
  BottomSheet,
  RideSelectionList,
  TripCompletedCard,
  RideOption,
  RideChatModal,
} from '../../../components/organisms';
import { Colors, Spacing, Radii, Shadows } from '../../../constants/theme';
import { customerData } from '../../../data';
import {
  fetchPlacesAutocomplete,
  fetchPlaceCoordinates,
  getCurrentGPSLocation,
  calculateDrivingRoute,
  PlacePrediction,
} from '../../../services/googleMapsService';
import { useAuth } from '../../../hooks/useAuth';
import telemetrySocket, { DriverLocationUpdate, RideStatusUpdate } from '../../../services/telemetrySocket';
import {
  requestRide,
  fetchRideDetail,
  fetchActiveRide,
  cancelRide,
  submitReview,
  triggerSOS,
  updateCustomerProfile,
} from '../../../services/tripService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Precise snap points matching reference UI proportions:
// - Default (57% height): shows suggestions + recent destinations exactly like reference UI
// - Expanded (86% height): slides up to reveal all suggestions, recent items, and saved places
// - Collapsed (24% height): exposes 76% of map view
// C10: Tab bar is ~64pt — collapsed snap exposes enough map above it
const TAB_BAR_HEIGHT = 64;
const DEFAULT_SHEET_HEIGHT = Math.round(SCREEN_HEIGHT * 0.57);
const EXPANDED_SHEET_HEIGHT = Math.round(SCREEN_HEIGHT * 0.86);
const COLLAPSED_SHEET_HEIGHT = Math.round(SCREEN_HEIGHT * 0.24) + TAB_BAR_HEIGHT;

const rideSedanImg = require('../../../assets/services/ride.png');
const bikeImg = require('../../../assets/services/bike.png');
const autoImg = require('../../../assets/services/auto.png');
const pinkRideImg = require('../../../assets/services/pink_ride.png');
const packageImg = require('../../../assets/services/package.png');
const shareTaxiImg = require('../../../assets/services/share_taxi.png');
const rentalsImg = require('../../../assets/services/rentals.png');
const scheduleRideImg = require('../../../assets/services/schedule_ride.png');

export const POPULAR_DESTINATIONS = [
  {
    id: 'mb_hostel',
    title: 'M B Hostel',
    subtitle: 'Near Mar Athanasius College of Engineering',
    distance: '0.8 km',
    icon: 'time-outline',
  },
  {
    id: 'kattuchira',
    title: 'kattuchira',
    subtitle: 'College Road, Kothamangalam',
    distance: '1.2 km',
    icon: 'time-outline',
  },
  {
    id: 'kozhippilly',
    title: 'Kozhippilly Junction',
    subtitle: 'Aluva - Munnar Highway, Kothamangalam',
    distance: '2.5 km',
    icon: 'time-outline',
  },
  {
    id: 'st_george',
    title: 'St. George Basilica',
    subtitle: 'High School Road, Kothamangalam Town',
    distance: '3.1 km',
    icon: 'bookmark-outline',
  },
  {
    id: 'ksrtc',
    title: 'KSRTC Bus Stand',
    subtitle: 'Main KSRTC Terminal, Kothamangalam',
    distance: '2.8 km',
    icon: 'bus-outline',
  },
  {
    id: 'aluva_metro',
    title: 'Aluva Metro Station',
    subtitle: 'Kochi Metro Feeder Terminal, Aluva',
    distance: '32 km',
    icon: 'subway-outline',
  },
];

export const ROUTE_SHORTCUTS = [
  { id: 'set_map', label: 'Set on map', icon: 'map-outline' },
  { id: 'mb_hostel', label: 'Campus Hostels', icon: 'school-outline', target: 'M B Hostel' },
  { id: 'college_junc', label: 'College Junction', icon: 'navigate-outline', target: 'kattuchira' },
  { id: 'st_george', label: 'St. George Basilica', icon: 'business-outline', target: 'St. George Basilica' },
  { id: 'ksrtc', label: 'KSRTC Stand', icon: 'bus-outline', target: 'KSRTC Bus Stand' },
  { id: 'kozhippilly', label: 'Kozhippilly', icon: 'trail-sign-outline', target: 'Kozhippilly Junction' },
];

export type BookingStage =
  | 'IDLE'
  | 'SEARCH_ROUTE'
  | 'PIN_ON_MAP'
  | 'SELECT_RIDE'
  | 'CONFIRM_PAYMENT'
  | 'SEARCHING_DRIVER'
  | 'ACTIVE_RIDE'
  | 'TRIP_COMPLETED';

interface CustomerHomeViewProps {
  userName?: string;
  userAvatar?: string;
  onToggleRole?: () => void;
  onBookingStateChange?: (active: boolean) => void;
}

const CustomerHomeView: React.FC<CustomerHomeViewProps> = ({
  userName = customerData.customerProfile.name,
  userAvatar = customerData.customerProfile.avatar,
  onToggleRole,
  onBookingStateChange,
}) => {
  // Booking lifecycle state machine
  const [stage, setStage] = useState<BookingStage>('IDLE');
  const [selectedDestination, setSelectedDestination] = useState<string>(
    customerData.recentDestinations[0].title
  );
  // C08: Pickup starts with a sensible fallback; GPS auto-detect runs on mount
  const [pickupLocation, setPickupLocation] = useState<string>('Detecting your location...');
  const [isLocatingPickup, setIsLocatingPickup] = useState<boolean>(true);
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>({
    lat: 10.0538,
    lng: 76.6192,
  });
  const [pinnedLocation, setPinnedLocation] = useState<LocationPoint | null>(null);
  const [recenterTrigger, setRecenterTrigger] = useState<number>(0);
  const [destinationQuery, setDestinationQuery] = useState<string>('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [activeInput, setActiveInput] = useState<'pickup' | 'destination'>('destination');
  const [selectedRideId, setSelectedRideId] = useState<string>('ride');
  const [searchPulseAnim] = useState(new Animated.Value(1));
  const [rideProgress, setRideProgress] = useState<number>(0.35);
  // C06: Dynamic ETA state for ACTIVE_RIDE stage
  const [activeRideEtaMin, setActiveRideEtaMin] = useState<number>(8);
  const [activeRideDistKm, setActiveRideDistKm] = useState<number>(2.3);

  // Payment & Promo state matching Screen 3 of reference flow
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'upi' | 'new'>('upi');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [driverSearchStep, setDriverSearchStep] = useState<number>(1);
  const [userRating, setUserRating] = useState<number>(4);
  const [feedbackText, setFeedbackText] = useState<string>('Good ride!');

  // Modals for notifications & package courier
  const [notificationsModalVisible, setNotificationsModalVisible] = useState<boolean>(false);
  const [packageModalVisible, setPackageModalVisible] = useState<boolean>(false);
  const [packageType, setPackageType] = useState<string>('Documents');
  const [packageReceiver, setPackageReceiver] = useState<string>('');
  const [packageDropoff, setPackageDropoff] = useState<string>('');

  // Authentication & Customer Profile state
  const { user, updateProfile } = useAuth();
  const [currentUserGender, setCurrentUserGender] = useState<string | undefined>(user?.gender);

  // Real Ride DB State
  const [activeRideDbId, setActiveRideDbId] = useState<string | null>(null);
  const [activeRideCode, setActiveRideCode] = useState<string>('KL-TRIP-4912');
  const [activeRideOtpPin, setActiveRideOtpPin] = useState<string>('4821');
  const [activeRideStatus, setActiveRideStatus] = useState<
    'REQUESTED' | 'ACCEPTED' | 'DRIVER_ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  >('ACCEPTED');
  const [assignedDriver, setAssignedDriver] = useState<{
    name: string;
    phone: string;
    rating: number;
    totalTrips: number;
    vehiclePlate: string;
    vehicleModel: string;
    vehicleColor: string;
    avatar?: string;
  }>({
    name: customerData.activeRideSim.driverName,
    phone: '+91 98471 22334',
    rating: customerData.activeRideSim.driverRating,
    totalTrips: customerData.activeRideSim.driverTotalTrips || 184,
    vehiclePlate: customerData.activeRideSim.vehiclePlate,
    vehicleModel: customerData.activeRideSim.vehicleName || 'Maruti Swift - White',
    vehicleColor: customerData.activeRideSim.vehicleColor || 'White',
    avatar: customerData.activeRideSim.driverAvatar,
  });

  // Pink Cab Gender Modal States
  const [pinkCabModalVisible, setPinkCabModalVisible] = useState<boolean>(false);
  const [genderWarningModalVisible, setGenderWarningModalVisible] = useState<boolean>(false);

  // Real-Time Telemetry Live Driver Coordinates from WebSocket
  const [liveDriverCoords, setLiveDriverCoords] = useState<{
    lat: number;
    lng: number;
    bearing?: number;
    vehicleType?: 'car' | 'auto';
  } | null>(null);

  // Cancellation Modal State
  const [cancelModalVisible, setCancelModalVisible] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('Driver is taking too long');

  // Driver Chat Modal State
  const [driverChatModalVisible, setDriverChatModalVisible] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<string[]>([]);

  useEffect(() => {
    if (user?.gender) {
      setCurrentUserGender(user.gender);
    }
  }, [user?.gender]);

  // C19: Real-time driver trip progress & ETA live countdown during ACTIVE_RIDE
  useEffect(() => {
    if (stage !== 'ACTIVE_RIDE') return;
    const timer = setInterval(() => {
      setRideProgress((prev) => (prev >= 0.95 ? 0.95 : +(prev + 0.05).toFixed(2)));
      setActiveRideEtaMin((prev) => (prev > 1 ? prev - 1 : 1));
      setActiveRideDistKm((prev) => (prev > 0.4 ? +(prev - 0.2).toFixed(1) : 0.3));
    }, 4000);
    return () => clearInterval(timer);
  }, [stage]);

  // Sync booking state to parent to manage tab bar visibility
  useEffect(() => {
    onBookingStateChange?.(stage !== 'IDLE');
  }, [stage, onBookingStateChange]);

  // C08: Auto-detect device GPS on mount and set pickup address
  useEffect(() => {
    let isMounted = true;
    getCurrentGPSLocation().then((gps) => {
      if (!isMounted) return;
      setPickupLocation(gps.address || 'Current Location');
      setPickupCoords({ lat: gps.latitude, lng: gps.longitude });
      setIsLocatingPickup(false);
    }).catch(() => {
      if (!isMounted) return;
      setPickupLocation('Mar Athanasius College of Engineering');
      setIsLocatingPickup(false);
    });
    return () => { isMounted = false; };
  }, []);

  // Sliding Middle Partition (Bottom Sheet) Animated Value & PanResponder
  const sheetHeightAnim = useRef(new Animated.Value(DEFAULT_SHEET_HEIGHT)).current;
  const currentSheetHeight = useRef(DEFAULT_SHEET_HEIGHT);
  const dragStartY = useRef(DEFAULT_SHEET_HEIGHT);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dy) > 3;
        },
        onPanResponderGrant: () => {
          sheetHeightAnim.stopAnimation();
          dragStartY.current = currentSheetHeight.current;
        },
        onPanResponderMove: (_, gestureState) => {
          // Dragging UP gives negative dy => increases sheet height
          const newHeight = dragStartY.current - gestureState.dy;
          const clamped = Math.max(
            COLLAPSED_SHEET_HEIGHT,
            Math.min(EXPANDED_SHEET_HEIGHT, newHeight)
          );
          sheetHeightAnim.setValue(clamped);
        },
        onPanResponderRelease: (_, gestureState) => {
          const currentPos = dragStartY.current - gestureState.dy;
          let snapTarget = DEFAULT_SHEET_HEIGHT;

          // Velocity-based flick detection
          if (gestureState.vy < -0.45) {
            // Flicked UP
            snapTarget =
              currentPos < DEFAULT_SHEET_HEIGHT + 35
                ? DEFAULT_SHEET_HEIGHT
                : EXPANDED_SHEET_HEIGHT;
          } else if (gestureState.vy > 0.45) {
            // Flicked DOWN
            snapTarget =
              currentPos > DEFAULT_SHEET_HEIGHT - 35
                ? DEFAULT_SHEET_HEIGHT
                : COLLAPSED_SHEET_HEIGHT;
          } else {
            // Closest snap point
            const distCollapsed = Math.abs(currentPos - COLLAPSED_SHEET_HEIGHT);
            const distDefault = Math.abs(currentPos - DEFAULT_SHEET_HEIGHT);
            const distExpanded = Math.abs(currentPos - EXPANDED_SHEET_HEIGHT);

            if (distCollapsed < distDefault && distCollapsed < distExpanded) {
              snapTarget = COLLAPSED_SHEET_HEIGHT;
            } else if (distExpanded < distDefault && distExpanded < distCollapsed) {
              snapTarget = EXPANDED_SHEET_HEIGHT;
            } else {
              snapTarget = DEFAULT_SHEET_HEIGHT;
            }
          }

          currentSheetHeight.current = snapTarget;
          Animated.spring(sheetHeightAnim, {
            toValue: snapTarget,
            tension: 70,
            friction: 12,
            useNativeDriver: false,
          }).start();
        },
      }),
    [sheetHeightAnim]
  );

  // Toggle expansion helper when tapping drag handle
  const toggleSheetExpansion = () => {
    let nextTarget = DEFAULT_SHEET_HEIGHT;
    if (currentSheetHeight.current === DEFAULT_SHEET_HEIGHT) {
      nextTarget = EXPANDED_SHEET_HEIGHT;
    } else if (currentSheetHeight.current === EXPANDED_SHEET_HEIGHT) {
      nextTarget = DEFAULT_SHEET_HEIGHT;
    } else {
      nextTarget = DEFAULT_SHEET_HEIGHT;
    }
    currentSheetHeight.current = nextTarget;
    Animated.spring(sheetHeightAnim, {
      toValue: nextTarget,
      tension: 70,
      friction: 12,
      useNativeDriver: false,
    }).start();
  };

  // Radar pulse animation for SEARCHING_DRIVER stage matching Screen 4
  useEffect(() => {
    if (stage === 'SEARCHING_DRIVER') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(searchPulseAnim, {
            toValue: 1.25,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(searchPulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => {
        pulse.stop();
      };
    }
  }, [stage, searchPulseAnim]);

  // ── Live Telemetry WebSocket: Sync live driver location and ride lifecycle ──
  useEffect(() => {
    if (!activeRideDbId || (stage !== 'ACTIVE_RIDE' && stage !== 'SEARCHING_DRIVER')) return;

    // Join dedicated ride channel
    telemetrySocket.joinRide(activeRideDbId, 'customer');

    // Subscribe to driver GPS location broadcasts
    const unsubscribeLocation = telemetrySocket.onDriverLocationUpdate((update: DriverLocationUpdate) => {
      if (update.coordinate) {
        setLiveDriverCoords({
          lat: update.coordinate.latitude,
          lng: update.coordinate.longitude,
          bearing: update.bearing,
          vehicleType: selectedRideId === 'auto' ? 'auto' : 'car',
        });
      }
    });

    // Subscribe to instant status changes from driver or dispatch
    const unsubscribeStatus = telemetrySocket.onRideStatusUpdate((update: RideStatusUpdate) => {
      const remoteStatus = update.status;
      if (remoteStatus === 'ACCEPTED' && stage === 'SEARCHING_DRIVER') {
        setActiveRideStatus('ACCEPTED');
        setDriverSearchStep(3);
        setStage('ACTIVE_RIDE');
      } else if (remoteStatus === 'DRIVER_ARRIVED' && activeRideStatus !== 'DRIVER_ARRIVED') {
        setActiveRideStatus('DRIVER_ARRIVED');
        Alert.alert(
          'Driver Arrived! (ഡ്രൈവർ എത്തിക്കഴിഞ്ഞു)',
          `Your driver ${assignedDriver.name} has arrived at your pickup point.\nShare Start PIN: ${activeRideOtpPin}`
        );
      } else if (remoteStatus === 'IN_PROGRESS' && activeRideStatus !== 'IN_PROGRESS') {
        setActiveRideStatus('IN_PROGRESS');
      } else if (remoteStatus === 'COMPLETED' && activeRideStatus !== 'COMPLETED') {
        setActiveRideStatus('COMPLETED');
        setStage('TRIP_COMPLETED');
      } else if (remoteStatus === 'CANCELLED') {
        Alert.alert('Trip Cancelled', 'This trip was cancelled by the driver or dispatch.');
        setStage('IDLE');
      }
    });

    return () => {
      unsubscribeLocation();
      unsubscribeStatus();
      telemetrySocket.leaveRide(activeRideDbId);
    };
  }, [activeRideDbId, stage, activeRideStatus, assignedDriver, activeRideOtpPin, selectedRideId]);

  // Fallback database polling while in ACTIVE_RIDE (ensures data sync even if offline)
  useEffect(() => {
    if (stage !== 'ACTIVE_RIDE' || !activeRideDbId) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const detail = await fetchRideDetail(activeRideDbId);
        if (isMounted && detail.data) {
          const remoteStatus = detail.data.status;
          if (remoteStatus === 'DRIVER_ARRIVED' && activeRideStatus !== 'DRIVER_ARRIVED') {
            setActiveRideStatus('DRIVER_ARRIVED');
            Alert.alert(
              'Driver Arrived! (ഡ്രൈവർ എത്തിക്കഴിഞ്ഞു)',
              `Your driver ${assignedDriver.name} has arrived at your pickup point.\nShare Start PIN: ${activeRideOtpPin}`
            );
          } else if (remoteStatus === 'IN_PROGRESS' && activeRideStatus !== 'IN_PROGRESS') {
            setActiveRideStatus('IN_PROGRESS');
          } else if (remoteStatus === 'COMPLETED' && activeRideStatus !== 'COMPLETED') {
            setActiveRideStatus('COMPLETED');
            setStage('TRIP_COMPLETED');
          } else if (remoteStatus === 'CANCELLED') {
            Alert.alert('Trip Cancelled', 'This trip was cancelled by the driver or dispatch.');
            setStage('IDLE');
          }
        }
      } catch (e) {
        // Silently tolerate temporary polling errors
      }
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [stage, activeRideDbId, activeRideStatus, assignedDriver, activeRideOtpPin]);

  // ── Ride Lifecycle Handlers ──
  const handleSelectRideType = (rideId: string) => {
    if (rideId === 'pink') {
      const g = (user?.gender || currentUserGender || '').toUpperCase();
      if (g === 'MALE') {
        setGenderWarningModalVisible(true);
        return;
      }
      if (!g || g === 'UNSET') {
        setPinkCabModalVisible(true);
        return;
      }
      setSelectedRideId('pink');
    } else {
      setSelectedRideId(rideId);
    }
  };

  const handleConfirmBooking = async () => {
    // 1. Strict Pink Cab gender check against database
    if (selectedRideId === 'pink') {
      const g = (user?.gender || currentUserGender || '').toUpperCase();
      if (g === 'MALE') {
        setGenderWarningModalVisible(true);
        return;
      }
      if (!g || g === 'UNSET') {
        setPinkCabModalVisible(true);
        return;
      }
    }

    setStage('SEARCHING_DRIVER');
    setDriverSearchStep(1);

    const calculatedFare = appliedPromo
      ? Math.max(20, selectedRide.priceMin - 50)
      : selectedRide.priceMin;

    try {
      const pLat = pickupCoords?.lat || 10.0538;
      const pLng = pickupCoords?.lng || 76.6192;
      const dLat = pinnedLocation?.lat || 10.0538;
      const dLng = pinnedLocation?.lng || 76.6192;

      setDriverSearchStep(2);

      const res = await requestRide({
        category: selectedRideId,
        pickup: {
          title: pickupLocation.split(',')[0],
          address: pickupLocation,
          lat: pLat,
          lng: pLng,
        },
        destination: {
          title: selectedDestination,
          address: pinnedLocation?.subtitle || selectedDestination,
          lat: dLat,
          lng: dLng,
        },
        fare: calculatedFare,
        distanceKm: activeRideDistKm,
        durationMins: activeRideEtaMin,
        paymentMethod: selectedPaymentMethod,
        couponCode: appliedPromo || undefined,
      });

      if (res.data && res.data.success) {
        setActiveRideCode(res.data.rideId || 'KL-TRIP-9901');
        setActiveRideDbId(res.data.dbId || null);
        if (res.data.otpPin) {
          setActiveRideOtpPin(res.data.otpPin);
        }
        if (res.data.driver) {
          setAssignedDriver({
            name: res.data.driver.name || 'Rijin S',
            phone: res.data.driver.phone || '+91 98471 22334',
            rating: res.data.driver.rating || 4.8,
            totalTrips: res.data.driver.totalTrips || 192,
            vehiclePlate: res.data.driver.vehiclePlate || 'KL 07 AB 1234',
            vehicleModel: res.data.driver.vehicleModel || 'Maruti Swift - White',
            vehicleColor: res.data.driver.vehicleColor || 'White',
            avatar: res.data.driver.avatar || customerData.activeRideSim.driverAvatar,
          });
        }
        setActiveRideStatus(res.data.status || 'ACCEPTED');
        setDriverSearchStep(3);
        setTimeout(() => setStage('ACTIVE_RIDE'), 1400);
      } else if (res.data && res.data.code === 'PINK_CAB_WOMEN_ONLY') {
        Alert.alert(
          'Pink Cab Restriction',
          res.data.error || 'Pink Cab is exclusively for verified women passengers.'
        );
        setSelectedRideId('ride');
        setStage('SELECT_RIDE');
      } else {
        // Fallback for smooth demonstration
        setDriverSearchStep(3);
        setTimeout(() => setStage('ACTIVE_RIDE'), 1800);
      }
    } catch (err: any) {
      console.warn('Ride request error:', err);
      setDriverSearchStep(3);
      setTimeout(() => setStage('ACTIVE_RIDE'), 1800);
    }
  };

  const handleCancelRide = async () => {
    setCancelModalVisible(false);
    if (activeRideDbId) {
      try {
        await cancelRide(activeRideDbId, cancelReason);
      } catch {}
    }
    Alert.alert('Ride Cancelled', `Your ride request was cancelled. Reason: ${cancelReason}`);
    setStage('IDLE');
  };

  const handleTriggerSOS = async () => {
    try {
      await triggerSOS(
        pickupCoords?.lat || 10.0538,
        pickupCoords?.lng || 76.6192,
        'Passenger Emergency SOS alert'
      );
    } catch {}

    Alert.alert(
      'EMERGENCY SOS ALERT (അടിയന്തര സഹായം)',
      'Kerala Police 112 Control Room & Emergency Contacts alerted with your real-time GPS location.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Police 112',
          style: 'destructive',
          onPress: () => {
            Linking.openURL('tel:112').catch(() => {
              Alert.alert('Emergency Dial', 'Please dial 112 from your dialer.');
            });
          },
        },
      ]
    );
  };

  const handleShareLiveTrip = async () => {
    try {
      const shareMsg = `🚕 KeralaGO Live Trip Tracking\nPassenger: ${userName}\nDriver: ${assignedDriver.name} (★${assignedDriver.rating})\nVehicle: ${assignedDriver.vehicleModel} [${assignedDriver.vehiclePlate}]\nFrom: ${pickupLocation}\nTo: ${selectedDestination}\nStatus: ${activeRideStatus}\nEmergency SOS: 112 Active`;
      await Share.share({
        message: shareMsg,
        title: 'KeralaGO Live Trip Tracking',
      });
    } catch {}
  };

  const handleSendDriverMessage = (msg: string) => {
    setChatMessages((prev) => [...prev, msg]);
    Alert.alert('Message Sent', `Sent to driver ${assignedDriver.name}: "${msg}"`);
    setDriverChatModalVisible(false);
  };

  const handleFinishCompletedTrip = async () => {
    try {
      await submitReview(userRating, feedbackText);
    } catch {}
    Alert.alert('Thank You!', 'Your rating and feedback have been recorded in the database.');
    setStage('IDLE');
  };

  // Google Places Autocomplete live search with debounce
  useEffect(() => {
    if (stage !== 'SEARCH_ROUTE') {
      setPredictions([]);
      return;
    }
    const currentQuery = activeInput === 'pickup' ? pickupLocation : destinationQuery;
    if (!currentQuery || currentQuery.trim().length < 1) {
      setPredictions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const fromCoords = pickupCoords || { lat: 10.0538, lng: 76.6192 };
        const results = await fetchPlacesAutocomplete(currentQuery, {
          origin: { latitude: fromCoords.lat, longitude: fromCoords.lng },
        });

        // Also check if any local campus / known landmark matches the query letters
        const q = currentQuery.toLowerCase().trim();
        const localMatches: PlacePrediction[] = [];
        for (const [key, loc] of Object.entries(KNOWN_LOCATIONS)) {
          if (
            key.toLowerCase().includes(q) ||
            loc.title.toLowerCase().includes(q) ||
            (loc.subtitle && loc.subtitle.toLowerCase().includes(q))
          ) {
            const dLat = loc.lat - fromCoords.lat;
            const dLng = loc.lng - fromCoords.lng;
            const distKm = Math.round(Math.sqrt(dLat * dLat + dLng * dLng) * 111 * 10) / 10;
            localMatches.push({
              placeId: `osm_manual_${loc.lat}_${loc.lng}`,
              primaryText: loc.title,
              secondaryText: loc.subtitle || 'Kothamangalam',
              fullText: `${loc.title}, ${loc.subtitle || 'Kothamangalam'}`,
              distanceKm: distKm,
              distanceText: `${distKm} km`,
              distanceMeters: distKm * 1000,
            });
          }
        }

        // Combine local closest matches first, then Google Places suggestions, deduplicated
        const combined = [...localMatches, ...results];
        const seen = new Set<string>();
        const unique = combined.filter((item) => {
          const norm = item.primaryText.toLowerCase().trim();
          if (seen.has(norm)) return false;
          seen.add(norm);
          return true;
        });

        // Sort by distance ascending so closest is first
        unique.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

        setPredictions(unique);
      } catch (err) {
        setPredictions([]);
      } finally {
        setIsSearching(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [destinationQuery, pickupLocation, activeInput, stage, pickupCoords]);

  // Handle Google Places Autocomplete prediction selection
  const handleSelectPrediction = async (prediction: PlacePrediction) => {
    try {
      const coords = await fetchPlaceCoordinates(prediction.placeId);
      const title = prediction.primaryText;
      const subtitle = prediction.secondaryText || prediction.fullText;

      if (activeInput === 'pickup') {
        setPickupLocation(prediction.fullText || title);
        if (coords) {
          setPickupCoords({ lat: coords.latitude, lng: coords.longitude });
        }
        setActiveInput('destination');
      } else {
        setSelectedDestination(title);
        setDestinationQuery(title);

        const destLat = coords ? coords.latitude : 10.0538;
        const destLng = coords ? coords.longitude : 76.6192;
        const pLat = pickupCoords?.lat || 10.0538;
        const pLng = pickupCoords?.lng || 76.6192;

        let distanceKm = 3.5;
        let durationMins = 8;
        try {
          const routeInfo = await calculateDrivingRoute(
            { latitude: pLat, longitude: pLng },
            { latitude: destLat, longitude: destLng }
          );
          distanceKm = routeInfo.distanceKm;
          durationMins = routeInfo.durationMins;
        } catch {}

        setPinnedLocation({
          title,
          subtitle,
          lat: destLat,
          lng: destLng,
          distanceKm,
          durationMins,
        });

        setStage('SELECT_RIDE');
      }
    } catch (e) {
      console.warn('Place selection error:', e);
      handleSelectDestination(prediction.primaryText);
    }
  };

  // Swap pickup & destination handler
  const handleSwapLocations = () => {
    const prevPickup = pickupLocation;
    const prevDest = selectedDestination;
    setPickupLocation(prevDest);
    setSelectedDestination(prevPickup);
    setDestinationQuery(prevPickup);
  };

  // Handle destination selection from Recent / Popular list
  const handleSelectDestination = async (destTitle: string) => {
    if (activeInput === 'pickup') {
      setPickupLocation(destTitle);
      const loc = getLocationPoint(destTitle);
      if (loc) {
        setPickupCoords({ lat: loc.lat, lng: loc.lng });
      }
      setActiveInput('destination');
    } else {
      setSelectedDestination(destTitle);
      setDestinationQuery(destTitle);

      let loc = getLocationPoint(destTitle);
      let destLat = loc ? loc.lat : 10.0538;
      let destLng = loc ? loc.lng : 76.6192;
      let subtitle = loc?.subtitle || 'Selected spot';

      // If destination is not a predefined campus landmark, geocode via Places API
      if (!KNOWN_LOCATIONS[destTitle]) {
        try {
          const preds = await fetchPlacesAutocomplete(destTitle);
          if (preds && preds.length > 0) {
            const resolved = await fetchPlaceCoordinates(preds[0].placeId);
            if (resolved) {
              destLat = resolved.latitude;
              destLng = resolved.longitude;
              subtitle = resolved.subtitle || resolved.address || subtitle;
            }
          }
        } catch (geoErr) {
          console.warn('[handleSelectDestination] Geocoding fallback note:', geoErr);
        }
      }

      const pLat = pickupCoords?.lat || 10.0538;
      const pLng = pickupCoords?.lng || 76.6192;

      let distanceKm = 3.5;
      let durationMins = 8;
      try {
        const routeInfo = await calculateDrivingRoute(
          { latitude: pLat, longitude: pLng },
          { latitude: destLat, longitude: destLng }
        );
        distanceKm = routeInfo.distanceKm;
        durationMins = routeInfo.durationMins;
      } catch {}

      setPinnedLocation({
        title: destTitle,
        subtitle,
        lat: destLat,
        lng: destLng,
        distanceKm,
        durationMins,
      });

      setStage('SELECT_RIDE');
    }
  };

  // Filter destinations based on user query
  const filteredDestinations = useMemo(() => {
    if (!destinationQuery.trim()) {
      return POPULAR_DESTINATIONS;
    }
    const q = destinationQuery.toLowerCase();
    const matches = POPULAR_DESTINATIONS.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.subtitle.toLowerCase().includes(q)
    );
    if (matches.length > 0) return matches;
    return [
      {
        id: 'custom_dest',
        title: destinationQuery,
        subtitle: 'Selected destination',
        distance: 'Direct route',
        icon: 'location-outline',
      },
      ...POPULAR_DESTINATIONS,
    ];
  }, [destinationQuery]);

  // Dynamic ride options with fares calculated from actual road distance matching Uber & Rapido
  const rideOptions: RideOption[] = useMemo(() => {
    const km = pinnedLocation?.distanceKm || (selectedDestination.includes('Aluva') ? 32 : 3.5);
    const round5 = (n: number) => Math.round(n / 5) * 5;

    const carMin = round5(Math.max(90, 70 + km * 20));
    const carMax = round5(carMin * 1.25);

    const bikeMin = round5(Math.max(25, 20 + km * 8));
    const bikeMax = round5(bikeMin * 1.3);

    const autoMin = round5(Math.max(40, 35 + km * 15));
    const autoMax = round5(autoMin * 1.25);

    const shareMin = round5(Math.max(35, 30 + km * 11));
    const shareMax = round5(shareMin * 1.25);

    const pinkMin = round5(Math.max(90, 70 + km * 20));
    const pinkMax = round5(pinkMin * 1.25);

    return [
      {
        id: 'ride',
        label: 'Car',
        subtitle: '4 min away',
        tagline: 'Affordable, comfortable rides',
        imageSource: rideSedanImg,
        etaMinutes: 4,
        priceMin: carMin,
        priceMax: carMax,
        priceFormatted: `₹${carMin} - ${carMax}`,
      },
      {
        id: 'bike',
        label: 'Bike',
        subtitle: '2 min away',
        tagline: 'Fastest through traffic',
        imageSource: bikeImg,
        etaMinutes: 2,
        priceMin: bikeMin,
        priceMax: bikeMax,
        priceFormatted: `₹${bikeMin} - ${bikeMax}`,
      },
      {
        id: 'auto',
        label: 'Auto',
        subtitle: '3 min away',
        tagline: 'Everyday economical Kerala auto',
        imageSource: autoImg,
        etaMinutes: 3,
        priceMin: autoMin,
        priceMax: autoMax,
        priceFormatted: `₹${autoMin} - ${autoMax}`,
      },
      {
        id: 'share',
        label: 'Share Taxi',
        subtitle: 'Share and save',
        tagline: 'Share with co-passengers & save',
        imageSource: shareTaxiImg,
        etaMinutes: 5,
        priceMin: shareMin,
        priceMax: shareMax,
        priceFormatted: `₹${shareMin} - ${shareMax}`,
      },
      {
        id: 'pink',
        label: 'Pink Ride',
        subtitle: 'Women only',
        tagline: 'Safe rides driven by women drivers',
        imageSource: pinkRideImg,
        etaMinutes: 4,
        priceMin: pinkMin,
        priceMax: pinkMax,
        priceFormatted: `₹${pinkMin} - ${pinkMax}`,
        womensOnly: true,
      },
    ];
  }, [pinnedLocation, selectedDestination]);

  const selectedRide = rideOptions.find((r) => r.id === selectedRideId) || rideOptions[0];

  return (
    <View style={styles.root}>
      {/* ── Background Map Layer (Kothamangalam / MACE) ── */}
      <KeralaMapBackground
        showVehicles={false}
        pickupLocation={pickupLocation}
        pickupCoords={pickupCoords}
        recenterTrigger={recenterTrigger}
        driverCoords={stage === 'ACTIVE_RIDE' ? liveDriverCoords : null}
        activeDestination={
          stage === 'PIN_ON_MAP'
            ? (pinnedLocation?.title || selectedDestination)
            : stage !== 'IDLE' && stage !== 'SEARCH_ROUTE'
            ? selectedDestination
            : undefined
        }
        isPinMode={stage === 'PIN_ON_MAP'}
        pinnedPoint={stage !== 'IDLE' && stage !== 'SEARCH_ROUTE' ? pinnedLocation : null}
        destinationPoint={stage !== 'IDLE' && stage !== 'SEARCH_ROUTE' ? pinnedLocation : null}
        onMapClick={(point) => {
          setPinnedLocation(point);
        }}
      />

      {/* ── Top Floating Search & Action Overlay (Only during IDLE) ── */}
      {stage === 'IDLE' && (
        <SafeAreaView edges={['top']} style={styles.topOverlayContainer}>
          {/* Floating Search Bar */}
          <FloatingSearchBar
            placeholder="Where do you want to go?"
            onPress={() => {
              setActiveInput('destination');
              setDestinationQuery('');
              setStage('SEARCH_ROUTE');
            }}
          />

          {/* Right Floating Map Buttons (Bell with dot badge + GPS Crosshairs + Pin on Map) */}
          <View style={styles.rightFloatingButtons}>
            <FloatingMapButton
              iconName="notifications-outline"
              iconColor="#1E293B"
              dotOnly={true}
              badgeColor={Colors.primaryVibrant}
              diameter={44}
              onPress={() => setNotificationsModalVisible(true)}
            />

            <FloatingMapButton
              iconName="locate-outline"
              iconColor={Colors.primary}
              diameter={44}
              onPress={async () => {
                const gps = await getCurrentGPSLocation();
                setPickupLocation(gps.address);
                setPickupCoords({ lat: gps.latitude, lng: gps.longitude });
                setRecenterTrigger((c) => c + 1);
              }}
            />

            <FloatingMapButton
              iconName="location-outline"
              iconColor={Colors.primary}
              diameter={44}
              onPress={() => {
                if (!pinnedLocation) {
                  if (pickupCoords) {
                    setPinnedLocation({
                      title: pickupLocation?.split(',')[0] || 'Current Location',
                      subtitle: pickupLocation || 'Current Location',
                      lat: pickupCoords.lat,
                      lng: pickupCoords.lng,
                    });
                  } else {
                    setPinnedLocation(getLocationPoint(selectedDestination));
                  }
                }
                setStage('PIN_ON_MAP');
              }}
            />

            {/* ── Drive Mode Toggle Pill ── */}
            {onToggleRole && (
              <TouchableOpacity
                style={styles.driverTogglePill}
                onPress={onToggleRole}
                activeOpacity={0.8}
              >
                <Icon library="MaterialCommunityIcons" name="steering" size={14} color={Colors.primary} />
                <Typography variant="xs" weight="bold" color={Colors.primary} style={{ marginLeft: 4 }}>
                  Drive
                </Typography>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      )}

      {/* ── STAGE: SEARCH_ROUTE (Traditional Uber / Rapido From & To Route Picker) ── */}
      {stage === 'SEARCH_ROUTE' && (
        <SafeAreaView edges={['top']} style={styles.searchRouteContainer}>
          {/* Top Header Bar */}
          <View style={styles.searchRouteHeader}>
            <TouchableOpacity
              style={styles.searchBackBtn}
              onPress={() => setStage('IDLE')}
              activeOpacity={0.7}
            >
              <Icon library="Ionicons" name="arrow-back" size={24} color="#0F172A" />
            </TouchableOpacity>

            <Typography variant="h3" weight="bold" color="#0F172A">
              Plan your ride
            </Typography>

            <View style={styles.forMeBadge}>
              <Icon library="Ionicons" name="person" size={12} color="#0F4A2B" />
              <Typography variant="xs" weight="bold" color="#0F4A2B" style={{ marginLeft: 4 }}>
                For Me ▾
              </Typography>
            </View>
          </View>

          {/* Route Card: From & To Inputs + Visual Connector + Instant Swap */}
          <View style={styles.routeInputCard}>
            {/* Visual Connector Column */}
            <View style={styles.connectorCol}>
              <View style={styles.pickupDotCircle}>
                <View style={styles.pickupDotInner} />
              </View>
              <View style={styles.dottedConnectorLine}>
                <View style={styles.connectorDot} />
                <View style={styles.connectorDot} />
                <View style={styles.connectorDot} />
              </View>
              <View style={styles.destSquareBox}>
                <View style={styles.destSquareInner} />
              </View>
            </View>

            {/* Inputs Column */}
            <View style={styles.inputsCol}>
              {/* Pickup Location */}
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  value={pickupLocation}
                  onChangeText={(text) => setPickupLocation(text)}
                  onFocus={() => setActiveInput('pickup')}
                  placeholder="Enter pickup location"
                  placeholderTextColor="#94A3B8"
                  underlineColorAndroid="transparent"
                  cursorColor="#0F4A2B"
                  selectionColor="#16A34A"
                />
                {pickupLocation ? (
                  <TouchableOpacity
                    onPress={() => setPickupLocation('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon library="Ionicons" name="close-circle" size={17} color="#94A3B8" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={async () => {
                      const gps = await getCurrentGPSLocation();
                      setPickupLocation(gps.address);
                      setPickupCoords({ lat: gps.latitude, lng: gps.longitude });
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon library="Ionicons" name="locate" size={18} color="#0F4A2B" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Destination */}
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  value={destinationQuery}
                  onChangeText={(text) => setDestinationQuery(text)}
                  onFocus={() => setActiveInput('destination')}
                  placeholder="Search destination, college, hostel..."
                  placeholderTextColor="#94A3B8"
                  autoFocus={true}
                  underlineColorAndroid="transparent"
                  cursorColor="#0F4A2B"
                  selectionColor="#16A34A"
                />
                {destinationQuery ? (
                  <TouchableOpacity
                    onPress={() => setDestinationQuery('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon library="Ionicons" name="close-circle" size={17} color="#94A3B8" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Swap Button Column */}
            <View style={styles.swapCol}>
              <TouchableOpacity
                style={styles.swapBtn}
                onPress={handleSwapLocations}
                activeOpacity={0.7}
              >
                <Icon library="Ionicons" name="swap-vertical" size={20} color="#0F4A2B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Shortcut Chips (Horizontal Scroll) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScrollContent}
            style={styles.chipsScrollView}
          >
            {ROUTE_SHORTCUTS.map((chip) => (
              <TouchableOpacity
                key={chip.id}
                style={styles.chipButton}
                activeOpacity={0.75}
                onPress={() => {
                  if (chip.id === 'set_map') {
                    if (!pinnedLocation) {
                      if (pickupCoords) {
                        setPinnedLocation({
                          title: pickupLocation?.split(',')[0] || 'Current Location',
                          subtitle: pickupLocation || 'Current Location',
                          lat: pickupCoords.lat,
                          lng: pickupCoords.lng,
                        });
                      } else {
                        setPinnedLocation(getLocationPoint(selectedDestination));
                      }
                    }
                    setStage('PIN_ON_MAP');
                  } else if (chip.target) {
                    handleSelectDestination(chip.target);
                  } else {
                    setStage('IDLE');
                  }
                }}
              >
                <Icon library="Ionicons" name={chip.icon as any} size={15} color="#0F4A2B" />
                <Typography variant="caption" weight="semiBold" color="#1E293B" style={{ marginLeft: 6 }}>
                  {chip.label}
                </Typography>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Destination Results & Recents List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.destListScrollContent}
            style={styles.destListScrollView}
          >
            {/* Set Location On Map Action Row */}
            <TouchableOpacity
              style={styles.pinMapActionItem}
              activeOpacity={0.75}
              onPress={() => {
                if (!pinnedLocation) {
                  if (pickupCoords) {
                    setPinnedLocation({
                      title: pickupLocation?.split(',')[0] || 'Current Location',
                      subtitle: pickupLocation || 'Current Location',
                      lat: pickupCoords.lat,
                      lng: pickupCoords.lng,
                    });
                  } else {
                    setPinnedLocation(getLocationPoint(selectedDestination));
                  }
                }
                setStage('PIN_ON_MAP');
              }}
            >
              <View style={styles.pinMapActionIconWrap}>
                <Icon library="Ionicons" name="map" size={18} color="#0F4A2B" />
              </View>
              <View style={styles.destItemTextWrap}>
                <Typography variant="body1" weight="bold" color="#0F4A2B">
                  Set location on map
                </Typography>
                <Typography variant="caption" color="#64748B" style={{ marginTop: 2 }}>
                  Tap anywhere on the live map to pinpoint destination
                </Typography>
              </View>
              <Icon library="Ionicons" name="chevron-forward" size={16} color="#0F4A2B" />
            </TouchableOpacity>

            <View style={styles.destSectionHeader}>
              <Typography variant="body2" weight="bold" color="#64748B">
                {predictions.length > 0
                  ? 'GOOGLE MAPS SEARCH RESULTS'
                  : isSearching
                  ? 'SEARCHING GOOGLE MAPS...'
                  : destinationQuery
                  ? 'MATCHING LOCATIONS'
                  : 'RECENT & POPULAR DESTINATIONS'}
              </Typography>
            </View>

            {predictions.length > 0
              ? predictions.map((pred) => (
                  <TouchableOpacity
                    key={pred.placeId}
                    style={styles.destItemRow}
                    activeOpacity={0.7}
                    onPress={() => handleSelectPrediction(pred)}
                  >
                    <View style={styles.destItemIconWrap}>
                      <Icon library="Ionicons" name="location-sharp" size={18} color="#0F4A2B" />
                    </View>

                    <View style={styles.destItemTextWrap}>
                      <Typography variant="body1" weight="semiBold" color="#0F172A">
                        {pred.primaryText}
                      </Typography>
                      <Typography variant="caption" color="#64748B" style={{ marginTop: 2 }}>
                        {pred.secondaryText || pred.fullText}
                      </Typography>
                    </View>

                    <View style={styles.destDistanceBox}>
                      <Badge
                        label={pred.distanceText || 'Google Maps'}
                        variant={pred.distanceText ? 'success' : 'info'}
                        size="sm"
                      />
                      <Icon library="Ionicons" name="chevron-forward" size={14} color="#94A3B8" style={{ marginLeft: 4 }} />
                    </View>
                  </TouchableOpacity>
                ))
              : filteredDestinations.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.destItemRow}
                    activeOpacity={0.7}
                    onPress={() => handleSelectDestination(item.title)}
                  >
                    <View style={styles.destItemIconWrap}>
                      <Icon library="Ionicons" name={item.icon as any} size={18} color="#0F4A2B" />
                    </View>

                    <View style={styles.destItemTextWrap}>
                      <Typography variant="body1" weight="semiBold" color="#0F172A">
                        {item.title}
                      </Typography>
                      <Typography variant="caption" color="#64748B" style={{ marginTop: 2 }}>
                        {item.subtitle}
                      </Typography>
                    </View>

                    <View style={styles.destDistanceBox}>
                      <Typography variant="xs" weight="bold" color="#0F4A2B">
                        {item.distance}
                      </Typography>
                      <Icon library="Ionicons" name="chevron-forward" size={14} color="#94A3B8" style={{ marginLeft: 2 }} />
                    </View>
                  </TouchableOpacity>
                ))}
          </ScrollView>
        </SafeAreaView>
      )}

      {/* ── STAGE: PIN_ON_MAP (Live Map Destination Pin Mode matching Uber & Rapido) ── */}
      {stage === 'PIN_ON_MAP' && (
        <SafeAreaView edges={['top']} style={styles.pinOnMapTopContainer}>
          <TouchableOpacity
            style={styles.pinBackBtn}
            onPress={() => setStage('SEARCH_ROUTE')}
            activeOpacity={0.7}
          >
            <Icon library="Ionicons" name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.pinInstructionBadge}>
            <Icon library="Ionicons" name="navigate" size={16} color="#0F4A2B" />
            <Typography variant="body2" weight="bold" color="#0F4A2B" style={{ marginLeft: 6 }}>
              Move map to place destination pin
            </Typography>
          </View>
        </SafeAreaView>
      )}

      {/* Floating GPS button on right to center back to current location / pickup */}
      {stage === 'PIN_ON_MAP' && (
        <View style={styles.pinLocateMeFloatingWrap}>
          <TouchableOpacity
            style={styles.pinLocateMeBtn}
            onPress={async () => {
              const gps = await getCurrentGPSLocation();
              setPickupLocation(gps.address);
              setPickupCoords({ lat: gps.latitude, lng: gps.longitude });
              setPinnedLocation({
                title: gps.address.split(',')[0] || 'Current Location',
                subtitle: gps.address,
                lat: gps.latitude,
                lng: gps.longitude,
              });
              setRecenterTrigger((c) => c + 1);
            }}
            activeOpacity={0.8}
          >
            <Icon library="Ionicons" name="locate" size={22} color="#0F4A2B" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── STAGE: PIN_ON_MAP Floating Bottom Destination Confirmation Card (Uber & Rapido style) ── */}
      {stage === 'PIN_ON_MAP' && (
        <View style={styles.pinOnMapBottomCard}>
          <View style={styles.pinSheetHandle} />

          <View style={styles.pinCardHeader}>
            <View style={styles.pinIconCircle}>
              <Icon library="Ionicons" name="location-sharp" size={24} color="#DC2626" />
            </View>
            <View style={styles.pinCardTextWrap}>
              <Typography variant="xs" weight="bold" color="#64748B" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                SELECTED DESTINATION
              </Typography>
              <Typography variant="h3" weight="bold" color="#0F172A" numberOfLines={1}>
                {pinnedLocation?.title || selectedDestination}
              </Typography>
              <Typography variant="caption" color="#64748B" numberOfLines={1} style={{ marginTop: 2 }}>
                {pinnedLocation?.subtitle || 'Move map to adjust dropoff spot'}
              </Typography>
            </View>
          </View>

          {/* Real Road Distance & Driving ETA Pill */}
          {pinnedLocation?.distanceKm ? (
            <View style={styles.tripStatsPill}>
              <Icon library="Ionicons" name="speedometer-outline" size={15} color="#0F4A2B" />
              <Typography variant="caption" weight="bold" color="#0F4A2B" style={{ marginLeft: 5 }}>
                {pinnedLocation.distanceKm} km
              </Typography>
              <Typography variant="caption" color="#94A3B8" style={{ marginHorizontal: 8 }}>
                •
              </Typography>
              <Icon library="Ionicons" name="time-outline" size={15} color="#0F4A2B" />
              <Typography variant="caption" weight="bold" color="#0F4A2B" style={{ marginLeft: 5 }}>
                ~{pinnedLocation.durationMins || Math.round(pinnedLocation.distanceKm * 1.5)} min drive
              </Typography>
            </View>
          ) : null}

          <View style={styles.pinCardActions}>
            <Button
              label="Confirm Destination"
              variant="primary"
              size="lg"
              fullWidth
              onPress={() => {
                const targetTitle = pinnedLocation?.title || selectedDestination;
                setSelectedDestination(targetTitle);
                setDestinationQuery(targetTitle);
                setStage('SELECT_RIDE');
              }}
              rightIcon={<Icon library="Ionicons" name="arrow-forward" size={18} color="#FFFFFF" />}
            />
          </View>
        </View>
      )}

      {/* ── IDLE STAGE: Slideable Middle Partition (Bottom Sheet with Suggestions & Recent) ── */}
      {stage === 'IDLE' && (
        <Animated.View style={[styles.bottomSheetContainer, { height: sheetHeightAnim }]}>
          {/* Top Drag Handle & Gesture Bar */}
          <View style={styles.dragHeaderArea} {...panResponder.panHandlers}>
            <TouchableOpacity
              onPress={toggleSheetExpansion}
              activeOpacity={0.8}
              style={styles.drawerHandleTouchWrap}
            >
              <View style={styles.drawerHandle} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.drawerScrollContent}
            bounces={true}
          >
            {/* Green Wave Decorative Header with 3D Car & Pin (scrolls with content) */}
            <View style={styles.decorativeWaveScrollWrap}>
              <SheetDecorativeWave />
            </View>

            {/* ── Suggestions Section ── */}
            <View style={styles.sectionHeaderRow}>
              <Typography variant="h3" weight="bold" color={Colors.textPrimary}>
                Suggestions
              </Typography>
              <TouchableOpacity
                onPress={() => Alert.alert('All Services', 'Browsing all KeralaGO transport services.')}
                activeOpacity={0.7}
              >
                <Typography variant="body2" weight="semiBold" color={Colors.textLink}>
                  See all
                </Typography>
              </TouchableOpacity>
            </View>

            {/* 2×4 Suggestions Grid */}
            <View style={styles.suggestionsGrid}>
              {/* Row 1: Ride, Bike, Auto, Pink Ride */}
              <View style={styles.gridRow}>
                <ServiceCategoryCard
                  label="Ride"
                  imageSource={rideSedanImg}
                  onPress={() => {
                    setSelectedRideId('ride');
                    handleSelectDestination(customerData.recentDestinations[0].title);
                  }}
                />

                <ServiceCategoryCard
                  label="Bike"
                  imageSource={bikeImg}
                  onPress={() => {
                    setSelectedRideId('bike');
                    handleSelectDestination(customerData.recentDestinations[1].title);
                  }}
                />

                <ServiceCategoryCard
                  label="Auto"
                  imageSource={autoImg}
                  onPress={() => {
                    setSelectedRideId('auto');
                    handleSelectDestination(customerData.recentDestinations[2].title);
                  }}
                />

                <ServiceCategoryCard
                  label="Pink Ride"
                  imageSource={pinkRideImg}
                  onPress={() => {
                    const g = (user?.gender || currentUserGender || '').toUpperCase();
                    if (g === 'MALE') {
                      setGenderWarningModalVisible(true);
                      return;
                    }
                    if (!g || g === 'UNSET') {
                      setPinkCabModalVisible(true);
                      return;
                    }
                    setSelectedRideId('pink');
                    handleSelectDestination(customerData.recentDestinations[0].title);
                  }}
                />
              </View>

              {/* Row 2: Package, Share Taxi, Rentals, Schedule Ride */}
              <View style={styles.gridRow}>
                <ServiceCategoryCard
                  label="Package"
                  imageSource={packageImg}
                  onPress={() => setPackageModalVisible(true)}
                />

                <ServiceCategoryCard
                  label="Share Taxi"
                  imageSource={shareTaxiImg}
                  onPress={() => {
                    setSelectedRideId('share');
                    handleSelectDestination('Kozhippilly Junction');
                  }}
                />

                <ServiceCategoryCard
                  label="Rentals"
                  imageSource={rentalsImg}
                  onPress={() => {
                    Alert.alert('KeralaGO Rentals', 'Hourly and daily vehicle rentals with driver.');
                  }}
                />

                <ServiceCategoryCard
                  label="Schedule Ride"
                  imageSource={scheduleRideImg}
                  onPress={() => {
                    Alert.alert('Schedule Ride', 'Book your upcoming trips in advance.');
                  }}
                />
              </View>
            </View>

            {/* ── Recent Section ── */}
            <View style={styles.sectionHeaderRow}>
              <Typography variant="h3" weight="bold" color={Colors.textPrimary}>
                Recent
              </Typography>
              <TouchableOpacity
                onPress={() => Alert.alert('Saved Places', 'All recent and saved places.')}
                activeOpacity={0.7}
              >
                <Typography variant="body2" weight="semiBold" color={Colors.textLink}>
                  See all
                </Typography>
              </TouchableOpacity>
            </View>

            <View style={styles.recentListContainer}>
              {customerData.recentDestinations.map((item, index) => (
                <LocationListItem
                  key={item.id}
                  title={item.title}
                  subtitle={item.subtitle}
                  iconName="time-outline"
                  iconBg="#F1F5F9"
                  iconColor="#334155"
                  showDivider={index < customerData.recentDestinations.length - 1}
                  onPress={() => handleSelectDestination(item.title)}
                />
              ))}
            </View>

            {/* ── Saved Places (visible when slided up) ── */}
            {customerData.savedLocations && customerData.savedLocations.length > 0 && (
              <>
                <View style={[styles.sectionHeaderRow, { marginTop: Spacing.md }]}>
                  <Typography variant="h3" weight="bold" color={Colors.textPrimary}>
                    Saved Places
                  </Typography>
                </View>

                <View style={styles.recentListContainer}>
                  {customerData.savedLocations.map((item, index) => (
                    <LocationListItem
                      key={item.id}
                      title={item.title}
                      subtitle={item.subtitle}
                      iconName={item.iconName || 'bookmark-outline'}
                      iconBg="#ECFDF5"
                      iconColor="#0F4A2B"
                      showDivider={index < customerData.savedLocations.length - 1}
                      onPress={() => handleSelectDestination(item.title)}
                    />
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </Animated.View>
      )}

      {/* ── STAGE 2: SELECT RIDE TOP FLOATING BAR (Back Button + Route Pill matching Column 2) ── */}
      {stage === 'SELECT_RIDE' && (
        <SafeAreaView edges={['top']} style={styles.selectRideTopContainer}>
          <TouchableOpacity
            style={styles.selectRideBackBtn}
            onPress={() => setStage('SEARCH_ROUTE')}
            activeOpacity={0.7}
          >
            <Icon library="Ionicons" name="chevron-back" size={24} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.selectRideRoutePill}>
            <View style={styles.selectRideDotsCol}>
              <View style={styles.pickupDotCircleSmall} />
              <View style={styles.dottedLineSmall} />
              <View style={styles.dropoffPinSmall}>
                <Icon library="Ionicons" name="location-sharp" size={13} color="#DC2626" />
              </View>
            </View>

            <TouchableOpacity
              style={styles.selectRideTextCol}
              onPress={() => {
                setActiveInput('destination');
                setStage('SEARCH_ROUTE');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.routePillText} numberOfLines={1}>
                {pickupLocation}
              </Text>
              <View style={styles.routePillDivider} />
              <Text style={styles.routePillText} numberOfLines={1}>
                {selectedDestination}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.selectRideSwapBtn}
              onPress={handleSwapLocations}
              activeOpacity={0.7}
            >
              <Icon library="Ionicons" name="swap-vertical" size={18} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      {/* ── STAGE 2: CHOOSE A RIDE BOTTOM PANEL (Half Screen matching Column 2) ── */}
      {stage === 'SELECT_RIDE' && (
        <View style={styles.chooseRideSheetContainer}>
          <View style={styles.chooseRideHeader}>
            <Typography variant="h3" weight="bold" color="#0F172A">
              Choose a ride
            </Typography>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.chooseRideScrollContent}
            style={styles.chooseRideScrollView}
          >
            <RideSelectionList
              options={rideOptions}
              selectedId={selectedRideId}
              onSelect={handleSelectRideType}
            />
          </ScrollView>

          {/* Quick Payment & Promo Selector Bar (Uber/Rapido style) */}
          <View style={styles.quickPaymentBar}>
            <TouchableOpacity
              style={styles.quickPaymentPill}
              onPress={() => setSelectedPaymentMethod(selectedPaymentMethod === 'cash' ? 'upi' : 'cash')}
              activeOpacity={0.7}
            >
              <Icon
                library="Ionicons"
                name={selectedPaymentMethod === 'cash' ? 'cash-outline' : 'phone-portrait-outline'}
                size={16}
                color="#0F4A2B"
              />
              <Typography variant="caption" weight="bold" color="#0F172A" style={{ marginLeft: 6 }}>
                {selectedPaymentMethod === 'cash' ? 'Cash' : 'UPI / GPay'}
              </Typography>
              <Icon library="Ionicons" name="chevron-down" size={12} color="#64748B" style={{ marginLeft: 4 }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickPromoPill}
              onPress={() => {
                if (appliedPromo) {
                  setAppliedPromo(null);
                  Alert.alert('Coupon Removed', 'Standard fares restored.');
                } else {
                  setAppliedPromo('KERALA50');
                  Alert.alert('KERALA50 Applied', '₹50 flat discount applied to your ride!');
                }
              }}
              activeOpacity={0.7}
            >
              <Icon library="Ionicons" name="pricetag" size={13} color="#15803D" />
              <Typography variant="xs" weight="bold" color="#15803D" style={{ marginLeft: 4 }}>
                {appliedPromo ? '₹50 OFF' : '% Coupons'}
              </Typography>
            </TouchableOpacity>
          </View>

          <View style={styles.chooseRideFooter}>
            <Button
              label={`Book ${selectedRide.label} • ₹${appliedPromo ? Math.max(20, selectedRide.priceMin - 50) : selectedRide.priceMin}`}
              variant="primary"
              size="lg"
              fullWidth
              onPress={() => setStage('CONFIRM_PAYMENT')}
              rightIcon={<Icon library="Ionicons" name="arrow-forward" size={18} color="#FFFFFF" />}
            />
            <Typography variant="xs" color="#64748B" align="center" style={{ marginTop: 6 }}>
              {selectedRide.subtitle || 'Nearest driver ~3 min away'} • Cash / UPI on ride completion
            </Typography>
          </View>
        </View>
      )}

      {/* ── STAGE 3: PAYMENT & CONFIRMATION TOP BAR (Floating Back & Safety Pill) ── */}
      {stage === 'CONFIRM_PAYMENT' && (
        <SafeAreaView edges={['top']} style={styles.confirmPaymentTopContainer}>
          <TouchableOpacity
            style={styles.selectRideBackBtn}
            onPress={() => setStage('SELECT_RIDE')}
            activeOpacity={0.7}
          >
            <Icon library="Ionicons" name="chevron-back" size={24} color="#0F172A" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.safetyPillBtn}
            onPress={() => {
              Alert.alert('KeralaGo Safety', '• 24x7 Emergency SOS\n• Verified Driver & Vehicle\n• Live Trip Tracking');
            }}
            activeOpacity={0.8}
          >
            <Icon library="Ionicons" name="shield-checkmark" size={17} color="#15803D" />
            <Text style={styles.safetyPillText}>Safety</Text>
          </TouchableOpacity>
        </SafeAreaView>
      )}

      {/* ── STAGE 3: PAYMENT & CONFIRMATION BOTTOM PANEL (Screen 3 matching Column 3) ── */}
      {stage === 'CONFIRM_PAYMENT' && (
        <View style={styles.confirmPaymentSheetContainer}>
          {/* Selected Vehicle Summary Header */}
          <View style={styles.paymentVehicleHeaderRow}>
            <ShimmerImage
              source={selectedRide.imageSource || rideSedanImg}
              style={styles.paymentVehicleImg}
              resizeMode="contain"
              fallbackIconName="car-sport"
            />
            <View style={styles.paymentVehicleInfoCol}>
              <Typography variant="h3" weight="bold" color="#0F172A">
                {selectedRide.label}
              </Typography>
              <Typography variant="caption" weight="semiBold" color="#64748B" style={{ marginTop: 1 }}>
                {selectedRide.subtitle || `${selectedRide.etaMinutes} min away`}
              </Typography>
              <Typography variant="xs" color="#94A3B8" style={{ marginTop: 1 }}>
                {selectedRide.tagline || 'Affordable, comfortable rides'}
              </Typography>
            </View>
            <Typography variant="h3" weight="bold" color="#0F172A">
              {appliedPromo ? `₹${selectedRide.priceMin - 50} - ${selectedRide.priceMax - 50}` : selectedRide.priceFormatted}
            </Typography>
          </View>

          {/* Payment Method Selector Box matching Screen 3 */}
          <View style={styles.paymentOptionsBox}>
            {/* Row 1: Cash */}
            <TouchableOpacity
              style={styles.paymentOptionRow}
              onPress={() => setSelectedPaymentMethod('cash')}
              activeOpacity={0.7}
            >
              <View style={styles.paymentOptionIconWrap}>
                <Icon library="Ionicons" name="cash-outline" size={20} color="#0F172A" />
              </View>
              <Typography variant="body2" weight="semiBold" color="#0F172A" style={styles.paymentOptionTitle}>
                Cash
              </Typography>
              <Icon
                library="Ionicons"
                name={selectedPaymentMethod === 'cash' ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={selectedPaymentMethod === 'cash' ? '#16A34A' : '#CBD5E1'}
              />
            </TouchableOpacity>

            <View style={styles.paymentOptionDivider} />

            {/* Row 2: UPI (GPay, PhonePe etc.) */}
            <TouchableOpacity
              style={styles.paymentOptionRow}
              onPress={() => setSelectedPaymentMethod('upi')}
              activeOpacity={0.7}
            >
              <View style={styles.paymentOptionIconWrap}>
                <Icon library="Ionicons" name="flash" size={20} color="#16A34A" />
              </View>
              <Typography variant="body2" weight="semiBold" color="#0F172A" style={styles.paymentOptionTitle}>
                UPI (GPay, PhonePe etc.)
              </Typography>
              <Icon
                library="Ionicons"
                name={selectedPaymentMethod === 'upi' ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={selectedPaymentMethod === 'upi' ? '#16A34A' : '#CBD5E1'}
              />
            </TouchableOpacity>

            <View style={styles.paymentOptionDivider} />

            {/* Row 3: Add new payment method */}
            <TouchableOpacity
              style={styles.paymentOptionRow}
              onPress={() => {
                Alert.alert('Add Payment Method', 'Link Google Pay, PhonePe or add a Credit/Debit Card.');
              }}
              activeOpacity={0.7}
            >
              <View style={styles.paymentOptionIconWrap}>
                <Icon library="Ionicons" name="card-outline" size={20} color="#0F172A" />
              </View>
              <Typography variant="body2" weight="semiBold" color="#0F172A" style={styles.paymentOptionTitle}>
                Add new payment method
              </Typography>
              <Icon library="Ionicons" name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Apply Promo Code Card */}
          <TouchableOpacity
            style={styles.promoCodeRow}
            onPress={() => {
              if (appliedPromo) {
                setAppliedPromo(null);
                Alert.alert('Promo Code', 'Promo code removed.');
              } else {
                setAppliedPromo('KERALAGO50');
                Alert.alert('Promo Applied!', '₹50 flat discount applied for code KERALAGO50.');
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.promoLeft}>
              <Icon library="Ionicons" name="pricetag-outline" size={18} color="#16A34A" />
              <Typography variant="body2" weight="semiBold" color="#0F172A" style={{ marginLeft: 10 }}>
                {appliedPromo ? `Promo Applied: ${appliedPromo} (-₹50)` : 'Apply Promo Code'}
              </Typography>
            </View>
            <Icon library="Ionicons" name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          {/* Book CTA */}
          <View style={styles.paymentFooterCTA}>
            <Button
              label={`Book ${selectedRide.label}`}
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleConfirmBooking}
            />
          </View>
        </View>
      )}

      {/* ── STAGE 4: SEARCHING DRIVER SCREEN (Screen 4 matching Column 4) ── */}
      {stage === 'SEARCHING_DRIVER' && (
        <View style={styles.searchingDriverRoot}>
          {/* Top action icons floating over map */}
          <SafeAreaView edges={['top']} style={styles.searchingTopHeader}>
            <TouchableOpacity
              style={styles.selectRideBackBtn}
              onPress={() => setStage('CONFIRM_PAYMENT')}
              activeOpacity={0.7}
            >
              <Icon library="Ionicons" name="chevron-down" size={24} color="#0F172A" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.searchingCallBtn}
              onPress={() => Alert.alert('Support Helpline', 'Connecting to 24/7 KeralaGO Support Helpline...')}
              activeOpacity={0.7}
            >
              <Icon library="Ionicons" name="call" size={20} color="#0F4A2B" />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Floating status text above bottom card */}
          <View style={styles.searchingStatusBanner}>
            <Animated.View
              style={[
                styles.radarPulseRing,
                { transform: [{ scale: searchPulseAnim }] },
              ]}
            >
              <Icon library="MaterialCommunityIcons" name="radar" size={32} color="#16A34A" />
            </Animated.View>
            <Typography variant="h3" weight="bold" color="#0F172A" align="center">
              Finding a driver nearby...
            </Typography>
            <Typography variant="caption" color="#64748B" align="center" style={{ marginTop: 4 }}>
              This may take a few seconds
            </Typography>
          </View>

          {/* Bottom Card matching Screen 4 */}
          <View style={styles.searchingDriverSheet}>
            <Typography variant="h3" weight="bold" color="#0F172A" style={{ marginBottom: 16 }}>
              Looking for the best driver for you
            </Typography>

            <View style={styles.driverStepRow}>
              <Icon library="Ionicons" name="checkmark-circle" size={24} color="#16A34A" />
              <Typography variant="body1" weight="semiBold" color="#0F172A" style={styles.driverStepText}>
                Searching nearby drivers
              </Typography>
            </View>

            <View style={styles.driverStepRow}>
              <Icon
                library="Ionicons"
                name={driverSearchStep >= 2 ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={driverSearchStep >= 2 ? '#16A34A' : '#CBD5E1'}
              />
              <Typography
                variant="body1"
                weight={driverSearchStep >= 2 ? 'semiBold' : 'medium'}
                color={driverSearchStep >= 2 ? '#0F172A' : '#64748B'}
                style={styles.driverStepText}
              >
                Checking availability
              </Typography>
            </View>

            <View style={styles.driverStepRow}>
              <Icon
                library="Ionicons"
                name={driverSearchStep >= 3 ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={driverSearchStep >= 3 ? '#16A34A' : '#CBD5E1'}
              />
              <Typography
                variant="body1"
                weight={driverSearchStep >= 3 ? 'semiBold' : 'medium'}
                color={driverSearchStep >= 3 ? '#0F172A' : '#64748B'}
                style={styles.driverStepText}
              >
                Confirming your ride
              </Typography>
            </View>

            <TouchableOpacity
              style={styles.cancelSearchBtn}
              onPress={() => setStage('CONFIRM_PAYMENT')}
              activeOpacity={0.7}
            >
              <Typography variant="body2" weight="semiBold" color="#DC2626">
                Cancel request
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── STAGE 5: ACTIVE RIDE SCREEN (Screen 5 matching Column 5) ── */}
      {stage === 'ACTIVE_RIDE' && (
        <View style={styles.activeRideRoot}>
          {/* Top floating bar: Chevron down + SOS pill */}
          <SafeAreaView edges={['top']} style={styles.activeRideTopHeader}>
            <TouchableOpacity
              style={styles.selectRideBackBtn}
              onPress={() => setStage('IDLE')}
              activeOpacity={0.7}
            >
              <Icon library="Ionicons" name="chevron-down" size={24} color="#0F172A" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sosPillBtn}
              onPress={handleTriggerSOS}
              activeOpacity={0.8}
            >
              <Icon library="Ionicons" name="alert-circle" size={17} color="#DC2626" />
              <Text style={styles.sosPillText}>SOS 112</Text>
            </TouchableOpacity>
          </SafeAreaView>

          {/* Floating ETA badge over vehicle on map */}
          <View style={styles.floatingEtaCallout}>
            <Typography variant="body2" weight="bold" color="#0F172A">
              {activeRideEtaMin} min
            </Typography>
            <Typography variant="xs" color="#64748B">
              away
            </Typography>
          </View>

          {/* Bottom Card matching Screen 5 with Start OTP PIN, Live Driver Info & Status */}
          <View style={styles.activeRideSheetContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Typography variant="h3" weight="bold" color="#0F172A">
                  {activeRideStatus === 'DRIVER_ARRIVED'
                    ? 'Driver Arrived at Pickup Point'
                    : activeRideStatus === 'IN_PROGRESS'
                    ? 'Trip In Progress to Destination'
                    : 'Driver Confirmed & On The Way'}
                </Typography>
                <Typography variant="xs" color="#16A34A" weight="bold" style={{ marginTop: 2 }}>
                  {activeRideStatus === 'DRIVER_ARRIVED'
                    ? 'ഡ്രൈവർ എത്തിക്കഴിഞ്ഞു • Please board vehicle'
                    : activeRideStatus === 'IN_PROGRESS'
                    ? 'യാത്ര ആരംഭിച്ചു • Safe journey'
                    : 'ഡ്രൈവർ വരുന്നു • Reaching shortly'}
                </Typography>
              </View>

              <TouchableOpacity
                style={styles.shareTripPill}
                onPress={handleShareLiveTrip}
                activeOpacity={0.7}
              >
                <Icon library="Ionicons" name="share-social-outline" size={15} color="#0F4A2B" />
                <Typography variant="xs" weight="bold" color="#0F4A2B" style={{ marginLeft: 4 }}>
                  Share
                </Typography>
              </TouchableOpacity>
            </View>

            {/* Prominent Start OTP PIN Banner */}
            <View style={styles.startPinCard}>
              <View style={styles.startPinHeader}>
                <Icon library="Ionicons" name="shield-checkmark" size={16} color="#0F4A2B" />
                <Typography variant="caption" weight="bold" color="#0F4A2B" style={{ marginLeft: 6 }}>
                  START OTP PIN
                </Typography>
                <View style={{ flex: 1 }} />
                <Badge label={activeRideCode} variant="neutral" size="sm" />
              </View>
              <View style={styles.startPinNumberRow}>
                <Typography variant="h1" weight="extraBold" color="#0F4A2B" style={styles.pinNumberText}>
                  {activeRideOtpPin}
                </Typography>
              </View>
              <Typography variant="xs" color="#64748B" style={{ marginTop: 2 }}>
                Share this 4-digit PIN with driver {assignedDriver.name} before starting trip
              </Typography>
            </View>

            {/* ETA & Arrival */}
            <View style={styles.activeRideEtaRow}>
              <View style={styles.activeRideEtaLeft}>
                <Icon library="Ionicons" name="navigate" size={18} color="#16A34A" />
                <View style={{ marginLeft: 8 }}>
                  <Typography variant="body1" weight="bold" color="#0F172A">
                    {activeRideEtaMin} min
                  </Typography>
                  <Typography variant="xs" color="#64748B">
                    {activeRideDistKm.toFixed(1)} km
                  </Typography>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Typography variant="body1" weight="bold" color="#0F172A">
                  {new Date(Date.now() + activeRideEtaMin * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
                <Typography variant="xs" color="#64748B">
                  Estimated arrival
                </Typography>
              </View>
            </View>

            {/* Trip Progression Visual Track */}
            <View style={styles.activeRideTrackRow}>
              <View style={styles.trackGreenDot} />
              <View style={styles.trackLineActive} />
              <View style={styles.trackVehiclePin}>
                <ShimmerImage source={selectedRide.imageSource || rideSedanImg} style={{ width: 28, height: 18 }} resizeMode="contain" fallbackIconName="car" />
              </View>
              <View style={styles.trackLineInactive} />
              <Icon library="Ionicons" name="location-sharp" size={18} color="#DC2626" />
            </View>

            {/* Driver Card */}
            <View style={styles.activeRideDriverCard}>
              <Avatar
                name={assignedDriver.name}
                src={assignedDriver.avatar}
                size="md"
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Typography variant="body1" weight="bold" color="#0F172A">
                  {assignedDriver.name}
                </Typography>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <Typography variant="caption" weight="bold" color="#0F172A">
                    {assignedDriver.rating}
                  </Typography>
                  <Icon library="Ionicons" name="star" size={13} color="#F59E0B" style={{ marginLeft: 2 }} />
                  <Typography variant="xs" color="#64748B" style={{ marginLeft: 6 }}>
                    ({assignedDriver.totalTrips} trips)
                  </Typography>
                </View>
              </View>

              <ShimmerImage source={selectedRide.imageSource || rideSedanImg} style={{ width: 50, height: 32 }} resizeMode="contain" fallbackIconName="car" />
              <View style={{ marginLeft: 8 }}>
                <Typography variant="caption" weight="bold" color="#0F172A">
                  {assignedDriver.vehiclePlate}
                </Typography>
                <Typography variant="xs" color="#64748B">
                  {assignedDriver.vehicleModel}
                </Typography>
              </View>
            </View>

            {/* Action Row */}
            <View style={styles.activeRideBtnRow}>
              <Button
                label="Complete Trip"
                variant="primary"
                size="md"
                onPress={() => setStage('TRIP_COMPLETED')}
                style={{ flex: 1 }}
              />

              <TouchableOpacity
                style={styles.driverChatBtn}
                onPress={() => setDriverChatModalVisible(true)}
                activeOpacity={0.7}
              >
                <Icon library="Ionicons" name="chatbubble-ellipses-outline" size={20} color="#0F4A2B" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.driverCallBtn}
                onPress={() => {
                  Linking.openURL(`tel:${assignedDriver.phone}`).catch(() => {
                    Alert.alert('Calling Driver', `Calling ${assignedDriver.name} (${assignedDriver.phone})...`);
                  });
                }}
                activeOpacity={0.7}
              >
                <Icon library="Ionicons" name="call" size={20} color="#0F4A2B" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelRideSmallBtn}
                onPress={() => setCancelModalVisible(true)}
                activeOpacity={0.7}
              >
                <Icon library="Ionicons" name="close" size={20} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ── STAGE 6: TRIP COMPLETED SCREEN (Screen 6 matching bottom row Screen 1) ── */}
      {stage === 'TRIP_COMPLETED' && (
        <SafeAreaView edges={['top']} style={styles.completedScreenRoot}>
          <TouchableOpacity
            style={styles.completedBackBtn}
            onPress={() => setStage('IDLE')}
            activeOpacity={0.7}
          >
            <Icon library="Ionicons" name="chevron-back" size={24} color="#0F172A" />
          </TouchableOpacity>

          <ScrollView
            contentContainerStyle={styles.completedScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Green Check Badge with decorative particles */}
            <View style={styles.completedBadgeWrap}>
              <View style={styles.completedCheckCircle}>
                <Icon library="Ionicons" name="checkmark" size={32} color="#FFFFFF" />
              </View>
            </View>

            <Typography variant="h2" weight="bold" color="#0F172A" align="center" style={{ marginTop: 12 }}>
              Trip Completed!
            </Typography>

            {/* Fare Summary Card — C07: Use actual ride fare computed from route distance */}
            <View style={styles.completedFareCard}>
              {(() => {
                const baseFare = appliedPromo
                  ? Math.max(20, selectedRide.priceMin - 50)
                  : selectedRide.priceMin;
                const tax = Math.round(baseFare * 0.09);
                const total = baseFare + tax;
                return (
                  <>
                    <Typography variant="h1" weight="extraBold" color="#0F172A" align="center">
                      ₹{total}
                    </Typography>
                    <Typography variant="body2" color="#64748B" align="center" style={{ marginTop: 2 }}>
                      Paid via {selectedPaymentMethod === 'cash' ? 'Cash' : 'UPI'}
                    </Typography>
                    <TouchableOpacity
                      onPress={() => Alert.alert(
                        'Fare Breakdown',
                        `Base Fare: ₹${baseFare}\nDistance (${activeRideDistKm.toFixed(1)} km): included\nGST & Platform Fee: ₹${tax}\nTotal Paid: ₹${total}${
                          appliedPromo ? `\nPromo (${appliedPromo}): -₹50` : ''
                        }`
                      )}
                      activeOpacity={0.7}
                      style={{ alignSelf: 'center', marginTop: 6 }}
                    >
                      <Typography variant="caption" weight="semiBold" color="#16A34A">
                        {'View Breakdown >'}
                      </Typography>
                    </TouchableOpacity>
                  </>
                );
              })()}
            </View>

            {/* Driver Summary Row */}
            <View style={styles.completedDriverRow}>
              <Avatar
                name="Rijin S"
                src={customerData.activeRideSim.driverAvatar}
                size="md"
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Typography variant="body1" weight="bold" color="#0F172A">
                  Rijin S
                </Typography>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <Typography variant="caption" weight="bold" color="#0F172A">
                    4.8
                  </Typography>
                  <Icon library="Ionicons" name="star" size={13} color="#F59E0B" style={{ marginLeft: 2 }} />
                </View>
              </View>

              <ShimmerImage source={rideSedanImg} style={{ width: 50, height: 32 }} resizeMode="contain" fallbackIconName="car" />
              <View style={{ marginLeft: 8 }}>
                <Typography variant="caption" weight="bold" color="#0F172A">
                  KL 07 AB 1234
                </Typography>
                <Typography variant="xs" color="#64748B">
                  Maruti Swift - White
                </Typography>
              </View>
            </View>

            {/* Rate Driver Section */}
            <View style={styles.completedRatingSection}>
              <Typography variant="body1" weight="bold" color="#0F172A">
                Rate your driver
              </Typography>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setUserRating(star)}
                    activeOpacity={0.7}
                    style={{ padding: 4 }}
                  >
                    <Icon
                      library="Ionicons"
                      name={star <= userRating ? 'star' : 'star-outline'}
                      size={28}
                      color="#F59E0B"
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.completedFeedbackInput}
                value={feedbackText}
                onChangeText={setFeedbackText}
                placeholder="Leave feedback..."
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Done CTA */}
            <View style={{ marginTop: 24, paddingBottom: 20 }}>
              <Button
                label="Done"
                variant="primary"
                size="lg"
                fullWidth
                onPress={handleFinishCompletedTrip}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      )}
      {/* ── Notifications Panel Modal (C13) ── */}
      <Modal visible={notificationsModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.homeModalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.notifHeaderIcon}>
                  <Icon library="Ionicons" name="notifications" size={20} color="#0F4A2B" />
                </View>
                <Typography variant="h3" weight="bold" color="#0F172A">
                  KeralaGo Notifications
                </Typography>
              </View>
              <TouchableOpacity onPress={() => setNotificationsModalVisible(false)}>
                <Icon library="Ionicons" name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              <View style={styles.notifCard}>
                <View style={[styles.notifBadgeCircle, { backgroundColor: '#DCFCE7' }]}>
                  <Icon library="Ionicons" name="pricetag" size={18} color="#16A34A" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Typography variant="body2" weight="bold" color="#0F172A">
                    Flat ₹50 OFF Ride Discount
                  </Typography>
                  <Typography variant="xs" color="#64748B" style={{ marginTop: 2 }}>
                    Code KERALAGO50 applied! Valid on all auto & cab bookings this week.
                  </Typography>
                  <Typography variant="xs" weight="semiBold" color="#16A34A" style={{ marginTop: 4 }}>
                    Active • Expires in 2 days
                  </Typography>
                </View>
              </View>

              <View style={styles.notifCard}>
                <View style={[styles.notifBadgeCircle, { backgroundColor: '#E0F2FE' }]}>
                  <Icon library="Ionicons" name="rainy" size={18} color="#0284C7" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Typography variant="body2" weight="bold" color="#0F172A">
                    Monsoon Ready in Kothamangalam
                  </Typography>
                  <Typography variant="xs" color="#64748B" style={{ marginTop: 2 }}>
                    Heavy rain forecast. Covered auto-rickshaws and cabs prioritized nearby.
                  </Typography>
                  <Typography variant="xs" color="#94A3B8" style={{ marginTop: 4 }}>
                    10 min ago
                  </Typography>
                </View>
              </View>

              <View style={styles.notifCard}>
                <View style={[styles.notifBadgeCircle, { backgroundColor: '#FEF3C7' }]}>
                  <Icon library="Ionicons" name="shield-checkmark" size={18} color="#D97706" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Typography variant="body2" weight="bold" color="#0F172A">
                    Driver Vetting Notice
                  </Typography>
                  <Typography variant="xs" color="#64748B" style={{ marginTop: 2 }}>
                    All active drivers on KeralaGo carry authenticated Kerala Police PCC credentials.
                  </Typography>
                  <Typography variant="xs" color="#94A3B8" style={{ marginTop: 4 }}>
                    Yesterday
                  </Typography>
                </View>
              </View>

              <View style={styles.notifCard}>
                <View style={[styles.notifBadgeCircle, { backgroundColor: '#F3E8FF' }]}>
                  <Icon library="Ionicons" name="wallet" size={18} color="#9333EA" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Typography variant="body2" weight="bold" color="#0F172A">
                    Wallet Top-Up Cashback
                  </Typography>
                  <Typography variant="xs" color="#64748B" style={{ marginTop: 2 }}>
                    Add ₹200 to your KeralaGo Wallet to receive ₹25 instant cashback reward.
                  </Typography>
                  <Typography variant="xs" color="#94A3B8" style={{ marginTop: 4 }}>
                    2 days ago
                  </Typography>
                </View>
              </View>
            </ScrollView>

            <View style={{ marginTop: 14 }}>
              <Button
                label="Dismiss All"
                variant="outline"
                size="md"
                fullWidth
                onPress={() => setNotificationsModalVisible(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Package Delivery Flow Modal (C20) ── */}
      <Modal visible={packageModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.homeModalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.notifHeaderIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Icon library="Ionicons" name="cube" size={20} color="#D97706" />
                </View>
                <Typography variant="h3" weight="bold" color="#0F172A">
                  KeralaGo Package Courier
                </Typography>
              </View>
              <TouchableOpacity onPress={() => setPackageModalVisible(false)}>
                <Icon library="Ionicons" name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Typography variant="caption" color="#64748B" style={{ marginBottom: 12 }}>
              Fast intra-city parcel & document delivery by verified bike/auto captains.
            </Typography>

            <Typography variant="caption" weight="bold" color="#0F172A" style={{ marginBottom: 6 }}>
              PACKAGE TYPE
            </Typography>
            <View style={styles.packageTypeRow}>
              {['Documents', 'Parcel', 'Food Box', 'Medicine'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.pkgChip, packageType === type && styles.pkgChipActive]}
                  onPress={() => setPackageType(type)}
                >
                  <Typography
                    variant="xs"
                    weight="bold"
                    color={packageType === type ? '#FFFFFF' : '#475569'}
                  >
                    {type}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>

            <Typography variant="caption" weight="bold" color="#0F172A" style={{ marginTop: 12, marginBottom: 4 }}>
              PICKUP FROM
            </Typography>
            <View style={styles.packageInputWrap}>
              <Icon library="Ionicons" name="location-outline" size={16} color="#16A34A" />
              <Typography variant="body2" color="#0F172A" numberOfLines={1} style={{ marginLeft: 8, flex: 1 }}>
                {pickupLocation}
              </Typography>
            </View>

            <Typography variant="caption" weight="bold" color="#0F172A" style={{ marginTop: 10, marginBottom: 4 }}>
              RECIPIENT NAME & PHONE
            </Typography>
            <TextInput
              style={styles.packageTextInput}
              placeholder="e.g. Rahul Nair (+91 98470 99999)"
              value={packageReceiver}
              onChangeText={setPackageReceiver}
              placeholderTextColor="#94A3B8"
            />

            <Typography variant="caption" weight="bold" color="#0F172A" style={{ marginTop: 10, marginBottom: 4 }}>
              DELIVERY DESTINATION
            </Typography>
            <TextInput
              style={styles.packageTextInput}
              placeholder="e.g. Kozhippilly Junction, Kothamangalam"
              value={packageDropoff}
              onChangeText={setPackageDropoff}
              placeholderTextColor="#94A3B8"
            />

            <View style={styles.packageFareBanner}>
              <View>
                <Typography variant="caption" color="#64748B">
                  Estimated Courier Fee
                </Typography>
                <Typography variant="h3" weight="bold" color="#0F4A2B">
                  ₹65
                </Typography>
              </View>
              <Badge label="~25 min delivery" variant="success" size="sm" />
            </View>

            <View style={{ marginTop: 14, gap: 8 }}>
              <Button
                label="Request Package Pickup"
                variant="primary"
                size="md"
                fullWidth
                onPress={() => {
                  setPackageModalVisible(false);
                  Alert.alert(
                    'Courier Dispatched',
                    `Your ${packageType} pickup request has been placed!\nA nearby delivery captain is on the way to ${pickupLocation.split(',')[0]}.`
                  );
                }}
              />
              <Button
                label="Cancel"
                variant="outline"
                size="sm"
                fullWidth
                onPress={() => setPackageModalVisible(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Pink Cab Instant Gender Verification Modal ── */}
      <Modal visible={pinkCabModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.homeModalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.notifHeaderIcon, { backgroundColor: '#FCE7F3' }]}>
                  <Icon library="Ionicons" name="shield-checkmark" size={20} color="#DB2777" />
                </View>
                <Typography variant="h3" weight="bold" color="#0F172A">
                  Pink Cab Safe Pass
                </Typography>
              </View>
              <TouchableOpacity onPress={() => setPinkCabModalVisible(false)}>
                <Icon library="Ionicons" name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Typography variant="body2" color="#334155" style={{ marginBottom: 12 }}>
              Pink Ride is exclusively reserved for women passengers with vetted women drivers to guarantee safety. Please verify your passenger profile to proceed:
            </Typography>

            <View style={{ gap: 10, marginTop: 4 }}>
              <TouchableOpacity
                style={styles.genderSelectOptionCard}
                onPress={async () => {
                  try {
                    await updateCustomerProfile({ gender: 'FEMALE' });
                    await updateProfile(user?.name || userName, undefined, 'FEMALE');
                  } catch {}
                  setCurrentUserGender('FEMALE');
                  setSelectedRideId('pink');
                  setPinkCabModalVisible(false);
                  Alert.alert(
                    'Pink Cab Unlocked (സുരക്ഷിത യാത്ര)',
                    'Female profile confirmed and saved to database. Pink Ride is now available!'
                  );
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.genderIconWrap, { backgroundColor: '#FDF2F8' }]}>
                  <Icon library="Ionicons" name="woman" size={24} color="#DB2777" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Typography variant="body1" weight="bold" color="#0F172A">
                    Female Passenger
                  </Typography>
                  <Typography variant="xs" color="#64748B">
                    Unlock Pink Ride with vetted female drivers
                  </Typography>
                </View>
                <Icon library="Ionicons" name="chevron-forward" size={18} color="#DB2777" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.genderSelectOptionCard}
                onPress={async () => {
                  try {
                    await updateCustomerProfile({ gender: 'MALE' });
                    await updateProfile(user?.name || userName, undefined, 'MALE');
                  } catch {}
                  setCurrentUserGender('MALE');
                  setSelectedRideId('ride');
                  setPinkCabModalVisible(false);
                  Alert.alert(
                    'Profile Saved',
                    'Standard Car, Auto, and Bike rides are ready for booking.'
                  );
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.genderIconWrap, { backgroundColor: '#F1F5F9' }]}>
                  <Icon library="Ionicons" name="man" size={24} color="#0F4A2B" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Typography variant="body1" weight="bold" color="#0F172A">
                    Male Passenger
                  </Typography>
                  <Typography variant="xs" color="#64748B">
                    Book KeralaGO Car, Auto, or Bike
                  </Typography>
                </View>
                <Icon library="Ionicons" name="chevron-forward" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 16 }}>
              <Button
                label="Cancel"
                variant="outline"
                size="md"
                fullWidth
                onPress={() => setPinkCabModalVisible(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Pink Cab Gender Policy Warning Modal ── */}
      <Modal visible={genderWarningModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.homeModalCard}>
            <View style={{ alignItems: 'center', paddingVertical: 8 }}>
              <View style={[styles.notifHeaderIcon, { backgroundColor: '#FEE2E2', width: 48, height: 48, borderRadius: 24, marginBottom: 10 }]}>
                <Icon library="Ionicons" name="shield-half" size={26} color="#DC2626" />
              </View>
              <Typography variant="h3" weight="bold" color="#0F172A" align="center">
                Women Only Fleet (വനിതാ റൈഡ്)
              </Typography>
              <Typography variant="body2" color="#64748B" align="center" style={{ marginTop: 8, paddingHorizontal: 8 }}>
                As per KeralaGo Safety Policy, Pink Ride is strictly reserved for verified women passengers with female drivers.
              </Typography>
              <Typography variant="caption" color="#0F4A2B" weight="semiBold" align="center" style={{ marginTop: 8 }}>
                Your database profile is registered as Male. Please select KeralaGO Car, Auto, or Bike.
              </Typography>
            </View>

            <View style={{ marginTop: 16, gap: 8 }}>
              <Button
                label="Switch to Standard Car"
                variant="primary"
                size="md"
                fullWidth
                onPress={() => {
                  setSelectedRideId('ride');
                  setGenderWarningModalVisible(false);
                }}
              />
              <Button
                label="Book Kerala Auto"
                variant="outline"
                size="md"
                fullWidth
                onPress={() => {
                  setSelectedRideId('auto');
                  setGenderWarningModalVisible(false);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Ride Cancellation Reason Modal ── */}
      <Modal visible={cancelModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.homeModalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.notifHeaderIcon, { backgroundColor: '#FEE2E2' }]}>
                  <Icon library="Ionicons" name="close-circle" size={20} color="#DC2626" />
                </View>
                <Typography variant="h3" weight="bold" color="#0F172A">
                  Cancel Ride
                </Typography>
              </View>
              <TouchableOpacity onPress={() => setCancelModalVisible(false)}>
                <Icon library="Ionicons" name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Typography variant="caption" color="#64748B" style={{ marginBottom: 12 }}>
              Please select a cancellation reason. Free cancellation applies within 5 minutes.
            </Typography>

            <View style={{ gap: 8 }}>
              {[
                'Driver is taking too long',
                'Driver not moving in right direction',
                'Changed my travel plans',
                'Driver requested me to cancel',
                'Wrong pickup or dropoff address',
              ].map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.cancelReasonRow,
                    cancelReason === reason && styles.cancelReasonRowActive,
                  ]}
                  onPress={() => setCancelReason(reason)}
                  activeOpacity={0.7}
                >
                  <Icon
                    library="Ionicons"
                    name={cancelReason === reason ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={cancelReason === reason ? '#DC2626' : '#94A3B8'}
                  />
                  <Typography variant="body2" color="#0F172A" style={{ marginLeft: 10, flex: 1 }}>
                    {reason}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ marginTop: 16, gap: 8 }}>
              <Button
                label="Confirm Cancellation"
                variant="danger"
                size="md"
                fullWidth
                onPress={handleCancelRide}
              />
              <Button
                label="Keep Ride"
                variant="outline"
                size="md"
                fullWidth
                onPress={() => setCancelModalVisible(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Real-Time Driver In-App Chat Modal ── */}
      <RideChatModal
        visible={driverChatModalVisible}
        rideId={activeRideDbId || 'active_trip'}
        recipientName={assignedDriver.name}
        recipientRole="driver"
        recipientAvatar={assignedDriver.avatar}
        currentUserId={user?.id}
        isCurrentUserDriver={false}
        onClose={() => setDriverChatModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#EDF3EE',
  },
  topOverlayContainer: {
    paddingHorizontal: Spacing.base,
    zIndex: 20,
  },
  rightFloatingButtons: {
    position: 'absolute',
    right: Spacing.base,
    top: 68,
    gap: Spacing.sm,
    zIndex: 25,
    alignItems: 'center',
  },
  driverTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radii.full,
    borderWidth: 1.5,
    borderColor: Colors.mintBorder,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    ...Shadows.sm,
  },
  bottomSheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
    zIndex: 15,
    overflow: 'hidden',
  },
  dragHeaderArea: {
    width: '100%',
    backgroundColor: Colors.white,
  },
  drawerHandleTouchWrap: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
  },
  drawerHandle: {
    width: 44,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: '#CBD5E1',
  },
  decorativeWaveScrollWrap: {
    marginHorizontal: -Spacing.base,
    marginBottom: Spacing.xs,
  },
  drawerScrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: 32,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  suggestionsGrid: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pinkShieldBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EC4899',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  shareTaxiGraphicWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareTaxiPassengerBadge: {
    marginBottom: -4,
  },
  rentalsGraphicWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleGraphicWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentListContainer: {
    paddingTop: 2,
  },
  bookingSheetContent: {
    paddingBottom: Spacing.sm,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  routeBox: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radii.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radii.md,
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  radarOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.base,
    zIndex: 99,
  },
  radarCard: {
    width: '100%',
    padding: Spacing.xl,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  radarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.mintLight,
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  searchingMetaBox: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  radarActionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
  activeRideSheetWrapper: {
    position: 'absolute',
    bottom: Spacing.base,
    left: Spacing.base,
    right: Spacing.base,
    zIndex: 90,
  },
  activeRideCard: {
    padding: Spacing.base,
    backgroundColor: Colors.white,
  },
  driverInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverMeta: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  driverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  driverRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginVertical: 2,
  },
  pinContainer: {
    alignItems: 'center',
    backgroundColor: Colors.mintLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.mintBorder,
  },
  progressSection: {
    marginTop: Spacing.md,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  contactButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  tripActionRow: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  cancelLink: {
    marginTop: Spacing.sm,
    paddingVertical: 4,
  },
  completedOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.base,
    zIndex: 100,
  },
  completedCardContainer: {
    width: '100%',
    maxHeight: '90%',
  },
  changeRoutePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  searchRouteContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#F8FAFC',
    zIndex: 50,
  },
  searchRouteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  forMeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  routeInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    ...Shadows.sm,
  },
  connectorCol: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  pickupDotCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  pickupDotInner: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#0F4A2B',
  },
  dottedConnectorLine: {
    flex: 1,
    width: 2,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginVertical: 4,
  },
  connectorDot: {
    width: 2.5,
    height: 4,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
  },
  destSquareBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  destSquareInner: {
    width: 6,
    height: 6,
    borderRadius: 1,
    backgroundColor: '#DC2626',
  },
  inputsCol: {
    flex: 1,
    paddingHorizontal: Spacing.xs,
    justifyContent: 'center',
    gap: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    paddingVertical: 4,
    borderWidth: 0,
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        outlineWidth: 0,
        outlineColor: 'transparent',
        boxShadow: 'none',
      },
    }),
  } as any,
  swapCol: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.xs,
  },
  chipsScrollView: {
    maxHeight: 52,
    marginTop: Spacing.sm,
  },
  chipsScrollContent: {
    paddingHorizontal: Spacing.base,
    gap: 8,
    alignItems: 'center',
  },
  chipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.xs,
  },
  destListScrollView: {
    flex: 1,
    marginTop: Spacing.xs,
  },
  destListScrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: 40,
  },
  destSectionHeader: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: 4,
  },
  destItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Shadows.xs,
  },
  destItemIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  destItemTextWrap: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  destDistanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  selectRideTopContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: 12,
    zIndex: 30,
    gap: 10,
  },
  selectRideBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.md,
  },
  selectRideRoutePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.md,
  },
  selectRideDotsCol: {
    width: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  pickupDotCircleSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  dottedLineSmall: {
    width: 1,
    height: 12,
    backgroundColor: '#94A3B8',
    marginVertical: 2,
  },
  dropoffPinSmall: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectRideTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  routePillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  routePillDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 3,
  },
  selectRideSwapBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  chooseRideSheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '52%',
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    paddingHorizontal: Spacing.base,
    paddingBottom: 20,
    ...Shadows.lg,
    zIndex: 20,
  },
  chooseRideHeader: {
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  chooseRideScrollView: {
    flex: 1,
  },
  chooseRideScrollContent: {
    paddingVertical: 2,
    gap: 4,
  },
  chooseRideFooter: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  confirmPaymentTopContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: 12,
    zIndex: 30,
  },
  safetyPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.md,
  },
  safetyPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
    marginLeft: 6,
  },
  confirmPaymentSheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    paddingHorizontal: Spacing.base,
    paddingBottom: 24,
    ...Shadows.lg,
    zIndex: 20,
  },
  paymentVehicleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  paymentVehicleImg: {
    width: 68,
    height: 42,
  },
  paymentVehicleInfoCol: {
    flex: 1,
    marginLeft: 12,
  },
  paymentOptionsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginTop: 12,
    ...Shadows.xs,
  },
  paymentOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  paymentOptionIconWrap: {
    width: 28,
    alignItems: 'flex-start',
  },
  paymentOptionTitle: {
    flex: 1,
    marginLeft: 4,
  },
  paymentOptionDivider: {
    height: 1,
    backgroundColor: '#F8FAFC',
    marginLeft: 42,
  },
  promoCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginTop: 10,
    ...Shadows.xs,
  },
  promoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentFooterCTA: {
    marginTop: 14,
  },
  searchingDriverRoot: {
    ...StyleSheet.absoluteFill,
    zIndex: 40,
    justifyContent: 'space-between',
  },
  searchingTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: 12,
  },
  searchingCallBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDF8F1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    ...Shadows.md,
  },
  searchingStatusBanner: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  radarPulseRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#DCFCE7',
    borderWidth: 2,
    borderColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  searchingDriverSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 28,
    ...Shadows.lg,
  },
  driverStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  driverStepText: {
    marginLeft: 12,
  },
  cancelSearchBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 6,
  },
  activeRideRoot: {
    ...StyleSheet.absoluteFill,
    zIndex: 40,
    justifyContent: 'space-between',
  },
  activeRideTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: 12,
  },
  sosPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: Radii.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    ...Shadows.md,
  },
  sosPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
    marginLeft: 6,
  },
  floatingEtaCallout: {
    position: 'absolute',
    top: '25%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.md,
  },
  activeRideSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 24,
    ...Shadows.lg,
  },
  activeRideEtaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  activeRideEtaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeRideTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  trackGreenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16A34A',
  },
  trackLineActive: {
    flex: 1,
    height: 3,
    backgroundColor: '#16A34A',
  },
  trackVehiclePin: {
    paddingHorizontal: 4,
  },
  trackLineInactive: {
    flex: 1,
    height: 3,
    backgroundColor: '#E2E8F0',
  },
  activeRideDriverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    marginVertical: 12,
  },
  activeRideBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  driverCallBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EDF8F1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  completedScreenRoot: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
    zIndex: 50,
  },
  completedBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
    marginTop: 8,
  },
  completedScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
  completedBadgeWrap: {
    alignItems: 'center',
    marginTop: 10,
  },
  completedCheckCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  completedFareCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  completedDriverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Shadows.xs,
  },
  completedRatingSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 12,
    gap: 6,
  },
  completedFeedbackInput: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  pinMapActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  pinMapActionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pinOnMapTopContainer: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    zIndex: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pinBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  pinInstructionBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pinOnMapBottomCard: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    zIndex: 40,
    ...Shadows.lg,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  pinCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pinIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  pinCardTextWrap: {
    flex: 1,
  },
  pinCardActions: {
    marginTop: 4,
  },
  pinSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  pinLocateMeFloatingWrap: {
    position: 'absolute',
    bottom: 230,
    right: 18,
    zIndex: 42,
  },
  pinLocateMeBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tripStatsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 14,
  },
  quickPaymentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
  },
  quickPaymentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.xs,
  },
  quickPromoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.base,
  },
  homeModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  notifHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDF8F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  notifBadgeCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packageTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  pkgChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.full,
    backgroundColor: '#F1F5F9',
  },
  pkgChipActive: {
    backgroundColor: '#16A34A',
  },
  packageInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  packageTextInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  packageFareBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  startPinCard: {
    backgroundColor: '#EDF8F1',
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
  },
  startPinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  startPinNumberRow: {
    alignItems: 'center',
    marginVertical: 4,
  },
  pinNumberText: {
    letterSpacing: 8,
    fontSize: 28,
  },
  shareTripPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF8F1',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  driverChatBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EDF8F1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  cancelRideSmallBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  genderSelectOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  genderIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelReasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelReasonRowActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  chatQuickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chatHistoryBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  chatBubbleSent: {
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    padding: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
});

export default CustomerHomeView;

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
} from '../../../components/atoms';
import {
  FloatingSearchBar,
  FloatingMapButton,
  ServiceCategoryCard,
  LocationListItem,
  RoutePointRow,
  ProgressBar,
  KeralaMapBackground,
  SheetDecorativeWave,
} from '../../../components/molecules';
import {
  BottomSheet,
  RideSelectionList,
  TripCompletedCard,
  RideOption,
} from '../../../components/organisms';
import { Colors, Spacing, Radii, Shadows } from '../../../constants/theme';
import { customerData } from '../../../data';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Precise snap points matching reference UI proportions:
// - Default (57% height): shows suggestions + recent destinations exactly like reference UI
// - Expanded (86% height): slides up to reveal all suggestions, recent items, and saved places
// - Collapsed (24% height): exposes 76% of map view
const DEFAULT_SHEET_HEIGHT = Math.round(SCREEN_HEIGHT * 0.57);
const EXPANDED_SHEET_HEIGHT = Math.round(SCREEN_HEIGHT * 0.86);
const COLLAPSED_SHEET_HEIGHT = Math.round(SCREEN_HEIGHT * 0.24);

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
  const [pickupLocation, setPickupLocation] = useState<string>('Mar Athanasius College of Engineering');
  const [destinationQuery, setDestinationQuery] = useState<string>('');
  const [activeInput, setActiveInput] = useState<'pickup' | 'destination'>('destination');
  const [selectedRideId, setSelectedRideId] = useState<string>('ride');
  const [searchPulseAnim] = useState(new Animated.Value(1));
  const [rideProgress, setRideProgress] = useState<number>(0.35);

  // Payment & Promo state matching Screen 3 of reference flow
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'upi' | 'new'>('upi');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [driverSearchStep, setDriverSearchStep] = useState<number>(1);
  const [userRating, setUserRating] = useState<number>(4);
  const [feedbackText, setFeedbackText] = useState<string>('Good ride!');

  // Sync booking state to parent to manage tab bar visibility
  useEffect(() => {
    onBookingStateChange?.(stage !== 'IDLE');
  }, [stage, onBookingStateChange]);

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

  // Radar pulse and search progress animation for SEARCHING_DRIVER stage matching Screen 4
  useEffect(() => {
    if (stage === 'SEARCHING_DRIVER') {
      setDriverSearchStep(1);
      const step2Timer = setTimeout(() => setDriverSearchStep(2), 1200);
      const step3Timer = setTimeout(() => setDriverSearchStep(3), 2400);
      const matchTimer = setTimeout(() => setStage('ACTIVE_RIDE'), 3800);

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
        clearTimeout(step2Timer);
        clearTimeout(step3Timer);
        clearTimeout(matchTimer);
      };
    }
  }, [stage, searchPulseAnim]);

  // Swap pickup & destination handler
  const handleSwapLocations = () => {
    const prevPickup = pickupLocation;
    const prevDest = selectedDestination;
    setPickupLocation(prevDest);
    setSelectedDestination(prevPickup);
    setDestinationQuery(prevPickup);
  };

  // Handle destination selection
  const handleSelectDestination = (destTitle: string) => {
    if (activeInput === 'pickup') {
      setPickupLocation(destTitle);
      setActiveInput('destination');
    } else {
      setSelectedDestination(destTitle);
      setDestinationQuery(destTitle);
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
        subtitle: 'Selected destination in Kothamangalam',
        distance: 'Est. 2.0 km',
        icon: 'location-outline',
      },
      ...POPULAR_DESTINATIONS,
    ];
  }, [destinationQuery]);

  // Exact 5 ride options matching Column 2 of KeralaGo Ride Booking App UI Flow
  const rideOptions: RideOption[] = [
    {
      id: 'ride',
      label: 'Car',
      subtitle: '4 min away',
      tagline: 'Affordable, comfortable rides',
      imageSource: rideSedanImg,
      etaMinutes: 4,
      priceMin: 120,
      priceMax: 150,
      priceFormatted: '₹120 - 150',
    },
    {
      id: 'bike',
      label: 'Bike',
      subtitle: '2 min away',
      tagline: 'Fastest through traffic',
      imageSource: bikeImg,
      etaMinutes: 2,
      priceMin: 40,
      priceMax: 60,
      priceFormatted: '₹40 - 60',
    },
    {
      id: 'auto',
      label: 'Auto',
      subtitle: '3 min away',
      tagline: 'Everyday economical Kerala auto',
      imageSource: autoImg,
      etaMinutes: 3,
      priceMin: 60,
      priceMax: 90,
      priceFormatted: '₹60 - 90',
    },
    {
      id: 'share',
      label: 'Share Taxi',
      subtitle: 'Share and save',
      tagline: 'Share with co-passengers & save',
      imageSource: shareTaxiImg,
      etaMinutes: 5,
      priceMin: 70,
      priceMax: 100,
      priceFormatted: '₹70 - 100',
    },
    {
      id: 'pink',
      label: 'Pink Ride',
      subtitle: 'Women only',
      tagline: 'Safe rides driven by women drivers',
      imageSource: pinkRideImg,
      etaMinutes: 4,
      priceMin: 120,
      priceMax: 160,
      priceFormatted: '₹120 - 160',
      womensOnly: true,
    },
  ];

  const selectedRide = rideOptions.find((r) => r.id === selectedRideId) || rideOptions[0];

  return (
    <View style={styles.root}>
      {/* ── Background Map Layer (Kothamangalam / MACE) ── */}
      <KeralaMapBackground
        showVehicles={true}
        pickupLocation={pickupLocation}
        activeDestination={stage !== 'IDLE' && stage !== 'SEARCH_ROUTE' ? selectedDestination : undefined}
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

          {/* Right Floating Map Buttons (Bell with dot badge + GPS Crosshairs) */}
          <View style={styles.rightFloatingButtons}>
            <FloatingMapButton
              iconName="notifications-outline"
              iconColor="#1E293B"
              dotOnly={true}
              badgeColor={Colors.primaryVibrant}
              diameter={44}
              onPress={() => Alert.alert('KeralaGO Notifications', 'No new alerts.')}
            />

            <FloatingMapButton
              iconName="locate-outline"
              iconColor={Colors.primary}
              diameter={44}
              onPress={() => Alert.alert('Current Location', 'Centered on Mar Athanasius College of Engineering')}
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
                  <Icon library="Ionicons" name="locate" size={18} color="#0F4A2B" />
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
                  if (chip.target) {
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
            <View style={styles.destSectionHeader}>
              <Typography variant="body2" weight="bold" color="#64748B">
                {destinationQuery ? 'MATCHING LOCATIONS' : 'RECENT & POPULAR DESTINATIONS'}
              </Typography>
            </View>

            {filteredDestinations.map((item) => (
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
                  onPress={() => {
                    Alert.alert('KeralaGO Package', 'Instant courier and parcel delivery across Kerala.');
                  }}
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
              onSelect={setSelectedRideId}
            />
          </ScrollView>

          <View style={styles.chooseRideFooter}>
            <Button
              label="Confirm Ride"
              variant="primary"
              size="lg"
              fullWidth
              onPress={() => setStage('CONFIRM_PAYMENT')}
            />
            <Typography variant="xs" color="#64748B" align="center" style={{ marginTop: 6 }}>
              You'll be matched with a nearby driver
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
            <Image
              source={selectedRide.imageSource || rideSedanImg}
              style={styles.paymentVehicleImg}
              resizeMode="contain"
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
              onPress={() => setStage('SEARCHING_DRIVER')}
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
              onPress={() => Alert.alert('Emergency SOS', 'Calling 112 Kerala Emergency SOS...')}
              activeOpacity={0.8}
            >
              <Icon library="Ionicons" name="alert-circle" size={17} color="#DC2626" />
              <Text style={styles.sosPillText}>SOS</Text>
            </TouchableOpacity>
          </SafeAreaView>

          {/* Floating ETA badge over vehicle on map */}
          <View style={styles.floatingEtaCallout}>
            <Typography variant="body2" weight="bold" color="#0F172A">
              3 min
            </Typography>
            <Typography variant="xs" color="#64748B">
              away
            </Typography>
          </View>

          {/* Bottom Card matching Screen 5 */}
          <View style={styles.activeRideSheetContainer}>
            <Typography variant="h3" weight="bold" color="#0F172A">
              On the way to your destination
            </Typography>

            {/* ETA & Arrival */}
            <View style={styles.activeRideEtaRow}>
              <View style={styles.activeRideEtaLeft}>
                <Icon library="Ionicons" name="navigate" size={18} color="#16A34A" />
                <View style={{ marginLeft: 8 }}>
                  <Typography variant="body1" weight="bold" color="#0F172A">
                    8 min
                  </Typography>
                  <Typography variant="xs" color="#64748B">
                    2.3 km
                  </Typography>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Typography variant="body1" weight="bold" color="#0F172A">
                  10:02 AM
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
                <Image source={rideSedanImg} style={{ width: 28, height: 18 }} resizeMode="contain" />
              </View>
              <View style={styles.trackLineInactive} />
              <Icon library="Ionicons" name="location-sharp" size={18} color="#DC2626" />
            </View>

            {/* Driver Card */}
            <View style={styles.activeRideDriverCard}>
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

              <Image source={rideSedanImg} style={{ width: 50, height: 32 }} resizeMode="contain" />
              <View style={{ marginLeft: 8 }}>
                <Typography variant="caption" weight="bold" color="#0F172A">
                  KL 07 AB 1234
                </Typography>
                <Typography variant="xs" color="#64748B">
                  Maruti Swift - White
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
                style={styles.driverCallBtn}
                onPress={() => Alert.alert('Calling Driver', 'Calling Rijin S (+91 98471 22334)...')}
                activeOpacity={0.7}
              >
                <Icon library="Ionicons" name="call" size={20} color="#0F4A2B" />
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

            {/* Fare Summary Card */}
            <View style={styles.completedFareCard}>
              <Typography variant="h1" weight="extraBold" color="#0F172A" align="center">
                ₹132
              </Typography>
              <Typography variant="body2" color="#64748B" align="center" style={{ marginTop: 2 }}>
                Paid via {selectedPaymentMethod === 'cash' ? 'Cash' : 'UPI'}
              </Typography>
              <TouchableOpacity
                onPress={() => Alert.alert('Fare Breakdown', 'Base Fare: ₹80\nDistance (4.8 km): ₹40\nTax & Platform: ₹12\nTotal Paid: ₹132')}
                activeOpacity={0.7}
                style={{ alignSelf: 'center', marginTop: 6 }}
              >
                <Typography variant="caption" weight="semiBold" color="#16A34A">
                  {'View Breakdown >'}
                </Typography>
              </TouchableOpacity>
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

              <Image source={rideSedanImg} style={{ width: 50, height: 32 }} resizeMode="contain" />
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
                onPress={() => setStage('IDLE')}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      )}
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
});

export default CustomerHomeView;

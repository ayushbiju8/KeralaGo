/**
 * Organism: RideRequestModal
 *
 * Complete 5-stage driver ride execution simulator matching the reference mockup:
 *  - Stage 1: 'request'     — New ride request countdown card (Accept / Decline)
 *  - Stage 2: 'arriving'    — Navigation to pickup banner, route map, passenger card ("Arrived at Pickup")
 *  - Stage 3: 'arrived'     — Waiting for passenger banner, radar pulse map ("Start Trip")
 *  - Stage 4: 'on_trip'     — Navigation to dropoff banner, destination route, stats ("End Trip")
 *  - Stage 5: 'completed'   — Confetti celebration, ₹120 earnings breakdown, rider rating ("Done")
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Typography from '../atoms/Typography';
import Avatar from '../atoms/Avatar';
import Icon from '../atoms/Icon';
import SwipeButton from '../molecules/SwipeButton';
import { Colors, Spacing, Radii, Shadows } from '../../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type SimulationStage = 'request' | 'arriving' | 'arrived' | 'on_trip' | 'completed';

export interface RideRequestModalProps {
  /** Whether the simulation modal is visible */
  visible: boolean;
  /** Initial or controlled stage */
  initialStage?: SimulationStage;
  /** Minutes away (default 5) */
  etaMinutes?: number;
  /** Distance in km (default 2.8) */
  distanceKm?: number;
  /** Estimated fare in ₹ (default 120) */
  estimatedFare?: number;
  /** Pickup time in minutes (default 5) */
  pickupTimeMinutes?: number;
  /** Pickup location */
  pickup?: string;
  /** Pickup sub-address */
  pickupSub?: string;
  /** Dropoff location */
  dropoff?: string;
  /** Dropoff sub-address */
  dropoffSub?: string;
  /** Passenger name */
  passengerName?: string;
  /** Passenger avatar image URI */
  passengerAvatar?: string;
  /** Passenger rating */
  passengerRating?: number;
  /** Passenger total trips */
  passengerTrips?: number;
  /** Countdown total seconds */
  countdownSeconds?: number;
  /** Handler when request is accepted */
  onAccept?: () => void;
  /** Handler when request is declined or dismissed */
  onDecline?: () => void;
  /** Handler when trip is completed */
  onComplete?: () => void;
}

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';

const RideRequestModal: React.FC<RideRequestModalProps> = ({
  visible,
  initialStage = 'request',
  etaMinutes = 5,
  distanceKm = 2.8,
  estimatedFare = 120,
  pickupTimeMinutes = 5,
  pickup = 'M B Hostel',
  pickupSub = 'MACE Hostels Road, Kothamangalam',
  dropoff = 'Mar Athanasius College',
  dropoffSub = 'College Jn, Kothamangalam',
  passengerName = 'Devarth',
  passengerAvatar = DEFAULT_AVATAR,
  passengerRating = 4.8,
  passengerTrips = 32,
  countdownSeconds = 20,
  onAccept,
  onDecline,
  onComplete,
}) => {
  const [stage, setStage] = useState<SimulationStage>(initialStage);
  const [remaining, setRemaining] = useState(countdownSeconds);
  const [isMuted, setIsMuted] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync stage if initialStage changes
  useEffect(() => {
    if (visible) {
      setStage(initialStage || 'request');
      setRemaining(countdownSeconds);
    }
  }, [visible, initialStage, countdownSeconds]);

  // Countdown timer for Stage 1 ('request')
  useEffect(() => {
    if (visible && stage === 'request') {
      timerRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            onDecline?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, stage, onDecline]);

  if (!visible) return null;

  const handleAcceptPress = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    onAccept?.();
    setStage('arriving');
  };

  const handleArrivedAtPickup = () => {
    setStage('arrived');
  };

  const handleStartTrip = () => {
    setStage('on_trip');
  };

  const handleEndTrip = () => {
    setStage('completed');
  };

  const handleDone = () => {
    onComplete?.();
    setStage('request');
  };

  const handleClose = () => {
    setStage('request');
    onDecline?.();
  };

  const handleCall = () => {
    Alert.alert(`Calling ${passengerName}`, '+91 98471 23456');
  };

  const handleChat = () => {
    Alert.alert(`Chat with ${passengerName}`, `Connecting to in-app messaging with ${passengerName}.`);
  };

  const handleNavigate = () => {
    Alert.alert('GPS Navigation', 'Turn-by-turn navigation launched on Google Maps.');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.modalRoot}>
        {/* ═════════════════════════════════════════════════════════════════
            STAGE 1: NEW RIDE REQUEST MODAL
           ═════════════════════════════════════════════════════════════════ */}
        {stage === 'request' && (
          <View style={styles.stageRequestRoot}>
            {/* Dimmed Map Background with Red Marker Visible */}
            <View style={StyleSheet.absoluteFill}>
              <View style={styles.simTerrainDark} />
              <View style={styles.simRiverDark} />
              <View style={styles.simRoad1Dark} />
              <View style={styles.simRoad2Dark} />
              <View style={styles.simRoadCrossDark} />
              {/* Top Red Marker on the dark map */}
              <View style={styles.stage1TopMarker}>
                <View style={styles.redMarkerDot}>
                  <View style={styles.innerWhiteDot} />
                </View>
              </View>
            </View>

            {/* Dark Scrim Container */}
            <View style={styles.stageRequestContainer}>
              {/* Top Floating Pill: "New Ride Request" */}
              <SafeAreaView edges={['top']} style={styles.requestPillWrapper}>
                <View style={styles.newRequestPill}>
                  <Typography variant="body2" weight="bold" color={Colors.white}>
                    New Ride Request
                  </Typography>
                </View>
              </SafeAreaView>

              <View style={{ flex: 1 }} />

              {/* Main White Request Card */}
              <View style={styles.requestCard}>
                {/* Top Row: "5 min away" + Countdown Circle "20" */}
                <View style={styles.requestHeaderRow}>
                  <Typography variant="h2" weight="bold" color={Colors.textPrimary} style={{ fontSize: 22 }}>
                    {etaMinutes} min away
                  </Typography>

                  <View style={styles.countdownBadge}>
                    <Typography variant="body1" weight="bold" color="#10B981">
                      {remaining}
                    </Typography>
                  </View>
                </View>

                {/* Route: M B Hostel -> Mar Athanasius College */}
                <View style={styles.routeContainer}>
                  {/* Pickup Point */}
                  <View style={styles.pointRow}>
                    <View style={styles.greenDot} />
                    <View style={styles.pointTextCol}>
                      <Typography variant="body1" weight="bold" color={Colors.textPrimary}>
                        {pickup}
                      </Typography>
                      <Typography variant="caption" color={Colors.textSecondary} style={{ marginTop: 1 }}>
                        {pickupSub}
                      </Typography>
                    </View>
                  </View>

                  {/* Connector Line */}
                  <View style={styles.routeLine} />

                  {/* Dropoff Point */}
                  <View style={styles.pointRow}>
                    <View style={styles.redDot} />
                    <View style={styles.pointTextCol}>
                      <Typography variant="body1" weight="bold" color={Colors.textPrimary}>
                        {dropoff}
                      </Typography>
                      <Typography variant="caption" color={Colors.textSecondary} style={{ marginTop: 1 }}>
                        {dropoffSub}
                      </Typography>
                    </View>
                  </View>
                </View>

                {/* 3-Column Metrics: 2.8 km | ₹120 | 5 min */}
                <View style={styles.metricsRow}>
                  <View style={styles.metricItem}>
                    <Typography variant="h3" weight="bold" color={Colors.textPrimary}>
                      {distanceKm} km
                    </Typography>
                    <Typography variant="caption" color={Colors.textMuted} style={{ marginTop: 2 }}>
                      Distance
                    </Typography>
                  </View>

                  <View style={styles.metricDivider} />

                  <View style={styles.metricItem}>
                    <Typography variant="h3" weight="bold" color={Colors.textPrimary}>
                      ₹{estimatedFare}
                    </Typography>
                    <Typography variant="caption" color={Colors.textMuted} style={{ marginTop: 2 }}>
                      Estimated Fare
                    </Typography>
                  </View>

                  <View style={styles.metricDivider} />

                  <View style={styles.metricItem}>
                    <Typography variant="h3" weight="bold" color={Colors.textPrimary}>
                      {pickupTimeMinutes} min
                    </Typography>
                    <Typography variant="caption" color={Colors.textMuted} style={{ marginTop: 2 }}>
                      Pickup time
                    </Typography>
                  </View>
                </View>
              </View>

              {/* Action Buttons: Accept (green) / Decline (dark) */}
              <View style={styles.actionBtnGroup}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  activeOpacity={0.85}
                  onPress={handleAcceptPress}
                >
                  <Typography variant="body1" weight="bold" color={Colors.white}>
                    Accept
                  </Typography>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.declineButton}
                  activeOpacity={0.85}
                  onPress={handleClose}
                >
                  <Typography variant="body1" weight="bold" color={Colors.white}>
                    Decline
                  </Typography>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ═════════════════════════════════════════════════════════════════
            STAGES 2, 3, 4: ACTIVE NAVIGATION & TRIP EXECUTION
           ═════════════════════════════════════════════════════════════════ */}
        {(stage === 'arriving' || stage === 'arrived' || stage === 'on_trip') && (
          <View style={styles.activeStageContainer}>
            {/* ── Simulated Interactive Navigation Map Layer ── */}
            <View style={StyleSheet.absoluteFill}>
              {/* Terrain Base */}
              <View style={styles.simTerrain} />

              {/* Waterway River on Left */}
              <View style={styles.simRiver} />

              {/* Road Grid */}
              <View style={styles.simRoad1} />
              <View style={styles.simRoad2} />
              <View style={styles.simRoadCross} />

              {/* Landmark Pin 1: Mar Athanasius College of Engineering */}
              <View style={styles.simMaceLandmark}>
                <View style={styles.maceSchoolIcon}>
                  <Icon library="MaterialIcons" name="school" size={14} color="#64748B" />
                </View>
                <View>
                  <Typography variant="xs" weight="bold" color="#334155" style={{ fontSize: 9 }}>
                    Mar Athanasius
                  </Typography>
                  <Typography variant="xs" color="#64748B" style={{ fontSize: 8 }}>
                    College of Engineering
                  </Typography>
                </View>
              </View>

              {/* STAGE 2: Blue Route to M B Hostel */}
              {stage === 'arriving' && (
                <>
                  {/* Blue Navigation Polyline */}
                  <View style={styles.blueRouteSegment1} />
                  <View style={styles.blueRouteSegment2} />

                  {/* Destination Marker: M B Hostel */}
                  <View style={styles.mbHostelMarker}>
                    <View style={styles.greenMarkerDot}>
                      <View style={styles.innerWhiteDot} />
                    </View>
                    <Typography variant="caption" weight="bold" color="#166534" style={{ marginLeft: 6 }}>
                      M B Hostel
                    </Typography>
                  </View>

                  {/* Car on Route */}
                  <View style={styles.simCarArriving}>
                    <View style={styles.simCarBody}>
                      <View style={styles.simCarWindshield} />
                      <View style={styles.simCarRoof} />
                    </View>
                  </View>
                </>
              )}

              {/* STAGE 3: Concentric Green Pulsating Radar Rings at Center */}
              {stage === 'arrived' && (
                <View style={styles.simRadarCenter}>
                  <View style={styles.radarRingOuter} />
                  <View style={styles.radarRingMid} />
                  <View style={styles.radarRingInner} />
                  {/* Car at Center */}
                  <View style={styles.simCarWaiting}>
                    <View style={styles.simCarBody}>
                      <View style={styles.simCarWindshield} />
                      <View style={styles.simCarRoof} />
                    </View>
                  </View>
                </View>
              )}

              {/* STAGE 4: Green Route to Mar Athanasius College */}
              {stage === 'on_trip' && (
                <>
                  {/* Green Trip Polyline */}
                  <View style={styles.greenRouteSegment1} />
                  <View style={styles.greenRouteSegment2} />

                  {/* Red Dropoff Pin: Mar Athanasius College */}
                  <View style={styles.maceDropoffMarker}>
                    <View style={styles.redMarkerDot}>
                      <View style={styles.innerWhiteDot} />
                    </View>
                    <Typography variant="caption" weight="bold" color="#991B1B" style={{ marginLeft: 6 }}>
                      Mar Athanasius College
                    </Typography>
                  </View>

                  {/* Car on Trip Route */}
                  <View style={styles.simCarOnTrip}>
                    <View style={styles.simCarBody}>
                      <View style={styles.simCarWindshield} />
                      <View style={styles.simCarRoof} />
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* ── Top Floating Instruction Banners ── */}
            <SafeAreaView edges={['top']} style={styles.topBannerArea}>
              {/* Stage 2 Navigation Header: "200 m / Turn left onto MACE Hostels Rd" */}
              {stage === 'arriving' && (
                <View style={styles.greenNavBanner}>
                  <Icon library="Ionicons" name="arrow-undo" size={28} color={Colors.white} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Typography variant="h3" weight="bold" color={Colors.white}>
                      200 m
                    </Typography>
                    <Typography variant="body2" color="rgba(255, 255, 255, 0.9)" style={{ marginTop: 1 }}>
                      Turn left onto MACE Hostels Rd
                    </Typography>
                  </View>
                </View>
              )}

              {/* Stage 3 Passenger Waiting Header: "Pickup Passenger / Rider is waiting" */}
              {stage === 'arrived' && (
                <View style={styles.whiteNavBanner}>
                  <View style={styles.passengerIconBadge}>
                    <Icon library="MaterialIcons" name="directions-walk" size={22} color="#166534" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Typography variant="body1" weight="bold" color={Colors.textPrimary}>
                      Pickup Passenger
                    </Typography>
                    <Typography variant="caption" color={Colors.textSecondary} style={{ marginTop: 1 }}>
                      Rider is waiting
                    </Typography>
                  </View>
                </View>
              )}

              {/* Stage 4 Navigation Header: "1.2 km / Continue straight" */}
              {stage === 'on_trip' && (
                <View style={styles.greenNavBanner}>
                  <Icon library="Ionicons" name="arrow-up" size={28} color={Colors.white} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Typography variant="h3" weight="bold" color={Colors.white}>
                      1.2 km
                    </Typography>
                    <Typography variant="body2" color="rgba(255, 255, 255, 0.9)" style={{ marginTop: 1 }}>
                      Continue straight
                    </Typography>
                  </View>
                </View>
              )}
            </SafeAreaView>

            {/* ── Right Floating Map Controls (Speaker, Mute, Exit) ── */}
            <View style={styles.floatingControlsRight}>
              <TouchableOpacity
                style={styles.floatingControlBtn}
                activeOpacity={0.8}
                onPress={() => setIsMuted(!isMuted)}
              >
                <Icon
                  library="Ionicons"
                  name={isMuted ? 'volume-mute' : 'volume-high'}
                  size={20}
                  color={isMuted ? '#EF4444' : Colors.textPrimary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.floatingControlBtn}
                activeOpacity={0.8}
                onPress={() => Alert.alert('Trip Audio', isMuted ? 'Audio muted' : 'Voice guidance enabled')}
              >
                <Icon library="Ionicons" name="mic-outline" size={20} color="#16A34A" />
              </TouchableOpacity>

              {/* Exit Simulator Button */}
              <TouchableOpacity
                style={[styles.floatingControlBtn, { backgroundColor: '#FEE2E2' }]}
                activeOpacity={0.8}
                onPress={handleClose}
              >
                <Icon library="Ionicons" name="close" size={20} color="#DC2626" />
              </TouchableOpacity>
            </View>

            {/* ── Bottom Floating Action Cards ── */}
            <View style={styles.bottomSheetCard}>
              {/* STAGE 2 Bottom Card (Arriving at Pickup) */}
              {stage === 'arriving' && (
                <>
                  <View style={styles.sheetTopRow}>
                    <View>
                      <Typography variant="body1" weight="bold" color={Colors.textPrimary}>
                        Arriving at pickup
                      </Typography>
                      <Typography variant="caption" color={Colors.textSecondary} style={{ marginTop: 2 }}>
                        2 min • 800 m
                      </Typography>
                    </View>

                    <TouchableOpacity
                      style={styles.navigateMintBtn}
                      activeOpacity={0.8}
                      onPress={handleNavigate}
                    >
                      <Icon library="Ionicons" name="navigate" size={14} color="#16A34A" style={{ marginRight: 4 }} />
                      <Typography variant="caption" weight="bold" color="#166534">
                        Navigate
                      </Typography>
                    </TouchableOpacity>
                  </View>

                  {/* Passenger Row: Devarth */}
                  <View style={styles.passengerRow}>
                    <Avatar src={passengerAvatar} name={passengerName} size="md" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Typography variant="body1" weight="bold" color={Colors.textPrimary}>
                        {passengerName}
                      </Typography>
                      <View style={styles.ratingRow}>
                        <Typography variant="caption" weight="bold" color={Colors.textPrimary}>
                          {passengerRating}
                        </Typography>
                        <Icon library="Ionicons" name="star" size={13} color="#EAB308" style={{ marginHorizontal: 2 }} />
                        <Typography variant="caption" color={Colors.textSecondary}>
                          ({passengerTrips} trips)
                        </Typography>
                      </View>
                    </View>

                    <TouchableOpacity style={styles.callCircleBtn} onPress={handleCall}>
                      <Icon library="Ionicons" name="call" size={18} color="#16A34A" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.chatCircleBtn} onPress={handleChat}>
                      <Icon library="Ionicons" name="chatbubble" size={18} color="#16A34A" />
                    </TouchableOpacity>
                  </View>

                  {/* Primary CTA: Swipe to Right "Arrived at Pickup" */}
                  <SwipeButton
                    label="Arrived at Pickup"
                    variant="green"
                    height={64}
                    knobIcon={<Icon library="Ionicons" name="play-forward" size={18} color="#166534" />}
                    onSwipeComplete={handleArrivedAtPickup}
                    style={styles.swipeCTA}
                  />
                </>
              )}

              {/* STAGE 3 Bottom Card (Pickup Passenger / Waiting) */}
              {stage === 'arrived' && (
                <>
                  <TouchableOpacity
                    style={styles.locationPillRow}
                    activeOpacity={0.8}
                    onPress={() => Alert.alert('Pickup Location', pickupSub)}
                  >
                    <Icon library="Ionicons" name="location-sharp" size={20} color="#16A34A" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Typography variant="body1" weight="bold" color={Colors.textPrimary}>
                        {pickup}
                      </Typography>
                      <Typography variant="caption" color={Colors.textSecondary} numberOfLines={1}>
                        {pickupSub}
                      </Typography>
                    </View>
                    <Icon library="Ionicons" name="chevron-forward" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>

                  {/* Passenger Row: Devarth */}
                  <View style={styles.passengerRow}>
                    <Avatar src={passengerAvatar} name={passengerName} size="md" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Typography variant="body1" weight="bold" color={Colors.textPrimary}>
                        {passengerName}
                      </Typography>
                      <View style={styles.ratingRow}>
                        <Typography variant="caption" weight="bold" color={Colors.textPrimary}>
                          {passengerRating}
                        </Typography>
                        <Icon library="Ionicons" name="star" size={13} color="#EAB308" style={{ marginHorizontal: 2 }} />
                        <Typography variant="caption" color={Colors.textSecondary}>
                          ({passengerTrips} trips)
                        </Typography>
                      </View>
                    </View>

                    <TouchableOpacity style={styles.callCircleBtn} onPress={handleCall}>
                      <Icon library="Ionicons" name="call" size={18} color="#16A34A" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.chatCircleBtn} onPress={handleChat}>
                      <Icon library="Ionicons" name="chatbubble" size={18} color="#16A34A" />
                    </TouchableOpacity>
                  </View>

                  {/* Primary CTA: Swipe to Right "Start Trip" */}
                  <SwipeButton
                    label="Start Trip"
                    variant="green"
                    height={64}
                    knobIcon={<Icon library="Ionicons" name="chevron-forward" size={24} color="#166534" />}
                    onSwipeComplete={handleStartTrip}
                    style={styles.swipeCTA}
                  />
                </>
              )}

              {/* STAGE 4 Bottom Card (On Trip) */}
              {stage === 'on_trip' && (
                <>
                  <View style={styles.locationPillRow}>
                    <Icon library="Ionicons" name="location-sharp" size={20} color="#DC2626" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Typography variant="body1" weight="bold" color={Colors.textPrimary}>
                        {dropoff}
                      </Typography>
                      <Typography variant="caption" color={Colors.textSecondary} numberOfLines={1}>
                        {dropoffSub}
                      </Typography>
                    </View>
                  </View>

                  {/* Passenger Row: Devarth */}
                  <View style={styles.passengerRow}>
                    <Avatar src={passengerAvatar} name={passengerName} size="md" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Typography variant="body1" weight="bold" color={Colors.textPrimary}>
                        {passengerName}
                      </Typography>
                      <View style={styles.ratingRow}>
                        <Typography variant="caption" weight="bold" color={Colors.textPrimary}>
                          {passengerRating}
                        </Typography>
                        <Icon library="Ionicons" name="star" size={13} color="#EAB308" style={{ marginHorizontal: 2 }} />
                        <Typography variant="caption" color={Colors.textSecondary}>
                          ({passengerTrips} trips)
                        </Typography>
                      </View>
                    </View>

                    <TouchableOpacity style={styles.callCircleBtn} onPress={handleCall}>
                      <Icon library="Ionicons" name="call" size={18} color="#16A34A" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.chatCircleBtn} onPress={handleChat}>
                      <Icon library="Ionicons" name="chatbubble" size={18} color="#16A34A" />
                    </TouchableOpacity>
                  </View>

                  {/* Primary CTA: Swipe to Right "End Trip" */}
                  <SwipeButton
                    label="End Trip"
                    variant="red"
                    height={64}
                    knobIcon={<View style={styles.stopInnerSquare} />}
                    onSwipeComplete={handleEndTrip}
                    style={styles.swipeCTA}
                  />

                  {/* 3-Metrics Row: 12 min | 5.6 km | ₹120 */}
                  <View style={styles.onTripMetricsRow}>
                    <View style={styles.metricItem}>
                      <Typography variant="body1" weight="bold" color={Colors.textPrimary}>
                        12 min
                      </Typography>
                      <Typography variant="caption" color={Colors.textMuted}>
                        Time left
                      </Typography>
                    </View>

                    <View style={styles.metricDivider} />

                    <View style={styles.metricItem}>
                      <Typography variant="body1" weight="bold" color={Colors.textPrimary}>
                        5.6 km
                      </Typography>
                      <Typography variant="caption" color={Colors.textMuted}>
                        Distance
                      </Typography>
                    </View>

                    <View style={styles.metricDivider} />

                    <View style={styles.metricItem}>
                      <Typography variant="body1" weight="bold" color={Colors.textPrimary}>
                        ₹120
                      </Typography>
                      <Typography variant="caption" color={Colors.textMuted}>
                        Fare (est.)
                      </Typography>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* ═════════════════════════════════════════════════════════════════
            STAGE 5: TRIP COMPLETED CELEBRATION & RATING
           ═════════════════════════════════════════════════════════════════ */}
        {stage === 'completed' && (
          <View style={styles.completedContainer}>
            <SafeAreaView edges={['top', 'bottom']} style={styles.completedSafeWrap}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.completedScrollContent}
              >
                {/* Confetti & Checkmark Badge */}
                <View style={styles.celebrationArea}>
                  {/* Decorative confetti particles */}
                  <View style={[styles.confettiParticle, { top: 0, left: 40, backgroundColor: '#EF4444' }]} />
                  <View style={[styles.confettiParticle, { top: 12, right: 50, backgroundColor: '#3B82F6' }]} />
                  <View style={[styles.confettiParticle, { top: 60, left: 20, backgroundColor: '#10B981', transform: [{ rotate: '45deg' }] }]} />
                  <View style={[styles.confettiParticle, { top: 50, right: 30, backgroundColor: '#F59E0B', transform: [{ rotate: '-30deg' }] }]} />
                  <View style={[styles.confettiParticle, { top: 20, left: 100, backgroundColor: '#8B5CF6', transform: [{ rotate: '15deg' }] }]} />
                  <View style={[styles.confettiParticle, { top: 35, right: 110, backgroundColor: '#EC4899', transform: [{ rotate: '-60deg' }] }]} />

                  {/* Circular Checkmark Badge */}
                  <View style={styles.completedCheckCircle}>
                    <Icon library="Ionicons" name="checkmark" size={36} color={Colors.white} />
                  </View>

                  <Typography variant="h2" weight="bold" color={Colors.textPrimary} style={{ marginTop: Spacing.md }}>
                    Trip Completed
                  </Typography>

                  <Typography variant="h1" weight="extraBold" color={Colors.textPrimary} style={{ fontSize: 38, marginTop: 4 }}>
                    ₹{estimatedFare}
                  </Typography>

                  <Typography variant="body2" weight="bold" color="#16A34A" style={{ marginTop: 2 }}>
                    Your Earnings
                  </Typography>
                </View>

                {/* Fare Breakdown Card */}
                <View style={styles.fareBreakdownCard}>
                  <View style={styles.fareRow}>
                    <Typography variant="body2" color={Colors.textSecondary}>
                      Base Fare
                    </Typography>
                    <Typography variant="body2" weight="bold" color={Colors.textPrimary}>
                      ₹100
                    </Typography>
                  </View>

                  <View style={[styles.fareRow, { marginTop: Spacing.xs }]}>
                    <Typography variant="body2" color={Colors.textSecondary}>
                      Distance (5.6 km)
                    </Typography>
                    <Typography variant="body2" weight="bold" color={Colors.textPrimary}>
                      ₹20
                    </Typography>
                  </View>

                  <View style={styles.breakdownDivider} />

                  <View style={[styles.fareRow, { marginTop: Spacing.xs }]}>
                    <Typography variant="body1" weight="bold" color={Colors.textPrimary}>
                      Total Earnings
                    </Typography>
                    <Typography variant="h3" weight="bold" color={Colors.textPrimary}>
                      ₹{estimatedFare}
                    </Typography>
                  </View>
                </View>

                {/* Rider Profile Card */}
                <View style={styles.completedRiderCard}>
                  <Avatar src={passengerAvatar} name={passengerName} size="md" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Typography variant="body1" weight="bold" color={Colors.textPrimary}>
                      {passengerName}
                    </Typography>
                    <View style={styles.ratingRow}>
                      <Typography variant="caption" weight="bold" color={Colors.textPrimary}>
                        {passengerRating}
                      </Typography>
                      <Icon library="Ionicons" name="star" size={13} color="#EAB308" style={{ marginLeft: 3 }} />
                    </View>
                  </View>

                  <TouchableOpacity style={styles.callCircleBtn} onPress={handleCall}>
                    <Icon library="Ionicons" name="call" size={18} color="#16A34A" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.chatCircleBtn} onPress={handleChat}>
                    <Icon library="Ionicons" name="chatbubble" size={18} color="#16A34A" />
                  </TouchableOpacity>
                </View>

                {/* Rate Your Rider */}
                <View style={styles.ratingSection}>
                  <Typography variant="body1" weight="bold" color={Colors.textPrimary} align="center">
                    Rate your rider
                  </Typography>

                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((starIdx) => (
                      <TouchableOpacity
                        key={starIdx}
                        onPress={() => setRating(starIdx)}
                        style={styles.starTouch}
                      >
                        <Icon
                          library="Ionicons"
                          name="star"
                          size={32}
                          color={starIdx <= rating ? '#16A34A' : '#E2E8F0'}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TextInput
                    style={styles.commentInput}
                    placeholder="Add a comment (optional)"
                    placeholderTextColor="#94A3B8"
                    value={comment}
                    onChangeText={setComment}
                  />
                </View>

                {/* Done Button */}
                <TouchableOpacity
                  style={styles.doneBtn}
                  activeOpacity={0.85}
                  onPress={handleDone}
                >
                  <Typography variant="body1" weight="bold" color={Colors.white}>
                    Done
                  </Typography>
                </TouchableOpacity>
              </ScrollView>
            </SafeAreaView>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },

  // ── STAGE 1: REQUEST ──
  stageRequestRoot: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  stageRequestContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'space-between',
    paddingBottom: Spacing['2xl'],
  },
  stage1TopMarker: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.16,
    left: SCREEN_WIDTH * 0.48,
    zIndex: 4,
  },
  simTerrainDark: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#1E293B',
  },
  simRiverDark: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: SCREEN_WIDTH * 0.1,
    width: 44,
    backgroundColor: '#0E3A53',
    transform: [{ rotate: '12deg' }],
  },
  simRoad1Dark: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.24,
    left: -40,
    right: -40,
    height: 14,
    backgroundColor: '#334155',
    transform: [{ rotate: '-8deg' }],
  },
  simRoad2Dark: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.38,
    left: -40,
    right: -40,
    height: 14,
    backgroundColor: '#334155',
    transform: [{ rotate: '14deg' }],
  },
  simRoadCrossDark: {
    position: 'absolute',
    top: -40,
    bottom: -40,
    left: SCREEN_WIDTH * 0.52,
    width: 18,
    backgroundColor: '#334155',
    transform: [{ rotate: '16deg' }],
  },
  requestPillWrapper: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
  },
  newRequestPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.full,
    ...Shadows.md,
  },
  requestCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    borderRadius: Radii['2xl'],
    padding: Spacing.base,
    ...Shadows.xl,
  },
  requestHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  countdownBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.8,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeContainer: {
    paddingVertical: Spacing.xs,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  greenDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: Colors.white,
    marginTop: 4,
  },
  redDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: Colors.white,
    marginTop: 4,
  },
  pointTextCol: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: '#CBD5E1',
    marginLeft: 6,
    marginVertical: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
  },
  actionBtnGroup: {
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  acceptButton: {
    backgroundColor: '#16A34A',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  declineButton: {
    backgroundColor: '#1E293B',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },

  // ── STAGES 2, 3, 4: MAP & NAVIGATION ──
  activeStageContainer: {
    flex: 1,
    backgroundColor: '#EDF6EF',
  },
  simTerrain: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#EDF6EF',
  },
  simRiver: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: SCREEN_WIDTH * 0.1,
    width: 44,
    backgroundColor: '#BAE6FD',
    transform: [{ rotate: '12deg' }],
  },
  simRoad1: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.28,
    left: -40,
    right: -40,
    height: 14,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    transform: [{ rotate: '-8deg' }],
  },
  simRoad2: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.42,
    left: -40,
    right: -40,
    height: 14,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    transform: [{ rotate: '14deg' }],
  },
  simRoadCross: {
    position: 'absolute',
    top: -40,
    bottom: -40,
    left: SCREEN_WIDTH * 0.52,
    width: 18,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    transform: [{ rotate: '16deg' }],
  },
  simMaceLandmark: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.36,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    ...Shadows.xs,
    zIndex: 5,
  },
  maceSchoolIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stage 2 Blue Route
  blueRouteSegment1: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.24,
    bottom: SCREEN_HEIGHT * 0.44,
    left: SCREEN_WIDTH * 0.51,
    width: 6,
    backgroundColor: '#2563EB',
    borderRadius: 3,
    transform: [{ rotate: '-22deg' }],
  },
  blueRouteSegment2: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.22,
    left: SCREEN_WIDTH * 0.44,
    width: 48,
    height: 6,
    backgroundColor: '#2563EB',
    borderRadius: 3,
  },
  mbHostelMarker: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.20,
    left: SCREEN_WIDTH * 0.40,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.md,
    ...Shadows.sm,
    zIndex: 8,
  },
  greenMarkerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redMarkerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerWhiteDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.white,
  },
  simCarArriving: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.38,
    left: SCREEN_WIDTH * 0.54,
    zIndex: 8,
    transform: [{ rotate: '-20deg' }],
  },

  // Stage 3 Pulsating Radar
  simRadarCenter: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.32,
    left: SCREEN_WIDTH * 0.5 - 75,
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 6,
  },
  radarRingOuter: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  radarRingMid: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(34, 197, 94, 0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  radarRingInner: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(34, 197, 94, 0.28)',
  },
  simCarWaiting: {
    zIndex: 8,
  },

  // Stage 4 Green Route
  greenRouteSegment1: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.22,
    bottom: SCREEN_HEIGHT * 0.45,
    left: SCREEN_WIDTH * 0.53,
    width: 6,
    backgroundColor: '#16A34A',
    borderRadius: 3,
    transform: [{ rotate: '-26deg' }],
  },
  greenRouteSegment2: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.20,
    left: SCREEN_WIDTH * 0.46,
    width: 44,
    height: 6,
    backgroundColor: '#16A34A',
    borderRadius: 3,
  },
  maceDropoffMarker: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.19,
    left: SCREEN_WIDTH * 0.40,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.md,
    ...Shadows.sm,
    zIndex: 8,
  },
  simCarOnTrip: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.40,
    left: SCREEN_WIDTH * 0.57,
    zIndex: 8,
    transform: [{ rotate: '-24deg' }],
  },

  // Sim Car Graphic
  simCarBody: {
    width: 22,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#475569',
    alignItems: 'center',
    ...Shadows.sm,
  },
  simCarWindshield: {
    width: 14,
    height: 8,
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    marginTop: 4,
  },
  simCarRoof: {
    width: 14,
    height: 12,
    backgroundColor: '#E2E8F0',
  },

  // Top Nav Banners
  topBannerArea: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xs,
    zIndex: 20,
  },
  greenNavBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F4A2B',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radii.xl,
    ...Shadows.lg,
  },
  whiteNavBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radii.xl,
    ...Shadows.lg,
  },
  passengerIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Right Floating Controls
  floatingControlsRight: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.20,
    right: Spacing.base,
    zIndex: 20,
    gap: Spacing.sm,
  },
  floatingControlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },

  // Bottom Sheet Cards for active stages
  bottomSheetCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: Spacing.base,
    paddingBottom: Spacing.xl,
    ...Shadows.xl,
    zIndex: 25,
  },
  sheetTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  navigateMintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  locationPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.md,
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  callCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  chatCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeCTA: {
    marginVertical: Spacing.xs,
  },
  stopInnerSquare: {
    width: 16,
    height: 16,
    backgroundColor: '#DC2626',
    borderRadius: 3,
  },
  onTripMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.base,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },

  // ── STAGE 5: COMPLETED ──
  completedContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  completedSafeWrap: {
    flex: 1,
  },
  completedScrollContent: {
    padding: Spacing.base,
    paddingBottom: Spacing['3xl'],
  },
  celebrationArea: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    position: 'relative',
  },
  confettiParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  completedCheckCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#0F8A4B',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
  fareBreakdownCard: {
    backgroundColor: '#F8FAF8',
    borderRadius: Radii.xl,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: Spacing.sm,
  },
  completedRiderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: '#EFF3F0',
    marginBottom: Spacing.lg,
    ...Shadows.xs,
  },
  ratingSection: {
    marginBottom: Spacing.xl,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.md,
  },
  starTouch: {
    padding: 4,
  },
  commentInput: {
    backgroundColor: '#F8FAF8',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  doneBtn: {
    backgroundColor: '#0F8A4B',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
});

export default RideRequestModal;

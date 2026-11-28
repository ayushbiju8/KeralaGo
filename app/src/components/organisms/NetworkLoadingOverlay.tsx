/**
 * Organism: NetworkLoadingOverlay
 *
 * An attractive, high-polish loading component for when network connectivity is slow,
 * connection is dropping, or an asynchronous activity is pending (ride matching,
 * payment confirmation, trip state sync).
 *
 * Visual highlights:
 * - Concentric animated pulsating radar rings (Kerala Forest theme)
 * - Pre-built React Native ActivityIndicator with theme colors
 * - Dynamic low-network signal bar indicator
 * - Rotating status messages (e.g. "Connecting to Kochi network...", "Syncing trip...")
 * - Retry and Dismiss action buttons
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import Typography from '../atoms/Typography';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';
import Icon from '../atoms/Icon';
import Card from '../atoms/Card';
import { Colors, Spacing, Radii, Shadows } from '../../constants/theme';

export interface NetworkLoadingOverlayProps {
  /** Title shown above loader */
  title?: string;
  /** Subtitle or explanation */
  subtitle?: string;
  /** Name of the activity being executed */
  activityName?: string;
  /** Whether low network state is detected (shows signal badge) */
  isLowNetwork?: boolean;
  /** Whether to render as fullscreen modal overlay or embedded card */
  fullscreen?: boolean;
  /** Retry handler */
  onRetry?: () => void;
  /** Cancel or dismiss handler */
  onCancel?: () => void;
  /** Custom container style */
  style?: ViewStyle;
}

const DEFAULT_MESSAGES = [
  'Optimizing data connection for low bandwidth...',
  'Syncing live vehicle coordinates with Kochi dispatch...',
  'Checking nearest available drivers...',
  'Securing connection to KeralaGO server...',
];

export const NetworkLoadingOverlay: React.FC<NetworkLoadingOverlayProps> = ({
  title = 'Hang Tight! Connecting...',
  subtitle = 'Your network connection is currently slow. We are keeping your session active.',
  activityName = 'Loading KeralaGO',
  isLowNetwork = true,
  fullscreen = false,
  onRetry,
  onCancel,
  style,
}) => {
  // Radar wave animations
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;

  // Signal bars pulse animation
  const signalAnim = useRef(new Animated.Value(0)).current;

  // Rotating tips state
  const [messageIndex, setMessageIndex] = useState<number>(0);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  useEffect(() => {
    // 1. Concentric radar wave loop
    const waveLoop = Animated.loop(
      Animated.stagger(600, [
        Animated.sequence([
          Animated.timing(wave1, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(wave1, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(wave2, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(wave2, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    waveLoop.start();

    // 2. Signal pulse loop
    const signalLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(signalAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(signalAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    signalLoop.start();

    // 3. Rotating status messages interval
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % DEFAULT_MESSAGES.length);
    }, 2800);

    return () => {
      waveLoop.stop();
      signalLoop.stop();
      clearInterval(interval);
    };
  }, [wave1, wave2, signalAnim]);

  const handleRetryPress = () => {
    setIsRetrying(true);
    if (onRetry) {
      onRetry();
    }
    setTimeout(() => setIsRetrying(false), 1200);
  };

  const scale1 = wave1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.8],
  });
  const opacity1 = wave1.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.5, 0.2, 0],
  });

  const scale2 = wave2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 2.1],
  });
  const opacity2 = wave2.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.4, 0.15, 0],
  });

  return (
    <View style={[fullscreen ? styles.fullscreenOverlay : styles.inlineContainer, style]}>
      <Card shadow="xl" radius="2xl" style={styles.cardContainer}>
        {/* Low Network Status Pill */}
        {isLowNetwork && (
          <View style={styles.networkPillWrap}>
            <View style={styles.networkPill}>
              <Icon library="Ionicons" name="cellular" size={14} color="#D97706" />
              <Typography variant="xs" weight="bold" color="#B45309" style={{ marginLeft: 6 }}>
                Weak Signal • Low Bandwidth Mode
              </Typography>
            </View>
          </View>
        )}

        {/* Animated Radar Pulse Core with Pre-built Loader */}
        <View style={styles.radarWrapper}>
          <Animated.View
            style={[
              styles.radarRing,
              {
                transform: [{ scale: scale2 }],
                opacity: opacity2,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.radarRing,
              {
                transform: [{ scale: scale1 }],
                opacity: opacity1,
              },
            ]}
          />

          {/* Center Hub */}
          <View style={styles.centerHub}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <View style={styles.hubIconOverlay}>
              <Icon library="Ionicons" name="car-sport" size={18} color={Colors.primary} />
            </View>
          </View>
        </View>

        {/* Title & Activity Header */}
        <Typography variant="h3" weight="bold" color={Colors.textPrimary} align="center" style={styles.title}>
          {title}
        </Typography>

        <Typography variant="body2" color={Colors.textSecondary} align="center" style={styles.subtitle}>
          {subtitle}
        </Typography>

        {/* Activity & Dynamic Progress Bar */}
        <View style={styles.activityBox}>
          <View style={styles.activityHeaderRow}>
            <View style={styles.pulseDot} />
            <Typography variant="caption" weight="bold" color={Colors.primaryDark} style={{ flex: 1, marginLeft: 8 }}>
              {activityName}
            </Typography>
            <ActivityIndicator size="small" color={Colors.primaryLight} />
          </View>

          {/* Dynamic rotating message */}
          <Typography variant="xs" color="#166534" style={styles.rotatingMessage}>
            {DEFAULT_MESSAGES[messageIndex]}
          </Typography>
        </View>

        {/* Action Controls */}
        <View style={styles.actionsRow}>
          {onCancel && (
            <Button
              label="Cancel"
              variant="outline"
              size="md"
              onPress={onCancel}
              style={{ flex: 1 }}
            />
          )}

          {onRetry && (
            <Button
              label={isRetrying ? 'Retrying...' : 'Retry Now'}
              variant="primary"
              size="md"
              loading={isRetrying}
              leftIcon={<Icon library="Ionicons" name="refresh" size={16} color={Colors.white} />}
              onPress={handleRetryPress}
              style={{ flex: 1 }}
            />
          )}
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  fullscreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(9, 46, 27, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    zIndex: 9999,
  },
  inlineContainer: {
    padding: Spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.xl,
  },
  networkPillWrap: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  networkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  radarWrapper: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: Spacing.sm,
  },
  radarRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
  },
  centerHub: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EDF8F1',
    borderWidth: 2,
    borderColor: '#A7D7B4',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  hubIconOverlay: {
    position: 'absolute',
  },
  title: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    lineHeight: 19,
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.md,
  },
  activityBox: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: Spacing.lg,
  },
  activityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  rotatingMessage: {
    marginTop: 6,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
});

export default NetworkLoadingOverlay;

import React from 'react';
import { View, StyleSheet, Image, Dimensions, TouchableOpacity, ViewStyle } from 'react-native';
import Icon from '../atoms/Icon';
import Typography from '../atoms/Typography';
import Switch from '../atoms/Switch';
import { Colors, Spacing, Radii, Shadows } from '../../constants/theme';

const { width } = Dimensions.get('window');

export interface DriverHeroCarBannerProps {
  /** Online/Offline duty state */
  isOnline: boolean;
  /** Duty toggle handler */
  onToggleDuty: () => void;
  /** Whether to render bottom car illustration (default false) */
  showCar?: boolean;
  /** Variant style */
  variant?: 'landscape' | 'floating-dark';
  /** Override style */
  style?: ViewStyle;
}

const DriverHeroCarBanner: React.FC<DriverHeroCarBannerProps> = ({
  isOnline,
  onToggleDuty,
  showCar = false,
  variant = 'landscape',
  style,
}) => {
  if (variant === 'floating-dark') {
    return (
      <View style={[styles.floatingDarkContainer, style]}>
        <View style={[styles.floatingDarkPill, isOnline ? styles.floatingDarkPillOnline : styles.floatingDarkPillOffline]}>
          {/* Top Liquid Glass Gloss Arc Sheen */}
          <View style={styles.glassSheenOverlay} />

          {/* Liquid Glass Status Disc */}
          <View style={[styles.floatingDarkCircle, isOnline && styles.floatingDarkCircleOnline]}>
            <Icon
              library="Ionicons"
              name={isOnline ? 'checkmark' : 'close'}
              size={18}
              color={isOnline ? '#34C759' : '#94A3B8'}
            />
          </View>

          <View style={styles.floatingDarkTextCol}>
            <Typography variant="body1" weight="bold" color={Colors.white}>
              {isOnline ? 'Online' : 'Offline'}
            </Typography>
            <Typography variant="caption" color="rgba(255, 255, 255, 0.76)">
              {isOnline ? 'You are receiving ride requests' : 'You are not receiving ride requests'}
            </Typography>
          </View>

          <Switch
            variant="glass"
            value={isOnline}
            onValueChange={onToggleDuty}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, !showCar && styles.containerCompact, style]}>
      {/* ── Background Kerala Landscape Layer ── */}
      <View style={styles.landscapeBackground}>
        {/* Soft Hills Layers */}
        <View style={styles.hillBack} />
        <View style={styles.hillMid} />
        <View style={styles.hillFront} />

        {/* Left Palm Trees */}
        <View style={styles.palmLeft1}>
          <Icon library="MaterialCommunityIcons" name="palm-tree" size={56} color="#7BAE87" />
        </View>
        <View style={styles.palmLeft2}>
          <Icon library="MaterialCommunityIcons" name="palm-tree" size={38} color="#96C2A0" />
        </View>

        {/* Right Palm Trees */}
        <View style={styles.palmRight1}>
          <Icon library="MaterialCommunityIcons" name="palm-tree" size={58} color="#7BAE87" />
        </View>
        <View style={styles.palmRight2}>
          <Icon library="MaterialCommunityIcons" name="palm-tree" size={42} color="#96C2A0" />
        </View>
      </View>

      {/* ── Floating Duty Toggle Pill ("✔ Online" / "Offline") ── */}
      <View style={styles.dutyPillContainer}>
        <View style={styles.dutyPill}>
          {/* Status Check Icon Circle */}
          <View style={[styles.checkCircle, isOnline ? styles.checkCircleOnline : styles.checkCircleOffline]}>
            <Icon
              library="Ionicons"
              name={isOnline ? 'checkmark' : 'close'}
              size={18}
              color={Colors.white}
            />
          </View>

          {/* Text Column */}
          <View style={styles.dutyTextCol}>
            <Typography variant="body1" weight="bold" color={Colors.textPrimary}>
              {isOnline ? 'Online' : 'Offline'}
            </Typography>
            <Typography variant="caption" color={Colors.textSecondary}>
              {isOnline ? 'You are receiving ride requests' : 'You are not receiving ride requests'}
            </Typography>
          </View>

          {/* Toggle Switch */}
          <Switch
            variant="glass"
            value={isOnline}
            onValueChange={onToggleDuty}
          />
        </View>
      </View>

      {/* ── Optional Center Hero Car Illustration ── */}
      {showCar && (
        <View style={styles.carContainer}>
          <Image
            source={require('../../../assets/images/white_sedan.jpg')}
            style={styles.carImage}
            resizeMode="contain"
          />
          {/* Ground Radial Shadow */}
          <View style={styles.groundShadow} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 230,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  containerCompact: {
    height: 100,
  },
  landscapeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#EDF7EE',
  },
  hillBack: {
    position: 'absolute',
    top: 20,
    left: -40,
    width: width + 80,
    height: 90,
    backgroundColor: '#DCEFE1',
    borderTopLeftRadius: 180,
    borderTopRightRadius: 220,
  },
  hillMid: {
    position: 'absolute',
    top: 45,
    left: -60,
    width: width * 0.75,
    height: 90,
    backgroundColor: '#CDE7D5',
    borderTopRightRadius: 180,
  },
  hillFront: {
    position: 'absolute',
    top: 55,
    right: -40,
    width: width * 0.8,
    height: 80,
    backgroundColor: '#C3E0CC',
    borderTopLeftRadius: 160,
  },
  palmLeft1: {
    position: 'absolute',
    top: 15,
    left: 10,
    opacity: 0.85,
  },
  palmLeft2: {
    position: 'absolute',
    top: 28,
    left: 42,
    opacity: 0.7,
  },
  palmRight1: {
    position: 'absolute',
    top: 12,
    right: 12,
    opacity: 0.85,
  },
  palmRight2: {
    position: 'absolute',
    top: 26,
    right: 44,
    opacity: 0.7,
  },
  dutyPillContainer: {
    zIndex: 10,
    width: '100%',
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.xs,
  },
  dutyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderRadius: Radii['2xl'],
    borderWidth: 1,
    borderColor: '#E2EFE5',
    ...Shadows.md,
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  checkCircleOnline: {
    backgroundColor: '#0F4A2B',
  },
  checkCircleOffline: {
    backgroundColor: Colors.textMuted,
  },
  dutyTextCol: {
    flex: 1,
  },
  carContainer: {
    position: 'absolute',
    bottom: 0,
    width: width * 0.82,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  groundShadow: {
    position: 'absolute',
    bottom: 6,
    width: '78%',
    height: 12,
    backgroundColor: 'rgba(15, 74, 43, 0.12)',
    borderRadius: 50,
  },
  floatingDarkContainer: {
    width: '100%',
    paddingHorizontal: Spacing.base,
    zIndex: 20,
  },
  floatingDarkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.base,
    borderRadius: Radii['2xl'],
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1.2,
  },
  floatingDarkPillOnline: {
    backgroundColor: 'rgba(18, 24, 28, 0.72)',
    borderTopColor: 'rgba(255, 255, 255, 0.42)',
    borderLeftColor: 'rgba(255, 255, 255, 0.18)',
    borderRightColor: 'rgba(255, 255, 255, 0.18)',
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 8,
  },
  floatingDarkPillOffline: {
    backgroundColor: 'rgba(15, 20, 25, 0.65)',
    borderTopColor: 'rgba(255, 255, 255, 0.30)',
    borderLeftColor: 'rgba(255, 255, 255, 0.14)',
    borderRightColor: 'rgba(255, 255, 255, 0.14)',
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  glassSheenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '46%',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderTopLeftRadius: Radii['2xl'],
    borderTopRightRadius: Radii['2xl'],
  },
  floatingDarkCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  floatingDarkCircleOnline: {
    backgroundColor: 'rgba(52, 199, 89, 0.18)',
    borderColor: 'rgba(52, 199, 89, 0.42)',
  },
  floatingDarkTextCol: {
    flex: 1,
  },
});

export default DriverHeroCarBanner;

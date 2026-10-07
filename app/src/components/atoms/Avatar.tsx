/**
 * Atom: Avatar
 *
 * Displays a user profile image, or initials fallback.
 * Supports verified badge overlay and online status dot.
 *
 * Sizes: xs (24) | sm (32) | md (44) | lg (64) | xl (88)
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import Typography from './Typography';
import Icon from './Icon';
import { Colors, AvatarSize, AvatarSizeKey, Radii } from '../../constants/theme';

export interface AvatarProps {
  /** Remote or local image source */
  src?: string | number | null;
  /** Fallback initials (e.g. "RS" for Rijin S) */
  name?: string;
  /** Size variant */
  size?: AvatarSizeKey;
  /** Show green online dot */
  online?: boolean;
  /** Show verified checkmark badge */
  verified?: boolean;
  /** Override container style */
  style?: ViewStyle;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  online = false,
  verified = false,
  style,
}) => {
  const diameter = AvatarSize[size];
  const fontSize = Math.round(diameter * 0.35);
  const dotSize = Math.max(10, Math.round(diameter * 0.22));
  const initials = name ? getInitials(name) : '?';

  return (
    <View style={[styles.wrapper, style]}>
      <View
        style={[
          styles.container,
          { width: diameter, height: diameter, borderRadius: diameter / 2 },
        ]}
      >
        {src ? (
          <Image
            source={typeof src === 'string' ? { uri: src } : src}
            style={{ width: diameter, height: diameter, borderRadius: diameter / 2 }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View
            style={[
              styles.initialsContainer,
              { width: diameter, height: diameter, borderRadius: diameter / 2 },
            ]}
          >
            <Typography
              variant="body1"
              weight="bold"
              color={Colors.primary}
              style={{ fontSize, lineHeight: fontSize * 1.2 }}
            >
              {initials}
            </Typography>
          </View>
        )}
      </View>

      {online && (
        <View
          style={[
            styles.onlineDot,
            { width: dotSize, height: dotSize, borderRadius: dotSize / 2 },
          ]}
        />
      )}

      {verified && (
        <View style={styles.verifiedBadge}>
          <Icon library="Ionicons" name="checkmark-circle" size={dotSize + 4} color={Colors.success} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  container: {
    overflow: 'hidden',
  },
  initialsContainer: {
    backgroundColor: Colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.white,
    borderRadius: Radii.full,
  },
});

export default Avatar;

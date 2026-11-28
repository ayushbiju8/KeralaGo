/**
 * Atom: ShimmerImage
 *
 * Resilient image component with integrated skeleton shimmer and graceful fallback.
 * Prevents broken images, sudden layout shifts, and visual glitches:
 * 1. Shows an animated Skeleton placeholder while loading.
 * 2. Smoothly fades in when loaded.
 * 3. Shows an elegant KeralaGo-branded fallback container with icon on network/file failure.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Image,
  ImageSourcePropType,
  ImageResizeMode,
  StyleSheet,
  Animated,
  ViewStyle,
  ImageStyle,
  StyleProp,
} from 'react-native';
import Skeleton from './Skeleton';
import Icon, { IconLibrary } from './Icon';
import { Colors, Radii } from '../../constants/theme';

export interface ShimmerImageProps {
  /** Local require or remote URI image source */
  source: ImageSourcePropType;
  /** Resize mode */
  resizeMode?: ImageResizeMode;
  /** Custom container style */
  style?: StyleProp<ViewStyle | ImageStyle>;
  /** Border radius of the image and skeleton */
  borderRadius?: number;
  /** Fallback icon name if image fails */
  fallbackIconName?: string;
  /** Fallback icon library */
  fallbackIconLibrary?: IconLibrary;
  /** Show subtle border around image container */
  bordered?: boolean;
  /** Callback when image finishes loading */
  onLoadEnd?: () => void;
}

export const ShimmerImage: React.FC<ShimmerImageProps> = ({
  source,
  resizeMode = 'cover',
  style,
  borderRadius = Radii.md,
  fallbackIconName = 'image-outline',
  fallbackIconLibrary = 'Ionicons',
  bordered = false,
  onLoadEnd,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Flatten styles to extract dimensions for skeleton matching
  const flatStyle = (StyleSheet.flatten(style) || {}) as ViewStyle & ImageStyle;
  const width = flatStyle.width ?? '100%';
  const height = flatStyle.height ?? '100%';
  const finalRadius = flatStyle.borderRadius ?? borderRadius;

  const handleLoadSuccess = () => {
    setIsLoading(false);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
    onLoadEnd?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onLoadEnd?.();
  };

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius: finalRadius,
          borderWidth: bordered ? 1 : 0,
          borderColor: Colors.border,
        },
        style,
      ]}
    >
      {/* 1. Shimmer Skeleton (active while image is loading) */}
      {isLoading && (
        <View style={StyleSheet.absoluteFill}>
          <Skeleton
            width="100%"
            height="100%"
            borderRadius={typeof finalRadius === 'number' ? finalRadius : undefined}
            colorScheme="mint"
          />
        </View>
      )}

      {/* 2. Graceful Error Fallback on missing/broken images */}
      {hasError ? (
        <View
          style={[
            styles.fallbackContainer,
            { borderRadius: typeof finalRadius === 'number' ? finalRadius : undefined },
          ]}
        >
          <Icon
            library={fallbackIconLibrary}
            name={fallbackIconName}
            size={Math.min(32, Math.max(16, typeof height === 'number' ? height * 0.4 : 24))}
            color={Colors.textMuted}
          />
        </View>
      ) : (
        /* 3. The Actual Image with Fade-in Animation */
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
          <Image
            source={source}
            resizeMode={resizeMode}
            style={[
              styles.image,
              { borderRadius: typeof finalRadius === 'number' ? finalRadius : undefined },
              flatStyle,
              { width: '100%', height: '100%' },
            ]}
            onLoadStart={() => setIsLoading(true)}
            onLoad={handleLoadSuccess}
            onError={handleError}
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});

export default ShimmerImage;

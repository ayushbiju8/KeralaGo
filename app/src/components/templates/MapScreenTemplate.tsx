/**
 * Template: MapScreenTemplate
 *
 * Full-screen map layout with floating overlay slots and a bottom sheet slot.
 * The map fills the entire screen behind all UI layers.
 *
 * Layout Zones:
 *   - Map: full-screen background (children[0] or mapContent prop)
 *   - Top floating slot: search bar + floating buttons
 *   - Bottom sheet slot: slides up from the bottom
 *
 * Used in:
 *  - Customer Home screen
 *  - Customer active ride tracking
 *  - Driver live navigation screens
 *
 * Reference: Customer Home, Booking Flow screens 1–5, Driver navigation screens
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../constants/theme';

export interface MapScreenTemplateProps {
  /** Full-screen map component */
  mapContent: React.ReactNode;
  /** Top floating bar content (search bar + right buttons) */
  topContent?: React.ReactNode;
  /** Right-side floating buttons column */
  rightButtons?: React.ReactNode;
  /** Bottom slot — can be a BottomSheet or inline card */
  bottomContent?: React.ReactNode;
  /** Override container style */
  style?: ViewStyle;
}

const MapScreenTemplate: React.FC<MapScreenTemplateProps> = ({
  mapContent,
  topContent,
  rightButtons,
  bottomContent,
  style,
}) => {
  return (
    <View style={[styles.root, style]}>
      {/* Full-screen map */}
      <View style={styles.mapLayer}>{mapContent}</View>

      {/* Top floating overlay */}
      {topContent && (
        <SafeAreaView edges={['top']} style={styles.topOverlay}>
          <View style={styles.topContent}>
            <View style={styles.searchArea}>{topContent}</View>
            {rightButtons && (
              <View style={styles.rightButtons}>{rightButtons}</View>
            )}
          </View>
        </SafeAreaView>
      )}

      {/* Bottom content */}
      {bottomContent && (
        <View style={styles.bottomSlot}>{bottomContent}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  mapLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  topContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  searchArea: {
    flex: 1,
  },
  rightButtons: {
    gap: Spacing.sm,
    alignItems: 'center',
  },
  bottomSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default MapScreenTemplate;

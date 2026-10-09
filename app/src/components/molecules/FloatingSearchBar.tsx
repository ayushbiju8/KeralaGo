/**
 * Molecule: FloatingSearchBar
 *
 * Svelte, stylish floating search capsule at the top of the Customer home screen.
 * Composed of:
 * - Emerald Search icon in subtle accent container
 * - Refined placeholder typography ("Where do you want to go?")
 * - Subtle forward arrow indicator on right
 *
 * Reference: Traditional Ride-Hailing Search Bar (Uber / Rapido / Green Interface)
 */

import React from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  ViewStyle,
  Text,
} from 'react-native';
import Icon from '../atoms/Icon';
import { Shadows } from '../../constants/theme';

export interface FloatingSearchBarProps {
  /** Placeholder text */
  placeholder?: string;
  /** Schedule/time selector label (optional) */
  timeLabel?: string;
  /** Called when the bar is tapped */
  onPress?: () => void;
  /** Called when the time selector is tapped (optional) */
  onTimeSelectorPress?: () => void;
  /** Override container style */
  style?: ViewStyle;
}

const FloatingSearchBar: React.FC<FloatingSearchBarProps> = ({
  placeholder = 'Where do you want to go?',
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Search Icon Wrap */}
      <View style={styles.searchIconWrap}>
        <Icon library="Ionicons" name="search" size={19} color="#0F4A2B" />
      </View>

      {/* Placeholder Text */}
      <Text style={styles.placeholderText} numberOfLines={1}>
        {placeholder}
      </Text>

      {/* Subtle Right Indicator */}
      <View style={styles.rightArrowWrap}>
        <Icon library="Ionicons" name="arrow-forward" size={16} color="#64748B" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    height: 48,
    paddingLeft: 10,
    paddingRight: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(15, 74, 43, 0.08)',
    shadowColor: '#0F4A2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 4,
  },
  searchIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  placeholderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    letterSpacing: 0.1,
  },
  rightArrowWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FloatingSearchBar;

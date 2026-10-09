/**
 * Organism: RideSelectionList
 *
 * Exact replication of "Choose a ride" list from Column 2 of "KeralaGo Ride Booking App UI Flow.png".
 * Displays 5 ride options: Car, Bike, Auto, Share Taxi, Pink Ride.
 * Uses the exact same transparent PNG logos as vehicle suggestions.
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle, Image, ImageSourcePropType } from 'react-native';
import Typography from '../atoms/Typography';
import { Colors, Spacing } from '../../constants/theme';

export interface RideOption {
  id: string;
  label: string;
  subtitle?: string;
  tagline?: string;
  imageSource?: ImageSourcePropType;
  etaMinutes?: number;
  priceMin: number;
  priceMax: number;
  priceFormatted?: string;
  womensOnly?: boolean;
  disabled?: boolean;
}

export interface RideSelectionListProps {
  /** Ride options to display */
  options: RideOption[];
  /** Currently selected option id */
  selectedId?: string;
  /** Selection change handler */
  onSelect: (id: string) => void;
  /** Override container style */
  style?: ViewStyle;
}

const RideSelectionList: React.FC<RideSelectionListProps> = ({
  options,
  selectedId,
  onSelect,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {options.map((item) => {
        const isSelected = item.id === selectedId;

        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.row,
              isSelected && styles.rowSelected,
            ]}
            onPress={() => onSelect(item.id)}
            activeOpacity={0.78}
            disabled={item.disabled}
          >
            {/* Vehicle image asset */}
            <View style={styles.imageWrap}>
              {item.imageSource && (
                <Image
                  source={item.imageSource}
                  style={styles.vehicleImage}
                  resizeMode="contain"
                />
              )}
            </View>

            {/* Title & Subtitle */}
            <View style={styles.info}>
              <Typography variant="body1" weight="bold" color="#0F172A">
                {item.label}
              </Typography>
              <Typography variant="caption" color="#64748B" style={styles.subtitleText}>
                {item.subtitle || `${item.etaMinutes} min away`}
              </Typography>
            </View>

            {/* Price */}
            <Typography variant="body1" weight="bold" color="#0F172A">
              {item.priceFormatted || `₹${item.priceMin} - ${item.priceMax}`}
            </Typography>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  rowSelected: {
    borderColor: '#22C55E',
    backgroundColor: '#EDF8F1',
  },
  imageWrap: {
    width: 66,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  vehicleImage: {
    width: 64,
    height: 40,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  subtitleText: {
    marginTop: 2,
    fontSize: 12,
  },
});

export default RideSelectionList;

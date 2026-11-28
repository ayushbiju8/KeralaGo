/**
 * Molecule: PlacesAutocompleteInput
 *
 * Phase 1: Search input component using Google Places Autocomplete API.
 * Users query destinations; selecting a prediction resolves its place_id
 * into Lat/Lng coordinates for drop-off calculation.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radii, Shadows, FontSize } from '../../constants/theme';
import {
  fetchPlacesAutocomplete,
  fetchPlaceCoordinates,
  PlacePrediction,
  PlaceLocation,
} from '../../services/googleMapsService';

export interface PlacesAutocompleteInputProps {
  placeholder?: string;
  onLocationSelect: (location: PlaceLocation) => void;
  style?: ViewStyle;
}

export const PlacesAutocompleteInput: React.FC<PlacesAutocompleteInputProps> = ({
  placeholder = 'Where to in Kerala? (e.g. Lulu Mall, Kochi)',
  onLocationSelect,
  style,
}) => {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const sessionTokenRef = useRef<string>(Math.random().toString(36).substring(2));

  // Debounced search query
  useEffect(() => {
    if (query.trim().length < 2) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      const results = await fetchPlacesAutocomplete(query, sessionTokenRef.current);
      setPredictions(results);
      setIsOpen(results.length > 0);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectPrediction = async (item: PlacePrediction) => {
    setIsLoading(true);
    setIsOpen(false);
    setQuery(item.primaryText);

    // Resolve place_id to Lat/Lng
    const location = await fetchPlaceCoordinates(item.placeId, sessionTokenRef.current);
    setIsLoading(false);

    // Reset session token for the next transaction
    sessionTokenRef.current = Math.random().toString(36).substring(2);

    if (location) {
      onLocationSelect(location);
    }
  };

  const handleClear = () => {
    setQuery('');
    setPredictions([]);
    setIsOpen(false);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Search Input Box */}
      <View style={styles.inputContainer}>
        <Ionicons name="search" size={20} color={Colors.primary} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onFocus={() => {
            if (predictions.length > 0) setIsOpen(true);
          }}
          autoCorrect={false}
          returnKeyType="search"
        />
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.primary} style={styles.actionIcon} />
        ) : query.length > 0 ? (
          <TouchableOpacity onPress={handleClear} style={styles.actionIcon}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Autocomplete Predictions Dropdown */}
      {isOpen && predictions.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={predictions}
            keyExtractor={(item) => item.placeId}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.predictionItem}
                onPress={() => handleSelectPrediction(item)}
                activeOpacity={0.7}
              >
                <View style={styles.pinCircle}>
                  <Ionicons name="location-outline" size={16} color={Colors.primary} />
                </View>
                <View style={styles.predictionTextContainer}>
                  <Text style={styles.primaryText} numberOfLines={1}>
                    {item.primaryText}
                  </Text>
                  {item.secondaryText ? (
                    <Text style={styles.secondaryText} numberOfLines={1}>
                      {item.secondaryText}
                    </Text>
                  ) : null}
                </View>
                {item.distanceText ? (
                  <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginLeft: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#15803D' }}>
                      {item.distanceText}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 100,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    height: 52,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: FontSize.body1,
    color: Colors.textPrimary,
    paddingVertical: Spacing.xs,
  },
  actionIcon: {
    marginLeft: Spacing.xs,
  },
  dropdown: {
    position: 'absolute',
    top: 58,
    left: 0,
    right: 0,
    maxHeight: 260,
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.lg,
    overflow: 'hidden',
    zIndex: 1000,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  pinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  predictionTextContainer: {
    flex: 1,
  },
  primaryText: {
    fontSize: FontSize.body2,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  secondaryText: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 56,
  },
});

export default PlacesAutocompleteInput;

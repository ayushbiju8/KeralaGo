/**
 * Atom: Icon
 *
 * Universal icon wrapper over @expo/vector-icons.
 * Supports Ionicons (primary), MaterialIcons, and MaterialCommunityIcons.
 *
 * Usage:
 *   <Icon library="Ionicons" name="location-sharp" size="md" color={Colors.primary} />
 *   <Icon library="MaterialIcons" name="directions-car" size="lg" />
 */

import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Feather from '@expo/vector-icons/Feather';
import { Colors, IconSize, IconSizeKey } from '../../constants/theme';

export type IconLibrary = 'Ionicons' | 'MaterialIcons' | 'MaterialCommunityIcons' | 'Feather';

export interface IconProps {
  /** Icon library to use */
  library?: IconLibrary;
  /** Icon name within the selected library */
  name: string;
  /** Icon size — key from IconSize scale or raw number */
  size?: IconSizeKey | number;
  /** Icon color */
  color?: string;
  /** Container style */
  style?: StyleProp<ViewStyle>;
}

const Icon: React.FC<IconProps> = ({
  library = 'Ionicons',
  name,
  size = 'md',
  color = Colors.textPrimary,
  style,
}) => {
  const resolvedSize = typeof size === 'number' ? size : IconSize[size];

  const commonProps = {
    name: name as any,
    size: resolvedSize,
    color,
    style,
  };

  switch (library) {
    case 'MaterialIcons':
      return <MaterialIcons {...commonProps} />;
    case 'MaterialCommunityIcons':
      return <MaterialCommunityIcons {...commonProps} />;
    case 'Feather':
      return <Feather {...commonProps} />;
    case 'Ionicons':
    default:
      return <Ionicons {...commonProps} />;
  }
};

export default Icon;

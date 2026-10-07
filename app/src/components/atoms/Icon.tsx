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
import { StyleProp, TextStyle } from 'react-native';
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
  Feather,
} from '@expo/vector-icons';
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
  style?: StyleProp<TextStyle>;
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
    style: style as any,
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

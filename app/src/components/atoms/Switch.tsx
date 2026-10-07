/**
 * Atom: Switch
 *
 * Toggle switch with Kerala emerald active color.
 * Used for: Online/Offline toggle (Driver), Notifications settings, App preferences.
 */

import React from 'react';
import { Switch as RNSwitch, SwitchProps as RNSwitchProps, Platform } from 'react-native';
import { Colors } from '../../constants/theme';

export interface SwitchProps extends Omit<RNSwitchProps, 'trackColor' | 'thumbColor' | 'ios_backgroundColor'> {
  /** Current value */
  value: boolean;
  /** Change handler */
  onValueChange: (value: boolean) => void;
  /** Disabled state */
  disabled?: boolean;
}

const Switch: React.FC<SwitchProps> = ({ value, onValueChange, disabled = false, ...rest }) => {
  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{
        false: Colors.border,
        true: Colors.primaryVibrant,
      }}
      thumbColor={Platform.OS === 'android' ? (value ? Colors.primary : Colors.white) : Colors.white}
      ios_backgroundColor={Colors.border}
      {...rest}
    />
  );
};

export default Switch;

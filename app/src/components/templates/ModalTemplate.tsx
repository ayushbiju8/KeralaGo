/**
 * Template: ModalTemplate
 *
 * Centered or slide-up modal overlay with backdrop and content container.
 *
 * Used in:
 *  - Confirmation dialogs (Suspend, Blacklist, Log Out, Block User)
 *  - Tooltip/info overlays
 *  - Any non-bottom-sheet modal dialog
 *
 * Reference: Admin confirm actions
 */

import React from 'react';
import {
  Modal,
  View,
  TouchableWithoutFeedback,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors, Radii, Spacing, Shadows } from '../../constants/theme';

export interface ModalTemplateProps {
  /** Visibility */
  visible: boolean;
  /** Called when backdrop is tapped */
  onClose?: () => void;
  /** Modal content */
  children: React.ReactNode;
  /** Override modal container style */
  style?: ViewStyle;
}

const ModalTemplate: React.FC<ModalTemplateProps> = ({
  visible,
  onClose,
  children,
  style,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.scrim}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <View style={[styles.container, Shadows.xl as ViewStyle, style]}>
          {children}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: Colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: Radii['2xl'],
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 420,
  },
});

export default ModalTemplate;

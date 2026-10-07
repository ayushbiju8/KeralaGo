/**
 * Organism: BottomSheet
 *
 * Slide-up panel that appears over the map and other content.
 * Handles drag-to-dismiss, backdrop scrim, and smooth elevation.
 *
 * Used in:
 *  - Customer: "Choose a ride" sheet, confirm payment sheet, tracking sheet
 *  - Driver: Incoming ride request, active ride card, trip completed
 *  - All screens where content slides up from the bottom
 *
 * Reference: Customer Booking Flow — every step after entering destination
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableWithoutFeedback,
  Modal,
} from 'react-native';
import { Colors, Radii, Shadows, Spacing } from '../../constants/theme';

export interface BottomSheetProps {
  /** Whether the sheet is visible */
  visible: boolean;
  /** Called when user taps backdrop or drags down */
  onClose?: () => void;
  /** Sheet content */
  children: React.ReactNode;
  /** Whether to show backdrop */
  showBackdrop?: boolean;
  /** Whether to render inline (no modal, positioned absolute over parent) */
  inline?: boolean;
  /** Drag handle on top */
  showHandle?: boolean;
  /** Override sheet container style */
  style?: ViewStyle;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  children,
  showBackdrop = true,
  inline = false,
  showHandle = true,
  style,
}) => {
  if (!visible) return null;

  const sheetContent = (
    <View style={[styles.sheet, Shadows.xl as ViewStyle, style]}>
      {showHandle && <View style={styles.handle} />}
      {children}
    </View>
  );

  if (inline) {
    return <View style={styles.inlineContainer}>{sheetContent}</View>;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        {showBackdrop && (
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>
        )}
        {sheetContent}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.overlay,
  },
  inlineContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radii['2xl'],
    borderTopRightRadius: Radii['2xl'],
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['2xl'],
    minHeight: 200,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
});

export default BottomSheet;

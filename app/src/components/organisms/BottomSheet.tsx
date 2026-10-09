/**
 * Organism: BottomSheet
 *
 * Slide-up panel that appears over the map and other content.
 * Handles drag-to-dismiss, backdrop scrim, smooth elevation,
 * and collapsible bottom drawer gestures.
 *
 * Variants:
 *  - 'modal': Standard modal sheet with backdrop scrim.
 *  - 'inline': Static absolute-bottom sheet.
 *  - 'drawer': Interactive collapsible drawer with drag down/up gestures.
 *
 * Used in:
 *  - Customer: "Choose a ride" sheet, confirm payment sheet, tracking sheet
 *  - Driver: Incoming ride request, collapsible home drawer, trip completed
 *  - All screens where content slides up from the bottom
 *
 * Reference: Customer Booking Flow & Driver Home interactive drawer
 */

import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableWithoutFeedback,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Colors, Radii, Shadows, Spacing } from '../../constants/theme';

const { height: screenHeight } = Dimensions.get('window');

export interface BottomSheetProps {
  /** Whether the sheet is visible (defaults to true) */
  visible?: boolean;
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
  /** Sheet presentation variant: 'modal' (default) | 'inline' | 'drawer' */
  variant?: 'modal' | 'inline' | 'drawer';
  /** Top position from screen top when expanded in drawer mode (default SCREEN_HEIGHT * 0.38) */
  expandedTop?: number;
  /** Bottom offset in drawer mode (e.g. for bottom tab bar, default 0) */
  bottomOffset?: number;
  /** Height visible when collapsed in drawer mode (default 48) */
  collapsedPeekHeight?: number;
  /** Initial collapsed state in drawer mode */
  isInitiallyCollapsed?: boolean;
  /** Callback when drawer collapses or expands */
  onCollapseChange?: (isCollapsed: boolean) => void;
  /** Optional custom header inside handle area */
  handleHeader?: React.ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  visible = true,
  onClose,
  children,
  showBackdrop = true,
  inline = false,
  showHandle = true,
  style,
  variant = 'modal',
  expandedTop,
  bottomOffset = 0,
  collapsedPeekHeight = 48,
  isInitiallyCollapsed = false,
  onCollapseChange,
  handleHeader,
}) => {
  // ── 1. Collapsible Drawer Variant ──
  const effectiveExpandedTop = expandedTop ?? Math.round(screenHeight * 0.38);
  const totalDrawerHeight = Math.max(120, screenHeight - effectiveExpandedTop - bottomOffset);
  const maxTranslateY = Math.max(0, totalDrawerHeight - collapsedPeekHeight);

  const translateY = useRef(new Animated.Value(isInitiallyCollapsed ? maxTranslateY : 0)).current;
  const currentOffset = useRef(isInitiallyCollapsed ? maxTranslateY : 0);
  const isCollapsedRef = useRef(!!isInitiallyCollapsed);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 4,
      onPanResponderMove: (_, gestureState) => {
        const nextPos = Math.max(0, Math.min(maxTranslateY, currentOffset.current + gestureState.dy));
        translateY.setValue(nextPos);
      },
      onPanResponderRelease: (_, gestureState) => {
        const isCollapsed = isCollapsedRef.current;
        let shouldCollapse = isCollapsed;

        // Detect tap vs drag
        if (Math.abs(gestureState.dy) < 6 && Math.abs(gestureState.dx) < 6) {
          shouldCollapse = !isCollapsed;
        } else if (!isCollapsed) {
          shouldCollapse = gestureState.vy > 0.3 || gestureState.dy > 50;
        } else {
          shouldCollapse = !(gestureState.vy < -0.3 || gestureState.dy < -50);
        }

        const targetVal = shouldCollapse ? maxTranslateY : 0;
        currentOffset.current = targetVal;
        isCollapsedRef.current = shouldCollapse;

        Animated.spring(translateY, {
          toValue: targetVal,
          useNativeDriver: true,
          bounciness: 4,
        }).start(() => {
          onCollapseChange?.(shouldCollapse);
        });
      },
    })
  ).current;

  if (variant === 'drawer') {
    if (!visible) return null;

    return (
      <Animated.View
        style={[
          styles.drawerContainer,
          {
            top: effectiveExpandedTop,
            bottom: bottomOffset,
            transform: [{ translateY }],
          },
          Shadows.xl as ViewStyle,
          style,
        ]}
      >
        {/* Drag handle bar region */}
        <View {...panResponder.panHandlers} style={styles.drawerHandleBar}>
          {showHandle && <View style={styles.handle} />}
          {handleHeader}
        </View>

        {/* Scrollable / Flexible inner content */}
        <View style={styles.drawerContentArea}>
          {children}
        </View>
      </Animated.View>
    );
  }

  // ── 2. Modal or Inline Variant ──
  if (!visible) return null;

  const sheetContent = (
    <View style={[styles.sheet, Shadows.xl as ViewStyle, style]}>
      {showHandle && <View style={styles.handle} />}
      {children}
    </View>
  );

  if (inline || variant === 'inline') {
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
    width: 48,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  drawerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    zIndex: 20,
    overflow: 'hidden',
  },
  drawerHandleBar: {
    width: '100%',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  drawerContentArea: {
    flex: 1,
  },
});

export default BottomSheet;

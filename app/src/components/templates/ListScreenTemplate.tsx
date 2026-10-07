/**
 * Template: ListScreenTemplate
 *
 * Standard list screen layout with header, filter bar, and scrollable content.
 *
 * Layout Zones:
 *   - Header: NavigationHeader slot
 *   - Filters: FilterPillBar or SegmentTabs slot
 *   - Body: scrollable list content
 *   - Footer: optional sticky CTA or tab bar
 *
 * Used in:
 *  - Admin: Drivers list, Customers list, Analytics
 *  - Driver: Trips list, Earnings
 *  - Customer: Bookings list, Payment Methods, Safety
 *
 * Reference: Admin Management screens, Driver Trips/Earnings, Customer Bookings
 */

import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../constants/theme';

export interface ListScreenTemplateProps {
  /** NavigationHeader or custom header */
  header?: React.ReactNode;
  /** Filter pills / segment tabs slot */
  filters?: React.ReactNode;
  /** Scrollable body content */
  children: React.ReactNode;
  /** Sticky bottom footer (BottomTabBar, CTA button) */
  footer?: React.ReactNode;
  /** Padding for content area */
  contentPadding?: number;
  /** Background color override */
  backgroundColor?: string;
  /** Override style */
  style?: ViewStyle;
}

const ListScreenTemplate: React.FC<ListScreenTemplateProps> = ({
  header,
  filters,
  children,
  footer,
  contentPadding = Spacing.base,
  backgroundColor = Colors.background,
  style,
}) => {
  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor }, style]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        {header && <View style={styles.header}>{header}</View>}

        {/* Filters */}
        {filters && <View style={styles.filters}>{filters}</View>}

        {/* Scrollable body */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { padding: contentPadding }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>

        {/* Footer */}
        {footer && <View style={styles.footer}>{footer}</View>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    zIndex: 10,
  },
  filters: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  footer: {
    backgroundColor: Colors.white,
  },
});

export default ListScreenTemplate;

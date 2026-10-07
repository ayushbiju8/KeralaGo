/**
 * Template: DetailScreenTemplate
 *
 * Profile / detail view with curved green hero banner, avatar slot, stats row,
 * and scrollable grouped info sections.
 *
 * Layout Zones:
 *   - Hero: curved green/mint banner with back button + title + right actions
 *   - Avatar: overlapping avatar and name
 *   - Stats row: trip count, rating, months
 *   - Body: scrollable grouped sections
 *   - Footer: fixed action buttons (Edit, Block, Suspend, etc.)
 *
 * Used in:
 *  - Admin: Driver Profile, Customer Profile, Admin Profile
 *  - Driver: Profile screen
 *  - Customer: Profile screen
 *
 * Reference: Admin Driver Profile, Admin Customer Profile, Driver Profile screens
 */

import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radii } from '../../constants/theme';

export interface DetailScreenTemplateProps {
  /** Back/header overlay content (NavigationHeader transparent) */
  headerOverlay?: React.ReactNode;
  /** Avatar + name block */
  avatarBlock?: React.ReactNode;
  /** Stats row (trips, rating, months) */
  statsRow?: React.ReactNode;
  /** Body sections */
  children: React.ReactNode;
  /** Fixed footer (Edit Profile button, action buttons) */
  footer?: React.ReactNode;
  /** Hero banner color */
  heroBg?: string;
  /** Override style */
  style?: ViewStyle;
}

const DetailScreenTemplate: React.FC<DetailScreenTemplateProps> = ({
  headerOverlay,
  avatarBlock,
  statsRow,
  children,
  footer,
  heroBg = Colors.primary,
  style,
}) => {
  return (
    <View style={[styles.root, style]}>
      <StatusBar barStyle="light-content" backgroundColor={heroBg} />

      {/* Hero Banner */}
      <View style={[styles.hero, { backgroundColor: heroBg }]}>
        {headerOverlay}
      </View>

      {/* Curved white body */}
      <View style={styles.body}>
        {/* Avatar overlapping hero */}
        {avatarBlock && <View style={styles.avatarSlot}>{avatarBlock}</View>}

        {/* Stats row */}
        {statsRow && <View style={styles.statsRow}>{statsRow}</View>}

        {/* Scrollable content */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>

      {/* Fixed footer */}
      {footer && (
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          {footer}
        </SafeAreaView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  hero: {
    height: 180,
    paddingTop: StatusBar.currentHeight ?? 44,
  },
  body: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radii['3xl'],
    borderTopRightRadius: Radii['3xl'],
    marginTop: -Radii['3xl'],
  },
  avatarSlot: {
    alignItems: 'center',
    marginTop: -44,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: Spacing.sm,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['3xl'],
  },
  footer: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
});

export default DetailScreenTemplate;

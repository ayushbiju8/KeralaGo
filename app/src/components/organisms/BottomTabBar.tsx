/**
 * Organism: BottomTabBar
 *
 * App-wide bottom navigation bar matching all 3 KeralaGo mockups.
 *
 * Customer tabs: Home | Bookings | Profile
 * Driver tabs:   Home | Earnings | Bookings | Profile
 * Admin tabs:    Home | Analytics | Management | Profile
 *
 * Active tab: pill background + green icon + green label + green underline
 * Inactive: grey icon + grey label
 *
 * Reference: All 3 app showcases — bottom navigation
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon, { IconLibrary } from '../atoms/Icon';
import Typography from '../atoms/Typography';
import { Colors, Spacing, Radii, Shadows } from '../../constants/theme';

export interface TabItem {
  /** Unique tab identifier */
  id: string;
  /** Label */
  label: string;
  /** Active icon name */
  iconName: string;
  /** Inactive icon name (e.g. outline variant) */
  iconNameInactive?: string;
  /** Icon library */
  iconLibrary?: IconLibrary;
}

export interface BottomTabBarProps {
  /** Tab definitions */
  tabs: TabItem[];
  /** Currently active tab */
  activeTabId: string;
  /** Tab press handler */
  onTabPress: (id: string) => void;
  /** Override container style */
  style?: ViewStyle;
}

const BottomTabBar: React.FC<BottomTabBarProps> = ({
  tabs,
  activeTabId,
  onTabPress,
  style,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        Shadows.md as ViewStyle,
        { paddingBottom: Math.max(insets.bottom, Spacing.sm) },
        style,
      ]}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const iconName = isActive
          ? tab.iconName
          : (tab.iconNameInactive ?? tab.iconName);

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => onTabPress(tab.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              <Icon
                library={tab.iconLibrary ?? 'Ionicons'}
                name={iconName}
                size="md"
                color={isActive ? Colors.primary : Colors.textMuted}
              />
            </View>

            <Typography
              variant="xs"
              weight={isActive ? 'semiBold' : 'regular'}
              color={isActive ? Colors.primary : Colors.textMuted}
            >
              {tab.label}
            </Typography>

            {isActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingTop: Spacing.xs,
    position: 'relative',
  },
  iconWrap: {
    padding: Spacing.xs,
    borderRadius: Radii.full,
  },
  iconWrapActive: {
    backgroundColor: Colors.mintLight,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -Spacing.sm,
    left: '50%',
    marginLeft: -12,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
});

export default BottomTabBar;

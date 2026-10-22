import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon, { IconLibrary } from '../atoms/Icon';
import Typography from '../atoms/Typography';
import { Colors, Shadows } from '../../constants/theme';

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
  /** Show pill highlight behind active icon */
  showActivePill?: boolean;
  /** Override container style */
  style?: ViewStyle;
}

const BottomTabBar: React.FC<BottomTabBarProps> = ({
  tabs,
  activeTabId,
  onTabPress,
  showActivePill = true,
  style,
}) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 8;

  return (
    <View
      style={[
        styles.container,
        Shadows.md as ViewStyle,
        { paddingBottom: bottomPadding },
        style,
      ]}
    >
      <View style={styles.tabsRow}>
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
              {/* Icon Container with active rounded pill */}
              <View
                style={[
                  styles.iconWrap,
                  isActive && showActivePill && styles.iconWrapActive,
                ]}
              >
                <Icon
                  library={tab.iconLibrary ?? 'Ionicons'}
                  name={iconName}
                  size={21}
                  color={isActive ? '#0F4A2B' : '#64748B'}
                />
              </View>

              {/* Tab Label */}
              <Typography
                variant="caption"
                weight={isActive ? 'bold' : 'medium'}
                color={isActive ? '#0F4A2B' : '#64748B'}
                style={styles.tabLabel}
              >
                {tab.label}
              </Typography>

              {/* Persistent slot for active indicator to guarantee zero vertical baseline shifting */}
              <View
                style={[
                  styles.activeIndicator,
                  { backgroundColor: isActive ? '#0F4A2B' : 'transparent' },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Simulated Home Indicator Bar only on web when there are no native system insets */}
      {Platform.OS === 'web' && insets.bottom === 0 && (
        <View style={styles.homeIndicator} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 6,
    zIndex: 25,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 56,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: '100%',
    paddingTop: 2,
  },
  iconWrap: {
    width: 54,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#DFF2E7',
  },
  tabLabel: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 14,
  },
  activeIndicator: {
    width: 16,
    height: 2.5,
    borderRadius: 1.5,
    marginTop: 2,
  },
  homeIndicator: {
    width: 120,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#94A3B8',
    alignSelf: 'center',
    marginTop: 6,
    opacity: 0.6,
  },
});

export default BottomTabBar;

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
        { paddingBottom: Math.max(insets.bottom - 4, 6) },
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
              <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                <Icon
                  library={tab.iconLibrary ?? 'Ionicons'}
                  name={iconName}
                  size={22}
                  color={isActive ? '#0F4A2B' : '#64748B'}
                />
              </View>

              <Typography
                variant="caption"
                weight={isActive ? 'bold' : 'medium'}
                color={isActive ? '#0F4A2B' : '#64748B'}
                style={styles.tabLabel}
              >
                {tab.label}
              </Typography>

              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* iOS Home Indicator Bar */}
      <View style={styles.homeIndicator} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 62,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#DFF2E7',
  },
  tabLabel: {
    marginTop: 3,
    fontSize: 11.5,
  },
  activeIndicator: {
    width: 14,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: '#0F4A2B',
    marginTop: 3,
  },
  homeIndicator: {
    width: 128,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: '#1E293B',
    alignSelf: 'center',
    marginTop: 8,
    opacity: 0.8,
  },
});

export default BottomTabBar;

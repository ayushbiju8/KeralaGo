import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { BottomTabBar, TabItem } from '../../components/organisms';
import CustomerHomeView from './views/CustomerHomeView';
import CustomerTripsView from './views/CustomerTripsView';
import CustomerProfileView from './views/CustomerProfileView';
import { Colors } from '../../constants/theme';

/**
 * Three Tabs matching Green Ride-Hailing Map Interface.png:
 * Home | Bookings | Profile
 */
const CUSTOMER_TABS: TabItem[] = [
  { id: 'home', label: 'Home', iconName: 'home', iconNameInactive: 'home-outline' },
  { id: 'bookings', label: 'Bookings', iconName: 'bag-handle', iconNameInactive: 'bag-handle-outline' },
  { id: 'profile', label: 'Profile', iconName: 'person', iconNameInactive: 'person-outline' },
];

const CustomerHomePage: React.FC = () => {
  const { user, toggleRole, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isBookingActive, setIsBookingActive] = useState<boolean>(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return (
          <CustomerHomeView
            userName={user?.name}
            userAvatar={user?.avatar}
            onToggleRole={toggleRole}
            onBookingStateChange={setIsBookingActive}
          />
        );
      case 'bookings':
        return <CustomerTripsView />;
      case 'profile':
        return (
          <CustomerProfileView
            onLogout={logout}
            onToggleRole={toggleRole}
            currentRole={user?.role}
          />
        );
      default:
        return (
          <CustomerHomeView
            userName={user?.name}
            userAvatar={user?.avatar}
            onToggleRole={toggleRole}
            onBookingStateChange={setIsBookingActive}
          />
        );
    }
  };

  return (
    <View style={styles.root}>
      {/* ── Active Tab View (Full screen map & interface matching reference UI) ── */}
      <View style={styles.viewContainer}>
        {renderActiveView()}
      </View>

      {/* ── Persistent Bottom Navigation Bar (Hidden during active booking flows) ── */}
      {!isBookingActive && (
        <BottomTabBar
          tabs={CUSTOMER_TABS}
          activeTabId={activeTab}
          onTabPress={setActiveTab}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#EDF3EE',
  },
  viewContainer: {
    flex: 1,
  },
});

export default CustomerHomePage;

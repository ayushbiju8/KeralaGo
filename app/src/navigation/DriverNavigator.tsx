import React, { useState } from 'react';
import {
  DriverHomePage,
  DriverEarningsPage,
  DriverTripsPage,
  DriverProfilePage,
  DriverVehicleDetailsPage,
} from '../pages/driver';
import { TabItem } from '../components/organisms';

const DRIVER_TABS: TabItem[] = [
  { id: 'home', label: 'Home', iconName: 'home', iconNameInactive: 'home-outline' },
  { id: 'earnings', label: 'Earnings', iconName: 'stats-chart', iconNameInactive: 'stats-chart-outline' },
  { id: 'bookings', label: 'Bookings', iconName: 'bag-handle', iconNameInactive: 'bag-handle-outline' },
  { id: 'profile', label: 'Profile', iconName: 'person', iconNameInactive: 'person-outline' },
];

export type DriverScreenType = 'home' | 'earnings' | 'bookings' | 'profile' | 'vehicle-details';

export default function DriverNavigator() {
  const [currentScreen, setCurrentScreen] = useState<DriverScreenType>('home');
  const [prevScreen, setPrevScreen] = useState<DriverScreenType>('home');

  const navigateTo = (screen: DriverScreenType) => {
    setPrevScreen(currentScreen);
    setCurrentScreen(screen);
  };

  switch (currentScreen) {
    case 'earnings':
      return (
        <DriverEarningsPage
          onBack={() => setCurrentScreen('home')}
          activeTab="earnings"
          onTabPress={(tabId) => setCurrentScreen(tabId as DriverScreenType)}
          tabs={DRIVER_TABS}
        />
      );

    case 'bookings':
      return (
        <DriverTripsPage
          onBack={() => setCurrentScreen('home')}
          activeTab="bookings"
          onTabPress={(tabId) => setCurrentScreen(tabId as DriverScreenType)}
          tabs={DRIVER_TABS}
        />
      );

    case 'profile':
      return (
        <DriverProfilePage
          onBack={() => setCurrentScreen('home')}
          onNavigateVehicleDetails={() => navigateTo('vehicle-details')}
          activeTab="profile"
          onTabPress={(tabId) => setCurrentScreen(tabId as DriverScreenType)}
          tabs={DRIVER_TABS}
        />
      );

    case 'vehicle-details':
      return (
        <DriverVehicleDetailsPage
          onBack={() => setCurrentScreen(prevScreen || 'profile')}
        />
      );

    case 'home':
    default:
      return (
        <DriverHomePage
          onNavigateTab={(tabId) => setCurrentScreen(tabId as DriverScreenType)}
          onNavigateVehicleDetails={() => navigateTo('vehicle-details')}
          activeTab="home"
        />
      );
  }
}

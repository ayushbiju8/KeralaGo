import React from 'react';
import { useAuth } from '../hooks/useAuth';
import AuthNavigator from './AuthNavigator';
import UserNavigator from './UserNavigator';
import DriverNavigator from './DriverNavigator';

export default function AppNavigator() {
  const { user } = useAuth();

  if (!user) {
    return <AuthNavigator />;
  }

  switch (user.role) {
    case 'USER':
      return <UserNavigator />;

    case 'DRIVER':
      return <DriverNavigator />;

    default:
      return <AuthNavigator />;
  }
}

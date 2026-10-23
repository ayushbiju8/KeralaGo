import React from 'react';
import { useAuth } from '../hooks/useAuth';
import AuthNavigator from './AuthNavigator';
import UserNavigator from './UserNavigator';
import DriverNavigator from './DriverNavigator';
import AdminNavigator from './AdminNavigator';

export default function AppNavigator() {
  const { user } = useAuth();

  // Authentication Guard: if user is not authenticated, show Auth flow
  if (!user) {
    return <AuthNavigator />;
  }

  // RBAC Guard: Route user strictly based on verified database role
  switch (user.role) {
    case 'USER':
      return <UserNavigator />;

    case 'DRIVER':
      return <DriverNavigator />;

    case 'ADMIN':
      return <AdminNavigator />;

    default:
      return <AuthNavigator />;
  }
}


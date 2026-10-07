import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, UserRole } from '../../types/user';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (role?: UserRole) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
  toggleRole: () => void;
  toggleDriverDuty: () => void;
}

const DEFAULT_CUSTOMER: User = {
  id: 'usr_kl_001',
  name: 'Arun Kumar',
  phone: '+91 98470 12345',
  email: 'arun.kerala@example.com',
  role: 'USER',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  rating: 4.88,
  totalRides: 34,
};

const DEFAULT_DRIVER: User = {
  id: 'drv_kl_108',
  name: 'Suresh Pillai',
  phone: '+91 94471 98765',
  email: 'suresh.keralago@gmail.com',
  role: 'DRIVER',
  avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
  rating: 4.94,
  totalRides: 1420,
  isOnline: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(DEFAULT_CUSTOMER);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = useCallback((role: UserRole = 'USER') => {
    setIsLoading(true);
    setTimeout(() => {
      setUser(role === 'DRIVER' ? { ...DEFAULT_DRIVER } : { ...DEFAULT_CUSTOMER });
      setIsLoading(false);
    }, 200);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const setRole = useCallback((role: UserRole) => {
    setUser((prev) => {
      if (!prev) return role === 'DRIVER' ? { ...DEFAULT_DRIVER } : { ...DEFAULT_CUSTOMER };
      return {
        ...prev,
        role,
        isOnline: role === 'DRIVER' ? (prev.isOnline ?? true) : undefined,
      };
    });
  }, []);

  const toggleRole = useCallback(() => {
    setUser((prev) => {
      if (!prev) return { ...DEFAULT_CUSTOMER };
      const nextRole: UserRole = prev.role === 'USER' ? 'DRIVER' : 'USER';
      return {
        ...prev,
        role: nextRole,
        isOnline: nextRole === 'DRIVER' ? (prev.isOnline ?? true) : undefined,
      };
    });
  }, []);

  const toggleDriverDuty = useCallback(() => {
    setUser((prev) => {
      if (!prev || prev.role !== 'DRIVER') return prev;
      return {
        ...prev,
        isOnline: !prev.isOnline,
      };
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        setRole,
        toggleRole,
        toggleDriverDuty,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

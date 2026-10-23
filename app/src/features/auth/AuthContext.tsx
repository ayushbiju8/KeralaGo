import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, UserRole } from '../../types/user';
import {
  sendOtpApi,
  verifyOtpApi,
  updateUserProfileApi,
  fetchUserProfileApi,
  SendOtpResponse,
} from '../../services/authApi';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (role?: UserRole) => void;
  loginWithCredentials: (
    mobile: string,
    otp: string,
    role?: UserRole,
    name?: string
  ) => Promise<{ success: boolean; message?: string }>;
  sendOtp: (mobile: string, role?: UserRole) => Promise<SendOtpResponse>;
  updateProfile: (name: string, paymentMethod?: string) => Promise<boolean>;
  logout: () => void;
  setRole: (role: UserRole) => void;
  toggleRole: () => void;
  toggleDriverDuty: () => void;
  refreshProfile: () => Promise<void>;
}

const DEFAULT_CUSTOMER: User = {
  id: '13889384-b187-414f-8fc9-7ed550db8433',
  name: 'Arun Kumar',
  phone: '+91 98470 12345',
  email: 'arun.kerala@example.com',
  role: 'USER',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  rating: 4.88,
  totalRides: 34,
  defaultPaymentMethod: 'UPI',
};

const DEFAULT_DRIVER: User = {
  id: '827e2bdd-8609-4438-863d-d056b3aefdbe',
  name: 'Suresh Pillai',
  phone: '+91 94471 98765',
  email: 'suresh.keralago@gmail.com',
  role: 'DRIVER',
  avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
  rating: 4.94,
  totalRides: 1420,
  isOnline: true,
  defaultPaymentMethod: 'UPI',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Authentication Guard: Initially null to enforce login and RBAC route protection
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Send OTP linked to PostgreSQL / SQLite database
  const sendOtp = useCallback(async (mobile: string, role: UserRole = 'USER'): Promise<SendOtpResponse> => {
    setIsLoading(true);
    try {
      const res = await sendOtpApi(mobile, role);
      return res;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login with OTP verified against database
  const loginWithCredentials = useCallback(
    async (
      mobile: string,
      otp: string,
      role: UserRole = 'USER',
      name?: string
    ): Promise<{ success: boolean; message?: string }> => {
      setIsLoading(true);
      try {
        const res = await verifyOtpApi(mobile, otp, role, name);
        if (res.success && res.user) {
          setUser(res.user);
          return { success: true };
        }
        return { success: false, message: res.message || 'Verification failed' };
      } catch (err: any) {
        return { success: false, message: err.message || 'Login error' };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Quick fallback login for role switching or testing
  const login = useCallback((role: UserRole = 'USER') => {
    setIsLoading(true);
    setTimeout(() => {
      setUser(role === 'DRIVER' ? { ...DEFAULT_DRIVER } : { ...DEFAULT_CUSTOMER });
      setIsLoading(false);
    }, 200);
  }, []);

  // Update profile and persist directly to database
  const updateProfile = useCallback(
    async (name: string, paymentMethod?: string): Promise<boolean> => {
      if (!user) return false;
      const ok = await updateUserProfileApi(user.phone, name, paymentMethod);
      setUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          name: name || prev.name,
          defaultPaymentMethod: paymentMethod || prev.defaultPaymentMethod,
        };
      });
      return ok;
    },
    [user]
  );

  // Re-fetch profile dynamically from database
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const fresh = await fetchUserProfileApi(user.phone, user.id);
    if (fresh) {
      setUser((prev) => (prev ? { ...prev, ...fresh } : fresh));
    }
  }, [user]);

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
        loginWithCredentials,
        sendOtp,
        updateProfile,
        refreshProfile,
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

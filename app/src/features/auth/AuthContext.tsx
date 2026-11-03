import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, UserRole } from '../../types/user';
import {
  sendOtpApi,
  verifyOtpApi,
  updateUserProfileApi,
  fetchUserProfileApi,
  SendOtpResponse,
  SendOtpParams,
  VerifyOtpParams,
} from '../../services/authApi';
import { setAuthToken } from '../../services/apiClient';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (role?: UserRole) => void;
  loginWithCredentials: (
    target: string | VerifyOtpParams,
    otp?: string,
    role?: UserRole,
    name?: string
  ) => Promise<{ success: boolean; message?: string }>;
  sendOtp: (
    target: string | SendOtpParams,
    role?: UserRole
  ) => Promise<SendOtpResponse>;
  updateProfile: (name: string, paymentMethod?: string) => Promise<boolean>;
  logout: () => void;
  setRole: (role: UserRole) => void;
  toggleRole: () => void;
  toggleDriverDuty: () => void;
  refreshProfile: () => Promise<void>;
}

// No fake mock users. User state is strictly null until authenticated via API.

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Authentication Guard: Initially null to enforce login and RBAC route protection
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Send OTP linked to MSG91 SMS or Gmail SMTP Email
  const sendOtp = useCallback(
    async (
      target: string | SendOtpParams,
      role: UserRole = 'USER'
    ): Promise<SendOtpResponse> => {
      setIsLoading(true);
      try {
        const res = await sendOtpApi(target, role);
        return res;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Login with OTP verified against database & MSG91/SMTP
  const loginWithCredentials = useCallback(
    async (
      target: string | VerifyOtpParams,
      otp?: string,
      role: UserRole = 'USER',
      name?: string
    ): Promise<{ success: boolean; message?: string }> => {
      setIsLoading(true);
      try {
        const res = await verifyOtpApi(target, otp, role, name);
        if (res.success && res.user) {
          setUser(res.user);
          setToken(res.token);
          setAuthToken(res.token);
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

  // Quick login stub - only allowed if user is already authenticated
  const login = useCallback((role: UserRole = 'USER') => {
    setUser((prev) => (prev ? { ...prev, role } : null));
  }, []);

  // Update profile and persist directly to database
  const updateProfile = useCallback(
    async (name: string, paymentMethod?: string): Promise<boolean> => {
      if (!user) return false;
      const ok = await updateUserProfileApi(
        { mobileNumber: user.phone, email: user.email },
        name,
        paymentMethod
      );
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

  // Re-fetch profile dynamically from database via Bearer token
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const fresh = await fetchUserProfileApi(user.phone, user.id, user.email);
    if (fresh) {
      setUser((prev) => (prev ? { ...prev, ...fresh } : fresh));
    }
  }, [user]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
  }, []);

  const setRole = useCallback((role: UserRole) => {
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        role,
        isOnline: role === 'DRIVER' ? (prev.isOnline ?? true) : undefined,
      };
    });
  }, []);

  const toggleRole = useCallback(() => {
    setUser((prev) => {
      if (!prev) return null;
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
        token,
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

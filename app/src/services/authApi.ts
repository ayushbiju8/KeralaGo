import { Platform } from 'react-native';
import { User, UserRole } from '../types/user';
import { setAuthToken, getAuthToken } from './apiClient';

// Determine default API host depending on platform
const getBaseApiUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api';
  }
  return 'http://localhost:8000/api';
};

const API_BASE = getBaseApiUrl();

export interface SendOtpParams {
  mode?: 'LOGIN' | 'REGISTER';
  mobileNumber?: string;
  email?: string;
  role?: UserRole;
  fullName?: string;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  channel?: 'EMAIL' | 'MOBILE';
  identifier?: string;
  mobile_number?: string;
  email?: string;
  request_id?: string;
  dev_otp?: string;
  user_exists?: boolean;
  role?: UserRole;
  full_name?: string;
  mode?: 'LOGIN' | 'REGISTER';
}

export interface VerifyOtpParams {
  mode?: 'LOGIN' | 'REGISTER';
  mobileNumber?: string;
  email?: string;
  otp: string;
  requestId?: string;
  request_id?: string;
  role?: UserRole;
  fullName?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  token: string;
  token_type?: string;
  user: User;
  message?: string;
  mode?: 'LOGIN' | 'REGISTER';
}

export const sendOtpApi = async (
  target: string | SendOtpParams,
  defaultRole: UserRole = 'USER'
): Promise<SendOtpResponse> => {
  const isObject = typeof target === 'object' && target !== null;
  const rawMobile = isObject ? target.mobileNumber : target;
  const rawEmail = isObject ? target.email : undefined;
  const role = (isObject ? target.role : defaultRole) || defaultRole;
  const mode = isObject && target.mode ? target.mode : 'LOGIN';
  const fullName = isObject ? target.fullName : undefined;

  const requestBody: any = { mode, role };
  if (rawEmail) {
    requestBody.email = rawEmail.trim().toLowerCase();
  } else if (rawMobile) {
    requestBody.mobile_number = rawMobile.trim();
  }
  if (fullName) {
    requestBody.full_name = fullName.trim();
  }

  const res = await fetch(`${API_BASE}/auth/send-otp/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.success === false) {
    const errorMsg =
      data.message ||
      data.detail ||
      (typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Failed to send OTP');
    throw new Error(errorMsg);
  }

  return data;
};

export const verifyOtpApi = async (
  target: string | VerifyOtpParams,
  code?: string,
  defaultRole: UserRole = 'USER',
  defaultName?: string
): Promise<VerifyOtpResponse> => {
  const isObject = typeof target === 'object' && target !== null;
  const rawMobile = isObject ? target.mobileNumber : target;
  const rawEmail = isObject ? target.email : undefined;
  const otp = isObject ? target.otp : code || '';
  const role = (isObject ? target.role : defaultRole) || defaultRole;
  const fullName = isObject ? target.fullName : defaultName;
  const mode = isObject && target.mode ? target.mode : 'LOGIN';

  const requestBody: any = {
    mode: mode,
    otp: otp.trim(),
    role: role,
    full_name: fullName,
  };
  const reqId = isObject ? (target.requestId || target.request_id) : undefined;
  if (reqId) {
    requestBody.request_id = reqId.trim();
  }
  if (rawEmail) {
    requestBody.email = rawEmail.trim().toLowerCase();
  } else if (rawMobile) {
    requestBody.mobile_number = rawMobile.trim();
  }

  const res = await fetch(`${API_BASE}/auth/verify-otp/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.success) {
    const errorMsg =
      data.message ||
      data.detail ||
      (typeof data === 'object' ? Object.values(data).flat().join(' ') : 'OTP verification failed');
    throw new Error(errorMsg);
  }

  // Store token for subsequent authenticated API calls
  if (data.token) {
    setAuthToken(data.token);
  }

  return data;
};

export const fetchUserProfileApi = async (
  mobileNumber?: string,
  userId?: string,
  email?: string
): Promise<User | null> => {
  try {
    const params = new URLSearchParams();
    if (mobileNumber) params.append('mobile_number', mobileNumber);
    if (userId) params.append('user_id', userId);
    if (email) params.append('email', email);

    const headers: Record<string, string> = {};
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/auth/profile/${query}`, {
      headers,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      email: data.email,
      role: data.role,
      avatar: data.avatar,
      rating: 4.88,
      totalRides: 34,
      isOnline: data.is_driver ? true : undefined,
    };
  } catch (err) {
    console.warn('[authApi] fetchUserProfile error:', err);
    return null;
  }
};

export const updateUserProfileApi = async (
  identifier: { mobileNumber?: string; email?: string } | string,
  fullName?: string,
  defaultPaymentMethod?: string
): Promise<boolean> => {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const body: any = {
      full_name: fullName,
      default_payment_method: defaultPaymentMethod,
    };
    if (typeof identifier === 'object') {
      if (identifier.mobileNumber) body.mobile_number = identifier.mobileNumber;
      if (identifier.email) body.email = identifier.email;
    } else {
      body.mobile_number = identifier;
    }

    const res = await fetch(`${API_BASE}/auth/profile/`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch (err) {
    console.warn('[authApi] updateUserProfile error:', err);
    return false;
  }
};

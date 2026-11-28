/**
 * KeralaGO API Client
 * Configured to connect to the local Django backend with automatic fallback.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

function getApiBaseUrl(): string {
  if (Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
  }

  // If explicit environment URL is configured and not pointing to localhost, use it
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // Detect host IP from Expo debugger connection (points to the computer's LAN IP)
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).expoGoConfig?.debuggerHost;
  const ip = hostUri ? hostUri.split(':')[0] : null;

  if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
    return `http://${ip}:8000/api`;
  }

  // Default to developer machine's LAN IP for physical device in Expo Go
  return 'http://10.179.113.29:8000/api';
}

export const API_BASE_URL = getApiBaseUrl();

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  fromDb: boolean;
}

let currentAuthToken: string | null = null;

export function setAuthToken(token: string | null): void {
  currentAuthToken = token;
}

export function getAuthToken(): string | null {
  return currentAuthToken;
}

function getHeaders(extraHeaders?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(extraHeaders || {}),
  };
  if (currentAuthToken) {
    headers['Authorization'] = `Bearer ${currentAuthToken}`;
  }
  return headers;
}

export async function apiGet<T>(endpoint: string, fallbackData: T): Promise<ApiResponse<T>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return { data, error: null, fromDb: true };
    } else {
      return {
        data: fallbackData,
        error: `HTTP ${response.status}: ${response.statusText}`,
        fromDb: false,
      };
    }
  } catch (err: any) {
    return {
      data: fallbackData,
      error: err?.message || 'Network request failed',
      fromDb: false,
    };
  }
}

export async function apiPost<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return { data, error: null, fromDb: true };
    } else {
      return {
        data: null,
        error: `HTTP ${response.status}: ${response.statusText}`,
        fromDb: false,
      };
    }
  } catch (err: any) {
    return {
      data: null,
      error: err?.message || 'Network request failed',
      fromDb: false,
    };
  }
}

export async function apiPatch<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return { data, error: null, fromDb: true };
    } else {
      return {
        data: null,
        error: `HTTP ${response.status}: ${response.statusText}`,
        fromDb: false,
      };
    }
  } catch (err: any) {
    return {
      data: null,
      error: err?.message || 'Network request failed',
      fromDb: false,
    };
  }
}

export async function apiDelete<T>(endpoint: string): Promise<ApiResponse<T>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return { data, error: null, fromDb: true };
    } else {
      return {
        data: null,
        error: `HTTP ${response.status}: ${response.statusText}`,
        fromDb: false,
      };
    }
  } catch (err: any) {
    return {
      data: null,
      error: err?.message || 'Network request failed',
      fromDb: false,
    };
  }
}

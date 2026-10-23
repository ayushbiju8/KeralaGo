/**
 * KeralaGO API Client
 * Configured to connect to the local Django backend with automatic fallback.
 */

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  fromDb: boolean;
}

export async function apiGet<T>(endpoint: string, fallbackData: T): Promise<ApiResponse<T>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Accept': 'application/json',
      },
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

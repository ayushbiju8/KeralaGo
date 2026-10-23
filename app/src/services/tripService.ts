/**
 * KeralaGO Core Services: Connects Expo screens directly to the local Django/PostgreSQL database
 */

import { apiGet, apiPost, apiPatch, apiDelete } from './apiClient';
import { customerData } from '../data';

export interface BackendTripItem {
  id: string;
  db_id?: string;
  timeAgo: string;
  pickup: string;
  dropoff: string;
  fare: string;
  status: 'completed' | 'cancelled';
  vehicleType: string;
  driverName: string;
  distance: string;
  duration: string;
  driverRating?: number;
  carPlate?: string;
  paymentMethod?: string;
}

export interface CustomerDashboardResponse {
  profile: any;
  wallet: any;
  savedLocations: any[];
  categories: any[];
  trips: BackendTripItem[];
  source: string;
}

export async function fetchCustomerTrips(status: 'all' | 'completed' | 'cancelled' = 'all'): Promise<{ trips: BackendTripItem[]; isLiveDb: boolean }> {
  const result = await apiGet<BackendTripItem[]>(`/customer/trips/?status=${status}`, customerData.tripsHistory as BackendTripItem[]);
  return {
    trips: result.data || (customerData.tripsHistory as BackendTripItem[]),
    isLiveDb: result.fromDb,
  };
}

export async function fetchCustomerDashboard(): Promise<{ data: CustomerDashboardResponse | null; isLiveDb: boolean }> {
  const fallback: CustomerDashboardResponse = {
    profile: customerData.customerProfile,
    wallet: customerData.walletData,
    savedLocations: customerData.savedLocations,
    categories: customerData.serviceCategories,
    trips: customerData.tripsHistory as BackendTripItem[],
    source: 'Local Fallback',
  };
  const result = await apiGet<CustomerDashboardResponse>('/customer/dashboard/', fallback);
  return {
    data: result.data || fallback,
    isLiveDb: result.fromDb,
  };
}

export async function updateCustomerProfile(payload: { name?: string; email?: string; quietRide?: boolean; acPreferred?: boolean; cashlessOnly?: boolean }) {
  return apiPatch('/customer/profile/update/', payload);
}

export async function topUpWallet(amount: number) {
  return apiPost<{ success: boolean; new_balance: number; message: string }>('/customer/wallet/topup/', { amount });
}

export async function estimateFares(pickupLat: number, pickupLng: number, destLat: number, destLng: number) {
  return apiPost<{ distanceKm: number; durationMinutes: number; estimates: any[] }>('/rides/estimate-fare/', {
    pickup_lat: pickupLat,
    pickup_lng: pickupLng,
    dest_lat: destLat,
    dest_lng: destLng,
  });
}

export async function applyCoupon(code: string, fare: number) {
  return apiPost<{ valid: boolean; code: string; title: string; discount: number; finalFare: number; message: string }>('/rides/apply-coupon/', {
    code,
    fare,
  });
}

export async function requestRide(payload: {
  category: string;
  pickup: { title?: string; address: string; lat: number; lng: number };
  destination: { title?: string; address: string; lat: number; lng: number };
  fare: number;
}) {
  return apiPost<any>('/rides/request/', payload);
}

export async function fetchRideDetail(rideId: string) {
  return apiGet<any>(`/rides/${rideId}/`, null);
}

export async function cancelRide(rideId: string, reason: string) {
  return apiPost<any>(`/rides/${rideId}/cancel/`, { reason });
}

export async function submitReview(rating: number, comment: string) {
  return apiPost<any>('/reviews/submit/', { rating, comment });
}

export async function triggerSOS(latitude: number, longitude: number, message?: string) {
  return apiPost<any>('/support/sos/', { latitude, longitude, message });
}

export async function submitSupportTicket(subject: string, category: string, description: string) {
  return apiPost<any>('/support/ticket/', { subject, category, description });
}

export async function fetchDriverDashboard() {
  return apiGet<any>('/driver/dashboard/', null);
}

export async function toggleDriverDuty() {
  return apiPost<{ success: boolean; isOnline: boolean; status: string }>('/driver/duty/toggle/', {});
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await apiGet<{ status: string }>('/health/', { status: 'offline' });
    return res.fromDb && res.data?.status === 'online';
  } catch {
    return false;
  }
}

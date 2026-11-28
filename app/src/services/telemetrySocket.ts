/**
 * KeralaGo Real-Time Telemetry & Live Dispatch WebSocket Client
 *
 * Connects Expo frontend to the Node.js Telemetry Engine (Socket.IO).
 * Handles:
 * - Real-time driver GPS coordinate streaming and bearing interpolation.
 * - Live ride room channel subscriptions (ride:<rideId>).
 * - Instant dispatch notifications for drivers (driver:ride_offer).
 * - Immediate ride status synchronization (ACCEPTED, DRIVER_ARRIVED, IN_PROGRESS, COMPLETED).
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { io, Socket } from 'socket.io-client';

function getTelemetryUrl(): string {
  if (Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_TELEMETRY_URL || 'http://localhost:5001';
  }

  const envUrl = process.env.EXPO_PUBLIC_TELEMETRY_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).expoGoConfig?.debuggerHost;
  const ip = hostUri ? hostUri.split(':')[0] : null;

  if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
    return `http://${ip}:5001`;
  }

  return 'http://10.179.113.29:5001';
}

export const TELEMETRY_SERVER_URL = getTelemetryUrl();

export interface DriverCoordinate {
  latitude: number;
  longitude: number;
}

export interface DriverLocationUpdate {
  driverId: string;
  rideId?: string;
  coordinate: DriverCoordinate;
  rawCoordinate?: DriverCoordinate;
  bearing?: number;
  speed?: number;
  isSnapped?: boolean;
  timestamp: number;
  interpolationDurationMs?: number;
}

export interface RideStatusUpdate {
  rideId: string;
  status: 'REQUESTED' | 'ACCEPTED' | 'DRIVER_ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  driverId?: string;
  driverName?: string;
  timestamp?: number;
}

export interface IncomingRideOffer {
  rideId: string;
  displayId?: string;
  driverId?: string;
  pickup: {
    title?: string;
    address: string;
    lat: number;
    lng: number;
  };
  destination: {
    title?: string;
    address: string;
    lat: number;
    lng: number;
  };
  fare: number;
  category: string;
  distanceKm: number;
  durationMins: number;
  otpPin?: string;
  etaMinutes?: number;
}

class TelemetrySocketManager {
  private socket: Socket | null = null;
  private currentRideId: string | null = null;
  private isConnected = false;

  public connect(): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (!this.socket) {
      this.socket = io(TELEMETRY_SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1500,
        timeout: 5000,
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log(`[TelemetryClient] Connected to ${TELEMETRY_SERVER_URL} (Socket ID: ${this.socket?.id})`);

        if (this.currentRideId) {
          this.socket?.emit('ride:join', { rideId: this.currentRideId, role: 'customer' });
        }
      });

      this.socket.on('connect_error', (err) => {
        this.isConnected = false;
        // Tolerate offline dev telemetry server gracefully
        console.warn(`[TelemetryClient] Connection note: ${err.message}`);
      });

      this.socket.on('disconnect', (reason) => {
        this.isConnected = false;
        console.log(`[TelemetryClient] Disconnected: ${reason}`);
      });
    } else if (!this.socket.connected) {
      this.socket.connect();
    }

    return this.socket;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentRideId = null;
    }
  }

  /**
   * Join dedicated channel for a specific ride
   */
  public joinRide(rideId: string, role: 'customer' | 'driver' = 'customer'): void {
    this.currentRideId = rideId;
    const s = this.connect();
    s.emit('ride:join', { rideId, role });
    console.log(`[TelemetryClient] Joining ride channel: ride:${rideId} (${role})`);
  }

  /**
   * Leave dedicated ride channel
   */
  public leaveRide(rideId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('ride:leave', { rideId });
    }
    if (this.currentRideId === rideId) {
      this.currentRideId = null;
    }
  }

  /**
   * Listen for real-time driver coordinates
   */
  public onDriverLocationUpdate(callback: (update: DriverLocationUpdate) => void): () => void {
    const s = this.connect();
    s.on('driver:location_update', callback);
    return () => {
      s.off('driver:location_update', callback);
    };
  }

  /**
   * Listen for live ride status changes
   */
  public onRideStatusUpdate(callback: (update: RideStatusUpdate) => void): () => void {
    const s = this.connect();
    s.on('ride:status_update', callback);
    s.on('ride:completed', (data: any) => {
      callback({ rideId: data.rideId, status: 'COMPLETED' });
    });
    return () => {
      s.off('ride:status_update', callback);
      s.off('ride:completed');
    };
  }

  /**
   * Driver: Register active duty channel
   */
  public registerDriver(driverId: string): void {
    const s = this.connect();
    s.emit('driver:register', { driverId });
  }

  /**
   * Driver: Ping raw GPS coordinates to telemetry pipeline
   */
  public sendDriverPing(payload: {
    driverId: string;
    rideId?: string;
    latitude: number;
    longitude: number;
    bearing?: number;
    speed?: number;
  }): void {
    const s = this.connect();
    s.emit('driver:ping', {
      ...payload,
      timestamp: Date.now(),
    });
  }

  /**
   * Driver: Listen for incoming dispatch ride offers
   */
  public onIncomingRideOffer(callback: (offer: IncomingRideOffer) => void): () => void {
    const s = this.connect();
    s.on('driver:ride_offer', callback);
    return () => {
      s.off('driver:ride_offer', callback);
    };
  }

  /**
   * Driver: Accept a ride offer
   */
  public acceptRideOffer(rideId: string, driverId: string, driverName?: string): void {
    const s = this.connect();
    s.emit('driver:accept', { rideId, driverId, driverName });
  }

  /**
   * Driver: Decline a ride offer
   */
  public declineRideOffer(rideId: string, driverId: string): void {
    const s = this.connect();
    s.emit('driver:decline', { rideId, driverId });
  }

  /**
   * Listen for real-time ride chat messages
   */
  public onRideChatMessage(callback: (payload: { rideId: string; message: any }) => void): () => void {
    const s = this.connect();
    s.on('ride:chat_message', callback);
    return () => {
      s.off('ride:chat_message', callback);
    };
  }

  /**
   * Send a chat message over WebSocket
   */
  public sendRideChatMessage(rideId: string, message: any): void {
    const s = this.connect();
    s.emit('ride:send_chat', { rideId, message });
  }
}

export const telemetrySocket = new TelemetrySocketManager();
export default telemetrySocket;

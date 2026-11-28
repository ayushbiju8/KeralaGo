/**
 * GIS & Telemetry Mathematical Utilities
 *
 * Provides linear interpolation (lerp), spherical heading (bearing),
 * and bounding box computations for smooth vehicle animation without teleportation.
 */

import { LatLng } from './decodePolyline';

/**
 * Standard 1D Linear Interpolation (LERP) formula:
 * P(t) = a + t * (b - a)
 *
 * @param a Start value at t = 0
 * @param b Target value at t = 1
 * @param t Progress factor normalized in [0, 1]
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * 2D Linear Interpolation between two geographic coordinates.
 * Over small timeframes (e.g. 3 seconds), Euclidean LERP closely approximates
 * spherical geodesics on earth with sub-centimeter discrepancy.
 */
export function lerpCoordinate(start: LatLng, end: LatLng, t: number): LatLng {
  return {
    latitude: lerp(start.latitude, end.latitude, t),
    longitude: lerp(start.longitude, end.longitude, t),
  };
}

/**
 * Calculates initial spherical forward azimuth (bearing) from coordinate A to coordinate B.
 *
 * Formula derived from spherical trigonometry:
 *   Δλ = (lon2 - lon1) in radians
 *   φ1 = lat1 in radians, φ2 = lat2 in radians
 *   y = sin(Δλ) * cos(φ2)
 *   x = cos(φ1) * sin(φ2) - sin(φ1) * cos(φ2) * cos(Δλ)
 *   θ = atan2(y, x) converted to degrees [0..360)
 *
 * @param from Starting coordinate
 * @param to Destination coordinate
 * @returns Heading angle in degrees [0, 360) where 0 = True North, 90 = East
 */
export function calculateBearing(from: LatLng, to: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const dLng = toRad(to.longitude - from.longitude);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  let bearing = toDeg(Math.atan2(y, x));
  bearing = (bearing + 360) % 360; // Normalize into [0, 360)

  return bearing;
}

/**
 * Computes bounding box region with auto-padding for MapView camera fitting.
 */
export function computeBoundingRegion(coords: LatLng[], paddingFactor = 1.3) {
  if (coords.length === 0) {
    return {
      latitude: 9.9816,
      longitude: 76.2999,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }

  let minLat = coords[0].latitude;
  let maxLat = coords[0].latitude;
  let minLng = coords[0].longitude;
  let maxLng = coords[0].longitude;

  for (const c of coords) {
    if (c.latitude < minLat) minLat = c.latitude;
    if (c.latitude > maxLat) maxLat = c.latitude;
    if (c.longitude < minLng) minLng = c.longitude;
    if (c.longitude > maxLng) maxLng = c.longitude;
  }

  const midLat = (minLat + maxLat) / 2;
  const midLng = (minLng + maxLng) / 2;
  const latDelta = Math.max((maxLat - minLat) * paddingFactor, 0.015);
  const lngDelta = Math.max((maxLng - minLng) * paddingFactor, 0.015);

  return {
    latitude: midLat,
    longitude: midLng,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

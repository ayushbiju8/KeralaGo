/**
 * Service: Google Routes API (REST v2)
 *
 * Computes optimal driving route with real-time traffic awareness.
 * Endpoint: POST https://routes.googleapis.com/directions/v2:computeRoutes
 */

const axios = require('axios');

/**
 * Calculates a route between pickup and dropoff coordinates using the new Google Routes API v2.
 *
 * @param {Object} pickup - { latitude: number, longitude: number }
 * @param {Object} dropoff - { latitude: number, longitude: number }
 * @returns {Promise<{
 *   encodedPolyline: string,
 *   distanceKm: number,
 *   durationSeconds: number,
 *   etaMinutes: number,
 *   formattedDuration: string
 * }>}
 */
async function computeDrivingRoute(pickup, dropoff) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    throw new Error('Missing GOOGLE_MAPS_API_KEY environment variable.');
  }

  const endpoint = 'https://routes.googleapis.com/directions/v2:computeRoutes';

  // Request payload formatted for Google Routes API v2
  const requestBody = {
    origin: {
      location: {
        latLng: {
          latitude: pickup.latitude,
          longitude: pickup.longitude,
        },
      },
    },
    destination: {
      location: {
        latLng: {
          latitude: dropoff.latitude,
          longitude: dropoff.longitude,
        },
      },
    },
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_AWARE',
    computeAlternativeRoutes: false,
    routeModifiers: {
      avoidTolls: false,
      avoidHighways: false,
      avoidFerries: false,
    },
    languageCode: 'en-US',
    units: 'METRIC',
  };

  // Google Routes API requires explicit FieldMask headers to specify requested fields
  const headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': apiKey,
    'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
  };

  try {
    const response = await axios.post(endpoint, requestBody, { headers });

    if (!response.data.routes || response.data.routes.length === 0) {
      throw new Error('No route found between the specified coordinates.');
    }

    const route = response.data.routes[0];

    // Google returns duration as string ending in 's' (e.g. "725s")
    const durationSeconds = parseInt(route.duration.replace('s', ''), 10);
    const distanceMeters = route.distanceMeters;
    const distanceKm = Number((distanceMeters / 1000).toFixed(2));
    const etaMinutes = Math.ceil(durationSeconds / 60);

    return {
      encodedPolyline: route.polyline.encodedPolyline,
      distanceKm,
      durationSeconds,
      etaMinutes,
      formattedDuration: `${etaMinutes} min`,
    };
  } catch (error) {
    if (error.response) {
      throw new Error(`Google Routes API error: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

module.exports = {
  computeDrivingRoute,
};

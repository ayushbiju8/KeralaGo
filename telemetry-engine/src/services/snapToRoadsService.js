/**
 * Service: Google Snap to Roads API
 *
 * Smooths GPS drift by fitting raw coordinates to the geometry of actual road networks.
 * Endpoint: GET https://roads.googleapis.com/v1/snapToRoads
 */

const axios = require('axios');

// In-memory sliding buffer storing the last 5 coordinates per driver/ride
const driverCoordinateBuffers = new Map();

/**
 * Appends a raw coordinate to the driver's buffer (retaining max 5 items),
 * and snaps the sequence to the nearest road network using Google Snap to Roads API.
 *
 * @param {string} driverId - Unique identifier of the driver
 * @param {{ latitude: number, longitude: number, timestamp?: number }} rawCoord
 * @returns {Promise<{
 *   latitude: number,
 *   longitude: number,
 *   originalIndex?: number,
 *   placeId?: string,
 *   isSnapped: boolean
 * }>}
 */
async function snapDriverCoordinate(driverId, rawCoord) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!driverCoordinateBuffers.has(driverId)) {
    driverCoordinateBuffers.set(driverId, []);
  }

  const buffer = driverCoordinateBuffers.get(driverId);
  buffer.push(rawCoord);

  // Maintain sliding window of last 5 coordinates
  if (buffer.length > 5) {
    buffer.shift();
  }

  // If buffer doesn't have at least 2 points yet or API key is absent, return raw point as fallback
  if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE' || buffer.length < 2) {
    return {
      latitude: rawCoord.latitude,
      longitude: rawCoord.longitude,
      isSnapped: false,
    };
  }

  // Format pipe-delimited path: "lat1,lng1|lat2,lng2|..."
  const pathParam = buffer
    .map((point) => `${point.latitude},${point.longitude}`)
    .join('|');

  try {
    const url = 'https://roads.googleapis.com/v1/snapToRoads';
    const response = await axios.get(url, {
      params: {
        path: pathParam,
        interpolate: true, // Interpolates geometry to follow road curves
        key: apiKey,
      },
      timeout: 4000,
    });

    const snappedPoints = response.data.snappedPoints;

    if (!snappedPoints || snappedPoints.length === 0) {
      // Fallback to raw if no roads found nearby
      return {
        latitude: rawCoord.latitude,
        longitude: rawCoord.longitude,
        isSnapped: false,
      };
    }

    // Pick the most recent snapped point corresponding to the latest coordinate in the batch
    const latestSnapped = snappedPoints[snappedPoints.length - 1];

    return {
      latitude: latestSnapped.location.latitude,
      longitude: latestSnapped.location.longitude,
      originalIndex: latestSnapped.originalIndex,
      placeId: latestSnapped.placeId,
      isSnapped: true,
    };
  } catch (error) {
    console.warn(`[SnapToRoads] Error snapping driver ${driverId} GPS:`, error.message);
    // Graceful fallback to raw coordinate so telemetry never stalls
    return {
      latitude: rawCoord.latitude,
      longitude: rawCoord.longitude,
      isSnapped: false,
    };
  }
}

/**
 * Clears the historical sliding buffer when a ride ends or driver goes offline.
 * @param {string} driverId
 */
function clearDriverBuffer(driverId) {
  driverCoordinateBuffers.delete(driverId);
}

module.exports = {
  snapDriverCoordinate,
  clearDriverBuffer,
};

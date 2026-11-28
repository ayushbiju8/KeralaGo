/**
 * Controller: Route Calculation
 *
 * Handles HTTP requests to calculate optimal routes using Google Routes API v2.
 */

const { computeDrivingRoute } = require('../services/googleRoutesService');

/**
 * POST /api/routes/calculate
 *
 * Request Body:
 * {
 *   "pickup": { "latitude": 9.9816, "longitude": 76.2999 },
 *   "dropoff": { "latitude": 10.0261, "longitude": 76.3125 }
 * }
 */
async function calculateRoute(req, res) {
  try {
    const { pickup, dropoff } = req.body;

    // Strict coordinate validation
    if (
      !pickup ||
      typeof pickup.latitude !== 'number' ||
      typeof pickup.longitude !== 'number' ||
      !dropoff ||
      typeof dropoff.latitude !== 'number' ||
      typeof dropoff.longitude !== 'number'
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates. Expected { pickup: { latitude, longitude }, dropoff: { latitude, longitude } }',
      });
    }

    const routeData = await computeDrivingRoute(pickup, dropoff);

    return res.status(200).json({
      success: true,
      data: {
        etaMinutes: routeData.etaMinutes,
        durationSeconds: routeData.durationSeconds,
        formattedDuration: routeData.formattedDuration,
        distanceKm: routeData.distanceKm,
        encodedPolyline: routeData.encodedPolyline,
      },
    });
  } catch (error) {
    console.error('[RouteController] Error calculating route:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate route',
    });
  }
}

module.exports = {
  calculateRoute,
};

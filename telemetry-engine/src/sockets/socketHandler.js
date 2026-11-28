/**
 * Socket.IO Real-Time Telemetry Handler
 *
 * Receives driver GPS pings, applies Google Snap-to-Roads filtering to eliminate
 * multi-path urban drift, and broadcasts smoothed coordinates to connected clients.
 */

const { snapDriverCoordinate, clearDriverBuffer } = require('../services/snapToRoadsService');

/**
 * Initializes telemetry socket listeners and rooms.
 *
 * @param {import('socket.io').Server} io
 */
function initTelemetrySockets(io) {
  io.on('connection', (socket) => {
    console.log(`[TelemetrySocket] Client connected: ${socket.id}`);

    /**
     * Customer or Driver joins a dedicated ride channel
     * Event: 'ride:join'
     * Payload: { rideId: string, role: 'customer' | 'driver' }
     */
    socket.on('ride:join', ({ rideId, role }) => {
      if (!rideId) return;
      const room = `ride:${rideId}`;
      socket.join(room);
      console.log(`[TelemetrySocket] Socket ${socket.id} (${role || 'user'}) joined ${room}`);
    });

    /**
     * Driver pings raw GPS coordinate every 3 seconds
     * Event: 'driver:ping'
     * Payload: {
     *   driverId: string,
     *   rideId: string,
     *   latitude: number,
     *   longitude: number,
     *   bearing?: number,
     *   speed?: number,
     *   timestamp?: number
     * }
     */
    socket.on('driver:ping', async (data) => {
      try {
        const { driverId, rideId, latitude, longitude, bearing = 0, speed = 0 } = data;

        if (!driverId || typeof latitude !== 'number' || typeof longitude !== 'number') {
          return socket.emit('error', { message: 'Invalid GPS ping payload' });
        }

        const now = Date.now();

        // Pass through Snap-to-Roads batching middleware
        const snapped = await snapDriverCoordinate(driverId, {
          latitude,
          longitude,
          timestamp: now,
        });

        const telemetryPayload = {
          driverId,
          rideId,
          coordinate: {
            latitude: snapped.latitude,
            longitude: snapped.longitude,
          },
          rawCoordinate: {
            latitude,
            longitude,
          },
          bearing,
          speed,
          isSnapped: snapped.isSnapped,
          timestamp: now,
          interpolationDurationMs: 3000, // Hint to frontend for smooth 3-second lerp
        };

        // Broadcast to specific ride room if rideId is present, or broadcast globally
        if (rideId) {
          io.to(`ride:${rideId}`).emit('driver:location_update', telemetryPayload);
        } else {
          io.emit('driver:location_update', telemetryPayload);
        }
      } catch (err) {
        console.error('[TelemetrySocket] Error processing driver ping:', err);
      }
    });

    /**
     * Clean up driver sliding buffer upon ride completion or driver disconnect
     */
    socket.on('ride:complete', ({ driverId, rideId }) => {
      if (driverId) {
        clearDriverBuffer(driverId);
      }
      if (rideId) {
        io.to(`ride:${rideId}`).emit('ride:completed', { rideId });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[TelemetrySocket] Client disconnected: ${socket.id}`);
    });
  });
}

module.exports = {
  initTelemetrySockets,
};

/**
 * Driver Telemetry Simulator
 *
 * Emulates a real driver app pinging raw GPS coordinates every 3 seconds
 * with deliberate GPS jitter to test the Snap to Roads filtering and live telemetry.
 */

const { io } = require('socket.io-client');

const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || 'http://localhost:5001';
const socket = io(SOCKET_SERVER_URL, { transports: ['websocket'] });

const RIDE_ID = 'ride_kl_07_9842';
const DRIVER_ID = 'driver_shyam_882';

// Simulated waypoint path along Marine Drive & MG Road, Kochi, Kerala
const ROUTE_WAYPOINTS = [
  { latitude: 9.9816, longitude: 76.2762 },
  { latitude: 9.9835, longitude: 76.2781 },
  { latitude: 9.9858, longitude: 76.2810 },
  { latitude: 9.9882, longitude: 76.2845 },
  { latitude: 9.9910, longitude: 76.2882 },
  { latitude: 9.9945, longitude: 76.2920 },
  { latitude: 9.9972, longitude: 76.2954 },
  { latitude: 10.0011, longitude: 76.2998 },
  { latitude: 10.0054, longitude: 76.3042 },
  { latitude: 10.0098, longitude: 76.3090 },
];

let waypointIndex = 0;

socket.on('connect', () => {
  console.log(`[DriverSimulator] Connected to telemetry server at ${SOCKET_SERVER_URL}`);
  socket.emit('ride:join', { rideId: RIDE_ID, role: 'driver' });

  // Ping every 3 seconds
  setInterval(() => {
    const current = ROUTE_WAYPOINTS[waypointIndex];
    const next = ROUTE_WAYPOINTS[(waypointIndex + 1) % ROUTE_WAYPOINTS.length];

    // Introduce artificial GPS multi-path jitter (±0.00015 degrees ~ 15 meters)
    const jitterLat = (Math.random() - 0.5) * 0.0003;
    const jitterLng = (Math.random() - 0.5) * 0.0003;

    // Calculate heading/bearing in degrees
    const y = Math.sin((next.longitude - current.longitude) * (Math.PI / 180)) * Math.cos(next.latitude * (Math.PI / 180));
    const x =
      Math.cos(current.latitude * (Math.PI / 180)) * Math.sin(next.latitude * (Math.PI / 180)) -
      Math.sin(current.latitude * (Math.PI / 180)) *
        Math.cos(next.latitude * (Math.PI / 180)) *
        Math.cos((next.longitude - current.longitude) * (Math.PI / 180));
    const bearing = (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;

    const payload = {
      driverId: DRIVER_ID,
      rideId: RIDE_ID,
      latitude: current.latitude + jitterLat,
      longitude: current.longitude + jitterLng,
      bearing: Math.round(bearing),
      speed: Math.round(35 + Math.random() * 10), // km/h
      timestamp: Date.now(),
    };

    console.log(`[DriverSimulator] Sending ping #${waypointIndex + 1}:`, {
      lat: payload.latitude.toFixed(6),
      lng: payload.longitude.toFixed(6),
      bearing: `${payload.bearing}°`,
    });

    socket.emit('driver:ping', payload);

    waypointIndex = (waypointIndex + 1) % ROUTE_WAYPOINTS.length;
  }, 3000);
});

socket.on('driver:location_update', (update) => {
  console.log(`[DriverSimulator] Broadcast received back:`, {
    snapped: update.isSnapped,
    lat: update.coordinate.latitude.toFixed(6),
    lng: update.coordinate.longitude.toFixed(6),
  });
});

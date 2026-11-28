/**
 * KeralaGo Live Telemetry & Routing Engine Server
 *
 * Tech Stack: Express.js + Socket.IO + Google Maps Platform APIs
 */

require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const { calculateRoute } = require('./controllers/routeController');
const { initTelemetrySockets } = require('./sockets/socketHandler');

const app = express();
const server = http.createServer(app);

// Configure CORS and JSON body parser
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json());

// Initialize Socket.io with WebSocket transports
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// Setup Real-time Telemetry WebSockets
initTelemetrySockets(io);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'KeralaGo Telemetry & Routing Engine',
  });
});

// Phase 2: Route Calculation Endpoint
app.post('/api/routes/calculate', calculateRoute);

// Real-Time Dispatch Endpoint (Called by Django backend upon ride request)
app.post('/api/rides/dispatch', (req, res) => {
  const payload = req.body;
  console.log(`[TelemetryServer] Dispatched ride offer:`, payload.displayId || payload.rideId);

  // Broadcast dispatch offer to all connected drivers or specific driver room
  if (payload.driverId) {
    io.to(`driver:${payload.driverId}`).emit('driver:ride_offer', payload);
  }
  io.emit('driver:ride_offer', payload);

  res.json({ success: true, message: 'Ride dispatched to driver partner pool' });
});

// Real-Time Ride Status Sync Endpoint
app.post('/api/rides/status-update', (req, res) => {
  const { rideId, status, driverId, driverName } = req.body;
  console.log(`[TelemetryServer] Ride ${rideId} status changed to ${status}`);

  if (rideId) {
    io.to(`ride:${rideId}`).emit('ride:status_update', {
      rideId,
      status,
      driverId,
      driverName,
      timestamp: Date.now(),
    });
  }

  res.json({ success: true, message: 'Status update broadcasted' });
});

// Real-Time Ride Chat Broadcast Endpoint (Called by Django backend)
app.post('/api/rides/chat', (req, res) => {
  const { rideId, message } = req.body;
  if (rideId && message) {
    io.to(`ride:${rideId}`).emit('ride:chat_message', { rideId, message });
  }
  res.json({ success: true, message: 'Chat message broadcasted' });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log('========================================================');
  console.log(`🚀 KeralaGo Telemetry Engine running on port ${PORT}`);
  console.log(`📍 Route API: POST http://localhost:${PORT}/api/routes/calculate`);
  console.log(`📡 Socket.io: ws://localhost:${PORT}`);
  console.log('========================================================');
});

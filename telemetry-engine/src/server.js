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

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log('========================================================');
  console.log(`🚀 KeralaGo Telemetry Engine running on port ${PORT}`);
  console.log(`📍 Route API: POST http://localhost:${PORT}/api/routes/calculate`);
  console.log(`📡 Socket.io: ws://localhost:${PORT}`);
  console.log('========================================================');
});

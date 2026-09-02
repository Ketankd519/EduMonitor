const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { registerClassSocket } = require('../sockets/classSocket');
const { registerLiveClassSocket } = require('../sockets/liveClassSocket');

/**
 * Initializes Socket.IO on top of the given HTTP server.
 * Every socket connection must present a valid JWT (same token used for REST auth)
 * via the `auth.token` handshake field. Unauthenticated sockets are rejected.
 *
 * Room conventions:
 *   class:<classId>        - members of a classroom currently viewing it (live:class-started, etc.)
 *   live:<liveClassId>     - participants of a specific live class session (WebRTC signaling)
 *   user:<userId>          - private channel for a single user's notifications
 */
function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Tracks live-class participants in memory: Map<liveClassId, Map<socketId, info>>.
  // Deliberately in-memory, not persisted — it's ephemeral presence data,
  // not the source of truth for who attended (that's Phase 9/10's
  // MonitoringEvent/Attendance data, derived from join/leave events).
  io.liveRooms = new Map();

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch the full user doc (not just the JWT payload) so socket.user
      // has the same shape as req.user in REST controllers — needed by
      // checkClassAccess and for sharing fullName/avatarUrl with peers
      // during live-class signaling.
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User no longer exists'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: user=${socket.user._id} role=${socket.user.role}`);

    // Every authenticated user automatically joins their private notification room
    socket.join(`user:${socket.user._id}`);

    registerClassSocket(io, socket);
    registerLiveClassSocket(io, socket);

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: user=${socket.user._id}`);
    });
  });

  return io;
}

module.exports = initSocket;

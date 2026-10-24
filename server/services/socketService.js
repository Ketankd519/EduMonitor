const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

let ioInstance = null;

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  ioInstance = io;

  // Track active room participants in-memory: { roomID: Array<{ socketId, userId, name, role, micActive, videoActive }> }
  const roomUsers = {};

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] New WebRTC Client Connected: ${socket.id}`);

    // Automatically join user channel if token is passed during handshake
    const handshakeToken = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (handshakeToken) {
      try {
        const decoded = jwt.verify(handshakeToken, process.env.JWT_SECRET);
        if (decoded && decoded.id) {
          socket.userId = decoded.id;
          socket.join(`user:${decoded.id}`);
          console.log(`[Socket.IO] Authenticated socket ${socket.id} joined user:${decoded.id}`);
        }
      } catch (err) {
        // Token might be invalid or expired; fallback to explicit registration
      }
    }

    // Register user explicitly after connection or login
    socket.on('register-user', ({ userId, token }) => {
      let targetUserId = userId;
      const verifyToken = token || handshakeToken;
      if (verifyToken) {
        try {
          const decoded = jwt.verify(verifyToken, process.env.JWT_SECRET);
          if (decoded && decoded.id) {
            targetUserId = decoded.id;
          }
        } catch (e) {}
      }
      if (targetUserId) {
        socket.userId = targetUserId;
        socket.join(`user:${targetUserId}`);
        console.log(`[Socket.IO] Socket ${socket.id} registered into channel user:${targetUserId}`);
      }
    });

    // Join Live Classroom Socket Room
    socket.on('join-room', ({ roomId, user }) => {
      socket.join(roomId);

      if (!roomUsers[roomId]) {
        roomUsers[roomId] = [];
      }

      // Avoid duplicate socket registrations
      const existingUserIndex = roomUsers[roomId].findIndex(u => u.socketId === socket.id);
      const participantData = {
        socketId: socket.id,
        userId: user._id || user.id,
        name: user.name || 'Participant',
        role: user.role,
        micActive: user.micActive !== undefined ? user.micActive : true,
        videoActive: user.videoActive !== undefined ? user.videoActive : true
      };

      if (existingUserIndex === -1) {
        roomUsers[roomId].push(participantData);
      } else {
        roomUsers[roomId][existingUserIndex] = participantData;
      }

      console.log(`[Socket.IO] User '${participantData.name}' joined room '${roomId}'`);

      // Broadcast list of existing room participants to newly joined user
      const participantsInRoom = roomUsers[roomId].filter(u => u.socketId !== socket.id);
      socket.emit('all-participants', participantsInRoom);

      // Notify existing peers in room about new user
      socket.to(roomId).emit('user-joined', participantData);
    });

    // Media state toggles (mic/camera on/off)
    socket.on('toggle-media', ({ roomId, micActive, videoActive }) => {
      if (roomUsers[roomId]) {
        const userEntry = roomUsers[roomId].find(u => u.socketId === socket.id);
        if (userEntry) {
          if (micActive !== undefined) userEntry.micActive = micActive;
          if (videoActive !== undefined) userEntry.videoActive = videoActive;
        }
      }

      socket.to(roomId).emit('user-media-toggle', {
        socketId: socket.id,
        micActive,
        videoActive
      });
    });

    // Leave room explicitly (Student/Teacher leaving session)
    socket.on('leave-room', ({ roomId }) => {
      socket.leave(roomId);
      if (roomUsers[roomId]) {
        roomUsers[roomId] = roomUsers[roomId].filter(u => u.socketId !== socket.id);
        io.to(roomId).emit('user-left', { socketId: socket.id });
        if (roomUsers[roomId].length === 0) {
          delete roomUsers[roomId];
        }
      }
      console.log(`[Socket.IO] Client ${socket.id} left room ${roomId}`);
    });

    // End session (broadcast from teacher to students in the room)
    socket.on('end-session', ({ roomId }) => {
      socket.to(roomId).emit('session-ended', {
        classId: roomId,
        message: 'The teacher has ended this session.'
      });
      delete roomUsers[roomId];
      console.log(`[Socket.IO] Teacher ended session for room ${roomId}`);
    });

    // WebRTC Signaling Relay Protocols
    socket.on('webrtc-offer', ({ targetSocketId, offer, callerUser }) => {
      io.to(targetSocketId).emit('webrtc-offer', {
        callerSocketId: socket.id,
        offer,
        callerUser
      });
    });

    socket.on('webrtc-answer', ({ targetSocketId, answer }) => {
      io.to(targetSocketId).emit('webrtc-answer', {
        responderSocketId: socket.id,
        answer
      });
    });

    socket.on('webrtc-ice-candidate', ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit('webrtc-ice-candidate', {
        senderSocketId: socket.id,
        candidate
      });
    });

    // In-room Chat or Broadcast Notification
    socket.on('send-message', ({ roomId, message }) => {
      io.to(roomId).emit('receive-message', message);
    });

    // Peer Disconnection & Cleaning Up
    socket.on('disconnecting', () => {
      const rooms = Array.from(socket.rooms);
      rooms.forEach((roomId) => {
        if (roomUsers[roomId]) {
          roomUsers[roomId] = roomUsers[roomId].filter(u => u.socketId !== socket.id);
          io.to(roomId).emit('user-left', { socketId: socket.id });
          if (roomUsers[roomId].length === 0) {
            delete roomUsers[roomId];
          }
        }
      });
      console.log(`[Socket.IO] Client Disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => ioInstance;

module.exports = initializeSocket;
module.exports.getIO = getIO;

const LiveClass = require('../models/LiveClass');
const { checkClassAccess } = require('../middleware/classAccessMiddleware');
const { clearStudentSession } = require('../services/attentionService');

/**
 * Registers WebRTC signaling handlers for one connected socket.
 *
 * The server NEVER sees audio/video/screen-share media — only SDP offers/
 * answers and ICE candidates, relayed verbatim between the two peers that
 * negotiated them. Actual media flows browser-to-browser (mesh topology:
 * each participant connects directly to every other participant).
 *
 * io.liveRooms: Map<liveClassId, Map<socketId, participantInfo>> tracks
 * who's currently in each live session, for building the initial
 * participant list a new joiner needs before it can start calling peers.
 */
function registerLiveClassSocket(io, socket) {
  const participantInfoFor = (socketId) => ({
    socketId,
    userId: socket.user._id.toString(),
    fullName: socket.user.fullName,
    role: socket.user.role,
    avatarUrl: socket.user.avatarUrl || '',
    camOn: true,
    micOn: true,
  });

  socket.on('live:join', async ({ liveClassId }, callback) => {
    try {
      if (!liveClassId) return callback?.({ ok: false, message: 'liveClassId is required' });

      const liveClass = await LiveClass.findById(liveClassId);
      if (!liveClass || liveClass.status !== 'active') {
        return callback?.({ ok: false, message: 'This live class is not active' });
      }

      const { isMember } = await checkClassAccess(liveClass.class, socket.user);
      if (!isMember) {
        return callback?.({ ok: false, message: 'You do not have access to this class' });
      }

      const roomKey = `live:${liveClassId}`;
      socket.join(roomKey);

      if (!io.liveRooms.has(liveClassId)) {
        io.liveRooms.set(liveClassId, new Map());
      }
      const room = io.liveRooms.get(liveClassId);

      // Send the joining socket everyone already present, BEFORE adding
      // itself — the new joiner initiates the offer to each existing
      // participant, avoiding a double-offer race.
      callback?.({ ok: true, participants: Array.from(room.values()) });

      const myInfo = participantInfoFor(socket.id);
      room.set(socket.id, myInfo);

      socket.to(roomKey).emit('live:user-joined', myInfo);
    } catch (err) {
      callback?.({ ok: false, message: 'Could not join the live class' });
    }
  });

  socket.on('live:leave', ({ liveClassId }) => {
    leaveLiveRoom(io, socket, liveClassId);
  });

  socket.on('live:offer', ({ liveClassId, targetSocketId, sdp }) => {
    if (!targetSocketId || !sdp) return;
    io.to(targetSocketId).emit('live:offer', { fromSocketId: socket.id, sdp });
  });

  socket.on('live:answer', ({ targetSocketId, sdp }) => {
    if (!targetSocketId || !sdp) return;
    io.to(targetSocketId).emit('live:answer', { fromSocketId: socket.id, sdp });
  });

  socket.on('live:ice-candidate', ({ targetSocketId, candidate }) => {
    if (!targetSocketId || !candidate) return;
    io.to(targetSocketId).emit('live:ice-candidate', { fromSocketId: socket.id, candidate });
  });

  socket.on('live:toggle-media', ({ liveClassId, camOn, micOn }) => {
    const room = io.liveRooms.get(liveClassId);
    if (!room || !room.has(socket.id)) return;

    const info = room.get(socket.id);
    if (camOn !== undefined) info.camOn = camOn;
    if (micOn !== undefined) info.micOn = micOn;

    socket.to(`live:${liveClassId}`).emit('live:media-state', { socketId: socket.id, camOn: info.camOn, micOn: info.micOn });
  });

  socket.on('disconnect', () => {
    // Clean up any live rooms this socket was part of — a closed tab or
    // dropped connection shouldn't leave a ghost participant behind.
    for (const [liveClassId, room] of io.liveRooms.entries()) {
      if (room.has(socket.id)) {
        leaveLiveRoom(io, socket, liveClassId);
      }
    }
  });
}

function leaveLiveRoom(io, socket, liveClassId) {
  if (!liveClassId) return;
  const roomKey = `live:${liveClassId}`;
  socket.leave(roomKey);

  const room = io.liveRooms.get(liveClassId);
  if (room) {
    room.delete(socket.id);
    if (room.size === 0) io.liveRooms.delete(liveClassId);
  }

  if (socket.user?.role === 'student') {
    clearStudentSession(liveClassId, socket.user._id.toString());
  }

  socket.to(roomKey).emit('live:user-left', { socketId: socket.id });
}

module.exports = { registerLiveClassSocket };

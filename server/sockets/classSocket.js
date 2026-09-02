const { checkClassAccess } = require('../middleware/classAccessMiddleware');

/**
 * Registers class-room join/leave handlers on a connected socket.
 * A client joins `class:<classId>` while it has a classroom page open, so
 * server-triggered broadcasts (e.g. "a live class just started") reach
 * only actual members of that class, not every connected socket.
 */
function registerClassSocket(io, socket) {
  socket.on('class:join', async ({ classId }, callback) => {
    try {
      if (!classId) return callback?.({ ok: false, message: 'classId is required' });

      const { isMember } = await checkClassAccess(classId, socket.user);
      if (!isMember) {
        return callback?.({ ok: false, message: 'You do not have access to this class' });
      }

      socket.join(`class:${classId}`);
      callback?.({ ok: true });
    } catch (err) {
      callback?.({ ok: false, message: 'Could not join class room' });
    }
  });

  socket.on('class:leave', ({ classId }) => {
    if (classId) socket.leave(`class:${classId}`);
  });
}

module.exports = { registerClassSocket };

const { verifyToken } = require('../utils/tokens');

function attachSockets(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next();
    try {
      socket.user = verifyToken(token);
    } catch (_error) {
      return next();
    }
    next();
  });

  io.on('connection', (socket) => {
    const hospitalId = socket.handshake.query.hospitalId;
    const queueId = socket.handshake.query.queueId;
    if (hospitalId) socket.join(`hospital:${hospitalId}`);
    if (queueId) socket.join(`queue:${queueId}`);
    if (socket.user?.id) socket.join(`user:${socket.user.id}`);

    socket.on('queue:subscribe', (id) => socket.join(`queue:${id}`));
    socket.on('hospital:subscribe', (id) => socket.join(`hospital:${id}`));
  });
}

module.exports = { attachSockets };

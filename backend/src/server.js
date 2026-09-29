const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const env = require('./config/env');
const { connectDb } = require('./config/db');
const { connectRedis } = require('./config/redis');
const { attachSockets } = require('./sockets');
const User = require('./models/User');
const { run: seed } = require('./seed');

async function start() {
  await connectDb();
  await connectRedis();
  if ((await User.countDocuments()) === 0) {
    await seed({ disconnect: false, resetFirst: false });
  }

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: env.clientOrigin, credentials: true },
  });
  attachSockets(io);
  app.set('io', io);

  server.listen(env.port, () => {
    console.log(`CareLink API listening on ${env.port}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});

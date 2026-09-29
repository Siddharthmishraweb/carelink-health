const Redis = require('ioredis');
const env = require('./env');

const memory = new Map();
let client = null;
let available = false;

function memoryStore() {
  return {
    async get(key) {
      const row = memory.get(key);
      if (!row) return null;
      if (row.exp && Date.now() > row.exp) {
        memory.delete(key);
        return null;
      }
      return row.value;
    },
    async set(key, value, mode, ttl) {
      const exp = mode === 'EX' && ttl ? Date.now() + ttl * 1000 : null;
      memory.set(key, { value, exp });
      return 'OK';
    },
    async del(key) {
      memory.delete(key);
      return 1;
    },
    async incr(key) {
      const current = Number((await this.get(key)) || 0) + 1;
      await this.set(key, String(current));
      return current;
    },
    async expire(key, ttl) {
      const row = memory.get(key);
      if (!row) return 0;
      row.exp = Date.now() + ttl * 1000;
      return 1;
    },
  };
}

async function connectRedis() {
  try {
    const redis = new Redis(env.redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: () => null,
      reconnectOnError: () => false,
    });
    redis.on('error', () => {});
    await redis.connect();
    client = redis;
    available = true;
    console.log('Redis connected');
    return client;
  } catch (error) {
    console.warn('Redis unavailable, using in-memory cache:', error.message);
    client = memoryStore();
    available = false;
    return client;
  }
}

function getRedis() {
  if (!client) return memoryStore();
  return client;
}

function isRedisAvailable() {
  return available;
}

module.exports = { connectRedis, getRedis, isRedisAvailable };

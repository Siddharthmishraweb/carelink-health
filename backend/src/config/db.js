const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const env = require('./env');

async function connectDb() {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 2500 });
    console.log('MongoDB connected');
    return;
  } catch (error) {
    console.warn('MongoDB not reachable, starting local memory server:', error.message);
  }

  const { MongoMemoryServer } = require('mongodb-memory-server');
  const dbPath = path.join(__dirname, '../../.data/mongo');
  fs.mkdirSync(dbPath, { recursive: true });
  const mongod = await MongoMemoryServer.create({
    instance: { dbName: 'carelink', dbPath, storageEngine: 'wiredTiger' },
  });
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  console.log('MongoDB memory server connected');
}

module.exports = { connectDb };

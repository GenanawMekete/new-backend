const mongoose = require('mongoose');

async function up() {
  // Create indexes for games collection
  const collection = mongoose.connection.collection('games');
  
  await collection.createIndex({ gameId: 1 }, { unique: true });
  await collection.createIndex({ status: 1, scheduledStart: 1 });
  await collection.createIndex({ createdAt: 1 });
  await collection.createIndex({ type: 1, status: 1 });
  await collection.createIndex({ roomCode: 1 }, { sparse: true });
  
  console.log('✅ Games collection indexes created');
}

async function down() {
  await mongoose.connection.collection('games').drop();
  console.log('❌ Games collection dropped');
}

module.exports = { up, down };

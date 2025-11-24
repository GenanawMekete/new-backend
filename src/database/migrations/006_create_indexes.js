const mongoose = require('mongoose');
const logger = require('../../utils/logger');

async function run() {
  logger.info('Creating database indexes...');
  
  const db = mongoose.connection.db;
  
  // Player indexes
  await db.collection('players').createIndex({ telegramId: 1 }, { unique: true });
  await db.collection('players').createIndex({ telegramUsername: 1 });
  await db.collection('players').createIndex({ isOnline: 1 });
  await db.collection('players').createIndex({ coins: -1 });
  await db.collection('players').createIndex({ totalGames: -1 });
  await db.collection('players').createIndex({ gamesWon: -1 });
  await db.collection('players').createIndex({ createdAt: -1 });
  
  // Game indexes
  await db.collection('games').createIndex({ gameId: 1 }, { unique: true });
  await db.collection('games').createIndex({ status: 1 });
  await db.collection('games').createIndex({ room: 1 });
  await db.collection('games').createIndex({ startTime: 1 });
  await db.collection('games').createIndex({ 'players.player': 1 });
  await db.collection('games').createIndex({ createdAt: 1 });
  
  // Room indexes
  await db.collection('rooms').createIndex({ roomId: 1 }, { unique: true });
  await db.collection('rooms').createIndex({ status: 1 });
  await db.collection('rooms').createIndex({ 'config.type': 1 });
  await db.collection('rooms').createIndex({ createdAt: 1 });
  await db.collection('rooms').createIndex({ lastActivity: 1 });
  
  // BingoCard indexes
  await db.collection('bingocards').createIndex({ cardId: 1 }, { unique: true });
  await db.collection('bingocards').createIndex({ player: 1 });
  await db.collection('bingocards').createIndex({ game: 1 });
  await db.collection('bingocards').createIndex({ hasBingo: 1 });
  
  // Transaction indexes
  await db.collection('transactions').createIndex({ transactionId: 1 }, { unique: true });
  await db.collection('transactions').createIndex({ player: 1 });
  await db.collection('transactions').createIndex({ type: 1 });
  await db.collection('transactions').createIndex({ category: 1 });
  await db.collection('transactions').createIndex({ status: 1 });
  await db.collection('transactions').createIndex({ createdAt: -1 });
  await db.collection('transactions').createIndex({ player: 1, createdAt: -1 });
  await db.collection('transactions').createIndex({ relatedGame: 1 });
  
  logger.info('✅ All database indexes created successfully');
}

module.exports = {
  name: '006_create_indexes',
  run
};

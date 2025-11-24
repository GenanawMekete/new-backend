const mongoose = require('mongoose');
const logger = require('../../utils/logger');

async function run() {
  logger.info('Creating players collection...');
  
  const playerSchema = new mongoose.Schema({
    telegramId: { type: Number, required: true, unique: true },
    telegramUsername: { type: String, trim: true, lowercase: true },
    firstName: { type: String, required: true, trim: true, maxlength: 64 },
    lastName: { type: String, trim: true, maxlength: 64 },
    languageCode: { type: String, default: 'en' },
    coins: { type: Number, default: 100, min: 0 },
    totalGames: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    totalBingos: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    currentGame: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
    currentRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    isOnline: { type: Boolean, default: false },
    lastActive: { type: Date, default: Date.now },
    settings: {
      soundEnabled: { type: Boolean, default: true },
      vibrationEnabled: { type: Boolean, default: true },
      autoMarkNumbers: { type: Boolean, default: false },
      theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' }
    },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    referralsCount: { type: Number, default: 0 },
    authToken: String,
    tokenExpires: Date
  }, {
    timestamps: true
  });

  // Create the model
  mongoose.model('Player', playerSchema);
  
  logger.info('✅ Players collection schema created');
}

module.exports = {
  name: '001_create_players',
  run
};

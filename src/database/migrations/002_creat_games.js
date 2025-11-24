const mongoose = require('mongoose');
const logger = require('../../utils/logger');

async function run() {
  logger.info('Creating games collection...');
  
  const gameSchema = new mongoose.Schema({
    gameId: { type: String, required: true, unique: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    status: { 
      type: String, 
      enum: ['waiting', 'starting', 'in_progress', 'finished', 'cancelled'],
      default: 'waiting'
    },
    phase: {
      type: String,
      enum: ['lobby', 'playing', 'results'],
      default: 'lobby'
    },
    players: [{
      player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
      bingoCard: { type: mongoose.Schema.Types.ObjectId, ref: 'BingoCard', required: true },
      joinedAt: { type: Date, default: Date.now },
      isReady: { type: Boolean, default: false },
      hasClaimedBingo: { type: Boolean, default: false },
      claimTime: Date
    }],
    config: {
      duration: { type: Number, default: 30 },
      maxPlayers: { type: Number, default: 100 },
      minPlayers: { type: Number, default: 2 },
      entryFee: { type: Number, default: 0 },
      prizePool: { type: Number, default: 0 }
    },
    calledNumbers: [{
      number: { type: Number, required: true, min: 1, max: 75 },
      letter: { type: String, enum: ['B', 'I', 'N', 'G', 'O'], required: true },
      calledAt: { type: Date, default: Date.now },
      callOrder: { type: Number, required: true }
    }],
    currentNumber: {
      number: Number,
      letter: String,
      calledAt: Date
    },
    startTime: Date,
    endTime: Date,
    actualStartTime: Date,
    actualEndTime: Date,
    winners: [{
      player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
      bingoCard: { type: mongoose.Schema.Types.ObjectId, ref: 'BingoCard' },
      pattern: { type: String, enum: ['line', 'diagonal', 'four_corners'] },
      prize: Number,
      claimTime: Date,
      winningNumbers: [Number]
    }],
    stats: {
      totalCalls: { type: Number, default: 0 },
      averageClaimTime: Number,
      fastestBingo: Number
    }
  }, {
    timestamps: true
  });

  mongoose.model('Game', gameSchema);
  logger.info('✅ Games collection schema created');
}

module.exports = {
  name: '002_create_games',
  run
};

const mongoose = require('mongoose');
const logger = require('../../utils/logger');

async function run() {
  logger.info('Creating rooms collection...');
  
  const roomSchema = new mongoose.Schema({
    roomId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 50 },
    description: { type: String, trim: true, maxlength: 200 },
    config: {
      type: { type: String, enum: ['public', 'private', 'tournament'], default: 'public' },
      maxPlayers: { type: Number, default: 100, min: 2, max: 500 },
      entryFee: { type: Number, default: 0, min: 0 },
      prizePool: { type: Number, default: 0 },
      gameDuration: { type: Number, default: 30 },
      autoStart: { type: Boolean, default: true },
      minPlayersToStart: { type: Number, default: 2 }
    },
    status: {
      type: String,
      enum: ['waiting', 'starting', 'in_game', 'finished', 'closed'],
      default: 'waiting'
    },
    currentGame: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
    players: [{
      player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
      joinedAt: { type: Date, default: Date.now },
      isReady: { type: Boolean, default: false },
      isHost: { type: Boolean, default: false }
    }],
    stats: {
      totalGames: { type: Number, default: 0 },
      activePlayers: { type: Number, default: 0 },
      totalWinners: { type: Number, default: 0 },
      totalPrize: { type: Number, default: 0 }
    },
    password: String,
    allowedPlayers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    bannedPlayers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    tournament: {
      isTournament: { type: Boolean, default: false },
      maxRounds: Number,
      currentRound: { type: Number, default: 1 },
      winners: [{
        player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
        round: Number,
        position: Number,
        prize: Number
      }]
    },
    lastActivity: { type: Date, default: Date.now }
  }, {
    timestamps: true
  });

  mongoose.model('Room', roomSchema);
  logger.info('✅ Rooms collection schema created');
}

module.exports = {
  name: '003_create_rooms',
  run
};

const mongoose = require('mongoose');
const logger = require('../../utils/logger');

async function run() {
  logger.info('Creating transactions collection...');
  
  const transactionSchema = new mongoose.Schema({
    transactionId: { type: String, required: true, unique: true },
    reference: { type: String, unique: true, sparse: true },
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    relatedGame: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
    relatedRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    type: {
      type: String,
      enum: [
        'game_win',
        'game_entry',
        'purchase',
        'refund',
        'bonus',
        'referral',
        'level_up',
        'admin_adjustment'
      ],
      required: true
    },
    category: {
      type: String,
      enum: ['credit', 'debit'],
      required: true
    },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'coins' },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    description: { type: String, required: true, trim: true, maxlength: 200 },
    metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'completed'
    },
    processedAt: { type: Date, default: Date.now },
    paymentGateway: {
      name: String,
      transactionId: String,
      payload: mongoose.Schema.Types.Mixed
    }
  }, {
    timestamps: true
  });

  mongoose.model('Transaction', transactionSchema);
  logger.info('✅ Transactions collection schema created');
}

module.exports = {
  name: '005_create_transactions',
  run
};

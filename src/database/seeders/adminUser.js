const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const logger = require('../../utils/logger');

async function run() {
  logger.info('Creating admin user...');
  
  const Player = mongoose.model('Player');
  
  // Check if admin already exists
  const existingAdmin = await Player.findOne({ telegramId: 1 });
  if (existingAdmin) {
    logger.info('⏭️  Admin user already exists');
    return;
  }

  // Create admin user
  const adminUser = new Player({
    telegramId: 1,
    telegramUsername: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    coins: 10000,
    level: 100,
    experience: 10000,
    referralCode: 'ADMIN001'
  });

  await adminUser.save();
  
  logger.info('✅ Admin user created successfully');
  logger.info('   👤 Username: admin');
  logger.info('   💰 Coins: 10,000');
  logger.info('   🎯 Level: 100');
}

module.exports = {
  name: 'adminUser',
  run
};

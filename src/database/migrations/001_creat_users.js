const mongoose = require('mongoose');

async function up() {
  // Users collection will be created automatically by Mongoose
  console.log('✅ Users collection setup complete');
}

async function down() {
  await mongoose.connection.collection('users').drop();
  console.log('❌ Users collection dropped');
}

module.exports = { up, down };

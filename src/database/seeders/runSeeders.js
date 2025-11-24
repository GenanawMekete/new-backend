const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { MONGODB_URI, databaseConfig } = require('../../config/database');
const logger = require('../../utils/logger');

class SeederManager {
  constructor() {
    this.seeders = [];
    this.seederCollection = 'seeders';
  }

  async connect() {
    try {
      await mongoose.connect(MONGODB_URI, databaseConfig);
      logger.info('✅ Connected to MongoDB for seeding');
    } catch (error) {
      logger.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect() {
    await mongoose.disconnect();
    logger.info('🔌 Disconnected from MongoDB');
  }

  async registerSeeder(name, seederFunction) {
    this.seeders.push({ name, run: seederFunction });
  }

  async loadSeeders() {
    const seedersDir = __dirname;
    const files = fs.readdirSync(seedersDir)
      .filter(file => file.endsWith('.js') && file !== 'runSeeders.js')
      .sort();

    for (const file of files) {
      const seederPath = path.join(seedersDir, file);
      try {
        const seeder = require(seederPath);
        if (seeder.name && typeof seeder.run === 'function') {
          this.registerSeeder(seeder.name, seeder.run);
          logger.debug(`📁 Loaded seeder: ${seeder.name}`);
        } else {
          logger.warn(`⚠️ Invalid seeder file: ${file}`);
        }
      } catch (error) {
        logger.error(`❌ Failed to load seeder ${file}:`, error);
      }
    }
  }

  async runSeeders() {
    await this.connect();

    try {
      // Ensure seeders collection exists
      const db = mongoose.connection.db;
      const collections = await db.listCollections({ name: this.seederCollection }).toArray();
      if (collections.length === 0) {
        await db.createCollection(this.seederCollection);
        logger.info('📁 Created seeders collection');
      }

      // Get already executed seeders
      const SeederSchema = new mongoose.Schema({
        name: { type: String, required: true, unique: true },
        executedAt: { type: Date, default: Date.now }
      });
      const SeederModel = mongoose.model('Seeder', SeederSchema);
      
      const executedSeeders = await SeederModel.find({});
      const executedSeederNames = new Set(executedSeeders.map(s => s.name));

      // Run pending seeders
      let executedCount = 0;
      
      for (const seeder of this.seeders) {
        if (!executedSeederNames.has(seeder.name)) {
          logger.info(`🌱 Running seeder: ${seeder.name}`);
          
          try {
            await seeder.run();
            
            // Record successful seeder
            await SeederModel.create({ name: seeder.name });
            executedCount++;
            
            logger.info(`✅ Seeder completed: ${seeder.name}`);
          } catch (error) {
            logger.error(`❌ Seeder failed: ${seeder.name}`, error);
            throw error;
          }
        } else {
          logger.info(`⏭️  Seeder already executed: ${seeder.name}`);
        }
      }

      if (executedCount === 0) {
        logger.info('🎉 All seeders are up to date!');
      } else {
        logger.info(`🎉 Seeders completed. Executed ${executedCount} new seeder(s).`);
      }
      
    } finally {
      await this.disconnect();
    }
  }

  async listSeeders() {
    await this.connect();
    
    try {
      const SeederSchema = new mongoose.Schema({
        name: String,
        executedAt: Date
      });
      const SeederModel = mongoose.model('Seeder', SeederSchema);
      
      const executedSeeders = await SeederModel.find({}).sort({ executedAt: 1 });
      
      logger.info('📋 Seeder Status:');
      logger.info('================');
      
      for (const seeder of this.seeders) {
        const executed = executedSeeders.find(s => s.name === seeder.name);
        const status = executed ? '✅ Executed' : '⏳ Pending';
        const date = executed ? `(${executed.executedAt.toISOString()})` : '';
        logger.info(`${status}: ${seeder.name} ${date}`);
      }
      
    } finally {
      await this.disconnect();
    }
  }

  async resetSeeders() {
    await this.connect();
    
    try {
      const SeederSchema = new mongoose.Schema({
        name: String,
        executedAt: Date
      });
      const SeederModel = mongoose.model('Seeder', SeederSchema);
      
      await SeederModel.deleteMany({});
      logger.info('🗑️  All seeder records have been reset');
      
    } finally {
      await this.disconnect();
    }
  }
}

// Create seeder manager instance
const seederManager = new SeederManager();

// CLI handling
const command = process.argv[2];

async function main() {
  try {
    // Load seeders dynamically
    await seederManager.loadSeeders();
    
    switch (command) {
      case 'run':
        await seederManager.runSeeders();
        break;
      case 'list':
        await seederManager.listSeeders();
        break;
      case 'reset':
        await seederManager.resetSeeders();
        logger.info('🔁 Seeders reset. You can now run them again.');
        break;
      default:
        logger.info('Usage: node runSeeders.js [run|list|reset]');
        logger.info('  run   - Execute pending seeders');
        logger.info('  list  - List seeder status');
        logger.info('  reset - Reset seeder records (allows re-running)');
    }
  } catch (error) {
    logger.error('Seeder process failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = seederManager;

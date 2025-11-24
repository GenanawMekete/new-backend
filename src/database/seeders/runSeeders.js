const mongoose = require('mongoose');
const { MONGODB_URI } = require('../../config/database');
const logger = require('../../utils/logger');

class SeederManager {
  constructor() {
    this.seeders = [];
    this.seederCollection = 'seeders';
  }

  async connect() {
    try {
      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
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
      const SeederModel = mongoose.model('Seeder', new mongoose.Schema({
        name: String,
        executedAt: { type: Date, default: Date.now }
      }));
      
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

      logger.info(`🎉 Seeders completed. Executed ${executedCount} new seeder(s).`);
      
    } finally {
      await this.disconnect();
    }
  }

  async listSeeders() {
    await this.connect();
    
    try {
      const SeederModel = mongoose.model('Seeder', new mongoose.Schema({
        name: String,
        executedAt: Date
      }));
      
      const executedSeeders = await SeederModel.find({}).sort({ executedAt: 1 });
      
      logger.info('📋 Seeder Status:');
      logger.info('================');
      
      this.seeders.forEach(seeder => {
        const executed = executedSeeders.find(s => s.name === seeder.name);
        const status = executed ? '✅ Executed' : '⏳ Pending';
        const date = executed ? `(${executed.executedAt.toISOString()})` : '';
        logger.info(`${status}: ${seeder.name} ${date}`);
      });
      
    } finally {
      await this.disconnect();
    }
  }

  async resetSeeders() {
    await this.connect();
    
    try {
      const SeederModel = mongoose.model('Seeder', new mongoose.Schema({
        name: String,
        executedAt: Date
      }));
      
      await SeederModel.deleteMany({});
      logger.info('🗑️  All seeder records have been reset');
      
    } finally {
      await this.disconnect();
    }
  }
}

// Create seeder manager instance
const seederManager = new SeederManager();

// Register all seeders
const seederFiles = [
  require('./adminUser'),
  require('./gamePatterns'),
  require('./sampleRooms')
];

seederFiles.forEach(seeder => {
  seederManager.registerSeeder(seeder.name, seeder.run);
});

// CLI handling
const command = process.argv[2];

async function main() {
  try {
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

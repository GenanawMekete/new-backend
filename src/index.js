require('dotenv').config();
const app = require('./app');
const connectDatabase = require('./config/database');
const { setupSocketServer } = require('./config/socket');
const { setupJobs } = require('./jobs/gameScheduler');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to database first
    await connectDatabase();
    logger.info('📦 Database connected successfully');

    // Setup socket server
    const server = setupSocketServer(app);
    
    // Start server
    server.listen(PORT, () => {
      logger.info(`🎯 Bingo Server running on port ${PORT}`);
      logger.info(`🚀 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🗄️ Database: ${process.env.DB_NAME || 'bingo-game'}`);
      
      // Setup scheduled jobs
      setupJobs();
      logger.info('⏰ Game scheduler started');
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

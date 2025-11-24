const { Server } = require('socket.io');
const logger = require('../utils/logger');
const { authenticateSocket } = require('../middleware/socketAuth');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    connectionStateRecovery: {
      // enable reconnection with state recovery
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true
    }
  });

  // Socket middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    logger.info(`🔌 New socket connection: ${socket.id} - User: ${socket.userId}`);
    
    // Join player to their personal room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Import and register event handlers
    require('../events/socketEvents')(socket, io);

    // Emit connection success
    socket.emit('connected', {
      socketId: socket.id,
      userId: socket.userId,
      timestamp: new Date()
    });
  });

  // Handle server-wide events
  io.of('/').adapter.on('create-room', (room) => {
    logger.debug(`Room created: ${room}`);
  });

  io.of('/').adapter.on('delete-room', (room) => {
    logger.debug(`Room deleted: ${room}`);
  });

  io.of('/').adapter.on('join-room', (room, id) => {
    logger.debug(`Socket ${id} joined room: ${room}`);
  });

  io.of('/').adapter.on('leave-room', (room, id) => {
    logger.debug(`Socket ${id} left room: ${room}`);
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

// Helper methods for emitting events from services
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

const emitToGame = (gameId, event, data) => {
  if (io) {
    io.to(`game:${gameId}`).emit(event, data);
  }
};

const emitToRoom = (roomId, event, data) => {
  if (io) {
    io.to(`room:${roomId}`).emit(event, data);
  }
};

const broadcast = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToGame,
  emitToRoom,
  broadcast
};

const { v4: uuidv4 } = require('uuid');

function socketHandler(io) {
  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Player joins a game
    socket.on('join-game', async (data) => {
      try {
        const { gameId, player, selectedCards, betAmount } = data;
        
        // Join the game room
        socket.join(gameId);
        socket.gameId = gameId;
        socket.playerId = player.id;

        // Notify others
        socket.to(gameId).emit('player-joined', {
          player: player,
          totalPlayers: io.sockets.adapter.rooms.get(gameId)?.size || 1
        });

        console.log(`Player ${player.name} joined game ${gameId}`);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Player leaves the game
    socket.on('leave-game', (data) => {
      const { gameId, playerId } = data;
      socket.leave(gameId);
      socket.to(gameId).emit('player-left', { playerId });
    });

    // Player claims bingo
    socket.on('claim-bingo', (data) => {
      const { gameId, playerId, cardId, pattern } = data;
      socket.to(gameId).emit('bingo-claimed', {
        playerId,
        cardId,
        pattern,
        timestamp: new Date()
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (socket.gameId) {
        socket.to(socket.gameId).emit('player-disconnected', { 
          playerId: socket.playerId 
        });
      }
      console.log(`Player disconnected: ${socket.id}`);
    });
  });
}

module.exports = { socketHandler };

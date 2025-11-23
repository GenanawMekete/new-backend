const mongoose = require('mongoose');

const bingoCardSchema = new mongoose.Schema({
  cardId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  numbers: {
    B: [{ type: Number, min: 1, max: 15 }],
    I: [{ type: Number, min: 16, max: 30 }],
    N: [{ type: Number, min: 31, max: 45 }],
    G: [{ type: Number, min: 46, max: 60 }],
    O: [{ type: Number, min: 61, max: 75 }]
  },
  markedNumbers: [{
    number: Number,
    markedAt: {
      type: Date,
      default: Date.now
    },
    position: {
      row: Number,
      col: Number
    }
  }],
  patterns: {
    singleLine: {
      isComplete: { type: Boolean, default: false },
      completedAt: Date,
      lines: [Number] // row indices that are complete
    },
    doubleLine: {
      isComplete: { type: Boolean, default: false },
      completedAt: Date
    },
    tripleLine: {
      isComplete: { type: Boolean, default: false },
      completedAt: Date
    },
    fullHouse: {
      isComplete: { type: Boolean, default: false },
      completedAt: Date
    },
    fourCorners: {
      isComplete: { type: Boolean, default: false },
      completedAt: Date
    },
    diagonal: {
      isComplete: { type: Boolean, default: false },
      completedAt: Date
    },
    xPattern: {
      isComplete: { type: Boolean, default: false },
      completedAt: Date
    },
    crossPattern: {
      isComplete: { type: Boolean, default: false },
      completedAt: Date
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
bingoCardSchema.index({ user: 1, game: 1 });
bingoCardSchema.index({ game: 1, isActive: 1 });
bingoCardSchema.index({ createdAt: 1 });

// Virtuals
bingoCardSchema.virtual('markedCount').get(function() {
  return this.markedNumbers.length;
});

bingoCardSchema.virtual('completionPercentage').get(function() {
  const totalCells = 24; // 5x5 minus FREE space
  return (this.markedNumbers.length / totalCells * 100).toFixed(1);
});

// Methods
bingoCardSchema.methods.markNumber = function(number) {
  if (this.markedNumbers.some(mn => mn.number === number)) {
    return false; // Already marked
  }

  // Find the position of the number
  let position = null;
  const letters = ['B', 'I', 'N', 'G', 'O'];
  
  for (let col = 0; col < 5; col++) {
    const letter = letters[col];
    const rowIndex = this.numbers[letter].indexOf(number);
    if (rowIndex !== -1) {
      position = { row: rowIndex, col };
      break;
    }
  }

  if (position) {
    this.markedNumbers.push({
      number,
      markedAt: new Date(),
      position
    });
    return true;
  }

  return false;
};

bingoCardSchema.methods.checkPatterns = function() {
  const patterns = [];
  const markedPositions = this.markedNumbers.map(mn => mn.position);
  
  // Check rows
  for (let row = 0; row < 5; row++) {
    const rowComplete = markedPositions.filter(pos => pos.row === row).length === 5;
    if (rowComplete && !this.patterns.singleLine.lines.includes(row)) {
      this.patterns.singleLine.lines.push(row);
      if (this.patterns.singleLine.lines.length === 1) {
        patterns.push('single_line');
      } else if (this.patterns.singleLine.lines.length === 2 && !this.patterns.doubleLine.isComplete) {
        this.patterns.doubleLine.isComplete = true;
        this.patterns.doubleLine.completedAt = new Date();
        patterns.push('double_line');
      } else if (this.patterns.singleLine.lines.length === 3 && !this.patterns.tripleLine.isComplete) {
        this.patterns.tripleLine.isComplete = true;
        this.patterns.tripleLine.completedAt = new Date();
        patterns.push('triple_line');
      }
    }
  }

  // Check columns
  for (let col = 0; col < 5; col++) {
    const colComplete = markedPositions.filter(pos => pos.col === col).length === 5;
    if (colComplete && !this.patterns.singleLine.lines.includes(col + 5)) { // Offset for columns
      this.patterns.singleLine.lines.push(col + 5);
      // Similar logic for multiple lines...
    }
  }

  // Check four corners
  const corners = [
    { row: 0, col: 0 }, { row: 0, col: 4 },
    { row: 4, col: 0 }, { row: 4, col: 4 }
  ];
  const cornersComplete = corners.every(corner =>
    markedPositions.some(pos => pos.row === corner.row && pos.col === corner.col)
  );
  if (cornersComplete && !this.patterns.fourCorners.isComplete) {
    this.patterns.fourCorners.isComplete = true;
    this.patterns.fourCorners.completedAt = new Date();
    patterns.push('four_corners');
  }

  // Check diagonals
  const diag1Complete = [0,1,2,3,4].every(i =>
    markedPositions.some(pos => pos.row === i && pos.col === i)
  );
  const diag2Complete = [0,1,2,3,4].every(i =>
    markedPositions.some(pos => pos.row === i && pos.col === 4-i)
  );
  
  if (diag1Complete && !this.patterns.diagonal.isComplete) {
    this.patterns.diagonal.isComplete = true;
    this.patterns.diagonal.completedAt = new Date();
    patterns.push('diagonal');
  }

  // Check full house (all numbers marked)
  if (this.markedNumbers.length >= 24 && !this.patterns.fullHouse.isComplete) { // 24 = 25 - 1 FREE
    this.patterns.fullHouse.isComplete = true;
    this.patterns.fullHouse.completedAt = new Date();
    patterns.push('full_house');
  }

  return patterns;
};

bingoCardSchema.methods.getCardGrid = function() {
  const grid = [];
  const letters = ['B', 'I', 'N', 'G', 'O'];
  
  for (let row = 0; row < 5; row++) {
    const gridRow = [];
    for (let col = 0; col < 5; col++) {
      if (row === 2 && col === 2) {
        gridRow.push({ number: 'FREE', isMarked: true });
      } else {
        const number = this.numbers[letters[col]][row];
        const isMarked = this.markedNumbers.some(mn => mn.number === number);
        gridRow.push({ number, isMarked });
      }
    }
    grid.push(gridRow);
  }
  
  return grid;
};

// Static methods
bingoCardSchema.statics.generateCard = function(userId, gameId) {
  const letters = ['B', 'I', 'N', 'G', 'O'];
  const numbers = {};
  
  for (let i = 0; i < letters.length; i++) {
    const letter = letters[i];
    const min = i * 15 + 1;
    const max = min + 14;
    
    const columnNumbers = new Set();
    while (columnNumbers.size < 5) {
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      columnNumbers.add(num);
    }
    
    numbers[letter] = Array.from(columnNumbers).sort((a, b) => a - b);
  }
  
  return {
    cardId: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    user: userId,
    game: gameId,
    numbers
  };
};

bingoCardSchema.statics.findByUserAndGame = function(userId, gameId) {
  return this.find({ user: userId, game: gameId, isActive: true });
};

module.exports = mongoose.model('BingoCard', bingoCardSchema);

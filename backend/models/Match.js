const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true
  },
  // We use an array for players so it's flexible (easy to find "my opponent")
  players: [{
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    username: { 
      type: String, 
      required: true 
    },
    avatar: String,       // Storing avatar here makes frontend display faster
    isWinner: Boolean,    // True if this specific player won
    score: Number,        // Points scored in the match
    oldElo: Number,       // ELO before match (For history tracking)
    newElo: Number        // ELO after match (To show +15 or -10)
  }],
  winner: {
    type: String, // Username of the winner for quick access
    required: true
  },
  // Useful metadata
  language: {
    type: String,
    default: 'javascript'
  },
  codeSnapshot: {
    type: String, // Optional: Save the winning code snippet?
    select: false // Don't fetch this by default to keep history load fast
  }
}, { 
  timestamps: true // Automatically adds 'createdAt' (Date) and 'updatedAt'
});

module.exports = mongoose.model('Match', matchSchema);
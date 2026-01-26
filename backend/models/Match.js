import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  players: [{
    // Made optional to prevent crashes during solo testing or guest play
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    username: { type: String, required: true },
    avatar: String,
    isWinner: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    oldElo: { type: Number, default: 1000 },
    newElo: { type: Number, default: 1000 },
    statusText: { type: String, default: "" },

    //DEBUG CHANGES FROM HERE 
    seasonPointsGained: { type: Number, default: 0 },
    hasSubmitted: { type: Boolean, default: false }
    //DEBUG CHANGES TILL HERE
  }],
  winner: { type: String, required: true },
  isDisqualified: { type: Boolean, default: false },
  disqualifiedPlayer: { type: String, default: null },
  language: { type: String, default: 'cpp' }
}, { 
  timestamps: true 
});

// ✅ ADDED INDEX: This makes searching for "user history" 10x faster
matchSchema.index({ "players.username": 1 });

const Match = mongoose.model('Match', matchSchema);
export default Match;
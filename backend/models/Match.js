// import mongoose from 'mongoose';

// const matchSchema = new mongoose.Schema({
//   roomId: {
//     type: String,
//     required: true
//   },
//   // We use an array for players so it's flexible (easy to find "my opponent")
//   players: [{
//     userId: { 
//       type: mongoose.Schema.Types.ObjectId, 
//       ref: 'User' 
//     },
//     username: { 
//       type: String, 
//       required: true 
//     },
//     avatar: String,       // Storing avatar here makes frontend display faster
//     isWinner: Boolean,    // True if this specific player won
//     score: Number,        // Points scored in the match
//     oldElo: Number,       // ELO before match (For history tracking)
//     newElo: Number        // ELO after match (To show +15 or -10)
//   }],
//   winner: {
//     type: String, // Username of the winner for quick access
//     required: true
//   },
//   // Useful metadata
//   language: {
//     type: String,
//     default: 'javascript'
//   },
//   codeSnapshot: {
//     type: String, // Optional: Save the winning code snippet?
//     select: false // Don't fetch this by default to keep history load fast
//   }
// }, { 
//   timestamps: true // Automatically adds 'createdAt' (Date) and 'updatedAt'
// });

// module.exports = mongoose.model('Match', matchSchema);






// with updated anti cheat mechanism
// import mongoose from 'mongoose';

// const matchSchema = new mongoose.Schema({
//   roomId: {
//     type: String,
//     required: true
//   },
//   // Flexible player array for easy history rendering
//   players: [{
//     userId: { 
//       type: mongoose.Schema.Types.ObjectId, 
//       ref: 'User' 
//     },
//     username: { 
//       type: String, 
//       required: true 
//     },
//     avatar: String,       // Cached for faster frontend rendering
//     isWinner: Boolean,    // Identifies win/loss status
//     score: Number,        // Points earned during rounds
//     oldElo: Number,       // Rating before match
//     newElo: Number,       // Rating after match
//     // ✅ ADDED: statusText to store "Unfair Practice" or "Opponent Disqualification"
//     statusText: { 
//       type: String, 
//       default: "" 
//     }
//   }],
//   winner: {
//     type: String, // Username of the winner
//     required: true
//   },
//   // ✅ ADDED: Anti-Cheat Metadata
//   isDisqualified: {
//     type: Boolean,
//     default: false
//   },
//   disqualifiedPlayer: {
//     type: String, // Username of the cheater
//     default: null
//   },
//   // Useful metadata
//   language: {
//     type: String,
//     default: 'cpp'
//   },
//   codeSnapshot: {
//     type: String, 
//     select: false // Hidden from default queries to keep data transfer light
//   }
// }, { 
//   timestamps: true // Tracks match date automatically
// });

// // modern ES Module export
// const Match = mongoose.model('Match', matchSchema);
// export default Match;






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
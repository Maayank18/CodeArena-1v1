import mongoose from 'mongoose';

const matchPlayerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  username: {
    type: String,
    default: 'Unknown Player',
    trim: true
  },
  avatar: {
    type: String,
    default: ''
  },
  isWinner: {
    type: Boolean,
    default: false
  },
  score: {
    type: Number,
    default: 0
  },
  oldElo: {
    type: Number,
    default: 1000
  },
  newElo: {
    type: Number,
    default: 1000
  },
  statusText: {
    type: String,
    default: ''
  },
  seasonPointsGained: {
    type: Number,
    default: 0
  },
  hasSubmitted: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const matchSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    trim: true
  },
  players: {
    type: [matchPlayerSchema],
    default: []
  },
  winner: {
    type: String,
    default: 'Draw',
    trim: true
  },
  status: {
    type: String,
    enum: ['completed', 'cancelled'],
    default: 'completed'
  },
  isDisqualified: {
    type: Boolean,
    default: false
  },
  disqualifiedPlayer: {
    type: String,
    default: null
  },
  language: {
    type: String,
    default: 'cpp'
  },
  reason: {
    type: String,
    enum: ['submission', 'timeout', 'forfeit', 'draw', 'cancelled'],
    default: 'submission'
  },
  problemIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem'
  }],
  isCustom: {
    type: Boolean,
    default: false
  },
  matchDurationSeconds: {
    type: Number,
    default: 0
  },
  timeLimitSeconds: {
    type: Number,
    default: 1800
  },
  totalRoundsConfigured: {
    type: Number,
    default: 0
  },
  fastestSolveMsByUser: {
    type: Map,
    of: Number,
    default: undefined
  },
  firstRoundFirstSolverUsername: {
    type: String,
    default: null
  },
  firstRoundOpponentSubmissionCounts: {
    type: Map,
    of: Number,
    default: undefined
  }
}, {
  timestamps: true
});

matchSchema.index({ 'players.username': 1 });
matchSchema.index({ 'players.userId': 1, createdAt: -1 });
matchSchema.index({ roomId: 1 });
matchSchema.index({ createdAt: -1 });
matchSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

const Match = mongoose.model('Match', matchSchema);
export default Match;

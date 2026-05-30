import mongoose from 'mongoose';
import Match from './backend/models/Match.js';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

async function checkMatches() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");
  const matches = await Match.find().sort({ createdAt: -1 }).limit(3).lean();
  for (const match of matches) {
    console.log(`\nMatch: ${match._id} (Winner: ${match.winner}, Status: ${match.status})`);
    console.log(`Created: ${match.createdAt}`);
    for (const player of match.players) {
      console.log(`  Player: ${player.username}`);
      console.log(`    hasSubmitted: ${player.hasSubmitted}`);
      console.log(`    code length: ${player.code ? player.code.length : 'EMPTY'}`);
      console.log(`    code field exists: ${'code' in player}`);
      console.log(`    roundCodes:`, Object.keys(player.roundCodes || {}));
      console.log(`    roundCodes field exists: ${'roundCodes' in player}`);
    }
  }
  process.exit(0);
}

checkMatches().catch(console.error);

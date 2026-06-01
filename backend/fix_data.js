import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({path: './.env'});

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const res = await mongoose.connection.collection('problems').updateOne(
            { title: 'Two Sum Camp' },
            { 
                $set: { 
                    type: 'campaign', 
                    campaignRegion: 1, 
                    campaignNodeId: 'region-1-node-01' 
                } 
            }
        );
        console.log('Update result:', res);
    } catch(err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();

// Version-2.0
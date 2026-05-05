import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
await mongoose.connect(process.env.MONGO_URI);

console.log('✅ Connected to MongoDB');

// Create a minimal User model for testing
const userSchema = new mongoose.Schema({
    fullName: String,
    username: String,
    usernameLower: String,
    email: { type: String, unique: true, sparse: true },
    phone: String,
    password: String,
    avatar: String,
});

const User = mongoose.model('User', userSchema);

// Create or get admin user
let adminUser = await User.findOne({ username: 'Maya' });

if (!adminUser) {
    console.log('Creating admin user "Maya"...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    adminUser = await User.create({
        fullName: 'Maya Admin',
        username: 'Maya',
        usernameLower: 'maya',
        email: `maya-${Date.now()}@test.com`,
        phone: '9999999999',
        password: hashedPassword,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya',
    });
    console.log('✅ Admin user created:', adminUser.username);
} else {
    console.log('✅ Admin user already exists:', adminUser.username);
}

// Generate JWT token
const token = jwt.sign(
    { id: adminUser._id },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
);

console.log('\n✅ Generated JWT token');

// Create a test campaign problem payload
const uniqueId = 'verify-fix-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
const testPayload = {
    username: 'Maya',
    title: `Campaign Fix Test - ${uniqueId}`,
    slug: `campaign-fix-verify-${Date.now()}`,
    description: 'Testing campaign type resolution with debug logging',
    difficulty: 'Easy',
    type: 'campaign',  // CRITICAL: Explicitly sending 'campaign'
    campaignRegion: 1,
    campaignNodeId: 'region-1-node-01',
    constraints: ['Constraint 1'],
    timeLimit: 5000,
    memoryLimit: 512,
    goldenSolution: "(input) => 'expected'",
    starterCode: {},
    testCases: [{ input: 'test', output: 'expected', isPublic: true }]
};

console.log('\n📤 Sending test payload:');
console.log(JSON.stringify(testPayload, null, 2));

// Make the API request
try {
    const response = await fetch('http://localhost:5000/api/admin/problems/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testPayload)
    });

    const result = await response.json();
    console.log('\n📥 API Response:', JSON.stringify(result, null, 2));

    if (response.ok && result.problem) {
        console.log('\n✅ Problem created successfully!');
        console.log('Problem ID:', result.problem._id);
        console.log('Problem Type:', result.problem.type);
        console.log('Campaign Region:', result.problem.campaignRegion);
        console.log('Campaign NodeId:', result.problem.campaignNodeId);

        // Verify in the database
        const Problem = mongoose.model('Problem');
        const savedProblem = await Problem.findById(result.problem._id);
        console.log('\n✅ Verification from database:');
        console.log('Saved Type:', savedProblem.type);
        console.log('Saved Campaign Region:', savedProblem.campaignRegion);
        console.log('Saved Campaign NodeId:', savedProblem.campaignNodeId);

        if (savedProblem.type === 'campaign' && savedProblem.campaignRegion === 1 && savedProblem.campaignNodeId === 'region-1-node-01') {
            console.log('\n🎉 SUCCESS! Campaign problem saved correctly!');
        } else {
            console.log('\n❌ FAIL! Campaign problem NOT saved correctly!');
            console.log('Expected: type=campaign, region=1, nodeId=region-1-node-01');
            console.log('Got:', {
                type: savedProblem.type,
                region: savedProblem.campaignRegion,
                nodeId: savedProblem.campaignNodeId
            });
        }
    } else {
        console.log('\n❌ API request failed:', result.message);
    }
} catch (error) {
    console.error('\n❌ Error:', error.message);
}

// Clean up
await mongoose.connection.close();
console.log('\n✅ Disconnected from MongoDB');

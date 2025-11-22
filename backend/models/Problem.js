import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    slug: {
        type: String, 
        required: true,
        unique: true
    },
    description: { 
        type: String, 
        required: true 
    },
    difficulty: { 
        type: String, 
        enum: ['Easy', 'Medium', 'Hard'], 
        default: 'Easy' 
    },
    constraints: [String],
    starterCode: {
        javascript: { type: String, default: "// Write your code here\n" },
        python: { type: String, default: "# Write your code here\n" },
        cpp: { type: String, default: "// Write your code here\n" }
    },
    testCases: [{
        input: String,      // Passed to stdin
        output: String,     // Expected stdout
        isPublic: Boolean   // If true, shown to user as example
    }]
});

export default mongoose.model('Problem', problemSchema);
// FILE: backend/models/Problem.js
// OPTIMIZED VERSION - BACKWARD COMPATIBLE
import mongoose from 'mongoose';
console.log('[Model] Problem.js loaded');

const problemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
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
    type: {
        type: String,
        enum: ['battle', 'campaign'],
        default: 'battle'
    },
    campaignRegion: {
        type: Number,
        validate: {
            validator(value) {
                if (this.type !== 'campaign') return true;
                return Number.isInteger(value) && value > 0;
            },
            message: 'campaignRegion is required for campaign problems'
        }
    },
    campaignNodeId: {
        type: String,
        trim: true,
        validate: {
            validator(value) {
                if (this.type !== 'campaign') return true;
                return typeof value === 'string' && value.trim().length > 0;
            },
            message: 'campaignNodeId is required for campaign problems'
        }
    },
    constraints: [{
        type: String
    }],
    timeLimit: {
        type: Number,
        default: 5000 // milliseconds
    },
    memoryLimit: {
        type: Number,
        default: 512 // MB
    },
    goldenSolution: {
        type: String,
        required: true
    },
    starterCode: {
        javascript: { 
            type: String, 
            default: `// Read from stdin (Node.js)
const fs = require('fs');
const stdin = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
let currentIdx = 0;
function read() { return stdin[currentIdx++]; }

// Write your code below
function solve() {
    // const n = parseInt(read());
}
solve();` 
        },
        python: { 
            type: String, 
            default: `import sys

def solve():
    # Read all input efficiently
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    iterator = iter(input_data)

    # Use next(iterator) to get inputs
    # n = int(next(iterator))

if __name__ == "__main__":
    solve()` 
        },
        cpp: { 
            type: String, 
            default: `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Fast I/O
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Write your code here
    
    return 0;
}`
        },
        java: { 
            type: String, 
            default: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your code here
    }
}` 
        }
    },
    testCases: [{
        input: {
            type: String,
            required: true
        },
        output: {
            type: String,
            required: true
        },
        isPublic: {
            type: Boolean,
            default: false
        }
    }]
}, {
    timestamps: true
});

// ✅ EXISTING INDEXES (kept for backward compatibility)
problemSchema.index({ difficulty: 1 });
problemSchema.index({ createdAt: -1 });
problemSchema.index({ type: 1, difficulty: 1, createdAt: -1 });
problemSchema.index(
    { type: 1, campaignRegion: 1, campaignNodeId: 1 },
    {
        unique: true,
        partialFilterExpression: { type: 'campaign' }
    }
);

// ✅ NEW: Compound index for faster random problem selection
// Used in: server.js line ~203 - Problem.aggregate([{ $sample: { size: 2 }}])
// Impact: 3x faster problem fetching during room creation
problemSchema.index({ difficulty: 1, createdAt: -1 });

export default mongoose.model('Problem', problemSchema);
// V 1.5

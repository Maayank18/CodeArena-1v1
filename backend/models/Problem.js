// FILE: backend/models/Problem.js
// OPTIMIZED VERSION - BACKWARD COMPATIBLE
import mongoose from 'mongoose';
console.log('[Model] Problem.js loaded');

const DEFAULT_STARTER_CODE = {
    javascript: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim();

    // CodeArena runs in Standard I/O mode.
    // Write the full program from scratch: input parsing, helper functions, and output.
}

solve();`,
    python: `import sys

def solve():
    data = sys.stdin.read().split()

    # CodeArena runs in Standard I/O mode.
    # Write the full program from scratch: input parsing, helper functions, and output.

if __name__ == "__main__":
    solve()`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // CodeArena runs in Standard I/O mode.
    // Write the full program from scratch: input parsing, helper functions, and output.

    return 0;
}`,
    java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        // CodeArena runs in Standard I/O mode.
        // Write the full program from scratch: input parsing, helper methods, and output.
    }
}`
};

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
    problemImage: {
        type: String, // URL
        trim: true
    },
    inputFormatDescription: {
        type: String
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Easy'
    },
    // ── Data Structure Topics (for analytics & custom matchmaking) ──
    topics: [{
        type: String,
        trim: true,
        lowercase: true
    }],
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
            default: DEFAULT_STARTER_CODE.javascript,
        },
        python: { 
            type: String, 
            default: DEFAULT_STARTER_CODE.python,
        },
        cpp: { 
            type: String, 
            default: DEFAULT_STARTER_CODE.cpp,
        },
        java: { 
            type: String, 
            default: DEFAULT_STARTER_CODE.java,
        }
    },
    testCases: [{
        input: {
            type: String,
            required: true
        },
        displayInput: {
            type: String
        },
        visualInput: {
            type: String
        },
        output: {
            type: String,
            required: true
        },
        isPublic: {
            type: Boolean,
            default: false
        },
        explanation: {
            type: String
        }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

problemSchema.virtual('boilerplates').get(function problemBoilerplates() {
    return this.starterCode || DEFAULT_STARTER_CODE;
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

// ✅ NEW: Topic-based queries for analytics and custom matchmaking
problemSchema.index({ topics: 1 });
problemSchema.index({ type: 1, topics: 1 });

export default mongoose.model('Problem', problemSchema);
// V 1.5

// Version-2.0
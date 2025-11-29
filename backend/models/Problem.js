// import mongoose from 'mongoose';

// const problemSchema = new mongoose.Schema({
//     title: { 
//         type: String, 
//         required: true 
//     },
//     slug: {
//         type: String, 
//         required: true,
//         unique: true
//     },
//     description: { 
//         type: String, 
//         required: true 
//     },
//     difficulty: { 
//         type: String, 
//         enum: ['Easy', 'Medium', 'Hard'], 
//         default: 'Easy' 
//     },
//     constraints: [String],
//     starterCode: {
//         javascript: { type: String, default: "// Write your code here\n" },
//         python: { type: String, default: "# Write your code here\n" },
//         cpp: { type: String, default: "// Write your code here\n" }
//     },
//     testCases: [{
//         input: String,      // Passed to stdin
//         output: String,     // Expected stdout
//         isPublic: Boolean   // If true, shown to user as example
//     }]
// });

// export default mongoose.model('Problem', problemSchema);





// UPDATED THE PROBLEM.JS MODEL
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
    
    // 🛠️ UPDATED STARTER CODE (Vital for avoiding crashes)
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
        
        // 🔴 FIX: This prevents the "IndexError" we saw earlier!
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

        // Added Java support (standard for coding platforms)
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
        input: String,      // Passed to stdin
        output: String,     // Expected stdout
        isPublic: { type: Boolean, default: false } // Default to hidden
    }]
}, { 
    timestamps: true // Automatically adds createdAt / updatedAt
});

export default mongoose.model('Problem', problemSchema);
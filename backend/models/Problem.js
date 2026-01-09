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
    
//     // ✅ STEP 1: Generous Limits for Beginners
//     // 5000ms (5s) allows unoptimized solutions to pass
//     // 512MB allows inefficient memory usage without crashing
//     timeLimit: { type: Number, default: 5000 }, 
//     memoryLimit: { type: Number, default: 512 }, 

//     // 🛠️ Keep your existing Starter Code (It works well now)
//     starterCode: {
//         javascript: { 
//             type: String, 
//             default: `// Read from stdin (Node.js)
// const fs = require('fs');
// const stdin = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
// let currentIdx = 0;
// function read() { return stdin[currentIdx++]; }

// // Write your code below
// function solve() {
//     // const n = parseInt(read());
// }
// solve();` 
//         },
        
//         python: { 
//             type: String, 
//             default: `import sys

// def solve():
//     # Read all input efficiently
//     input_data = sys.stdin.read().split()
//     if not input_data:
//         return
//     iterator = iter(input_data)

//     # Use next(iterator) to get inputs
//     # n = int(next(iterator))

// if __name__ == "__main__":
//     solve()` 
        // },
        
//         cpp: { 
//             type: String, 
//             default: `#include <bits/stdc++.h>
// using namespace std;

// int main() {
//     // Fast I/O
//     ios_base::sync_with_stdio(false);
//     cin.tie(NULL);

//     // Write your code here
    
//     return 0;
// }` 
//         },

//         java: {
//             type: String,
//             default: `import java.util.*;

// public class Main {
//     public static void main(String[] args) {
//         Scanner sc = new Scanner(System.in);
//         // Write your code here
//     }
// }`
//         }
//     },
    
//     // ✅ CRITICAL: Flag to separate "Example" cases from "Real" cases
//     testCases: [{
//         input: String,      
//         output: String,     
//         isPublic: { type: Boolean, default: false } // Default to hidden
//     }]
// }, { 
//     timestamps: true 
// });

// export default mongoose.model('Problem', problemSchema);




// ========================================================================
// FILE: backend/models/Problem.js
// UPDATED VERSION WITH GOLDEN SOLUTION SUPPORT
// ========================================================================

import mongoose from 'mongoose';

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
    // Golden solution - the reference implementation used to validate test cases
    goldenSolution: {
        type: String,
        required: true
    },
    starterCode: {
        javascript: { type: String, default: `// Read from stdin (Node.js)
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
        python: { type: String, default: `import sys

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
        cpp: { type: String, default: `#include <bits/stdc++.h>
                                        using namespace std;

                                        int main() {
                                            // Fast I/O
                                            ios_base::sync_with_stdio(false);
                                            cin.tie(NULL);

                                            // Write your code here
                                            
                                            return 0;
                                        }`
            },
        java: { type: String, default: `import java.util.*;

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

// Index for faster queries
problemSchema.index({ slug: 1 });
problemSchema.index({ difficulty: 1 });
problemSchema.index({ createdAt: -1 });

export default mongoose.model('Problem', problemSchema);
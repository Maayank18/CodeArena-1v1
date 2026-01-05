import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. HELPER: Generate random integers [min, max]
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// 2. THE GOLDEN SOLVERS (The "Truth")
// Optimal algorithms to calculate correct outputs
const solvers = {
    "two-sum": (input) => {
        // Input: "4\n2 7 11 15\n9"
        const lines = input.trim().split('\n');
        if (lines.length < 3) return "";
        const nums = lines[1].trim().split(' ').map(Number);
        const target = parseInt(lines[2]);
        
        const map = new Map();
        for (let i = 0; i < nums.length; i++) {
            const complement = target - nums[i];
            if (map.has(complement)) return `${map.get(complement)} ${i}`;
            map.set(nums[i], i);
        }
        return ""; 
    },
    
    "palindrome-number": (input) => {
        // Input: "121"
        const s = input.trim();
        // Check if string equals its reverse
        return (s === s.split('').reverse().join('')).toString();
    },

    "fibonacci-number": (input) => {
        // Input: "5" -> Output: "5"
        const n = parseInt(input.trim());
        if (isNaN(n)) return "";
        if (n === 0) return "0";
        if (n === 1) return "1";

        let a = 0, b = 1;
        for (let i = 2; i <= n; i++) {
            let temp = a + b;
            a = b;
            b = temp;
        }
        return b.toString();
    }
};

// 3. GENERATORS (Create Data)

// --- Two Sum Generator ---
const generateTwoSum = () => {
    const cases = [];
    
    // Public (Visible)
    cases.push({ input: "4\n2 7 11 15\n9", output: "0 1", isPublic: true });
    cases.push({ input: "3\n3 2 4\n6", output: "1 2", isPublic: true });
    
    // Edge (Hidden)
    cases.push({ input: "2\n3 3\n6", output: "0 1", isPublic: false }); // Min size
    cases.push({ input: "4\n0 4 3 0\n0", output: "0 3", isPublic: false }); // Zero handling

    // Random Hidden (20 cases)
    // for (let i = 0; i < 20; i++) {
    //     const n = randInt(10, 50); 
    //     const nums = Array.from({length: n}, () => randInt(-1000, 1000));
        
    //     // Guarantee a valid pair exists
    //     const idx1 = randInt(0, n - 2);
    //     const idx2 = randInt(idx1 + 1, n - 1);
    //     const target = nums[idx1] + nums[idx2];
        
    //     const input = `${n}\n${nums.join(' ')}\n${target}`;
    //     const output = solvers["two-sum"](input); 
        
    //     if(output) cases.push({ input, output, isPublic: false });
    // }
    return cases;
};

// --- Palindrome Generator ---
const generatePalindrome = () => {
    const cases = [];
    
    // Public
    cases.push({ input: "121", output: "true", isPublic: true });
    cases.push({ input: "-121", output: "false", isPublic: true });
    
    // Edge
    cases.push({ input: "0", output: "true", isPublic: false });
    cases.push({ input: "10", output: "false", isPublic: false });

    // Random Hidden (20 cases)
    // for (let i = 0; i < 20; i++) {
    //     const isPal = Math.random() > 0.5;
    //     let num;
    //     if (isPal) {
    //         // Force palindrome creation
    //         const half = randInt(100, 999).toString();
    //         num = half + half.split('').reverse().join('');
    //     } else {
    //         // Random number (likely not palindrome)
    //         num = randInt(10000, 999999).toString();
    //     }
    //     const output = solvers["palindrome-number"](num);
    //     cases.push({ input: num, output, isPublic: false });
    // }
    return cases;
};

// --- Fibonacci Generator ---
const generateFibonacci = () => {
    const cases = [];

    // Public
    cases.push({ input: "2", output: "1", isPublic: true });
    cases.push({ input: "5", output: "5", isPublic: true });

    // Edge
    cases.push({ input: "0", output: "0", isPublic: false });
    cases.push({ input: "1", output: "1", isPublic: false });
    cases.push({ input: "30", output: "832040", isPublic: false }); // Large case

    // Random Hidden (20 cases)
    // for (let i = 0; i < 20; i++) {
    //     // N between 2 and 40 (Safe for standard int)
    //     const n = randInt(2, 40).toString();
    //     const output = solvers["fibonacci-number"](n);
    //     cases.push({ input: n, output, isPublic: false });
    // }
    return cases;
};

// 4. DATA EXPORT ARRAY
const allProblems = [
    {
        title: "Two Sum",
        slug: "two-sum",
        description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\n**Input Format:**\n- Line 1: Size `n`\n- Line 2: Array integers\n- Line 3: Target integer\n\n**Output Format:**\n- Two indices separated by space (e.g. `0 1`)",
        difficulty: "Easy",
        constraints: ["2 <= n <= 10^4", "-10^9 <= nums[i] <= 10^9"],
        timeLimit: 5000, 
        memoryLimit: 512,
        starterCode: {
             javascript: "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim().split('\\n');\nfunction solve() {\n    const n = parseInt(input[0]);\n    const nums = input[1].trim().split(' ').map(Number);\n    const target = parseInt(input[2]);\n    // Write your code here\n}\nsolve();",
             python: "import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    n = int(data[0])\n    nums = [int(x) for x in data[1:n+1]]\n    target = int(data[n+1])\n    # Write your code here\nif __name__ == '__main__': solve()",
             cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    int n; cin >> n;\n    vector<int> nums(n); for(int i=0; i<n; i++) cin >> nums[i];\n    int target; cin >> target;\n    // Write your code here\n    return 0;\n}",
             java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for(int i=0; i<n; i++) nums[i] = sc.nextInt();\n        int target = sc.nextInt();\n        // Write your code here\n    }\n}"
        },
        testCases: generateTwoSum()
    },
    {
        title: "Palindrome Number",
        slug: "palindrome-number",
        description: "Given an integer `x`, return `true` if `x` is a palindrome, and `false` otherwise.\n\n**Input:**\n- An integer `x`\n\n**Output:**\n- `true` or `false`",
        difficulty: "Easy",
        constraints: ["-2^31 <= x <= 2^31 - 1"],
        timeLimit: 5000,
        memoryLimit: 512,
        starterCode: {
            javascript: "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim();\nfunction solve() {\n    const x = parseInt(input);\n    // Write your code here\n}\nsolve();",
            python: "import sys\ndef solve():\n    x = sys.stdin.read().strip()\n    # Write your code here\nif __name__ == '__main__': solve()",
            cpp: "#include <iostream>\nusing namespace std;\nint main() {\n    long long x; cin >> x;\n    // Write your code here\n    return 0;\n}",
            java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(sc.hasNext()) {\n            String x = sc.next();\n            // Write your code here\n        }\n    }\n}"
        },
        testCases: generatePalindrome()
    },
    {
        title: "Fibonacci Number",
        slug: "fibonacci-number",
        description: "The Fibonacci numbers, commonly denoted `F(n)` form a sequence, called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1.\nGiven `n`, calculate `F(n)`.\n\n**Input:**\n- Integer `n` (0 <= n <= 40)\n\n**Output:**\n- The nth Fibonacci number.",
        difficulty: "Easy",
        constraints: ["0 <= n <= 40"],
        timeLimit: 5000,
        memoryLimit: 512,
        starterCode: {
            javascript: "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim();\nfunction solve() {\n    const n = parseInt(input);\n    // Write your code here\n}\nsolve();",
            python: "import sys\ndef solve():\n    input_data = sys.stdin.read().strip()\n    if not input_data: return\n    n = int(input_data)\n    # Write your code here\nif __name__ == '__main__': solve()",
            cpp: "#include <iostream>\nusing namespace std;\nint main() {\n    int n; cin >> n;\n    // Write your code here\n    return 0;\n}",
            java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(sc.hasNextInt()) {\n            int n = sc.nextInt();\n            // Write your code here\n        }\n    }\n}"
        },
        testCases: generateFibonacci()
    }
];

// Write to JSON
const outputPath = path.join(__dirname, '../problems.json');
fs.writeFileSync(outputPath, JSON.stringify(allProblems, null, 2));
console.log(`✅ Generated ${allProblems.length} problems with test cases at ${outputPath}`);
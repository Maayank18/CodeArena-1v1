// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // 1. HELPER: Generate random integers [min, max]
// const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// // 2. THE GOLDEN SOLVERS (The "Truth")
// const solvers = {
//     "fox-and-snake": (input) => {
//         // Input format: "3 3" or "5 3"
//         const parts = input.trim().split(/\s+/);
//         if (parts.length < 2) return "";
        
//         const n = parseInt(parts[0]);
//         const m = parseInt(parts[1]);
        
//         let result = "";
//         let rightSide = true; // flag to track snake direction

//         for (let i = 0; i < n; i++) {
//             if (i % 2 === 0) {
//                 // Odd rows (1, 3, 5...) are full hashes
//                 // Note: i starts at 0, so i=0 is Row 1
//                 result += "#".repeat(m) + "\n";
//             } else {
//                 // Even rows (2, 4, 6...) are connecting dots
//                 if (rightSide) {
//                     result += ".".repeat(m - 1) + "#\n";
//                 } else {
//                     result += "#" + ".".repeat(m - 1) + "\n";
//                 }
//                 // Toggle direction only after drawing a connecting row
//                 rightSide = !rightSide;
//             }
//         }
//         return result.trim(); // Remove trailing newline for clean comparison
//     }
// };

// // 3. GENERATORS (Create Data)

// const generateFoxAndSnake = () => {
//     const cases = [];

//     // A. Public Cases (From Problem Statement)
//     cases.push({ input: "3 3", output: solvers["fox-and-snake"]("3 3"), isPublic: true });
//     cases.push({ input: "5 3", output: solvers["fox-and-snake"]("5 3"), isPublic: true });

//     // B. Edge Cases (Hidden)
//     // Smallest possible snake
//     cases.push({ input: "3 3", output: solvers["fox-and-snake"]("3 3"), isPublic: false }); 
//     // Wide snake
//     cases.push({ input: "3 20", output: solvers["fox-and-snake"]("3 20"), isPublic: false }); 
//     // Tall snake
//     cases.push({ input: "9 3", output: solvers["fox-and-snake"]("9 3"), isPublic: false }); 
//     return cases;
// };

// // 4. DATA EXPORT ARRAY
// const allProblems = [
//     {
//         title: "Fox And Snake",
//         slug: "fox-and-snake",
//         description: "Fox Ciel starts to learn programming. The first task is drawing a fox! However, that turns out to be too hard for a beginner, so she decides to draw a snake instead.\n\nA snake is a pattern on an `n` by `m` table. Denote `c`-th cell of `r`-th row as `(r, c)`. The tail of the snake is located at `(1, 1)`, then its body extends to `(1, m)`, then goes down 2 rows to `(3, m)`, then goes left to `(3, 1)` and so on.\n\nYour task is to draw this snake for Fox Ciel: the empty cells should be represented as dot characters (`.`) and the snake cells should be filled with number signs (`#`).\n\n**Input:**\nTwo integers `n` and `m` (`3 <= n, m <= 50`). `n` is odd.\n\n**Output:**\n`n` lines represented the snake pattern.",
//         difficulty: "Easy",
//         constraints: ["3 <= n, m <= 50", "n is odd"],
//         timeLimit: 2000, 
//         starterCode: {
//             javascript: "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\nfunction solve() {\n    const n = parseInt(input[0]);\n    const m = parseInt(input[1]);\n    // Write your code here\n}\nsolve();",
//             python: "import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    n = int(data[0])\n    m = int(data[1])\n    # Write your code here\nif __name__ == '__main__': solve()",
//             cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    int n, m;\n    cin >> n >> m;\n    // Write your code here\n    return 0;\n}",
//             java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(sc.hasNextInt()) {\n            int n = sc.nextInt();\n            int m = sc.nextInt();\n            // Write your code here\n        }\n    }\n}"
//         },
//         testCases: generateFoxAndSnake()
//     }
// ];

// // Write to JSON
// const outputPath = path.join(__dirname, '../problems.json');
// fs.writeFileSync(outputPath, JSON.stringify(allProblems, null, 2));
// console.log(`✅ Generated ${allProblems.length} problems with test cases at ${outputPath}`);




import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// HELPER: Generate random integers [min, max]
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// SOLVER FUNCTIONS (The "Truth")
const solvers = {
    "fox-and-snake": (input) => {
        const parts = input.trim().split(/\s+/);
        if (parts.length < 2) return "";
        
        const n = parseInt(parts[0]);
        const m = parseInt(parts[1]);
        
        let result = "";
        let rightSide = true;

        for (let i = 0; i < n; i++) {
            if (i % 2 === 0) {
                result += "#".repeat(m) + "\n";
            } else {
                if (rightSide) {
                    result += ".".repeat(m - 1) + "#\n";
                } else {
                    result += "#" + ".".repeat(m - 1) + "\n";
                }
                rightSide = !rightSide;
            }
        }
        return result.trim();
    },

    "easy-problem": (input) => {
        const lines = input.trim().split('\n');
        const n = parseInt(lines[0]);
        const opinions = lines[1].split(/\s+/).map(x => parseInt(x));
        
        return opinions.includes(1) ? "HARD" : "EASY";
    },

    "team": (input) => {
        const lines = input.trim().split('\n');
        const n = parseInt(lines[0]);
        let count = 0;
        
        for (let i = 1; i <= n; i++) {
            const votes = lines[i].split(/\s+/).map(x => parseInt(x));
            const sum = votes.reduce((a, b) => a + b, 0);
            if (sum >= 2) count++;
        }
        
        return count.toString();
    },

    "next-round": (input) => {
        const lines = input.trim().split('\n');
        const [n, k] = lines[0].split(/\s+/).map(x => parseInt(x));
        const scores = lines[1].split(/\s+/).map(x => parseInt(x));
        
        const kthScore = scores[k - 1];
        let count = 0;
        
        for (const score of scores) {
            if (score >= kthScore && score > 0) {
                count++;
            }
        }
        
        return count.toString();
    },

    "anton-and-danik": (input) => {
        const lines = input.trim().split('\n');
        const n = parseInt(lines[0]);
        const games = lines[1];
        
        let countA = 0, countD = 0;
        for (const c of games) {
            if (c === 'A') countA++;
            else if (c === 'D') countD++;
        }
        
        if (countA > countD) return "Anton";
        if (countD > countA) return "Danik";
        return "Friendship";
    },

    "horseshoe": (input) => {
        const colors = input.trim().split(/\s+/).map(x => parseInt(x));
        const uniqueColors = new Set(colors);
        return (4 - uniqueColors.size).toString();
    },

    "pangram": (input) => {
        const lines = input.trim().split('\n');
        const n = parseInt(lines[0]);
        const s = lines[1];
        
        if (n < 26) return "NO";
        
        const letters = new Set();
        for (const c of s) {
            if (/[a-zA-Z]/.test(c)) {
                letters.add(c.toLowerCase());
            }
        }
        
        return letters.size === 26 ? "YES" : "NO";
    },

    "hit-lottery": (input) => {
        let amount = parseInt(input.trim());
        const notes = [100, 20, 10, 5, 1];
        let bills = 0;
        
        for (const note of notes) {
            bills += Math.floor(amount / note);
            amount %= note;
        }
        
        return bills.toString();
    },

    "beautiful-year": (input) => {
        let year = parseInt(input.trim()) + 1;
        
        while (true) {
            const digits = new Set(year.toString());
            if (digits.size === 4) {
                return year.toString();
            }
            year++;
        }
    }
};

// TEST CASE GENERATORS

const generateFoxAndSnake = () => {
    const cases = [];
    cases.push({ input: "3 3", output: solvers["fox-and-snake"]("3 3"), isPublic: true });
    cases.push({ input: "5 3", output: solvers["fox-and-snake"]("5 3"), isPublic: true });
    cases.push({ input: "3 20", output: solvers["fox-and-snake"]("3 20"), isPublic: false });
    cases.push({ input: "9 3", output: solvers["fox-and-snake"]("9 3"), isPublic: false });
    cases.push({ input: "7 7", output: solvers["fox-and-snake"]("7 7"), isPublic: false });
    return cases;
};

const generateEasyProblem = () => {
    const cases = [];
    cases.push({ input: "3\n0 0 1", output: solvers["easy-problem"]("3\n0 0 1"), isPublic: true });
    cases.push({ input: "1\n0", output: solvers["easy-problem"]("1\n0"), isPublic: true });
    cases.push({ input: "5\n1 0 0 0 0", output: solvers["easy-problem"]("5\n1 0 0 0 0"), isPublic: false });
    cases.push({ input: "4\n0 0 0 0", output: solvers["easy-problem"]("4\n0 0 0 0"), isPublic: false });
    cases.push({ input: "100\n" + "0 ".repeat(100).trim(), output: solvers["easy-problem"]("100\n" + "0 ".repeat(100).trim()), isPublic: false });
    return cases;
};

const generateTeam = () => {
    const cases = [];
    cases.push({ input: "3\n1 1 0\n1 1 1\n1 0 0", output: solvers["team"]("3\n1 1 0\n1 1 1\n1 0 0"), isPublic: true });
    cases.push({ input: "2\n1 0 0\n0 1 1", output: solvers["team"]("2\n1 0 0\n0 1 1"), isPublic: true });
    cases.push({ input: "5\n0 0 0\n1 1 1\n1 1 0\n0 0 1\n1 0 1", output: solvers["team"]("5\n0 0 0\n1 1 1\n1 1 0\n0 0 1\n1 0 1"), isPublic: false });
    cases.push({ input: "1\n0 0 0", output: solvers["team"]("1\n0 0 0"), isPublic: false });
    return cases;
};

const generateNextRound = () => {
    const cases = [];
    cases.push({ input: "8 5\n10 9 8 7 7 7 5 5", output: solvers["next-round"]("8 5\n10 9 8 7 7 7 5 5"), isPublic: true });
    cases.push({ input: "4 2\n0 0 0 0", output: solvers["next-round"]("4 2\n0 0 0 0"), isPublic: true });
    cases.push({ input: "5 3\n100 99 98 97 96", output: solvers["next-round"]("5 3\n100 99 98 97 96"), isPublic: false });
    cases.push({ input: "3 1\n5 3 0", output: solvers["next-round"]("3 1\n5 3 0"), isPublic: false });
    return cases;
};

const generateAntonAndDanik = () => {
    const cases = [];
    cases.push({ input: "6\nADAAAD", output: solvers["anton-and-danik"]("6\nADAAAD"), isPublic: true });
    cases.push({ input: "7\nDDDAADA", output: solvers["anton-and-danik"]("7\nDDDAADA"), isPublic: true });
    cases.push({ input: "6\nDADADA", output: solvers["anton-and-danik"]("6\nDADADA"), isPublic: true });
    cases.push({ input: "1\nA", output: solvers["anton-and-danik"]("1\nA"), isPublic: false });
    cases.push({ input: "10\nAAAADDDDDD", output: solvers["anton-and-danik"]("10\nAAAADDDDDD"), isPublic: false });
    return cases;
};

const generateHorseshoe = () => {
    const cases = [];
    cases.push({ input: "1 7 3 3", output: solvers["horseshoe"]("1 7 3 3"), isPublic: true });
    cases.push({ input: "7 7 7 7", output: solvers["horseshoe"]("7 7 7 7"), isPublic: true });
    cases.push({ input: "1 2 3 4", output: solvers["horseshoe"]("1 2 3 4"), isPublic: false });
    cases.push({ input: "1000000000 1000000000 999999999 999999999", output: solvers["horseshoe"]("1000000000 1000000000 999999999 999999999"), isPublic: false });
    return cases;
};

const generatePangram = () => {
    const cases = [];
    cases.push({ input: "12\ntoosmallword", output: solvers["pangram"]("12\ntoosmallword"), isPublic: true });
    cases.push({ input: "35\nTheQuickBrownFoxJumpsOverTheLazyDog", output: solvers["pangram"]("35\nTheQuickBrownFoxJumpsOverTheLazyDog"), isPublic: true });
    cases.push({ input: "26\nabcdefghijklmnopqrstuvwxyz", output: solvers["pangram"]("26\nabcdefghijklmnopqrstuvwxyz"), isPublic: false });
    cases.push({ input: "30\nABCDEFGHIJKLMNOPQRSTUVWXYZ", output: solvers["pangram"]("30\nABCDEFGHIJKLMNOPQRSTUVWXYZ"), isPublic: false });
    cases.push({ input: "10\nabcdefghij", output: solvers["pangram"]("10\nabcdefghij"), isPublic: false });
    return cases;
};

const generateHitLottery = () => {
    const cases = [];
    cases.push({ input: "125", output: solvers["hit-lottery"]("125"), isPublic: true });
    cases.push({ input: "43", output: solvers["hit-lottery"]("43"), isPublic: true });
    cases.push({ input: "1000000000", output: solvers["hit-lottery"]("1000000000"), isPublic: true });
    cases.push({ input: "1", output: solvers["hit-lottery"]("1"), isPublic: false });
    cases.push({ input: "777", output: solvers["hit-lottery"]("777"), isPublic: false });
    return cases;
};

const generateBeautifulYear = () => {
    const cases = [];
    cases.push({ input: "1987", output: solvers["beautiful-year"]("1987"), isPublic: true });
    cases.push({ input: "2013", output: solvers["beautiful-year"]("2013"), isPublic: true });
    cases.push({ input: "1000", output: solvers["beautiful-year"]("1000"), isPublic: false });
    cases.push({ input: "9000", output: solvers["beautiful-year"]("9000"), isPublic: false });
    cases.push({ input: "5555", output: solvers["beautiful-year"]("5555"), isPublic: false });
    return cases;
};

// ALL PROBLEMS DATA
const allProblems = [
    {
        title: "Fox And Snake",
        slug: "fox-and-snake",
        description: "Fox Ciel starts to learn programming. The first task is drawing a fox! However, that turns out to be too hard for a beginner, so she decides to draw a snake instead.\n\nA snake is a pattern on an `n` by `m` table. The tail of the snake is located at `(1, 1)`, then its body extends to `(1, m)`, then goes down 2 rows to `(3, m)`, then goes left to `(3, 1)` and so on.\n\nYour task is to draw this snake for Fox Ciel: the empty cells should be represented as dot characters (`.`) and the snake cells should be filled with number signs (`#`).",
        difficulty: "Easy",
        constraints: ["3 ≤ n, m ≤ 50", "n is odd"],
        timeLimit: 2000,
        starterCode: {
            javascript: "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\nfunction solve() {\n    const n = parseInt(input[0]);\n    const m = parseInt(input[1]);\n    // Write your code here\n}\nsolve();",
            python: "import sys\ndef solve():\n    data = sys.stdin.read().split()\n    if not data: return\n    n = int(data[0])\n    m = int(data[1])\n    # Write your code here\nif __name__ == '__main__': solve()",
            cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    int n, m;\n    cin >> n >> m;\n    // Write your code here\n    return 0;\n}",
            java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int m = sc.nextInt();\n        // Write your code here\n    }\n}"
        },
        testCases: generateFoxAndSnake()
    },
    {
        title: "In Search of an Easy Problem",
        slug: "easy-problem",
        description: "When preparing a tournament, Codeforces coordinators try their best to make the first problem as easy as possible. This time the coordinator had chosen some problem and asked n people about their opinions. Each person answered whether this problem is easy or hard.\n\nIf at least one of these n people has answered that the problem is hard, the coordinator decides to change the problem. For the given responses, check if the problem is easy enough.",
        difficulty: "Easy",
        constraints: ["1 ≤ n ≤ 100"],
        timeLimit: 2000,
        starterCode: {
            javascript: "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim().split('\\n');\nfunction solve() {\n    const n = parseInt(input[0]);\n    const opinions = input[1].split(' ').map(Number);\n    // Write your code here\n}\nsolve();",
            python: "import sys\ndef solve():\n    n = int(input())\n    opinions = list(map(int, input().split()))\n    # Write your code here\nif __name__ == '__main__': solve()",
            cpp: "#include <iostream>\nusing namespace std;\nint main() {\n    int n;\n    cin >> n;\n    // Write your code here\n    return 0;\n}",
            java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        // Write your code here\n    }\n}"
        },
        testCases: generateEasyProblem()
    },
    {
        title: "Team",
        slug: "team",
        description: "One day three best friends Petya, Vasya and Tonya decided to form a team and take part in programming contests. Participants are usually offered several problems during programming contests. Long before the start the friends decided that they will implement a problem if at least two of them are sure about the solution. Otherwise, the friends won't write the problem's solution.\n\nThis contest offers n problems to the participants. For each problem we know, which friend is sure about the solution. Help the friends find the number of problems for which they will write a solution.",
        difficulty: "Easy",
        constraints: ["1 ≤ n ≤ 1000"],
        timeLimit: 2000,
        starterCode: {
            javascript: "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim().split('\\n');\nfunction solve() {\n    const n = parseInt(input[0]);\n    // Write your code here\n}\nsolve();",
            python: "import sys\ndef solve():\n    n = int(input())\n    # Write your code here\nif __name__ == '__main__': solve()",
            cpp: "#include <iostream>\nusing namespace std;\nint main() {\n    int n;\n    cin >> n;\n    // Write your code here\n    return 0;\n}",
            java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        // Write your code here\n    }\n}"
        },
        testCases: generateTeam()
    },
    {
        title: "Next Round",
        slug: "next-round",
        description: "\"Contestant who earns a score equal to or greater than the k-th place finisher's score will advance to the next round, as long as the contestant earns a positive score...\" — an excerpt from contest rules.\n\nA total of n participants took part in the contest (n ≥ k), and you already know their scores. Calculate how many participants will advance to the next round.",
        difficulty: "Easy",
        constraints: ["1 ≤ k ≤ n ≤ 50", "0 ≤ score ≤ 100"],
        timeLimit: 2000,
        starterCode: {
            javascript: "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim().split('\\n');\nfunction solve() {\n    const [n, k] = input[0].split(' ').map(Number);\n    const scores = input[1].split(' ').map(Number);\n    // Write your code here\n}\nsolve();",
            python: "import sys\ndef solve():\n    n, k = map(int, input().split())\n    scores = list(map(int, input().split()))\n    # Write your code here\nif __name__ == '__main__': solve()",
            cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    int n, k;\n    cin >> n >> k;\n    // Write your code here\n    return 0;\n}",
            java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int k = sc.nextInt();\n        // Write your code here\n    }\n}"
        },
        testCases: generateNextRound()
    },
    {
        title: "Anton and Danik",
        slug: "anton-and-danik",
        description: "Anton likes to play chess, and so does his friend Danik.\n\nOnce they have played n games in a row. For each game it's known who was the winner — Anton or Danik. None of the games ended with a tie.\n\nNow Anton wonders, who won more games, he or Danik? Help him determine this.",
        difficulty: "Easy",
        constraints: ["1 ≤ n ≤ 100,000"],
        timeLimit: 2000,
        starterCode: {
            javascript: "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim().split('\\n');\nfunction solve() {\n    const n = parseInt(input[0]);\n    const games = input[1];\n    // Write your code here\n}\nsolve();",
            python: "import sys\ndef solve():\n    n = int(input())\n    games = input().strip()\n    # Write your code here\nif __name__ == '__main__': solve()",
            cpp: "#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n    int n;\n    string games;\n    cin >> n >> games;\n    // Write your code here\n    return 0;\n}",
            java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        String games = sc.next();\n        // Write your code here\n    }\n}"
        },
        testCases: generateAntonAndDanik()
    },
    {
        title: "Is your horseshoe on the other hoof?",
        slug: "horseshoe",
        description: "Valera the Horse is going to the party with friends. He has been following the fashion trends for a while, and he knows that it is very popular to wear all horseshoes of different color. Valera has got four horseshoes left from the last year, but maybe some of them have the same color. In this case he needs to go to the store and buy some few more horseshoes, not to lose face in front of his stylish comrades.\n\nFortunately, the store sells horseshoes of all colors under the sun and Valera has enough money to buy any four of them. However, in order to save the money, he would like to spend as little money as possible, so you need to help Valera and determine what is the minimum number of horseshoes he needs to buy to wear four horseshoes of different colors to a party.",
        difficulty: "Easy",
        constraints: ["1 ≤ color ≤ 10^9"],
        timeLimit: 2000,
        starterCode: {
            javascript: "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/).map(Number);\nfunction solve() {\n    const colors = input;\n    // Write your code here\n}\nsolve();",
            python: "import sys\ndef solve():\n    colors = list(map(int, input().split()))\n    # Write your code here\nif __name__ == '__main__': solve()",
            cpp: "#include <iostream>\nusing namespace std;\nint main() {\n    int s1, s2, s3, s4;\n    cin >> s1 >> s2 >> s3 >> s4;\n    // Write your code here\n    return 0;\n}",
            java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int s1 = sc.nextInt();\n        int s2 = sc.nextInt();\n        int s3 = sc.nextInt();\n        int s4 = sc.nextInt();\n        // Write your code here\n    }\n}"
        },
        testCases: generateHorseshoe()
    },
    {
        title: "Pangram",
        slug: "pangram",
        description: "A word or a sentence in some language is called a pangram if all the characters of the alphabet of this language appear in it at least once. Pangrams are often used to demonstrate fonts in printing or test the output devices.\n\nYou are given a string consisting of lowercase and uppercase Latin letters. Check whether this string is a pangram. We say that the string contains a letter of the Latin alphabet if this letter occurs in the string in uppercase or lowercase.",
        difficulty: "Easy",
        constraints: ["1 ≤ n ≤ 100"],
        timeLimit: 2000,
        starterCode: {
            javascript: "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim().split('\\n');\nfunction solve() {\n    const n = parseInt(input[0]);\n    const s = input[1];\n    // Write your code here\n}\nsolve();",
            python: "import sys\ndef solve():\n    n = int(input())\n    s = input().strip()\n    # Write your code here\nif __name__ == '__main__': solve()",
            cpp: "#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n    int n;\n    string s;\n    cin >> n >> s;\n    // Write your code here\n    return 0;\n}",
            java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        String s = sc.next();\n        // Write your code here\n    }\n}"
        },
        testCases: generatePangram()
    },
    {
        title: "Hit the Lottery",
        slug: "hit-lottery",
        description: "Allen has a LOT of money. He has n dollars in the bank. For security reasons, he wants to withdraw it in cash (we will not disclose the reasons here). The denominations for dollar bills are 1, 5, 10, 20, 100. What is the minimum number of bills Allen could receive after withdrawing his entire balance?",
        difficulty: "Easy",
        constraints: ["1 ≤ n ≤ 10^9"],
        timeLimit: 2000,
        starterCode: {
            javascript: "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim();\nfunction solve() {\n    const n = parseInt(input);\n    // Write your code here\n}\nsolve();",
            python: "import sys\ndef solve():\n    n = int(input())\n    # Write your code here\nif __name__ == '__main__': solve()",
            cpp: "#include <iostream>\nusing namespace std;\nint main() {\n    int n;\n    cin >> n;\n    // Write your code here\n    return 0;\n}",
            java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        // Write your code here\n    }\n}"
        },
        testCases: generateHitLottery()
    },
    {
        title: "Beautiful Year",
        slug: "beautiful-year",
        description: "It seems like the year of 2013 came only yesterday. Do you know a curious fact? The year of 2013 is the first year after the old 1987 with only distinct digits.\n\nNow you are suggested to solve the following problem: given a year number, find the minimum year number which is strictly larger than the given one and has only distinct digits.",
        difficulty: "Easy",
        constraints: ["1000 ≤ year ≤ 9000"],
        timeLimit: 2000,
        starterCode: {
            javascript: "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim();\nfunction solve() {\n    const year = parseInt(input);\n    // Write your code here\n}\nsolve();",
            python: "import sys\ndef solve():\n    year = int(input())\n    # Write your code here\nif __name__ == '__main__': solve()",
            cpp: "#include <iostream>\nusing namespace std;\nint main() {\n    int year;\n    cin >> year;\n    // Write your code here\n    return 0;\n}",
            java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int year = sc.nextInt();\n        // Write your code here\n    }\n}"
        },
        testCases: generateBeautifulYear()
    }
];

// Write to JSON
const outputPath = path.join(__dirname, '../problems.json');
fs.writeFileSync(outputPath, JSON.stringify(allProblems, null, 2));
console.log(`✅ Generated ${allProblems.length} problems with test cases at ${outputPath}`);
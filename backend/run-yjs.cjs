// const path = require('path');
// const os = require('os');

// console.log("Attempting to start Yjs Server...");

// try {
//     // 1. Try to find the local installation
//     const serverPath = path.resolve(__dirname, 'node_modules', 'y-websocket', 'bin', 'server.js');
    
//     // 2. Execute it
//     require(serverPath);
    
// } catch (error) {
//     console.error("FAILED TO START YJS SERVER");
//     console.error("Error:", error.message);
//     console.log("\nTIP: Make sure you ran 'npm install y-websocket' inside the backend folder!");
// }

const path = require('path');
const fs = require('fs');

console.log("Attempting to start Yjs Server (v1.5.4)...");

// Point to the specific file in v1.5.4
const executablePath = path.resolve(__dirname, 'node_modules', 'y-websocket', 'bin', 'server.js');

if (fs.existsSync(executablePath)) {
    console.log(`Found executable at: ${executablePath}`);
    console.log("Starting server on port 1234...");
    require(executablePath);
} else {
    console.error("CRITICAL ERROR: Could not find server.js");
    console.error(`Checked path: ${executablePath}`);
    console.log("\nSolution: Run 'npm install y-websocket@1.5.4' inside the backend folder.");
}
// const path = require('path');
// const fs = require('fs');

// console.log("Attempting to start Yjs Server (v1.5.4)...");

// // Point to the specific file in v1.5.4
// const executablePath = path.resolve(__dirname, 'node_modules', 'y-websocket', 'bin', 'server.js');

// if (fs.existsSync(executablePath)) {
//     console.log(`Found executable at: ${executablePath}`);
//     console.log("Starting server on port 1234...");
//     require(executablePath);
// } else {
//     console.error("CRITICAL ERROR: Could not find server.js");
//     console.error(`Checked path: ${executablePath}`);
//     console.log("\nSolution: Run 'npm install y-websocket@1.5.4' inside the backend folder.");
// }












// FILE: backend/run-yjs.cjs
// PRODUCTION-OPTIMIZED YJS SERVER WITH CLUSTERING
const path = require('path');
const fs = require('fs');
const cluster = require('cluster');
const os = require('os');

// ✅ CONFIGURATION
const PORT = process.env.YJS_PORT || 1234;
const NUM_WORKERS = process.env.YJS_WORKERS || Math.min(os.cpus().length, 4); // Max 4 workers
const USE_CLUSTERING = process.env.YJS_CLUSTER === 'true' || false; // Enable with env var

console.log('═══════════════════════════════════════');
console.log('🚀 Starting Yjs WebSocket Server (v1.5.4)');
console.log('═══════════════════════════════════════');
console.log(`Port: ${PORT}`);
console.log(`Clustering: ${USE_CLUSTERING ? 'ENABLED' : 'DISABLED'}`);
console.log(`Workers: ${USE_CLUSTERING ? NUM_WORKERS : 1}`);
console.log('═══════════════════════════════════════\n');

const executablePath = path.resolve(__dirname, 'node_modules', 'y-websocket', 'bin', 'server.js');

if (!fs.existsSync(executablePath)) {
    console.error('❌ CRITICAL ERROR: server.js not found');
    console.error(`Checked path: ${executablePath}`);
    console.log('\n💡 Solution: Run "npm install y-websocket@1.5.4" inside backend folder\n');
    process.exit(1);
}

// ✅ CLUSTERING MODE (for production high-load)
if (USE_CLUSTERING && cluster.isMaster) {
    console.log(`[MASTER] 🎯 Master process ${process.pid} is running`);
    console.log(`[MASTER] 🔧 Spawning ${NUM_WORKERS} workers...\n`);

    // Fork workers
    for (let i = 0; i < NUM_WORKERS; i++) {
        const worker = cluster.fork({ WORKER_ID: i + 1 });
        console.log(`[MASTER] ✅ Worker ${i + 1} spawned (PID: ${worker.process.pid})`);
    }

    // Handle worker crashes
    cluster.on('exit', (worker, code, signal) => {
        console.error(`[MASTER] ⚠️ Worker ${worker.process.pid} died (${signal || code})`);
        console.log('[MASTER] 🔄 Spawning new worker...');
        
        const newWorker = cluster.fork();
        console.log(`[MASTER] ✅ New worker spawned (PID: ${newWorker.process.pid})`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('\n[MASTER] 🛑 SIGTERM received. Shutting down workers...');
        
        for (const id in cluster.workers) {
            cluster.workers[id].kill();
        }
    });

} else {
    // ✅ WORKER MODE (each worker runs its own Yjs server)
    const workerId = process.env.WORKER_ID || 'SOLO';
    console.log(`[WORKER ${workerId}] 🚀 Starting Yjs server on port ${PORT}...`);

    // Set PORT environment variable for y-websocket
    process.env.PORT = PORT;

    // Start the Yjs server
    require(executablePath);

    console.log(`[WORKER ${workerId}] ✅ Yjs server running (PID: ${process.pid})\n`);
}
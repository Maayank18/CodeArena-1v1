// ═══════════════════════════════════════════════════════════════
// FILE: backend/services/presenceTracker.js
// Real-Time User Presence & Activity Tracker
// Drop-in module — zero coupling to existing socket handlers.
// Swap `activeUsers` for a Redis client later without touching IO code.
// ═══════════════════════════════════════════════════════════════

// ✅ 1. LIVE REGISTRY — Map() keyed by socket.id for O(1) ops
const activeUsers = new Map();

// ✅ 2. BROADCASTER — Emits telemetry ONLY to admin_room every 3s
let _broadcastTimer = null;

/**
 * Attach presence tracking to an existing Socket.IO server instance.
 * Call once after `io` is created. Non-destructive — never overwrites
 * existing listeners; only registers NEW event names.
 *
 * @param {import('socket.io').Server} io
 */
function attachPresenceTracking(io) {
    // Guard: prevent double-init
    if (_broadcastTimer) return;

    // ── Interval Broadcaster (3 s) ─────────────────────────
    _broadcastTimer = setInterval(() => {
        const payload = Array.from(activeUsers.values());
        // Emit ONLY to sockets in 'admin_room'
        io.to('admin_room').emit('live_users_update', payload);
    }, 3000);

    // ── Socket-Level Handlers ──────────────────────────────
    io.on('connection', (socket) => {

        // — User announces presence ————————————————————————
        socket.on('user_connected', (data) => {
            const authUser = socket.data.user;
            activeUsers.set(socket.id, {
                socketId: socket.id,
                userId:   authUser?._id || data?.userId || null,
                username: authUser?.username || data?.username || 'Anonymous',
                avatar:   authUser?.avatar || data?.avatar || '',
                activity: data?.activity || 'IDLE_LOBBY',
                customization: authUser?.customization || data?.customization || {},
                connectedAt: Date.now(),
            });
        });

        // — Frontend reports route / feature change ————————
        socket.on('update_activity', ({ activity }) => {
            const entry = activeUsers.get(socket.id);
            if (entry && activity) {
                entry.activity = activity;
            }
        });

        // — Admin joins the telemetry room —————————————————
        socket.on('join_admin_room', () => {
            socket.join('admin_room');
            // Immediately push current snapshot so admin doesn't wait 3s
            socket.emit('live_users_update', Array.from(activeUsers.values()));
        });

        // — Graceful cleanup on disconnect —————————————————
        socket.on('disconnect', () => {
            activeUsers.delete(socket.id);
        });
    });
}

/**
 * Returns the current Map (useful for /health or REST endpoints).
 */
function getActiveUsers() {
    return activeUsers;
}

export { attachPresenceTracking, getActiveUsers };

// ═══════════════════════════════════════════════════════════════
// FILE: frontend/src/components/LiveUsersTable.jsx
// Admin-only real-time presence table.
// Subscribes to 'live_users_update' via 'admin_room'.
// ═══════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import {
    Users, Radio, ArrowUpDown, Swords, Map, Eye, Coffee,
    Shield, Search, Wifi, WifiOff
} from 'lucide-react';
import Avatar from './Avatar';
import { getStoredAuthToken, resolveBackendOrigin } from '../api.js';

// ── Activity badge config ─────────────────────────────────────
const ACTIVITY_META = {
    IDLE_LOBBY:       { label: 'Lobby',          color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',     icon: Coffee  },
    MATCHMAKING:      { label: 'Matchmaking',    color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',  icon: Search  },
    IN_MATCH:         { label: 'In Match',       color: 'bg-red-500/15 text-red-400 border-red-500/30',        icon: Swords  },
    CAMPAIGN_MAP:     { label: 'Campaign',       color: 'bg-purple-500/15 text-purple-400 border-purple-500/30', icon: Map   },
    ALGO_VISUALIZER:  { label: 'Visualizer',     color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',     icon: Eye     },
    ADMIN_PANEL:      { label: 'Admin',          color: 'bg-orange-500/15 text-orange-400 border-orange-500/30', icon: Shield },
};

const STACK_COLORS = {
    javascript: 'bg-yellow-400', typescript: 'bg-blue-400', python: 'bg-green-400',
    java: 'bg-red-400', cpp: 'bg-cyan-400', go: 'bg-sky-400', rust: 'bg-orange-400',
    kotlin: 'bg-purple-400', swift: 'bg-orange-300', csharp: 'bg-violet-400',
    ruby: 'bg-rose-400', dart: 'bg-teal-400',
};

const getFallback = () => ({ label: 'Unknown', color: 'bg-gray-700/20 text-gray-500 border-gray-600/30', icon: Coffee });

const ActivityBadge = ({ activity }) => {
    const meta = ACTIVITY_META[activity] || getFallback();
    const Icon = meta.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${meta.color} transition-all`}>
            <Icon size={12} />
            {meta.label}
        </span>
    );
};

const LiveUsersTable = () => {
    const [liveUsers, setLiveUsers] = useState([]);
    const [sortKey, setSortKey]     = useState('activity');
    const [sortDir, setSortDir]     = useState('asc');
    const [filter, setFilter]       = useState('');
    const [connected, setConnected] = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        const socketUrl = resolveBackendOrigin();
        const token = getStoredAuthToken();

        if (!token) {
            setConnected(false);
            return undefined;
        }

        socketRef.current = io(socketUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            auth: {
                token,
            },
        });

        socketRef.current.on('connect', () => {
            setConnected(true);
            socketRef.current.emit('join_admin_room');
        });
        socketRef.current.on('disconnect', () => setConnected(false));
        socketRef.current.on('live_users_update', (payload) => {
            if (Array.isArray(payload)) setLiveUsers(payload);
        });

        return () => {
            socketRef.current?.disconnect();
            socketRef.current = null;
        };
    }, []);

    const toggleSort = (key) => {
        if (sortKey === key) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('asc'); }
    };

    const processed = useMemo(() => {
        let data = [...liveUsers];
        if (filter) {
            const q = filter.toLowerCase();
            data = data.filter(u => u.username.toLowerCase().includes(q) || u.activity.toLowerCase().includes(q));
        }
        data.sort((a, b) => {
            const valA = (a[sortKey] || '').toString().toLowerCase();
            const valB = (b[sortKey] || '').toString().toLowerCase();
            const cmp = valA.localeCompare(valB);
            return sortDir === 'asc' ? cmp : -cmp;
        });
        return data;
    }, [liveUsers, filter, sortKey, sortDir]);

    const breakdown = useMemo(() => {
        const counts = {};
        liveUsers.forEach(u => { counts[u.activity] = (counts[u.activity] || 0) + 1; });
        return counts;
    }, [liveUsers]);

    const relTime = (ts) => {
        if (!ts) return '—';
        const diff = Math.floor((Date.now() - ts) / 1000);
        if (diff < 60)   return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        return `${Math.floor(diff / 3600)}h ago`;
    };

    const ColHeader = ({ label, field }) => (
        <th onClick={() => toggleSort(field)} className="text-left p-3.5 text-[10px] font-bold uppercase text-gray-500 tracking-wider cursor-pointer select-none hover:text-gray-300 transition-colors group">
            <span className="inline-flex items-center gap-1.5">
                {label}
                <ArrowUpDown size={12} className={`transition-colors ${sortKey === field ? 'text-accent' : 'text-gray-700 group-hover:text-gray-500'}`} />
            </span>
        </th>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="relative"><Radio size={18} className="text-accent" /><span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent rounded-full animate-ping" /></div>
                        <h3 className="text-lg font-bold text-white">Live Users</h3>
                    </div>
                    <span className="px-2.5 py-1 bg-accent/10 text-accent text-xs font-bold rounded-lg border border-accent/20">{new Set(liveUsers.map(u => u.username)).size} online</span>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold border ${connected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {connected ? <Wifi size={10} /> : <WifiOff size={10} />} {connected ? 'Live' : 'Disconnected'}
                    </span>
                </div>
                <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" /><input type="text" placeholder="Filter users..." value={filter} onChange={(e) => setFilter(e.target.value)} className="pl-9 pr-3 py-2 bg-black/40 border border-gray-800 rounded-lg text-sm focus:outline-none focus:border-accent/50 w-56 placeholder-gray-700 transition-all" /></div>
            </div>

            {Object.keys(breakdown).length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {Object.entries(breakdown).map(([activity, count]) => {
                        const meta = ACTIVITY_META[activity] || getFallback();
                        const Icon = meta.icon;
                        return (
                            <button key={activity} onClick={() => setFilter(prev => prev === activity ? '' : activity)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:scale-105 ${filter === activity ? 'ring-1 ring-accent/50 scale-105' : ''} ${meta.color}`}>
                                <Icon size={12} /> {meta.label} <span className="px-1.5 py-0.5 bg-black/30 rounded text-[10px] font-mono">{count}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-gray-800/60 bg-[#0a0a0a]/60">
                <table className="w-full min-w-[600px]">
                    <thead className="bg-black/40">
                        <tr className="border-b border-gray-800/60">
                            <ColHeader label="User" field="username" />
                            <ColHeader label="Activity" field="activity" />
                            <ColHeader label="Connected" field="connectedAt" />
                            <th className="text-left p-3.5 text-[10px] font-bold uppercase text-gray-500 tracking-wider">Socket ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processed.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-16 text-gray-600"><Users size={32} className="mx-auto mb-3 opacity-30" /><p className="text-sm font-medium">No users online</p></td></tr>
                        ) : (
                            processed.map((user, idx) => (
                                <tr key={user.socketId} className={`border-b border-gray-800/40 hover:bg-gray-800/20 transition-all ${idx % 2 === 0 ? 'bg-black/20' : ''}`}>
                                    <td className="p-3.5">
                                        <div className="flex items-center gap-3">
                                            <Avatar username={user.username} src={user.avatar} avatarFrame={user.customization?.avatarFrame} className="w-10 h-10" />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-white leading-tight">{user.username}</span>
                                                    <div className="flex gap-1">
                                                        {(user.customization?.signatureStack || []).map(lang => <div key={lang} className={`w-1.5 h-1.5 rounded-full ${STACK_COLORS[lang] || 'bg-gray-500'}`} />)}
                                                    </div>
                                                </div>
                                                <div className="text-[10px] text-gray-500 italic truncate max-w-[150px]">{user.customization?.tagline || 'No tagline'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3.5"><ActivityBadge activity={user.activity} /></td>
                                    <td className="p-3.5"><span className="text-xs text-gray-500 font-mono">{relTime(user.connectedAt)}</span></td>
                                    <td className="p-3.5"><code className="text-[10px] text-gray-600 font-mono bg-gray-900/50 px-2 py-1 rounded">{user.socketId?.slice(0, 12)}…</code></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LiveUsersTable;

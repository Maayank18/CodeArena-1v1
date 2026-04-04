// src/components/Campaign/WorldMap.jsx
// ─────────────────────────────────────────────────────────────────────────────
// V2 — Complete visual overhaul:
//   ✓ Drag-only panning (wheel zoom REMOVED per PRD)
//   ✓ Cubic Bezier curved paths instead of straight lines
//   ✓ Atmospheric glowing blobs per region (not rectangular boxes)
//   ✓ MMORPG-style glowing node circles
//   ✓ Animated orbiting ring on available nodes
//   ✓ Gold gradient glow scaling with star count (1/2/3)
//   ✓ Boss nodes: large, crimson pulsing glow
//   ✓ Animated travelling dot on completed edges
//   ✓ No external zoom library — pure CSS transform
// ─────────────────────────────────────────────────────────────────────────────

import React, { useRef, useState, useCallback, useMemo } from 'react';
import { Lock, Skull, Zap } from 'lucide-react';
import StarDisplay from './StarDisplay';

const MAP_W = 2000;
const MAP_H = 900;

const REGION_CFG = {
    Array_Archipelago:  { color: '#06b6d4', label: '🏝️ Array Archipelago',  glow: '#06b6d430' },
    String_Shores:      { color: '#8b5cf6', label: '🌊 String Shores',       glow: '#8b5cf630' },
    HashMap_Highlands:  { color: '#f97316', label: '⛰️ HashMap Highlands',   glow: '#f9731630' },
    Tree_Territory:     { color: '#22c55e', label: '🌲 Tree Territory',      glow: '#22c55e30' },
    Graph_Gorge:        { color: '#ef4444', label: '🗻 Graph Gorge',         glow: '#ef444430' },
    DP_Dungeon:         { color: '#a855f7', label: '🏰 DP Dungeon',          glow: '#a855f730' },
    Syntax_Shores:      { color: '#14b8a6', label: '🏖️ Syntax Shores',       glow: '#14b8a630' },
};

// Star field generated once at module load (no re-renders from Math.random)
const STAR_FIELD = Array.from({ length: 140 }, (_, i) => ({
    id: i,
    size: Math.random() * 2.2 + 0.4,
    top: Math.random() * 100,
    left: Math.random() * 100,
    opacity: Math.random() * 0.5 + 0.05,
    twinkle: Math.random() > 0.7,
    delay: Math.random() * 4,
}));

// Cubic bezier path string between two points
const bezierPath = (from, to) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const offset = Math.abs(dx) * 0.45 + Math.abs(dy) * 0.25;
    const cpx1 = from.x + Math.sign(dx) * offset;
    const cpy1 = from.y;
    const cpx2 = to.x - Math.sign(dx) * offset;
    const cpy2 = to.y;
    return `M ${from.x} ${from.y} C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${to.x} ${to.y}`;
};

function getNodeState(node, progress) {
    if (!progress) return { state: 'locked' };
    const completed = progress.completedNodes?.find(n => n.nodeId === node.nodeId);
    if (completed) return { state: 'completed', starsAwarded: completed.starsAwarded ?? 0, bestTimeMs: completed.bestTimeMs ?? null };
    if (progress.unlockedNodes?.includes(node.nodeId)) return { state: 'available' };
    return { state: 'locked' };
}

// Node sizes
const NODE_SIZE = { standard: 54, boss: 72, challenge: 60 };

const WorldMap = ({ nodes = [], progress, onNodeClick, selectedNodeId }) => {
    const containerRef = useRef(null);
    const [pan,      setPan]      = useState({ x: 60, y: 100 });
    const [zoom,     setZoom]     = useState(0.82);
    const [dragging, setDragging] = useState(false);
    const lastPos = useRef({ x: 0, y: 0 });

    // ── Node lookup map for O(1) edge rendering ────────────────────────────
    const nodeLookup = useMemo(() => {
        const m = new Map();
        nodes.forEach(n => { if (n?.nodeId) m.set(n.nodeId, n); });
        return m;
    }, [nodes]);

    const completedSet = useMemo(
        () => new Set(progress?.completedNodes?.map(n => n.nodeId) || []),
        [progress]
    );

    // ── Region bounding boxes for atmospheric blobs ────────────────────────
    const regionBounds = useMemo(() => {
        const b = {};
        nodes.forEach(n => {
            if (!n?.mapPosition || !n.region) return;
            if (!b[n.region]) b[n.region] = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
            b[n.region].minX = Math.min(b[n.region].minX, n.mapPosition.x);
            b[n.region].minY = Math.min(b[n.region].minY, n.mapPosition.y);
            b[n.region].maxX = Math.max(b[n.region].maxX, n.mapPosition.x);
            b[n.region].maxY = Math.max(b[n.region].maxY, n.mapPosition.y);
        });
        return b;
    }, [nodes]);

    // ── Bezier edge list ────────────────────────────────────────────────────
    const edges = useMemo(() => {
        const list = [];
        nodes.forEach(node => {
            if (!node?.mapPosition) return;
            node.prerequisites?.forEach(prereqId => {
                const from = nodeLookup.get(prereqId);
                if (!from?.mapPosition) return;
                const lit = completedSet.has(prereqId) && completedSet.has(node.nodeId);
                const cfg = REGION_CFG[node.region] || { color: '#4aee88' };
                list.push({ from: from.mapPosition, to: node.mapPosition, lit, color: cfg.color, id: `${prereqId}-${node.nodeId}` });
            });
        });
        return list;
    }, [nodes, nodeLookup, completedSet]);

    // ── Drag handlers ───────────────────────────────────────────────────────
    const onMouseDown = useCallback(e => {
        if (e.button !== 0) return;
        setDragging(true);
        lastPos.current = { x: e.clientX, y: e.clientY };
    }, []);

    const onMouseMove = useCallback(e => {
        if (!dragging) return;
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        lastPos.current = { x: e.clientX, y: e.clientY };
        setPan(p => ({ x: p.x + dx, y: p.y + dy }));
    }, [dragging]);

    const stopDrag = useCallback(() => setDragging(false), []);

    const onTouchStart = useCallback(e => {
        const t = e.touches[0];
        if (!t) return;
        lastPos.current = { x: t.clientX, y: t.clientY };
        setDragging(true);
    }, []);

    const onTouchMove = useCallback(e => {
        if (!dragging) return;
        const t = e.touches[0];
        if (!t) return;
        e.preventDefault();
        const dx = t.clientX - lastPos.current.x;
        const dy = t.clientY - lastPos.current.y;
        lastPos.current = { x: t.clientX, y: t.clientY };
        setPan(p => ({ x: p.x + dx, y: p.y + dy }));
    }, [dragging]);

    // NO onWheel handler — wheel zoom intentionally removed per PRD
    // Users pan by click-drag only; zoom via +/− buttons

    const tf = `translate(${pan.x}px,${pan.y}px) scale(${zoom})`;

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden select-none"
            style={{ background: 'radial-gradient(ellipse 160% 120% at 50% 60%, #080e1c 0%, #030508 100%)', cursor: dragging ? 'grabbing' : 'grab' }}
            onMouseDown={onMouseDown} onMouseMove={onMouseMove}
            onMouseUp={stopDrag}     onMouseLeave={stopDrag}
            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={stopDrag}
        >
            {/* ── Twinkling star field ──────────────────────────────────── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {STAR_FIELD.map(s => (
                    <div
                        key={s.id}
                        className="absolute rounded-full bg-white"
                        style={{
                            width: s.size, height: s.size,
                            top: `${s.top}%`, left: `${s.left}%`,
                            opacity: s.opacity,
                            animation: s.twinkle
                                ? `pulse ${2 + s.delay}s ease-in-out infinite alternate`
                                : 'none',
                            animationDelay: `${s.delay}s`,
                        }}
                    />
                ))}
            </div>

            {/* ── SVG canvas: blobs + bezier paths ─────────────────────── */}
            <svg
                className="absolute pointer-events-none"
                style={{ transform: tf, transformOrigin: '0 0', width: MAP_W, height: MAP_H, overflow: 'visible' }}
            >
                <defs>
                    {/* Radial gradient blobs per region */}
                    {/* {Object.entries(regionBounds).map(([region, b]) => {
                        const cfg = REGION_CFG[region];
                        if (!cfg) return null;
                        const pad = 90;
                        const cx = (b.minX + b.maxX) / 2;
                        const cy = (b.minY + b.maxY) / 2;
                        const rx = (b.maxX - b.minX) / 2 + pad;
                        const ry = (b.maxY - b.minY) / 2 + pad;
                        return (
                            <radialGradient key={region} id={`blob-${region}`} cx="50%" cy="50%" r="50%">
                                <stop offset="0%"   stopColor={cfg.color} stopOpacity="0.10" />
                                <stop offset="60%"  stopColor={cfg.color} stopOpacity="0.04" />
                                <stop offset="100%" stopColor={cfg.color} stopOpacity="0"    />
                            </radialGradient>
                        );
                    })} */}

                    {Object.entries(regionBounds).map(([region]) => {
                        const cfg = REGION_CFG[region];
                        if (!cfg) return null;

                        return (
                            <radialGradient key={region} id={`blob-${region}`} cx="50%" cy="50%" r="50%">
                                <stop offset="0%"   stopColor={cfg.color} stopOpacity="0.10" />
                                <stop offset="60%"  stopColor={cfg.color} stopOpacity="0.04" />
                                <stop offset="100%" stopColor={cfg.color} stopOpacity="0" />
                            </radialGradient>
                        );
                    })}

                    {/* Glow filter for lit edges */}
                    <filter id="edge-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                </defs>

                {/* Atmospheric region blobs */}
                {Object.entries(regionBounds).map(([region, b]) => {
                    const cfg = REGION_CFG[region];
                    if (!cfg) return null;
                    const pad = 90;
                    const cx = (b.minX + b.maxX) / 2;
                    const cy = (b.minY + b.maxY) / 2;
                    const rx = (b.maxX - b.minX) / 2 + pad;
                    const ry = (b.maxY - b.minY) / 2 + pad;
                    return (
                        <g key={region}>
                            <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#blob-${region})`} />
                            <text
                                x={b.minX - pad + 10}
                                y={b.minY - pad + 20}
                                fill={cfg.color}
                                fontSize="12"
                                fontWeight="800"
                                fontFamily="'JetBrains Mono', 'Fira Code', monospace"
                                opacity="0.55"
                                letterSpacing="0.5"
                            >
                                {cfg.label}
                            </text>
                        </g>
                    );
                })}

                {/* Bezier curved connection paths */}
                {edges.map(edge => {
                    const d = bezierPath(edge.from, edge.to);
                    return (
                        <g key={edge.id}>
                            {/* Base path */}
                            <path
                                d={d}
                                fill="none"
                                stroke={edge.lit ? edge.color : '#1e2533'}
                                strokeWidth={edge.lit ? 2.5 : 1.8}
                                strokeOpacity={edge.lit ? 0.6 : 0.55}
                                strokeLinecap="round"
                                strokeDasharray={edge.lit ? 'none' : '6 5'}
                            />
                            {/* Glow layer on lit edges */}
                            {edge.lit && (
                                <path d={d} fill="none" stroke={edge.color} strokeWidth="6" strokeOpacity="0.12" filter="url(#edge-glow)" />
                            )}
                            {/* Travelling dot on completed paths */}
                            {edge.lit && (
                                <circle r="4" fill={edge.color} opacity="0.95">
                                    <animateMotion dur="3.2s" repeatCount="indefinite" path={d} />
                                </circle>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* ── Node layer ────────────────────────────────────────────── */}
            <div
                className="absolute pointer-events-none"
                style={{ transform: tf, transformOrigin: '0 0', width: MAP_W, height: MAP_H }}
            >
                {nodes.map(node => {
                    if (!node?.mapPosition) return null;

                    const s          = getNodeState(node, progress);
                    const isBoss     = node.nodeType === 'boss';
                    const isLocked   = s.state === 'locked';
                    const isAvail    = s.state === 'available';
                    const isDone     = s.state === 'completed';
                    const stars      = s.starsAwarded || 0;
                    const isSel      = node.nodeId === selectedNodeId;
                    const sz         = NODE_SIZE[node.nodeType] || NODE_SIZE.standard;
                    const cfg        = REGION_CFG[node.region] || { color: '#4aee88' };
                    const { x, y }   = node.mapPosition;

                    // Visual recipe per state
                    let ring    = '#2a3040';
                    let fill    = 'radial-gradient(circle at 35% 35%, #111827, #07090f)';
                    let glow    = 'none';
                    let opacity = isLocked ? 0.38 : 1;

                    if (!isLocked) {
                        if (isBoss) {
                            ring = isDone ? '#f87171' : '#ef4444';
                            fill = isDone
                                ? 'radial-gradient(circle at 35% 35%, #4a1010, #1a0404)'
                                : 'radial-gradient(circle at 35% 35%, #2a0808, #0f0202)';
                            glow = `0 0 ${isDone ? 32 : 20}px ${isDone ? '#ef444460' : '#ef444435'}, 0 0 ${isDone ? 60 : 40}px ${isDone ? '#ef444420' : '#ef444415'}`;
                        } else if (isDone) {
                            const gs = { 1: ['#d97706','#2d1800'], 2: ['#f59e0b','#2d2000'], 3: ['#fbbf24','#1f1600'] };
                            const [gc, gbg] = gs[stars] || gs[1];
                            ring = gc;
                            fill = `radial-gradient(circle at 35% 35%, ${gbg}, #09080000)`;
                            glow = stars === 3
                                ? `0 0 28px ${gc}80, 0 0 55px ${gc}30`
                                : `0 0 18px ${gc}60`;
                        } else {
                            // available
                            ring = cfg.color;
                            fill = `radial-gradient(circle at 35% 35%, ${cfg.color}28, ${cfg.color}08)`;
                            glow = `0 0 20px ${cfg.color}55, 0 0 40px ${cfg.color}20`;
                        }
                    }

                    return (
                        <div
                            key={node.nodeId}
                            className="pointer-events-auto absolute flex flex-col items-center"
                            style={{ left: x - sz / 2, top: y - sz / 2, zIndex: isSel ? 30 : 10, opacity }}
                        >
                            {/* Outer pulse ring for available nodes */}
                            {isAvail && (
                                <div
                                    className="absolute rounded-full"
                                    style={{
                                        width: sz + 20, height: sz + 20,
                                        top: -10, left: -10,
                                        border: `2px solid ${cfg.color}50`,
                                        animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite',
                                        borderRadius: '50%',
                                    }}
                                />
                            )}

                            {/* Selection ring */}
                            {isSel && (
                                <div
                                    className="absolute rounded-full"
                                    style={{
                                        width: sz + 14, height: sz + 14,
                                        top: -7, left: -7,
                                        border: '2px solid rgba(255,255,255,0.45)',
                                        borderRadius: '50%',
                                    }}
                                />
                            )}

                            {/* Main node circle */}
                            <div
                                className="relative flex items-center justify-center rounded-full border-2 transition-all duration-150"
                                style={{
                                    width: sz, height: sz,
                                    background: fill,
                                    borderColor: ring,
                                    boxShadow: glow,
                                    cursor: isLocked ? 'not-allowed' : 'pointer',
                                    transform: isSel ? 'scale(1.15)' : 'scale(1)',
                                }}
                                onClick={() => !isLocked && onNodeClick?.(node)}
                            >
                                {/* Boss inner glow core */}
                                {isBoss && !isLocked && (
                                    <div className="absolute inset-2 rounded-full opacity-20" style={{ background: '#ef4444', filter: 'blur(8px)' }} />
                                )}

                                {/* Node icon */}
                                {isLocked ? (
                                    <Lock size={isBoss ? 24 : 18} className="text-gray-700" />
                                ) : isBoss ? (
                                    <div className="flex flex-col items-center gap-0.5">
                                        <Skull size={isDone ? 20 : 24} style={{ color: isDone ? '#fca5a5' : '#f87171', filter: `drop-shadow(0 0 6px ${isDone ? '#f8717180' : '#ef444460'})` }} />
                                        {isDone && <StarDisplay stars={stars} total={3} size="sm" />}
                                    </div>
                                ) : isDone ? (
                                    <div className="flex flex-col items-center gap-0.5">
                                        <StarDisplay stars={stars} total={3} size="sm" />
                                    </div>
                                ) : (
                                    <div className="relative flex items-center justify-center">
                                        <div className="w-3.5 h-3.5 rounded-full animate-pulse" style={{ background: cfg.color, boxShadow: `0 0 12px ${cfg.color}` }} />
                                    </div>
                                )}
                            </div>

                            {/* Node label */}
                            <div
                                className="mt-2 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono whitespace-nowrap truncate max-w-[88px] text-center"
                                style={{
                                    background: 'rgba(0,0,0,0.7)',
                                    backdropFilter: 'blur(4px)',
                                    color: isLocked ? '#374151' : isDone ? '#fbbf24' : isBoss ? '#f87171' : cfg.color,
                                    border: `1px solid ${isLocked ? '#1f2937' : isDone ? '#92400e30' : isBoss ? '#7f1d1d30' : cfg.color + '25'}`,
                                }}
                            >
                                {node.problemId?.title?.split(' ').slice(0, 3).join(' ') || node.nodeId}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Zoom controls (only method of zooming) ────────────────── */}
            <div className="absolute bottom-5 right-5 z-30 flex flex-col gap-1.5 pointer-events-auto">
                {[
                    { label: '+', fn: () => setZoom(z => Math.min(z * 1.18, 3)) },
                    { label: '⟳', fn: () => { setZoom(0.82); setPan({ x: 60, y: 100 }); } },
                    { label: '−', fn: () => setZoom(z => Math.max(z * 0.85, 0.3)) },
                ].map(b => (
                    <button
                        key={b.label}
                        onClick={b.fn}
                        className="w-9 h-9 bg-[#0d1117]/90 border border-gray-800/60 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 font-bold text-sm flex items-center justify-center transition-all hover:border-gray-600"
                    >
                        {b.label}
                    </button>
                ))}
            </div>

            {/* ── Legend ───────────────────────────────────────────────── */}
            <div className="absolute bottom-5 left-5 z-30 pointer-events-none bg-[#060810]/80 border border-gray-800/50 rounded-2xl px-4 py-3.5 text-[10px] space-y-2.5 backdrop-blur-md">
                {[
                    { dot: 'bg-gray-800 border-gray-700', icon: <Lock size={7} className="text-gray-600" />, label: 'Locked'    },
                    { dot: null, color: '#06b6d4',   label: 'Available'  },
                    { dot: null, color: '#fbbf24',   label: 'Completed'  },
                    { dot: null, color: '#ef4444',   label: 'Boss Node'  },
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                        <div
                            className="w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0"
                            style={item.color
                                ? { borderColor: item.color, background: item.color + '22', boxShadow: `0 0 6px ${item.color}50` }
                                : { borderColor: '#374151', background: '#111827' }
                            }
                        >
                            {item.icon}
                        </div>
                        <span className="text-gray-500 font-medium">{item.label}</span>
                    </div>
                ))}
                <div className="pt-1.5 border-t border-gray-800/60 text-gray-700">
                    Drag to pan · Use +/− to zoom
                </div>
            </div>

            {/* Global pulse keyframes */}
            <style>{`
                @keyframes ping {
                    75%, 100% { transform: scale(1.45); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default WorldMap;
// // src/components/Campaign/WorldMap.jsx
// import React, { useRef, useState, useCallback, useMemo } from 'react';
// import { Lock, Skull, Star } from 'lucide-react';
// import StarDisplay from './StarDisplay';

// const MAP_W = 2000;
// const MAP_H = 780;

// const REGION_CFG = {
//     Array_Archipelago: { color: '#0ea5e9', label: '🏝️ Array Archipelago' },
//     String_Shores:     { color: '#7c3aed', label: '🌊 String Shores'     },
//     HashMap_Highlands: { color: '#ea580c', label: '⛰️ HashMap Highlands' },
//     Tree_Territory:    { color: '#16a34a', label: '🌲 Tree Territory'    },
//     Graph_Gorge:       { color: '#dc2626', label: '🗻 Graph Gorge'       },
//     DP_Dungeon:        { color: '#9333ea', label: '🏰 DP Dungeon'        },
// };

// function getNodeState(node, progress) {
//     if (!progress) return 'locked';
//     const done = progress.completedNodes?.find(n => n.nodeId === node.nodeId);
//     if (done) return { state: 'completed', stars: done.starsAwarded, bestTimeMs: done.bestTimeMs };
//     if (progress.unlockedNodes?.includes(node.nodeId)) return { state: 'available' };
//     return 'locked';
// }

// const WorldMap = ({ nodes = [], progress, onNodeClick, selectedNodeId }) => {
//     const containerRef = useRef(null);
//     const [pan, setPan]   = useState({ x: 40, y: 80 });
//     const [zoom, setZoom] = useState(0.85);
//     const [dragging, setDragging] = useState(false);
//     const lastPos = useRef({ x: 0, y: 0 });

//     // Background star field — memoized so it doesn't regenerate on every render
//     const stars = useMemo(() =>
//         Array.from({ length: 90 }, (_, i) => ({
//             id: i,
//             w:  Math.random() * 2.5 + 0.5,
//             top:  Math.random() * 100,
//             left: Math.random() * 100,
//             opacity: Math.random() * 0.45 + 0.08,
//         })),
//         []
//     );

//     // Mouse pan
//     const onMouseDown = useCallback((e) => {
//         if (e.button !== 0) return;
//         setDragging(true);
//         lastPos.current = { x: e.clientX, y: e.clientY };
//     }, []);
//     const onMouseMove = useCallback((e) => {
//         if (!dragging) return;
//         const dx = e.clientX - lastPos.current.x;
//         const dy = e.clientY - lastPos.current.y;
//         lastPos.current = { x: e.clientX, y: e.clientY };
//         setPan(p => ({ x: p.x + dx, y: p.y + dy }));
//     }, [dragging]);
//     const onMouseUp = useCallback(() => setDragging(false), []);

//     // Touch pan
//     const onTouchStart = useCallback((e) => {
//         const t = e.touches[0];
//         lastPos.current = { x: t.clientX, y: t.clientY };
//         setDragging(true);
//     }, []);
//     const onTouchMove = useCallback((e) => {
//         if (!dragging) return;
//         e.preventDefault();
//         const t = e.touches[0];
//         const dx = t.clientX - lastPos.current.x;
//         const dy = t.clientY - lastPos.current.y;
//         lastPos.current = { x: t.clientX, y: t.clientY };
//         setPan(p => ({ x: p.x + dx, y: p.y + dy }));
//     }, [dragging]);
//     const onTouchEnd = useCallback(() => setDragging(false), []);

//     // Wheel zoom
//     const onWheel = useCallback((e) => {
//         e.preventDefault();
//         const delta = e.deltaY > 0 ? 0.92 : 1.08;
//         setZoom(z => Math.min(Math.max(z * delta, 0.35), 2.8));
//     }, []);

//     // Compute region bounding boxes from actual node positions
//     const regionBounds = useMemo(() => {
//         const bounds = {};
//         nodes.forEach(n => {
//             if (!n?.mapPosition) return;
//             const r = n.region;
//             if (!bounds[r]) bounds[r] = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
//             bounds[r].minX = Math.min(bounds[r].minX, n.mapPosition.x);
//             bounds[r].minY = Math.min(bounds[r].minY, n.mapPosition.y);
//             bounds[r].maxX = Math.max(bounds[r].maxX, n.mapPosition.x);
//             bounds[r].maxY = Math.max(bounds[r].maxY, n.mapPosition.y);
//         });
//         return bounds;
//     }, [nodes]);

//     // Build edges (connection lines)
//     const edges = useMemo(() => {
//         const list = [];
//         nodes.forEach(node => {
//             if (!node?.mapPosition) return;
//             node.prerequisites?.forEach(prereqId => {
//                 const from = nodes.find(n => n.nodeId === prereqId);
//                 if (!from?.mapPosition) return;
//                 const fromDone = progress?.completedNodes?.some(c => c.nodeId === prereqId);
//                 const toDone   = progress?.completedNodes?.some(c => c.nodeId === node.nodeId);
//                 list.push({ from: from.mapPosition, to: node.mapPosition, lit: fromDone && toDone });
//             });
//         });
//         return list;
//     }, [nodes, progress]);

//     const tf = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
//     const tfOrigin = '0 0';

//     return (
//         <div
//             ref={containerRef}
//             className="relative w-full h-full overflow-hidden select-none"
//             style={{
//                 background: 'radial-gradient(ellipse 120% 120% at 50% 40%, #080d1a 0%, #040608 100%)',
//                 cursor: dragging ? 'grabbing' : 'grab',
//             }}
//             onMouseDown={onMouseDown} onMouseMove={onMouseMove}
//             onMouseUp={onMouseUp}    onMouseLeave={onMouseUp}
//             onWheel={onWheel}
//             onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
//         >
//             {/* Star field */}
//             <div className="absolute inset-0 pointer-events-none">
//                 {stars.map(s => (
//                     <div key={s.id} className="absolute rounded-full bg-white" style={{
//                         width: s.w, height: s.w, top: s.top + '%', left: s.left + '%', opacity: s.opacity
//                     }} />
//                 ))}
//             </div>

//             {/* SVG layer: region zones + connection lines */}
//             <svg
//                 className="absolute pointer-events-none"
//                 style={{ transform: tf, transformOrigin: tfOrigin, width: MAP_W, height: MAP_H, overflow: 'visible' }}
//             >
//                 {/* Region areas */}
//                 {Object.entries(regionBounds).map(([region, b]) => {
//                     const cfg = REGION_CFG[region];
//                     if (!cfg) return null;
//                     const pad = 64;
//                     return (
//                         <g key={region}>
//                             <rect
//                                 x={b.minX - pad} y={b.minY - pad}
//                                 width={b.maxX - b.minX + pad * 2}
//                                 height={b.maxY - b.minY + pad * 2}
//                                 rx="24"
//                                 fill={`${cfg.color}09`}
//                                 stroke={cfg.color}
//                                 strokeWidth="1.5"
//                                 strokeOpacity="0.25"
//                                 strokeDasharray="10 5"
//                             />
//                             <text
//                                 x={b.minX - pad + 14}
//                                 y={b.minY - pad + 24}
//                                 fill={cfg.color}
//                                 fontSize="13"
//                                 fontWeight="bold"
//                                 fontFamily="'JetBrains Mono', 'Fira Code', monospace"
//                                 opacity="0.65"
//                             >
//                                 {cfg.label}
//                             </text>
//                         </g>
//                     );
//                 })}

//                 {/* Connection lines */}
//                 {edges.map((e, i) => (
//                     <g key={i}>
//                         <line
//                             x1={e.from.x} y1={e.from.y} x2={e.to.x} y2={e.to.y}
//                             stroke={e.lit ? '#4aee88' : '#1f2937'}
//                             strokeWidth={e.lit ? 3 : 2}
//                             strokeOpacity={e.lit ? 0.55 : 0.7}
//                             strokeLinecap="round"
//                         />
//                         {e.lit && (
//                             <circle r="3.5" fill="#4aee88" opacity="0.9">
//                                 <animateMotion
//                                     dur="2.8s" repeatCount="indefinite"
//                                     path={`M${e.from.x},${e.from.y} L${e.to.x},${e.to.y}`}
//                                 />
//                             </circle>
//                         )}
//                     </g>
//                 ))}
//             </svg>

//             {/* Node layer */}
//             <div
//                 className="absolute pointer-events-none"
//                 style={{ transform: tf, transformOrigin: tfOrigin, width: MAP_W, height: MAP_H }}
//             >
//                 {nodes.map(node => {
//                     if (!node?.mapPosition) return null;
//                     const state    = getNodeState(node, progress);
//                     const isBoss   = node.nodeType === 'boss';
//                     const isLocked = state === 'locked';
//                     const isAvail  = !isLocked && (typeof state === 'object' ? state.state === 'available' : false);
//                     const isDone   = !isLocked && (typeof state === 'object' ? state.state === 'completed' : false);
//                     const nodeStars = isDone ? state.stars : 0;
//                     const isSel    = node.nodeId === selectedNodeId;
//                     const sz       = isBoss ? 68 : 52;
//                     const cfg      = REGION_CFG[node.region] || { color: '#4aee88' };
//                     const mapX     = node.mapPosition.x ?? 0;
//                     const mapY     = node.mapPosition.y ?? 0;

//                     // Node visual style
//                     let bg     = '#111';
//                     let border = '#374151';
//                     let shadow = 'none';
//                     let opacity = isLocked ? 0.45 : 1;

//                     if (!isLocked) {
//                         if (isBoss) {
//                             bg     = isDone ? '#4a1010' : '#1a0505';
//                             border = isDone ? '#f87171' : '#ef4444';
//                             shadow = `0 0 ${isDone ? 18 : 14}px ${isDone ? '#ef444450' : '#ef444430'}`;
//                         } else if (isDone) {
//                             const goldMap = { 1: ['#2d1800', '#d97706'], 2: ['#2d1f00', '#f59e0b'], 3: ['#1f1500', '#fbbf24'] };
//                             const [gbg, gbr] = goldMap[nodeStars] || goldMap[1];
//                             bg     = gbg;
//                             border = gbr;
//                             shadow = `0 0 ${nodeStars === 3 ? 22 : 12}px ${gbr}55`;
//                         } else {
//                             // Available
//                             bg     = cfg.color + '18';
//                             border = cfg.color;
//                             shadow = `0 0 16px ${cfg.color}40`;
//                         }
//                     }

//                     return (
//                         <div
//                             key={node.nodeId}
//                             className="pointer-events-auto absolute flex flex-col items-center"
//                             style={{
//                                 left: mapX - sz / 2,
//                                 top:  mapY - sz / 2,
//                                 zIndex: isSel ? 30 : 10,
//                                 opacity,
//                             }}
//                         >
//                             {/* Node circle */}
//                             <div
//                                 className="relative flex items-center justify-center rounded-full border-2 transition-transform duration-150"
//                                 style={{
//                                     width: sz, height: sz,
//                                     background: bg,
//                                     borderColor: border,
//                                     boxShadow: isSel
//                                         ? `0 0 0 3px #fff5, ${shadow}`
//                                         : shadow,
//                                     cursor: isLocked ? 'not-allowed' : 'pointer',
//                                     transform: isSel ? 'scale(1.12)' : 'scale(1)',
//                                 }}
//                                 onClick={() => !isLocked && onNodeClick(node)}
//                             >
//                                 {/* Pulse ring for available */}
//                                 {isAvail && (
//                                     <div
//                                         className="absolute inset-0 rounded-full border-2 animate-ping"
//                                         style={{ borderColor: cfg.color + '50', animationDuration: '2s' }}
//                                     />
//                                 )}

//                                 {/* Icon */}
//                                 {isLocked ? (
//                                     <Lock size={isBoss ? 22 : 18} className="text-gray-600" />
//                                 ) : isBoss ? (
//                                     <Skull size={isDone ? 20 : 22} style={{ color: isDone ? '#fca5a5' : '#f87171' }} />
//                                 ) : isDone ? (
//                                     <div className="flex flex-col items-center gap-0.5 px-1">
//                                         <StarDisplay stars={nodeStars} total={3} size="sm" />
//                                     </div>
//                                 ) : (
//                                     <div
//                                         className="w-3 h-3 rounded-full animate-pulse"
//                                         style={{ background: cfg.color }}
//                                     />
//                                 )}
//                             </div>

//                             {/* Node label (always visible) */}
//                             <div
//                                 className="mt-1.5 px-2 py-0.5 rounded text-[9px] font-bold font-mono whitespace-nowrap truncate max-w-[90px]"
//                                 style={{
//                                     background: '#00000080',
//                                     color: isLocked ? '#4b5563' : isDone ? '#fbbf24' : cfg.color,
//                                 }}
//                             >
//                                 {node.problemId?.title?.split(' ').slice(0, 2).join(' ') || node.nodeId}
//                             </div>
//                         </div>
//                     );
//                 })}
//             </div>

//             {/* Zoom controls */}
//             <div className="absolute bottom-4 right-4 z-30 flex flex-col gap-1.5 pointer-events-auto">
//                 {[
//                     { label: '+', action: () => setZoom(z => Math.min(z * 1.2, 2.8)) },
//                     { label: '⟳', action: () => { setZoom(0.85); setPan({ x: 40, y: 80 }); } },
//                     { label: '−', action: () => setZoom(z => Math.max(z * 0.83, 0.35)) },
//                 ].map(b => (
//                     <button
//                         key={b.label}
//                         onClick={b.action}
//                         className="w-9 h-9 bg-[#0d1117]/90 border border-gray-700/60 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 font-bold text-base flex items-center justify-center transition-colors"
//                     >
//                         {b.label}
//                     </button>
//                 ))}
//             </div>

//             {/* Legend */}
//             <div className="absolute bottom-4 left-4 z-30 pointer-events-none bg-[#07090f]/85 border border-gray-800/60 rounded-xl p-3 text-[10px] space-y-2 backdrop-blur-sm">
//                 {[
//                     { node: <div className="w-4 h-4 rounded-full border-2 border-gray-700 bg-gray-900 opacity-50 flex items-center justify-center"><Lock size={8} className="text-gray-600" /></div>, label: 'Locked' },
//                     { node: <div className="w-4 h-4 rounded-full border-2 border-accent bg-accent/15 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-accent" /></div>, label: 'Available' },
//                     { node: <div className="w-4 h-4 rounded-full border-2 border-amber-400 bg-amber-950/40 flex items-center justify-center"><Star size={8} className="fill-amber-400 text-amber-400" /></div>, label: 'Completed' },
//                     { node: <div className="w-4 h-4 rounded-full border-2 border-red-500 bg-red-950/40 flex items-center justify-center"><Skull size={8} className="text-red-400" /></div>, label: 'Boss' },
//                 ].map((l, i) => (
//                     <div key={i} className="flex items-center gap-2">
//                         {l.node}
//                         <span className="text-gray-500">{l.label}</span>
//                     </div>
//                 ))}
//                 <div className="pt-1 border-t border-gray-800 text-gray-700 leading-relaxed">
//                     Drag to pan · Scroll to zoom
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default WorldMap;



















































// src/components/Campaign/WorldMap.jsx
import React, { useRef, useState, useCallback, useMemo } from 'react';
import { Lock, Skull, Star } from 'lucide-react';
import StarDisplay from './StarDisplay';

const MAP_W = 2000;
const MAP_H = 780;
const STAR_COUNT = 90;

const REGION_CFG = {
    Array_Archipelago: { color: '#0ea5e9', label: '🏝️ Array Archipelago' },
    String_Shores:     { color: '#7c3aed', label: '🌊 String Shores' },
    HashMap_Highlands: { color: '#ea580c', label: '⛰️ HashMap Highlands' },
    Tree_Territory:    { color: '#16a34a', label: '🌲 Tree Territory' },
    Graph_Gorge:       { color: '#dc2626', label: '🗻 Graph Gorge' },
    DP_Dungeon:        { color: '#9333ea', label: '🏰 DP Dungeon' },
};

const generateStars = (count) =>
    Array.from({ length: count }, (_, i) => ({
        id: i,
        size: Math.random() * 2.5 + 0.5,
        top: Math.random() * 100,
        left: Math.random() * 100,
        opacity: Math.random() * 0.45 + 0.08,
    }));

// Generated once at module load so React never sees Math.random() during render.
const STAR_FIELD = generateStars(STAR_COUNT);

function getNodeState(node, progress) {
    if (!progress) return { state: 'locked' };

    const completed = progress.completedNodes?.find((n) => n.nodeId === node.nodeId);
    if (completed) {
        return {
            state: 'completed',
            starsAwarded: completed.starsAwarded ?? 0,
            bestTimeMs: completed.bestTimeMs ?? null,
        };
    }

    if (progress.unlockedNodes?.includes(node.nodeId)) {
        return { state: 'available' };
    }

    return { state: 'locked' };
}

const WorldMap = ({ nodes = [], progress, onNodeClick, selectedNodeId }) => {
    const containerRef = useRef(null);
    const [pan, setPan] = useState({ x: 40, y: 80 });
    const [zoom, setZoom] = useState(0.85);
    const [dragging, setDragging] = useState(false);
    const lastPos = useRef({ x: 0, y: 0 });

    const nodeLookup = useMemo(() => {
        const map = new Map();
        nodes.forEach((node) => {
            if (node?.nodeId) map.set(node.nodeId, node);
        });
        return map;
    }, [nodes]);

    const completedNodeSet = useMemo(() => {
        return new Set(progress?.completedNodes?.map((n) => n.nodeId) || []);
    }, [progress]);

    const regionBounds = useMemo(() => {
        const bounds = {};

        nodes.forEach((n) => {
            if (!n?.mapPosition || !n.region) return;

            if (!bounds[n.region]) {
                bounds[n.region] = {
                    minX: Infinity,
                    minY: Infinity,
                    maxX: -Infinity,
                    maxY: -Infinity,
                };
            }

            const b = bounds[n.region];
            b.minX = Math.min(b.minX, n.mapPosition.x);
            b.minY = Math.min(b.minY, n.mapPosition.y);
            b.maxX = Math.max(b.maxX, n.mapPosition.x);
            b.maxY = Math.max(b.maxY, n.mapPosition.y);
        });

        return bounds;
    }, [nodes]);

    const edges = useMemo(() => {
        const list = [];

        nodes.forEach((node) => {
            if (!node?.mapPosition) return;

            node.prerequisites?.forEach((prereqId) => {
                const fromNode = nodeLookup.get(prereqId);
                if (!fromNode?.mapPosition) return;

                const lit = completedNodeSet.has(prereqId) && completedNodeSet.has(node.nodeId);

                list.push({
                    from: fromNode.mapPosition,
                    to: node.mapPosition,
                    lit,
                });
            });
        });

        return list;
    }, [nodes, nodeLookup, completedNodeSet]);

    const onMouseDown = useCallback((e) => {
        if (e.button !== 0) return;
        setDragging(true);
        lastPos.current = { x: e.clientX, y: e.clientY };
    }, []);

    const onMouseMove = useCallback((e) => {
        if (!dragging) return;
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;

        lastPos.current = { x: e.clientX, y: e.clientY };
        setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    }, [dragging]);

    const stopDragging = useCallback(() => {
        setDragging(false);
    }, []);

    const onTouchStart = useCallback((e) => {
        const t = e.touches[0];
        if (!t) return;
        lastPos.current = { x: t.clientX, y: t.clientY };
        setDragging(true);
    }, []);

    const onTouchMove = useCallback((e) => {
        if (!dragging) return;
        const t = e.touches[0];
        if (!t) return;

        e.preventDefault();
        const dx = t.clientX - lastPos.current.x;
        const dy = t.clientY - lastPos.current.y;

        lastPos.current = { x: t.clientX, y: t.clientY };
        setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    }, [dragging]);

    const onTouchEnd = useCallback(() => {
        setDragging(false);
    }, []);

    const onWheel = useCallback((e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.92 : 1.08;
        setZoom((z) => Math.min(Math.max(z * delta, 0.35), 2.8));
    }, []);

    const handleResetView = useCallback(() => {
        setZoom(0.85);
        setPan({ x: 40, y: 80 });
    }, []);

    const transformStyle = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden select-none"
            style={{
                background: 'radial-gradient(ellipse 120% 120% at 50% 40%, #080d1a 0%, #040608 100%)',
                cursor: dragging ? 'grabbing' : 'grab',
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={stopDragging}
            onMouseLeave={stopDragging}
            onWheel={onWheel}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Star field */}
            <div className="absolute inset-0 pointer-events-none">
                {STAR_FIELD.map((star) => (
                    <div
                        key={star.id}
                        className="absolute rounded-full bg-white"
                        style={{
                            width: star.size,
                            height: star.size,
                            top: `${star.top}%`,
                            left: `${star.left}%`,
                            opacity: star.opacity,
                        }}
                    />
                ))}
            </div>

            {/* SVG layer: region zones + connection lines */}
            <svg
                className="absolute pointer-events-none"
                style={{
                    transform: transformStyle,
                    transformOrigin: '0 0',
                    width: MAP_W,
                    height: MAP_H,
                    overflow: 'visible',
                }}
            >
                {/* Region areas */}
                {Object.entries(regionBounds).map(([region, b]) => {
                    const cfg = REGION_CFG[region];
                    if (!cfg) return null;

                    const pad = 64;

                    return (
                        <g key={region}>
                            <rect
                                x={b.minX - pad}
                                y={b.minY - pad}
                                width={b.maxX - b.minX + pad * 2}
                                height={b.maxY - b.minY + pad * 2}
                                rx="24"
                                fill={`${cfg.color}09`}
                                stroke={cfg.color}
                                strokeWidth="1.5"
                                strokeOpacity="0.25"
                                strokeDasharray="10 5"
                            />
                            <text
                                x={b.minX - pad + 14}
                                y={b.minY - pad + 24}
                                fill={cfg.color}
                                fontSize="13"
                                fontWeight="bold"
                                fontFamily="'JetBrains Mono', 'Fira Code', monospace"
                                opacity="0.65"
                            >
                                {cfg.label}
                            </text>
                        </g>
                    );
                })}

                {/* Connection lines */}
                {edges.map((edge, i) => (
                    <g key={i}>
                        <line
                            x1={edge.from.x}
                            y1={edge.from.y}
                            x2={edge.to.x}
                            y2={edge.to.y}
                            stroke={edge.lit ? '#4aee88' : '#1f2937'}
                            strokeWidth={edge.lit ? 3 : 2}
                            strokeOpacity={edge.lit ? 0.55 : 0.7}
                            strokeLinecap="round"
                        />
                        {edge.lit && (
                            <circle r="3.5" fill="#4aee88" opacity="0.9">
                                <animateMotion
                                    dur="2.8s"
                                    repeatCount="indefinite"
                                    path={`M${edge.from.x},${edge.from.y} L${edge.to.x},${edge.to.y}`}
                                />
                            </circle>
                        )}
                    </g>
                ))}
            </svg>

            {/* Node layer */}
            <div
                className="absolute pointer-events-none"
                style={{
                    transform: transformStyle,
                    transformOrigin: '0 0',
                    width: MAP_W,
                    height: MAP_H,
                }}
            >
                {nodes.map((node) => {
                    if (!node?.mapPosition) return null;

                    const state = getNodeState(node, progress);
                    const isBoss = node.nodeType === 'boss';
                    const isLocked = state.state === 'locked';
                    const isAvailable = state.state === 'available';
                    const isDone = state.state === 'completed';
                    const nodeStars = state.starsAwarded || 0;
                    const isSelected = node.nodeId === selectedNodeId;
                    const size = isBoss ? 68 : 52;
                    const cfg = REGION_CFG[node.region] || { color: '#4aee88' };

                    const mapX = node.mapPosition.x ?? 0;
                    const mapY = node.mapPosition.y ?? 0;

                    let bg = '#111';
                    let border = '#374151';
                    let shadow = 'none';
                    let opacity = isLocked ? 0.45 : 1;

                    if (!isLocked) {
                        if (isBoss) {
                            bg = isDone ? '#4a1010' : '#1a0505';
                            border = isDone ? '#f87171' : '#ef4444';
                            shadow = `0 0 ${isDone ? 18 : 14}px ${isDone ? '#ef444450' : '#ef444430'}`;
                        } else if (isDone) {
                            const goldMap = {
                                1: ['#2d1800', '#d97706'],
                                2: ['#2d1f00', '#f59e0b'],
                                3: ['#1f1500', '#fbbf24'],
                            };
                            const [doneBg, doneBorder] = goldMap[nodeStars] || goldMap[1];
                            bg = doneBg;
                            border = doneBorder;
                            shadow = `0 0 ${nodeStars === 3 ? 22 : 12}px ${doneBorder}55`;
                        } else {
                            bg = `${cfg.color}18`;
                            border = cfg.color;
                            shadow = `0 0 16px ${cfg.color}40`;
                        }
                    }

                    return (
                        <div
                            key={node.nodeId}
                            className="pointer-events-auto absolute flex flex-col items-center"
                            style={{
                                left: mapX - size / 2,
                                top: mapY - size / 2,
                                zIndex: isSelected ? 30 : 10,
                                opacity,
                            }}
                        >
                            <div
                                className="relative flex items-center justify-center rounded-full border-2 transition-transform duration-150"
                                style={{
                                    width: size,
                                    height: size,
                                    background: bg,
                                    borderColor: border,
                                    boxShadow: isSelected ? `0 0 0 3px #fff5, ${shadow}` : shadow,
                                    cursor: isLocked ? 'not-allowed' : 'pointer',
                                    transform: isSelected ? 'scale(1.12)' : 'scale(1)',
                                }}
                                onClick={() => !isLocked && onNodeClick?.(node)}
                            >
                                {isAvailable && (
                                    <div
                                        className="absolute inset-0 rounded-full border-2 animate-ping"
                                        style={{ borderColor: `${cfg.color}50`, animationDuration: '2s' }}
                                    />
                                )}

                                {isLocked ? (
                                    <Lock size={isBoss ? 22 : 18} className="text-gray-600" />
                                ) : isBoss ? (
                                    <Skull
                                        size={isDone ? 20 : 22}
                                        style={{ color: isDone ? '#fca5a5' : '#f87171' }}
                                    />
                                ) : isDone ? (
                                    <div className="flex flex-col items-center gap-0.5 px-1">
                                        <StarDisplay stars={nodeStars} total={3} size="sm" />
                                    </div>
                                ) : (
                                    <div
                                        className="w-3 h-3 rounded-full animate-pulse"
                                        style={{ background: cfg.color }}
                                    />
                                )}
                            </div>

                            <div
                                className="mt-1.5 px-2 py-0.5 rounded text-[9px] font-bold font-mono whitespace-nowrap truncate max-w-[90px]"
                                style={{
                                    background: '#00000080',
                                    color: isLocked ? '#4b5563' : isDone ? '#fbbf24' : cfg.color,
                                }}
                            >
                                {node.problemId?.title?.split(' ').slice(0, 2).join(' ') || node.nodeId}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Zoom controls */}
            <div className="absolute bottom-4 right-4 z-30 flex flex-col gap-1.5 pointer-events-auto">
                {[
                    { label: '+', action: () => setZoom((z) => Math.min(z * 1.2, 2.8)) },
                    { label: '⟳', action: handleResetView },
                    { label: '−', action: () => setZoom((z) => Math.max(z * 0.83, 0.35)) },
                ].map((btn) => (
                    <button
                        key={btn.label}
                        onClick={btn.action}
                        className="w-9 h-9 bg-[#0d1117]/90 border border-gray-700/60 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 font-bold text-base flex items-center justify-center transition-colors"
                    >
                        {btn.label}
                    </button>
                ))}
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 z-30 pointer-events-none bg-[#07090f]/85 border border-gray-800/60 rounded-xl p-3 text-[10px] space-y-2 backdrop-blur-sm">
                {[
                    {
                        node: (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-700 bg-gray-900 opacity-50 flex items-center justify-center">
                                <Lock size={8} className="text-gray-600" />
                            </div>
                        ),
                        label: 'Locked',
                    },
                    {
                        node: (
                            <div className="w-4 h-4 rounded-full border-2 border-accent bg-accent/15 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                            </div>
                        ),
                        label: 'Available',
                    },
                    {
                        node: (
                            <div className="w-4 h-4 rounded-full border-2 border-amber-400 bg-amber-950/40 flex items-center justify-center">
                                <Star size={8} className="fill-amber-400 text-amber-400" />
                            </div>
                        ),
                        label: 'Completed',
                    },
                    {
                        node: (
                            <div className="w-4 h-4 rounded-full border-2 border-red-500 bg-red-950/40 flex items-center justify-center">
                                <Skull size={8} className="text-red-400" />
                            </div>
                        ),
                        label: 'Boss',
                    },
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                        {item.node}
                        <span className="text-gray-500">{item.label}</span>
                    </div>
                ))}
                <div className="pt-1 border-t border-gray-800 text-gray-700 leading-relaxed">
                    Drag to pan · Scroll to zoom
                </div>
            </div>
        </div>
    );
};

export default WorldMap;
// import React, { useRef, useCallback, useMemo } from 'react';
// import { motion } from 'framer-motion';
// import { Lock } from 'lucide-react';
// import ZoneContainer from './ZoneContainer';
// import BossNode      from './BossNode';
// import {
//   ZONE_CONFIGS,
//   ZONE_W, ZONE_H, ZONE_GAP,
//   NODE_RADIUS,
//   MID_BOSS_IDX, MAIN_BOSS_IDX,
//   getLocalNodePos,
//   generateMockWorld,
// } from './campaignWorldData';

// // ── Region → ZONE_CONFIG id normalisation ────────────────────────────────────
// const REGION_TO_ZONE_ID = {
//   Array_Archipelago:      'array_archipelago',
//   String_Shores:          'string_shores',
//   Loop_Lagoon:            'loop_lagoon',
//   Sliding_Window_Sanctum: 'sliding_window_sanctum',
//   HashMap_Highlands:      'hashmap_highlands',
//   Stack_Queue_Quarry:     'stack_queue_quarry',
//   Tree_Territory:         'tree_tundra',
//   Graph_Gorge:            'graph_gorge',
//   DP_Dungeon:             'dp_dungeon',
// };

// const resolveZoneId = (node) => {
//   const raw = node?.zoneId || node?.region || '';
//   if (ZONE_CONFIGS.some(z => z.id === raw)) return raw;
//   if (REGION_TO_ZONE_ID[raw]) return REGION_TO_ZONE_ID[raw];
//   const lower = raw.toLowerCase().replace(/ /g, '_');
//   const found = ZONE_CONFIGS.find(z => z.id === lower || z.id.includes(lower));
//   return found ? found.id : null;
// };

// // ── Get title from any possible node field shape ──────────────────────────────
// const getNodeTitle = (node) =>
//   node?.problemId?.title ||   // populated from DB via .populate()
//   node?.problem?.title    ||  // campaignData.js flat shape
//   node?.title             ||  // campaignDataBatch2.js flat shape
//   null;

// // ── Node progress state ───────────────────────────────────────────────────────
// const getState = (nodeId, progress, isFirstNodeFallback = false) => {
//   if (!progress) {
//     return isFirstNodeFallback ? { state: 'available' } : { state: 'locked' };
//   }
//   const done = progress.completedNodes?.find(n => n.nodeId === nodeId);
//   if (done) return { state: 'completed', starsAwarded: done.starsAwarded ?? 0 };
//   if (progress.unlockedNodes?.includes(nodeId)) return { state: 'available' };
//   if (isFirstNodeFallback) return { state: 'available' };
//   return { state: 'locked' };
// };

// // ── Constants ─────────────────────────────────────────────────────────────────
// // FIX 1: Star array defined once — avoids re-creating [1,2,3] inline on every render
// const STAR_INDICES = [1, 2, 3];

// // ── StandardNode ──────────────────────────────────────────────────────────────
// const StandardNode = React.memo(({ node, state, isSelected, accent, onClick }) => {
//   const isLocked = state.state === 'locked';
//   const isAvail  = state.state === 'available';
//   const isDone   = state.state === 'completed';
//   const stars    = state.starsAwarded || 0;
//   const SZ       = NODE_RADIUS * 2;

//   const border = isLocked ? '#374151' : isDone ? '#fbbf24' : accent;
//   const bg     = isLocked
//     ? 'radial-gradient(circle,#0e1117,#070a0f)'
//     : isDone
//       ? `radial-gradient(circle at 35% 35%, ${
//           ['#2d1800', '#2d2200', '#1f1600'][Math.min(stars, 3) - 1] ?? '#2d1800'
//         }, #080600)`
//       : `radial-gradient(circle at 35% 35%, ${accent}28, ${accent}08)`;
//   const glow = isLocked
//     ? 'none'
//     : isDone
//       ? '0 0 16px #fbbf2470'
//       : `0 0 18px ${accent}65, 0 0 36px ${accent}25`;

//   const title = getNodeTitle(node) || `Node ${node.nodeNum ?? '?'}`;

//   return (
//     <div className="flex flex-col items-center gap-1" style={{ opacity: isLocked ? 0.4 : 1 }}>

//       {/* Available pulse ring */}
//       {isAvail && (
//         <motion.div
//           className="absolute rounded-full border-2 pointer-events-none"
//           style={{ width: SZ + 18, height: SZ + 18, borderColor: `${accent}60` }}
//           animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
//           transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
//         />
//       )}

//       {/* Selection ring */}
//       {isSelected && (
//         <div
//           className="absolute rounded-full pointer-events-none"
//           style={{ width: SZ + 12, height: SZ + 12, border: '2px solid rgba(255,255,255,.5)' }}
//         />
//       )}

//       <motion.div
//         className="relative flex items-center justify-center rounded-full border-2"
//         style={{
//           width:      SZ,
//           height:     SZ,
//           background: bg,
//           borderColor: border,
//           boxShadow:  isSelected ? `0 0 0 3px rgba(255,255,255,.2),${glow}` : glow,
//           cursor:     isLocked ? 'not-allowed' : 'pointer',
//         }}
//         whileHover={{ scale: isLocked ? 1 : 1.1 }}
//         whileTap={{ scale: isLocked ? 1 : 0.93 }}
//         onClick={() => !isLocked && onClick?.(node)}
//       >
//         {isLocked ? (
//           <Lock size={14} className="text-gray-700" />
//         ) : isDone ? (
//           // FIX 1: was `{.map(...)` — missing source array; now maps over STAR_INDICES
//           <div className="flex gap-0.5">
//             {STAR_INDICES.map(i => (
//               <span key={i} style={{ fontSize: 9, color: i <= stars ? '#fbbf24' : '#374151' }}>
//                 ★
//               </span>
//             ))}
//           </div>
//         ) : (
//           <motion.div
//             className="rounded-full"
//             style={{ width: 10, height: 10, background: accent, boxShadow: `0 0 10px ${accent}` }}
//             animate={{ opacity: [0.5, 1, 0.5] }}
//             transition={{ duration: 1.8, repeat: Infinity }}
//           />
//         )}
//       </motion.div>

//       <div
//         className="px-2 py-0.5 rounded-full text-[8px] font-bold font-mono max-w-[76px] truncate text-center"
//         style={{
//           background:    'rgba(0,0,0,.7)',
//           backdropFilter: 'blur(4px)',
//           color:  isLocked ? '#374151' : isDone ? '#fbbf24' : accent,
//           border: `1px solid ${isLocked ? '#1f2937' : isDone ? '#92400e40' : `${accent}30`}`,
//         }}
//       >
//         {title.split(' ').slice(0, 3).join(' ')}
//       </div>
//     </div>
//   );
// });
// StandardNode.displayName = 'StandardNode';

// // ── Inter-zone SVG bridge ─────────────────────────────────────────────────────
// // FIX 3: Bridge always uses hardcoded slot indices (14 → slot 0) so that
// // an incomplete DB seed can never cause the line to originate from a mid-node.
// // x/y coords are absolute canvas coords (zoneTop already factored in by caller).
// const InterZoneBridge = ({ fromLocal, toLocal, zoneTop, nextZoneTop, toColor, lit }) => {
//   const fx = fromLocal.x;
//   const fy = zoneTop + fromLocal.y;
//   const tx = toLocal.x;
//   const ty = nextZoneTop + toLocal.y;
//   const d  = `M ${fx} ${fy} C ${fx} ${fy + 55} ${tx} ${ty - 55} ${tx} ${ty}`;

//   return (
//     <g>
//       <path
//         d={d}
//         fill="none"
//         stroke={lit ? toColor : '#1e293b'}
//         strokeWidth={lit ? 2.5 : 1.8}
//         strokeOpacity={lit ? 0.7 : 0.4}
//         strokeDasharray={lit ? undefined : '6 8'}
//         strokeLinecap="round"
//       />
//       {lit && (
//         <circle r="4" fill={toColor} opacity="0.85">
//           <animateMotion dur="3s" repeatCount="indefinite" path={d} />
//         </circle>
//       )}
//     </g>
//   );
// };

// // ── WorldMap ──────────────────────────────────────────────────────────────────
// const WorldMap = ({ nodes: propNodes = [], progress, onNodeClick, selectedNodeId }) => {
//   const scrollRef = useRef(null);

//   const allNodes = useMemo(
//     () => (propNodes.length > 0 ? propNodes : generateMockWorld()),
//     [propNodes]
//   );

//   // ── Group nodes by zone ───────────────────────────────────────────────────
//   const nodesByZone = useMemo(() => {
//     const m = {};
//     ZONE_CONFIGS.forEach(z => { m[z.id] = []; });

//     allNodes.forEach(n => {
//       const zid = resolveZoneId(n);
//       if (!zid || !m[zid]) return;

//       const sequenceNum = n.nodeOrder ?? n.nodeNum ?? 1;
//       const rawIndex    = n.localIndex ?? Math.max(0, sequenceNum - 1);
//       const safeIndex   = Math.min(14, Math.max(0, rawIndex));
//       const localPos    = n.localPos || getLocalNodePos(safeIndex);

//       m[zid].push({
//         ...n,
//         zoneId:     zid,
//         nodeNum:    sequenceNum,
//         localIndex: safeIndex,
//         localPos,
//       });
//     });

//     Object.values(m).forEach(arr => arr.sort((a, b) => (a.nodeNum ?? 0) - (b.nodeNum ?? 0)));
//     return m;
//   }, [allNodes]);

//   // Detect if the progress node-IDs don't match the loaded nodes (mock/dev mode)
//   const mockIdMismatch = useMemo(() => {
//     if (!progress?.unlockedNodes?.length) return true;
//     const allIds   = new Set(allNodes.map(n => n.nodeId).filter(Boolean));
//     const anyMatch = progress.unlockedNodes.some(id => allIds.has(id));
//     return !anyMatch;
//   }, [allNodes, progress]);

//   // FIX 2: was `nodesByZone[ZONE_CONFIGS?.id]` — ZONE_CONFIGS is an array,
//   // .id is always undefined; must index with [0] to get the first zone config.
//   const firstZoneFirstNodeId = useMemo(() => {
//     const zone0Nodes = nodesByZone[ZONE_CONFIGS[0]?.id] ?? [];
//     return zone0Nodes[0]?.nodeId ?? null;
//   }, [nodesByZone]);

//   const completedSet = useMemo(
//     () => new Set(progress?.completedNodes?.map(n => n.nodeId) ?? []),
//     [progress]
//   );

//   const zoneTops = useMemo(
//     () => ZONE_CONFIGS.map((_, i) => i * (ZONE_H + ZONE_GAP)),
//     []
//   );

//   const CANVAS_H = ZONE_CONFIGS.length * (ZONE_H + ZONE_GAP);

//   const scrollToZone = useCallback((zIdx) => {
//     scrollRef.current?.scrollTo({ top: Math.max(0, zoneTops[zIdx] - 80), behavior: 'smooth' });
//   }, [zoneTops]);

//   const jumpToProgress = useCallback(() => {
//     const firstAvail = allNodes.find(n => {
//       const isFallback = mockIdMismatch && n.nodeId === firstZoneFirstNodeId;
//       return getState(n.nodeId, progress, isFallback).state === 'available';
//     });
//     scrollToZone(firstAvail?.zoneIndex ?? 0);
//   }, [allNodes, progress, mockIdMismatch, firstZoneFirstNodeId, scrollToZone]);

//   // FIX 3: Precompute bridge endpoints once — always slot 14 (Zone Boss) → slot 0 (Node 1).
//   // This is immune to incomplete DB seeds that would otherwise shift the "last node".
//   const BRIDGE_FROM = getLocalNodePos(14); // Zone Boss position (node 15)
//   const BRIDGE_TO   = getLocalNodePos(0);  // First node of next zone

//   return (
//     <div className="relative w-full h-full overflow-hidden" style={{ background: '#020408' }}>

//       {/* ── Starfield parallax background ────────────────────────── */}
//       <div className="absolute inset-0 pointer-events-none overflow-hidden">
//         {Array.from({ length: 80 }, (_, i) => (
//           <div
//             key={i}
//             className="absolute rounded-full bg-white"
//             style={{
//               width:   i % 5 < 2 ? 1.5 : 0.8,
//               height:  i % 5 < 2 ? 1.5 : 0.8,
//               left:    `${(i * 137.5) % 100}%`,
//               top:     `${(i * 97.3)  % 100}%`,
//               opacity: i % 3 === 0 ? 0.5 : 0.15,
//             }}
//           />
//         ))}
//       </div>

//       {/* ── Scrollable canvas ─────────────────────────────────────── */}
//       <div
//         ref={scrollRef}
//         className="absolute inset-0 overflow-y-auto overflow-x-hidden"
//         style={{ scrollbarWidth: 'none' }}
//       >
//         <div
//           className="relative mx-auto"
//           style={{ width: ZONE_W, height: CANVAS_H }}
//         >
//           {/* ── Inter-zone bridges ──────────────────────────────────── */}
//           <svg
//             className="absolute inset-0 pointer-events-none"
//             style={{ width: ZONE_W, height: CANVAS_H, zIndex: 15, overflow: 'visible' }}
//           >
//             {ZONE_CONFIGS.slice(0, -1).map((zone, zIdx) => {
//               const nextZone = ZONE_CONFIGS[zIdx + 1];
//               const zNodes   = nodesByZone[zone.id] ?? [];

//               // Only illuminate bridge once the actual Zone Boss (nodeNum 15) is complete.
//               // This check is data-driven and safe regardless of how many nodes are seeded.
//               const zoneBoss = zNodes.find(n => n.nodeNum === 15);
//               const lit      = zoneBoss ? completedSet.has(zoneBoss.nodeId) : false;

//               return (
//                 <InterZoneBridge
//                   key={`bridge-${zIdx}`}
//                   fromLocal={BRIDGE_FROM}
//                   toLocal={BRIDGE_TO}
//                   zoneTop={zoneTops[zIdx]}
//                   nextZoneTop={zoneTops[zIdx + 1]}
//                   toColor={nextZone.path ?? '#22d3ee'}
//                   lit={lit}
//                 />
//               );
//             })}
//           </svg>

//           {/* ── Zone tiles ──────────────────────────────────────────── */}
//           {ZONE_CONFIGS.map((zone, zIdx) => {
//             const zoneNodes = nodesByZone[zone.id] ?? [];
//             const zoneTop   = zoneTops[zIdx];

//             // Build all 15 display slots; unfilled slots become locked placeholders.
//             const displayNodes = Array.from({ length: 15 }, (_, i) => {
//               const found = zoneNodes.find(
//                 n => n.nodeNum === i + 1 || n.localIndex === i
//               );
//               return found ?? {
//                 nodeId:        `${zone.id}_${i + 1}_ph`,
//                 nodeNum:       i + 1,
//                 localIndex:    i,
//                 nodeType:      (i === MID_BOSS_IDX || i === MAIN_BOSS_IDX) ? 'boss' : 'standard',
//                 bossType:      i === MID_BOSS_IDX ? 'mid' : i === MAIN_BOSS_IDX ? 'main' : null,
//                 region:        zone.id,
//                 zoneIndex:     zIdx,
//                 localPos:      getLocalNodePos(i),
//                 // Both field shapes pre-filled so getNodeTitle() never returns null
//                 problem:       { title: `Challenge ${i + 1}` },
//                 problemId:     { title: `Challenge ${i + 1}` },
//                 isPlaceholder: true,
//               };
//             });

//             return (
//               <div
//                 key={zone.id}
//                 className="absolute"
//                 style={{ left: 0, top: zoneTop, width: ZONE_W, height: ZONE_H, zIndex: 10 }}
//               >
//                 <ZoneContainer config={zone} completedIds={completedSet}>
//                   {displayNodes.map(node => {
//                     const { x, y } = node.localPos ?? getLocalNodePos(node.localIndex ?? 0);
//                     const isSel    = node.nodeId === selectedNodeId;
//                     const isBoss   = node.nodeType === 'boss';

//                     const isFirstNodeFallback =
//                       mockIdMismatch &&
//                       zIdx === 0 &&
//                       node.nodeId === firstZoneFirstNodeId;

//                     const nodeState = node.isPlaceholder
//                       ? { state: 'locked' }
//                       : getState(node.nodeId, progress, isFirstNodeFallback);

//                     return (
//                       <div
//                         key={node.nodeId}
//                         className="absolute"
//                         style={{
//                           left:      x,
//                           top:       y,
//                           transform: 'translate(-50%,-50%)',
//                           zIndex:    isSel ? 50 : isBoss ? 30 : 20,
//                         }}
//                       >
//                         {isBoss ? (
//                           <BossNode
//                             bossType={node.bossType}
//                             isLocked={nodeState.state === 'locked'}
//                             isDone={nodeState.state === 'completed'}
//                             stars={nodeState.starsAwarded ?? 0}
//                             isSelected={isSel}
//                             onClick={() => !node.isPlaceholder && onNodeClick?.(node)}
//                             title={getNodeTitle(node)}
//                           />
//                         ) : (
//                           <StandardNode
//                             node={node}
//                             state={nodeState}
//                             isSelected={isSel}
//                             accent={zone.accent ?? '#22d3ee'}
//                             onClick={node.isPlaceholder ? undefined : onNodeClick}
//                           />
//                         )}
//                       </div>
//                     );
//                   })}
//                 </ZoneContainer>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* ── HUD: Jump to progress ────────────────────────────────── */}
//       <div className="absolute bottom-5 left-5 z-50 pointer-events-auto">
//         <button
//           onClick={jumpToProgress}
//           className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all"
//           style={{
//             background: 'rgba(34,211,238,0.12)',
//             border:     '1px solid rgba(34,211,238,0.30)',
//             color:      '#22d3ee',
//           }}
//         >
//           <span className="text-sm">🎯</span> Continue
//         </button>
//       </div>

//       {/* ── HUD: Mini zone index ─────────────────────────────────── */}
//       <div className="absolute top-3 right-3 z-50 pointer-events-none">
//         <div className="bg-[#060810]/85 border border-gray-800/40 rounded-xl px-3 py-2 space-y-1 max-h-60 overflow-hidden">
//           <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-1.5">
//             Zones
//           </p>
//           {ZONE_CONFIGS.map((z, i) => {
//             const zNodes = nodesByZone[z.id] ?? [];
//             const done   = zNodes.filter(n => completedSet.has(n.nodeId)).length;
//             const total  = zNodes.length || 15;
//             const pct    = Math.round((done / total) * 100);
//             return (
//               <button
//                 key={z.id}
//                 className="flex items-center gap-2 w-full text-left hover:opacity-100 transition-opacity pointer-events-auto"
//                 style={{ opacity: done === 0 && i > 0 ? 0.4 : 0.85 }}
//                 onClick={() =>
//                   scrollRef.current?.scrollTo({
//                     top: Math.max(0, zoneTops[i] - 100),
//                     behavior: 'smooth',
//                   })
//                 }
//               >
//                 <span className="text-xs select-none">{z.icon}</span>
//                 <div className="flex-1 min-w-0">
//                   <div className="text-[9px] font-bold text-gray-400 truncate max-w-[100px]">
//                     {z.name}
//                   </div>
//                   <div className="h-1 rounded-full mt-0.5" style={{ background: '#1e293b' }}>
//                     <div
//                       className="h-full rounded-full transition-all"
//                       style={{ width: `${pct}%`, background: z.accent }}
//                     />
//                   </div>
//                 </div>
//               </button>
//             );
//           })}
//         </div>
//       </div>

//       {/* ── Legend ───────────────────────────────────────────────── */}
//       <div className="absolute bottom-5 left-[58px] z-50 pointer-events-none bg-[#060810]/85 border border-gray-800/50 rounded-xl px-3 py-2.5 backdrop-blur-md">
//         {[
//           { col: '#374151', label: 'Locked'    },
//           { col: '#06b6d4', label: 'Available' },
//           { col: '#fbbf24', label: 'Complete'  },
//           { col: '#a855f7', label: 'Mid Boss'  },
//           { col: '#ef4444', label: 'Zone Boss' },
//         ].map((item) => (
//           <div key={item.label} className="flex items-center gap-2 mb-1.5 last:mb-0">
//             <div
//               className="w-3 h-3 rounded-full border shrink-0"
//               style={{
//                 borderColor: item.col,
//                 background:  `${item.col}25`,
//                 boxShadow:   `0 0 6px ${item.col}50`,
//               }}
//             />
//             <span className="text-[9px] text-gray-500 font-medium">{item.label}</span>
//           </div>
//         ))}
//         <div className="border-t border-gray-800/60 mt-1.5 pt-1.5 text-[9px] text-gray-700">
//           Scroll to navigate
//         </div>
//       </div>
//     </div>
//   );
// };

// export default WorldMap;





































































































// This one is perfect worldMap with the proper responsivness
import React, { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import ZoneContainer from './ZoneContainer';
import BossNode from './BossNode';
import {
  ZONE_CONFIGS,
  ZONE_W, ZONE_H, ZONE_GAP,
  NODE_RADIUS,
  MID_BOSS_IDX, MAIN_BOSS_IDX,
  getLocalNodePos,
  generateMockWorld,
} from './campaignWorldData';

// ── Region → ZONE_CONFIG id normalisation ────────────────────────────────────
const REGION_TO_ZONE_ID = {
  Array_Archipelago: 'array_archipelago',
  String_Shores: 'string_shores',
  Loop_Lagoon: 'loop_lagoon',
  Sliding_Window_Sanctum: 'sliding_window_sanctum',
  HashMap_Highlands: 'hashmap_highlands',
  Stack_Queue_Quarry: 'stack_queue_quarry',
  Tree_Territory: 'tree_tundra',
  Graph_Gorge: 'graph_gorge',
  DP_Dungeon: 'dp_dungeon',
};

const resolveZoneId = (node) => {
  const raw = node?.zoneId || node?.region || '';
  if (ZONE_CONFIGS.some(z => z.id === raw)) return raw;
  if (REGION_TO_ZONE_ID[raw]) return REGION_TO_ZONE_ID[raw];
  const lower = raw.toLowerCase().replace(/ /g, '_');
  const found = ZONE_CONFIGS.find(z => z.id === lower || z.id.includes(lower));
  return found ? found.id : null;
};

// ── Get title from any possible node field shape ──────────────────────────────
const getNodeTitle = (node) =>
  node?.problemId?.title ||
  node?.problem?.title ||
  node?.title ||
  null;

// ── Node progress state ───────────────────────────────────────────────────────
const getState = (nodeId, progress, isFirstNodeFallback = false) => {
  if (!progress) {
    return isFirstNodeFallback ? { state: 'available' } : { state: 'locked' };
  }
  const done = progress.completedNodes?.find(n => n.nodeId === nodeId);
  if (done) return { state: 'completed', starsAwarded: done.starsAwarded ?? 0 };
  if (progress.unlockedNodes?.includes(nodeId)) return { state: 'available' };
  if (isFirstNodeFallback) return { state: 'available' };
  return { state: 'locked' };
};

// ── Constants ─────────────────────────────────────────────────────────────────
const STAR_INDICES = [1, 2, 3];

// ── StandardNode ──────────────────────────────────────────────────────────────
const StandardNode = React.memo(({ node, state, isSelected, accent, onClick }) => {
  const isLocked = state.state === 'locked';
  const isAvail = state.state === 'available';
  const isDone = state.state === 'completed';
  const stars = state.starsAwarded || 0;
  const SZ = NODE_RADIUS * 2;

  const border = isLocked ? '#374151' : isDone ? '#fbbf24' : accent;
  const bg = isLocked
    ? 'radial-gradient(circle,#0e1117,#070a0f)'
    : isDone
      ? `radial-gradient(circle at 35% 35%, ${['#2d1800', '#2d2200', '#1f1600'][Math.min(stars, 3) - 1] ?? '#2d1800'}, #080600)`
      : `radial-gradient(circle at 35% 35%, ${accent}28, ${accent}08)`;
  const glow = isLocked
    ? 'none'
    : isDone
      ? '0 0 16px #fbbf2470'
      : `0 0 18px ${accent}65, 0 0 36px ${accent}25`;

  const title = getNodeTitle(node) || `Node ${node.nodeNum ?? '?'}`;

  return (
    <div className="relative flex flex-col items-center gap-1" style={{ opacity: isLocked ? 0.4 : 1 }}>
      {isAvail && (
        <motion.div
          className="absolute rounded-full border-2 pointer-events-none"
          style={{ width: SZ + 18, height: SZ + 18, borderColor: `${accent}60` }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {isSelected && (
        <div
          className="absolute rounded-full pointer-events-none"
          style={{ width: SZ + 12, height: SZ + 12, border: '2px solid rgba(255,255,255,.5)' }}
        />
      )}

      <motion.div
        className="relative flex items-center justify-center rounded-full border-2"
        style={{
          width: SZ,
          height: SZ,
          background: bg,
          borderColor: border,
          boxShadow: isSelected ? `0 0 0 3px rgba(255,255,255,.2),${glow}` : glow,
          cursor: isLocked ? 'not-allowed' : 'pointer',
        }}
        whileHover={{ scale: isLocked ? 1 : 1.08 }}
        whileTap={{ scale: isLocked ? 1 : 0.94 }}
        onClick={() => !isLocked && onClick?.(node)}
      >
        {isLocked ? (
          <Lock size={14} className="text-gray-700" />
        ) : isDone ? (
          <div className="flex gap-0.5">
            {STAR_INDICES.map(i => (
              <span key={i} style={{ fontSize: 9, color: i <= stars ? '#fbbf24' : '#374151' }}>
                ★
              </span>
            ))}
          </div>
        ) : (
          <motion.div
            className="rounded-full"
            style={{ width: 10, height: 10, background: accent, boxShadow: `0 0 10px ${accent}` }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
        )}
      </motion.div>

      <div
        className="px-2 py-0.5 rounded-full text-[8px] font-bold font-mono max-w-[76px] truncate text-center"
        style={{
          background: 'rgba(0,0,0,.7)',
          backdropFilter: 'blur(4px)',
          color: isLocked ? '#374151' : isDone ? '#fbbf24' : accent,
          border: `1px solid ${isLocked ? '#1f2937' : isDone ? '#92400e40' : `${accent}30`}`,
        }}
      >
        {title.split(' ').slice(0, 3).join(' ')}
      </div>
    </div>
  );
});
StandardNode.displayName = 'StandardNode';

// ── Inter-zone SVG bridge ─────────────────────────────────────────────────────
const InterZoneBridge = ({ fromLocal, toLocal, zoneTop, nextZoneTop, toColor, lit }) => {
  const fx = fromLocal.x;
  const fy = zoneTop + fromLocal.y;
  const tx = toLocal.x;
  const ty = nextZoneTop + toLocal.y;
  const d = `M ${fx} ${fy} C ${fx} ${fy + 55} ${tx} ${ty - 55} ${tx} ${ty}`;

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={lit ? toColor : '#1e293b'}
        strokeWidth={lit ? 2.5 : 1.8}
        strokeOpacity={lit ? 0.7 : 0.4}
        strokeDasharray={lit ? undefined : '6 8'}
        strokeLinecap="round"
      />
      {lit && (
        <circle r="4" fill={toColor} opacity="0.85">
          <animateMotion dur="3s" repeatCount="indefinite" path={d} />
        </circle>
      )}
    </g>
  );
};

// ── WorldMap ──────────────────────────────────────────────────────────────────
const WorldMap = ({ nodes: propNodes = [], progress, onNodeClick, selectedNodeId }) => {
  const scrollRef = useRef(null);
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1440));
  const [viewportHeight, setViewportHeight] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 900));

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const allNodes = useMemo(
    () => (propNodes.length > 0 ? propNodes : generateMockWorld()),
    [propNodes]
  );

  const nodesByZone = useMemo(() => {
    const m = {};
    ZONE_CONFIGS.forEach(z => {
      m[z.id] = [];
    });

    allNodes.forEach(n => {
      const zid = resolveZoneId(n);
      if (!zid || !m[zid]) return;

      const sequenceNum = n.nodeOrder ?? n.nodeNum ?? 1;
      const rawIndex = n.localIndex ?? Math.max(0, sequenceNum - 1);
      const safeIndex = Math.min(14, Math.max(0, rawIndex));
      const localPos = n.localPos || getLocalNodePos(safeIndex);

      m[zid].push({
        ...n,
        zoneId: zid,
        nodeNum: sequenceNum,
        localIndex: safeIndex,
        localPos,
      });
    });

    Object.values(m).forEach(arr => arr.sort((a, b) => (a.nodeNum ?? 0) - (b.nodeNum ?? 0)));
    return m;
  }, [allNodes]);

  const mockIdMismatch = useMemo(() => {
    if (!progress?.unlockedNodes?.length) return true;
    const allIds = new Set(allNodes.map(n => n.nodeId).filter(Boolean));
    const anyMatch = progress.unlockedNodes.some(id => allIds.has(id));
    return !anyMatch;
  }, [allNodes, progress]);

  const firstZoneFirstNodeId = useMemo(() => {
    const zone0Nodes = nodesByZone[ZONE_CONFIGS[0]?.id] ?? [];
    return zone0Nodes[0]?.nodeId ?? null;
  }, [nodesByZone]);

  const completedSet = useMemo(
    () => new Set(progress?.completedNodes?.map(n => n.nodeId) ?? []),
    [progress]
  );

  const zoneTops = useMemo(
    () => ZONE_CONFIGS.map((_, i) => i * (ZONE_H + ZONE_GAP)),
    []
  );

  const CANVAS_H = ZONE_CONFIGS.length * (ZONE_H + ZONE_GAP);

  const mapScale = useMemo(() => {
    const baseWidth = ZONE_W;
    const safePadding = viewportWidth < 640 ? 24 : viewportWidth < 1024 ? 48 : 80;
    const widthLimited = (viewportWidth - safePadding) / baseWidth;

    const heightLimited = viewportHeight < 720
      ? 0.92
      : viewportHeight < 900
        ? 0.98
        : 1;

    const mobileBoost = viewportWidth < 640 ? 0.86 : 1;

    return Math.max(0.72, Math.min(1, widthLimited, heightLimited) * mobileBoost);
  }, [viewportWidth, viewportHeight]);

//   const scaledCanvasWidth = ZONE_W * mapScale;
  const scaledCanvasHeight = CANVAS_H * mapScale;

  const scrollToZone = useCallback((zIdx) => {
    scrollRef.current?.scrollTo({ top: Math.max(0, zoneTops[zIdx] - 80), behavior: 'smooth' });
  }, [zoneTops]);

  const jumpToProgress = useCallback(() => {
    const firstAvail = allNodes.find(n => {
      const isFallback = mockIdMismatch && n.nodeId === firstZoneFirstNodeId;
      return getState(n.nodeId, progress, isFallback).state === 'available';
    });
    scrollToZone(firstAvail?.zoneIndex ?? 0);
  }, [allNodes, progress, mockIdMismatch, firstZoneFirstNodeId, scrollToZone]);

  const BRIDGE_FROM = getLocalNodePos(14);
  const BRIDGE_TO = getLocalNodePos(0);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#020408' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 80 }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: i % 5 < 2 ? 1.5 : 0.8,
              height: i % 5 < 2 ? 1.5 : 0.8,
              left: `${(i * 137.5) % 100}%`,
              top: `${(i * 97.3) % 100}%`,
              opacity: i % 3 === 0 ? 0.5 : 0.15,
            }}
          />
        ))}
      </div>

      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto overflow-x-hidden"
        style={{
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >
        <div
          className="relative mx-auto"
          style={{
            width: ZONE_W,
            height: CANVAS_H,
            transform: `scale(${mapScale})`,
            transformOrigin: 'top center',
            willChange: 'transform',
            marginBottom: scaledCanvasHeight * (1 / mapScale - 1),
          }}
        >
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: ZONE_W, height: CANVAS_H, zIndex: 15, overflow: 'visible' }}
          >
            {ZONE_CONFIGS.slice(0, -1).map((zone, zIdx) => {
              const nextZone = ZONE_CONFIGS[zIdx + 1];
              const zNodes = nodesByZone[zone.id] ?? [];

              const zoneBoss = zNodes.find(n => n.nodeNum === 15);
              const lit = zoneBoss ? completedSet.has(zoneBoss.nodeId) : false;

              return (
                <InterZoneBridge
                  key={`bridge-${zIdx}`}
                  fromLocal={BRIDGE_FROM}
                  toLocal={BRIDGE_TO}
                  zoneTop={zoneTops[zIdx]}
                  nextZoneTop={zoneTops[zIdx + 1]}
                  toColor={nextZone.path ?? '#22d3ee'}
                  lit={lit}
                />
              );
            })}
          </svg>

          {ZONE_CONFIGS.map((zone, zIdx) => {
            const zoneNodes = nodesByZone[zone.id] ?? [];
            const zoneTop = zoneTops[zIdx];

            const displayNodes = Array.from({ length: 15 }, (_, i) => {
              const found = zoneNodes.find(n => n.nodeNum === i + 1 || n.localIndex === i);
              return found ?? {
                nodeId: `${zone.id}_${i + 1}_ph`,
                nodeNum: i + 1,
                localIndex: i,
                nodeType: (i === MID_BOSS_IDX || i === MAIN_BOSS_IDX) ? 'boss' : 'standard',
                bossType: i === MID_BOSS_IDX ? 'mid' : i === MAIN_BOSS_IDX ? 'main' : null,
                region: zone.id,
                zoneIndex: zIdx,
                localPos: getLocalNodePos(i),
                problem: { title: `Challenge ${i + 1}` },
                problemId: { title: `Challenge ${i + 1}` },
                isPlaceholder: true,
              };
            });

            return (
              <div
                key={zone.id}
                className="absolute"
                style={{ left: 0, top: zoneTop, width: ZONE_W, height: ZONE_H, zIndex: 10 }}
              >
                <ZoneContainer config={zone} completedIds={completedSet}>
                  {displayNodes.map(node => {
                    const { x, y } = node.localPos ?? getLocalNodePos(node.localIndex ?? 0);
                    const isSel = node.nodeId === selectedNodeId;
                    const isBoss = node.nodeType === 'boss';

                    const isFirstNodeFallback =
                      mockIdMismatch &&
                      zIdx === 0 &&
                      node.nodeId === firstZoneFirstNodeId;

                    const nodeState = node.isPlaceholder
                      ? { state: 'locked' }
                      : getState(node.nodeId, progress, isFirstNodeFallback);

                    return (
                      <div
                        key={node.nodeId}
                        className="absolute"
                        style={{
                          left: x,
                          top: y,
                          transform: 'translate(-50%,-50%)',
                          zIndex: isSel ? 50 : isBoss ? 30 : 20,
                        }}
                      >
                        {isBoss ? (
                          <BossNode
                            bossType={node.bossType}
                            isLocked={nodeState.state === 'locked'}
                            isDone={nodeState.state === 'completed'}
                            stars={nodeState.starsAwarded ?? 0}
                            isSelected={isSel}
                            onClick={() => !node.isPlaceholder && onNodeClick?.(node)}
                            title={getNodeTitle(node)}
                          />
                        ) : (
                          <StandardNode
                            node={node}
                            state={nodeState}
                            isSelected={isSel}
                            accent={zone.accent ?? '#22d3ee'}
                            onClick={node.isPlaceholder ? undefined : onNodeClick}
                          />
                        )}
                      </div>
                    );
                  })}
                </ZoneContainer>
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-3 left-3 z-50 pointer-events-auto sm:bottom-5 sm:left-5">
        <button
          onClick={jumpToProgress}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
          style={{
            background: 'rgba(34,211,238,0.12)',
            border: '1px solid rgba(34,211,238,0.30)',
            color: '#22d3ee',
            backdropFilter: 'blur(6px)',
          }}
        >
          <span className="text-sm">🎯</span>
          <span className="hidden sm:inline">Continue</span>
          <span className="sm:hidden">Go</span>
        </button>
      </div>

      <div className="absolute top-3 right-3 z-50 pointer-events-none w-[min(44vw,240px)] sm:w-auto">
        <div className="bg-[#060810]/85 border border-gray-800/40 rounded-xl px-2.5 py-2 space-y-1 max-h-[42vh] overflow-auto backdrop-blur-md sm:px-3 sm:max-h-60">
          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-1.5">
            Zones
          </p>
          {ZONE_CONFIGS.map((z, i) => {
            const zNodes = nodesByZone[z.id] ?? [];
            const done = zNodes.filter(n => completedSet.has(n.nodeId)).length;
            const total = zNodes.length || 15;
            const pct = Math.round((done / total) * 100);
            return (
              <button
                key={z.id}
                className="flex items-center gap-2 w-full text-left hover:opacity-100 transition-opacity pointer-events-auto"
                style={{ opacity: done === 0 && i > 0 ? 0.4 : 0.85 }}
                onClick={() =>
                  scrollRef.current?.scrollTo({
                    top: Math.max(0, zoneTops[i] - 100),
                    behavior: 'smooth',
                  })
                }
              >
                <span className="text-xs select-none">{z.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-bold text-gray-400 truncate max-w-[100px]">
                    {z.name}
                  </div>
                  <div className="h-1 rounded-full mt-0.5" style={{ background: '#1e293b' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: z.accent }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-3 left-20 z-50 pointer-events-none bg-[#060810]/85 border border-gray-800/50 rounded-xl px-2.5 py-2 backdrop-blur-md hidden md:block sm:bottom-5 sm:left-[58px]">
        {[
          { col: '#374151', label: 'Locked' },
          { col: '#06b6d4', label: 'Available' },
          { col: '#fbbf24', label: 'Complete' },
          { col: '#a855f7', label: 'Mid Boss' },
          { col: '#ef4444', label: 'Zone Boss' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 mb-1.5 last:mb-0">
            <div
              className="w-3 h-3 rounded-full border shrink-0"
              style={{
                borderColor: item.col,
                background: `${item.col}25`,
                boxShadow: `0 0 6px ${item.col}50`,
              }}
            />
            <span className="text-[9px] text-gray-500 font-medium">{item.label}</span>
          </div>
        ))}
        <div className="border-t border-gray-800/60 mt-1.5 pt-1.5 text-[9px] text-gray-700">
          Scroll to navigate
        </div>
      </div>
    </div>
  );
};

export default WorldMap;

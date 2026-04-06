// // src/components/Campaign/CampaignMapCanvas.jsx
// // ─────────────────────────────────────────────────────────────────────────────
// // KEY FIXES vs previous version:
// //  1. Legend moved to absolute bottom-6 left-6 z-50 with pointer-events-none
// //     so it sits ABOVE the canvas but NEVER intercepts node clicks
// //  2. "Scroll to navigate" hint + target icon moved to bottom-6 RIGHT side
// //     so they don't overlap with the legend
// //  3. Back button z-50 so it's always above everything
// //  4. Progress bar moved below back button, not over nodes
// //  5. Full dark: / light: theme-aware class names
// // ─────────────────────────────────────────────────────────────────────────────

// import React, { useRef, useMemo } from 'react';
// import { motion, useMotionValue, AnimatePresence } from 'framer-motion';
// import { Lock, ArrowLeft, Target } from 'lucide-react';
// import { ZONE_W, ZONE_H, NODE_RADIUS, BOSS_RADIUS, MID_BOSS_IDX, MAIN_BOSS_IDX, getLocalNodePos } from './campaignWorldData';

// const NODE_SZ = NODE_RADIUS * 2;
// const BOSS_SZ = BOSS_RADIUS * 2;

// // Bezier segment between two node positions
// const segPath = (a, b) => {
//   const sameRow = Math.floor(a._idx / 5) === Math.floor(b._idx / 5);
//   if (sameRow) {
//     const mx = (a.x + b.x) / 2;
//     return `M ${a.x} ${a.y} Q ${mx} ${a.y - 20} ${b.x} ${b.y}`;
//   }
//   return `M ${a.x} ${a.y} C ${a.x} ${a.y+(b.y-a.y)*.45} ${b.x} ${a.y+(b.y-a.y)*.55} ${b.x} ${b.y}`;
// };

// // Stars
// const Stars = ({ count }) => (
//   <div className="flex gap-0.5 justify-center">
//     {[1,2,3].map(i=><span key={i} style={{fontSize:9,color:i<=count?'#fbbf24':'#374151'}}>★</span>)}
//   </div>
// );

// // Standard node
// const StdNode = ({ node, accent, onClick }) => {
//   const isLocked = node.state === 'locked';
//   const isAvail  = node.state === 'available';
//   const isDone   = node.state === 'completed';
//   const border   = isLocked ? '#374151' : isDone ? '#fbbf24' : accent;
//   const bg       = isLocked
//     ? 'radial-gradient(circle,#0e1117,#070a10)'
//     : isDone
//       ? 'radial-gradient(circle at 35% 35%, #2d1800, #0a0600)'
//       : `radial-gradient(circle at 35% 35%, ${accent}28, ${accent}08)`;
//   const shadow   = isLocked ? 'none' : isDone
//     ? '0 0 14px #fbbf2470'
//     : `0 0 18px ${accent}65, 0 0 36px ${accent}22`;

//   return (
//     <div className="flex flex-col items-center gap-1" style={{ opacity: isLocked ? 0.5 : 1 }}>
//       {isAvail && (
//         <motion.div className="absolute rounded-full border-2 pointer-events-none"
//           style={{width:NODE_SZ+20,height:NODE_SZ+20,borderColor:`${accent}66`}}
//           animate={{scale:[1,1.32,1],opacity:[.9,0,.9]}}
//           transition={{duration:2,repeat:Infinity,ease:'easeInOut'}}
//         />
//       )}
//       <motion.div
//         className="flex items-center justify-center rounded-full border-2"
//         style={{width:NODE_SZ,height:NODE_SZ,background:bg,borderColor:border,boxShadow:shadow,
//           cursor:isLocked?'not-allowed':'pointer'}}
//         whileHover={{scale:isLocked?1:1.1}}
//         whileTap={{scale:isLocked?1:.93}}
//         onClick={()=>!isLocked&&onClick(node)}
//       >
//         {isLocked&&<Lock size={13} className="text-gray-700"/>}
//         {isAvail&&(
//           <motion.div className="rounded-full"
//             style={{width:10,height:10,background:accent,boxShadow:`0 0 10px ${accent}`}}
//             animate={{opacity:[.5,1,.5]}} transition={{duration:1.6,repeat:Infinity}}
//           />
//         )}
//         {isDone&&<Stars count={node.stars}/>}
//       </motion.div>
//       <div className="hidden sm:block px-1.5 py-0.5 rounded-full text-[8px] font-bold font-mono max-w-[74px] truncate text-center"
//         style={{background:'rgba(0,0,0,.72)',backdropFilter:'blur(4px)',
//           color:isLocked?'#374151':isDone?'#fbbf24':accent,
//           border:`1px solid ${isLocked?'#1e2937':isDone?'#92400e40':accent+'35'}`}}>
//         {node.problem?.title?.split(' ').slice(0,2).join(' ')||`Node ${node.nodeNum}`}
//       </div>
//     </div>
//   );
// };

// // Boss node
// const BossNodeCanvas = ({ node, onClick }) => {
//   const isMid   = node.bossType === 'mid';
//   const isLocked= node.state === 'locked';
//   const isDone  = node.state === 'completed';
//   const accent  = isMid ? '#a855f7' : '#ef4444';
//   const icon    = isLocked?'🔒':isDone?(isMid?'✅':'👑'):isMid?'⚔️':'💀';
//   const glow    = isLocked?'none':isDone?'0 0 20px #fbbf2460':`0 0 28px ${accent}70,0 0 55px ${accent}30`;
//   const bg      = isLocked?'radial-gradient(circle,#111,#070707)':isMid
//     ?'radial-gradient(circle at 35% 30%,#3b0764,#140225)'
//     :'radial-gradient(circle at 35% 30%,#7f1d1d,#200404)';

//   return (
//     <div className="flex flex-col items-center gap-1" style={{ opacity: isLocked ? 0.5 : 1 }}>
//       {!isLocked&&(
//         <div className="px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase"
//           style={{background:isMid?'#6b21a8':'#991b1b',
//             color:isDone?'#fde68a':isMid?'#e9d5ff':'#fecaca',
//             border:`1px solid ${accent}50`}}>
//           {isMid?'MID BOSS':'ZONE BOSS'}
//         </div>
//       )}
//       <div className="relative flex items-center justify-center" style={{width:BOSS_SZ+40,height:BOSS_SZ+40}}>
//         {!isLocked&&!isDone&&[0,1].slice(0,isMid?1:2).map(i=>(
//           <motion.div key={i} className="absolute rounded-full border-2"
//             style={{width:BOSS_SZ+20+i*18,height:BOSS_SZ+20+i*18,borderColor:`${accent}${i===0?'aa':'55'}`}}
//             animate={{scale:[1,1.3+i*.1,1],opacity:[.7,0,.7]}}
//             transition={{duration:1.8+i*.5,delay:i*.3,repeat:Infinity,ease:'easeInOut'}}
//           />
//         ))}
//         <motion.div
//           className="relative flex items-center justify-center rounded-full border-[3px]"
//           style={{width:BOSS_SZ,height:BOSS_SZ,background:bg,
//             borderColor:isLocked?'#374151':isDone?'#fbbf24':accent,
//             boxShadow:glow,cursor:isLocked?'not-allowed':'pointer'}}
//           whileHover={{scale:isLocked?1:1.08}} whileTap={{scale:isLocked?1:.93}}
//           onClick={()=>!isLocked&&onClick(node)}
//         >
//           {!isLocked&&(
//             <motion.div className="absolute inset-2 rounded-full"
//               style={{background:`radial-gradient(circle,${isDone?'#fbbf2430':accent+'25'},transparent)`,filter:'blur(6px)'}}
//               animate={{opacity:[.4,1,.4]}} transition={{duration:2.2,repeat:Infinity}}
//             />
//           )}
//           <span className="text-2xl select-none relative z-10"
//             style={{fontSize:isMid?24:28,filter:isLocked?'grayscale(1) brightness(0.2)':`drop-shadow(0 0 8px ${accent})`}}>
//             {icon}
//           </span>
//         </motion.div>
//       </div>
//       {isDone&&<Stars count={node.stars}/>}
//       <div className="hidden sm:block px-2 py-0.5 rounded-full text-[8px] font-bold font-mono max-w-[100px] truncate text-center"
//         style={{background:'rgba(0,0,0,.75)',backdropFilter:'blur(4px)',
//           color:isLocked?'#4b5563':isDone?'#fbbf24':isMid?'#e9d5ff':'#fecaca',
//           border:`1px solid ${isLocked?'#1f2937':isDone?'#92400e40':accent+'40'}`}}>
//         {node.problem?.title?.split(' ').slice(0,3).join(' ')}
//       </div>
//     </div>
//   );
// };

// // ── Main component ────────────────────────────────────────────────────────────
// const CampaignMapCanvas = ({ zone, onBack, onNodeClick }) => {
//   const containerRef = useRef(null);
//   const x = useMotionValue(0);
//   const y = useMotionValue(0);

//   const dragConstraints = useMemo(() => {
//     const vw = window.innerWidth;
//     const vh = window.innerHeight;
//     return {
//       left:   Math.min(0, vw - ZONE_W),
//       right:  0,
//       top:    Math.min(0, vh - ZONE_H - 80),
//       bottom: 0,
//     };
//   }, []);

//   const nodePositions = useMemo(() =>
//     zone.nodes.map((node,i) => ({ ...node, ...getLocalNodePos(i), _idx:i })),
//     [zone]
//   );

//   const { theme } = zone;

//   const segments = useMemo(() =>
//     nodePositions.slice(0,14).map((a,i)=>{
//       const b   = nodePositions[i+1];
//       const lit = a.state==='completed' && b.state!=='locked';
//       return { d:segPath(a,b), lit, color:theme.path };
//     }),
//     [nodePositions,theme.path]
//   );

//   return (
//     <div ref={containerRef} className="relative w-full h-full overflow-hidden"
//       style={{background:`linear-gradient(175deg,${theme.bgGrad[0]},${theme.bgGrad[1]},${theme.bgGrad[2]})`}}>

//       {/* ── Back button — z-50, top-left, safe from everything ────── */}
//       <button onClick={onBack}
//         className="absolute top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-sm transition-all"
//         style={{background:'rgba(0,0,0,.7)',backdropFilter:'blur(10px)',
//           border:`1px solid ${theme.border}60`,color:theme.accent,
//           boxShadow:`0 0 14px ${theme.glow}`}}>
//         <ArrowLeft size={16}/>
//         <span className="hidden sm:inline">Zones</span>
//       </button>

//       {/* ── Zone title — centred, z-40, pointer-events-none ─────────── */}
//       <div className="absolute top-4 left-0 right-0 flex justify-center z-40 pointer-events-none px-20">
//         <div className="flex items-center gap-2 px-4 py-2 rounded-2xl"
//           style={{background:'rgba(0,0,0,.6)',backdropFilter:'blur(12px)',border:`1px solid ${theme.border}50`}}>
//           <span className="text-xl select-none">{zone.icon}</span>
//           <div>
//             <h2 className="font-black text-sm leading-none"
//               style={{background:`linear-gradient(135deg,${theme.titleGrad[0]},${theme.titleGrad[1]})`,
//                 WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
//                 fontFamily:"'JetBrains Mono',monospace"}}>
//               {zone.name}
//             </h2>
//             <p className="text-[9px] font-bold uppercase tracking-widest mt-0.5"
//               style={{color:theme.accent,opacity:.7}}>
//               {zone.completedCount}/{zone.nodes.length} complete
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* ── Progress bar — below the title strip, z-40 ─────────────── */}
//       <div className="absolute top-[72px] left-6 right-6 z-40 pointer-events-none">
//         <div className="h-1.5 rounded-full overflow-hidden" style={{background:'#1e293b'}}>
//           <motion.div className="h-full rounded-full"
//             style={{background:`linear-gradient(90deg,${theme.path},${theme.accent})`}}
//             initial={{width:0}}
//             animate={{width:`${zone.progressPct}%`}}
//             transition={{duration:.8,ease:'easeOut',delay:.3}}
//           />
//         </div>
//       </div>

//       {/* ── Draggable canvas — NO wheel events ─────────────────────── */}
//       <motion.div
//         drag
//         dragConstraints={dragConstraints}
//         dragElastic={0.06}
//         dragMomentum={true}
//         style={{x, y, width:ZONE_W, height:ZONE_H, touchAction:'none', userSelect:'none', cursor:'grab'}}
//         whileDrag={{cursor:'grabbing'}}
//         className="absolute top-0 left-0"
//       >
//         {/* SVG paths */}
//         <svg className="absolute inset-0 pointer-events-none z-10"
//           style={{width:ZONE_W,height:ZONE_H,overflow:'visible'}}>
//           <defs>
//             <filter id={`pg-${zone.id}`} x="-20%" y="-20%" width="140%" height="140%">
//               <feGaussianBlur stdDeviation="3" result="b"/>
//               <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
//             </filter>
//           </defs>
//           {segments.map((seg,i)=>(
//             <g key={i}>
//               {seg.lit&&<path d={seg.d} fill="none" stroke={seg.color} strokeWidth={9} strokeOpacity={.18} filter={`url(#pg-${zone.id})`}/>}
//               <path d={seg.d} fill="none"
//                 stroke={seg.lit?seg.color:'#1e293b'}
//                 strokeWidth={seg.lit?3:2} strokeOpacity={seg.lit?.85:.5}
//                 strokeLinecap="round" strokeDasharray={seg.lit?'none':'5 7'}
//               />
//               {seg.lit&&(
//                 <circle r="4.5" fill={seg.color} opacity=".9">
//                   <animateMotion dur={`${2.8+i*.04}s`} repeatCount="indefinite" path={seg.d}/>
//                 </circle>
//               )}
//             </g>
//           ))}
//         </svg>

//         {/* Nodes */}
//         {nodePositions.map(node=>{
//           const isBoss = node.nodeType==='boss';
//           return (
//             <div key={node.nodeId} className="absolute flex items-center justify-center"
//               style={{left:node.x,top:node.y,width:0,height:0,zIndex:node.state==='available'?30:20}}>
//               <div style={{position:'absolute',transform:'translate(-50%,-50%)'}}>
//                 {isBoss
//                   ? <BossNodeCanvas node={node} onClick={onNodeClick}/>
//                   : <StdNode node={node} accent={theme.accent} onClick={onNodeClick}/>
//                 }
//               </div>
//             </div>
//           );
//         })}

//         {/* Ground strip */}
//         <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
//           style={{background:theme.ground}}>
//           {theme.decorations?.map((d,i)=>(
//             <span key={i} className="absolute select-none text-lg"
//               style={{bottom:10,left:`${15+i*22}%`,opacity:.65,transform:`rotate(${i%2===0?-6:5}deg)`}}>
//               {d}
//             </span>
//           ))}
//         </div>
//       </motion.div>

//       {/* ══════════════════════════════════════════════════════════════
//           LEGEND — bottom-left, z-50, pointer-events-none
//           Strictly bounded: will NEVER overlap nodes or controls
//           On mobile: slightly smaller text, still visible
//       ══════════════════════════════════════════════════════════════ */}
//       <div className="absolute bottom-6 left-6 z-50 pointer-events-none
//                       bg-black/70 border border-gray-800/60
//                       rounded-xl px-3 py-2.5 backdrop-blur-md
//                       flex flex-col gap-2">
//         {[
//           { col:'#374151', label:'Locked',     glow:false },
//           { col:'#22d3ee', label:'Available',  glow:true  },
//           { col:'#fbbf24', label:'Completed',  glow:true  },
//           { col:'#a855f7', label:'Mid Boss',   glow:true  },
//           { col:'#ef4444', label:'Zone Boss',  glow:true  },
//         ].map((item,i)=>(
//           <div key={i} className="flex items-center gap-2">
//             <div className="w-3 h-3 rounded-full border shrink-0"
//               style={{borderColor:item.col, background:item.col+'28',
//                 boxShadow:item.glow?`0 0 5px ${item.col}60`:'none'}}/>
//             <span className="text-[9px] text-gray-400 font-medium whitespace-nowrap">{item.label}</span>
//           </div>
//         ))}
//         <div className="border-t border-gray-800/50 pt-1.5 text-[9px] text-gray-600">
//           Drag to pan
//         </div>
//       </div>

//       {/* ══════════════════════════════════════════════════════════════
//           NAVIGATE HINT — bottom-right, z-50, pointer-events-none
//           Separated from legend so they never overlap
//       ══════════════════════════════════════════════════════════════ */}
//       <div className="absolute bottom-6 right-6 z-50 pointer-events-none flex items-center gap-2
//                       bg-black/60 border border-gray-800/50 rounded-xl px-3 py-2 backdrop-blur-md">
//         <Target size={13} className="text-gray-500"/>
//         <span className="text-[9px] text-gray-500">Scroll to navigate</span>
//       </div>
//     </div>
//   );
// };

// export default CampaignMapCanvas;
































































// src/components/Campaign/CampaignMapCanvas.jsx
// ─────────────────────────────────────────────────────────────────────────────
// FIXES APPLIED:
//   BUG 3:  bgGrad array coercion — was ${theme.bgGrad} (renders "[object Array]")
//           Fixed to ${theme.bgGrad[0]}, ${theme.bgGrad[1]}, ${theme.bgGrad[2]}
//   BUG 4:  titleGrad array coercion — same fix
//   BUG 5:  Stars component showed 5 stars — fixed to 3
//   BUG 8:  node.problem vs node.problemId — now reads both field names
//   BUG 10: zone.nodes could be undefined — safe fallback (zone.nodes || [])
// ─────────────────────────────────────────────────────────────────────────────

import React, { useRef, useMemo } from 'react';
import { motion, useMotionValue, AnimatePresence } from 'framer-motion';
import { Lock, ArrowLeft, Target } from 'lucide-react';
import {
  ZONE_W, ZONE_H,
  NODE_RADIUS, BOSS_RADIUS,
  getLocalNodePos,
} from './campaignWorldData';

const NODE_SZ = NODE_RADIUS * 2;
const BOSS_SZ = BOSS_RADIUS * 2;

// ── Bezier segment path between two positioned nodes ──────────────────────────
const segPath = (a, b) => {
  const sameRow = Math.floor(a._idx / 5) === Math.floor(b._idx / 5);
  if (sameRow) {
    const mx = (a.x + b.x) / 2;
    return `M ${a.x} ${a.y} Q ${mx} ${a.y - 20} ${b.x} ${b.y}`;
  }
  return (
    `M ${a.x} ${a.y} ` +
    `C ${a.x} ${a.y + (b.y - a.y) * 0.45} ` +
    `${b.x} ${a.y + (b.y - a.y) * 0.55} ` +
    `${b.x} ${b.y}`
  );
};

// ── Stars — BUG 5 FIX ─────────────────────────────────────────────────────────
// Was: Array.from({ length: 5 }) — showed 5 stars, campaign uses 3-star system
const Stars = ({ count = 0 }) => (
  <div className="flex gap-0.5 justify-center">
    {/* ✅ FIX BUG 5: was length: 5, campaign uses a 3-star rating system */}
    {Array.from({ length: 3 }, (_, i) => (
      <span key={i} style={{ fontSize: 9, color: i < count ? '#fbbf24' : '#374151' }}>
        ★
      </span>
    ))}
  </div>
);

// ── Helper: read title from either data-file field or API field ───────────────
// BUG 8 FIX: data files use node.problem.title; API uses node.problemId.title
const getNodeTitle = (node) =>
  node.problem?.title || node.problemId?.title || null;

// ── Standard node ─────────────────────────────────────────────────────────────
const StdNode = ({ node, accent, onClick }) => {
  const isLocked = node.state === 'locked';
  const isAvail  = node.state === 'available';
  const isDone   = node.state === 'completed';

  const border = isLocked ? '#374151' : isDone ? '#fbbf24' : accent;
  const bg     = isLocked
    ? 'radial-gradient(circle,#0e1117,#070a10)'
    : isDone
      ? 'radial-gradient(circle at 35% 35%,#2d1800,#0a0600)'
      : `radial-gradient(circle at 35% 35%,${accent}28,${accent}08)`;
  const shadow = isLocked
    ? 'none'
    : isDone
      ? '0 0 14px #fbbf2470'
      : `0 0 18px ${accent}65,0 0 36px ${accent}22`;

  // ✅ FIX BUG 8: read title from whichever field exists
  const title = getNodeTitle(node);

  return (
    <div className="flex flex-col items-center gap-1" style={{ opacity: isLocked ? 0.5 : 1 }}>
      {/* Pulse ring for available nodes */}
      {isAvail && (
        <motion.div
          className="absolute rounded-full border-2 pointer-events-none"
          style={{ width: NODE_SZ + 20, height: NODE_SZ + 20, borderColor: `${accent}66` }}
          animate={{ scale: [1, 1.32, 1], opacity: [0.9, 0, 0.9] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Main circle */}
      <motion.div
        className="flex items-center justify-center rounded-full border-2"
        style={{
          width: NODE_SZ, height: NODE_SZ,
          background: bg, borderColor: border, boxShadow: shadow,
          cursor: isLocked ? 'not-allowed' : 'pointer',
        }}
        whileHover={{ scale: isLocked ? 1 : 1.1 }}
        whileTap={{ scale: isLocked ? 1 : 0.93 }}
        onClick={() => !isLocked && onClick(node)}
      >
        {isLocked && <Lock size={13} className="text-gray-700" />}
        {isAvail && (
          <motion.div
            className="rounded-full"
            style={{ width: 10, height: 10, background: accent, boxShadow: `0 0 10px ${accent}` }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
        )}
        {isDone && <Stars count={node.stars} />}
      </motion.div>

      {/* Label */}
      {title && (
        <div
          className="hidden sm:block px-1.5 py-0.5 rounded-full text-[8px] font-bold font-mono max-w-[74px] truncate text-center"
          style={{
            background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(4px)',
            color: isLocked ? '#374151' : isDone ? '#fbbf24' : accent,
            border: `1px solid ${isLocked ? '#1e2937' : isDone ? '#92400e40' : `${accent}35`}`,
          }}
        >
          {title.split(' ').slice(0, 2).join(' ')}
        </div>
      )}
    </div>
  );
};

// ── Boss node ─────────────────────────────────────────────────────────────────
const BossNodeCanvas = ({ node, onClick }) => {
  const isMid    = node.bossType === 'mid';
  const isLocked = node.state === 'locked';
  const isDone   = node.state === 'completed';

  const accent = isMid ? '#a855f7' : '#ef4444';
  const icon   = isLocked ? '🔒' : isDone ? (isMid ? '✅' : '👑') : isMid ? '⚔️' : '💀';
  const glow   = isLocked ? 'none' : isDone
    ? '0 0 20px #fbbf2460'
    : `0 0 28px ${accent}70,0 0 55px ${accent}30`;
  const bg     = isLocked
    ? 'radial-gradient(circle,#111,#070707)'
    : isMid
      ? 'radial-gradient(circle at 35% 30%,#3b0764,#140225)'
      : 'radial-gradient(circle at 35% 30%,#7f1d1d,#200404)';

  // ✅ FIX BUG 8: support both field names
  const title = getNodeTitle(node);

  return (
    <div className="flex flex-col items-center gap-1" style={{ opacity: isLocked ? 0.5 : 1 }}>
      {/* Badge */}
      {!isLocked && (
        <div
          className="px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase"
          style={{
            background: isMid ? '#6b21a8' : '#991b1b',
            color: isDone ? '#fde68a' : isMid ? '#e9d5ff' : '#fecaca',
            border: `1px solid ${accent}50`,
          }}
        >
          {isMid ? 'MID BOSS' : 'ZONE BOSS'}
        </div>
      )}

      {/* Pulsing rings + main circle */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: BOSS_SZ + 40, height: BOSS_SZ + 40 }}
      >
        {!isLocked && !isDone && [0, 1].slice(0, isMid ? 1 : 2).map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border-2"
            style={{
              width:  BOSS_SZ + 20 + i * 18,
              height: BOSS_SZ + 20 + i * 18,
              borderColor: `${accent}${i === 0 ? 'aa' : '55'}`,
            }}
            animate={{ scale: [1, 1.3 + i * 0.1, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 1.8 + i * 0.5, delay: i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        <motion.div
          className="relative flex items-center justify-center rounded-full border-[3px]"
          style={{
            width: BOSS_SZ, height: BOSS_SZ,
            background: bg,
            borderColor: isLocked ? '#374151' : isDone ? '#fbbf24' : accent,
            boxShadow: glow,
            cursor: isLocked ? 'not-allowed' : 'pointer',
          }}
          whileHover={{ scale: isLocked ? 1 : 1.08 }}
          whileTap={{ scale: isLocked ? 1 : 0.93 }}
          onClick={() => !isLocked && onClick(node)}
        >
          {!isLocked && (
            <motion.div
              className="absolute inset-2 rounded-full"
              style={{
                background: `radial-gradient(circle,${isDone ? '#fbbf2430' : `${accent}25`},transparent)`,
                filter: 'blur(6px)',
              }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            />
          )}
          <span
            className="text-2xl select-none relative z-10"
            style={{
              fontSize: isMid ? 24 : 28,
              filter: isLocked
                ? 'grayscale(1) brightness(0.2)'
                : `drop-shadow(0 0 8px ${accent})`,
            }}
          >
            {icon}
          </span>
        </motion.div>
      </div>

      {isDone && <Stars count={node.stars} />}

      {/* Label */}
      {title && (
        <div
          className="hidden sm:block px-2 py-0.5 rounded-full text-[8px] font-bold font-mono max-w-[100px] truncate text-center"
          style={{
            background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)',
            color: isLocked ? '#4b5563' : isDone ? '#fbbf24' : isMid ? '#e9d5ff' : '#fecaca',
            border: `1px solid ${isLocked ? '#1f2937' : isDone ? '#92400e40' : `${accent}40`}`,
          }}
        >
          {title.split(' ').slice(0, 3).join(' ')}
        </div>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const CampaignMapCanvas = ({ zone, onBack, onNodeClick }) => {
  const containerRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const dragConstraints = useMemo(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth  : 375;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 812;
    return {
      left:   Math.min(0, vw - ZONE_W),
      right:  0,
      top:    Math.min(0, vh - ZONE_H - 80),
      bottom: 0,
    };
  }, []);

  // ✅ FIX BUG 10: zone.nodes could be undefined — safe fallback
  const nodePositions = useMemo(
    () => (zone.nodes || []).map((node, i) => ({ ...node, ...getLocalNodePos(i), _idx: i })),
    [zone]
  );

  const { theme } = zone;

  const segments = useMemo(
    () =>
      nodePositions.slice(0, -1).map((a, i) => {
        const b = nodePositions[i + 1];
        if (!b) return null;
        const lit = a.state === 'completed' && b.state !== 'locked';
        return { d: segPath(a, b), lit, color: theme.path };
      }).filter(Boolean),
    [nodePositions, theme.path]
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{
        // ✅ FIX BUG 3: theme.bgGrad is an array — was using ${theme.bgGrad} which
        // coerces the whole array to a string. Must index explicitly: [0], [1], [2]
        background: `linear-gradient(175deg,${theme.bgGrad[0]},${theme.bgGrad[1]},${theme.bgGrad[2]})`,
      }}
    >

      {/* ── Back button — z-50, never covered by nodes ───────────── */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-sm transition-all"
        style={{
          background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(10px)',
          border: `1px solid ${theme.border}60`, color: theme.accent,
          boxShadow: `0 0 14px ${theme.glow}`,
        }}
      >
        <ArrowLeft size={16} />
        <span className="hidden sm:inline">Zones</span>
      </button>

      {/* ── Zone title — centred, pointer-events-none ────────────── */}
      <div className="absolute top-4 left-0 right-0 flex justify-center z-40 pointer-events-none px-20">
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-2xl"
          style={{
            background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(12px)',
            border: `1px solid ${theme.border}50`,
          }}
        >
          <span className="text-xl select-none">{zone.icon}</span>
          <div>
            <h2
              className="font-black text-sm leading-none"
              style={{
                // ✅ FIX BUG 4: theme.titleGrad is an array — same fix as bgGrad
                background: `linear-gradient(135deg,${theme.titleGrad[0]},${theme.titleGrad[1]})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontFamily: "'JetBrains Mono',monospace",
              }}
            >
              {zone.name}
            </h2>
            <p
              className="text-[9px] font-bold uppercase tracking-widest mt-0.5"
              style={{ color: theme.accent, opacity: 0.7 }}
            >
              {(zone.completedCount ?? 0)}/{(zone.nodes || []).length} complete
            </p>
          </div>
        </div>
      </div>

      {/* ── Progress bar ─────────────────────────────────────────── */}
      <div className="absolute top-[72px] left-6 right-6 z-40 pointer-events-none">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1e293b' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg,${theme.path},${theme.accent})` }}
            initial={{ width: 0 }}
            animate={{ width: `${zone.progressPct ?? 0}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
          />
        </div>
      </div>

      {/* ── Draggable canvas — NO wheel zoom ─────────────────────── */}
      <motion.div
        drag
        dragConstraints={dragConstraints}
        dragElastic={0.06}
        dragMomentum={true}
        style={{
          x, y,
          width: ZONE_W, height: ZONE_H,
          touchAction: 'none', userSelect: 'none', cursor: 'grab',
        }}
        whileDrag={{ cursor: 'grabbing' }}
        className="absolute top-0 left-0"
      >
        {/* SVG bezier paths */}
        <svg
          className="absolute inset-0 pointer-events-none z-10"
          style={{ width: ZONE_W, height: ZONE_H, overflow: 'visible' }}
        >
          <defs>
            <filter id={`pg-${zone.id}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {segments.map((seg, i) => (
            <g key={i}>
              {seg.lit && (
                <path
                  d={seg.d} fill="none"
                  stroke={seg.color} strokeWidth={9} strokeOpacity={0.18}
                  filter={`url(#pg-${zone.id})`}
                />
              )}
              <path
                d={seg.d} fill="none"
                stroke={seg.lit ? seg.color : '#1e293b'}
                strokeWidth={seg.lit ? 3 : 2}
                strokeOpacity={seg.lit ? 0.85 : 0.5}
                strokeLinecap="round"
                strokeDasharray={seg.lit ? 'none' : '5 7'}
              />
              {seg.lit && (
                <circle r="4.5" fill={seg.color} opacity="0.9">
                  <animateMotion
                    dur={`${2.8 + i * 0.04}s`}
                    repeatCount="indefinite"
                    path={seg.d}
                  />
                </circle>
              )}
            </g>
          ))}
        </svg>

        {/* Node elements */}
        {nodePositions.map((node) => {
          const isBoss = node.nodeType === 'boss';
          return (
            <div
              key={node.nodeId || node.id || node._idx}
              className="absolute flex items-center justify-center"
              style={{
                left: node.x, top: node.y,
                width: 0, height: 0,
                zIndex: node.state === 'available' ? 30 : 20,
              }}
            >
              <div style={{ position: 'absolute', transform: 'translate(-50%,-50%)' }}>
                {isBoss
                  ? <BossNodeCanvas node={node} onClick={onNodeClick} />
                  : <StdNode node={node} accent={theme.accent} onClick={onNodeClick} />
                }
              </div>
            </div>
          );
        })}

        {/* Ground strip with decorations */}
        <div
          className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
          style={{ background: theme.ground }}
        >
          {(theme.decorations || []).map((d, i) => (
            <span
              key={i}
              className="absolute select-none text-lg"
              style={{
                bottom: 10,
                left: `${15 + i * 22}%`,
                opacity: 0.65,
                transform: `rotate(${i % 2 === 0 ? -6 : 5}deg)`,
              }}
            >
              {d}
            </span>
          ))}
        </div>
      </motion.div>

      {/* ── Legend — strictly bottom-left, never overlaps nodes ──── */}
      <div
        className="absolute bottom-6 left-6 z-50 pointer-events-none
                   bg-black/70 border border-gray-800/60
                   rounded-xl px-3 py-2.5 backdrop-blur-md
                   flex flex-col gap-2"
      >
        {[
          { col: '#374151', label: 'Locked',    glow: false },
          { col: '#22d3ee', label: 'Available', glow: true  },
          { col: '#fbbf24', label: 'Completed', glow: true  },
          { col: '#a855f7', label: 'Mid Boss',  glow: true  },
          { col: '#ef4444', label: 'Zone Boss', glow: true  },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full border shrink-0"
              style={{
                borderColor: item.col,
                background: `${item.col}28`,
                boxShadow: item.glow ? `0 0 5px ${item.col}60` : 'none',
              }}
            />
            <span className="text-[9px] text-gray-400 font-medium whitespace-nowrap">
              {item.label}
            </span>
          </div>
        ))}
        <div className="border-t border-gray-800/50 pt-1.5 text-[9px] text-gray-600">
          Drag to pan
        </div>
      </div>

      {/* ── Navigate hint — strictly bottom-right ────────────────── */}
      <div
        className="absolute bottom-6 right-6 z-50 pointer-events-none
                   flex items-center gap-2
                   bg-black/60 border border-gray-800/50
                   rounded-xl px-3 py-2 backdrop-blur-md"
      >
        <Target size={13} className="text-gray-500" />
        <span className="text-[9px] text-gray-500">Scroll to navigate</span>
      </div>
    </div>
  );
};

export default CampaignMapCanvas;
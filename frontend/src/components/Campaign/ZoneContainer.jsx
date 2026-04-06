// // src/components/Campaign/ZoneContainer.jsx
// import React, { useMemo } from 'react';
// import { motion } from 'framer-motion';
// import WeatherEffect from './WeatherEffect';
// import { buildZonePath, getLocalNodePos, ZONE_W, ZONE_H, MID_BOSS_IDX, MAIN_BOSS_IDX, NODE_RADIUS, BOSS_RADIUS } from './campaignWorldData';

// // Pre-built path is the same for every zone (only colours differ)
// const SHARED_PATH = buildZonePath();

// // Decorative ground strip geometry
// const GROUND_H = 90;

// const ZoneContainer = ({ config, completedIds = new Set(), children }) => {
//   const { id, name, subtitle, icon, weather, bgGrad, groundColor, accent, path: pathColor,
//           titleGrad, border, glow, decorations } = config;

//   // Which nodes in this zone are completed (for path lighting)
//   const litPairs = useMemo(() => {
//     const pairs = [];
//     for (let i = 0; i < 14; i++) {
//       const aId = `${id}_${i + 1}`;
//       const bId = `${id}_${i + 2}`;
//       pairs.push({ lit: completedIds.has(aId) && completedIds.has(bId) });
//     }
//     return pairs;
//   }, [id, completedIds]);

//   // Individual segment paths (for colouring lit vs unlit separately)
//   const segPaths = useMemo(() => {
//     const pts = Array.from({ length: 15 }, (_, i) => getLocalNodePos(i));
//     return pts.slice(0, 14).map((prev, i) => {
//       const cur     = pts[i + 1];
//       const sameRow = Math.floor(i / 5) === Math.floor((i + 1) / 5);
//       if (sameRow) {
//         const mx = (prev.x + cur.x) / 2;
//         return `M ${prev.x} ${prev.y} Q ${mx} ${prev.y - 18} ${cur.x} ${cur.y}`;
//       }
//       const cp1x = prev.x, cp1y = prev.y + (cur.y - prev.y) * 0.45;
//       const cp2x = cur.x,  cp2y = prev.y + (cur.y - prev.y) * 0.55;
//       return `M ${prev.x} ${prev.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${cur.x} ${cur.y}`;
//     });
//   }, []);

//   return (
//     <motion.div
//       className="relative overflow-hidden"
//       style={{ width: ZONE_W, height: ZONE_H, borderRadius: 20 }}
//       initial={{ opacity: 0, y: 24 }}
//       whileInView={{ opacity: 1, y: 0 }}
//       viewport={{ once: true, margin: '-80px' }}
//       transition={{ duration: 0.55, ease: 'easeOut' }}
//     >
//       {/* ── Biome background ─────────────────────────────────────── */}
//       <div
//         className="absolute inset-0"
//         style={{
//           background: `linear-gradient(175deg, ${bgGrad[0]} 0%, ${bgGrad[1]} 55%, ${bgGrad[2]} 100%)`,
//           borderRadius: 20,
//           boxShadow: `inset 0 0 80px ${glow}, 0 0 0 1.5px ${border}40`,
//         }}
//       >
//         {/* Radial top-glow */}
//         <div className="absolute inset-0 rounded-[20px]"
//           style={{ background:`radial-gradient(ellipse 80% 45% at 50% 20%, ${accent}14, transparent 65%)` }} />

//         {/* Weather particles */}
//         <WeatherEffect type={weather} zoneId={id} primary={accent} />

//         {/* Ground strip */}
//         <div className="absolute bottom-0 left-0 right-0" style={{ height: GROUND_H, background: groundColor, borderRadius:'0 0 20px 20px' }}>
//           <div className="absolute top-0 left-0 right-0 h-12"
//             style={{ background:`linear-gradient(180deg, transparent, ${groundColor})` }} />
//           {/* Decorative emojis on ground */}
//           {decorations.map((d, i) => (
//             <span key={i} className="absolute select-none" style={{
//               fontSize: 20, bottom: 14, left: `${15 + i * 22}%`, opacity: .7,
//               transform:`rotate(${(i%2===0?-8:6)}deg)`,
//             }}>{d}</span>
//           ))}
//         </div>
//       </div>

//       {/* ── RPG zone title ───────────────────────────────────────── */}
//       <div className="absolute top-0 left-0 right-0 px-6 pt-5 pb-2 z-20 pointer-events-none">
//         <div
//           className="inline-flex items-center gap-2 px-3 py-1 rounded-xl mb-1.5"
//           style={{ background:`${accent}18`, border:`1px solid ${border}35` }}
//         >
//           <span className="text-base select-none">{icon}</span>
//           <p className="text-[9px] font-bold uppercase tracking-[0.25em]" style={{ color: accent }}>{subtitle}</p>
//         </div>
//         <h2
//           className="font-black leading-none tracking-tight select-none"
//           style={{
//             fontSize: name.length > 20 ? 22 : 26,
//             fontFamily:"'JetBrains Mono','Fira Code',monospace",
//             background: `linear-gradient(135deg, ${titleGrad[0]}, ${titleGrad[1]})`,
//             WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
//             textShadow:'none',
//             filter: `drop-shadow(0 0 20px ${accent}40)`,
//           }}
//         >
//           {name}
//         </h2>
//       </div>

//       {/* ── SVG: snake path segments + glow filter ───────────────── */}
//       <svg className="absolute inset-0 pointer-events-none z-10"
//         style={{ width: ZONE_W, height: ZONE_H, overflow:'visible' }}>
//         <defs>
//           <filter id={`pg-${id}`} x="-30%" y="-30%" width="160%" height="160%">
//             <feGaussianBlur stdDeviation="3.5" result="b"/>
//             <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
//           </filter>
//         </defs>

//         {segPaths.map((d, i) => {
//           const lit = litPairs[i]?.lit;
//           return (
//             <g key={i}>
//               {/* Shadow / glow on lit segments */}
//               {lit && <path d={d} fill="none" stroke={pathColor} strokeWidth={10} strokeOpacity={.15} filter={`url(#pg-${id})`}/>}
//               {/* Main segment */}
//               <path d={d} fill="none"
//                 stroke={lit ? pathColor : '#1e293b'}
//                 strokeWidth={lit ? 3 : 2.2}
//                 strokeOpacity={lit ? .85 : .55}
//                 strokeLinecap="round"
//                 strokeDasharray={lit ? 'none' : '5 7'}
//               />
//               {/* Animated traveller dot on lit segments */}
//               {lit && (
//                 <circle r="4.5" fill={pathColor} opacity=".9">
//                   <animateMotion dur={`${2.5 + i * .05}s`} repeatCount="indefinite" path={d}/>
//                 </circle>
//               )}
//             </g>
//           );
//         })}
//       </svg>

//       {/* ── Node layer ────────────────────────────────────────────── */}
//       <div className="absolute inset-0 z-30">
//         {children}
//       </div>

//       {/* ── Bottom border accent ─────────────────────────────────── */}
//       <div className="absolute bottom-0 left-8 right-8 h-px z-40"
//         style={{ background:`linear-gradient(90deg,transparent,${accent}60,transparent)` }}/>
//     </motion.div>
//   );
// };

// export default React.memo(ZoneContainer);






























// src/components/Campaign/ZoneContainer.jsx
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import WeatherEffect from './WeatherEffect';
import { buildZonePath, getLocalNodePos, ZONE_W, ZONE_H, MID_BOSS_IDX, MAIN_BOSS_IDX, NODE_RADIUS, BOSS_RADIUS } from './campaignWorldData';

// Pre-built path is the same for every zone (only colours differ)
const SHARED_PATH = buildZonePath();

// Decorative ground strip geometry
const GROUND_H = 90;

const ZoneContainer = ({ config, completedIds = new Set(), children }) => {
  const { id, name, subtitle, icon, weather, bgGrad, groundColor, accent, path: pathColor,
          titleGrad, border, glow, decorations, nodes } = config || {};

  // 🛡️ CRITICAL FIX: Robust path lighting logic
  const litPairs = useMemo(() => {
    const pairs = [];
    
    // Helper function to safely check completion regardless of whether 
    // the parent passed a Set or an Array
    const isCompleted = (nodeId) => {
      if (!nodeId || !completedIds) return false;
      if (completedIds instanceof Set) return completedIds.has(nodeId);
      if (Array.isArray(completedIds)) return completedIds.includes(nodeId);
      return false;
    };

    for (let i = 0; i < 14; i++) {
      // FIX: Use the actual nodeId from the data if available.
      // If not, correctly zero-pad the fallback string (e.g., "aa_01" instead of "aa_1")
      const aId = nodes?.[i]?.nodeId || `${id}_${String(i + 1).padStart(2, '0')}`;
      const bId = nodes?.[i + 1]?.nodeId || `${id}_${String(i + 2).padStart(2, '0')}`;
      
      pairs.push({ lit: isCompleted(aId) && isCompleted(bId) });
    }
    return pairs;
  }, [id, nodes, completedIds]);

  // Individual segment paths (for colouring lit vs unlit separately)
  const segPaths = useMemo(() => {
    const pts = Array.from({ length: 15 }, (_, i) => getLocalNodePos(i));
    return pts.slice(0, 14).map((prev, i) => {
      const cur     = pts[i + 1];
      const sameRow = Math.floor(i / 5) === Math.floor((i + 1) / 5);
      if (sameRow) {
        const mx = (prev.x + cur.x) / 2;
        return `M ${prev.x} ${prev.y} Q ${mx} ${prev.y - 18} ${cur.x} ${cur.y}`;
      }
      const cp1x = prev.x, cp1y = prev.y + (cur.y - prev.y) * 0.45;
      const cp2x = cur.x,  cp2y = prev.y + (cur.y - prev.y) * 0.55;
      return `M ${prev.x} ${prev.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${cur.x} ${cur.y}`;
    });
  }, []);

  if (!config) return null; // Safe fallback

  return (
    <motion.div
      className="relative overflow-hidden"
      style={{ width: ZONE_W, height: ZONE_H, borderRadius: 20 }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
    >
      {/* ── Biome background ─────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(175deg, ${bgGrad?.[0]} 0%, ${bgGrad?.[1]} 55%, ${bgGrad?.[2]} 100%)`,
          borderRadius: 20,
          boxShadow: `inset 0 0 80px ${glow}, 0 0 0 1.5px ${border}40`,
        }}
      >
        {/* Radial top-glow */}
        <div className="absolute inset-0 rounded-[20px]"
          style={{ background:`radial-gradient(ellipse 80% 45% at 50% 20%, ${accent}14, transparent 65%)` }} />

        {/* Weather particles */}
        <WeatherEffect type={weather} zoneId={id} primary={accent} />

        {/* Ground strip */}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: GROUND_H, background: groundColor, borderRadius:'0 0 20px 20px' }}>
          <div className="absolute top-0 left-0 right-0 h-12"
            style={{ background:`linear-gradient(180deg, transparent, ${groundColor})` }} />
          {/* Decorative emojis on ground */}
          {(decorations || []).map((d, i) => (
            <span key={i} className="absolute select-none" style={{
              fontSize: 20, bottom: 14, left: `${15 + i * 22}%`, opacity: .7,
              transform:`rotate(${(i%2===0?-8:6)}deg)`,
            }}>{d}</span>
          ))}
        </div>
      </div>

      {/* ── RPG zone title ───────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 px-6 pt-5 pb-2 z-20 pointer-events-none">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-xl mb-1.5"
          style={{ background:`${accent}18`, border:`1px solid ${border}35` }}
        >
          <span className="text-base select-none">{icon}</span>
          <p className="text-[9px] font-bold uppercase tracking-[0.25em]" style={{ color: accent }}>{subtitle}</p>
        </div>
        <h2
          className="font-black leading-none tracking-tight select-none"
          style={{
            fontSize: (name?.length || 0) > 20 ? 22 : 26,
            fontFamily:"'JetBrains Mono','Fira Code',monospace",
            background: `linear-gradient(135deg, ${titleGrad?.[0]}, ${titleGrad?.[1]})`,
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            textShadow:'none',
            filter: `drop-shadow(0 0 20px ${accent}40)`,
          }}
        >
          {name}
        </h2>
      </div>

      {/* ── SVG: snake path segments + glow filter ───────────────── */}
      <svg className="absolute inset-0 pointer-events-none z-10"
        style={{ width: ZONE_W, height: ZONE_H, overflow:'visible' }}>
        <defs>
          <filter id={`pg-${id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {segPaths.map((d, i) => {
          const lit = litPairs[i]?.lit;
          return (
            <g key={i}>
              {/* Shadow / glow on lit segments */}
              {lit && <path d={d} fill="none" stroke={pathColor} strokeWidth={10} strokeOpacity={.15} filter={`url(#pg-${id})`}/>}
              {/* Main segment */}
              <path d={d} fill="none"
                stroke={lit ? pathColor : '#1e293b'}
                strokeWidth={lit ? 3 : 2.2}
                strokeOpacity={lit ? .85 : .55}
                strokeLinecap="round"
                strokeDasharray={lit ? 'none' : '5 7'}
              />
              {/* Animated traveller dot on lit segments */}
              {lit && (
                <circle r="4.5" fill={pathColor} opacity=".9">
                  <animateMotion dur={`${2.5 + i * .05}s`} repeatCount="indefinite" path={d}/>
                </circle>
              )}
            </g>
          );
        })}
      </svg>

      {/* ── Node layer ────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-30">
        {children}
      </div>

      {/* ── Bottom border accent ─────────────────────────────────── */}
      <div className="absolute bottom-0 left-8 right-8 h-px z-40"
        style={{ background:`linear-gradient(90deg,transparent,${accent}60,transparent)` }}/>
    </motion.div>
  );
};

// React.memo is safe here, as long as you pass a brand-new Set or Array for completedIds 
// from your parent component when a level is beaten.
export default React.memo(ZoneContainer);

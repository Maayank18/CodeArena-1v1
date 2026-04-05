// src/components/Campaign/CampaignMapCanvas.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The Tier 2 "Snake Map" canvas.
// • Drag-only panning with bounded constraints (NO scroll-wheel / pinch zoom).
// • Scale is fixed at 1x — only 2D X/Y panning allowed.
// • Visual states: locked (grey, 50% opacity), available (pulse glow), completed (gold stars).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useRef, useMemo } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { Lock, ArrowLeft } from 'lucide-react';
import { ZONE_W, ZONE_H, NODE_RADIUS, BOSS_RADIUS, MID_BOSS_IDX, MAIN_BOSS_IDX, getLocalNodePos } from './campaignWorldData';

// ── Canvas geometry constants ─────────────────────────────────────────────────
const CANVAS_W = ZONE_W;      // 720 — single-column snake map
const NODE_SZ  = NODE_RADIUS * 2;
const BOSS_SZ  = BOSS_RADIUS  * 2;

// Build a quadratic bezier segment path between two node positions
const segPath = (a, b) => {
  const sameRow = Math.floor(a._idx / 5) === Math.floor(b._idx / 5);
  if (sameRow) {
    const mx = (a.x + b.x) / 2;
    return `M ${a.x} ${a.y} Q ${mx} ${a.y - 20} ${b.x} ${b.y}`;
  }
  const cp1x = a.x, cp1y = a.y + (b.y - a.y) * 0.45;
  const cp2x = b.x, cp2y = a.y + (b.y - a.y) * 0.55;
  return `M ${a.x} ${a.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${b.x} ${b.y}`;
};

// ── Stars display ─────────────────────────────────────────────────────────────
const Stars = ({ count }) => (
  <div className="flex gap-0.5 justify-center">
    {[1,2,3].map(i => (
      <span key={i} style={{ fontSize:9, lineHeight:1, color: i <= count ? '#fbbf24' : '#374151' }}>★</span>
    ))}
  </div>
);

// ── Single standard node ──────────────────────────────────────────────────────
const StdNode = ({ node, accent, onNodeClick }) => {
  const isLocked    = node.state === 'locked';
  const isAvailable = node.state === 'available';
  const isCompleted = node.state === 'completed';

  const borderCol = isLocked ? '#374151' : isCompleted ? '#fbbf24' : accent;
  const bg        = isLocked
    ? 'radial-gradient(circle, #0e1117, #070a10)'
    : isCompleted
      ? `radial-gradient(circle at 35% 35%, #2d1800, #0a0600)`
      : `radial-gradient(circle at 35% 35%, ${accent}28, ${accent}08)`;
  const shadow = isLocked ? 'none'
    : isCompleted ? '0 0 14px #fbbf2470'
    : `0 0 18px ${accent}65, 0 0 36px ${accent}22`;

  return (
    <div className="flex flex-col items-center gap-1" style={{ opacity: isLocked ? 0.5 : 1 }}>
      {/* Available pulse ring */}
      {isAvailable && (
        <motion.div
          className="absolute rounded-full border-2 pointer-events-none"
          style={{ width: NODE_SZ + 20, height: NODE_SZ + 20, borderColor: `${accent}66` }}
          animate={{ scale: [1, 1.32, 1], opacity: [0.9, 0, 0.9] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <motion.div
        className="flex items-center justify-center rounded-full border-2"
        style={{
          width: NODE_SZ, height: NODE_SZ,
          background: bg, borderColor: borderCol, boxShadow: shadow,
          cursor: isLocked ? 'not-allowed' : 'pointer',
        }}
        whileHover={{ scale: isLocked ? 1 : 1.12 }}
        whileTap={{   scale: isLocked ? 1 : 0.92 }}
        onClick={() => !isLocked && onNodeClick(node)}
      >
        {isLocked    && <Lock size={13} className="text-gray-700" />}
        {isAvailable && (
          <motion.div className="rounded-full"
            style={{ width: 10, height: 10, background: accent, boxShadow: `0 0 10px ${accent}` }}
            animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.6, repeat: Infinity }}
          />
        )}
        {isCompleted && <Stars count={node.stars} />}
      </motion.div>

      {/* Label (hidden on mobile xs) */}
      <div className="hidden sm:block px-1.5 py-0.5 rounded-full text-[8px] font-bold font-mono max-w-[74px] truncate text-center"
        style={{
          background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(4px)',
          color: isLocked ? '#374151' : isCompleted ? '#fbbf24' : accent,
          border: `1px solid ${isLocked ? '#1e2937' : isCompleted ? '#92400e40' : accent + '35'}`,
        }}
      >
        {node.problem?.title?.split(' ').slice(0, 2).join(' ') || `Node ${node.nodeNum}`}
      </div>
    </div>
  );
};

// ── Boss node ─────────────────────────────────────────────────────────────────
const BossNodeCanvas = ({ node, onNodeClick }) => {
  const isMid       = node.bossType === 'mid';
  const isLocked    = node.state === 'locked';
  const isCompleted = node.state === 'completed';

  const accent  = isMid ? '#a855f7' : '#ef4444';
  const icon    = isCompleted ? (isMid ? '✅' : '👑') : isLocked ? '🔒' : isMid ? '⚔️' : '💀';
  const border  = isLocked ? '#374151' : isCompleted ? '#fbbf24' : accent;
  const glow    = isLocked ? 'none' : isCompleted
    ? '0 0 20px #fbbf2460'
    : `0 0 28px ${accent}70, 0 0 55px ${accent}30`;
  const bg      = isLocked
    ? 'radial-gradient(circle, #111, #070707)'
    : isMid
      ? 'radial-gradient(circle at 35% 30%, #3b0764, #140225)'
      : 'radial-gradient(circle at 35% 30%, #7f1d1d, #200404)';

  return (
    <div className="flex flex-col items-center gap-1" style={{ opacity: isLocked ? 0.5 : 1 }}>
      {/* Badge */}
      {!isLocked && (
        <div className="px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase"
          style={{
            background: isMid ? '#6b21a8' : '#991b1b',
            color: isCompleted ? '#fde68a' : isMid ? '#e9d5ff' : '#fecaca',
            border: `1px solid ${accent}50`,
          }}
        >
          {isMid ? 'MID BOSS' : 'ZONE BOSS'}
        </div>
      )}

      {/* Pulsing rings */}
      <div className="relative flex items-center justify-center" style={{ width: BOSS_SZ + 40, height: BOSS_SZ + 40 }}>
        {!isLocked && !isCompleted && [0, 1].slice(0, isMid ? 1 : 2).map(i => (
          <motion.div key={i}
            className="absolute rounded-full border-2"
            style={{ width: BOSS_SZ + 20 + i * 18, height: BOSS_SZ + 20 + i * 18, borderColor: `${accent}${i === 0 ? 'aa' : '55'}` }}
            animate={{ scale: [1, 1.3 + i * 0.1, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 1.8 + i * 0.5, delay: i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        <motion.div
          className="relative flex items-center justify-center rounded-full border-[3px]"
          style={{
            width: BOSS_SZ, height: BOSS_SZ,
            background: bg, borderColor: border, boxShadow: glow,
            cursor: isLocked ? 'not-allowed' : 'pointer',
          }}
          whileHover={{ scale: isLocked ? 1 : 1.08 }}
          whileTap={{   scale: isLocked ? 1 : 0.92 }}
          onClick={() => !isLocked && onNodeClick(node)}
        >
          {/* Inner glow */}
          {!isLocked && (
            <motion.div className="absolute inset-2 rounded-full"
              style={{ background: `radial-gradient(circle, ${isCompleted ? '#fbbf2430' : accent + '25'}, transparent)`, filter: 'blur(6px)' }}
              animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2.2, repeat: Infinity }}
            />
          )}
          <span className="text-2xl select-none relative z-10"
            style={{ fontSize: isMid ? 24 : 28, filter: isLocked ? 'grayscale(1) brightness(0.2)' : `drop-shadow(0 0 8px ${accent})` }}>
            {icon}
          </span>
        </motion.div>
      </div>

      {isCompleted && <Stars count={node.stars} />}

      <div className="hidden sm:block px-2 py-0.5 rounded-full text-[8px] font-bold font-mono max-w-[100px] truncate text-center"
        style={{
          background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)',
          color: isLocked ? '#4b5563' : isCompleted ? '#fbbf24' : isMid ? '#e9d5ff' : '#fecaca',
          border: `1px solid ${isLocked ? '#1f2937' : isCompleted ? '#92400e40' : accent + '40'}`,
        }}
      >
        {node.problem?.title?.split(' ').slice(0, 3).join(' ')}
      </div>
    </div>
  );
};

// ── Main canvas component ─────────────────────────────────────────────────────
const CampaignMapCanvas = ({ zone, onBack, onNodeClick }) => {
  const containerRef = useRef(null);

  // Motion values for drag-pan
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Compute drag constraints once (keep map within viewport)
  const dragConstraints = useMemo(() => {
    const viewW = typeof window !== 'undefined' ? window.innerWidth  : 375;
    const viewH = typeof window !== 'undefined' ? window.innerHeight : 812;
    return {
      left:   Math.min(0, viewW - CANVAS_W),  // can drag left until right edge visible
      right:  0,                               // can't drag right past origin
      top:    Math.min(0, viewH - ZONE_H - 80),
      bottom: 0,
    };
  }, []);

  // Pre-compute node positions with index tag
  const nodePositions = useMemo(() =>
    zone.nodes.map((node, i) => {
      const pos = getLocalNodePos(i);
      return { ...node, ...pos, _idx: i };
    }),
    [zone]
  );

  const { theme } = zone;

  // Build path segments (14 segments for 15 nodes)
  const segments = useMemo(() =>
    nodePositions.slice(0, 14).map((a, i) => {
      const b    = nodePositions[i + 1];
      const litA = a.state === 'completed';
      const litB = b.state !== 'locked';
      return { d: segPath(a, b), lit: litA && litB, color: theme.path };
    }),
    [nodePositions, theme.path]
  );

  return (
    <div className="relative w-full h-full overflow-hidden"
      style={{ background: `linear-gradient(175deg, ${theme.bgGrad[0]}, ${theme.bgGrad[1]}, ${theme.bgGrad[2]})` }}
    >
      {/* ── Back button (safe from map nodes) ─────────────── */}
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

      {/* ── Zone title strip ───────────────────────────────── */}
      <div className="absolute top-4 left-0 right-0 flex justify-center items-center z-40 pointer-events-none px-16">
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl"
          style={{ background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(12px)', border: `1px solid ${theme.border}50` }}
        >
          <span className="text-xl select-none">{zone.icon}</span>
          <div>
            <h2 className="font-black text-sm leading-none"
              style={{
                background: `linear-gradient(135deg, ${theme.titleGrad[0]}, ${theme.titleGrad[1]})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
              {zone.name}
            </h2>
            <p className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: theme.accent, opacity: 0.7 }}>
              {zone.completedCount}/{zone.nodes.length} complete
            </p>
          </div>
        </div>
      </div>

      {/* ── Progress bar ───────────────────────────────────── */}
      <div className="absolute top-[72px] left-6 right-6 z-40 pointer-events-none">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1e293b' }}>
          <motion.div className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${theme.path}, ${theme.accent})` }}
            initial={{ width: 0 }}
            animate={{ width: `${zone.progressPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
          />
        </div>
      </div>

      {/* ── Draggable canvas ────────────────────────────────── */}
      <motion.div
        ref={containerRef}
        drag
        dragConstraints={dragConstraints}
        dragElastic={0.08}
        dragMomentum={true}
        // NO onWheel — zoom strictly disabled
        style={{ x, y, width: CANVAS_W, height: ZONE_H, touchAction: 'none', cursor: 'grab', userSelect: 'none' }}
        whileDrag={{ cursor: 'grabbing' }}
        className="absolute top-0 left-0"
      >
        {/* SVG path layer */}
        <svg className="absolute inset-0 pointer-events-none z-10"
          style={{ width: CANVAS_W, height: ZONE_H, overflow: 'visible' }}>
          <defs>
            <filter id={`path-glow-${zone.id}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {segments.map((seg, i) => (
            <g key={i}>
              {seg.lit && <path d={seg.d} fill="none" stroke={seg.color} strokeWidth={9} strokeOpacity={0.18} filter={`url(#path-glow-${zone.id})`} />}
              <path d={seg.d} fill="none"
                stroke={seg.lit ? seg.color : '#1e293b'}
                strokeWidth={seg.lit ? 3 : 2}
                strokeOpacity={seg.lit ? 0.85 : 0.5}
                strokeLinecap="round"
                strokeDasharray={seg.lit ? 'none' : '5 7'}
              />
              {seg.lit && (
                <circle r="4.5" fill={seg.color} opacity={0.9}>
                  <animateMotion dur={`${2.8 + i * 0.04}s`} repeatCount="indefinite" path={seg.d}/>
                </circle>
              )}
            </g>
          ))}
        </svg>

        {/* Node layer */}
        {nodePositions.map((node) => {
          const isBoss = node.nodeType === 'boss';

          return (
            <div key={node.nodeId}
              className="absolute flex items-center justify-center"
              style={{
                left: node.x, top: node.y,
                width: 0, height: 0,                    // positioned at center point
                zIndex: node.state === 'available' ? 30 : 20,
              }}
            >
              {/* Offset the node so it's centered on (x,y) */}
              <div style={{ position: 'absolute', transform: `translate(-50%, -50%)` }}>
                {isBoss
                  ? <BossNodeCanvas node={node} onNodeClick={onNodeClick} />
                  : <StdNode node={node} accent={theme.accent} onNodeClick={onNodeClick} />
                }
              </div>
            </div>
          );
        })}

        {/* Ground decorations */}
        <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
          style={{ background: theme.ground }}>
          {zone.theme.decorations.map((d, i) => (
            <span key={i} className="absolute select-none text-lg"
              style={{ bottom: 10, left: `${15 + i * 22}%`, opacity: 0.65, transform: `rotate(${i%2===0?-6:5}deg)` }}>
              {d}
            </span>
          ))}
        </div>
      </motion.div>

      {/* ── Controls legend (bottom-safe) ──────────────────── */}
      <div className="absolute bottom-4 right-4 z-50 pointer-events-none bg-black/70 border border-gray-800/60 rounded-xl px-3 py-2.5 backdrop-blur-md">
        {[
          { col:'#374151', label:'Locked',    op:'0.5' },
          { col:'#22d3ee', label:'Available'         },
          { col:'#fbbf24', label:'Completed'         },
          { col:'#a855f7', label:'Mid Boss'          },
          { col:'#ef4444', label:'Zone Boss'         },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 mb-1.5 last:mb-0">
            <div className="w-3 h-3 rounded-full border shrink-0"
              style={{ borderColor: item.col, background: item.col + '28', opacity: item.op ?? 1, boxShadow: `0 0 5px ${item.col}60` }}/>
            <span className="text-[9px] text-gray-400 font-medium">{item.label}</span>
          </div>
        ))}
        <div className="border-t border-gray-800 mt-1.5 pt-1.5 text-[9px] text-gray-600">
          Drag to pan
        </div>
      </div>
    </div>
  );
};

export default CampaignMapCanvas;

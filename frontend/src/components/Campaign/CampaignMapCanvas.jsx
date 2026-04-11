// best one and with proper responsiveness 
import React, { useMemo, useEffect, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { Lock, ArrowLeft, Target } from 'lucide-react';
import {
  ZONE_W, ZONE_H,
  NODE_RADIUS, BOSS_RADIUS,
  getLocalNodePos,
} from './campaignWorldData';

const NODE_SZ = NODE_RADIUS * 2;
const BOSS_SZ = BOSS_RADIUS * 2;

// ── Bezier path between two nodes ─────────────────────────────────────────────
const segPath = (a, b) => {
  if (!a || !b || typeof a.x === 'undefined' || typeof b.x === 'undefined') {
    return '';
  }

  const sameRow = Math.floor((a._idx || 0) / 5) === Math.floor((b._idx || 0) / 5);
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

// ── Stars (3-star system) ─────────────────────────────────────────────────────
const Stars = ({ count = 0 }) => (
  <div className="flex gap-0.5 justify-center">
    {Array.from({ length: 3 }, (_, i) => (
      <span key={i} style={{ fontSize: 9, color: i < count ? '#fbbf24' : '#374151' }}>★</span>
    ))}
  </div>
);

// ── Read title from whichever field the node uses ─────────────────────────────
const getNodeTitle = (node) => node?.problem?.title || node?.problemId?.title || null;

// ── Standard node ─────────────────────────────────────────────────────────────
const StdNode = ({ node, accent, onClick }) => {
  if (!node) return null;

  const isLocked = node.state === 'locked';
  const isAvail = node.state === 'available';
  const isDone = node.state === 'completed';

  const border = isLocked ? '#374151' : isDone ? '#fbbf24' : accent;
  const bg = isLocked
    ? 'radial-gradient(circle,#0e1117,#070a10)'
    : isDone
      ? 'radial-gradient(circle at 35% 35%,#2d1800,#0a0600)'
      : `radial-gradient(circle at 35% 35%,${accent}28,${accent}08)`;
  const shadow = isLocked ? 'none'
    : isDone ? '0 0 14px #fbbf2470'
    : `0 0 18px ${accent}65,0 0 36px ${accent}22`;

  const title = getNodeTitle(node);

  return (
    <div className="relative flex flex-col items-center gap-1" style={{ opacity: isLocked ? 0.5 : 1 }}>
      {isAvail && (
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
          width: NODE_SZ,
          height: NODE_SZ,
          background: bg,
          borderColor: border,
          boxShadow: shadow,
          cursor: isLocked ? 'not-allowed' : 'pointer',
        }}
        whileHover={{ scale: isLocked ? 1 : 1.08 }}
        whileTap={{ scale: isLocked ? 1 : 0.94 }}
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

      {title && (
        <div
          className="px-1.5 py-0.5 rounded-full text-[7px] sm:text-[8px] font-bold font-mono max-w-[64px] sm:max-w-[74px] truncate text-center"
          style={{
            background: 'rgba(0,0,0,.72)',
            backdropFilter: 'blur(4px)',
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
  if (!node) return null;

  const isMid = node.bossType === 'mid';
  const isLocked = node.state === 'locked';
  const isDone = node.state === 'completed';

  const accent = isMid ? '#a855f7' : '#ef4444';
  const icon = isLocked ? '🔒' : isDone ? (isMid ? '✅' : '👑') : isMid ? '⚔️' : '💀';
  const glow = isLocked ? 'none'
    : isDone ? '0 0 20px #fbbf2460'
    : `0 0 28px ${accent}70,0 0 55px ${accent}30`;
  const bg = isLocked
    ? 'radial-gradient(circle,#111,#070707)'
    : isMid
      ? 'radial-gradient(circle at 35% 30%,#3b0764,#140225)'
      : 'radial-gradient(circle at 35% 30%,#7f1d1d,#200404)';

  const title = getNodeTitle(node);

  return (
    <div className="flex flex-col items-center gap-1" style={{ opacity: isLocked ? 0.5 : 1 }}>
      {!isLocked && (
        <div
          className="px-2 py-0.5 rounded text-[7px] sm:text-[8px] font-black tracking-widest uppercase"
          style={{
            background: isMid ? '#6b21a8' : '#991b1b',
            color: isDone ? '#fde68a' : isMid ? '#e9d5ff' : '#fecaca',
            border: `1px solid ${accent}50`,
          }}
        >
          {isMid ? 'MID BOSS' : 'ZONE BOSS'}
        </div>
      )}
      <div
        className="relative flex items-center justify-center"
        style={{ width: BOSS_SZ + 40, height: BOSS_SZ + 40 }}
      >
        {!isLocked && !isDone && [0, 1].slice(0, isMid ? 1 : 2).map(i => (
          <motion.div
            key={i}
            className="absolute rounded-full border-2"
            style={{
              width: BOSS_SZ + 20 + i * 18,
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
            width: BOSS_SZ,
            height: BOSS_SZ,
            background: bg,
            borderColor: isLocked ? '#374151' : isDone ? '#fbbf24' : accent,
            boxShadow: glow,
            cursor: isLocked ? 'not-allowed' : 'pointer',
          }}
          whileHover={{ scale: isLocked ? 1 : 1.08 }}
          whileTap={{ scale: isLocked ? 1 : 0.94 }}
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
              filter: isLocked ? 'grayscale(1) brightness(0.2)' : `drop-shadow(0 0 8px ${accent})`,
            }}
          >
            {icon}
          </span>
        </motion.div>
      </div>
      {isDone && <Stars count={node.stars} />}
      {title && (
        <div
          className="px-2 py-0.5 rounded-full text-[7px] sm:text-[8px] font-bold font-mono max-w-[88px] sm:max-w-[100px] truncate text-center"
          style={{
            background: 'rgba(0,0,0,.75)',
            backdropFilter: 'blur(4px)',
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
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 375,
    height: typeof window !== 'undefined' ? window.innerHeight : 812,
  }));

  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const mobileMode = viewport.width < 640;

  const mapScale = useMemo(() => {
    const sideGutter = mobileMode ? 16 : 112;
    const topChrome = mobileMode ? 150 : 116;
    const bottomChrome = mobileMode ? 154 : 96;

    const widthLimit = (viewport.width - sideGutter) / ZONE_W;
    const heightLimit = (viewport.height - topChrome - bottomChrome) / ZONE_H;

    return Math.max(0.35, Math.min(1, widthLimit, heightLimit));
  }, [viewport.width, viewport.height, mobileMode]);

  const scaledW = ZONE_W * mapScale;
  const scaledH = ZONE_H * mapScale;

  const dragConstraints = useMemo(() => {
    const left = Math.min(0, viewport.width - scaledW);
    const top = Math.min(0, viewport.height - scaledH - (mobileMode ? 8 : 0));

    return {
      left,
      right: 0,
      top,
      bottom: 0,
    };
  }, [viewport.width, viewport.height, scaledW, scaledH, mobileMode]);

  const nodePositions = useMemo(
    () => (zone?.nodes || []).map((node, i) => ({ ...node, ...getLocalNodePos(i), _idx: i })),
    [zone]
  );

  const theme = zone?.theme || {};

  const segments = useMemo(
    () =>
      nodePositions.slice(0, -1).map((a, i) => {
        const b = nodePositions[i + 1];
        if (!a || !b) return null;

        const lit = a.state === 'completed' && b.state !== 'locked';
        return { d: segPath(a, b), lit, color: theme.path || '#06b6d4' };
      }).filter(Boolean),
    [nodePositions, theme.path]
  );

  const bgGrad = Array.isArray(theme.bgGrad)
    ? theme.bgGrad
    : ['#041c28', '#062e40', '#083a50'];
  const titleGrad = Array.isArray(theme.titleGrad)
    ? theme.titleGrad
    : ['#a5f3fc', '#22d3ee'];

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background: `linear-gradient(175deg,${bgGrad},${bgGrad},${bgGrad})`,
      }}
    >
      <button
        onClick={onBack}
        className="absolute top-3 left-3 z-50 flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-sm transition-all sm:top-4 sm:left-4"
        style={{
          background: 'rgba(0,0,0,.75)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${theme.border || '#0891b2'}60`,
          color: theme.accent || '#22d3ee',
          boxShadow: `0 0 14px ${theme.glow || '#06b6d430'}`,
        }}
      >
        <ArrowLeft size={16} />
        <span className="hidden sm:inline">Zones</span>
      </button>

      <div className="absolute top-3 left-0 right-0 flex justify-center z-40 pointer-events-none px-14 sm:px-20 sm:top-4">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-2xl sm:px-4"
          style={{
            background: 'rgba(0,0,0,.65)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${theme.border || '#0891b2'}50`,
          }}
        >
          <span className="text-lg select-none sm:text-xl">{zone?.icon}</span>
          <div>
            <h2
              className="font-black text-[12px] leading-none sm:text-sm"
              style={{
                background: `linear-gradient(135deg,${titleGrad},${titleGrad})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontFamily: "'JetBrains Mono',monospace",
              }}
            >
              {zone?.name}
            </h2>
            <p
              className="text-[8px] font-bold uppercase tracking-widest mt-0.5 sm:text-[9px]"
              style={{ color: theme.accent || '#22d3ee', opacity: 0.7 }}
            >
              {zone?.completedCount ?? 0}/{(zone?.nodes || []).length} complete
            </p>
          </div>
        </div>
      </div>

      <div className="absolute top-[68px] left-3 right-3 z-40 pointer-events-none sm:top-[72px] sm:left-6 sm:right-6">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1e293b' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg,${theme.path || '#06b6d4'},${theme.accent || '#22d3ee'})` }}
            initial={{ width: 0 }}
            animate={{ width: `${zone?.progressPct ?? 0}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
          />
        </div>
      </div>

      <motion.div
        drag
        dragConstraints={dragConstraints}
        dragElastic={0.06}
        dragMomentum={true}
        style={{
          x,
          y,
          width: scaledW,
          height: scaledH,
          touchAction: 'none',
          userSelect: 'none',
          cursor: 'grab',
          overflow: 'visible',
        }}
        whileDrag={{ cursor: 'grabbing' }}
        className="absolute top-0 left-0"
      >
        <div
          className="relative origin-top-left"
          style={{
            width: ZONE_W,
            height: ZONE_H,
            transform: `scale(${mapScale})`,
            transformOrigin: 'top left',
          }}
        >
          <svg
            className="absolute inset-0 pointer-events-none z-10"
            style={{ width: ZONE_W, height: ZONE_H, overflow: 'visible' }}
          >
            <defs>
              <filter id={`pg-${zone?.id}`} x="-20%" y="-20%" width="140%" height="140%">
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
                    d={seg.d}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={9}
                    strokeOpacity={0.18}
                    filter={`url(#pg-${zone?.id})`}
                  />
                )}
                <path
                  d={seg.d}
                  fill="none"
                  stroke={seg.lit ? seg.color : '#1e293b'}
                  strokeWidth={seg.lit ? 3 : 2}
                  strokeOpacity={seg.lit ? 0.85 : 0.5}
                  strokeLinecap="round"
                  strokeDasharray={seg.lit ? 'none' : '5 7'}
                />
                {seg.lit && (
                  <circle r="4.5" fill={seg.color} opacity="0.9">
                    <animateMotion dur={`${2.8 + i * 0.04}s`} repeatCount="indefinite" path={seg.d} />
                  </circle>
                )}
              </g>
            ))}
          </svg>

          {nodePositions.map((node, i) => {
            if (!node || typeof node.x === 'undefined') return null;

            const isBoss = node.nodeType === 'boss';
            return (
              <div
                key={node.nodeId || node.id || `node-${i}`}
                className="absolute flex items-center justify-center"
                style={{
                  left: node.x,
                  top: node.y,
                  width: 0,
                  height: 0,
                  zIndex: node.state === 'available' ? 30 : 20,
                }}
              >
                <div style={{ position: 'absolute', transform: 'translate(-50%,-50%)' }}>
                  {isBoss
                    ? <BossNodeCanvas node={node} onClick={onNodeClick} />
                    : <StdNode node={node} accent={theme.accent || '#22d3ee'} onClick={onNodeClick} />}
                </div>
              </div>
            );
          })}

          <div
            className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
            style={{ background: theme.ground || '#052030' }}
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
        </div>
      </motion.div>

      <div className="absolute bottom-3 left-3 z-50 pointer-events-none bg-black/75 border border-gray-800/60 rounded-xl px-2.5 py-2 backdrop-blur-md flex flex-col gap-1.5 sm:bottom-6 sm:left-6 sm:px-3 sm:py-2.5">
        {[
          { col: '#374151', label: 'Locked' },
          { col: '#22d3ee', label: 'Available' },
          { col: '#fbbf24', label: 'Completed' },
          { col: '#a855f7', label: 'Mid Boss' },
          { col: '#ef4444', label: 'Zone Boss' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full border shrink-0"
              style={{
                borderColor: item.col,
                background: `${item.col}28`,
                boxShadow: item.col !== '#374151' ? `0 0 5px ${item.col}60` : 'none',
              }}
            />
            <span className="text-[9px] text-gray-400 font-medium whitespace-nowrap">
              {item.label}
            </span>
          </div>
        ))}
        <div className="border-t border-gray-800/50 pt-1 text-[9px] text-gray-600">
          Drag to pan
        </div>
      </div>

      <div className="absolute bottom-3 right-3 z-50 pointer-events-none flex items-center gap-2 bg-black/65 border border-gray-800/50 rounded-xl px-3 py-2 backdrop-blur-md sm:bottom-6 sm:right-6">
        <Target size={13} className="text-gray-500" />
        <span className="text-[9px] text-gray-500">Scroll to navigate</span>
      </div>
    </div>
  );
};

export default CampaignMapCanvas;
// V 1.5

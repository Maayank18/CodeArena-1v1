// src/components/Campaign/BossNode.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

const CFG = {
  mid: {
    sz:       72,
    icon:     '⚔️',
    doneIcon: '✅',
    badge:    'MID BOSS',
    border:   '#a855f7',
    bg:       'radial-gradient(circle at 38% 32%, #3b0764, #16032b)',
    glow:     '#a855f7',
    glowSize: 28,
    rings:    1,
    badgeCol: '#e9d5ff',
    badgeBg:  '#6b21a8',
  },
  main: {
    sz:       88,
    icon:     '💀',
    doneIcon: '👑',
    badge:    'ZONE BOSS',
    border:   '#ef4444',
    bg:       'radial-gradient(circle at 38% 32%, #7f1d1d, #2a0404)',
    glow:     '#ef4444',
    glowSize: 38,
    rings:    2,
    badgeCol: '#fecaca',
    badgeBg:  '#991b1b',
  },
};

const ringVariants = {
  animate: (i) => ({
    scale:   [1, 1.35 + i * 0.12, 1],
    opacity: [0.7, 0, 0.7],
    transition: { duration: 1.8 + i * 0.5, delay: i * 0.3, repeat: Infinity, ease: 'easeInOut' },
  }),
};

const BossNode = ({ bossType = 'mid', isLocked, isDone, stars = 0, isSelected, onClick, title }) => {
  const c  = CFG[bossType] || CFG.mid;
  const sz = c.sz;

  const border  = isLocked ? '#374151' : isDone ? '#fbbf24' : c.border;
  const bg      = isLocked ? 'radial-gradient(circle,#111,#070707)' : c.bg;
  const opacity = isLocked ? 0.42 : 1;
  const glow    = isLocked ? 'none' : isDone
    ? `0 0 20px #fbbf2470, 0 0 45px #fbbf2430`
    : `0 0 ${c.glowSize}px ${c.glow}70, 0 0 ${c.glowSize*2}px ${c.glow}30`;

  return (
    <div className="flex flex-col items-center gap-1.5" style={{ opacity }}>
      {/* Badge */}
      {!isLocked && (
        <div
          className="px-2 py-0.5 rounded-md text-[9px] font-black tracking-[0.2em] uppercase"
          style={{ background: c.badgeBg, color: isDone ? '#fde68a' : c.badgeCol, border:`1px solid ${c.border}50` }}
        >
          {c.badge}
        </div>
      )}

      {/* Node with pulsing rings */}
      <div className="relative flex items-center justify-center" style={{ width: sz + 40, height: sz + 40 }}>
        {/* Pulsing outer rings (only when unlocked + not done) */}
        {!isLocked && !isDone && Array.from({ length: c.rings + 1 }, (_, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={ringVariants}
            animate="animate"
            className="absolute rounded-full border-2"
            style={{
              width:  sz + 20 + i * 18,
              height: sz + 20 + i * 18,
              borderColor: `${c.glow}${i === 0 ? 'aa' : '55'}`,
            }}
          />
        ))}

        {/* Selection ring */}
        {isSelected && (
          <div className="absolute rounded-full" style={{ width: sz + 14, height: sz + 14, border:'2.5px solid rgba(255,255,255,.55)' }} />
        )}

        {/* Main circle */}
        <motion.div
          className="relative flex items-center justify-center rounded-full border-[3px] cursor-pointer z-10"
          style={{ width: sz, height: sz, background: bg, borderColor: border, boxShadow: glow }}
          whileHover={{ scale: isLocked ? 1 : 1.08 }}
          whileTap={{   scale: isLocked ? 1 : 0.93 }}
          onClick={isLocked ? undefined : onClick}
        >
          {/* Animated inner glow */}
          {!isLocked && (
            <motion.div
              className="absolute inset-2 rounded-full"
              style={{ background:`radial-gradient(circle,${isDone ? '#fbbf2430' : c.glow+'25'},transparent)`, filter:'blur(6px)' }}
              animate={{ opacity:[.4,1,.4] }}
              transition={{ duration:2.2, repeat:Infinity, ease:'easeInOut' }}
            />
          )}

          {/* Icon */}
          <span className="text-3xl select-none relative z-10" style={{
            fontSize: bossType === 'main' ? 32 : 26,
            filter: isLocked ? 'grayscale(1) brightness(0.25)' : isDone ? 'none' : `drop-shadow(0 0 10px ${c.glow})`,
          }}>
            {isLocked ? '🔒' : isDone ? c.doneIcon : c.icon}
          </span>
        </motion.div>
      </div>

      {/* Stars on completion */}
      {isDone && (
        <div className="flex gap-0.5">
          {[1,2,3].map(i => (
            <span key={i} style={{ fontSize:13, color: i <= stars ? '#fbbf24' : '#374151' }}>★</span>
          ))}
        </div>
      )}

      {/* Title label */}
      <div
        className="px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono text-center max-w-[110px] truncate"
        style={{
          background: 'rgba(0,0,0,.75)', backdropFilter:'blur(6px)',
          color: isLocked ? '#4b5563' : isDone ? '#fbbf24' : c.badgeCol,
          border: `1px solid ${isLocked ? '#1f2937' : isDone ? '#92400e40' : c.border+'40'}`,
        }}
      >
        {title || c.badge}
      </div>
    </div>
  );
};

export default React.memo(BossNode);
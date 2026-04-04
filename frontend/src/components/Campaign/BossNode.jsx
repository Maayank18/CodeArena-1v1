// src/components/Campaign/BossNode.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Renders a visually distinct Boss Node (mid-boss or main-boss).
// Mid-Boss  → purple crown glow, "⚔️" icon, 68px
// Main Boss → crimson skull, double pulsing rings, 80px
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { motion } from 'framer-motion';

// ── Boss visual configs ────────────────────────────────────────────────────────
const BOSS_STYLES = {
  mid: {
    size:        68,
    icon:        '⚔️',
    label:       'MID BOSS',
    border:      '#a855f7',
    bg:          'radial-gradient(circle at 35% 30%, #2e0a50, #120520)',
    shadowInner: '#7c3aed',
    shadowOuter: '#a855f740',
    labelColor:  '#c084fc',
    ringColor:   '#a855f780',
    ringSize:    1,
  },
  main: {
    size:        82,
    icon:        '💀',
    label:       'ZONE BOSS',
    border:      '#ef4444',
    bg:          'radial-gradient(circle at 35% 30%, #5a0a0a, #200404)',
    shadowInner: '#dc2626',
    shadowOuter: '#ef444440',
    labelColor:  '#f87171',
    ringColor:   '#ef444480',
    ringSize:    2,
  },
};

const BossNode = ({
  bossType = 'mid',
  isLocked = false,
  isDone   = false,
  stars    = 0,
  isSelected = false,
  onClick  = () => {},
  title    = '',
//   zoneColor = '#a855f7',
}) => {
  const cfg  = BOSS_STYLES[bossType] || BOSS_STYLES.mid;
  const sz   = cfg.size;

  // Colour shifts based on state
  const border  = isLocked ? '#2a2a3a' : isDone ? '#fbbf24' : cfg.border;
  const bg      = isLocked ? 'radial-gradient(circle, #111, #080808)' : cfg.bg;
  const glowA   = isLocked ? 'transparent' : isDone ? '#fbbf2455' : cfg.shadowOuter;
  const glowB   = isLocked ? 'transparent' : isDone ? '#fbbf2420' : cfg.shadowOuter;
  const opacity = isLocked ? 0.4 : 1;

  return (
    <div
      className="flex flex-col items-center"
      style={{ opacity }}
    >
      {/* Boss label badge */}
      {!isLocked && (
        <div
          className="mb-1.5 px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase"
          style={{
            color: isDone ? '#fbbf24' : cfg.labelColor,
            background: isDone ? '#451a0320' : `${cfg.border}15`,
            border: `1px solid ${isDone ? '#92400e40' : `${cfg.border}35`}`,
          }}
        >
          {cfg.label}
        </div>
      )}

      {/* Outer pulsing rings (only for unlocked + not done) */}
      <div className="relative flex items-center justify-center">
        {!isLocked && !isDone && Array.from({ length: cfg.ringSize + 1 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width:  sz + 20 + i * 16,
              height: sz + 20 + i * 16,
              border: `2px solid ${cfg.ringColor}`,
            }}
            animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2 + i * 0.6, delay: i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        {/* Selection ring */}
        {isSelected && (
          <div
            className="absolute rounded-full"
            style={{
              width: sz + 14, height: sz + 14,
              border: '2px solid rgba(255,255,255,0.5)',
            }}
          />
        )}

        {/* Main node circle */}
        <motion.div
          className="relative flex items-center justify-center rounded-full border-2 cursor-pointer"
          style={{
            width: sz, height: sz,
            background: bg,
            borderColor: border,
            boxShadow: isSelected
              ? `0 0 0 3px rgba(255,255,255,0.3), 0 0 30px ${glowA}, 0 0 60px ${glowB}`
              : `0 0 30px ${glowA}, 0 0 60px ${glowB}`,
          }}
          whileHover={{ scale: isLocked ? 1 : 1.08 }}
          whileTap={{   scale: isLocked ? 1 : 0.95 }}
          onClick={isLocked ? undefined : onClick}
        >
          {/* Inner core glow */}
          {!isLocked && (
            <motion.div
              className="absolute inset-2 rounded-full"
              style={{
                background: `radial-gradient(circle, ${isDone ? '#fbbf2430' : cfg.shadowInner + '20'}, transparent)`,
                filter: 'blur(6px)',
              }}
              animate={{ opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          {/* Icon */}
          <span
            className="text-2xl select-none relative z-10"
            style={{
              filter: isLocked ? 'grayscale(1) brightness(0.3)' : isDone ? 'none' : `drop-shadow(0 0 8px ${cfg.shadowInner})`,
              fontSize: bossType === 'main' ? 28 : 22,
            }}
          >
            {isLocked ? '🔒' : isDone ? (bossType === 'main' ? '👑' : '✅') : cfg.icon}
          </span>
        </motion.div>
      </div>

      {/* Star display for completed bosses */}
      {isDone && stars > 0 && (
        <div className="flex mt-1 gap-0.5">
          {[1,2,3].map(i => (
            <span key={i} className="text-[10px]" style={{ color: i <= stars ? '#fbbf24' : '#374151' }}>★</span>
          ))}
        </div>
      )}

      {/* Node title */}
      <div
        className="mt-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono whitespace-nowrap truncate max-w-[100px] text-center"
        style={{
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          color: isLocked ? '#374151' : isDone ? '#fbbf24' : cfg.labelColor,
          border: `1px solid ${isLocked ? '#1f2937' : isDone ? '#92400e40' : `${cfg.border}30`}`,
        }}
      >
        {title || (bossType === 'main' ? 'Zone Boss' : 'Mid Boss')}
      </div>
    </div>
  );
};

export default React.memo(BossNode);
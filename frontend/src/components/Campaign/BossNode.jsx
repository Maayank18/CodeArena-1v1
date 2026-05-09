// perfect responsivenss code 
import React from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

const CFG = {
  mid: {
    base: 72,
    mobile: 54,
    icon: '⚔️',
    doneIcon: '✅',
    badge: 'MID BOSS',
    border: '#a855f7',
    bg: 'radial-gradient(circle at 38% 32%, #3b0764, #16032b)',
    glow: '#a855f7',
    glowSize: 28,
    rings: 1,
    badgeCol: '#e9d5ff',
    badgeBg: '#6b21a8',
  },
  main: {
    base: 88,
    mobile: 64,
    icon: '💀',
    doneIcon: '👑',
    badge: 'ZONE BOSS',
    border: '#ef4444',
    bg: 'radial-gradient(circle at 38% 32%, #7f1d1d, #2a0404)',
    glow: '#ef4444',
    glowSize: 38,
    rings: 2,
    badgeCol: '#fecaca',
    badgeBg: '#991b1b',
  },
};

const ringVariants = {
  animate: (i) => ({
    scale: [1, 1.3 + i * 0.1, 1],
    opacity: [0.7, 0, 0.7],
    transition: {
      duration: 1.8 + i * 0.5,
      delay: i * 0.3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  }),
};

const BossNode = ({
  bossType = 'mid',
  isLocked,
  isDone,
  stars = 0,
  isSelected,
  onClick,
  title,
  isMobile = false,
}) => {
  const c = CFG[bossType] || CFG.mid;

  const sz = isMobile ? c.mobile : c.base;

  const border = isLocked
    ? '#374151'
    : isDone
    ? '#fbbf24'
    : c.border;

  const bg = isLocked
    ? 'radial-gradient(circle,#111,#070707)'
    : c.bg;

  const opacity = isLocked ? 0.42 : 1;

  const glow = isLocked
    ? 'none'
    : isDone
    ? `0 0 16px #fbbf2470`
    : `0 0 ${c.glowSize * 0.8}px ${c.glow}70`;

  return (
    <div className="flex flex-col items-center gap-1" style={{ opacity }}>
      
      {/* Badge */}
      {!isLocked && (
        <div
          className="px-1.5 py-[2px] rounded text-[7px] sm:text-[9px] font-black tracking-wider uppercase whitespace-nowrap"
          style={{
            background: c.badgeBg,
            color: isDone ? '#fde68a' : c.badgeCol,
            border: `1px solid ${c.border}50`,
          }}
        >
          {c.badge}
        </div>
      )}

      {/* Node */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: sz + 24,
          height: sz + 24,
        }}
      >
        {/* Rings */}
        {!isLocked &&
          !isDone &&
          Array.from({ length: c.rings + 1 }, (_, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={ringVariants}
              animate="animate"
              className="absolute rounded-full border"
              style={{
                width: sz + 10 + i * 12,
                height: sz + 10 + i * 12,
                borderColor: `${c.glow}88`,
              }}
            />
          ))}

        {/* Selected */}
        {isSelected && (
          <div
            className="absolute rounded-full"
            style={{
              width: sz + 8,
              height: sz + 8,
              border: '2px solid rgba(255,255,255,.5)',
            }}
          />
        )}

        {/* Main */}
        <motion.div
          className="flex items-center justify-center rounded-full border cursor-pointer"
          style={{
            width: sz,
            height: sz,
            background: bg,
            borderColor: border,
            boxShadow: glow,
          }}
          whileHover={{ scale: isLocked ? 1 : 1.05 }}
          whileTap={{ scale: isLocked ? 1 : 0.92 }}
          onClick={isLocked ? undefined : onClick}
        >
          <span
            className="select-none"
            style={{
              fontSize: bossType === 'main' ? sz * 0.4 : sz * 0.35,
              filter: isLocked
                ? 'grayscale(1) brightness(0.3)'
                : isDone
                ? 'none'
                : `drop-shadow(0 0 6px ${c.glow})`,
            }}
          >
            {isLocked ? '🔒' : isDone ? c.doneIcon : c.icon}
          </span>
        </motion.div>
      </div>

      {/* Stars */}
      {isDone && (
        <div className="flex gap-0.5">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              style={{
                fontSize: isMobile ? 10 : 13,
                color: i <= stars ? '#fbbf24' : '#374151',
              }}
            >
              ★
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <div
        className="px-2 py-[2px] rounded-full text-[8px] sm:text-[9px] font-bold text-center truncate max-w-[80px] sm:max-w-[110px] transition-colors"
        style={{
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)',
          color: isLocked
            ? '#9ca3af'
            : isDone
            ? '#fbbf24'
            : c.badgeCol,
          border: `1px solid ${
            isLocked ? 'rgba(255,255,255,0.05)' : c.border + '40'
          }`,
        }}
      >
        {title || c.badge}
      </div>
    </div>
  );
};

export default React.memo(BossNode);
// V 1.5

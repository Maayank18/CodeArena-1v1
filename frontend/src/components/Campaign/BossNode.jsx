import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const CFG = {
  mid: {
    base: 76,
    mobile: 58,
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
    base: 100,
    mobile: 74,
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

const hexToRgb = (value) => {
  if (typeof value !== 'string') return null;
  const normalized = value.replace('#', '').trim();
  if (normalized.length !== 6) return null;
  const parsed = Number.parseInt(normalized, 16);
  if (Number.isNaN(parsed)) return null;
  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
};

const withAlpha = (value, alpha) => {
  const rgb = hexToRgb(value);
  if (!rgb) return value;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

const mixColors = (from, to, weight = 0.5) => {
  const start = hexToRgb(from);
  const end = hexToRgb(to);
  if (!start || !end) return from;
  const clampWeight = Math.max(0, Math.min(1, weight));
  const mix = (a, b) => Math.round(a + (b - a) * clampWeight);
  return `rgb(${mix(start.r, end.r)}, ${mix(start.g, end.g)}, ${mix(start.b, end.b)})`;
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
  const { isDark } = useTheme();
  const c = CFG[bossType] || CFG.mid;
  const sz = isMobile ? c.mobile : c.base;
  const brightAccent = mixColors(c.border, '#0f172a', 0.2);

  const border = isLocked ? '#374151' : isDone ? '#fbbf24' : c.border;
  const bg = isLocked ? 'radial-gradient(circle,#111,#070707)' : c.bg;
  const opacity = isLocked ? (isDark ? 0.42 : 0.72) : 1;
  const glow = isLocked
    ? 'none'
    : isDone
      ? '0 0 16px #fbbf2470'
      : `0 0 ${c.glowSize * 0.8}px ${isDark ? c.glow : withAlpha(c.glow, 0.34)}`;

  const brightBadgeBg = bossType === 'mid' ? 'rgba(124, 58, 237, 0.14)' : 'rgba(239, 68, 68, 0.14)';
  const brightBadgeColor = bossType === 'mid' ? mixColors('#7c3aed', '#0f172a', 0.16) : mixColors('#dc2626', '#0f172a', 0.12);
  const brightSurface = bossType === 'mid'
    ? `linear-gradient(180deg, rgba(255,255,255,0.99), ${withAlpha('#8b5cf6', 0.12)})`
    : `linear-gradient(180deg, rgba(255,255,255,0.99), ${withAlpha('#ef4444', 0.12)})`;
  const brightBorder = isDone ? '#f59e0b' : brightAccent;
  const brightTitleColor = isLocked ? '#94a3b8' : isDone ? '#d97706' : brightBadgeColor;

  return (
    <div className="flex flex-col items-center gap-1" style={{ opacity }}>
      {!isLocked && (
        <div
          className="px-1.5 py-[2px] rounded text-[7px] sm:text-[9px] font-black tracking-wider uppercase whitespace-nowrap"
          style={{
            background: isDark ? c.badgeBg : brightBadgeBg,
            color: isDark ? (isDone ? '#fde68a' : c.badgeCol) : brightBadgeColor,
            border: `1px solid ${isDark ? `${c.border}50` : withAlpha(brightBadgeColor, 0.24)}`,
            boxShadow: isDark ? 'none' : `0 12px 26px ${withAlpha(brightBadgeColor, 0.14)}`,
          }}
        >
          {c.badge}
        </div>
      )}

      <div
        className="relative flex items-center justify-center"
        style={{
          width: sz + 24,
          height: sz + 24,
        }}
      >
        {!isLocked && !isDone && Array.from({ length: c.rings + 1 }, (_, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={ringVariants}
            animate="animate"
            className="absolute rounded-full border"
            style={{
              width: sz + 10 + i * 12,
              height: sz + 10 + i * 12,
              borderColor: isDark ? `${c.glow}88` : withAlpha(brightBorder, 0.24),
            }}
          />
        ))}

        {isSelected && (
          <div
            className="absolute rounded-full"
            style={{
              width: sz + 8,
              height: sz + 8,
              border: isDark ? '2px solid rgba(255,255,255,.5)' : '2px solid rgba(15,23,42,0.18)',
            }}
          />
        )}

        <motion.div
          className="flex items-center justify-center rounded-full border cursor-pointer"
          style={{
            width: sz,
            height: sz,
            background: isDark ? bg : brightSurface,
            borderColor: isDark ? border : brightBorder,
            boxShadow: isDark
              ? glow
              : `0 18px 36px rgba(15, 23, 42, 0.14), 0 0 0 1px ${withAlpha(brightBorder, 0.18)}, 0 0 0 7px rgba(255,255,255,0.78)`,
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
                  : `drop-shadow(0 0 6px ${isDark ? c.glow : withAlpha(brightBorder, 0.4)})`,
            }}
          >
            {isLocked ? '🔒' : isDone ? c.doneIcon : c.icon}
          </span>
        </motion.div>
      </div>

      {isDone && (
        <div className="flex gap-0.5">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              style={{
                fontSize: isMobile ? 10 : 13,
                color: i <= stars ? '#fbbf24' : '#94a3b8',
              }}
            >
              ★
            </span>
          ))}
        </div>
      )}

      <div
        className="px-2 py-[2px] rounded-full text-[8px] sm:text-[9px] font-bold text-center truncate max-w-[80px] sm:max-w-[110px] transition-colors"
        style={{
          background: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.93)',
          backdropFilter: 'blur(6px)',
          color: isDark ? (isLocked ? '#9ca3af' : isDone ? '#fbbf24' : c.badgeCol) : brightTitleColor,
          border: `1px solid ${
            isDark
              ? (isLocked ? 'rgba(255,255,255,0.05)' : `${c.border}40`)
              : (isLocked ? 'rgba(100, 116, 139, 0.22)' : withAlpha(brightBorder, 0.26))
          }`,
          boxShadow: isDark ? 'none' : '0 10px 22px rgba(15, 23, 42, 0.1)',
        }}
      >
        {title || c.badge}
      </div>
    </div>
  );
};

export default React.memo(BossNode);

// Version-2.0
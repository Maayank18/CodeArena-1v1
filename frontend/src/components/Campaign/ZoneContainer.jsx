// src/components/Campaign/ZoneContainer.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Renders a single zone's:
//   • Thematic gradient background
//   • RPG-styled zone name & subtitle
//   • Weather particle layer (delegated to <WeatherEffect>)
//   • SVG bezier paths between nodes within the zone
// Children = the actual node elements (positioned absolutely)
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { motion } from 'framer-motion';
import WeatherEffect from './WeatherEffect';
import { ZONE_W, ZONE_H } from './campaignWorldData';

// ── Build SVG path between consecutive nodes ────────────────────────────────
const makeNodePath = (a, b) => {
  // Quadratic bezier with mid-point control
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 - 20; // arch upward slightly
  return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
};

const ZoneContainer = ({
  config,          // zone config object from ZONE_CONFIGS
  zoneX,           // world-space x of zone top-left
  zoneY,           // world-space y of zone top-left
  nodes = [],      // nodes belonging to this zone, sorted by nodeNum
  completedNodeIds = new Set(),
  children,        // rendered node elements
}) => {
  const { name, subtitle, icon, weather, primary, bg1, bg2, glow, pathColor, titleGrad } = config;

  // ── Build inter-node paths ─────────────────────────────────────────────────
  const paths = React.useMemo(() => {
    const list = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i];
      const b = nodes[i + 1];
      if (!a?.localPosition || !b?.localPosition) continue;
      const lit = completedNodeIds.has(a.nodeId) && completedNodeIds.has(b.nodeId);
      list.push({
        id:  `${a.nodeId}-${b.nodeId}`,
        d:   makeNodePath(a.localPosition, b.localPosition),
        lit,
      });
    }
    return list;
  }, [nodes, completedNodeIds]);

  return (
    <motion.div
      className="absolute"
      style={{
        left:   zoneX,
        top:    zoneY,
        width:  ZONE_W,
        height: ZONE_H,
      }}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* ── Zone background ────────────────────────────────────────── */}
      <div
        className="absolute inset-0 rounded-2xl overflow-hidden"
        style={{
          background: `linear-gradient(155deg, ${bg1} 0%, ${bg2} 100%)`,
          border: `1px solid ${primary}25`,
          boxShadow: `inset 0 0 60px ${glow}, 0 0 30px ${glow}`,
        }}
      >
        {/* Atmospheric corner radial glow */}
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `radial-gradient(ellipse 70% 50% at 50% 30%, ${primary}12, transparent 70%)`,
          }}
        />

        {/* Weather / particle layer */}
        <WeatherEffect
          type={weather}
          zoneId={config.id}
          primary={primary}
        />

        {/* ── Zone title area ─────────────────────────────────────── */}
        <div className="absolute top-0 left-0 right-0 px-5 pt-4 pb-2 flex items-start justify-between z-10">
          <div className="min-w-0 flex-1">
            {/* Subtitle */}
            <p
              className="text-[9px] font-bold uppercase tracking-[0.25em] mb-1 opacity-60"
              style={{ color: primary }}
            >
              {subtitle}
            </p>

            {/* Zone name — RPG style */}
            <h3
              className="font-black leading-tight select-none"
              style={{
                fontSize: name.length > 18 ? 15 : 17,
                background: `linear-gradient(135deg, ${titleGrad[0]}, ${titleGrad[1]})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: 'none',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                letterSpacing: '-0.01em',
              }}
            >
              {name}
            </h3>
          </div>

          {/* Zone icon */}
          <div
            className="ml-2 shrink-0 flex items-center justify-center rounded-xl text-xl select-none"
            style={{
              width: 40, height: 40,
              background: `${primary}15`,
              border: `1px solid ${primary}30`,
              boxShadow: `0 0 12px ${primary}25`,
            }}
          >
            {icon}
          </div>
        </div>

        {/* Bottom accent line */}
        <div
          className="absolute bottom-0 left-6 right-6 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${primary}50, transparent)` }}
        />
      </div>

      {/* ── SVG path layer (inside zone, local coords) ─────────────── */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: ZONE_W, height: ZONE_H, overflow: 'visible' }}
      >
        <defs>
          <filter id={`glow-${config.id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {paths.map(p => (
          <g key={p.id}>
            {/* Shadow/glow layer on lit paths */}
            {p.lit && (
              <path
                d={p.d}
                fill="none"
                stroke={pathColor}
                strokeWidth="8"
                strokeOpacity="0.15"
                filter={`url(#glow-${config.id})`}
              />
            )}
            {/* Main path */}
            <path
              d={p.d}
              fill="none"
              stroke={p.lit ? pathColor : '#1e2533'}
              strokeWidth={p.lit ? 2.5 : 1.8}
              strokeOpacity={p.lit ? 0.7 : 0.5}
              strokeLinecap="round"
              strokeDasharray={p.lit ? 'none' : '5 6'}
            />
            {/* Moving dot on lit paths */}
            {p.lit && (
              <circle r="4" fill={pathColor} opacity="0.9">
                <animateMotion
                  dur="3s"
                  repeatCount="indefinite"
                  path={p.d}
                />
              </circle>
            )}
          </g>
        ))}
      </svg>

      {/* ── Node elements (passed as children) ─────────────────────── */}
      {children}
    </motion.div>
  );
};

export default React.memo(ZoneContainer);
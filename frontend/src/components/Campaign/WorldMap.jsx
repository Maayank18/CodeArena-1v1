// src/components/Campaign/WorldMap.jsx  — V3 (RPG Biome World Map)
// ─────────────────────────────────────────────────────────────────────────────
// Architecture:
//   • The world is a 2380×2820 canvas of 15 zones arranged in a 3×5 snake grid.
//   • Each zone renders its own biome background, weather effects, and SVG paths.
//   • Standard nodes: circular buttons with state-dependent glows.
//   • Boss nodes (8 & 15 within each zone): BossNode component with pulsing rings.
//   • Inter-zone connector paths shown between zone exit/entry nodes.
//   • Drag-to-pan only (wheel zoom disabled). +/− buttons for zoom.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useRef, useState, useCallback, useMemo } from 'react';
import { Lock } from 'lucide-react';
import ZoneContainer from './ZoneContainer';
import BossNode      from './BossNode';
import StarDisplay   from './StarDisplay';
import {
  ZONE_CONFIGS,
  ZONE_W, ZONE_H,
  computeZonePositions,
  generateMockWorld,
  getZoneConfig,
  nodeLocalPos,
  isBossNode,
  getBossType,
} from './campaignWorldData';

// ── World canvas ──────────────────────────────────────────────────────────────
const WORLD_W = 2380;
const WORLD_H = 2820;

// Star field — generated once at module load
const STARS = Array.from({ length: 200 }, (_, i) => {
  const r = ((i * 6364136223846793005n + 1442695040888963407n) & 0xFFFFFFFFn);
  const s = Number(r) / 0xFFFFFFFF;
  return {
    id:  i,
    x:   (i * 137.508) % WORLD_W,
    y:   (i * 97.3141) % WORLD_H,
    sz:  (s * 2.2 + 0.4),
    op:  (s * 0.4 + 0.08),
    twinkle: i % 3 === 0,
  };
});

// ── Precomputed zone layout ────────────────────────────────────────────────────
const ZONE_POSITIONS = computeZonePositions();

// ── StandardNode (non-boss) ───────────────────────────────────────────────────
const StandardNode = ({ node, state, isSelected, zoneConfig, onClick }) => {
  const { primary } = zoneConfig;
  const isLocked    = state.state === 'locked';
  const isAvail     = state.state === 'available';
  const isDone      = state.state === 'completed';
  const stars       = state.starsAwarded || 0;
  const SZ          = 52;

  let borderColor = '#2a3040';
  let bg          = 'radial-gradient(circle, #0e1320, #070a10)';
  let glow        = 'none';

  if (!isLocked) {
    if (isDone) {
      const gs = { 1: ['#d97706','#2d1800'], 2: ['#f59e0b','#2d2200'], 3: ['#fbbf24','#201600'] };
      const [gc, gbg] = gs[stars] || gs[1];
      borderColor = gc;
      bg  = `radial-gradient(circle at 35% 35%, ${gbg}, #0a0800)`;
      glow = stars === 3
        ? `0 0 20px ${gc}80, 0 0 40px ${gc}30`
        : `0 0 14px ${gc}60`;
    } else {
      borderColor = primary;
      bg  = `radial-gradient(circle at 35% 35%, ${primary}20, ${primary}06)`;
      glow = `0 0 16px ${primary}55, 0 0 32px ${primary}20`;
    }
  }

  const title = (
    node.problemId?.title?.split(' ').slice(0, 3).join(' ') ||
    node.nodeId?.split('_').slice(-1)[0] ||
    '—'
  );

  return (
    <div
      className="flex flex-col items-center"
      style={{ opacity: isLocked ? 0.38 : 1 }}
    >
      {/* Pulse ring for available */}
      {isAvail && (
        <div
          className="absolute rounded-full animate-ping"
          style={{
            width: SZ + 18, height: SZ + 18,
            marginTop: -(SZ + 18) / 2, marginLeft: -(SZ + 18) / 2,
            border: `2px solid ${primary}55`,
            animationDuration: '2s',
          }}
        />
      )}

      {/* Selection ring */}
      {isSelected && (
        <div
          className="absolute rounded-full"
          style={{
            width: SZ + 12, height: SZ + 12,
            border: '2px solid rgba(255,255,255,0.45)',
            borderRadius: '50%',
            transform: 'translate(-50%,-50%)',
            top: SZ / 2, left: SZ / 2,
          }}
        />
      )}

      {/* Main circle */}
      <div
        className="relative flex items-center justify-center rounded-full border-2 transition-transform duration-100"
        style={{
          width: SZ, height: SZ,
          background: bg,
          borderColor: borderColor,
          boxShadow: isSelected ? `0 0 0 3px rgba(255,255,255,0.25), ${glow}` : glow,
          cursor: isLocked ? 'not-allowed' : 'pointer',
          transform: isSelected ? 'scale(1.14)' : 'scale(1)',
        }}
        onClick={() => !isLocked && onClick(node)}
      >
        {isLocked ? (
          <Lock size={17} className="text-gray-700" />
        ) : isDone ? (
          <StarDisplay stars={stars} total={3} size="sm" />
        ) : (
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ background: primary, boxShadow: `0 0 10px ${primary}` }}
          />
        )}
      </div>

      {/* Label */}
      <div
        className="mt-1.5 px-2 py-0.5 rounded-full text-[8px] font-bold font-mono whitespace-nowrap truncate max-w-[80px] text-center"
        style={{
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          color: isLocked ? '#374151' : isDone ? '#fbbf24' : primary,
          border: `1px solid ${isLocked ? '#1f2937' : isDone ? '#92400e30' : primary + '25'}`,
        }}
      >
        {title}
      </div>
    </div>
  );
};

// ── Helper: get progress state for a node ─────────────────────────────────────
const getState = (nodeId, progress) => {
  if (!progress) return { state: 'locked' };
  const done = progress.completedNodes?.find(n => n.nodeId === nodeId);
  if (done) return { state: 'completed', starsAwarded: done.starsAwarded ?? 0, bestTimeMs: done.bestTimeMs };
  if (progress.unlockedNodes?.includes(nodeId)) return { state: 'available' };
  return { state: 'locked' };
};

// ── Inter-zone connector SVG ──────────────────────────────────────────────────
const InterZoneConnector = ({ fromPos, toPos, lit, color }) => {
  if (!fromPos || !toPos) return null;
  const d = `M ${fromPos.x} ${fromPos.y} C ${fromPos.x + 80} ${fromPos.y}, ${toPos.x - 80} ${toPos.y}, ${toPos.x} ${toPos.y}`;
  return (
    <g>
      {lit && <path d={d} fill="none" stroke={color} strokeWidth="8" strokeOpacity="0.12" />}
      <path
        d={d}
        fill="none"
        stroke={lit ? color : '#1e2533'}
        strokeWidth={lit ? 2.5 : 1.5}
        strokeOpacity={lit ? 0.55 : 0.4}
        strokeDasharray={lit ? 'none' : '6 8'}
        strokeLinecap="round"
      />
      {lit && (
        <circle r="4" fill={color} opacity="0.85">
          <animateMotion dur="3.5s" repeatCount="indefinite" path={d} />
        </circle>
      )}
    </g>
  );
};

// ── WorldMap (main component) ─────────────────────────────────────────────────
const WorldMap = ({ nodes: propNodes = [], progress, onNodeClick, selectedNodeId }) => {
  const containerRef = useRef(null);
  const [pan,      setPan]      = useState({ x: 20, y: 40 });
  const [zoom,     setZoom]     = useState(0.55);
  const [dragging, setDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Use mock data if no real nodes provided (dev mode)
  const allNodes = useMemo(
    () => (propNodes.length > 0 ? propNodes : generateMockWorld()),
    [propNodes]
  );

  // ── Group nodes by zone ───────────────────────────────────────────────────
  const nodesByZone = useMemo(() => {
    const map = {};
    ZONE_CONFIGS.forEach(z => { map[z.id] = []; });

    allNodes.forEach(node => {
      // Try zoneId directly, then look up by region
      const zoneId = node.zoneId || getZoneConfig(node.region)?.id;
      if (zoneId && map[zoneId]) {
        map[zoneId].push(node);
      }
    });

    // Sort each zone's nodes by nodeNum (ascending)
    Object.values(map).forEach(arr =>
      arr.sort((a, b) => (a.nodeNum ?? 0) - (b.nodeNum ?? 0))
    );

    return map;
  }, [allNodes]);

  // ── Completed node set for path lighting ─────────────────────────────────
  const completedSet = useMemo(
    () => new Set(progress?.completedNodes?.map(n => n.nodeId) || []),
    [progress]
  );

  // ── Inter-zone connectors: last node of zone N → first node of zone N+1 ──
  const interZoneConnectors = useMemo(() => {
    const connectors = [];
    for (let i = 0; i < ZONE_CONFIGS.length - 1; i++) {
      const zoneA   = ZONE_CONFIGS[i];
      const zoneB   = ZONE_CONFIGS[i + 1];
      const posA    = ZONE_POSITIONS[i];
      const posB    = ZONE_POSITIONS[i + 1];
      const nodesA  = nodesByZone[zoneA.id] || [];
      const nodesB  = nodesByZone[zoneB.id] || [];
      const lastA   = nodesA[nodesA.length - 1];
      const firstB  = nodesB[0];
      if (!lastA || !firstB) continue;
      const localA  = lastA.localPosition  || nodeLocalPos(lastA.nodeNum  ?? nodesA.length);
      const localB  = firstB.localPosition || nodeLocalPos(firstB.nodeNum ?? 1);
      connectors.push({
        id:     `bridge-${i}-${i+1}`,
        fromPos: { x: posA.x + localA.x, y: posA.y + localA.y },
        toPos:   { x: posB.x + localB.x, y: posB.y + localB.y },
        lit:     completedSet.has(lastA.nodeId),
        color:   zoneB.pathColor,
      });
    }
    return connectors;
  }, [nodesByZone, completedSet]);

  // ── Pan handlers (NO wheel zoom) ─────────────────────────────────────────
  const onMouseDown = useCallback(e => {
    if (e.button !== 0) return;
    setDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);
  const onMouseMove = useCallback(e => {
    if (!dragging) return;
    setPan(p => ({
      x: p.x + e.clientX - lastPos.current.x,
      y: p.y + e.clientY - lastPos.current.y,
    }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, [dragging]);
  const stopDrag = useCallback(() => setDragging(false), []);

  const onTouchStart = useCallback(e => {
    const t = e.touches[0]; if (!t) return;
    lastPos.current = { x: t.clientX, y: t.clientY };
    setDragging(true);
  }, []);
  const onTouchMove = useCallback(e => {
    if (!dragging) return;
    e.preventDefault();
    const t = e.touches[0]; if (!t) return;
    setPan(p => ({
      x: p.x + t.clientX - lastPos.current.x,
      y: p.y + t.clientY - lastPos.current.y,
    }));
    lastPos.current = { x: t.clientX, y: t.clientY };
  }, [dragging]);

  const tf = `translate(${pan.x}px,${pan.y}px) scale(${zoom})`;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        background: 'radial-gradient(ellipse 140% 110% at 50% 60%, #05091a 0%, #020408 100%)',
        cursor: dragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={onMouseDown} onMouseMove={onMouseMove}
      onMouseUp={stopDrag}     onMouseLeave={stopDrag}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={stopDrag}
    >
      {/* ── Deep space star field ────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {STARS.map(s => (
          <div
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{
              width: s.sz, height: s.sz,
              left: `${(s.x / WORLD_W) * 100}%`,
              top:  `${(s.y / WORLD_H) * 100}%`,
              opacity: s.op,
              animation: s.twinkle ? `pulse ${3 + s.op * 3}s ease-in-out infinite alternate` : 'none',
            }}
          />
        ))}
      </div>

      {/* ── Transformed world canvas ─────────────────────────────── */}
      <div
        className="absolute"
        style={{ transform: tf, transformOrigin: '0 0', width: WORLD_W, height: WORLD_H }}
      >

        {/* ── Inter-zone bridge SVG ───────────────────────────────── */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ width: WORLD_W, height: WORLD_H, overflow: 'visible' }}
        >
          {interZoneConnectors.map(c => (
            <InterZoneConnector key={c.id} {...c} />
          ))}
        </svg>

        {/* ── Zone tiles ──────────────────────────────────────────── */}
        {ZONE_CONFIGS.map((zone, zIdx) => {
          const { x: zx, y: zy } = ZONE_POSITIONS[zIdx];
          const zoneNodes = nodesByZone[zone.id] || [];

          // Fill missing nodes 1-15 with placeholder locked nodes
          const displayNodes = Array.from({ length: 15 }, (_, i) => {
            const nodeNum = i + 1;
            const existing = zoneNodes.find(n => n.nodeNum === nodeNum);
            if (existing) {
              return { ...existing, localPosition: existing.localPosition || nodeLocalPos(nodeNum) };
            }
            // Placeholder
            return {
              nodeId:        `${zone.id}_${nodeNum}_placeholder`,
              nodeNum,
              nodeType:      isBossNode(nodeNum) ? 'boss' : 'standard',
              bossType:      getBossType(nodeNum),
              region:        zone.region,
              zoneId:        zone.id,
              localPosition: nodeLocalPos(nodeNum),
              problemId:     { title: `Challenge ${nodeNum}`, difficulty: 'Easy' },
              isPlaceholder: true,
            };
          });

          return (
            <ZoneContainer
              key={zone.id}
              config={zone}
              zoneX={zx}
              zoneY={zy}
              nodes={displayNodes}
              completedNodeIds={completedSet}
            >
              {/* Render each node at its local position within the zone */}
              {displayNodes.map(node => {
                const { x: lx, y: ly } = node.localPosition;
                const nodeState     = node.isPlaceholder
                  ? { state: 'locked' }
                  : getState(node.nodeId, progress);
                const isSel         = node.nodeId === selectedNodeId;
                const boss          = node.nodeType === 'boss';
                const bossType      = node.bossType || getBossType(node.nodeNum);

                return (
                  <div
                    key={node.nodeId}
                    className="absolute"
                    style={{
                      left: lx,
                      top:  ly,
                      transform: 'translate(-50%, -50%)',
                      zIndex: isSel ? 30 : boss ? 20 : 10,
                    }}
                  >
                    {boss ? (
                      <BossNode
                        bossType={bossType}
                        isLocked={nodeState.state === 'locked'}
                        isDone={nodeState.state === 'completed'}
                        stars={nodeState.starsAwarded ?? 0}
                        isSelected={isSel}
                        onClick={() => onNodeClick?.(node)}
                        title={node.problemId?.title}
                        zoneColor={zone.primary}
                      />
                    ) : (
                      <StandardNode
                        node={node}
                        state={nodeState}
                        isSelected={isSel}
                        zoneConfig={zone}
                        onClick={onNodeClick ?? (() => {})}
                      />
                    )}
                  </div>
                );
              })}
            </ZoneContainer>
          );
        })}
      </div>

      {/* ── Zoom controls ────────────────────────────────────────── */}
      <div className="absolute bottom-5 right-5 z-30 flex flex-col gap-2 pointer-events-auto">
        {[
          { label: '+', fn: () => setZoom(z => Math.min(z * 1.2, 2.5)) },
          { label: '⟳', fn: () => { setZoom(0.55); setPan({ x: 20, y: 40 }); } },
          { label: '−', fn: () => setZoom(z => Math.max(z * 0.83, 0.2)) },
        ].map(b => (
          <button
            key={b.label}
            onClick={b.fn}
            className="w-9 h-9 bg-[#0d1117]/90 border border-gray-800/60 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 font-bold text-sm flex items-center justify-center transition-all hover:border-gray-600"
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* ── Legend ───────────────────────────────────────────────── */}
      <div className="absolute bottom-5 left-5 z-30 pointer-events-none bg-[#060810]/85 border border-gray-800/50 rounded-2xl px-4 py-3.5 backdrop-blur-md space-y-2.5">
        {[
          { color: '#2a3040', border: '#374151', label: 'Locked',     icon: '🔒' },
          { color: '#06b6d420', border: '#06b6d4', label: 'Available', icon: '●' },
          { color: '#fbbf2420', border: '#fbbf24', label: 'Completed', icon: '★' },
          { color: '#a855f720', border: '#a855f7', label: 'Mid Boss',  icon: '⚔️' },
          { color: '#ef444420', border: '#ef4444', label: 'Zone Boss', icon: '💀' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div
              className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0 text-[8px]"
              style={{ background: item.color, borderColor: item.border, boxShadow: `0 0 6px ${item.border}50` }}
            >
              {i === 0 && <span style={{ fontSize: 8 }}>🔒</span>}
            </div>
            <span className="text-[10px] text-gray-500 font-medium">{item.label}</span>
          </div>
        ))}
        <div className="pt-1.5 border-t border-gray-800/50 text-[10px] text-gray-700">
          Drag to pan · Use +/− to zoom
        </div>
      </div>

      {/* Zone count indicator */}
      <div className="absolute top-3 right-3 z-30 pointer-events-none">
        <div className="bg-[#060810]/80 border border-gray-800/40 rounded-lg px-3 py-1.5 flex items-center gap-2">
          <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">World</span>
          <span className="text-[11px] text-gray-400 font-mono font-bold">{ZONE_CONFIGS.length} Zones</span>
          <span className="text-gray-700">·</span>
          <span className="text-[11px] text-gray-400 font-mono font-bold">{ZONE_CONFIGS.length * 15} Nodes</span>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }`}</style>
    </div>
  );
};

export default WorldMap;
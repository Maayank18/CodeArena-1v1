// src/components/Campaign/WorldMap.jsx  — V3 "Saga Map"
// ─────────────────────────────────────────────────────────────────────────────
// Layout: single vertically-scrollable column of 15 zone tiles.
// Each zone tile: 720×680px, snake-path nodes, biome background, weather.
// Standard nodes: circular glowing buttons.
// Boss nodes (8 & 15): <BossNode> with pulsing rings.
// Inter-zone connectors: animated SVG bezier between last/first nodes.
// No wheel zoom — pure vertical scroll + ±zoom buttons for overall scale.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useRef, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import ZoneContainer from './ZoneContainer';
import BossNode      from './BossNode';
import {
  ZONE_CONFIGS,
  ZONE_W, ZONE_H, ZONE_GAP,
  NODE_RADIUS, BOSS_RADIUS,
  MID_BOSS_IDX, MAIN_BOSS_IDX,
  getLocalNodePos,
  generateMockWorld,
} from './campaignWorldData';

// ── getZoneConfig shim (if not exported from data file) ───────────────────────
const _getZoneCfg = (region) =>
  ZONE_CONFIGS.find(z => z.id === region) || ZONE_CONFIGS[0];

// ── Node progress state helper ────────────────────────────────────────────────
const getState = (nodeId, progress) => {
  if (!progress) return { state: 'locked' };
  const done = progress.completedNodes?.find(n => n.nodeId === nodeId);
  if (done) return { state: 'completed', starsAwarded: done.starsAwarded ?? 0 };
  if (progress.unlockedNodes?.includes(nodeId)) return { state: 'available' };
  return { state: 'locked' };
};

// ── StandardNode ──────────────────────────────────────────────────────────────
const StandardNode = React.memo(({ node, state, isSelected, accent, pathColor, onClick }) => {
  const isLocked = state.state === 'locked';
  const isAvail  = state.state === 'available';
  const isDone   = state.state === 'completed';
  const stars    = state.starsAwarded || 0;
  const SZ       = NODE_RADIUS * 2;

  const border = isLocked ? '#374151' : isDone ? '#fbbf24' : accent;
  const bg     = isLocked
    ? 'radial-gradient(circle,#0e1117,#070a0f)'
    : isDone
      ? `radial-gradient(circle at 35% 35%, ${['#2d1800','#2d2200','#1f1600'][Math.min(stars,3)-1]||'#2d1800'}, #080600)`
      : `radial-gradient(circle at 35% 35%, ${accent}28, ${accent}08)`;
  const glow = isLocked ? 'none' : isDone
    ? `0 0 16px #fbbf2470`
    : `0 0 18px ${accent}65, 0 0 36px ${accent}25`;

  const title = node.problemId?.title?.split(' ').slice(0,3).join(' ') || `Node ${node.nodeNum}`;

  return (
    <div className="flex flex-col items-center gap-1" style={{ opacity: isLocked ? 0.4 : 1 }}>
      {/* Available pulse ring */}
      {isAvail && (
        <motion.div className="absolute rounded-full border-2 pointer-events-none"
          style={{ width: SZ + 18, height: SZ + 18, borderColor: `${accent}60` }}
          animate={{ scale:[1,1.3,1], opacity:[.8,0,.8] }}
          transition={{ duration:2, repeat:Infinity, ease:'easeInOut' }}
        />
      )}

      {/* Selection ring */}
      {isSelected && (
        <div className="absolute rounded-full pointer-events-none"
          style={{ width:SZ+12, height:SZ+12, border:'2px solid rgba(255,255,255,.5)' }}/>
      )}

      {/* Circle */}
      <motion.div
        className="relative flex items-center justify-center rounded-full border-2 cursor-pointer"
        style={{ width:SZ, height:SZ, background:bg, borderColor:border, boxShadow: isSelected ? `0 0 0 3px rgba(255,255,255,.2),${glow}` : glow }}
        whileHover={{ scale: isLocked ? 1 : 1.1 }}
        whileTap={{   scale: isLocked ? 1 : 0.93 }}
        onClick={() => !isLocked && onClick?.(node)}
      >
        {isLocked ? (
          <Lock size={14} className="text-gray-700"/>
        ) : isDone ? (
          <div className="flex gap-0.5">
            {[1,2,3].map(i=>(
              <span key={i} style={{fontSize:9, color: i<=stars ? '#fbbf24':'#374151'}}>★</span>
            ))}
          </div>
        ) : (
          <motion.div className="rounded-full"
            style={{ width:10, height:10, background:accent, boxShadow:`0 0 10px ${accent}` }}
            animate={{ opacity:[.5,1,.5] }} transition={{duration:1.8,repeat:Infinity}}
          />
        )}
      </motion.div>

      {/* Label */}
      <div className="px-2 py-0.5 rounded-full text-[8px] font-bold font-mono max-w-[76px] truncate text-center"
        style={{ background:'rgba(0,0,0,.7)', backdropFilter:'blur(4px)',
          color: isLocked ? '#374151' : isDone ? '#fbbf24' : accent,
          border:`1px solid ${isLocked ? '#1f2937' : isDone ? '#92400e40' : accent+'30'}` }}>
        {title}
      </div>
    </div>
  );
});

// ── Inter-zone SVG bridge (connects zone N last node → zone N+1 first node) ──
const InterZoneBridge = ({ fromLocal, toLocal, zoneTop, nextZoneTop, fromColor, toColor, lit }) => {
  // Absolute positions in the scroll canvas
  const HALF = ZONE_W / 2;
  const fx = fromLocal.x, fy = zoneTop + fromLocal.y;
  const tx = toLocal.x,   ty = nextZoneTop + toLocal.y;
  // Control points: drop down from zone end, rise up to next zone start
  const d = `M ${fx} ${fy} C ${fx} ${fy+55} ${tx} ${ty-55} ${tx} ${ty}`;

  return (
    <g>
      <path d={d} fill="none" stroke={lit ? toColor : '#1e293b'}
        strokeWidth={lit ? 2.5 : 1.8} strokeOpacity={lit ? .7 : .4}
        strokeDasharray={lit ? 'none' : '6 8'} strokeLinecap="round"/>
      {lit && (
        <circle r="4" fill={toColor} opacity=".85">
          <animateMotion dur="3s" repeatCount="indefinite" path={d}/>
        </circle>
      )}
    </g>
  );
};

// ── WorldMap ──────────────────────────────────────────────────────────────────
const WorldMap = ({ nodes: propNodes = [], progress, onNodeClick, selectedNodeId }) => {
  const scrollRef = useRef(null);
  const [zoom, setZoom]   = useState(1);

  // Use mock data if no real nodes passed
  const allNodes = useMemo(
    () => propNodes.length > 0 ? propNodes : generateMockWorld(),
    [propNodes]
  );

  // Group nodes by zone, sorted by nodeNum
  const nodesByZone = useMemo(() => {
    const m = {};
    ZONE_CONFIGS.forEach(z => { m[z.id] = []; });
    allNodes.forEach(n => {
      const zid = n.region || n.zoneId;
      if (m[zid]) m[zid].push(n);
    });
    Object.values(m).forEach(arr => arr.sort((a,b) => (a.nodeNum??0)-(b.nodeNum??0)));
    return m;
  }, [allNodes]);

  const completedSet = useMemo(
    () => new Set(progress?.completedNodes?.map(n => n.nodeId) || []),
    [progress]
  );

  // Zone top positions in the scroll canvas
  const zoneTops = useMemo(() =>
    ZONE_CONFIGS.map((_, i) => i * (ZONE_H + ZONE_GAP)),
    []
  );

  // Total canvas height
  const CANVAS_H = ZONE_CONFIGS.length * (ZONE_H + ZONE_GAP);
  const CANVAS_W = ZONE_W;

  // Scroll to zone containing selected node
  const scrollToZone = useCallback((zIdx) => {
    const el = scrollRef.current;
    if (!el) return;
    const target = zoneTops[zIdx] * zoom - el.clientHeight / 3;
    el.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
  }, [zoneTops, zoom]);

  // Jump to first available (incomplete) node
  const jumpToProgress = useCallback(() => {
    const firstAvail = allNodes.find(n => {
      const s = getState(n.nodeId, progress);
      return s.state === 'available';
    });
    if (firstAvail) scrollToZone(firstAvail.zoneIndex ?? 0);
  }, [allNodes, progress, scrollToZone]);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background:'#020408' }}>

      {/* ── Deep space parallax bg ─────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({length:80},(_,i)=>(
          <div key={i} className="absolute rounded-full bg-white"
            style={{ width:(i%5<2?1.5:0.8), height:(i%5<2?1.5:0.8),
              left:`${(i*137.5)%100}%`, top:`${(i*97.3)%100}%`,
              opacity:(i%3===0?.5:.15) }}/>
        ))}
      </div>

      {/* ── Scrollable canvas ──────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto overflow-x-hidden"
        style={{ scrollbarWidth:'none' }}
      >
        <div
          className="relative mx-auto"
          style={{
            width:  CANVAS_W * zoom,
            height: CANVAS_H * zoom,
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
          }}
        >
          {/* Inter-zone bridge SVG (absolute layer covering whole canvas) */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: CANVAS_W, height: CANVAS_H, zIndex: 15, overflow:'visible' }}
          >
            {ZONE_CONFIGS.slice(0,-1).map((zone, zIdx) => {
              const nextZone    = ZONE_CONFIGS[zIdx + 1];
              const zNodes      = nodesByZone[zone.id]     || [];
              const nextZNodes  = nodesByZone[nextZone.id] || [];
              const lastNode    = zNodes[zNodes.length - 1];
              const firstNode   = nextZNodes[0];
              if (!lastNode || !firstNode) return null;
              const fromLocal   = lastNode.localPos  || getLocalNodePos(14);
              const toLocal     = firstNode.localPos || getLocalNodePos(0);
              const lit = completedSet.has(lastNode.nodeId);

              return (
                <InterZoneBridge key={`bridge-${zIdx}`}
                  fromLocal={fromLocal}  toLocal={toLocal}
                  zoneTop={zoneTops[zIdx]}  nextZoneTop={zoneTops[zIdx+1]}
                  fromColor={zone.path}     toColor={nextZone.path}
                  lit={lit}
                />
              );
            })}
          </svg>

          {/* Zone tiles */}
          {ZONE_CONFIGS.map((zone, zIdx) => {
            const zoneNodes  = nodesByZone[zone.id] || [];
            const zoneTop    = zoneTops[zIdx];

            // Build display nodes 1-15 (fill placeholders for missing)
            const displayNodes = Array.from({ length: 15 }, (_, i) => {
              const found = zoneNodes.find(n => n.nodeNum === i + 1 || n.localIndex === i);
              return found ?? {
                nodeId:     `${zone.id}_${i+1}_ph`,
                nodeNum:     i + 1,
                localIndex:  i,
                nodeType:    (i===MID_BOSS_IDX||i===MAIN_BOSS_IDX) ? 'boss' : 'standard',
                bossType:    i===MID_BOSS_IDX ? 'mid' : i===MAIN_BOSS_IDX ? 'main' : null,
                region:      zone.id,
                zoneIndex:   zIdx,
                localPos:    getLocalNodePos(i),
                problemId:   { title:`Challenge ${i+1}` },
                isPlaceholder: true,
              };
            });

            return (
              <div
                key={zone.id}
                className="absolute"
                style={{ left: 0, top: zoneTop, width: ZONE_W, height: ZONE_H, zIndex: 10 }}
              >
                <ZoneContainer
                  config={zone}
                  completedIds={completedSet}
                  zoneY={zoneTop}
                >
                  {displayNodes.map(node => {
                    const { x, y } = node.localPos || getLocalNodePos(node.localIndex ?? 0);
                    const nodeState = node.isPlaceholder
                      ? { state: 'locked' }
                      : getState(node.nodeId, progress);
                    const isSel   = node.nodeId === selectedNodeId;
                    const isBoss  = node.nodeType === 'boss';
                    const bType   = node.bossType || null;
                    const BR      = BOSS_RADIUS;
                    const NR      = NODE_RADIUS;
                    const half    = isBoss ? BR + 20 : NR;

                    return (
                      <div
                        key={node.nodeId}
                        className="absolute"
                        style={{
                          left: x, top: y,
                          transform: 'translate(-50%,-50%)',
                          zIndex: isSel ? 50 : isBoss ? 30 : 20,
                        }}
                      >
                        {isBoss ? (
                          <BossNode
                            bossType={bType}
                            isLocked={nodeState.state === 'locked'}
                            isDone={nodeState.state === 'completed'}
                            stars={nodeState.starsAwarded ?? 0}
                            isSelected={isSel}
                            onClick={() => !node.isPlaceholder && onNodeClick?.(node)}
                            title={node.problemId?.title}
                          />
                        ) : (
                          <StandardNode
                            node={node}
                            state={nodeState}
                            isSelected={isSel}
                            accent={zone.accent}
                            pathColor={zone.path}
                            onClick={!node.isPlaceholder ? onNodeClick : undefined}
                          />
                        )}
                      </div>
                    );
                  })}
                </ZoneContainer>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── HUD: Zoom controls ──────────────────────────────────────── */}
      <div className="absolute bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-auto">
        {[
          { label:'+', fn:()=>setZoom(z=>Math.min(z*1.18,2.2)) },
          { label:'⟳', fn:()=>{ setZoom(1); scrollRef.current?.scrollTo({top:0,behavior:'smooth'}); } },
          { label:'−', fn:()=>setZoom(z=>Math.max(z*0.85,0.35)) },
        ].map(b=>(
          <button key={b.label} onClick={b.fn}
            className="w-9 h-9 bg-[#0d1117]/90 border border-gray-800/70 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 font-bold text-sm flex items-center justify-center transition-all hover:border-gray-600">
            {b.label}
          </button>
        ))}
      </div>

      {/* ── HUD: Jump to progress ───────────────────────────────────── */}
      <div className="absolute bottom-5 left-5 z-50 pointer-events-auto">
        <button
          onClick={jumpToProgress}
          className="flex items-center gap-2 px-3 py-2 bg-accent/15 hover:bg-accent/25 border border-accent/35 hover:border-accent/55 text-accent text-xs font-bold rounded-xl transition-all"
          style={{ '--accent':'#4ade80' }}
        >
          <span className="text-sm">🎯</span> Continue
        </button>
      </div>

      {/* ── HUD: Mini zone index ────────────────────────────────────── */}
      <div className="absolute top-3 right-3 z-50 pointer-events-none">
        <div className="bg-[#060810]/85 border border-gray-800/40 rounded-xl px-3 py-2 space-y-1 max-h-60 overflow-hidden">
          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-1.5">Zones</p>
          {ZONE_CONFIGS.map((z,i)=>{
            const zNodes = nodesByZone[z.id] || [];
            const done   = zNodes.filter(n=>completedSet.has(n.nodeId)).length;
            const total  = zNodes.length || 15;
            const pct    = Math.round((done/total)*100);
            return (
              <button
                key={z.id}
                className="flex items-center gap-2 w-full text-left hover:opacity-100 transition-opacity"
                style={{ opacity: done===0 && i>0 ? 0.4 : 0.85 }}
                onClick={()=>scrollRef.current?.scrollTo({ top: zoneTops[i]*zoom - 100, behavior:'smooth' })}
              >
                <span className="text-xs select-none">{z.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-bold text-gray-400 truncate max-w-[100px]">{z.name}</div>
                  <div className="h-1 rounded-full mt-0.5" style={{ background:'#1e293b' }}>
                    <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, background:z.accent }}/>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Legend ─────────────────────────────────────────────────── */}
      <div className="absolute bottom-5 left-[58px] z-50 pointer-events-none bg-[#060810]/85 border border-gray-800/50 rounded-xl px-3 py-2.5 backdrop-blur-md">
        {[
          { col:'#374151', label:'Locked' },
          { col:'#06b6d4', label:'Available' },
          { col:'#fbbf24', label:'Complete' },
          { col:'#a855f7', label:'Mid Boss' },
          { col:'#ef4444', label:'Zone Boss' },
        ].map((item,i)=>(
          <div key={i} className="flex items-center gap-2 mb-1.5 last:mb-0">
            <div className="w-3 h-3 rounded-full border shrink-0"
              style={{ borderColor:item.col, background:item.col+'25', boxShadow:`0 0 6px ${item.col}50` }}/>
            <span className="text-[9px] text-gray-500 font-medium">{item.label}</span>
          </div>
        ))}
        <div className="border-t border-gray-800/60 mt-1.5 pt-1.5 text-[9px] text-gray-700">
          Scroll to navigate
        </div>
      </div>
    </div>
  );
};

export default WorldMap;

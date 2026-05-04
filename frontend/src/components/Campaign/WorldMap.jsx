import React, { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import ZoneContainer from './ZoneContainer';
import BossNode from './BossNode';
import NodeDetailPanel from './NodeDetailPanel';
import {
  ZONE_CONFIGS,
  ZONE_W,
  ZONE_H,
  ZONE_GAP,
  NODE_RADIUS,
  MID_BOSS_IDX,
  MAIN_BOSS_IDX,
  getLocalNodePos,
  generateMockWorld,
} from './campaignWorldData';

const REGION_TO_ZONE_ID = {
  Array_Archipelago: 'array_archipelago',
  String_Shores: 'string_shores',
  Loop_Lagoon: 'loop_lagoon',
  Sliding_Window_Sanctum: 'sliding_window_sanctum',
  HashMap_Highlands: 'hashmap_highlands',
  Stack_Queue_Quarry: 'stack_queue_quarry',
  Tree_Territory: 'tree_tundra',
  Graph_Gorge: 'graph_gorge',
  DP_Dungeon: 'dp_dungeon',
};

const STAR_INDICES = [1, 2, 3];

const resolveZoneId = (node) => {
  const raw = node?.zoneId || node?.region || '';
  if (ZONE_CONFIGS.some((z) => z.id === raw)) return raw;
  if (REGION_TO_ZONE_ID[raw]) return REGION_TO_ZONE_ID[raw];
  const lower = raw.toLowerCase().replace(/ /g, '_');
  const found = ZONE_CONFIGS.find((z) => z.id === lower || z.id.includes(lower));
  return found ? found.id : null;
};

const getNodeTitle = (node) =>
  node?.problemId?.title ||
  node?.problem?.title ||
  node?.title ||
  'Unknown Challenge';

const isGuaranteedEntryNode = (node) =>
  Boolean(node?.isEntryNode) ||
  (Array.isArray(node?.prerequisites) && node.prerequisites.length === 0) ||
  node?.nodeNum === 1 ||
  node?.nodeOrder === 1 ||
  node?.localIndex === 0;

const getState = (node, progress, isFirstNodeFallback = false) => {
  const nodeId = node?.nodeId;
  const isRootNode = isGuaranteedEntryNode(node);

  if (!progress) {
    return isFirstNodeFallback || isRootNode ? { state: 'available' } : { state: 'locked' };
  }

  const done = progress.completedNodes?.find((entry) => entry.nodeId === nodeId);
  if (done) return { state: 'completed', starsAwarded: done.starsAwarded ?? 0 };
  if (progress.unlockedNodes?.includes(nodeId)) return { state: 'available' };
  if (isFirstNodeFallback || isRootNode) return { state: 'available' };
  return { state: 'locked' };
};

const useRafViewport = () => {
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1440,
    height: typeof window !== 'undefined' ? window.innerHeight : 900,
  }));

  useEffect(() => {
    let frameId = null;

    const handleResize = () => {
      if (frameId !== null) return;

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        setViewport((prev) => {
          const nextWidth = window.innerWidth;
          const nextHeight = window.innerHeight;

          if (prev.width === nextWidth && prev.height === nextHeight) {
            return prev;
          }

          return { width: nextWidth, height: nextHeight };
        });
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return viewport;
};

const StandardNode = React.memo(function StandardNode({ node, state, accent, onClick }) {
  const isLocked = state.state === 'locked';
  const isAvail = state.state === 'available';
  const isDone = state.state === 'completed';
  const stars = state.starsAwarded || 0;
  const sz = NODE_RADIUS * 2;

  const border = isLocked ? '#374151' : isDone ? '#fbbf24' : accent;
  const bg = isLocked
    ? 'radial-gradient(circle,#0e1117,#070a0f)'
    : isDone
      ? `radial-gradient(circle at 35% 35%, ${['#2d1800', '#2d2200', '#1f1600'][Math.min(stars, 3) - 1] ?? '#2d1800'}, #080600)`
      : `radial-gradient(circle at 35% 35%, ${accent}28, ${accent}08)`;
  const glow = isLocked
    ? 'none'
    : isDone
      ? '0 0 16px #fbbf2470'
      : `0 0 18px ${accent}65, 0 0 36px ${accent}25`;

  const title = getNodeTitle(node) || `Node ${node.nodeNum ?? '?'}`;

  return (
    <div className="relative flex flex-col items-center gap-1" style={{ opacity: isLocked ? 0.4 : 1 }}>
      {isAvail && (
        <motion.div
          className="absolute rounded-full border-2 pointer-events-none"
          style={{ width: sz + 18, height: sz + 18, borderColor: `${accent}60` }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <motion.div
        className="relative flex items-center justify-center rounded-full border-2"
        style={{
          width: sz,
          height: sz,
          background: bg,
          borderColor: border,
          boxShadow: glow,
          cursor: isLocked ? 'not-allowed' : 'pointer',
        }}
        whileHover={{ scale: isLocked ? 1 : 1.08 }}
        whileTap={{ scale: isLocked ? 1 : 0.94 }}
        onClick={() => !isLocked && onClick(node)}
      >
        {isLocked ? (
          <Lock size={14} className="text-gray-700" />
        ) : isDone ? (
          <div className="flex gap-0.5">
            {STAR_INDICES.map((i) => (
              <span key={i} style={{ fontSize: 9, color: i <= stars ? '#fbbf24' : '#374151' }}>
                ★
              </span>
            ))}
          </div>
        ) : (
          <motion.div
            className="rounded-full"
            style={{ width: 10, height: 10, background: accent, boxShadow: `0 0 10px ${accent}` }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
        )}
      </motion.div>

      <div
        className="px-2 py-0.5 rounded-full text-[8px] font-bold font-mono max-w-[76px] truncate text-center"
        style={{
          background: 'rgba(0,0,0,.7)',
          backdropFilter: 'blur(4px)',
          color: isLocked ? '#374151' : isDone ? '#fbbf24' : accent,
          border: `1px solid ${isLocked ? '#1f2937' : isDone ? '#92400e40' : `${accent}30`}`,
        }}
      >
        {title.split(' ').slice(0, 3).join(' ')}
      </div>
    </div>
  );
});

const InterZoneBridge = React.memo(function InterZoneBridge({
  fromLocal,
  toLocal,
  zoneTop,
  nextZoneTop,
  toColor,
  lit,
}) {
  const fx = fromLocal.x;
  const fy = zoneTop + fromLocal.y;
  const tx = toLocal.x;
  const ty = nextZoneTop + toLocal.y;
  const d = `M ${fx} ${fy} C ${fx} ${fy + 55} ${tx} ${ty - 55} ${tx} ${ty}`;

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={lit ? toColor : '#1e293b'}
        strokeWidth={lit ? 2.5 : 1.8}
        strokeOpacity={lit ? 0.7 : 0.4}
        strokeDasharray={lit ? undefined : '6 8'}
        strokeLinecap="round"
      />
      {lit && (
        <circle r="4" fill={toColor} opacity="0.85">
          <animateMotion dur="3s" repeatCount="indefinite" path={d} />
        </circle>
      )}
    </g>
  );
});

const MapNodeSlot = React.memo(function MapNodeSlot({
  node,
  nodeState,
  accent,
  onNodeClick,
  isMobile,
}) {
  const { x, y } = node.localPos ?? getLocalNodePos(node.localIndex ?? 0);
  const isBoss = node.nodeType === 'boss';
  const effectiveNodeState = useMemo(() => {
    if (isGuaranteedEntryNode(node) && nodeState.state === 'locked') {
      return { ...nodeState, state: 'available' };
    }

    return nodeState;
  }, [node, nodeState]);
  const isInteractive =
    !node.isPlaceholder &&
    node.hasProblemData !== false &&
    effectiveNodeState.state !== 'locked';

  const handleClick = useCallback(() => {
    if (isInteractive) {
      onNodeClick(node);
    }
  }, [isInteractive, node, onNodeClick]);

  return (
    <div
      className="absolute"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%,-50%)',
        zIndex: isBoss ? 30 : 20,
      }}
    >
      {isBoss ? (
        <BossNode
          bossType={node.bossType}
          isLocked={effectiveNodeState.state === 'locked'}
          isDone={effectiveNodeState.state === 'completed'}
          stars={effectiveNodeState.starsAwarded ?? 0}
          onClick={handleClick}
          title={getNodeTitle(node)}
          isMobile={isMobile}
        />
      ) : (
        <StandardNode
          node={node}
          state={effectiveNodeState}
          accent={accent}
          onClick={handleClick}
        />
      )}
    </div>
  );
}, (prev, next) => (
  prev.node === next.node &&
  prev.accent === next.accent &&
  prev.isMobile === next.isMobile &&
  prev.onNodeClick === next.onNodeClick &&
  prev.nodeState.state === next.nodeState.state &&
  prev.nodeState.starsAwarded === next.nodeState.starsAwarded
));

const ZoneProgressButton = React.memo(function ZoneProgressButton({ zone, done, total, zoneTop, onJump }) {
  const pct = Math.round((done / total) * 100);

  return (
    <button
      className="flex items-center gap-2 w-full text-left hover:opacity-100 transition-opacity pointer-events-auto"
      style={{ opacity: done === 0 && zone.index > 0 ? 0.4 : 0.85 }}
      onClick={() => onJump(zoneTop)}
    >
      <span className="text-xs select-none">{zone.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-bold text-gray-400 truncate max-w-[100px]">
          {zone.name}
        </div>
        <div className="h-1 rounded-full mt-0.5" style={{ background: '#1e293b' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: zone.accent }}
          />
        </div>
      </div>
    </button>
  );
});

const WorldMapScene = React.memo(function WorldMapScene({
  nodes,
  progress,
  onNodeClick,
  useMockData,
}) {
  const scrollRef = useRef(null);
  const { width: viewportWidth, height: viewportHeight } = useRafViewport();

  const allNodes = useMemo(
    () => (nodes.length > 0 || !useMockData ? nodes : generateMockWorld()),
    [nodes, useMockData]
  );
  const isMobile = viewportWidth < 640;

  const nodesByZone = useMemo(() => {
    const map = {};
    ZONE_CONFIGS.forEach((zone) => {
      map[zone.id] = [];
    });

    allNodes.forEach((node) => {
      const zoneId = resolveZoneId(node);
      if (!zoneId || !map[zoneId]) return;

      const sequenceNum = node.nodeOrder ?? node.nodeNum ?? 1;
      const rawIndex = node.localIndex ?? Math.max(0, sequenceNum - 1);
      const safeIndex = Math.min(14, Math.max(0, rawIndex));
      const localPos = node.localPos || getLocalNodePos(safeIndex);

      map[zoneId].push({
        ...node,
        zoneId,
        nodeNum: sequenceNum,
        localIndex: safeIndex,
        localPos,
      });
    });

    Object.values(map).forEach((zoneNodes) => {
      zoneNodes.sort((a, b) => (a.nodeNum ?? 0) - (b.nodeNum ?? 0));
    });

    return map;
  }, [allNodes]);

  const displayNodesByZone = useMemo(() => {
    const map = {};

    ZONE_CONFIGS.forEach((zone, zoneIndex) => {
      const zoneNodes = nodesByZone[zone.id] ?? [];

      map[zone.id] = Array.from({ length: 15 }, (_, nodeIndex) => {
        const found = zoneNodes.find((node) => node.nodeNum === nodeIndex + 1 || node.localIndex === nodeIndex);
        return found ?? {
          nodeId: `${zone.id}_${nodeIndex + 1}_ph`,
          nodeNum: nodeIndex + 1,
          localIndex: nodeIndex,
          nodeType: nodeIndex === MID_BOSS_IDX || nodeIndex === MAIN_BOSS_IDX ? 'boss' : 'standard',
          bossType: nodeIndex === MID_BOSS_IDX ? 'mid' : nodeIndex === MAIN_BOSS_IDX ? 'main' : null,
          region: zone.id,
          zoneIndex,
          localPos: getLocalNodePos(nodeIndex),
          problem: { title: `Challenge ${nodeIndex + 1}` },
          problemId: { title: `Challenge ${nodeIndex + 1}` },
          isPlaceholder: true,
          hasProblemData: false,
        };
      });
    });

    return map;
  }, [nodesByZone]);

  const nodeStateById = useMemo(() => {
    const stateMap = {};
    const firstZoneFirstNodeId = displayNodesByZone[ZONE_CONFIGS[0]?.id]?.[0]?.nodeId ?? null;
    const unlockedIds = progress?.unlockedNodes ?? [];
    const allIds = new Set(allNodes.map((node) => node.nodeId).filter(Boolean));
    const mockIdMismatch = unlockedIds.length > 0 && !unlockedIds.some((id) => allIds.has(id));

    ZONE_CONFIGS.forEach((zone, zoneIndex) => {
      const zoneNodes = displayNodesByZone[zone.id] ?? [];

      zoneNodes.forEach((node) => {
        const isFirstNodeFallback =
          mockIdMismatch &&
          zoneIndex === 0 &&
          node.nodeId === firstZoneFirstNodeId;

        stateMap[node.nodeId] = node.isPlaceholder || node.hasProblemData === false
          ? { state: 'locked', starsAwarded: 0 }
          : getState(node, progress, isFirstNodeFallback);
      });
    });

    return stateMap;
  }, [allNodes, displayNodesByZone, progress]);

  const completedSet = useMemo(
    () => new Set(progress?.completedNodes?.map((entry) => entry.nodeId) ?? []),
    [progress]
  );

  const zoneTops = useMemo(
    () => ZONE_CONFIGS.map((_, index) => index * (ZONE_H + ZONE_GAP)),
    []
  );

  const canvasH = ZONE_CONFIGS.length * (ZONE_H + ZONE_GAP);

  const mapScale = useMemo(() => {
    const safePadding = viewportWidth < 640 ? 24 : viewportWidth < 1024 ? 48 : 80;
    const widthLimited = (viewportWidth - safePadding) / ZONE_W;
    const heightLimited = viewportHeight < 720 ? 0.92 : viewportHeight < 900 ? 0.98 : 1;
    const mobileBoost = viewportWidth < 640 ? 0.86 : 1;

    return Math.max(0.72, Math.min(1, widthLimited, heightLimited) * mobileBoost);
  }, [viewportHeight, viewportWidth]);

  const scaledCanvasHeight = canvasH * mapScale;

  const scrollToOffset = useCallback((top) => {
    scrollRef.current?.scrollTo({
      top: Math.max(0, top - 80),
      behavior: 'smooth',
    });
  }, []);

  const jumpToProgress = useCallback(() => {
    const firstAvailableZoneIndex = ZONE_CONFIGS.findIndex((zone) => {
      const zoneNodes = displayNodesByZone[zone.id] ?? [];
      return zoneNodes.some((node) => nodeStateById[node.nodeId]?.state === 'available');
    });

    scrollToOffset(zoneTops[Math.max(0, firstAvailableZoneIndex)] ?? 0);
  }, [displayNodesByZone, nodeStateById, scrollToOffset, zoneTops]);

  const bridgeFrom = useMemo(() => getLocalNodePos(14), []);
  const bridgeTo = useMemo(() => getLocalNodePos(0), []);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#020408' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 80 }, (_, index) => (
          <div
            key={index}
            className="absolute rounded-full bg-white"
            style={{
              width: index % 5 < 2 ? 1.5 : 0.8,
              height: index % 5 < 2 ? 1.5 : 0.8,
              left: `${(index * 137.5) % 100}%`,
              top: `${(index * 97.3) % 100}%`,
              opacity: index % 3 === 0 ? 0.5 : 0.15,
            }}
          />
        ))}
      </div>

      <div
        ref={scrollRef}
        data-campaign-scroll
        className="absolute inset-0 overflow-y-auto"
        style={{
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none',
        }}
      >
        <div
          className="relative mx-auto"
          style={{
            width: ZONE_W,
            height: canvasH,
            transform: `scale(${mapScale})`,
            transformOrigin: 'top center',
            willChange: 'transform',
            marginBottom: scaledCanvasHeight * (1 / mapScale - 1),
          }}
        >
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: ZONE_W, height: canvasH, zIndex: 15, overflow: 'visible' }}
          >
            {ZONE_CONFIGS.slice(0, -1).map((zone, zoneIndex) => {
              const nextZone = ZONE_CONFIGS[zoneIndex + 1];
              const zoneNodes = displayNodesByZone[zone.id] ?? [];
              const zoneBoss = zoneNodes.find((node) => node.nodeNum === 15);
              const lit = zoneBoss ? completedSet.has(zoneBoss.nodeId) : false;

              return (
                <InterZoneBridge
                  key={`bridge-${zoneIndex}`}
                  fromLocal={bridgeFrom}
                  toLocal={bridgeTo}
                  zoneTop={zoneTops[zoneIndex]}
                  nextZoneTop={zoneTops[zoneIndex + 1]}
                  toColor={nextZone.path ?? '#22d3ee'}
                  lit={lit}
                />
              );
            })}
          </svg>

          {ZONE_CONFIGS.map((zone, zoneIndex) => {
            const zoneNodes = displayNodesByZone[zone.id] ?? [];
            const zoneTop = zoneTops[zoneIndex];

            return (
              <div
                key={zone.id}
                className="absolute"
                style={{ left: 0, top: zoneTop, width: ZONE_W, height: ZONE_H, zIndex: 10 }}
              >
                <ZoneContainer
                  config={zone}
                  completedIds={completedSet}
                  isMobile={isMobile}
                  nodes={zoneNodes}
                >
                  {zoneNodes.map((node) => (
                    <MapNodeSlot
                      key={node.nodeId}
                      node={node}
                      nodeState={nodeStateById[node.nodeId]}
                      accent={zone.accent ?? '#22d3ee'}
                      onNodeClick={onNodeClick}
                      isMobile={isMobile}
                    />
                  ))}
                </ZoneContainer>
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute top-3 right-3 z-50 pointer-events-none w-[min(44vw,240px)] sm:w-auto">
        <div className="bg-[#060810]/85 border border-gray-800/40 rounded-xl px-2.5 py-2 space-y-1 max-h-[42vh] overflow-auto backdrop-blur-md sm:px-3 sm:max-h-60">
          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-1.5">
            Zones
          </p>
          {ZONE_CONFIGS.map((zone, index) => {
            const zoneNodes = displayNodesByZone[zone.id] ?? [];
            const done = zoneNodes.filter((node) => completedSet.has(node.nodeId)).length;
            const total = zoneNodes.length || 15;

            return (
              <ZoneProgressButton
                key={zone.id}
                zone={{ ...zone, index }}
                done={done}
                total={total}
                zoneTop={zoneTops[index]}
                onJump={scrollToOffset}
              />
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-3 left-3 z-50 flex flex-col items-start gap-3 sm:bottom-5 sm:left-5 sm:gap-4">
        <div className="pointer-events-none bg-[#060810]/85 border border-gray-800/50 rounded-xl px-2.5 py-2 backdrop-blur-md hidden md:block">
          {[
            { col: '#374151', label: 'Locked' },
            { col: '#06b6d4', label: 'Available' },
            { col: '#fbbf24', label: 'Complete' },
            { col: '#a855f7', label: 'Mid Boss' },
            { col: '#ef4444', label: 'Zone Boss' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 mb-1.5 last:mb-0">
              <div
                className="w-3 h-3 rounded-full border shrink-0"
                style={{
                  borderColor: item.col,
                  background: `${item.col}25`,
                  boxShadow: `0 0 6px ${item.col}50`,
                }}
              />
              <span className="text-[9px] text-gray-500 font-medium">{item.label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={jumpToProgress}
          className="pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
          style={{
            background: 'rgba(34,211,238,0.12)',
            border: '1px solid rgba(34,211,238,0.30)',
            color: '#22d3ee',
            backdropFilter: 'blur(6px)',
          }}
        >
          <span className="text-sm">Target</span>
          <span className="hidden sm:inline">Continue</span>
          <span className="sm:hidden">Go</span>
        </button>
      </div>
    </div>
  );
});

const WorldMap = ({ nodes = [], progress, onStartChallenge, useMockData = true }) => {
  const [selectedNode, setSelectedNode] = useState(null);

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedNode(null);
  }, []);

  return (
    <>
      <WorldMapScene
        nodes={nodes}
        progress={progress}
        onNodeClick={handleNodeClick}
        useMockData={useMockData}
      />

      {selectedNode ? (
        <NodeDetailPanel
          key={selectedNode.nodeId}
          node={selectedNode}
          progress={progress}
          onClose={handleClosePanel}
          onStartChallenge={onStartChallenge}
        />
      ) : null}
    </>
  );
};

export default React.memo(WorldMap);

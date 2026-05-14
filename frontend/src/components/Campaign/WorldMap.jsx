import React, { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';
import ZoneContainer from './ZoneContainer';
import BossNode from './BossNode';
import NodeDetailPanel from './NodeDetailPanel';
import {
  ZONE_W,
  ZONE_H,
  ZONE_GAP,
  NODE_RADIUS,
  MID_BOSS_IDX,
  MAIN_BOSS_IDX,
  getLocalNodePos,
  generateMockWorld,
} from './campaignWorldData';
import { CAMPAIGN_REGIONS } from '../../data/campaignConfig';
import {
  getStoredCampaignUser,
  hasCompletedRootCampaignNode,
  hasPremiumCampaignAccess,
  isRootCampaignNodeId,
} from '../../utils/campaignAccess';

const REGION_TO_ZONE_ID = {
  1: 'array_archipelago',
  2: 'string_shores',
  3: 'loop_lagoon',
  4: 'sliding_window_sanctum',
  5: 'hashmap_highlands',
  6: 'stack_queue_quarry',
  7: 'tree_tundra',
  8: 'linked_labyrinth',
  9: 'winter_carnival',
  10: 'desert_dunes',
  Array_Archipelago: 'array_archipelago',
  String_Shores: 'string_shores',
  Loop_Lagoon: 'loop_lagoon',
  Sliding_Window_Sanctum: 'sliding_window_sanctum',
  HashMap_Highlands: 'hashmap_highlands',
  Stack_Queue_Quarry: 'stack_queue_quarry',
  Tree_Territory: 'tree_tundra',
  Graph_Gorge: 'graph_gorge',
  DP_Dungeon: 'dp_dungeon',
  11: 'graph_gorge',
  12: 'dp_dungeon',
  13: 'recursion_ruins',
  14: 'regex_rainforest',
  15: 'algorithm_alps',
};

const STAR_INDICES = [1, 2, 3];
const ROOT_NODE_ID = 'region-1-node-01';
const NODE_ID_PATTERN = /node-(\d+)$/i;

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

const resolveZoneId = (node) => {
  const regionValue = node?.campaignRegion ?? node?.regionOrder ?? node?.region;
  const normalizedNumericRegion = Number(regionValue);
  if (Number.isFinite(normalizedNumericRegion) && REGION_TO_ZONE_ID[normalizedNumericRegion]) {
    return REGION_TO_ZONE_ID[normalizedNumericRegion];
  }

  const raw = node?.zoneId || regionValue || '';
  if (CAMPAIGN_REGIONS.some((z) => z.key === raw || z.id === raw)) return raw;
  if (REGION_TO_ZONE_ID[raw]) return REGION_TO_ZONE_ID[raw];
  const lower = String(raw).toLowerCase().replace(/ /g, '_');
  const found = CAMPAIGN_REGIONS.find((z) => z.key === lower || z.key.includes(lower));
  return found ? found.key : null;
};

const parseNodeOrder = (node) => {
  const explicitOrder = Number(node?.nodeOrder ?? node?.nodeNum);
  if (Number.isFinite(explicitOrder) && explicitOrder > 0) {
    return explicitOrder;
  }

  const match = String(node?.campaignNodeId ?? node?.nodeId ?? '').match(NODE_ID_PATTERN);
  if (match) {
    return Number(match[1]);
  }

  return 1;
};

const matchesCampaignSlot = (node, currentRegionId, currentNodeId) =>
  String(node?.campaignRegion ?? node?.regionOrder ?? '') === String(currentRegionId) &&
  String(node?.campaignNodeId ?? node?.nodeId ?? '') === String(currentNodeId);

const getNodeTitle = (node) =>
  node?.problemId?.title ||
  node?.problem?.title ||
  node?.title ||
  'Unknown Challenge';

const isAbsoluteRootNode = (node) => {
  const regionOrder =
    node?.regionOrder ??
    (typeof node?.zoneIndex === 'number' ? node.zoneIndex + 1 : null);
  const nodeOrder =
    node?.nodeOrder ??
    node?.nodeNum ??
    (typeof node?.localIndex === 'number' ? node.localIndex + 1 : null);

  return node?.nodeId === ROOT_NODE_ID || (regionOrder === 1 && nodeOrder === 1);
};

const isZoneStartNode = (node) => {
  const nodeOrder =
    node?.nodeOrder ??
    node?.nodeNum ??
    (typeof node?.localIndex === 'number' ? node.localIndex + 1 : null);

  return nodeOrder === 1;
};

const getState = (node, completedSet, completedStarsById, previousZoneBossCompleted = false, isFirstNodeFallback = false) => {
  const nodeId = node?.nodeId;
  const prerequisites = Array.isArray(node?.prerequisites)
    ? node.prerequisites.filter(Boolean)
    : [];
  const isRootNode = isAbsoluteRootNode(node);

  if (!completedSet) {
    return isFirstNodeFallback || isRootNode ? { state: 'available' } : { state: 'locked' };
  }

  if (completedSet.has(nodeId)) {
    return {
      state: 'completed',
      starsAwarded: completedStarsById.get(nodeId) ?? 0,
    };
  }

  if (isFirstNodeFallback || isRootNode) return { state: 'available' };

  if (prerequisites.length > 0) {
    return prerequisites.every((prereq) => completedSet.has(prereq))
      ? { state: 'available' }
      : { state: 'locked' };
  }

  if (isZoneStartNode(node)) {
    return previousZoneBossCompleted ? { state: 'available' } : { state: 'locked' };
  }

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
  const { isDark } = useTheme();
  const isLocked = state.state === 'locked';
  const isAvail = state.state === 'available';
  const isDone = state.state === 'completed';
  const stars = state.starsAwarded || 0;
  const sz = NODE_RADIUS * 2;
  const brightAccent = mixColors(accent, '#0f172a', 0.24);
  const brightAccentSoft = withAlpha(brightAccent, 0.16);
  const brightAccentRing = withAlpha(brightAccent, 0.28);

  const border = isLocked ? (isDark ? '#374151' : '#94a3b8') : isDone ? '#f59e0b' : isDark ? accent : brightAccent;
  const bg = isDark
    ? (isLocked
      ? 'radial-gradient(circle,#0e1117,#070a0f)'
      : isDone
        ? `radial-gradient(circle at 35% 35%, ${['#2d1800', '#2d2200', '#1f1600'][Math.min(stars, 3) - 1] ?? '#2d1800'}, #080600)`
        : `radial-gradient(circle at 35% 35%, ${accent}28, ${accent}08)`)
    : (isLocked
      ? 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(226,232,240,0.98))'
      : isDone
        ? 'linear-gradient(180deg, rgba(255,251,235,0.99), rgba(253,230,138,0.88))'
        : `linear-gradient(180deg, rgba(255,255,255,0.99), ${withAlpha(accent, 0.18)})`);
  const glow = isLocked
    ? 'none'
    : isDone
      ? (isDark ? '0 0 16px #fbbf2470' : '0 14px 32px rgba(245, 158, 11, 0.22), 0 0 0 1px rgba(245, 158, 11, 0.14)')
      : (
        isDark
          ? `0 0 18px ${accent}65, 0 0 36px ${accent}25`
          : `0 16px 34px rgba(15, 23, 42, 0.12), 0 0 0 1px ${brightAccentSoft}, 0 0 0 7px rgba(255,255,255,0.82)`
      );

  const title = getNodeTitle(node) || `Node ${node.nodeNum ?? '?'}`;

  return (
    <div className="relative flex flex-col items-center gap-1" style={{ opacity: isLocked ? (isDark ? 0.45 : 0.72) : 1 }}>
      {isAvail && (
        <motion.div
          className="absolute rounded-full border-2 pointer-events-none"
          style={{
            width: sz + 18,
            height: sz + 18,
            borderColor: isDark ? `${accent}60` : brightAccentRing,
          }}
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
          <Lock size={14} className={isDark ? 'text-gray-700' : 'text-slate-400'} />
        ) : isDone ? (
          <div className="flex gap-0.5">
            {STAR_INDICES.map((i) => (
              <span key={i} style={{ fontSize: 9, color: i <= stars ? '#fbbf24' : isDark ? '#374151' : '#cbd5e1' }}>
                ★
              </span>
            ))}
          </div>
        ) : (
          <motion.div
            className="rounded-full"
            style={{
              width: 12,
              height: 12,
              background: isDark ? accent : brightAccent,
              boxShadow: isDark
                ? `0 0 10px ${accent}`
                : `0 0 0 5px ${withAlpha(brightAccent, 0.18)}, 0 0 16px ${withAlpha(brightAccent, 0.2)}`,
            }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
        )}
      </motion.div>

      <div
        className="px-2 py-0.5 rounded-full text-[8px] font-bold font-mono max-w-[76px] truncate text-center transition-colors"
        style={{
          background: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.93)',
          backdropFilter: 'blur(4px)',
          color: isLocked ? (isDark ? '#6b7280' : '#64748b') : isDone ? '#b45309' : isDark ? accent : brightAccent,
          border: `1px solid ${
            isLocked
              ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(100,116,139,0.22)')
              : isDone
                ? 'rgba(245,158,11,0.34)'
                : withAlpha(isDark ? accent : brightAccent, isDark ? 0.1 : 0.22)
          }`,
          boxShadow: isDark ? 'none' : '0 10px 22px rgba(15, 23, 42, 0.1)',
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
  isDark,
}) {
  const fx = fromLocal.x;
  const fy = zoneTop + fromLocal.y;
  const tx = toLocal.x;
  const ty = nextZoneTop + toLocal.y;
  const d = `M ${fx} ${fy} C ${fx} ${fy + 55} ${tx} ${ty - 55} ${tx} ${ty}`;

  return (
    <g>
      {lit && !isDark ? (
        <path
          d={d}
          fill="none"
          stroke={withAlpha(toColor, 0.22)}
          strokeWidth={8}
          strokeLinecap="round"
        />
      ) : null}
      <path
        d={d}
        fill="none"
        stroke={lit ? toColor : isDark ? '#1e293b' : '#94a3b8'}
        strokeWidth={lit ? 2.7 : 2}
        strokeOpacity={lit ? (isDark ? 0.7 : 0.88) : (isDark ? 0.4 : 0.9)}
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
    if (isAbsoluteRootNode(node) && nodeState.state === 'locked') {
      return { ...nodeState, state: 'available' };
    }

    return nodeState;
  }, [node, nodeState]);
  const isInteractive =
    !node.isPlaceholder &&
    node.hasProblemData !== false &&
    effectiveNodeState.state !== 'locked';
  const canShowMissingDataToast =
    !isInteractive &&
    (effectiveNodeState.state === 'available' || effectiveNodeState.state === 'completed');

  const handleClick = useCallback(() => {
    if (isInteractive) {
      onNodeClick(node);
      return;
    }

    if (canShowMissingDataToast) {
      toast.error('Challenge data not yet deployed to this region.');
    }
  }, [canShowMissingDataToast, isInteractive, node, onNodeClick]);

  return (
    <div
      className="absolute pointer-events-auto"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%,-50%)',
        zIndex: isBoss ? 30 : 20,
        touchAction: 'manipulation',
        cursor: isInteractive || canShowMissingDataToast ? 'pointer' : 'not-allowed',
      }}
      onClick={handleClick}
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

const ZoneProgressButton = React.memo(function ZoneProgressButton({ zone, done, total, zoneTop, onJump, isDark }) {
  const pct = Math.round((done / total) * 100);

  return (
    <button
      className="flex items-center gap-2 w-full text-left hover:opacity-100 transition-opacity pointer-events-auto"
      style={{ opacity: done === 0 && zone.index > 0 ? 0.4 : 0.85 }}
      onClick={() => onJump(zoneTop)}
    >
      <span className="text-xs select-none">{zone.icon}</span>
      <div className="flex-1 min-w-0">
        <div className={`text-[9px] font-bold truncate max-w-[100px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
          {zone.name}
        </div>
        <div className="h-1 rounded-full mt-0.5" style={{ background: isDark ? '#1e293b' : '#e2e8f0' }}>
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
  const { isDark } = useTheme();
  const scrollRef = useRef(null);
  const { width: viewportWidth, height: viewportHeight } = useRafViewport();
  const [isZoneListOpen, setIsZoneListOpen] = useState(false);

  const allNodes = useMemo(
    () => (nodes.length > 0 || !useMockData ? nodes : generateMockWorld()),
    [nodes, useMockData]
  );
  const isMobile = viewportWidth < 640;

  const nodesByZone = useMemo(() => {
    const map = {};
    CAMPAIGN_REGIONS.forEach((zone) => {
      map[zone.key] = [];
    });

    allNodes.forEach((node) => {
      const zoneId = resolveZoneId(node);
      if (!zoneId || !map[zoneId]) return;

      const sequenceNum = parseNodeOrder(node);
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

    CAMPAIGN_REGIONS.forEach((zone, zoneIndex) => {
      const zoneNodes = nodesByZone[zone.key] ?? [];

      map[zone.key] = Array.from({ length: 15 }, (_, nodeIndex) => {
        const currentRegionId = zone.id;
        const currentNodeId = `region-${currentRegionId}-node-${String(nodeIndex + 1).padStart(2, '0')}`;
        const found =
          zoneNodes.find((node) => matchesCampaignSlot(node, currentRegionId, currentNodeId)) ??
          zoneNodes.find((node) => node?.nodeNum === nodeIndex + 1 || node?.localIndex === nodeIndex);

        return found ?? {
          nodeId: `${zone.key}_${nodeIndex + 1}_locked`,
          campaignNodeId: currentNodeId,
          nodeNum: nodeIndex + 1,
          nodeOrder: nodeIndex + 1,
          localIndex: nodeIndex,
          nodeType: nodeIndex === MID_BOSS_IDX || nodeIndex === MAIN_BOSS_IDX ? 'boss' : 'standard',
          bossType: nodeIndex === MID_BOSS_IDX ? 'mid' : nodeIndex === MAIN_BOSS_IDX ? 'main' : null,
          region: zone.key,
          campaignRegion: currentRegionId,
          regionOrder: currentRegionId,
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
    const firstZoneFirstNodeId = displayNodesByZone[CAMPAIGN_REGIONS[0]?.key]?.[0]?.nodeId ?? null;
    const unlockedIds = progress?.unlockedNodes ?? [];
    const allIds = new Set(allNodes.map((node) => node.nodeId).filter(Boolean));
    const mockIdMismatch = unlockedIds.length > 0 && !unlockedIds.some((id) => allIds.has(id));
    const completedSet = new Set(progress?.completedNodes?.map((entry) => entry.nodeId) ?? []);
    const completedStarsById = new Map(
      (progress?.completedNodes ?? []).map((entry) => [entry.nodeId, entry.starsAwarded ?? 0])
    );

    CAMPAIGN_REGIONS.forEach((zone, zoneIndex) => {
      const zoneNodes = displayNodesByZone[zone.key] ?? [];
      const previousZone = zoneIndex > 0 ? CAMPAIGN_REGIONS[zoneIndex - 1] : null;
      const previousZoneBossNode = previousZone
        ? (displayNodesByZone[previousZone.key] ?? []).find((node) => node.nodeNum === 15)
        : null;
      const previousZoneBossCompleted = previousZoneBossNode
        ? completedSet.has(previousZoneBossNode.nodeId)
        : false;

      zoneNodes.forEach((node) => {
        const isFirstNodeFallback =
          mockIdMismatch &&
          zoneIndex === 0 &&
          node.nodeId === firstZoneFirstNodeId &&
          node.hasProblemData !== false;

        stateMap[node.nodeId] = node.isPlaceholder || node.hasProblemData === false
          ? { state: 'locked', starsAwarded: 0 }
          : getState(
            node,
            completedSet,
            completedStarsById,
            previousZoneBossCompleted,
            isFirstNodeFallback
          );
      });
    });

    return stateMap;
  }, [allNodes, displayNodesByZone, progress]);

  const completedSet = useMemo(
    () => new Set(progress?.completedNodes?.map((entry) => entry.nodeId) ?? []),
    [progress]
  );

  const zoneTops = useMemo(
    () => CAMPAIGN_REGIONS.map((_, index) => index * (ZONE_H + ZONE_GAP)),
    []
  );

  const canvasH = CAMPAIGN_REGIONS.length * (ZONE_H + ZONE_GAP);

  const mapScale = useMemo(() => {
    const safePadding = viewportWidth < 640 ? 20 : viewportWidth < 1024 ? 48 : 80;
    const widthLimited = (viewportWidth - safePadding) / ZONE_W;
    const heightLimited = viewportHeight < 720 ? 0.92 : viewportHeight < 900 ? 0.98 : 1;
    const baseScale = Math.min(1, widthLimited, heightLimited);

    if (viewportWidth < 400) {
      return Math.max(0.44, baseScale);
    }

    if (viewportWidth < 640) {
      return Math.max(0.5, Math.min(baseScale, 0.64));
    }

    return Math.max(0.72, baseScale);
  }, [viewportHeight, viewportWidth]);

  const scaledCanvasHeight = canvasH * mapScale;

  const scrollToOffset = useCallback((top) => {
    scrollRef.current?.scrollTo({
      top: Math.max(0, top - 80),
      behavior: 'smooth',
    });
  }, []);

  const jumpToProgress = useCallback(() => {
    const firstAvailableZoneIndex = CAMPAIGN_REGIONS.findIndex((zone) => {
      const zoneNodes = displayNodesByZone[zone.key] ?? [];
      return zoneNodes.some((node) => nodeStateById[node.nodeId]?.state === 'available');
    });

    scrollToOffset(zoneTops[Math.max(0, firstAvailableZoneIndex)] ?? 0);
    setIsZoneListOpen(false);
  }, [displayNodesByZone, nodeStateById, scrollToOffset, zoneTops]);

  const handleJumpToZone = useCallback((top) => {
    scrollToOffset(top);
    setIsZoneListOpen(false);
  }, [scrollToOffset]);

  useEffect(() => {
    if (!isMobile) {
      setIsZoneListOpen(false);
    }
  }, [isMobile]);

  const bridgeFrom = useMemo(() => getLocalNodePos(14), []);
  const bridgeTo = useMemo(() => getLocalNodePos(0), []);

  return (
    <div
      className="relative w-full h-full overflow-hidden transition-colors duration-500"
      style={{ background: isDark ? '#020408' : 'linear-gradient(180deg, #f8fbff 0%, #eef6fb 48%, #f8fafc 100%)' }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 80 }, (_, index) => (
          <div
            key={index}
            className={`absolute rounded-full ${isDark ? 'bg-white' : 'bg-cyan-600'}`}
            style={{
              width: index % 5 < 2 ? 1.5 : 0.8,
              height: index % 5 < 2 ? 1.5 : 0.8,
              left: `${(index * 137.5) % 100}%`,
              top: `${(index * 97.3) % 100}%`,
              opacity: isDark ? (index % 3 === 0 ? 0.5 : 0.15) : (index % 3 === 0 ? 0.2 : 0.08),
            }}
          />
        ))}
        {!isDark ? (
          <>
            <div className="absolute inset-x-20 top-6 h-24 rounded-full blur-3xl bg-white/80" />
            <div className="absolute left-10 top-14 h-20 w-20 rounded-full bg-emerald-100/55 blur-3xl" />
            <div className="absolute right-10 top-28 h-24 w-24 rounded-full bg-sky-100/50 blur-3xl" />
          </>
        ) : null}
      </div>

      <div
        ref={scrollRef}
        data-campaign-scroll
        className="absolute inset-0 overflow-y-auto"
        style={{
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          contain: 'layout paint style',
          willChange: 'transform',
        }}
      >
        <div
          className="relative mx-auto"
          style={{
            width: ZONE_W,
            height: scaledCanvasHeight,
            transform: `translate3d(0,0,0) scale(${mapScale})`,
            transformOrigin: 'top center',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            
          }}
        >
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: ZONE_W, height: canvasH, zIndex: 15, overflow: 'visible' }}
          >
            {CAMPAIGN_REGIONS.slice(0, -1).map((zone, zoneIndex) => {
              const nextZone = CAMPAIGN_REGIONS[zoneIndex + 1];
              const zoneNodes = displayNodesByZone[zone.key] ?? [];
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
                  isDark={isDark}
                />
              );
            })}
          </svg>

          {CAMPAIGN_REGIONS.map((zone, zoneIndex) => {
            const zoneNodes = displayNodesByZone[zone.key] ?? [];
            const zoneTop = zoneTops[zoneIndex];

            return (
              <div
                key={zone.key}
                className="absolute"
                style={{
                  left: 0,
                  top: zoneTop,
                  width: ZONE_W,
                  height: ZONE_H,
                  zIndex: 10,
                  transform: 'translateZ(0)',
                  contentVisibility: 'auto',
                  containIntrinsicSize: `${ZONE_H}px ${ZONE_W}px`,
                }}
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

      <div className="absolute top-3 right-3 z-50 pointer-events-none flex flex-col items-end gap-2 w-[min(46vw,248px)] sm:w-auto">
        {isMobile ? (
          <>
            <button
              onClick={() => setIsZoneListOpen((open) => !open)}
              className="pointer-events-auto rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] backdrop-blur-md transition-all"
              style={{
                background: isDark ? 'rgba(6,8,16,0.88)' : 'rgba(255,255,255,0.92)',
                borderColor: isDark ? 'rgba(71,85,105,0.42)' : 'rgba(148,163,184,0.28)',
                color: isDark ? '#cbd5e1' : '#334155',
                boxShadow: '0 10px 28px rgba(15, 23, 42, 0.18)',
              }}
            >
              {isZoneListOpen ? 'Hide Zones' : 'Zones'}
            </button>

            {isZoneListOpen ? (
              <div className="pointer-events-auto w-full bg-white/92 dark:bg-[#060810]/90 border border-gray-200 dark:border-gray-800/40 rounded-2xl px-2.5 py-2 space-y-1.5 max-h-[38dvh] overflow-auto backdrop-blur-md shadow-lg dark:shadow-none">
                <p className="text-[9px] text-slate-400 dark:text-gray-600 font-bold uppercase tracking-widest mb-1">
                  Zones
                </p>
                {CAMPAIGN_REGIONS.map((zone, index) => {
                  const zoneNodes = displayNodesByZone[zone.key] ?? [];
                  const done = zoneNodes.filter((node) => completedSet.has(node.nodeId)).length;
                  const total = zoneNodes.length || 15;

                  return (
                    <ZoneProgressButton
                      key={zone.key}
                      zone={{ ...zone, index }}
                      done={done}
                      total={total}
                      zoneTop={zoneTops[index]}
                      onJump={handleJumpToZone}
                      isDark={isDark}
                    />
                  );
                })}
              </div>
            ) : null}
          </>
        ) : (
          <div className="bg-white/90 dark:bg-[#060810]/85 border border-gray-200 dark:border-gray-800/40 rounded-xl px-2.5 py-2 space-y-1 max-h-[42vh] overflow-auto backdrop-blur-md sm:px-3 sm:max-h-60 transition-all shadow-lg dark:shadow-none">
            <p className="text-[9px] text-slate-400 dark:text-gray-600 font-bold uppercase tracking-widest mb-1.5">
              Zones
            </p>
            {CAMPAIGN_REGIONS.map((zone, index) => {
              const zoneNodes = displayNodesByZone[zone.key] ?? [];
              const done = zoneNodes.filter((node) => completedSet.has(node.nodeId)).length;
              const total = zoneNodes.length || 15;

              return (
                <ZoneProgressButton
                  key={zone.key}
                  zone={{ ...zone, index }}
                  done={done}
                  total={total}
                  zoneTop={zoneTops[index]}
                  onJump={handleJumpToZone}
                  isDark={isDark}
                />
              );
            })}
          </div>
        )}
      </div>

      <div className="absolute bottom-3 left-3 z-50 flex flex-col items-start gap-3 pointer-events-none sm:bottom-5 sm:left-5 sm:gap-4">
        <div className="pointer-events-none bg-white/90 dark:bg-[#060810]/85 border border-gray-200 dark:border-gray-800/50 rounded-xl px-2.5 py-2 backdrop-blur-md hidden md:block shadow-lg dark:shadow-none transition-all">
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
                  background: withAlpha(item.col, 0.15),
                  boxShadow: isDark ? `0 0 6px ${withAlpha(item.col, 0.32)}` : '0 8px 14px rgba(15, 23, 42, 0.06)',
                }}
              />
              <span className={`text-[9px] font-medium ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>{item.label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={jumpToProgress}
          className="pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-lg dark:shadow-none sm:px-3.5 sm:py-2.5"
          style={{
            background: isDark ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.92)',
            border: `1px solid ${isDark ? 'rgba(34,211,238,0.30)' : 'rgba(103, 165, 213, 0.28)'}`,
            color: isDark ? '#22d3ee' : '#2563eb',
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

const WorldMap = ({ nodes = [], progress, onStartChallenge, onTeaserTrigger, useMockData = true }) => {
  const [selectedNode, setSelectedNode] = useState(null);

  const handleNodeClick = useCallback((node) => {
    const user = getStoredCampaignUser();
    const isRootNode = isRootCampaignNodeId(node?.nodeId) || isRootCampaignNodeId(node?.campaignNodeId);
    const hasTrialLock = !hasPremiumCampaignAccess(user) && hasCompletedRootCampaignNode(progress);

    if (hasTrialLock) {
      if (onTeaserTrigger) onTeaserTrigger();
      return;
    }

    if (!hasPremiumCampaignAccess(user) && !isRootNode) {
      if (onTeaserTrigger) onTeaserTrigger();
      return;
    }

    setSelectedNode(node);
  }, [onTeaserTrigger, progress]);

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

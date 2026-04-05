// src/hooks/useCampaignProgress.js
// Strict linear progression engine.
// Works with real API data OR the built-in mock progress below.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import { ZONES } from '../data/campaignData';

// ── Mock progress object (replace with real API data in production) ───────────
// Keys are nodeIds, values: { stars: 1|2|3, completedAt: ISO-string }
export const MOCK_PROGRESS = {
  // Zone 1 — user completed first 5 nodes
  aa_01: { stars: 3, completedAt: '2025-01-01T10:00:00Z' },
  aa_02: { stars: 2, completedAt: '2025-01-01T10:30:00Z' },
  aa_03: { stars: 3, completedAt: '2025-01-01T11:00:00Z' },
  aa_04: { stars: 1, completedAt: '2025-01-01T11:30:00Z' },
  aa_05: { stars: 2, completedAt: '2025-01-01T12:00:00Z' },
  // aa_06 is "Available" (next to unlock), everything after is locked
};

// ── Node state derivation ─────────────────────────────────────────────────────
// Returns 'completed' | 'available' | 'locked'
const deriveNodeState = (node, zoneIndex, nodeIndex, completedMap) => {
  const nodeId = node.nodeId;

  // Already completed
  if (completedMap[nodeId]) return 'completed';

  // Zone 1, Node 1 is always available to start
  if (zoneIndex === 0 && nodeIndex === 0) return 'available';

  // For zone N > 0, node 0 is only available if zone N-1's boss (node 15) is done
  if (nodeIndex === 0 && zoneIndex > 0) {
    const prevZone     = ZONES[zoneIndex - 1];
    const prevZoneBoss = prevZone.nodes[prevZone.nodes.length - 1];
    return completedMap[prevZoneBoss.nodeId] ? 'available' : 'locked';
  }

  // All other nodes: available iff the previous node in this zone is completed
  const prevNode = ZONES[zoneIndex].nodes[nodeIndex - 1];
  return completedMap[prevNode.nodeId] ? 'available' : 'locked';
};

// Normalizes either:
// 1) mock map shape: { [nodeId]: { stars, completedAt } }
// 2) backend API shape: { completedNodes:[], unlockedNodes:[] }
const normalizeCompletedMap = (externalProgress) => {
  if (!externalProgress) return MOCK_PROGRESS;

  if (Array.isArray(externalProgress.completedNodes)) {
    return externalProgress.completedNodes.reduce((acc, entry) => {
      if (!entry?.nodeId) return acc;
      acc[entry.nodeId] = {
        stars: entry.starsAwarded ?? entry.stars ?? 0,
        completedAt: entry.completedAt ?? null,
      };
      return acc;
    }, {});
  }

  return externalProgress;
};

// ── Main hook ─────────────────────────────────────────────────────────────────
export const useCampaignProgress = (externalProgress = null) => {
  const completedMap = useMemo(
    () => normalizeCompletedMap(externalProgress),
    [externalProgress]
  );

  const unlockedSet = useMemo(() => {
    if (Array.isArray(externalProgress?.unlockedNodes)) {
      return new Set(externalProgress.unlockedNodes);
    }
    return null;
  }, [externalProgress]);

  // Build enriched node list with state, once per progress update
  const enrichedZones = useMemo(() => {
    return ZONES.map((zone, zIdx) => {
      const nodes = zone.nodes.map((node, nIdx) => {
        const state = unlockedSet
          ? (completedMap[node.nodeId]
              ? 'completed'
              : unlockedSet.has(node.nodeId)
                ? 'available'
                : 'locked')
          : deriveNodeState(node, zIdx, nIdx, completedMap);
        const completion = completedMap[node.nodeId] ?? null;
        return {
          ...node,
          state,
          stars:        completion?.stars ?? 0,
          completedAt:  completion?.completedAt ?? null,
        };
      });

      // Zone is "unlocked" if its first node is available or any node is done
      const isZoneLocked = nodes[0].state === 'locked';
      const completedCount = nodes.filter(n => n.state === 'completed').length;
      const progressPct    = Math.round((completedCount / nodes.length) * 100);

      return { ...zone, nodes, isZoneLocked, completedCount, progressPct };
    });
  }, [completedMap, unlockedSet]);

  // Flat enriched node lookup
  const nodeMap = useMemo(() => {
    const m = {};
    enrichedZones.forEach(z => z.nodes.forEach(n => { m[n.nodeId] = n; }));
    return m;
  }, [enrichedZones]);

  // Stats
  const totalCompleted = useMemo(
    () => Object.keys(completedMap).length,
    [completedMap]
  );
  const totalKP = useMemo(
    () => Object.entries(completedMap).reduce((sum, [nodeId, data]) => {
      const node = nodeMap[nodeId];
      if (!node) return sum;
      const kpMap = { 1: node.rewards.oneStarKP, 2: node.rewards.twoStarKP, 3: node.rewards.threeStarKP };
      return sum + (kpMap[data.stars] ?? 0);
    }, 0),
    [completedMap, nodeMap]
  );

  return { enrichedZones, nodeMap, totalCompleted, totalKP };
};

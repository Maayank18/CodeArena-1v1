import Problem from '../models/Problem.js';

export const DEFAULT_ENTRY_NODE_ID = 'region-1-node-01';
const DEFAULT_ROOT_FILTER = {
    type: 'campaign',
    $or: [
        { campaignNodeId: DEFAULT_ENTRY_NODE_ID },
        { campaignRegion: 1, campaignNodeId: /^region-1-node-0?1$/i },
    ],
};

export const isAbsoluteCampaignRoot = (node) =>
    node?.nodeId === DEFAULT_ENTRY_NODE_ID ||
    node?.campaignNodeId === DEFAULT_ENTRY_NODE_ID ||
    ((node?.regionOrder === 1 || node?.campaignRegion === 1) &&
        (node?.nodeOrder === 1 || node?.campaignNodeId === DEFAULT_ENTRY_NODE_ID));

export const getEntryNodes = async () => {
    return Problem.find(DEFAULT_ROOT_FILTER)
        .select('campaignNodeId campaignRegion')
        .sort({ campaignRegion: 1, campaignNodeId: 1 })
        .lean();
};

export const getEntryNodeIds = async () => {
    const entryNodes = await getEntryNodes();
    const entryIds = entryNodes
        .map((node) => node?.campaignNodeId ?? node?.nodeId)
        .filter(Boolean);

    return entryIds.length > 0 ? [...new Set(entryIds)] : [DEFAULT_ENTRY_NODE_ID];
};

export const ensureEntryNodesUnlocked = (progressLike, entryNodeIds) => {
    const currentUnlocked = Array.isArray(progressLike?.unlockedNodes)
        ? progressLike.unlockedNodes.filter(Boolean)
        : [];

    const mergedUnlocked = [...new Set([...entryNodeIds, ...currentUnlocked])];
    const changed =
        mergedUnlocked.length !== currentUnlocked.length ||
        mergedUnlocked.some((nodeId, index) => nodeId !== currentUnlocked[index]);

    if (progressLike) {
        progressLike.unlockedNodes = mergedUnlocked;
    }

    return { changed, unlockedNodes: mergedUnlocked };
};

export const isEntryNode = (node) =>
    isAbsoluteCampaignRoot(node);

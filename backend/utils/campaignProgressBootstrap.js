import CampaignMap from '../models/CampaignMap.js';

export const DEFAULT_ENTRY_NODE_ID = 'aa_01';

export const getEntryNodes = async () => {
    return CampaignMap.find({
        isActive: true,
        $or: [
            { isEntryNode: true },
            { prerequisites: { $size: 0 } },
            { nodeOrder: 1 },
        ],
    })
        .sort({ regionOrder: 1, nodeOrder: 1 })
        .lean();
};

export const getEntryNodeIds = async () => {
    const entryNodes = await getEntryNodes();
    const entryIds = entryNodes
        .map((node) => node?.nodeId)
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
    Boolean(node?.isEntryNode) ||
    (Array.isArray(node?.prerequisites) && node.prerequisites.length === 0) ||
    node?.nodeOrder === 1;

export const CAMPAIGN_PLAN_TIERS = {
    free: 0,
    plus: 1,
    pro: 2,
    premium: 3,
};

export const ROOT_CAMPAIGN_NODE_ID = 'region-1-node-01';

export const getStoredCampaignUser = () => {
    try {
        return JSON.parse(localStorage.getItem('codearena_user') || '{}');
    } catch {
        return {};
    }
};

export const getCampaignPlanTier = (user) => {
    const plan = user?.subscriptionPlan?.toLowerCase() || 'free';
    return CAMPAIGN_PLAN_TIERS[plan] ?? 0;
};

export const isCampaignAdmin = (user) => (user?.role?.toLowerCase() || 'user') === 'admin';

export const hasPremiumCampaignAccess = (user) =>
    isCampaignAdmin(user) || getCampaignPlanTier(user) >= CAMPAIGN_PLAN_TIERS.premium;

export const isRootCampaignNodeId = (nodeId) =>
    String(nodeId ?? '').trim() === ROOT_CAMPAIGN_NODE_ID;

export const hasCompletedRootCampaignNode = (progress) =>
    Array.isArray(progress?.completedNodes) &&
    progress.completedNodes.some((entry) => isRootCampaignNodeId(entry?.nodeId));

export const shouldLockCampaignAfterTrial = (user, progress) =>
    !hasPremiumCampaignAccess(user) && hasCompletedRootCampaignNode(progress);

// Version-2.0
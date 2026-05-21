// FILE: frontend/src/utils/badgeHelper.js
// Frontend badge lookup helpers.

import { normalizeBadgeKey } from './badgeAssets';
import { BADGE_DEFINITIONS } from './badgeCatalog';

export { BADGE_DEFINITIONS, GLOW_MAP, CATEGORIES } from './badgeCatalog';

const BADGE_LOOKUP = BADGE_DEFINITIONS.reduce((lookup, badge) => {
  [badge.id, badge.name, badge.assetName]
    .filter(Boolean)
    .forEach((candidate) => {
      lookup.set(normalizeBadgeKey(candidate), badge);
    });

  return lookup;
}, new Map([
  ['blitzkreign', BADGE_DEFINITIONS.find((badge) => badge.id === 'blitzkrieg')],
]));

export const getBadgeIconData = (badgeId) => {
  return BADGE_LOOKUP.get(normalizeBadgeKey(badgeId)) || null;
};

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BADGE_DEFINITIONS } from '../src/utils/badgeCatalog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.resolve(__dirname, '../src/assets/badges');

const palettes = {
  amber: { start: '#f59e0b', end: '#f97316', accent: '#fde68a', glow: 'rgba(245, 158, 11, 0.45)' },
  blue: { start: '#3b82f6', end: '#1d4ed8', accent: '#bfdbfe', glow: 'rgba(59, 130, 246, 0.45)' },
  cyan: { start: '#22d3ee', end: '#2563eb', accent: '#cffafe', glow: 'rgba(34, 211, 238, 0.42)' },
  emerald: { start: '#34d399', end: '#059669', accent: '#d1fae5', glow: 'rgba(16, 185, 129, 0.4)' },
  fuchsia: { start: '#d946ef', end: '#a21caf', accent: '#fae8ff', glow: 'rgba(217, 70, 239, 0.4)' },
  green: { start: '#4ade80', end: '#15803d', accent: '#dcfce7', glow: 'rgba(74, 222, 128, 0.4)' },
  indigo: { start: '#6366f1', end: '#4338ca', accent: '#e0e7ff', glow: 'rgba(99, 102, 241, 0.42)' },
  lime: { start: '#84cc16', end: '#65a30d', accent: '#ecfccb', glow: 'rgba(132, 204, 22, 0.4)' },
  orange: { start: '#f97316', end: '#dc2626', accent: '#fed7aa', glow: 'rgba(249, 115, 22, 0.42)' },
  pink: { start: '#ec4899', end: '#be185d', accent: '#fce7f3', glow: 'rgba(236, 72, 153, 0.42)' },
  purple: { start: '#a855f7', end: '#7c3aed', accent: '#f3e8ff', glow: 'rgba(168, 85, 247, 0.4)' },
  red: { start: '#ef4444', end: '#b91c1c', accent: '#fecaca', glow: 'rgba(239, 68, 68, 0.4)' },
  rose: { start: '#fb7185', end: '#be123c', accent: '#ffe4e6', glow: 'rgba(251, 113, 133, 0.4)' },
  sky: { start: '#38bdf8', end: '#0284c7', accent: '#e0f2fe', glow: 'rgba(56, 189, 248, 0.42)' },
  slate: { start: '#64748b', end: '#0f172a', accent: '#e2e8f0', glow: 'rgba(148, 163, 184, 0.38)' },
  teal: { start: '#2dd4bf', end: '#0f766e', accent: '#ccfbf1', glow: 'rgba(45, 212, 191, 0.4)' },
  violet: { start: '#8b5cf6', end: '#6d28d9', accent: '#ede9fe', glow: 'rgba(139, 92, 246, 0.4)' },
  yellow: { start: '#facc15', end: '#f59e0b', accent: '#fef9c3', glow: 'rgba(250, 204, 21, 0.42)' },
};

const rarityRing = {
  Common: '#94a3b8',
  Uncommon: '#4ade80',
  Rare: '#60a5fa',
  Epic: '#c084fc',
  Legendary: '#fbbf24',
};

const emblems = {
  campaign: '<path d="M286 124l80 18-38 58 40 58-82 16-64 58-20-78-76-30 62-44 10-82 56 52 32-26z" fill="url(#accentGradient)" opacity="0.96"/><path d="M178 162c40 12 68 46 78 88" stroke="#fff9" stroke-width="16" stroke-linecap="round"/><path d="M212 250c20-20 44-34 74-42" stroke="#fff9" stroke-width="14" stroke-linecap="round"/>',
  combat: '<path d="M186 126l42 42-26 26 50 50 26-26 42 42-22 22-42-42-28 28-50-50 28-28-42-42 22-22zm152 0l22 22-42 42 28 28-50 50-28-28-42 42-22-22 42-42 26 26 50-50-26-26 42-42z" fill="url(#accentGradient)" opacity="0.96"/>',
  consistency: '<path d="M152 160c0-26 22-48 48-48h112c26 0 48 22 48 48v92c0 44-36 80-80 80s-80-36-80-80v-92z" fill="url(#accentGradient)" opacity="0.95"/><path d="M188 126v46M324 126v46M194 206h124M194 246h86" stroke="#fff9" stroke-width="16" stroke-linecap="round"/>',
  mastery: '<path d="M256 110l38 86 92 10-68 60 20 92-82-48-82 48 20-92-68-60 92-10 38-86z" fill="url(#accentGradient)" opacity="0.96"/><path d="M214 246l28 28 56-68" stroke="#fff9" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>',
  speed: '<path d="M292 100l-104 130h54l-22 112 104-134h-58l26-108z" fill="url(#accentGradient)" opacity="0.98"/><path d="M152 314c48 14 160 14 208 0" stroke="#fff7" stroke-width="14" stroke-linecap="round"/>',
};

const escapeText = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const initialsFromName = (name = '') => {
  const parts = String(name).split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
};

const buildSvg = (badge) => {
  const palette = palettes[badge.glow] || palettes.cyan;
  const ring = rarityRing[badge.rarity] || rarityRing.Rare;
  const emblem = emblems[String(badge.category || 'mastery').toLowerCase()] || emblems.mastery;
  const title = escapeText((badge.name || badge.id).toUpperCase());
  const subtitle = escapeText((badge.rarity || 'Rare').toUpperCase());
  const initials = escapeText(initialsFromName(badge.name || badge.id));

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="coreGradient" x1="92" y1="72" x2="404" y2="436" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${palette.start}"/>
      <stop offset="1" stop-color="${palette.end}"/>
    </linearGradient>
    <linearGradient id="accentGradient" x1="138" y1="112" x2="352" y2="338" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="${palette.accent}"/>
    </linearGradient>
    <radialGradient id="surfaceGlow" cx="0" cy="0" r="1" gradientTransform="translate(256 186) rotate(90) scale(208)">
      <stop offset="0" stop-color="${palette.glow}"/>
      <stop offset="1" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="18" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="512" height="512" rx="132" fill="#06070a"/>
  <rect x="42" y="42" width="428" height="428" rx="120" fill="#0b1220"/>
  <rect x="56" y="56" width="400" height="400" rx="108" fill="url(#surfaceGlow)" opacity="0.95"/>
  <rect x="78" y="78" width="356" height="356" rx="92" fill="url(#coreGradient)"/>
  <rect x="78" y="78" width="356" height="356" rx="92" fill="url(#surfaceGlow)" opacity="0.38"/>
  <rect x="90" y="90" width="332" height="332" rx="84" stroke="${ring}" stroke-width="10" opacity="0.9"/>
  <path d="M128 122c44-22 212-36 260 22" stroke="#ffffff20" stroke-width="18" stroke-linecap="round"/>
  <path d="M120 360c66 44 220 50 282-8" stroke="#00000028" stroke-width="22" stroke-linecap="round"/>
  <g filter="url(#softGlow)">
    ${emblem}
  </g>
  <g>
    <rect x="126" y="336" width="260" height="66" rx="33" fill="#050816cc" stroke="#ffffff22"/>
    <text x="256" y="364" text-anchor="middle" font-size="22" font-family="Inter,Segoe UI,sans-serif" font-weight="800" fill="#f8fafc" letter-spacing="2">${title}</text>
    <text x="256" y="388" text-anchor="middle" font-size="14" font-family="Inter,Segoe UI,sans-serif" font-weight="700" fill="${palette.accent}" letter-spacing="5">${subtitle}</text>
  </g>
  <circle cx="390" cy="132" r="38" fill="#07111dcc" stroke="#ffffff1f"/>
  <text x="390" y="146" text-anchor="middle" font-size="26" font-family="Inter,Segoe UI,sans-serif" font-weight="900" fill="${palette.accent}">${initials}</text>
</svg>`;
};

await fs.mkdir(outputDir, { recursive: true });

await Promise.all(
  BADGE_DEFINITIONS.map(async (badge) => {
    const base = String(badge.assetName || badge.id || 'badge').replace(/\.[^.]+$/, '');
    const filePath = path.join(outputDir, `${base}.svg`);
    await fs.writeFile(filePath, buildSvg(badge), 'utf8');
  })
);

console.log(`Generated ${BADGE_DEFINITIONS.length} badge assets in ${outputDir}`);

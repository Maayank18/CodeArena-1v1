import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import WeatherEffect from './WeatherEffect';
import {
  ZONE_W,
  ZONE_H,
  getLocalNodePos,
} from './campaignWorldData';

const GROUND_H_DESKTOP = 90;
const GROUND_H_MOBILE = 72;

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

const LIGHT_FACADE_BY_KEY = {
  array_archipelago: 'island',
  loop_lagoon: 'island',
  string_shores: 'shore',
  desert_dunes: 'shore',
  hashmap_highlands: 'shore',
  stack_queue_quarry: 'shore',
  regex_rainforest: 'rainforest',
  linked_labyrinth: 'rainforest',
  recursion_ruins: 'rainforest',
  sliding_window_sanctum: 'alps',
  algorithm_alps: 'alps',
  tree_tundra: 'alps',
  graph_gorge: 'canopy',
  winter_carnival: 'canopy',
  dp_dungeon: 'galaxy',
};

const LIGHT_FACADES = {
  island: {
    label: 'Island Adventure',
    surface: ['#f7fffd', '#d9f7f0', '#ade9dd'],
    rim: '#8dd7cb',
    idlePath: '#b7d8d1',
    title: '#244a47',
    caption: '#55756f',
    chipBg: 'rgba(255,255,255,0.82)',
    chipText: '#2f766e',
    deck: 'rgba(255,255,255,0.78)',
    deckBorder: 'rgba(45, 118, 110, 0.12)',
    cloud: 'rgba(255,255,255,0.82)',
    hillA: '#d9f2be',
    hillB: '#b9e895',
    hillC: '#8bd5a8',
  },
  shore: {
    label: 'Journey Path',
    surface: ['#fffdf6', '#f9efd2', '#f5dfb0'],
    rim: '#f0cb8a',
    idlePath: '#e4d2ae',
    title: '#5f4b2d',
    caption: '#8f7a59',
    chipBg: 'rgba(255,255,255,0.82)',
    chipText: '#b7791f',
    deck: 'rgba(255,255,255,0.8)',
    deckBorder: 'rgba(180, 122, 31, 0.12)',
    cloud: 'rgba(255,255,255,0.76)',
    hillA: '#f7e6af',
    hillB: '#f4d593',
    hillC: '#9dd9df',
  },
  rainforest: {
    label: 'Timeline Journey',
    surface: ['#fbf8ff', '#ece7ff', '#d8d0ff'],
    rim: '#c9befe',
    idlePath: '#d6cff5',
    title: '#4b3e79',
    caption: '#7a6ca7',
    chipBg: 'rgba(255,255,255,0.82)',
    chipText: '#7c5ce0',
    deck: 'rgba(255,255,255,0.82)',
    deckBorder: 'rgba(124, 92, 224, 0.12)',
    cloud: 'rgba(255,255,255,0.74)',
    hillA: '#efe8ff',
    hillB: '#ddd0ff',
    hillC: '#bfe4cf',
  },
  alps: {
    label: 'Mountain Climb',
    surface: ['#f8fdff', '#dff2ff', '#b9defa'],
    rim: '#9dccf3',
    idlePath: '#c3dcee',
    title: '#33526a',
    caption: '#63829a',
    chipBg: 'rgba(255,255,255,0.84)',
    chipText: '#4689c8',
    deck: 'rgba(255,255,255,0.82)',
    deckBorder: 'rgba(70, 137, 200, 0.12)',
    cloud: 'rgba(255,255,255,0.82)',
    hillA: '#cde8f7',
    hillB: '#a8d0ef',
    hillC: '#86c2d8',
  },
  canopy: {
    label: 'Constellation Map',
    surface: ['#fefff9', '#edf6d8', '#dceeb7'],
    rim: '#bfd995',
    idlePath: '#d2dfba',
    title: '#496231',
    caption: '#73895c',
    chipBg: 'rgba(255,255,255,0.84)',
    chipText: '#6c9b34',
    deck: 'rgba(255,255,255,0.84)',
    deckBorder: 'rgba(108, 155, 52, 0.12)',
    cloud: 'rgba(255,255,255,0.76)',
    hillA: '#eff7d7',
    hillB: '#d6ecae',
    hillC: '#b7d88b',
  },
  galaxy: {
    label: 'Space Odyssey',
    surface: ['#fcfdff', '#eef4ff', '#dce6fb'],
    rim: '#c6d7f6',
    idlePath: '#d7dfee',
    title: '#3d5777',
    caption: '#7388a2',
    chipBg: 'rgba(255,255,255,0.84)',
    chipText: '#5d7fb6',
    deck: 'rgba(255,255,255,0.82)',
    deckBorder: 'rgba(93, 127, 182, 0.12)',
    cloud: 'rgba(255,255,255,0.76)',
    hillA: '#edf3ff',
    hillB: '#dbe7fd',
    hillC: '#bfd3f1',
  },
};

const getLightFacade = (key) => LIGHT_FACADES[LIGHT_FACADE_BY_KEY[key] || 'island'];

const makeCloud = (left, top, width, height, opacity = 1) => ({
  left,
  top,
  width,
  height,
  opacity,
});

const makeHill = (left, top, width, height, from, to, rotate = 0, opacity = 0.9) => ({
  left,
  top,
  width,
  height,
  from,
  to,
  rotate,
  opacity,
});

const makeStroke = (left, top, width, height, color, rotate = 0, opacity = 0.5, blur = 0) => ({
  left,
  top,
  width,
  height,
  color,
  rotate,
  opacity,
  blur,
});

const makeGlyph = (glyph, left, bottom, size, delay = 0, rotate = 0, opacity = 0.82) => ({
  glyph,
  left,
  bottom,
  size,
  delay,
  rotate,
  opacity,
});

const makeDot = (left, top, size, color, delay = 0, opacity = 0.8, blur = 0) => ({
  left,
  top,
  size,
  color,
  delay,
  opacity,
  blur,
});

const makePeak = (left, bottom, width, height, from, to, opacity = 0.88, blur = 0) => ({
  left,
  bottom,
  width,
  height,
  from,
  to,
  opacity,
  blur,
});

const makeColumn = (left, bottom, width, height, color, rotate = 0, opacity = 0.72, radius = '999px 999px 0 0') => ({
  left,
  bottom,
  width,
  height,
  color,
  rotate,
  opacity,
  radius,
});

const makeMotif = (type, left, bottom, width, height, options = {}) => ({
  type,
  left,
  bottom,
  width,
  height,
  ...options,
});

const getDarkScene = (key, accent, bgGrad = [], border, ground) => {
  const skyTop = bgGrad[0] || '#030712';
  const skyMid = bgGrad[1] || '#0f172a';
  const skyBase = bgGrad[2] || '#111827';
  const accentGlow = withAlpha(accent, 0.18);
  const accentSoft = withAlpha(accent, 0.1);
  const borderSoft = withAlpha(border || accent, 0.28);
  const moonGlow = withAlpha('#ffffff', 0.08);
  const deepGround = mixColors(ground || skyBase, '#020617', 0.42);
  const softGround = mixColors(ground || skyMid, accent, 0.08);
  const forestDark = mixColors('#14532d', skyBase, 0.48);
  const seaDark = mixColors('#0f766e', skyBase, 0.62);
  const amberDark = mixColors('#f59e0b', skyBase, 0.72);
  const violetDark = mixColors('#7c3aed', skyBase, 0.62);
  const frostDark = mixColors('#93c5fd', skyBase, 0.68);

  switch (key) {
    case 'array_archipelago':
      return {
        weatherOpacity: 0.9,
        cardBackground: `linear-gradient(180deg, ${skyTop} 0%, ${mixColors(skyMid, '#083344', 0.28)} 54%, ${mixColors(skyBase, '#020617', 0.22)} 100%)`,
        bodyOverlay: `radial-gradient(ellipse 78% 44% at 50% 20%, ${withAlpha('#34d399', 0.12)}, transparent 68%), radial-gradient(circle at 80% 18%, ${withAlpha('#67e8f9', 0.12)}, transparent 24%)`,
        ground: `linear-gradient(180deg, ${mixColors('#14532d', accent, 0.14)} 0%, ${forestDark} 100%)`,
        moon: { right: '13%', top: '10%', size: 22, color: 'rgba(245, 253, 255, 0.92)', ring: moonGlow },
        stars: [
          makeDot('10%', '12%', 2, '#d1fae5', 0, 0.8, 0),
          makeDot('22%', '18%', 1.5, '#a7f3d0', 0.8, 0.6, 0),
          makeDot('34%', '9%', 2.4, '#67e8f9', 1.2, 0.85, 2),
          makeDot('72%', '16%', 1.8, '#e0f2fe', 0.3, 0.7, 0),
          makeDot('84%', '24%', 2.2, '#bbf7d0', 1.1, 0.82, 2),
        ],
        bands: [
          makeStroke('58%', '73%', 150, 12, withAlpha('#67e8f9', 0.2), -1, 0.8, 6),
          makeStroke('60%', '76%', 132, 6, withAlpha('#ffffff', 0.3), -1, 0.7, 1),
        ],
        hills: [
          makeHill('-3%', '36%', 126, 82, mixColors('#166534', accent, 0.1), deepGround, -9, 0.92),
          makeHill('72%', '33%', 144, 90, mixColors('#34d399', skyBase, 0.76), deepGround, 8, 0.88),
          makeHill('64%', '70%', 142, 64, mixColors(seaDark, '#0f172a', 0.12), deepGround, -2, 0.88),
        ],
        columns: [
          makeColumn('6%', 95, 8, 56, mixColors('#166534', '#020617', 0.32), -8, 0.7),
          makeColumn('84%', 112, 9, 60, mixColors('#166534', '#020617', 0.28), 6, 0.66),
        ],
        motifs: [
          makeMotif('palm', '2%', 88, 66, 120, { trunk: '#3f2a1d', leaves: '#166534', glow: withAlpha('#34d399', 0.08), opacity: 0.76 }),
          makeMotif('waterfall', '75%', 86, 110, 150, { cliff: mixColors('#334155', '#020617', 0.5), water: '#38bdf8', foam: '#e0f2fe', foliage: '#14532d', opacity: 0.84 }),
        ],
      };
    case 'string_shores':
      return {
        weatherOpacity: 0.88,
        cardBackground: `linear-gradient(180deg, ${mixColors(skyTop, '#1e1b4b', 0.18)} 0%, ${mixColors(skyMid, '#1d4ed8', 0.14)} 56%, ${mixColors(skyBase, '#020617', 0.28)} 100%)`,
        bodyOverlay: `radial-gradient(ellipse 80% 42% at 52% 20%, ${withAlpha('#60a5fa', 0.1)}, transparent 66%), radial-gradient(circle at 76% 18%, ${withAlpha('#fef3c7', 0.12)}, transparent 22%)`,
        ground: `linear-gradient(180deg, ${mixColors('#1e3a8a', '#0f172a', 0.68)} 0%, ${mixColors('#1e293b', '#020617', 0.38)} 100%)`,
        moon: { right: '14%', top: '11%', size: 20, color: 'rgba(248, 250, 252, 0.9)', ring: moonGlow },
        stars: [
          makeDot('12%', '14%', 1.8, '#dbeafe', 0.1, 0.72, 0),
          makeDot('28%', '10%', 2.2, '#93c5fd', 1.2, 0.8, 1),
          makeDot('68%', '21%', 1.7, '#e0f2fe', 0.7, 0.74, 0),
          makeDot('81%', '26%', 2.1, '#fef3c7', 0.3, 0.82, 2),
        ],
        bands: [
          makeStroke('58%', '72%', 152, 12, withAlpha('#38bdf8', 0.16), 0, 0.74, 7),
          makeStroke('16%', '65%', 118, 10, withAlpha('#f59e0b', 0.1), 4, 0.5, 4),
        ],
        hills: [
          makeHill('-3%', '37%', 108, 88, mixColors('#1d4ed8', '#020617', 0.8), deepGround, -6, 0.86),
          makeHill('77%', '34%', 120, 96, mixColors('#0ea5e9', '#020617', 0.82), deepGround, 9, 0.84),
        ],
        columns: [
          makeColumn('8%', 100, 6, 48, mixColors('#1f2937', '#020617', 0.12), -5, 0.66),
          makeColumn('86%', 108, 6, 54, mixColors('#1f2937', '#020617', 0.12), 6, 0.66),
        ],
        motifs: [
          makeMotif('palm', '3%', 92, 56, 108, { trunk: '#3f2a1d', leaves: '#14532d', glow: withAlpha('#60a5fa', 0.06), opacity: 0.7 }),
          makeMotif('wave', '76%', 90, 112, 92, { water: '#1d4ed8', foam: '#dbeafe', opacity: 0.72 }),
        ],
      };
    case 'loop_lagoon':
      return {
        weatherOpacity: 0.86,
        cardBackground: `linear-gradient(180deg, ${mixColors(skyTop, '#052e16', 0.36)} 0%, ${mixColors(skyMid, '#064e3b', 0.18)} 54%, ${mixColors(skyBase, '#020617', 0.22)} 100%)`,
        bodyOverlay: `radial-gradient(ellipse 80% 40% at 50% 18%, ${withAlpha('#4ade80', 0.1)}, transparent 66%), radial-gradient(circle at 18% 22%, ${withAlpha('#22d3ee', 0.12)}, transparent 18%)`,
        ground: `linear-gradient(180deg, ${mixColors('#14532d', '#020617', 0.38)} 0%, ${mixColors('#052e16', '#020617', 0.16)} 100%)`,
        moon: { right: '11%', top: '12%', size: 18, color: 'rgba(236, 253, 245, 0.88)', ring: moonGlow },
        stars: [
          makeDot('14%', '16%', 2.4, '#4ade80', 0, 0.78, 2),
          makeDot('22%', '22%', 1.8, '#bbf7d0', 0.6, 0.66, 0),
          makeDot('74%', '18%', 2, '#22d3ee', 1.1, 0.74, 2),
          makeDot('86%', '24%', 1.6, '#d1fae5', 0.2, 0.64, 0),
        ],
        bands: [
          makeStroke('28%', '72%', 112, 14, withAlpha('#22d3ee', 0.14), -4, 0.76, 8),
          makeStroke('8%', '48%', 74, 8, withAlpha('#4ade80', 0.1), 12, 0.52, 6),
        ],
        hills: [
          makeHill('-5%', '35%', 118, 90, mixColors('#166534', '#020617', 0.38), deepGround, -8, 0.9),
          makeHill('72%', '33%', 138, 96, mixColors('#14532d', '#020617', 0.28), deepGround, 8, 0.9),
          makeHill('32%', '70%', 94, 46, mixColors('#0f766e', '#020617', 0.42), deepGround, -2, 0.9),
        ],
        columns: [
          makeColumn('6%', 102, 7, 50, mixColors('#166534', '#020617', 0.22), -8, 0.68),
          makeColumn('12%', 92, 4, 28, mixColors('#14532d', '#020617', 0.1), 8, 0.56),
        ],
        motifs: [
          makeMotif('canopy', '-4%', 0, 180, 144, { leaves: '#14532d', leavesAlt: '#166534', opacity: 0.72, side: 'left' }),
          makeMotif('canopy', '74%', 0, 178, 140, { leaves: '#166534', leavesAlt: '#14532d', opacity: 0.66, side: 'right' }),
        ],
      };
    case 'sliding_window_sanctum':
      return {
        weatherOpacity: 0.82,
        cardBackground: `linear-gradient(180deg, ${mixColors(skyTop, '#0f172a', 0.12)} 0%, ${mixColors(skyMid, '#312e81', 0.2)} 52%, ${mixColors(skyBase, '#020617', 0.18)} 100%)`,
        bodyOverlay: `radial-gradient(ellipse 76% 42% at 50% 18%, ${withAlpha('#818cf8', 0.12)}, transparent 66%), radial-gradient(circle at 76% 18%, ${withAlpha('#bfdbfe', 0.08)}, transparent 18%)`,
        ground: `linear-gradient(180deg, ${mixColors('#1e293b', '#0f172a', 0.18)} 0%, ${deepGround} 100%)`,
        moon: { right: '13%', top: '12%', size: 18, color: 'rgba(224, 231, 255, 0.88)', ring: moonGlow },
        stars: [
          makeDot('16%', '15%', 1.7, '#c7d2fe', 0.1, 0.72, 0),
          makeDot('32%', '10%', 2, '#93c5fd', 0.9, 0.82, 2),
          makeDot('72%', '17%', 1.8, '#e0e7ff', 1.3, 0.78, 0),
        ],
        bands: [
          makeStroke('20%', '42%', 34, 110, withAlpha('#bfdbfe', 0.12), 16, 0.72, 8),
          makeStroke('76%', '38%', 38, 120, withAlpha('#818cf8', 0.12), -12, 0.72, 8),
        ],
        peaks: [
          makePeak('8%', 92, 84, 96, mixColors('#60a5fa', '#020617', 0.78), deepGround, 0.84, 2),
          makePeak('66%', 92, 110, 126, mixColors('#818cf8', '#020617', 0.82), deepGround, 0.88, 2),
        ],
      };
    case 'hashmap_highlands':
      return {
        weatherOpacity: 0.82,
        cardBackground: `linear-gradient(180deg, ${mixColors(skyTop, '#431407', 0.28)} 0%, ${mixColors(skyMid, '#78350f', 0.22)} 54%, ${mixColors(skyBase, '#020617', 0.2)} 100%)`,
        bodyOverlay: `radial-gradient(ellipse 78% 42% at 52% 18%, ${withAlpha('#fb923c', 0.1)}, transparent 66%), radial-gradient(circle at 78% 20%, ${withAlpha('#fef3c7', 0.08)}, transparent 18%)`,
        ground: `linear-gradient(180deg, ${mixColors('#78350f', '#111827', 0.76)} 0%, ${amberDark} 100%)`,
        moon: { right: '14%', top: '12%', size: 19, color: 'rgba(255, 237, 213, 0.86)', ring: moonGlow },
        stars: [
          makeDot('16%', '14%', 1.8, '#fed7aa', 0.1, 0.68, 0),
          makeDot('34%', '11%', 2.1, '#fb923c', 0.9, 0.76, 2),
          makeDot('78%', '22%', 1.8, '#fde68a', 0.5, 0.74, 1),
        ],
        bands: [
          makeStroke('18%', '64%', 154, 10, withAlpha('#f59e0b', 0.12), 1, 0.6, 5),
        ],
        peaks: [
          makePeak('2%', 90, 88, 92, mixColors('#92400e', '#020617', 0.7), deepGround, 0.88, 1),
          makePeak('72%', 88, 96, 106, mixColors('#b45309', '#020617', 0.74), deepGround, 0.9, 1),
        ],
        motifs: [
          makeMotif('rock-spire', '10%', 92, 54, 92, { rock: mixColors('#92400e', '#020617', 0.62), edge: '#fdba74', opacity: 0.72 }),
          makeMotif('rock-spire', '80%', 96, 44, 76, { rock: mixColors('#b45309', '#020617', 0.7), edge: '#fed7aa', opacity: 0.7 }),
        ],
      };
    case 'stack_queue_quarry':
      return {
        weatherOpacity: 0.92,
        cardBackground: `linear-gradient(180deg, ${mixColors(skyTop, '#3f1d0d', 0.24)} 0%, ${mixColors(skyMid, '#7c2d12', 0.22)} 52%, ${mixColors(skyBase, '#020617', 0.2)} 100%)`,
        bodyOverlay: `radial-gradient(ellipse 76% 42% at 50% 18%, ${withAlpha('#fbbf24', 0.12)}, transparent 68%), radial-gradient(circle at 28% 24%, ${withAlpha('#fb923c', 0.08)}, transparent 18%)`,
        ground: `linear-gradient(180deg, ${mixColors('#92400e', '#020617', 0.72)} 0%, ${mixColors('#451a03', '#020617', 0.24)} 100%)`,
        moon: { right: '13%', top: '12%', size: 18, color: 'rgba(255, 247, 237, 0.82)', ring: moonGlow },
        stars: [
          makeDot('15%', '14%', 1.8, '#fde68a', 0, 0.68, 0),
          makeDot('26%', '10%', 2.2, '#fb923c', 0.7, 0.82, 2),
          makeDot('78%', '21%', 1.8, '#fbbf24', 1.2, 0.76, 2),
        ],
        bands: [
          makeStroke('54%', '56%', 62, 62, withAlpha('#f59e0b', 0.14), 45, 0.7, 12),
          makeStroke('12%', '68%', 148, 10, withAlpha('#f8fafc', 0.12), 0, 0.46, 4),
        ],
        peaks: [
          makePeak('4%', 92, 84, 86, mixColors('#78350f', '#020617', 0.66), deepGround, 0.88, 0),
          makePeak('72%', 90, 102, 96, mixColors('#92400e', '#020617', 0.7), deepGround, 0.88, 0),
        ],
      };
    case 'tree_tundra':
      return {
        weatherOpacity: 0.92,
        cardBackground: `linear-gradient(180deg, ${mixColors(skyTop, '#0f172a', 0.08)} 0%, ${mixColors(skyMid, '#1d4ed8', 0.1)} 50%, ${mixColors(skyBase, '#020617', 0.12)} 100%)`,
        bodyOverlay: `radial-gradient(ellipse 78% 44% at 50% 18%, ${withAlpha('#93c5fd', 0.1)}, transparent 68%), radial-gradient(circle at 75% 20%, ${withAlpha('#ffffff', 0.08)}, transparent 18%)`,
        ground: `linear-gradient(180deg, ${mixColors('#1e3a8a', '#111827', 0.84)} 0%, ${frostDark} 100%)`,
        moon: { right: '13%', top: '10%', size: 20, color: 'rgba(248, 250, 252, 0.92)', ring: moonGlow },
        stars: [
          makeDot('14%', '13%', 1.8, '#e0f2fe', 0.1, 0.78, 0),
          makeDot('28%', '9%', 2.2, '#ffffff', 0.9, 0.84, 1),
          makeDot('74%', '16%', 1.9, '#bae6fd', 0.3, 0.74, 1),
          makeDot('84%', '22%', 1.5, '#dbeafe', 1.1, 0.66, 0),
        ],
        bands: [
          makeStroke('16%', '69%', 156, 10, withAlpha('#e0f2fe', 0.16), -1, 0.58, 5),
        ],
        peaks: [
          makePeak('4%', 92, 92, 104, mixColors('#60a5fa', '#020617', 0.78), deepGround, 0.88, 1),
          makePeak('30%', 88, 122, 134, mixColors('#bfdbfe', '#020617', 0.8), deepGround, 0.92, 2),
          makePeak('72%', 90, 96, 118, mixColors('#93c5fd', '#020617', 0.82), deepGround, 0.88, 1),
        ],
        motifs: [
          makeMotif('pine', '6%', 94, 36, 88, { foliage: '#0f172a', foliageAlt: '#1e3a8a', trunk: '#334155', opacity: 0.74 }),
          makeMotif('pine', '84%', 92, 34, 82, { foliage: '#0f172a', foliageAlt: '#1d4ed8', trunk: '#334155', opacity: 0.72 }),
        ],
      };
    case 'linked_labyrinth':
      return {
        weatherOpacity: 0.86,
        cardBackground: `linear-gradient(180deg, ${mixColors(skyTop, '#052e16', 0.28)} 0%, ${mixColors(skyMid, '#14532d', 0.18)} 52%, ${mixColors(skyBase, '#020617', 0.18)} 100%)`,
        bodyOverlay: `radial-gradient(ellipse 78% 42% at 50% 18%, ${withAlpha('#84cc16', 0.12)}, transparent 68%), radial-gradient(circle at 80% 22%, ${withAlpha('#dcfce7', 0.08)}, transparent 18%)`,
        ground: `linear-gradient(180deg, ${mixColors('#14532d', '#020617', 0.82)} 0%, ${forestDark} 100%)`,
        moon: { right: '12%', top: '12%', size: 18, color: 'rgba(236, 253, 245, 0.82)', ring: moonGlow },
        stars: [
          makeDot('18%', '16%', 2.4, '#84cc16', 0, 0.8, 3),
          makeDot('26%', '10%', 1.8, '#d9f99d', 0.8, 0.72, 0),
          makeDot('74%', '18%', 2, '#bef264', 1.1, 0.8, 3),
        ],
        bands: [
          makeStroke('52%', '46%', 96, 54, withAlpha('#84cc16', 0.12), 0, 0.78, 10),
          makeStroke('16%', '69%', 150, 10, withAlpha('#f8fafc', 0.1), 0, 0.4, 4),
        ],
        hills: [
          makeHill('-4%', '34%', 118, 102, mixColors('#166534', '#020617', 0.38), deepGround, -8, 0.94),
          makeHill('72%', '30%', 142, 112, mixColors('#14532d', '#020617', 0.28), deepGround, 8, 0.92),
        ],
      };
    case 'winter_carnival':
      return {
        weatherOpacity: 0.94,
        cardBackground: `linear-gradient(180deg, ${mixColors(skyTop, '#312e81', 0.22)} 0%, ${mixColors(skyMid, '#6d28d9', 0.14)} 48%, ${mixColors(skyBase, '#020617', 0.14)} 100%)`,
        bodyOverlay: `radial-gradient(ellipse 78% 42% at 50% 18%, ${withAlpha('#c084fc', 0.1)}, transparent 68%), radial-gradient(circle at 20% 18%, ${withAlpha('#f472b6', 0.08)}, transparent 18%)`,
        ground: `linear-gradient(180deg, ${mixColors('#4c1d95', '#111827', 0.84)} 0%, ${violetDark} 100%)`,
        moon: { right: '13%', top: '11%', size: 20, color: 'rgba(248, 250, 252, 0.9)', ring: moonGlow },
        stars: [
          makeDot('16%', '15%', 1.8, '#f5d0fe', 0.1, 0.72, 0),
          makeDot('28%', '9%', 2, '#c084fc', 1, 0.82, 2),
          makeDot('78%', '18%', 2.1, '#93c5fd', 0.5, 0.76, 2),
        ],
        bands: [
          makeStroke('18%', '22%', 180, 30, withAlpha('#a855f7', 0.12), -8, 0.78, 16),
          makeStroke('18%', '24%', 170, 14, withAlpha('#60a5fa', 0.1), -8, 0.7, 12),
        ],
        hills: [
          makeHill('-4%', '40%', 118, 82, mixColors('#7c3aed', '#020617', 0.8), deepGround, -8, 0.9),
          makeHill('70%', '35%', 144, 90, mixColors('#6d28d9', '#020617', 0.82), deepGround, 8, 0.9),
          makeHill('26%', '70%', 140, 48, mixColors('#e0e7ff', '#312e81', 0.82), deepGround, 0, 0.78),
        ],
        motifs: [
          makeMotif('pine', '8%', 94, 34, 80, { foliage: '#312e81', foliageAlt: '#4338ca', trunk: '#334155', opacity: 0.68 }),
          makeMotif('pine', '84%', 94, 34, 80, { foliage: '#312e81', foliageAlt: '#60a5fa', trunk: '#334155', opacity: 0.68 }),
        ],
      };
    case 'desert_dunes':
      return {
        weatherOpacity: 0.92,
        cardBackground: `linear-gradient(180deg, ${mixColors(skyTop, '#3f1d0d', 0.32)} 0%, ${mixColors(skyMid, '#7c2d12', 0.16)} 50%, ${mixColors(skyBase, '#020617', 0.16)} 100%)`,
        bodyOverlay: `radial-gradient(ellipse 80% 42% at 50% 18%, ${withAlpha('#fb923c', 0.1)}, transparent 68%), radial-gradient(circle at 78% 16%, ${withAlpha('#fde68a', 0.1)}, transparent 22%)`,
        ground: `linear-gradient(180deg, ${mixColors('#92400e', '#111827', 0.84)} 0%, ${amberDark} 100%)`,
        moon: { right: '14%', top: '11%', size: 21, color: 'rgba(255, 251, 235, 0.9)', ring: moonGlow },
        stars: [
          makeDot('14%', '15%', 1.7, '#fde68a', 0, 0.68, 0),
          makeDot('26%', '11%', 2.1, '#fb923c', 0.8, 0.8, 2),
          makeDot('76%', '20%', 1.8, '#fcd34d', 0.4, 0.72, 1),
        ],
        bands: [
          makeStroke('12%', '65%', 176, 10, withAlpha('#f59e0b', 0.14), 2, 0.62, 4),
          makeStroke('16%', '70%', 164, 8, withAlpha('#fff7ed', 0.12), -1, 0.48, 2),
        ],
        hills: [
          makeHill('-6%', '39%', 132, 78, mixColors('#d97706', '#020617', 0.82), deepGround, -4, 0.94),
          makeHill('28%', '70%', 160, 46, mixColors('#b45309', '#020617', 0.76), deepGround, 0, 0.92),
          makeHill('66%', '34%', 142, 96, mixColors('#c2410c', '#020617', 0.82), deepGround, 8, 0.9),
        ],
        columns: [
          makeColumn('79%', 98, 10, 58, mixColors('#365314', '#020617', 0.18), 0, 0.72, '10px 10px 0 0'),
          makeColumn('83%', 112, 4, 26, mixColors('#365314', '#020617', 0.14), 20, 0.64, '999px'),
          makeColumn('76%', 116, 4, 24, mixColors('#365314', '#020617', 0.14), -20, 0.64, '999px'),
        ],
        motifs: [
          makeMotif('cactus', '8%', 94, 34, 84, { body: '#3f6212', edge: '#84cc16', opacity: 0.76 }),
          makeMotif('cactus', '78%', 92, 42, 96, { body: '#365314', edge: '#a3e635', opacity: 0.8 }),
        ],
      };
    case 'graph_gorge':
      return {
        weatherOpacity: 0.8,
        cardBackground: `linear-gradient(180deg, ${mixColors(skyTop, '#292524', 0.24)} 0%, ${mixColors(skyMid, '#334155', 0.12)} 52%, ${mixColors(skyBase, '#020617', 0.16)} 100%)`,
        bodyOverlay: `radial-gradient(ellipse 80% 42% at 50% 18%, ${withAlpha('#d6d3d1', 0.08)}, transparent 68%), radial-gradient(circle at 76% 18%, ${withAlpha('#e2e8f0', 0.08)}, transparent 16%)`,
        ground: `linear-gradient(180deg, ${mixColors('#475569', '#111827', 0.84)} 0%, ${mixColors('#1f2937', '#020617', 0.26)} 100%)`,
        moon: { right: '13%', top: '11%', size: 19, color: 'rgba(248, 250, 252, 0.84)', ring: moonGlow },
        stars: [
          makeDot('16%', '14%', 1.8, '#e7e5e4', 0, 0.66, 0),
          makeDot('28%', '10%', 2.1, '#cbd5e1', 0.9, 0.78, 2),
          makeDot('76%', '18%', 1.7, '#d6d3d1', 0.3, 0.68, 0),
        ],
        bands: [
          makeStroke('24%', '56%', 58, 5, withAlpha('#64748b', 0.26), 12, 0.72, 0),
          makeStroke('60%', '56%', 64, 5, withAlpha('#64748b', 0.26), -12, 0.72, 0),
        ],
        peaks: [
          makePeak('6%', 92, 90, 96, mixColors('#475569', '#020617', 0.82), deepGround, 0.88, 0),
          makePeak('72%', 90, 100, 114, mixColors('#64748b', '#020617', 0.84), deepGround, 0.9, 0),
        ],
        motifs: [
          makeMotif('rock-spire', '10%', 94, 42, 86, { rock: mixColors('#475569', '#020617', 0.78), edge: '#cbd5e1', opacity: 0.74 }),
          makeMotif('rock-spire', '84%', 96, 38, 74, { rock: mixColors('#64748b', '#020617', 0.82), edge: '#e2e8f0', opacity: 0.7 }),
        ],
      };
    case 'dp_dungeon':
      return {
        weatherOpacity: 0.82,
        cardBackground: `linear-gradient(180deg, ${mixColors(skyTop, '#1e1b4b', 0.18)} 0%, ${mixColors(skyMid, '#4c1d95', 0.16)} 52%, ${mixColors(skyBase, '#020617', 0.14)} 100%)`,
        bodyOverlay: `radial-gradient(ellipse 80% 42% at 50% 18%, ${withAlpha('#a78bfa', 0.12)}, transparent 68%), radial-gradient(circle at 76% 18%, ${withAlpha('#ddd6fe', 0.08)}, transparent 16%)`,
        ground: `linear-gradient(180deg, ${mixColors('#4c1d95', '#111827', 0.86)} 0%, ${violetDark} 100%)`,
        moon: { right: '13%', top: '11%', size: 18, color: 'rgba(237, 233, 254, 0.88)', ring: moonGlow },
        stars: [
          makeDot('12%', '14%', 1.8, '#ddd6fe', 0, 0.7, 0),
          makeDot('22%', '10%', 2.4, '#c4b5fd', 0.9, 0.84, 2),
          makeDot('74%', '18%', 1.8, '#a78bfa', 0.4, 0.72, 2),
          makeDot('84%', '26%', 2.2, '#f5d0fe', 1.2, 0.78, 3),
        ],
        bands: [
          makeStroke('34%', '26%', 82, 86, withAlpha('#8b5cf6', 0.12), 0, 0.74, 14),
          makeStroke('16%', '68%', 150, 10, withAlpha('#c4b5fd', 0.12), 0, 0.5, 4),
        ],
        columns: [
          makeColumn('34%', 94, 22, 78, mixColors('#7c3aed', '#020617', 0.82), 0, 0.56, '12px 12px 0 0'),
          makeColumn('42%', 94, 12, 92, mixColors('#8b5cf6', '#020617', 0.84), 0, 0.62, '12px 12px 0 0'),
        ],
        motifs: [
          makeMotif('planet', '74%', 74, 104, 104, { planet: '#6d28d9', ring: '#c4b5fd', glow: withAlpha('#8b5cf6', 0.16), moon: '#ddd6fe', opacity: 0.78 }),
          makeMotif('planet', '8%', 112, 42, 42, { planet: '#4338ca', ring: '#93c5fd', glow: withAlpha('#60a5fa', 0.12), opacity: 0.72 }),
        ],
      };
    case 'recursion_ruins':
      return {
        weatherOpacity: 0.84,
        cardBackground: `linear-gradient(180deg, ${mixColors(skyTop, '#422006', 0.22)} 0%, ${mixColors(skyMid, '#713f12', 0.14)} 52%, ${mixColors(skyBase, '#020617', 0.14)} 100%)`,
        bodyOverlay: `radial-gradient(ellipse 80% 42% at 50% 18%, ${withAlpha('#facc15', 0.1)}, transparent 68%), radial-gradient(circle at 74% 18%, ${withAlpha('#fef3c7', 0.08)}, transparent 16%)`,
        ground: `linear-gradient(180deg, ${mixColors('#713f12', '#111827', 0.84)} 0%, ${amberDark} 100%)`,
        moon: { right: '13%', top: '11%', size: 20, color: 'rgba(254, 249, 195, 0.86)', ring: moonGlow },
        stars: [
          makeDot('14%', '14%', 1.8, '#fde68a', 0, 0.68, 0),
          makeDot('26%', '10%', 2.1, '#facc15', 0.9, 0.8, 2),
          makeDot('78%', '22%', 1.8, '#fef3c7', 0.3, 0.7, 0),
        ],
        bands: [
          makeStroke('24%', '48%', 20, 72, withAlpha('#f8fafc', 0.12), 0, 0.56, 4),
          makeStroke('70%', '48%', 20, 64, withAlpha('#f8fafc', 0.1), 0, 0.48, 4),
        ],
        columns: [
          makeColumn('20%', 94, 14, 70, mixColors('#92400e', '#020617', 0.82), 0, 0.62, '8px 8px 0 0'),
          makeColumn('28%', 94, 18, 86, mixColors('#a16207', '#020617', 0.84), 0, 0.66, '8px 8px 0 0'),
          makeColumn('68%', 96, 16, 74, mixColors('#92400e', '#020617', 0.84), 0, 0.58, '8px 8px 0 0'),
        ],
        motifs: [
          makeMotif('ruin', '14%', 92, 74, 92, { stone: '#78350f', edge: '#fcd34d', opacity: 0.74 }),
          makeMotif('ruin', '70%', 96, 64, 84, { stone: '#92400e', edge: '#fde68a', opacity: 0.68 }),
        ],
      };
    case 'regex_rainforest':
      return {
        weatherOpacity: 0.96,
        cardBackground: `linear-gradient(180deg, ${mixColors(skyTop, '#164e63', 0.18)} 0%, ${mixColors(skyMid, '#0f766e', 0.12)} 52%, ${mixColors(skyBase, '#020617', 0.14)} 100%)`,
        bodyOverlay: `radial-gradient(ellipse 80% 42% at 50% 18%, ${withAlpha('#38bdf8', 0.08)}, transparent 68%), radial-gradient(circle at 76% 18%, ${withAlpha('#67e8f9', 0.08)}, transparent 18%)`,
        ground: `linear-gradient(180deg, ${mixColors('#0f766e', '#111827', 0.88)} 0%, ${mixColors('#14532d', '#020617', 0.26)} 100%)`,
        moon: { right: '13%', top: '12%', size: 18, color: 'rgba(224, 242, 254, 0.82)', ring: moonGlow },
        stars: [
          makeDot('12%', '15%', 1.7, '#7dd3fc', 0, 0.66, 0),
          makeDot('24%', '11%', 2.2, '#38bdf8', 0.9, 0.82, 2),
          makeDot('76%', '18%', 1.7, '#bae6fd', 0.4, 0.68, 0),
        ],
        bands: [
          makeStroke('8%', '26%', 6, 144, withAlpha('#38bdf8', 0.16), -8, 0.72, 5),
          makeStroke('89%', '24%', 6, 152, withAlpha('#38bdf8', 0.14), -10, 0.68, 5),
          makeStroke('18%', '68%', 146, 10, withAlpha('#f8fafc', 0.08), 0, 0.34, 4),
        ],
        hills: [
          makeHill('-4%', '34%', 114, 104, mixColors('#14532d', '#020617', 0.34), deepGround, -8, 0.94),
          makeHill('72%', '30%', 140, 114, mixColors('#0f766e', '#020617', 0.42), deepGround, 8, 0.9),
        ],
        motifs: [
          makeMotif('canopy', '-6%', 0, 188, 150, { leaves: '#312e81', leavesAlt: '#4c1d95', opacity: 0.72, side: 'left' }),
          makeMotif('canopy', '72%', 0, 188, 150, { leaves: '#4c1d95', leavesAlt: '#312e81', opacity: 0.68, side: 'right' }),
        ],
      };
    case 'algorithm_alps':
      return {
        weatherOpacity: 0.96,
        cardBackground: `linear-gradient(180deg, ${mixColors(skyTop, '#020617', 0.08)} 0%, ${mixColors(skyMid, '#0f172a', 0.12)} 50%, ${mixColors(skyBase, '#020617', 0.08)} 100%)`,
        bodyOverlay: `radial-gradient(ellipse 80% 42% at 50% 18%, ${withAlpha('#93c5fd', 0.08)}, transparent 68%), radial-gradient(circle at 24% 18%, ${withAlpha('#34d399', 0.08)}, transparent 20%), radial-gradient(circle at 76% 18%, ${withAlpha('#60a5fa', 0.08)}, transparent 20%)`,
        ground: `linear-gradient(180deg, ${mixColors('#1e3a8a', '#111827', 0.88)} 0%, ${frostDark} 100%)`,
        moon: { right: '13%', top: '10%', size: 20, color: 'rgba(248, 250, 252, 0.92)', ring: moonGlow },
        stars: [
          makeDot('12%', '14%', 1.8, '#e0f2fe', 0, 0.72, 0),
          makeDot('26%', '9%', 2.2, '#34d399', 0.9, 0.66, 3),
          makeDot('74%', '16%', 1.9, '#60a5fa', 0.4, 0.7, 3),
          makeDot('84%', '22%', 1.5, '#ffffff', 1.2, 0.74, 0),
        ],
        bands: [
          makeStroke('18%', '16%', 188, 28, withAlpha('#34d399', 0.12), -10, 0.82, 18),
          makeStroke('18%', '18%', 180, 16, withAlpha('#60a5fa', 0.1), -10, 0.72, 14),
        ],
        peaks: [
          makePeak('8%', 92, 90, 104, mixColors('#60a5fa', '#020617', 0.84), deepGround, 0.88, 1),
          makePeak('30%', 86, 126, 144, mixColors('#f8fafc', '#1e3a8a', 0.72), deepGround, 0.94, 2),
          makePeak('72%', 92, 96, 118, mixColors('#94a3b8', '#020617', 0.84), deepGround, 0.9, 1),
        ],
        motifs: [
          makeMotif('pine', '6%', 96, 32, 76, { foliage: '#0f172a', foliageAlt: '#1e3a8a', trunk: '#475569', opacity: 0.72 }),
          makeMotif('pine', '88%', 96, 32, 76, { foliage: '#0f172a', foliageAlt: '#1e3a8a', trunk: '#475569', opacity: 0.72 }),
        ],
      };
    default:
      return {
        weatherOpacity: 0.88,
        cardBackground: `linear-gradient(180deg, ${skyTop} 0%, ${skyMid} 55%, ${skyBase} 100%)`,
        bodyOverlay: `radial-gradient(ellipse 80% 45% at 50% 20%, ${accentSoft}, transparent 65%)`,
        ground: `linear-gradient(180deg, ${softGround} 0%, ${deepGround} 100%)`,
        moon: { right: '13%', top: '11%', size: 18, color: 'rgba(248, 250, 252, 0.86)', ring: moonGlow },
        stars: [
          makeDot('16%', '14%', 1.8, '#e2e8f0', 0, 0.72, 0),
          makeDot('26%', '10%', 2, '#cbd5e1', 0.9, 0.8, 2),
          makeDot('76%', '20%', 1.8, '#f8fafc', 0.4, 0.74, 0),
        ],
        bands: [
          makeStroke('18%', '68%', 140, 10, borderSoft, 0, 0.5, 6),
        ],
        hills: [
          makeHill('-4%', '36%', 114, 90, mixColors(accent, '#020617', 0.82), deepGround, -8, 0.9),
          makeHill('74%', '32%', 136, 96, mixColors(border || accent, '#020617', 0.84), deepGround, 8, 0.9),
        ],
      };
  }
};

const getBrightScene = (key, facade, accent) => {
  const accentSoft = withAlpha(accent, 0.16);
  const accentGlow = withAlpha(accent, 0.2);
  const accentDeep = mixColors(accent, '#0f172a', 0.28);
  const sand = mixColors(facade.hillB, '#f59e0b', 0.22);
  const forest = mixColors(facade.hillC, '#166534', 0.36);
  const rock = mixColors(facade.hillC, '#475569', 0.4);
  const snow = mixColors(facade.hillA, '#ffffff', 0.5);

  switch (key) {
    case 'array_archipelago':
      return {
        weatherOpacity: 0.4,
        sun: { right: '9%', top: '12%', size: 32, color: 'rgba(255,255,255,0.62)' },
        clouds: [
          makeCloud('8%', '10%', 74, 22, 0.95),
          makeCloud('20%', '16%', 52, 16, 0.88),
          makeCloud('72%', '14%', 66, 20, 0.92),
        ],
        hills: [
          makeHill('-2%', '35%', 120, 74, facade.hillB, facade.hillC, -8, 0.92),
          makeHill('74%', '32%', 138, 84, facade.hillA, facade.hillB, 9, 0.94),
          makeHill('66%', '68%', 136, 68, facade.hillA, mixColors(facade.hillB, '#34d399', 0.2), -4, 0.88),
          makeHill('2%', '70%', 110, 56, mixColors(facade.hillA, '#ffffff', 0.16), facade.hillB, 2, 0.86),
        ],
        strokes: [
          makeStroke('61%', '73%', 116, 18, withAlpha('#38bdf8', 0.28), 0, 0.78, 0),
          makeStroke('58%', '76%', 132, 8, withAlpha('#ffffff', 0.62), -2, 0.82, 0),
        ],
        glyphs: [
          makeGlyph('🌴', '2%', 108, 28, 0.1, -6, 0.78),
          makeGlyph('🦀', '88%', 112, 24, 0.55, 7, 0.7),
        ],
      };
    case 'string_shores':
      return {
        weatherOpacity: 0.38,
        sun: { right: '16%', top: '12%', size: 36, color: 'rgba(255,247,214,0.72)' },
        clouds: [
          makeCloud('10%', '12%', 64, 20, 0.9),
          makeCloud('74%', '16%', 54, 16, 0.84),
        ],
        hills: [
          makeHill('-4%', '33%', 96, 72, mixColors(facade.hillA, '#fff7d4', 0.2), sand, -7, 0.92),
          makeHill('79%', '28%', 120, 88, mixColors(facade.hillA, '#fde68a', 0.16), sand, 8, 0.9),
          makeHill('84%', '58%', 96, 112, '#9dd9df', mixColors('#67e8f9', '#38bdf8', 0.35), 0, 0.74),
        ],
        strokes: [
          makeStroke('62%', '74%', 124, 18, withAlpha('#38bdf8', 0.22), 0, 0.7, 0),
          makeStroke('13%', '65%', 150, 10, withAlpha('#f59e0b', 0.18), 4, 0.62, 0),
          makeStroke('18%', '69%', 140, 8, withAlpha('#ffffff', 0.46), 4, 0.7, 0),
        ],
        glyphs: [
          makeGlyph('🌴', '4%', 112, 26, 0.2, -8, 0.76),
          makeGlyph('⚓', '10%', 102, 22, 0.5, 0, 0.72),
        ],
      };
    case 'loop_lagoon':
      return {
        weatherOpacity: 0.38,
        sun: { right: '11%', top: '11%', size: 30, color: 'rgba(255,255,255,0.58)' },
        clouds: [
          makeCloud('9%', '12%', 60, 18, 0.9),
          makeCloud('34%', '9%', 46, 14, 0.82),
          makeCloud('70%', '15%', 64, 18, 0.9),
        ],
        hills: [
          makeHill('0%', '34%', 98, 70, mixColors(facade.hillA, '#bbf7d0', 0.12), forest, -9, 0.93),
          makeHill('69%', '29%', 134, 94, mixColors(facade.hillA, '#dcfce7', 0.18), forest, 8, 0.92),
          makeHill('32%', '69%', 86, 34, withAlpha('#67e8f9', 0.2), withAlpha('#22d3ee', 0.34), -4, 0.92),
        ],
        strokes: [
          makeStroke('31%', '70%', 102, 16, withAlpha('#22d3ee', 0.22), -3, 0.82, 0),
          makeStroke('23%', '41%', 76, 6, accentSoft, 12, 0.62, 0),
          makeStroke('68%', '38%', 84, 6, accentSoft, -8, 0.58, 0),
        ],
        glyphs: [
          makeGlyph('🪷', '7%', 110, 22, 0.2, -4, 0.76),
          makeGlyph('🐸', '86%', 108, 22, 0.7, 6, 0.7),
        ],
      };
    case 'sliding_window_sanctum':
      return {
        weatherOpacity: 0.34,
        sun: { right: '13%', top: '12%', size: 30, color: 'rgba(255,255,255,0.6)' },
        clouds: [
          makeCloud('12%', '11%', 68, 18, 0.9),
          makeCloud('73%', '15%', 56, 16, 0.84),
        ],
        hills: [
          makeHill('1%', '36%', 104, 66, mixColors(facade.hillA, '#dbeafe', 0.24), mixColors(facade.hillC, '#60a5fa', 0.24), -7, 0.9),
          makeHill('74%', '34%', 126, 80, mixColors(facade.hillA, '#e0e7ff', 0.3), mixColors(facade.hillB, '#818cf8', 0.24), 8, 0.92),
        ],
        strokes: [
          makeStroke('20%', '44%', 32, 92, withAlpha('#ffffff', 0.42), 16, 0.88, 1),
          makeStroke('27%', '45%', 18, 88, withAlpha(accentDeep, 0.24), 16, 0.8, 0),
          makeStroke('73%', '40%', 38, 112, withAlpha('#ffffff', 0.38), -12, 0.84, 1),
          makeStroke('79%', '41%', 18, 102, withAlpha(accentDeep, 0.22), -12, 0.76, 0),
        ],
        glyphs: [
          makeGlyph('🔍', '9%', 108, 20, 0.3, -6, 0.72),
          makeGlyph('💠', '85%', 114, 16, 0.65, 8, 0.68),
        ],
      };
    case 'hashmap_highlands':
      return {
        weatherOpacity: 0.36,
        sun: { right: '12%', top: '13%', size: 34, color: 'rgba(255,233,182,0.64)' },
        clouds: [
          makeCloud('12%', '12%', 60, 18, 0.84),
          makeCloud('72%', '16%', 58, 16, 0.78),
        ],
        hills: [
          makeHill('-3%', '36%', 104, 74, mixColors(facade.hillA, '#fcd34d', 0.18), mixColors(facade.hillC, '#a16207', 0.16), -7, 0.94),
          makeHill('78%', '31%', 124, 88, mixColors(facade.hillA, '#fdba74', 0.14), mixColors(facade.hillB, '#b45309', 0.18), 10, 0.9),
          makeHill('30%', '68%', 120, 40, mixColors(facade.hillA, '#fef3c7', 0.14), mixColors(facade.hillB, '#f59e0b', 0.22), 0, 0.86),
        ],
        strokes: [
          makeStroke('16%', '63%', 140, 8, withAlpha('#b45309', 0.18), -2, 0.6, 0),
          makeStroke('18%', '68%', 128, 8, withAlpha('#ffffff', 0.46), 3, 0.7, 0),
        ],
        glyphs: [
          makeGlyph('🦅', '7%', 110, 22, 0.15, -10, 0.72),
          makeGlyph('🗺️', '82%', 116, 18, 0.58, 6, 0.72),
        ],
      };
    case 'stack_queue_quarry':
      return {
        weatherOpacity: 0.42,
        sun: { right: '13%', top: '12%', size: 30, color: 'rgba(255,238,188,0.58)' },
        clouds: [
          makeCloud('9%', '12%', 56, 18, 0.82),
          makeCloud('74%', '17%', 52, 15, 0.72),
        ],
        hills: [
          makeHill('-3%', '37%', 112, 72, mixColors(facade.hillA, '#fbbf24', 0.16), mixColors(facade.hillC, '#a16207', 0.24), -6, 0.94),
          makeHill('76%', '33%', 132, 82, mixColors(facade.hillA, '#fde68a', 0.16), mixColors(facade.hillB, '#b45309', 0.24), 9, 0.92),
        ],
        strokes: [
          makeStroke('12%', '63%', 162, 10, withAlpha('#92400e', 0.22), 0, 0.66, 0),
          makeStroke('12%', '69%', 144, 10, withAlpha('#f8fafc', 0.34), 0, 0.5, 0),
          makeStroke('58%', '58%', 54, 54, accentGlow, 45, 0.68, 8),
        ],
        glyphs: [
          makeGlyph('⚒️', '8%', 108, 20, 0.15, -8, 0.74),
          makeGlyph('💎', '84%', 112, 16, 0.65, 10, 0.72),
        ],
      };
    case 'tree_tundra':
      return {
        weatherOpacity: 0.4,
        sun: { right: '12%', top: '13%', size: 26, color: 'rgba(255,255,255,0.72)' },
        clouds: [
          makeCloud('12%', '12%', 70, 20, 0.92),
          makeCloud('74%', '17%', 58, 16, 0.86),
        ],
        hills: [
          makeHill('-5%', '38%', 118, 72, mixColors(facade.hillA, '#ffffff', 0.4), mixColors(facade.hillB, '#bfdbfe', 0.18), -6, 0.94),
          makeHill('74%', '31%', 132, 94, mixColors(snow, '#ffffff', 0.2), mixColors(facade.hillC, '#60a5fa', 0.18), 8, 0.94),
          makeHill('26%', '68%', 132, 48, mixColors('#ffffff', facade.hillA, 0.26), mixColors(facade.hillB, '#e0f2fe', 0.34), 0, 0.9),
        ],
        strokes: [
          makeStroke('12%', '71%', 156, 9, withAlpha('#ffffff', 0.62), 0, 0.82, 0),
          makeStroke('18%', '66%', 132, 7, withAlpha('#60a5fa', 0.14), -2, 0.6, 0),
        ],
        glyphs: [
          makeGlyph('🌲', '8%', 108, 20, 0.2, -4, 0.78),
          makeGlyph('🦌', '84%', 108, 18, 0.65, 5, 0.74),
        ],
      };
    case 'linked_labyrinth':
      return {
        weatherOpacity: 0.38,
        sun: { right: '12%', top: '12%', size: 30, color: 'rgba(248,250,252,0.58)' },
        clouds: [
          makeCloud('12%', '12%', 62, 18, 0.84),
          makeCloud('76%', '16%', 52, 15, 0.76),
        ],
        hills: [
          makeHill('-2%', '36%', 110, 76, mixColors(facade.hillA, '#dcfce7', 0.16), forest, -8, 0.93),
          makeHill('77%', '31%', 128, 88, mixColors(facade.hillA, '#ecfccb', 0.16), mixColors(facade.hillB, '#65a30d', 0.28), 9, 0.92),
        ],
        strokes: [
          makeStroke('15%', '63%', 160, 10, withAlpha('#65a30d', 0.16), 0, 0.55, 0),
          makeStroke('18%', '69%', 148, 10, withAlpha('#ffffff', 0.42), 0, 0.6, 0),
          makeStroke('56%', '44%', 90, 48, withAlpha('#84cc16', 0.12), 0, 0.78, 6),
        ],
        glyphs: [
          makeGlyph('🌿', '7%', 108, 18, 0.2, -6, 0.8),
          makeGlyph('🕷️', '84%', 112, 16, 0.7, 4, 0.68),
        ],
      };
    case 'winter_carnival':
      return {
        weatherOpacity: 0.44,
        sun: { right: '12%', top: '13%', size: 28, color: 'rgba(255,255,255,0.7)' },
        clouds: [
          makeCloud('12%', '12%', 66, 20, 0.94),
          makeCloud('74%', '16%', 56, 16, 0.88),
        ],
        hills: [
          makeHill('-2%', '39%', 108, 72, mixColors(facade.hillA, '#ffffff', 0.28), mixColors(facade.hillB, '#c084fc', 0.14), -8, 0.92),
          makeHill('77%', '34%', 132, 86, mixColors(facade.hillA, '#ffffff', 0.22), mixColors(facade.hillC, '#a855f7', 0.12), 8, 0.9),
          makeHill('26%', '68%', 132, 50, mixColors('#ffffff', facade.hillA, 0.24), mixColors(facade.hillB, '#e9d5ff', 0.26), 0, 0.88),
        ],
        strokes: [
          makeStroke('22%', '66%', 100, 18, withAlpha('#f472b6', 0.12), 0, 0.78, 6),
          makeStroke('62%', '66%', 100, 18, withAlpha('#60a5fa', 0.12), 0, 0.78, 6),
        ],
        glyphs: [
          makeGlyph('🎪', '8%', 108, 18, 0.18, -4, 0.78),
          makeGlyph('✨', '84%', 110, 18, 0.62, 8, 0.82),
        ],
      };
    case 'desert_dunes':
      return {
        weatherOpacity: 0.44,
        sun: { right: '13%', top: '12%', size: 38, color: 'rgba(254,240,138,0.7)' },
        clouds: [
          makeCloud('12%', '12%', 58, 18, 0.78),
          makeCloud('75%', '16%', 48, 15, 0.7),
        ],
        hills: [
          makeHill('-5%', '38%', 128, 72, mixColors(facade.hillA, '#fde68a', 0.22), mixColors(facade.hillB, '#f59e0b', 0.18), -4, 0.96),
          makeHill('30%', '68%', 152, 44, mixColors(facade.hillA, '#fef3c7', 0.12), mixColors(facade.hillB, '#d97706', 0.22), 0, 0.92),
          makeHill('67%', '33%', 138, 92, mixColors(facade.hillA, '#fdba74', 0.18), mixColors(facade.hillC, '#c2410c', 0.16), 9, 0.9),
        ],
        strokes: [
          makeStroke('12%', '64%', 176, 10, withAlpha('#d97706', 0.18), 2, 0.62, 0),
          makeStroke('16%', '69%', 164, 10, withAlpha('#fff7ed', 0.44), -1, 0.72, 0),
        ],
        glyphs: [
          makeGlyph('🌵', '8%', 108, 18, 0.2, -4, 0.78),
          makeGlyph('🦂', '84%', 110, 18, 0.68, 8, 0.68),
        ],
      };
    case 'graph_gorge':
      return {
        weatherOpacity: 0.34,
        sun: { right: '13%', top: '12%', size: 30, color: 'rgba(255,255,255,0.56)' },
        clouds: [
          makeCloud('12%', '13%', 62, 18, 0.84),
          makeCloud('74%', '16%', 54, 16, 0.78),
        ],
        hills: [
          makeHill('-4%', '34%', 106, 84, mixColors(facade.hillA, '#d6d3d1', 0.14), rock, -10, 0.94),
          makeHill('79%', '30%', 126, 98, mixColors(facade.hillA, '#e7e5e4', 0.12), mixColors(facade.hillB, '#475569', 0.28), 10, 0.92),
        ],
        strokes: [
          makeStroke('26%', '56%', 54, 5, withAlpha('#475569', 0.4), 12, 0.72, 0),
          makeStroke('31%', '59%', 66, 5, withAlpha('#f8fafc', 0.34), 12, 0.58, 0),
          makeStroke('61%', '56%', 60, 5, withAlpha('#475569', 0.4), -12, 0.72, 0),
          makeStroke('60%', '59%', 74, 5, withAlpha('#f8fafc', 0.34), -12, 0.58, 0),
        ],
        glyphs: [
          makeGlyph('🪨', '8%', 108, 18, 0.2, -4, 0.74),
          makeGlyph('🗻', '84%', 108, 16, 0.68, 6, 0.66),
        ],
      };
    case 'dp_dungeon':
      return {
        weatherOpacity: 0.34,
        sun: { right: '12%', top: '13%', size: 24, color: 'rgba(255,255,255,0.48)' },
        clouds: [
          makeCloud('12%', '12%', 56, 16, 0.72),
          makeCloud('76%', '16%', 46, 14, 0.7),
        ],
        hills: [
          makeHill('-2%', '36%', 108, 72, mixColors(facade.hillA, '#ddd6fe', 0.2), mixColors(facade.hillC, '#5b21b6', 0.2), -8, 0.92),
          makeHill('78%', '33%', 126, 86, mixColors(facade.hillA, '#f5f3ff', 0.18), mixColors(facade.hillB, '#6d28d9', 0.22), 10, 0.9),
          makeHill('36%', '26%', 74, 84, mixColors(facade.hillA, '#c4b5fd', 0.12), mixColors(facade.hillC, '#4c1d95', 0.3), 0, 0.72),
        ],
        strokes: [
          makeStroke('37%', '27%', 54, 66, withAlpha('#f8fafc', 0.34), 0, 0.78, 1),
          makeStroke('18%', '68%', 144, 10, withAlpha('#c4b5fd', 0.16), 0, 0.56, 0),
        ],
        glyphs: [
          makeGlyph('🏰', '8%', 108, 18, 0.18, -4, 0.76),
          makeGlyph('🕯️', '84%', 112, 16, 0.65, 8, 0.72),
        ],
      };
    case 'recursion_ruins':
      return {
        weatherOpacity: 0.36,
        sun: { right: '13%', top: '12%', size: 32, color: 'rgba(253,230,138,0.6)' },
        clouds: [
          makeCloud('12%', '12%', 56, 18, 0.8),
          makeCloud('76%', '16%', 48, 16, 0.72),
        ],
        hills: [
          makeHill('-3%', '37%', 108, 72, mixColors(facade.hillA, '#fde68a', 0.16), mixColors(facade.hillC, '#92400e', 0.22), -7, 0.92),
          makeHill('78%', '33%', 128, 88, mixColors(facade.hillA, '#fef3c7', 0.12), mixColors(facade.hillB, '#a16207', 0.24), 8, 0.9),
        ],
        strokes: [
          makeStroke('22%', '49%', 18, 64, withAlpha('#ffffff', 0.38), 0, 0.7, 1),
          makeStroke('30%', '46%', 22, 82, withAlpha(accentDeep, 0.16), 0, 0.64, 0),
          makeStroke('69%', '48%', 18, 58, withAlpha('#ffffff', 0.32), 0, 0.66, 1),
        ],
        glyphs: [
          makeGlyph('🏛️', '8%', 108, 18, 0.16, -4, 0.76),
          makeGlyph('📜', '84%', 112, 16, 0.62, 8, 0.7),
        ],
      };
    case 'regex_rainforest':
      return {
        weatherOpacity: 0.46,
        sun: { right: '12%', top: '13%', size: 24, color: 'rgba(255,255,255,0.5)' },
        clouds: [
          makeCloud('10%', '11%', 62, 18, 0.76),
          makeCloud('74%', '15%', 54, 16, 0.72),
        ],
        hills: [
          makeHill('-4%', '34%', 110, 84, mixColors(facade.hillA, '#bbf7d0', 0.14), mixColors(facade.hillC, '#0f766e', 0.22), -8, 0.94),
          makeHill('77%', '31%', 130, 96, mixColors(facade.hillA, '#d1fae5', 0.1), mixColors(facade.hillB, '#0284c7', 0.18), 9, 0.9),
        ],
        strokes: [
          makeStroke('17%', '65%', 150, 12, withAlpha('#0f766e', 0.16), 0, 0.56, 0),
          makeStroke('20%', '70%', 138, 10, withAlpha('#ffffff', 0.3), 0, 0.52, 0),
          makeStroke('8%', '28%', 6, 130, withAlpha('#7dd3fc', 0.2), -8, 0.7, 2),
          makeStroke('89%', '25%', 6, 138, withAlpha('#7dd3fc', 0.18), -10, 0.64, 2),
        ],
        glyphs: [
          makeGlyph('🍃', '8%', 108, 18, 0.18, -6, 0.82),
          makeGlyph('🐢', '84%', 110, 16, 0.68, 8, 0.72),
        ],
      };
    case 'algorithm_alps':
      return {
        weatherOpacity: 0.44,
        sun: { right: '12%', top: '13%', size: 28, color: 'rgba(255,255,255,0.74)' },
        clouds: [
          makeCloud('12%', '12%', 72, 20, 0.95),
          makeCloud('74%', '17%', 58, 16, 0.9),
        ],
        hills: [
          makeHill('-5%', '39%', 118, 74, mixColors('#ffffff', facade.hillA, 0.26), mixColors(facade.hillB, '#93c5fd', 0.18), -8, 0.96),
          makeHill('74%', '32%', 132, 96, mixColors('#ffffff', facade.hillA, 0.22), mixColors(facade.hillC, '#64748b', 0.16), 8, 0.94),
          makeHill('30%', '70%', 152, 44, mixColors('#ffffff', facade.hillA, 0.2), mixColors(facade.hillB, '#e2e8f0', 0.2), 0, 0.9),
        ],
        strokes: [
          makeStroke('18%', '70%', 150, 10, withAlpha('#ffffff', 0.62), 0, 0.84, 0),
          makeStroke('24%', '64%', 136, 8, withAlpha('#94a3b8', 0.18), -2, 0.6, 0),
        ],
        glyphs: [
          makeGlyph('🏔️', '8%', 108, 18, 0.16, -4, 0.8),
          makeGlyph('🧭', '84%', 110, 16, 0.65, 8, 0.72),
        ],
      };
    default:
      return {
        weatherOpacity: 0.36,
        sun: { right: '12%', top: '13%', size: 30, color: 'rgba(255,255,255,0.6)' },
        clouds: [
          makeCloud('10%', '12%', 64, 18, 0.88),
          makeCloud('74%', '16%', 56, 16, 0.82),
        ],
        hills: [
          makeHill('0%', '36%', 108, 72, facade.hillB, facade.hillC, -8, 0.92),
          makeHill('76%', '32%', 128, 84, facade.hillA, facade.hillB, 8, 0.92),
        ],
        strokes: [
          makeStroke('18%', '68%', 140, 10, accentSoft, 0, 0.52, 0),
        ],
        glyphs: [],
      };
  }
};

const getZoneVisualTokens = (config, isDark) => {
  const {
    id,
    key,
    subtitle,
    accent,
    path,
    bgGrad,
    titleGrad,
    border,
    glow,
    ground,
  } = config;

  if (isDark) {
    const darkScene = getDarkScene(key, accent, bgGrad, border, ground);
    return {
      cardBackground: darkScene.cardBackground,
      cardBoxShadow: `inset 0 0 96px ${glow}, 0 30px 60px rgba(2, 6, 23, 0.42), 0 0 0 1.5px ${border}40`,
      edgeLine: `linear-gradient(90deg,transparent,${accent}75,transparent)`,
      titleBackground: `linear-gradient(135deg, ${titleGrad?.[0]}, ${titleGrad?.[1]})`,
      titleTextFill: 'transparent',
      titleTextColor: null,
      titleShadow: 'none',
      titleFilter: `drop-shadow(0 0 20px ${accent}45)`,
      captionColor: mixColors(accent, '#f8fafc', 0.16),
      chipBackground: withAlpha(accent, 0.12),
      chipBorder: withAlpha(border, 0.32),
      chipText: accent,
      bodyOverlay: darkScene.bodyOverlay,
      ground: darkScene.ground,
      groundDeck: 'transparent',
      groundDeckBorder: 'transparent',
      pathGlow: path,
      pathGlowOpacity: 0.18,
      idlePath: '#1e293b',
      idlePathOpacity: 0.6,
      idlePathWidth: 2.2,
      litPath: path,
      litPathWidth: 3,
      litPathOpacity: 0.88,
      dash: '5 7',
      deckText: accent,
      facadeLabel: subtitle,
      brightMode: false,
      cardBorder: `1.5px solid ${border}30`,
      weatherOpacity: darkScene.weatherOpacity ?? 0.9,
      darkScene,
    };
  }

  const facade = getLightFacade(key);
  const brightScene = getBrightScene(key, facade, accent);
  return {
    cardBackground: `linear-gradient(180deg, ${facade.surface[0]} 0%, ${facade.surface[1]} 56%, ${facade.surface[2]} 100%)`,
    cardBoxShadow: `0 26px 54px rgba(15, 23, 42, 0.1), inset 0 1px 0 rgba(255,255,255,0.78)`,
    edgeLine: `linear-gradient(90deg, transparent, ${withAlpha(accent, 0.4)}, transparent)`,
    titleBackground: 'none',
    titleTextFill: null,
    titleTextColor: facade.title,
    titleShadow: '0 1px 0 rgba(255,255,255,0.7)',
    titleFilter: 'none',
    captionColor: facade.caption,
    chipBackground: facade.chipBg,
    chipBorder: withAlpha(accent, 0.22),
    chipText: facade.chipText,
    bodyOverlay: `radial-gradient(ellipse 85% 52% at 50% 18%, ${withAlpha(accent, 0.14)}, transparent 68%)`,
    ground: `linear-gradient(180deg, ${facade.hillA} 0%, ${facade.hillB} 54%, ${facade.hillC} 100%)`,
    groundDeck: facade.deck,
    groundDeckBorder: facade.deckBorder,
    pathGlow: withAlpha(path, 0.34),
    pathGlowOpacity: 1,
    idlePath: mixColors(facade.idlePath, '#64748b', 0.18),
    idlePathOpacity: 0.94,
    idlePathWidth: 2.35,
    litPath: path,
    litPathWidth: 3.05,
    litPathOpacity: 0.94,
    dash: '4 8',
    deckText: facade.caption,
    facadeLabel: `Style ${id} | ${facade.label}`,
    brightMode: true,
    cardBorder: `1px solid ${withAlpha(facade.rim, 0.75)}`,
    weatherOpacity: brightScene.weatherOpacity ?? 0.36,
    cloudColor: facade.cloud,
    facade,
    brightScene,
  };
};

const BrightSkyDetails = ({ scene, facade, accent, isMobile }) => {
  if (!facade || !scene) return null;

  return (
    <>
      <div
        className="absolute inset-x-8 top-8 h-24 rounded-full blur-3xl"
        style={{ background: withAlpha(accent, 0.18) }}
      />
      {scene.sun ? (
        <div
          className="absolute rounded-full blur-[1px]"
          style={{
            right: scene.sun.right,
            top: scene.sun.top,
            width: isMobile ? scene.sun.size * 0.78 : scene.sun.size,
            height: isMobile ? scene.sun.size * 0.78 : scene.sun.size,
            background: scene.sun.color,
            boxShadow: `0 0 0 10px ${withAlpha(accent, 0.08)}`,
          }}
        />
      ) : null}

      {(scene.clouds || []).map((cloud, index) => (
        <div
          key={`cloud-${index}`}
          className="absolute rounded-full"
          style={{
            left: cloud.left,
            top: cloud.top,
            width: isMobile ? cloud.width * 0.74 : cloud.width,
            height: isMobile ? cloud.height * 0.74 : cloud.height,
            background: facade.cloudColor,
            opacity: cloud.opacity,
          }}
        />
      ))}

      {(scene.hills || []).map((hill, index) => (
        <div
          key={`hill-${index}`}
          className="absolute rounded-[999px_999px_0_0]"
          style={{
            left: hill.left,
            top: hill.top,
            width: isMobile ? hill.width * 0.76 : hill.width,
            height: isMobile ? hill.height * 0.76 : hill.height,
            background: `linear-gradient(180deg, ${hill.from}, ${hill.to})`,
            transform: `rotate(${hill.rotate}deg)`,
            opacity: hill.opacity,
          }}
        />
      ))}

      {(scene.strokes || []).map((stroke, index) => (
        <div
          key={`stroke-${index}`}
          className="absolute rounded-full"
          style={{
            left: stroke.left,
            top: stroke.top,
            width: isMobile ? stroke.width * 0.76 : stroke.width,
            height: isMobile ? stroke.height * 0.76 : stroke.height,
            background: stroke.color,
            opacity: stroke.opacity,
            transform: `rotate(${stroke.rotate}deg)`,
            filter: stroke.blur ? `blur(${stroke.blur}px)` : undefined,
          }}
        />
      ))}

      {(scene.glyphs || []).map((glyph, index) => (
        <motion.span
          key={`glyph-${index}`}
          className="absolute select-none pointer-events-none"
          style={{
            left: glyph.left,
            bottom: glyph.bottom,
            fontSize: isMobile ? glyph.size * 0.78 : glyph.size,
            transform: `rotate(${glyph.rotate}deg)`,
            opacity: glyph.opacity,
            filter: 'drop-shadow(0 4px 10px rgba(15, 23, 42, 0.08))',
          }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3.2, delay: glyph.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          {glyph.glyph}
        </motion.span>
      ))}
    </>
  );
};

const DarkSceneDetails = ({ scene, accent, isMobile }) => {
  if (!scene) return null;

  return (
    <>
      <div
        className="absolute inset-x-10 top-6 h-28 rounded-full blur-3xl"
        style={{ background: withAlpha(accent, 0.08) }}
      />

      {scene.moon ? (
        <motion.div
          className="absolute rounded-full"
          style={{
            right: scene.moon.right,
            top: scene.moon.top,
            width: isMobile ? scene.moon.size * 0.8 : scene.moon.size,
            height: isMobile ? scene.moon.size * 0.8 : scene.moon.size,
            background: scene.moon.color,
            boxShadow: `0 0 0 12px ${scene.moon.ring || withAlpha('#ffffff', 0.06)}`,
          }}
          animate={{ opacity: [0.88, 1, 0.88] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      ) : null}

      {(scene.stars || []).map((star, index) => (
        <motion.div
          key={`star-${index}`}
          className="absolute rounded-full"
          style={{
            left: star.left,
            top: star.top,
            width: isMobile ? star.size * 0.9 : star.size,
            height: isMobile ? star.size * 0.9 : star.size,
            background: star.color,
            opacity: star.opacity,
            filter: star.blur ? `blur(${star.blur}px)` : undefined,
          }}
          animate={{ opacity: [star.opacity * 0.45, star.opacity, star.opacity * 0.45], scale: [1, 1.15, 1] }}
          transition={{ duration: 3.4, delay: star.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {(scene.bands || []).map((band, index) => (
        <motion.div
          key={`band-${index}`}
          className="absolute rounded-full"
          style={{
            left: band.left,
            top: band.top,
            width: isMobile ? band.width * 0.78 : band.width,
            height: isMobile ? band.height * 0.78 : band.height,
            background: band.color,
            opacity: band.opacity,
            transform: `rotate(${band.rotate}deg)`,
            filter: `blur(${band.blur || 8}px)`,
          }}
          animate={{ x: [0, 6, 0], opacity: [band.opacity * 0.75, band.opacity, band.opacity * 0.75] }}
          transition={{ duration: 5.8, delay: index * 0.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {(scene.hills || []).map((hill, index) => (
        <div
          key={`dark-hill-${index}`}
          className="absolute rounded-[999px_999px_0_0]"
          style={{
            left: hill.left,
            top: hill.top,
            width: isMobile ? hill.width * 0.76 : hill.width,
            height: isMobile ? hill.height * 0.76 : hill.height,
            background: `linear-gradient(180deg, ${hill.from}, ${hill.to})`,
            transform: `rotate(${hill.rotate}deg)`,
            opacity: hill.opacity,
          }}
        />
      ))}

      {(scene.peaks || []).map((peak, index) => (
        <div
          key={`peak-${index}`}
          className="absolute"
          style={{
            left: peak.left,
            bottom: peak.bottom,
            width: isMobile ? peak.width * 0.76 : peak.width,
            height: isMobile ? peak.height * 0.76 : peak.height,
            background: `linear-gradient(180deg, ${peak.from}, ${peak.to})`,
            clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
            opacity: peak.opacity,
            filter: peak.blur ? `blur(${peak.blur}px)` : undefined,
          }}
        />
      ))}

      {(scene.columns || []).map((column, index) => (
        <div
          key={`column-${index}`}
          className="absolute"
          style={{
            left: column.left,
            bottom: column.bottom,
            width: isMobile ? column.width * 0.78 : column.width,
            height: isMobile ? column.height * 0.78 : column.height,
            background: column.color,
            opacity: column.opacity,
            borderRadius: column.radius,
            transform: `rotate(${column.rotate}deg)`,
            boxShadow: `0 0 18px ${withAlpha(accent, 0.04)}`,
          }}
        />
      ))}

      {(scene.motifs || []).map((motif, index) => {
        const width = isMobile ? motif.width * 0.78 : motif.width;
        const height = isMobile ? motif.height * 0.78 : motif.height;

        const commonStyle = {
          left: motif.left,
          bottom: motif.bottom,
          width,
          height,
          opacity: motif.opacity ?? 0.78,
          transform: motif.rotate ? `rotate(${motif.rotate}deg)` : undefined,
        };

        if (motif.type === 'palm') {
          return (
            <div key={`motif-${index}`} className="absolute pointer-events-none" style={commonStyle}>
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
                style={{
                  width: Math.max(5, width * 0.08),
                  height: height * 0.58,
                  background: `linear-gradient(180deg, ${motif.trunk}, ${mixColors(motif.trunk, '#020617', 0.4)})`,
                }}
              />
              {[[-32, 8], [-12, -6], [12, 6], [30, -8]].map(([rotation, offset], frondIndex) => (
                <div
                  key={frondIndex}
                  className="absolute rounded-full"
                  style={{
                    left: `calc(50% + ${offset}px)`,
                    top: height * 0.1,
                    width: width * 0.42,
                    height: height * 0.16,
                    background: `linear-gradient(90deg, ${motif.leaves}, ${mixColors(motif.leaves, '#bbf7d0', 0.14)})`,
                    transform: `translateX(-50%) rotate(${rotation}deg)`,
                    filter: `drop-shadow(0 0 10px ${motif.glow || withAlpha(motif.leaves, 0.08)})`,
                  }}
                />
              ))}
            </div>
          );
        }

        if (motif.type === 'waterfall') {
          return (
            <div key={`motif-${index}`} className="absolute pointer-events-none" style={commonStyle}>
              <div
                className="absolute inset-y-0 right-0 rounded-[28px_28px_12px_12px]"
                style={{
                  width: width * 0.55,
                  background: `linear-gradient(180deg, ${motif.cliff}, ${mixColors(motif.cliff, '#020617', 0.34)})`,
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  left: width * 0.56,
                  top: height * 0.1,
                  width: width * 0.14,
                  height: height * 0.8,
                  background: `linear-gradient(180deg, rgba(255,255,255,0.82), ${motif.water}, rgba(255,255,255,0.24))`,
                  boxShadow: `0 0 18px ${withAlpha(motif.water, 0.34)}`,
                }}
              />
              <div
                className="absolute rounded-full blur-md"
                style={{
                  left: width * 0.44,
                  bottom: height * 0.04,
                  width: width * 0.38,
                  height: height * 0.16,
                  background: `radial-gradient(circle, ${withAlpha(motif.foam, 0.86)}, ${withAlpha(motif.water, 0.18)})`,
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  right: width * 0.02,
                  top: height * 0.04,
                  width: width * 0.22,
                  height: height * 0.18,
                  background: `radial-gradient(circle, ${motif.foliage}, transparent 72%)`,
                  filter: 'blur(1px)',
                }}
              />
            </div>
          );
        }

        if (motif.type === 'wave') {
          return (
            <div key={`motif-${index}`} className="absolute pointer-events-none overflow-hidden rounded-[999px_999px_0_0]" style={commonStyle}>
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(180deg, ${withAlpha(motif.water, 0.14)}, ${withAlpha(motif.water, 0.42)})` }}
              />
              <motion.div
                className="absolute left-[12%] right-[12%] top-[28%] h-[10%] rounded-full"
                style={{ background: withAlpha(motif.foam, 0.6), filter: 'blur(2px)' }}
                animate={{ x: [0, -10, 0] }}
                transition={{ duration: 4.4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute left-[8%] right-[8%] top-[52%] h-[8%] rounded-full"
                style={{ background: withAlpha(motif.foam, 0.34), filter: 'blur(2px)' }}
                animate={{ x: [0, 10, 0] }}
                transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          );
        }

        if (motif.type === 'cactus') {
          return (
            <div key={`motif-${index}`} className="absolute pointer-events-none" style={commonStyle}>
              <div
                className="absolute bottom-0 left-[42%] rounded-[16px_16px_10px_10px]"
                style={{
                  width: width * 0.2,
                  height: height * 0.72,
                  background: `linear-gradient(180deg, ${motif.body}, ${mixColors(motif.body, '#020617', 0.34)})`,
                  boxShadow: `0 0 0 1px ${withAlpha(motif.edge, 0.12)}`,
                }}
              />
              <div
                className="absolute bottom-[28%] left-[18%] rounded-full"
                style={{
                  width: width * 0.16,
                  height: height * 0.28,
                  background: motif.body,
                }}
              />
              <div
                className="absolute bottom-[44%] left-[28%] rounded-full"
                style={{
                  width: width * 0.2,
                  height: height * 0.1,
                  background: motif.body,
                }}
              />
              <div
                className="absolute bottom-[40%] right-[16%] rounded-full"
                style={{
                  width: width * 0.16,
                  height: height * 0.22,
                  background: motif.body,
                }}
              />
              <div
                className="absolute bottom-[52%] right-[26%] rounded-full"
                style={{
                  width: width * 0.18,
                  height: height * 0.1,
                  background: motif.body,
                }}
              />
            </div>
          );
        }

        if (motif.type === 'pine') {
          return (
            <div key={`motif-${index}`} className="absolute pointer-events-none" style={commonStyle}>
              <div
                className="absolute bottom-0 left-[43%]"
                style={{ width: width * 0.12, height: height * 0.2, background: motif.trunk }}
              />
              {[0, 1, 2].map((tier) => (
                <div
                  key={tier}
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{
                    bottom: height * (0.16 + tier * 0.16),
                    width: width * (0.7 - tier * 0.12),
                    height: height * 0.24,
                    background: `linear-gradient(180deg, ${tier % 2 === 0 ? motif.foliageAlt : motif.foliage}, ${motif.foliage})`,
                    clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
                  }}
                />
              ))}
            </div>
          );
        }

        if (motif.type === 'planet') {
          return (
            <div key={`motif-${index}`} className="absolute pointer-events-none" style={commonStyle}>
              <div
                className="absolute inset-[12%] rounded-full"
                style={{
                  background: `radial-gradient(circle at 35% 30%, ${withAlpha('#ffffff', 0.16)}, ${motif.planet} 48%, ${mixColors(motif.planet, '#020617', 0.3)} 100%)`,
                  boxShadow: `0 0 30px ${motif.glow}`,
                }}
              />
              <div
                className="absolute left-[4%] right-[4%] top-[44%] h-[10%] rounded-full"
                style={{
                  border: `2px solid ${withAlpha(motif.ring, 0.72)}`,
                  transform: 'rotate(-14deg)',
                }}
              />
              {motif.moon ? (
                <div
                  className="absolute rounded-full"
                  style={{
                    right: width * 0.02,
                    top: height * 0.08,
                    width: width * 0.18,
                    height: width * 0.18,
                    background: motif.moon,
                    boxShadow: `0 0 18px ${withAlpha(motif.moon, 0.3)}`,
                  }}
                />
              ) : null}
            </div>
          );
        }

        if (motif.type === 'ruin') {
          return (
            <div key={`motif-${index}`} className="absolute pointer-events-none" style={commonStyle}>
              <div className="absolute bottom-0 left-[8%] right-[8%] h-[18%] rounded-md" style={{ background: motif.stone }} />
              <div className="absolute bottom-[18%] left-[18%] w-[16%] h-[54%] rounded-t-md" style={{ background: motif.stone }} />
              <div className="absolute bottom-[18%] left-[42%] w-[16%] h-[62%] rounded-t-md" style={{ background: motif.stone }} />
              <div className="absolute bottom-[18%] right-[18%] w-[16%] h-[50%] rounded-t-md" style={{ background: motif.stone }} />
              <div
                className="absolute left-[12%] right-[12%] bottom-[64%] h-[12%] rounded-md"
                style={{ background: `linear-gradient(180deg, ${motif.edge}, ${motif.stone})`, opacity: 0.78 }}
              />
            </div>
          );
        }

        if (motif.type === 'rock-spire') {
          return (
            <div key={`motif-${index}`} className="absolute pointer-events-none" style={commonStyle}>
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(180deg, ${motif.edge}, ${motif.rock} 24%, ${mixColors(motif.rock, '#020617', 0.28)} 100%)`,
                  clipPath: 'polygon(50% 0%, 72% 22%, 100% 100%, 0% 100%, 26% 20%)',
                }}
              />
            </div>
          );
        }

        if (motif.type === 'canopy') {
          const isLeft = motif.side !== 'right';
          return (
            <div key={`motif-${index}`} className="absolute pointer-events-none overflow-hidden" style={commonStyle}>
              {[0, 1, 2, 3].map((blobIndex) => (
                <div
                  key={blobIndex}
                  className="absolute rounded-full"
                  style={{
                    width: width * (0.42 + blobIndex * 0.08),
                    height: height * (0.34 + blobIndex * 0.05),
                    [isLeft ? 'left' : 'right']: `${blobIndex * 10}%`,
                    top: `${blobIndex * 8}%`,
                    background: `radial-gradient(circle, ${blobIndex % 2 === 0 ? motif.leaves : motif.leavesAlt}, transparent 72%)`,
                    filter: 'blur(1px)',
                  }}
                />
              ))}
            </div>
          );
        }

        return null;
      })}
    </>
  );
};

const ZoneContainer = ({ config, completedIds = new Set(), children, isMobile = false, nodes = [] }) => {
  const { isDark } = useTheme();
  const {
    id,
    key,
    name,
    subtitle,
    icon,
    weather,
    accent,
    decorations,
  } = config || {};
  const groundH = isMobile ? GROUND_H_MOBILE : GROUND_H_DESKTOP;

  const litPairs = useMemo(() => {
    const pairs = [];

    const isCompleted = (nodeId) => {
      if (!nodeId || !completedIds) return false;
      if (completedIds instanceof Set) return completedIds.has(nodeId);
      if (Array.isArray(completedIds)) return completedIds.includes(nodeId);
      return false;
    };

    for (let i = 0; i < 14; i++) {
      const aId = nodes?.[i]?.nodeId || `${id}_${String(i + 1).padStart(2, '0')}`;
      const bId = nodes?.[i + 1]?.nodeId || `${id}_${String(i + 2).padStart(2, '0')}`;
      pairs.push({ lit: isCompleted(aId) && isCompleted(bId) });
    }
    return pairs;
  }, [completedIds, id, nodes]);

  const segPaths = useMemo(() => {
    const pts = Array.from({ length: 15 }, (_, i) => getLocalNodePos(i));
    return pts.slice(0, 14).map((prev, i) => {
      const cur = pts[i + 1];
      const sameRow = Math.floor(i / 5) === Math.floor((i + 1) / 5);
      if (sameRow) {
        const mx = (prev.x + cur.x) / 2;
        return `M ${prev.x} ${prev.y} Q ${mx} ${prev.y - 18} ${cur.x} ${cur.y}`;
      }
      const cp1x = prev.x;
      const cp1y = prev.y + (cur.y - prev.y) * 0.45;
      const cp2x = cur.x;
      const cp2y = prev.y + (cur.y - prev.y) * 0.55;
      return `M ${prev.x} ${prev.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${cur.x} ${cur.y}`;
    });
  }, []);

  if (!config) return null;

  const tokens = getZoneVisualTokens(config, isDark);
  const titleFontSize = isMobile ? ((name?.length || 0) > 20 ? 18 : 22) : ((name?.length || 0) > 20 ? 22 : 26);

  return (
    <motion.div
      className="relative overflow-hidden"
      style={{ width: ZONE_W, height: ZONE_H, borderRadius: 24 }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: isMobile ? '-40px' : '-80px' }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: tokens.cardBackground,
          borderRadius: 24,
          boxShadow: tokens.cardBoxShadow,
          border: tokens.cardBorder,
          filter: isDark ? 'none' : 'saturate(1.02)',
        }}
      >
        <div
          className="absolute inset-0 rounded-[24px]"
          style={{ background: tokens.bodyOverlay }}
        />

        {tokens.brightMode ? (
          <BrightSkyDetails
            scene={tokens.brightScene}
            facade={tokens.facade}
            accent={accent}
            isMobile={isMobile}
          />
        ) : (
          <DarkSceneDetails
            scene={tokens.darkScene}
            accent={accent}
            isMobile={isMobile}
          />
        )}

        <div style={{ opacity: tokens.weatherOpacity }}>
          <WeatherEffect type={weather} zoneId={key || id} accent={accent} />
        </div>

        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: groundH,
            background: tokens.ground,
            borderRadius: '0 0 24px 24px',
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-12"
            style={{ background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.08))' }}
          />

          {tokens.brightMode ? (
            <div
              className="absolute left-6 right-6 bottom-4 flex items-center justify-between rounded-full px-5 py-2"
              style={{
                background: tokens.groundDeck,
                border: `1px solid ${tokens.groundDeckBorder}`,
                boxShadow: '0 12px 26px rgba(15, 23, 42, 0.08)',
              }}
            >
              <span
                className="rounded-full px-3 py-1 text-[10px] font-black"
                style={{
                  background: withAlpha(accent, 0.14),
                  color: tokens.chipText,
                }}
              >
                Start
              </span>
              <div className="flex items-center gap-4">
                {(decorations || []).slice(0, 4).map((d, i) => (
                  <span
                    key={i}
                    className="select-none"
                    style={{
                      fontSize: isMobile ? 14 : 18,
                      opacity: 0.88,
                      filter: 'drop-shadow(0 3px 6px rgba(15, 23, 42, 0.08))',
                    }}
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            (decorations || []).map((d, i) => (
              <span
                key={i}
                className="absolute select-none"
                style={{
                  fontSize: isMobile ? 14 : 20,
                  bottom: isMobile ? 10 : 14,
                  left: `${15 + i * 22}%`,
                  opacity: 0.7,
                  transform: `rotate(${i % 2 === 0 ? -8 : 6}deg)`,
                }}
              >
                {d}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="absolute top-0 left-0 right-0 px-4 pt-4 pb-2 z-20 pointer-events-none sm:px-6 sm:pt-5 sm:pb-2">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-xl mb-1.5"
          style={{
            background: tokens.chipBackground,
            border: `1px solid ${tokens.chipBorder}`,
            maxWidth: '100%',
            boxShadow: tokens.brightMode ? '0 10px 24px rgba(15, 23, 42, 0.08)' : 'none',
          }}
        >
          <span className="text-base select-none">{icon}</span>
          <p
            className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] truncate"
            style={{ color: tokens.chipText }}
          >
            {tokens.facadeLabel}
          </p>
        </div>

        <h2
          className="font-black leading-none tracking-tight select-none break-words"
          style={{
            fontSize: titleFontSize,
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
            background: tokens.titleBackground,
            WebkitBackgroundClip: tokens.titleTextFill ? 'text' : undefined,
            WebkitTextFillColor: tokens.titleTextFill,
            color: tokens.titleTextColor || undefined,
            textShadow: tokens.titleShadow,
            filter: tokens.titleFilter,
            maxWidth: isMobile ? 'min(72vw, 320px)' : 'none',
          }}
        >
          {name}
        </h2>

        <p
          className="mt-1 text-[10px] sm:text-[11px] font-medium"
          style={{ color: tokens.captionColor }}
        >
          {subtitle}
        </p>
      </div>

      <svg
        className="absolute inset-0 pointer-events-none z-10"
        style={{ width: ZONE_W, height: ZONE_H, overflow: 'visible' }}
      >
        <defs>
          <filter id={`pg-${id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={tokens.brightMode ? '4.5' : '3.5'} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {segPaths.map((d, i) => {
          const lit = litPairs[i]?.lit;
          return (
            <g key={i}>
              {lit ? (
                <path
                  d={d}
                  fill="none"
                  stroke={tokens.pathGlow}
                  strokeWidth={tokens.brightMode ? 11 : 10}
                  strokeOpacity={tokens.pathGlowOpacity}
                  filter={`url(#pg-${id})`}
                />
              ) : null}
              <path
                d={d}
                fill="none"
                stroke={lit ? tokens.litPath : tokens.idlePath}
                strokeWidth={lit ? tokens.litPathWidth : tokens.idlePathWidth}
                strokeOpacity={lit ? tokens.litPathOpacity : tokens.idlePathOpacity}
                strokeLinecap="round"
                strokeDasharray={lit ? undefined : tokens.dash}
              />
              {lit ? (
                <circle r={tokens.brightMode ? '4' : '4.5'} fill={tokens.litPath} opacity=".9">
                  <animateMotion dur={`${2.5 + i * 0.05}s`} repeatCount="indefinite" path={d} />
                </circle>
              ) : null}
            </g>
          );
        })}
      </svg>

      <div className="absolute inset-0 z-30">
        {children}
      </div>

      <div
        className="absolute bottom-0 left-6 right-6 h-px z-40 sm:left-8 sm:right-8"
        style={{ background: tokens.edgeLine }}
      />
    </motion.div>
  );
};

export default React.memo(ZoneContainer);

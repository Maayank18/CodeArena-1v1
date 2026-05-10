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
    return {
      cardBackground: `linear-gradient(175deg, ${bgGrad?.[0]} 0%, ${bgGrad?.[1]} 55%, ${bgGrad?.[2]} 100%)`,
      cardBoxShadow: `inset 0 0 80px ${glow}, 0 0 0 1.5px ${border}40`,
      edgeLine: `linear-gradient(90deg,transparent,${accent}60,transparent)`,
      titleBackground: `linear-gradient(135deg, ${titleGrad?.[0]}, ${titleGrad?.[1]})`,
      titleTextFill: 'transparent',
      titleTextColor: null,
      titleShadow: 'none',
      titleFilter: `drop-shadow(0 0 20px ${accent}40)`,
      captionColor: accent,
      chipBackground: `${accent}18`,
      chipBorder: `${border}35`,
      chipText: accent,
      bodyOverlay: `radial-gradient(ellipse 80% 45% at 50% 20%, ${accent}14, transparent 65%)`,
      ground,
      groundDeck: 'transparent',
      groundDeckBorder: 'transparent',
      pathGlow: path,
      pathGlowOpacity: 0.15,
      idlePath: '#1e293b',
      idlePathOpacity: 0.55,
      idlePathWidth: 2.2,
      litPath: path,
      litPathWidth: 3,
      litPathOpacity: 0.85,
      dash: '5 7',
      deckText: accent,
      facadeLabel: subtitle,
      brightMode: false,
      cardBorder: `1.5px solid ${border}30`,
      weatherOpacity: 1,
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
        ) : null}

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

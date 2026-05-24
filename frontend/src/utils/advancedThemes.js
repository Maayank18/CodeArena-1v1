import cyberPunk from '../assets/cyber_punk.png';
import infernoArena from '../assets/inferno_arena.png';
import matrixProtocol from '../assets/matrix_protocol.png';
import samuraiShadow from '../assets/samurai_shadow.png';
import frostbyte from '../assets/frostbyte.png';

export const ADVANCED_THEME_DEFINITIONS = [
  {
    id: 'cyberpunk',
    customizationId: 'cyber_punk',
    name: 'Cyber Punk',
    image: cyberPunk,
    isPremium: true,
    badgeClassName: 'advanced-theme-indicator advanced-theme-indicator-cyberpunk',
    icon: 'CP',
  },
  {
    id: 'inferno',
    customizationId: 'inferno_arena',
    name: 'Inferno Arena',
    image: infernoArena,
    isPremium: true,
    badgeClassName: 'advanced-theme-indicator advanced-theme-indicator-inferno',
    icon: 'IF',
  },
  {
    id: 'matrix',
    customizationId: 'matrix_protocol',
    name: 'Matrix Protocol',
    image: matrixProtocol,
    isPremium: true,
    badgeClassName: 'advanced-theme-indicator advanced-theme-indicator-matrix',
    icon: 'MX',
  },
  {
    id: 'samurai',
    customizationId: 'samurai_shadow',
    name: 'Samurai Shadow',
    image: samuraiShadow,
    isPremium: true,
    badgeClassName: 'advanced-theme-indicator advanced-theme-indicator-samurai',
    icon: 'SM',
  },
  {
    id: 'frostbyte',
    customizationId: 'frostbyte',
    name: 'Frostbyte',
    image: frostbyte,
    isPremium: true,
    badgeClassName: 'advanced-theme-indicator advanced-theme-indicator-frostbyte',
    icon: 'FB',
  },
];

export const SUPPORTED_ADVANCED_THEME_IDS = ADVANCED_THEME_DEFINITIONS.map((theme) => theme.id);

export const ADVANCED_THEME_BY_ID = ADVANCED_THEME_DEFINITIONS.reduce((acc, theme) => {
  acc[theme.id] = theme;
  return acc;
}, {});

export const getAdvancedThemeMeta = (themeId) => {
  if (!themeId) {
    return null;
  }

  return ADVANCED_THEME_BY_ID[themeId] || null;
};

export const getAdvancedThemeId = (themeId) => (
  typeof themeId === 'string' && SUPPORTED_ADVANCED_THEME_IDS.includes(themeId.trim())
    ? themeId.trim()
    : null
);

export const getAdvancedThemeIdFromUser = (user) => getAdvancedThemeId(user?.customization?.advancedTheme);

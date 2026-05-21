import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  // Legacy Bright Theme Config (for quick reversal)
  // darkMode: 'media',
  darkMode: 'class',

  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],

  theme: {
    extend: {
      colors: {
        dark: '#1e1e1e',
        darkHover: '#2d2d2d',
        accent: '#4aee88',
      },
      animation: {
        'badge-orbit': 'badgeOrbitLoop 12s ease-in-out infinite',
      },
      keyframes: {
        badgeOrbitLoop: {
          '0%': { transform: 'rotateY(0deg) rotateX(4deg) rotateZ(-1deg) scale(0.98)' },
          '25%': { transform: 'rotateY(95deg) rotateX(-1deg) rotateZ(1deg) scale(1)' },
          '50%': { transform: 'rotateY(180deg) rotateX(-4deg) rotateZ(0deg) scale(1.015)' },
          '75%': { transform: 'rotateY(275deg) rotateX(2deg) rotateZ(-1deg) scale(1)' },
          '100%': { transform: 'rotateY(360deg) rotateX(4deg) rotateZ(-1deg) scale(0.98)' },
        }
      }
    },
  },

  plugins: [typography],
};

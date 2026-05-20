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
        'badge-orbit': 'badgeOrbitLoop 8s linear infinite',
      },
      keyframes: {
        badgeOrbitLoop: {
          '0%': { transform: 'rotateY(0deg) rotateX(3deg)' },
          '50%': { transform: 'rotateY(180deg) rotateX(-3deg)' },
          '100%': { transform: 'rotateY(360deg) rotateX(3deg)' },
        }
      }
    },
  },

  plugins: [typography],
};

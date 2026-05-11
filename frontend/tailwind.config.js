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
    },
  },

  plugins: [typography],
};

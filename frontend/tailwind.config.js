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
        frostbyte: {
          bg: '#020617',
          surface: '#060B19',
          glow: '#22D3EE',
          accent: '#06B6D4',
          text: '#e0f2fe',
          muted: '#7dd3fc',
        },
      },
      animation: {
        'badge-orbit': 'badgeOrbitLoop 12s ease-in-out infinite',
        'snowflake-float': 'snowflakeFloat 8s linear infinite',
        'frost-pulse': 'frostPulse 3s ease-in-out infinite',
      },
      keyframes: {
        badgeOrbitLoop: {
          '0%': { transform: 'rotateY(0deg) rotateX(4deg) rotateZ(-1deg) scale(0.98)' },
          '25%': { transform: 'rotateY(95deg) rotateX(-1deg) rotateZ(1deg) scale(1)' },
          '50%': { transform: 'rotateY(180deg) rotateX(-4deg) rotateZ(0deg) scale(1.015)' },
          '75%': { transform: 'rotateY(275deg) rotateX(2deg) rotateZ(-1deg) scale(1)' },
          '100%': { transform: 'rotateY(360deg) rotateX(4deg) rotateZ(-1deg) scale(0.98)' },
        },
        snowflakeFloat: {
          '0%': { transform: 'translateY(-10px) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '0.6' },
          '90%': { opacity: '0.6' },
          '100%': { transform: 'translateY(100vh) rotate(360deg)', opacity: '0' },
        },
        frostPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(34, 211, 238, 0.2)' },
          '50%': { boxShadow: '0 0 35px rgba(34, 211, 238, 0.4)' },
        },
      }
    },
  },

  plugins: [typography],
};

// Version-2.0
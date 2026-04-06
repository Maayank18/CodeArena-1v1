/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // ✅ REQUIRED FIX

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        dark: '#1e1e1e',
        darkHover: '#2d2d2d',
        accent: '#4aee88',
      }
    },
  },

  plugins: [],
}
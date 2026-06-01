// ═══════════════════════════════════════════════════════════════════════════
// FIX 2B — src/components/ThemeToggle.jsx
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`
        relative flex items-center justify-center w-9 h-9 rounded-xl
        transition-all duration-200
        bg-slate-100 hover:bg-slate-200 text-slate-700
        dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300
        border border-slate-200 dark:border-slate-700
        ${className}
      `}
    >
      {isDark
        ? <Sun  size={16} className="text-amber-400" />
        : <Moon size={16} className="text-slate-600" />
      }
    </button>
  );
};

export default ThemeToggle;


// ═══════════════════════════════════════════════════════════════════════════
// FIX 2C — main.jsx / index.jsx  (wrap app with ThemeProvider)
// ═══════════════════════════════════════════════════════════════════════════
//
// import { ThemeProvider } from './context/ThemeContext';
//
// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <ThemeProvider>        ← ADD THIS
//       <BrowserRouter>
//         <App />
//       </BrowserRouter>
//     </ThemeProvider>       ← AND THIS
//   </React.StrictMode>
// );


// ═══════════════════════════════════════════════════════════════════════════
// FIX 2D — tailwind.config.js  (enable class-based dark mode)
// ═══════════════════════════════════════════════════════════════════════════
//
// module.exports = {
//   darkMode: 'class',   ← THIS LINE IS REQUIRED
//   content: ['./src/**/*.{js,jsx,ts,tsx}'],
//   theme: { extend: {} },
//   plugins: [],
// };


// ═══════════════════════════════════════════════════════════════════════════
// FIX 2E — Refactored Campaign layout <div> wrappers
// Replace hardcoded hex backgrounds with semantic dark: variants.
// Apply these className patterns throughout Campaign.jsx and its children.
// ═══════════════════════════════════════════════════════════════════════════

/*

── Page root wrapper ────────────────────────────────────────────────────────
BEFORE:  className="h-screen bg-[#060810] flex flex-col overflow-hidden"
AFTER:   className="h-screen bg-slate-50 dark:bg-[#060810] flex flex-col overflow-hidden"

── HUD / top bar ────────────────────────────────────────────────────────────
BEFORE:  className="... bg-[#07090f]/95 border-gray-800/40 ..."
AFTER:   className="... bg-white/95 dark:bg-[#07090f]/95 border-slate-200/80 dark:border-gray-800/40 ..."

── Zone card background ─────────────────────────────────────────────────────
BEFORE:  style={{ background: `linear-gradient(155deg, ${dark-hex}...)` }}
AFTER:   Keep the gradient for dark mode; add a light-mode fallback:
         style={{
           background: isDark
             ? `linear-gradient(155deg, ${theme.bgGrad[0]}, ${theme.bgGrad[1]}, ${theme.bgGrad[2]})`
             : `linear-gradient(155deg, ${theme.bgGrad[0]}cc, ${theme.bgGrad[1]}cc, ${theme.bgGrad[2]}cc)`,
         }}

── Text ─────────────────────────────────────────────────────────────────────
BEFORE:  className="text-white"
AFTER:   className="text-slate-900 dark:text-white"

BEFORE:  className="text-gray-500"
AFTER:   className="text-slate-500 dark:text-gray-500"

BEFORE:  className="text-gray-600"
AFTER:   className="text-slate-400 dark:text-gray-600"

── Panel / card backgrounds ─────────────────────────────────────────────────
BEFORE:  className="bg-gray-900/50"
AFTER:   className="bg-slate-100 dark:bg-gray-900/50"

BEFORE:  className="bg-[#0a0c12]"
AFTER:   className="bg-white dark:bg-[#0a0c12]"

── Borders ──────────────────────────────────────────────────────────────────
BEFORE:  className="border-gray-800/50"
AFTER:   className="border-slate-200 dark:border-gray-800/50"

── Input / editor background ────────────────────────────────────────────────
BEFORE:  className="bg-gray-900/80 border-gray-700/60 text-gray-300"
AFTER:   className="bg-slate-100 dark:bg-gray-900/80 border-slate-300 dark:border-gray-700/60 text-slate-700 dark:text-gray-300"

── Navbar usage example (add ThemeToggle to Navbar.jsx) ─────────────────────
BEFORE:  <div className="flex items-center gap-3">
           <UserAvatar />
         </div>
AFTER:   <div className="flex items-center gap-3">
           <ThemeToggle />
           <UserAvatar />
         </div>

*/
// V 1.5

// Version-2.0
// // FILE: frontend/src/components/Navbar.jsx
// // PRODUCTION-OPTIMIZED
// import React, { useMemo, useCallback } from 'react';
// import { Logo } from './Logo';
// import Avatar from './Avatar';
// import { LogOut, Moon, Sun } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
// import { useTheme } from '../context/ThemeContext';
// import { getLevelInfo } from '../utils/levelSystem';

// const Navbar = ({ user, onLogout }) => {
//   const navigate = useNavigate();
//   const { theme, toggleTheme } = useTheme();

//   // ✅ PERFORMANCE: Memoize level calculation
//   const levelInfo = useMemo(() => {
//     return getLevelInfo(user?.rating || 1000);
//   }, [user?.rating]);

//   // ✅ PERFORMANCE: Memoize navigation handler
//   const handleLogoClick = useCallback(() => {
//     navigate('/dashboard');
//   }, [navigate]);

//   return (
//     <nav className="h-[64px] sm:h-[72px] border-b border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-50 transition-all shadow-sm">
      
//       {/* Logo Section */}
//       <button 
//         onClick={handleLogoClick}
//         className="flex-shrink-0 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-accent rounded-lg"
//         aria-label="Go to Dashboard"
//       >
//         <Logo />
//       </button>

//       {/* Actions Section */}
//       <div className="flex items-center gap-3 sm:gap-8">
        
//         {/* Theme Toggle */}
//         <button 
//           onClick={toggleTheme} 
//           className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-2 rounded-full hover:bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-accent"
//           aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
//         >
//           {theme === 'dark' ? (
//             <Sun size={20} className="sm:w-[22px] sm:h-[22px]" />
//           ) : (
//             <Moon size={20} className="sm:w-[22px] sm:h-[22px]" />
//           )}
//         </button>

//         <div className="h-6 w-px bg-[var(--border-color)] sm:h-8" />

//         {/* User Profile Dropdown */}
//         <div className="flex items-center gap-3 sm:gap-4 group relative">
//           <Avatar 
//             username={user?.username} 
//             className="h-8 w-8 sm:h-10 sm:w-10 ring-2 ring-transparent group-hover:ring-accent transition-all" 
//           />
          
//           {/* User Info (Desktop) */}
//           <div className="hidden sm:flex flex-col">
//             <span className="text-sm sm:text-base font-bold text-[var(--text-primary)] leading-none mb-0.5 max-w-[120px] truncate">
//               {user?.username || 'Guest'}
//             </span>
//             <span className={`text-[10px] sm:text-xs font-semibold ${levelInfo.color}`}>
//               Level {levelInfo.level} {levelInfo.title}
//             </span>
//           </div>

//           {/* Dropdown Menu */}
//           <div className="absolute right-0 top-full mt-3 w-48 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">
            
//             {/* Mobile User Info */}
//             <div className="sm:hidden px-4 py-3 border-b border-[var(--border-color)]">
//               <p className="font-bold text-[var(--text-primary)] truncate">
//                 {user?.username}
//               </p>
//               <p className={`text-xs ${levelInfo.color} mt-1`}>
//                 Level {levelInfo.level} {levelInfo.title}
//               </p>
//             </div>
            
//             {/* Logout Button */}
//             <button 
//               onClick={onLogout}
//               className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-[var(--bg-primary)] flex items-center gap-3 transition-colors rounded-lg"
//             >
//               <LogOut size={16} />
//               <span>Sign Out</span>
//             </button>
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// };

// // ✅ PERFORMANCE: Memoize component
// export default React.memo(Navbar);





































// FILE: frontend/src/components/Navbar.jsx
import React, { useMemo, useCallback } from 'react';
import { Logo } from './Logo';
import Avatar from './Avatar';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { getLevelInfo } from '../utils/levelSystem';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const levelInfo = useMemo(() => {
    return getLevelInfo(user?.rating || 1000);
  }, [user?.rating]);

  const handleLogoClick = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  return (
    <nav
      className="
        h-[64px] sm:h-[72px]
        border-b
        px-4 sm:px-8
        flex items-center justify-between
        sticky top-0 z-50
        transition-all shadow-sm

        /* ✅ FIX: fallback + CSS variables */
        bg-white dark:bg-[var(--bg-secondary)]
        border-gray-200 dark:border-[var(--border-color)]
      "
    >
      
      {/* Logo Section */}
      <button 
        onClick={handleLogoClick}
        className="flex-shrink-0 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-accent rounded-lg"
        aria-label="Go to Dashboard"
      >
        <Logo />
      </button>

      {/* Actions Section */}
      <div className="flex items-center gap-3 sm:gap-8">
        
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme} 
          className="
            p-2 rounded-full transition-colors
            focus:outline-none focus:ring-2 focus:ring-accent

            /* ✅ FIX */
            text-gray-600 dark:text-[var(--text-secondary)]
            hover:text-gray-900 dark:hover:text-[var(--text-primary)]
            hover:bg-gray-100 dark:hover:bg-[var(--bg-primary)]
          "
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun size={20} className="sm:w-[22px] sm:h-[22px]" />
          ) : (
            <Moon size={20} className="sm:w-[22px] sm:h-[22px]" />
          )}
        </button>

        <div className="h-6 w-px bg-gray-200 dark:bg-[var(--border-color)] sm:h-8" />

        {/* User Profile Dropdown */}
        <div className="flex items-center gap-3 sm:gap-4 group relative">
          <Avatar 
            username={user?.username} 
            className="h-8 w-8 sm:h-10 sm:w-10 ring-2 ring-transparent group-hover:ring-accent transition-all" 
          />
          
          {/* User Info (Desktop) */}
          <div className="hidden sm:flex flex-col">
            <span className="text-sm sm:text-base font-bold leading-none mb-0.5 max-w-[120px] truncate text-gray-900 dark:text-[var(--text-primary)]">
              {user?.username || 'Guest'}
            </span>
            <span className={`text-[10px] sm:text-xs font-semibold ${levelInfo.color}`}>
              Level {levelInfo.level} {levelInfo.title}
            </span>
          </div>

          {/* Dropdown Menu */}
          <div
            className="
              absolute right-0 top-full mt-3 w-48 py-2
              border rounded-xl shadow-2xl
              opacity-0 invisible group-hover:opacity-100 group-hover:visible
              transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50

              /* ✅ FIX */
              bg-white dark:bg-[var(--bg-secondary)]
              border-gray-200 dark:border-[var(--border-color)]
            "
          >
            
            {/* Mobile User Info */}
            <div className="sm:hidden px-4 py-3 border-b border-gray-200 dark:border-[var(--border-color)]">
              <p className="font-bold truncate text-gray-900 dark:text-[var(--text-primary)]">
                {user?.username}
              </p>
              <p className={`text-xs ${levelInfo.color} mt-1`}>
                Level {levelInfo.level} {levelInfo.title}
              </p>
            </div>
            
            {/* Logout Button */}
            <button 
              onClick={onLogout}
              className="
                w-full px-4 py-3 text-left text-sm flex items-center gap-3 rounded-lg transition-colors

                text-red-500
                hover:bg-gray-100 dark:hover:bg-[var(--bg-primary)]
              "
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default React.memo(Navbar);
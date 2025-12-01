// RESPONSVIE NAVBAR CHANGE 
// import React from 'react';
// import { Logo } from './Logo';
// import Avatar from './Avatar';
// import { LogOut, Moon, Sun } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
// import { useTheme } from '../context/ThemeContext';
// import { getLevelInfo } from '../utils/levelSystem';

// const Navbar = ({ user, onLogout }) => {
//   const navigate = useNavigate();
//   const { theme, toggleTheme } = useTheme();

//   // Handle potential undefined user
//   const { level, title, color } = getLevelInfo(user?.rating);

//   return (
//     <nav className="h-[64px] sm:h-[72px] border-b border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-50 transition-all">
      
//       {/* 1. Logo Section */}
//       <div className="cursor-pointer flex-shrink-0" onClick={() => navigate('/dashboard')}>
//         {/* Pass responsive text size via class */}
//         <Logo className="text-[var(--text-primary)]" />
//       </div>

//       {/* 2. Actions Section */}
//       <div className="flex items-center gap-3 sm:gap-8">
        
//         {/* Theme Toggle */}
//         <button 
//             onClick={toggleTheme} 
//             className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-2 rounded-full hover:bg-[var(--bg-primary)]"
//         >
//           {theme === 'dark' ? <Sun size={20} className="sm:w-[22px] sm:h-[22px]" /> : <Moon size={20} className="sm:w-[22px] sm:h-[22px]" />}
//         </button>

//         <div className="h-6 w-px bg-[var(--border-color)] sm:h-8" />

//         {/* User Profile Dropdown */}
//         <div className="flex items-center gap-3 sm:gap-4 group relative cursor-pointer">
//           <Avatar username={user?.username} className="h-8 w-8 sm:h-10 sm:w-10" />
          
//           {/* 3. RESPONSIVE HIDE: Hide text on mobile to save space */}
//           <div className="hidden sm:flex flex-col">
//             <span className="text-sm sm:text-base font-bold text-[var(--text-primary)] leading-none mb-0.5 max-w-[120px] truncate">
//                 {user?.username || 'Guest'}
//             </span>
//             <span className={`text-[10px] sm:text-xs font-semibold ${color}`}>
//                Level {level} {title}
//             </span>
//           </div>

//           {/* Dropdown Menu (Positioned safely) */}
//           <div className="absolute right-0 top-full mt-2 w-48 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform translate-y-2 group-hover:translate-y-0 z-50">
//             {/* Mobile-only info inside dropdown since we hid it on the bar */}
//             <div className="sm:hidden px-4 py-2 border-b border-[var(--border-color)] mb-1">
//                 <p className="font-bold text-[var(--text-primary)] truncate">{user?.username}</p>
//                 <p className={`text-xs ${color}`}>Level {level} {title}</p>
//             </div>
            
//             <button 
//               onClick={onLogout}
//               className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-[var(--bg-primary)] flex items-center gap-3 transition-colors"
//             >
//               <LogOut size={16} /> Sign Out
//             </button>
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Navbar;



import React from 'react';
import { Logo } from './Logo';
import Avatar from './Avatar';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { getLevelInfo } from '../utils/levelSystem';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // --- FIX IS HERE ---
  // Changed 'user?.rating' to 'user?.elo' to match your Dashboard logic
  const { level, title, color } = getLevelInfo(user?.elo);

  return (
    <nav className="h-[64px] sm:h-[72px] border-b border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-50 transition-all">
      
      {/* 1. Logo Section */}
      <div className="cursor-pointer flex-shrink-0" onClick={() => navigate('/dashboard')}>
        <Logo className="text-[var(--text-primary)]" />
      </div>

      {/* 2. Actions Section */}
      <div className="flex items-center gap-3 sm:gap-8">
        
        {/* Theme Toggle */}
        <button 
            onClick={toggleTheme} 
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-2 rounded-full hover:bg-[var(--bg-primary)]"
        >
          {theme === 'dark' ? <Sun size={20} className="sm:w-[22px] sm:h-[22px]" /> : <Moon size={20} className="sm:w-[22px] sm:h-[22px]" />}
        </button>

        <div className="h-6 w-px bg-[var(--border-color)] sm:h-8" />

        {/* User Profile Dropdown */}
        <div className="flex items-center gap-3 sm:gap-4 group relative cursor-pointer">
          <Avatar username={user?.username} className="h-8 w-8 sm:h-10 sm:w-10" />
          
          {/* User Info */}
          <div className="hidden sm:flex flex-col">
            <span className="text-sm sm:text-base font-bold text-[var(--text-primary)] leading-none mb-0.5 max-w-[120px] truncate">
                {user?.username || 'Guest'}
            </span>
            <span className={`text-[10px] sm:text-xs font-semibold ${color}`}>
               Level {level} {title}
            </span>
          </div>

          {/* Dropdown Menu */}
          <div className="absolute right-0 top-full mt-2 w-48 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform translate-y-2 group-hover:translate-y-0 z-50">
            <div className="sm:hidden px-4 py-2 border-b border-[var(--border-color)] mb-1">
                <p className="font-bold text-[var(--text-primary)] truncate">{user?.username}</p>
                <p className={`text-xs ${color}`}>Level {level} {title}</p>
            </div>
            
            <button 
              onClick={onLogout}
              className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-[var(--bg-primary)] flex items-center gap-3 transition-colors"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
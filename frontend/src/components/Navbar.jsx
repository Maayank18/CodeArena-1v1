// import React from 'react';
// import { Logo } from './Logo';
// import Avatar from './Avatar';
// import { Bell, LogOut, Moon, Sun } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
// import { useTheme } from '../context/ThemeContext'; // Import Theme Hook

// const Navbar = ({ user, onLogout }) => {
//   const navigate = useNavigate();
//   const { theme, toggleTheme } = useTheme(); // Use Hook

//   return (
//     <nav className="h-16 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] px-6 flex items-center justify-between sticky top-0 z-50">
//       <div className="cursor-pointer" onClick={() => navigate('/dashboard')}>
//         <Logo className="text-[var(--text-primary)]" />
//       </div>

//       <div className="flex items-center gap-6">
//         {/* Theme Toggle */}
//         <button onClick={toggleTheme} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-2 rounded-full hover:bg-[var(--bg-primary)]">
//           {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
//         </button>

//         <div className="h-8 w-px bg-[var(--border-color)]" />

//         <div className="flex items-center gap-3 group relative cursor-pointer">
//           {/* Use New Avatar Component */}
//           <Avatar username={user?.username} className="h-9 w-9" />
          
//           <div className="flex flex-col">
//             <span className="text-sm font-bold text-[var(--text-primary)] leading-none">{user?.username || 'Guest'}</span>
//             <span className="text-[10px] text-[var(--text-secondary)]">Level 5 Coder</span>
//           </div>

//           <div className="absolute right-0 top-full mt-2 w-48 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform translate-y-2 group-hover:translate-y-0">
//             <button 
//               onClick={onLogout}
//               className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-[var(--bg-primary)] flex items-center gap-2"
//             >
//               <LogOut size={14} /> Sign Out
//             </button>
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Navbar;

// frontend/src/components/Navbar.jsx

import React from 'react';
import { Logo } from './Logo';
import Avatar from './Avatar';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    // FIX: Decreased height from h-20 to h-[72px] for a tighter fit around the logo
    <nav className="h-[72px] border-b border-[var(--border-color)] bg-[var(--bg-secondary)] px-8 flex items-center justify-between sticky top-0 z-50 transition-all">
      <div className="cursor-pointer" onClick={() => navigate('/dashboard')}>
        <Logo className="text-[var(--text-primary)] text-3xl" />
      </div>

      <div className="flex items-center gap-8">
        {/* Theme Toggle */}
        <button onClick={toggleTheme} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-2 rounded-full hover:bg-[var(--bg-primary)]">
          {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
        </button>

        <div className="h-8 w-px bg-[var(--border-color)]" />

        <div className="flex items-center gap-4 group relative cursor-pointer">
          <Avatar username={user?.username} className="h-10 w-10" />
          
          <div className="flex flex-col">
            <span className="text-base font-bold text-[var(--text-primary)] leading-none mb-0.5">{user?.username || 'Guest'}</span>
            <span className="text-xs text-[var(--text-secondary)]">Level 5 Coder</span>
          </div>

          <div className="absolute right-0 top-full mt-2 w-48 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform translate-y-2 group-hover:translate-y-0">
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
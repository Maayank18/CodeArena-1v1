// import React from 'react';
// import { Logo } from './Logo';
// import { Bell, User, LogOut, Moon } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';

// const Navbar = ({ user, onLogout }) => {
//   const navigate = useNavigate();

//   return (
//     <nav className="h-16 border-b border-[#3e3e42] bg-[#1e1e1e] px-6 flex items-center justify-between sticky top-0 z-50">
//       <div className="cursor-pointer" onClick={() => navigate('/dashboard')}>
//         <Logo />
//       </div>

//       <div className="flex items-center gap-6">
//         <button className="text-gray-400 hover:text-white transition-colors">
//           <Bell size={20} />
//         </button>
        
//         <button className="text-gray-400 hover:text-white transition-colors">
//           <Moon size={20} />
//         </button>

//         <div className="h-8 w-px bg-[#3e3e42]" />

//         <div className="flex items-center gap-3 group relative cursor-pointer">
//           <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg">
//             {user?.username?.[0]?.toUpperCase() || <User size={18} />}
//           </div>
//           <div className="flex flex-col">
//             <span className="text-sm font-bold text-white leading-none">{user?.username || 'Guest'}</span>
//             <span className="text-[10px] text-gray-400">Level 5 Coder</span>
//           </div>

//           {/* Dropdown Menu */}
//           <div className="absolute right-0 top-full mt-2 w-48 py-2 bg-[#252526] border border-[#3e3e42] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform translate-y-2 group-hover:translate-y-0">
//             <button 
//               onClick={onLogout}
//               className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-[#2d2d2d] flex items-center gap-2"
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


import React from 'react';
import { Logo } from './Logo';
import Avatar from './Avatar';
import { Bell, LogOut, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext'; // Import Theme Hook

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme(); // Use Hook

  return (
    <nav className="h-16 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="cursor-pointer" onClick={() => navigate('/dashboard')}>
        <Logo className="text-[var(--text-primary)]" />
      </div>

      <div className="flex items-center gap-6">
        {/* Theme Toggle */}
        <button onClick={toggleTheme} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-2 rounded-full hover:bg-[var(--bg-primary)]">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="h-8 w-px bg-[var(--border-color)]" />

        <div className="flex items-center gap-3 group relative cursor-pointer">
          {/* Use New Avatar Component */}
          <Avatar username={user?.username} className="h-9 w-9" />
          
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[var(--text-primary)] leading-none">{user?.username || 'Guest'}</span>
            <span className="text-[10px] text-[var(--text-secondary)]">Level 5 Coder</span>
          </div>

          <div className="absolute right-0 top-full mt-2 w-48 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform translate-y-2 group-hover:translate-y-0">
            <button 
              onClick={onLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-[var(--bg-primary)] flex items-center gap-2"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
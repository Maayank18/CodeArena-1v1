// import React from 'react';
// import { Swords, History, Trophy, BookOpen } from 'lucide-react';
// import { useLocation, useNavigate } from 'react-router-dom';

// const Sidebar = () => {
//   const location = useLocation();
//   const navigate = useNavigate();

//   const menu = [
//     { name: 'Battle Arena', icon: Swords, path: '/dashboard' },
//     { name: 'Match History', icon: History, path: '/history' },
//     { name: 'Leaderboard', icon: Trophy, path: '/leaderboard' }, // Placeholder
//     { name: 'Resources', icon: BookOpen, path: '/resources' },   // Placeholder
//   ];

//   return (
//     <aside className="w-64 border-r border-[#3e3e42] bg-[#1e1e1e] flex flex-col py-6">
//       <div className="px-4 mb-6">
//         <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2">Main Menu</h3>
//       </div>
      
//       <div className="flex flex-col gap-1 px-3">
//         {menu.map((item) => {
//           const isActive = location.pathname === item.path;
//           return (
//             <button
//               key={item.path}
//               onClick={() => navigate(item.path)}
//               className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
//                 isActive 
//                   ? 'bg-accent text-black shadow-lg shadow-green-900/20' 
//                   : 'text-gray-400 hover:bg-[#252526] hover:text-white'
//               }`}
//             >
//               <item.icon size={18} />
//               {item.name}
//             </button>
//           );
//         })}
//       </div>

//       <div className="mt-auto px-4">
//         <div className="p-4 rounded-xl bg-gradient-to-br from-[#252526] to-[#1e1e1e] border border-[#3e3e42]">
//           <h4 className="text-white font-bold text-sm mb-1">Pro Plan</h4>
//           <p className="text-xs text-gray-500 mb-3">Unlock more features</p>
//           <button className="w-full py-2 rounded-lg bg-[#3e3e42] text-white text-xs font-bold hover:bg-[#444] transition-colors">
//             Upgrade
//           </button>
//         </div>
//       </div>
//     </aside>
//   );
// };

// export default Sidebar;

import React from 'react';
import { Swords, History, Trophy, BookOpen } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menu = [
    { name: 'Battle Arena', icon: Swords, path: '/dashboard' },
    { name: 'Match History', icon: History, path: '/history' },
    { name: 'Leaderboard', icon: Trophy, path: '/leaderboard' }, 
    { name: 'Resources', icon: BookOpen, path: '/resources' },   
  ];

  return (
    // FIX: Replaced hardcoded #1e1e1e with var variables
    <aside className="w-64 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col py-6 transition-colors duration-300">
      <div className="px-4 mb-6">
        <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider px-2">Main Menu</h3>
      </div>
      
      <div className="flex flex-col gap-1 px-3">
        {menu.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-accent text-black shadow-lg shadow-green-900/20' 
                  // FIX: Hover states now adapt to light/dark
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <item.icon size={18} />
              {item.name}
            </button>
          );
        })}
      </div>

      <div className="mt-auto px-4">
        {/* FIX: Card background adapts */}
        <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
          <h4 className="text-[var(--text-primary)] font-bold text-sm mb-1">Pro Plan</h4>
          <p className="text-xs text-[var(--text-secondary)] mb-3">Unlock more features</p>
          <button className="w-full py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold hover:opacity-80 transition-opacity">
            Upgrade
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
import React from 'react';
import { Swords, History, Trophy, BookOpen } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menu = [
    { name: 'Battle Arena', icon: Swords, path: '/dashboard' },
    { name: 'Match History', icon: History, path: '/history' },
    { name: 'Leaderboard', icon: Trophy, path: '/leaderboard' }, // Placeholder
    { name: 'Resources', icon: BookOpen, path: '/resources' },   // Placeholder
  ];

  return (
    <aside className="w-64 border-r border-[#3e3e42] bg-[#1e1e1e] flex flex-col py-6">
      <div className="px-4 mb-6">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2">Main Menu</h3>
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
                  : 'text-gray-400 hover:bg-[#252526] hover:text-white'
              }`}
            >
              <item.icon size={18} />
              {item.name}
            </button>
          );
        })}
      </div>

      <div className="mt-auto px-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#252526] to-[#1e1e1e] border border-[#3e3e42]">
          <h4 className="text-white font-bold text-sm mb-1">Pro Plan</h4>
          <p className="text-xs text-gray-500 mb-3">Unlock more features</p>
          <button className="w-full py-2 rounded-lg bg-[#3e3e42] text-white text-xs font-bold hover:bg-[#444] transition-colors">
            Upgrade
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
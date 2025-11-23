// import React, { useEffect, useState } from 'react';
// import { Swords, History, Trophy, BookOpen } from 'lucide-react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { io } from 'socket.io-client'; // Import Socket

// const Sidebar = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
  
//   // State to store live user count
//   const [liveUsers, setLiveUsers] = useState(1); // Default to 1 (you)

//   // Listen for user count updates
//   useEffect(() => {
//     // Connect to the main server
//     const socket = io(import.meta.env.VITE_API_URL);

//     socket.on('users_count', (count) => {
//         setLiveUsers(count);
//     });

//     return () => {
//         socket.disconnect();
//     };
//   }, []);

//   const menu = [
//     { name: 'Battle Arena', icon: Swords, path: '/dashboard' },
//     { name: 'Match History', icon: History, path: '/history' },
//     { name: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
//     { name: 'Resources', icon: BookOpen, path: '/resources' },
//   ];

//   return (
//     <aside className="w-64 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col py-6 transition-colors duration-300">
//       <div className="px-4 mb-6">
//         <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider px-2">Main Menu</h3>
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
//                   : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]'
//               }`}
//             >
//               <item.icon size={18} />
//               {item.name}
//             </button>
//           );
//         })}
//       </div>

//       <div className="mt-auto px-4">
//         {/* --- NEW: LIVE USERS INDICATOR --- */}
//         <div className="mb-4 flex items-center gap-2 px-2">
//             <span className="relative flex h-3 w-3">
//               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
//               <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
//             </span>
//             <span className="text-sm font-bold text-[var(--text-primary)]">
//                 {liveUsers} Online
//             </span>
//         </div>
//         {/* --------------------------------- */}

//         <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
//           <h4 className="text-[var(--text-primary)] font-bold text-sm mb-1">Pro Plan</h4>
//           <p className="text-xs text-[var(--text-secondary)] mb-3">Unlock more features</p>
//           <button className="w-full py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold hover:opacity-80 transition-opacity">
//             Upgrade
//           </button>
//         </div>
//       </div>
//     </aside>
//   );
// };

// export default Sidebar;








// import React, { useEffect, useState } from 'react';
// import { Swords, History, Trophy, BookOpen, Globe } from 'lucide-react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { io } from 'socket.io-client';

// const Sidebar = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
  
//   // Initialize total as null to distinguish "loading" from "0 users"
//   const [stats, setStats] = useState({ live: 1, total: null });

//   useEffect(() => {
//     const socket = io(import.meta.env.VITE_API_URL);

//     socket.on('site_stats', (data) => {
//         setStats(data);
//     });

//     return () => {
//         socket.disconnect();
//     };
//   }, []);

//   const menu = [
//     { name: 'Battle Arena', icon: Swords, path: '/dashboard' },
//     { name: 'Match History', icon: History, path: '/history' },
//     { name: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
//     { name: 'Resources', icon: BookOpen, path: '/resources' },
//   ];

//   return (
//     <aside className="w-64 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col py-6 transition-colors duration-300">
//       <div className="px-4 mb-6">
//         <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider px-2">Main Menu</h3>
//       </div>
      
//       <div className="flex flex-col gap-1 px-3">
//         {menu.map((item) => {
//           const isActive = location.pathname === item.path;
//           return (
//             <button
//               key={item.path}
//               onClick={() => navigate(item.path)}
//               className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
//                 isActive 
//                   ? 'bg-accent text-black shadow-lg shadow-green-900/20 font-bold' 
//                   : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]'
//               }`}
//             >
//               <item.icon size={18} />
//               {item.name}
//             </button>
//           );
//         })}
//       </div>

//       <div className="mt-auto px-4 space-y-4">
        
//         {/* --- METRICS SECTION --- */}
//         <div className="bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--border-color)] space-y-3">
//             <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-2 text-[var(--text-secondary)]">
//                     <Globe size={14} className="text-blue-400" />
//                     <span className="text-xs font-bold">Total Users</span>
//                 </div>
//                 <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
//                     {/* FIX: Show number if it exists, otherwise ... */}
//                     {stats.total !== null ? stats.total : '...'}
//                 </span>
//             </div>

//             <div className="h-px bg-[var(--border-color)] w-full"></div>

//             <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-2 text-[var(--text-secondary)]">
//                     <div className="relative flex h-2 w-2">
//                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
//                       <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
//                     </div>
//                     <span className="text-xs font-bold">Online Now</span>
//                 </div>
//                 <span className="text-xs font-mono font-bold text-accent">
//                     {stats.live}
//                 </span>
//             </div>
//         </div>

//         {/* --- PRO PLAN (Restored to Original Color) --- */}
//         <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
//           <h4 className="text-[var(--text-primary)] font-bold text-sm mb-1">Pro Plan</h4>
//           <p className="text-xs text-[var(--text-secondary)] mb-3">Unlock advanced stats</p>
//           <button className="w-full py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold hover:opacity-80 transition-opacity">
//             Upgrade
//           </button>
//         </div>

//       </div>
//     </aside>
//   );
// };

// export default Sidebar;



















// import React, { useEffect, useState } from 'react';
// import { Swords, History, Trophy, BookOpen, Globe } from 'lucide-react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { io } from 'socket.io-client';

// const Sidebar = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
  
//   // Default to 0 so we can see if it updates
//   const [stats, setStats] = useState({ live: 0, total: 0 });

//   useEffect(() => {
//     // FIX: Explicit fallback to localhost:5000 to ensure connection
//     const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
//     console.log("Sidebar connecting to:", socketUrl); // Debug log
//     const socket = io(socketUrl);

//     socket.on('connect', () => {
//         console.log("Sidebar Socket Connected!", socket.id);
//     });

//     // Listen for the stats event
//     socket.on('site_stats', (data) => {
//         console.log("Received Stats:", data); // Debug log
//         setStats(data);
//     });

//     return () => {
//         socket.disconnect();
//     };
//   }, []);

//   const menu = [
//     { name: 'Battle Arena', icon: Swords, path: '/dashboard' },
//     { name: 'Match History', icon: History, path: '/history' },
//     { name: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
//     { name: 'Resources', icon: BookOpen, path: '/resources' },
//   ];

//   return (
//     <aside className="w-64 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col py-6 transition-colors duration-300">
//       <div className="px-4 mb-6">
//         <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider px-2">Main Menu</h3>
//       </div>
      
//       <div className="flex flex-col gap-1 px-3">
//         {menu.map((item) => {
//           const isActive = location.pathname === item.path;
//           return (
//             <button
//               key={item.path}
//               onClick={() => navigate(item.path)}
//               className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
//                 isActive 
//                   ? 'bg-accent text-black shadow-lg shadow-green-900/20 font-bold' 
//                   : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]'
//               }`}
//             >
//               <item.icon size={18} />
//               {item.name}
//             </button>
//           );
//         })}
//       </div>

//       <div className="mt-auto px-4 space-y-4">
        
//         {/* --- METRICS SECTION --- */}
//         <div className="bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--border-color)] space-y-3">
//             <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-2 text-[var(--text-secondary)]">
//                     <Globe size={14} className="text-blue-400" />
//                     <span className="text-xs font-bold">Total Users</span>
//                 </div>
//                 <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
//                     {/* FIX: Display the number directly to debug "0" vs "..." */}
//                     {stats.total}
//                 </span>
//             </div>

//             <div className="h-px bg-[var(--border-color)] w-full"></div>

//             <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-2 text-[var(--text-secondary)]">
//                     <div className="relative flex h-2 w-2">
//                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
//                       <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
//                     </div>
//                     <span className="text-xs font-bold">Online Now</span>
//                 </div>
//                 <span className="text-xs font-mono font-bold text-accent">
//                     {stats.live}
//                 </span>
//             </div>
//         </div>

//         {/* Pro Plan Box */}
//         <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
//           <h4 className="text-[var(--text-primary)] font-bold text-sm mb-1">Pro Plan</h4>
//           <p className="text-xs text-[var(--text-secondary)] mb-3">Unlock advanced stats</p>
//           <button className="w-full py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold hover:opacity-80 transition-opacity">
//             Upgrade
//           </button>
//         </div>

//       </div>
//     </aside>
//   );
// };

// export default Sidebar;












import React, { useEffect, useState } from 'react';
import { Swords, History, Trophy, BookOpen, Globe } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Default to 0 so we can see if it updates
  const [stats, setStats] = useState({ live: 0, total: 0 });

  useEffect(() => {
    // Explicit fallback to localhost:5000 to ensure connection
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    console.log("Sidebar connecting to:", socketUrl);

    // Create socket but don't connect immediately so we can attach listeners first
    const socket = io(socketUrl, {
      autoConnect: false,
      // optional: force websocket transport to reduce polling races
      transports: ['websocket'],
    });

    // Logging & event handlers
    socket.on('connect', () => {
      console.log("Sidebar Socket Connected!", socket.id);
    });

    socket.on('site_stats', (data) => {
      console.log("Received Stats:", data);
      // Basic validation: ensure shape before setting
      if (data && typeof data === 'object' && ('live' in data || 'total' in data)) {
        setStats(prev => ({ 
          live: typeof data.live === 'number' ? data.live : prev.live,
          total: typeof data.total === 'number' ? data.total : prev.total
        }));
      } else {
        console.warn("site_stats payload had unexpected shape:", data);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log("Sidebar Socket disconnected:", reason);
    });

    // Connect after handlers are registered — prevents missing the initial emit
    socket.connect();

    return () => {
      // Clean up listeners and disconnect
      try {
        socket.off('site_stats');
        socket.off('connect');
        socket.off('disconnect');
        socket.disconnect();
      } catch (e) {
        // ignore errors during cleanup
      }
    };
  }, []);

  const menu = [
    { name: 'Battle Arena', icon: Swords, path: '/dashboard' },
    { name: 'Match History', icon: History, path: '/history' },
    { name: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
    { name: 'Resources', icon: BookOpen, path: '/resources' },
  ];

  return (
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-accent text-black shadow-lg shadow-green-900/20 font-bold' 
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <item.icon size={18} />
              {item.name}
            </button>
          );
        })}
      </div>

      <div className="mt-auto px-4 space-y-4">
        
        {/* --- METRICS SECTION --- */}
        <div className="bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--border-color)] space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Globe size={14} className="text-blue-400" />
                    <span className="text-xs font-bold">Total Users</span>
                </div>
                <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
                    {/* Display the number directly */}
                    {stats.total}
                </span>
            </div>

            <div className="h-px bg-[var(--border-color)] w-full"></div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </div>
                    <span className="text-xs font-bold">Online Now</span>
                </div>
                <span className="text-xs font-mono font-bold text-accent">
                    {stats.live}
                </span>
            </div>
        </div>

        {/* Pro Plan Box */}
        <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
          <h4 className="text-[var(--text-primary)] font-bold text-sm mb-1">Pro Plan</h4>
          <p className="text-xs text-[var(--text-secondary)] mb-3">Unlock advanced stats</p>
          <button className="w-full py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold hover:opacity-80 transition-opacity">
            Upgrade
          </button>
        </div>

      </div>
    </aside>
  );
};

export default Sidebar;

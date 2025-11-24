// import React, { useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Logo } from '../components/Logo';
// import { ArrowRight, Code2, Zap, Trophy } from 'lucide-react';
// import logoShield from '../assets/CodeArenaLogo.png';

// const Landing = () => {
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (localStorage.getItem('codearena_user')) {
//       navigate('/dashboard');
//     }
//   }, [navigate]);

//   return (
//     // FIX: Removed 'overflow-y-auto custom-scrollbar' as body handles it now
//     <div className="min-h-screen bg-dark text-white selection:bg-accent selection:text-black">
//       {/* Header */}
//       {/* FIX: Reduced padding from py-6 to py-4 for a more compact header */}
//       <header className="flex items-center justify-between px-7 py-1 border-b border-[#3e3e42] bg-dark/80 backdrop-blur-lg sticky top-0 z-50">
//         <Logo />
//         <div className="flex gap-4">
//           <button onClick={() => navigate('/login')} className="px-6 py-2 rounded-lg font-bold text-gray-300 hover:text-white transition-colors">
//             Login
//           </button>
//           <button onClick={() => navigate('/signup')} className="px-6 py-2 rounded-lg font-bold bg-white text-black hover:bg-gray-200 transition-colors">
//             Sign Up
//           </button>
//         </div>
//       </header>

//       {/* Hero Section */}
//       <main className="container mx-auto px-0 py-0 text-center">
//         {/* FIX: Reduced margin-bottom from mb-12 to mb-6 */}
//         <div className="flex justify-center mb-6 animate-fade-in-down">
//             <img 
//                 src={logoShield} 
//                 alt="CodeArena Shield Logo" 
//                 // Kept the large size
//                 className="w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-[0_0_50px_rgba(74,238,136,0.3)]"
//             />
//         </div>

//         {/* FIX: Reduced margin-bottom from mb-8 to mb-4 */}
//         <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#252526] border border-[#3e3e42] text-accent text-sm font-bold mb-4 animate-fade-in">
//           <span className="relative flex h-2 w-2">
//             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
//             <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
//           </span>
//           v2.0 is Live: Multiplayer Battles
//         </div>
        
//         {/* FIX: Reduced margin-bottom from mb-8 to mb-6 */}
//         <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
//           Master Code. <br/>
//           <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-emerald-600">
//             Defeat Rivals.
//           </span>
//         </h1>
        
//         {/* FIX: Reduced margin-bottom from mb-12 to mb-10 */}
//         <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
//           The ultimate 1v1 coding battleground. Challenge friends, solve algorithmic problems in real-time, and climb the global leaderboard.
//         </p>

//         <button 
//           onClick={() => navigate('/signup')}
//           className="group relative inline-flex items-center gap-3 px-8 py-4 bg-accent text-black text-lg font-bold rounded-xl hover:bg-[#3bd175] transition-all transform hover:scale-105 shadow-[0_0_40px_-10px_rgba(74,238,136,0.5)]"
//         >
//           Start Battling Now
//           <ArrowRight className="group-hover:translate-x-1 transition-transform" />
//         </button>

//         {/* Feature Cards */}
//         {/* FIX: Reduced margin-top from mt-32 to mt-20 */}
//         <div className="grid md:grid-cols-3 gap-8 mt-20 text-left pb-20">
//           {[
//             { icon: Zap, title: 'Real-time Sync', desc: 'See every keystroke your opponent makes instantly via Yjs WebSocket tech.' },
//             { icon: Code2, title: 'Multi-Language', desc: 'Support for C++, Python, and JavaScript with rich syntax highlighting.' },
//             { icon: Trophy, title: 'Global Ranks', desc: 'Win matches to increase your ELO rating and dominate the leaderboard.' }
//           ].map((f, i) => (
//             <div key={i} className="p-8 rounded-2xl bg-[#252526] border border-[#3e3e42] hover:border-accent transition-colors group">
//               <div className="h-12 w-12 rounded-lg bg-[#3e3e42] flex items-center justify-center text-white mb-6 group-hover:bg-accent group-hover:text-black transition-colors">
//                 <f.icon />
//               </div>
//               <h3 className="text-xl font-bold mb-2">{f.title}</h3>
//               <p className="text-gray-400 leading-relaxed">{f.desc}</p>
//             </div>
//           ))}
//         </div>
//       </main>
//     </div>
//   );
// };

// export default Landing;


// above landing is perfect but without footer
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import Footer from '../components/Footer'; // <--- IMPORT HERE
import { ArrowRight, Code2, Zap, Trophy } from 'lucide-react';
import logoShield from '../assets/CodeArenaLogo.png';

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('codearena_user')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-dark text-white selection:bg-accent selection:text-black flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-7 py-4 border-b border-[#3e3e42] bg-dark/80 backdrop-blur-lg sticky top-0 z-50">
        <Logo />
        <div className="flex gap-4">
          <button onClick={() => navigate('/login')} className="px-6 py-2 rounded-lg font-bold text-gray-300 hover:text-white transition-colors">
            Login
          </button>
          <button onClick={() => navigate('/signup')} className="px-6 py-2 rounded-lg font-bold bg-white text-black hover:bg-gray-200 transition-colors">
            Sign Up
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-0 py-0 text-center flex-1">
        
        <div className="flex justify-center mb-6 mt-10 animate-fade-in-down">
            <img 
                src={logoShield} 
                alt="CodeArena Shield Logo" 
                className="w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-[0_0_50px_rgba(74,238,136,0.3)]"
            />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#252526] border border-[#3e3e42] text-accent text-sm font-bold mb-4 animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
          </span>
          v2.0 is Live: Multiplayer Battles
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          Master Code. <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-emerald-600">
            Defeat Rivals.
          </span>
        </h1>
        
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          The ultimate 1v1 coding battleground. Challenge friends, solve algorithmic problems in real-time, and climb the global leaderboard.
        </p>

        <button 
          onClick={() => navigate('/signup')}
          className="group relative inline-flex items-center gap-3 px-8 py-4 bg-accent text-black text-lg font-bold rounded-xl hover:bg-[#3bd175] transition-all transform hover:scale-105 shadow-[0_0_40px_-10px_rgba(74,238,136,0.5)]"
        >
          Start Battling Now
          <ArrowRight className="group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 text-left pb-20 px-4">
          {[
            { icon: Zap, title: 'Real-time Sync', desc: 'See every keystroke your opponent makes instantly via Yjs WebSocket tech.' },
            { icon: Code2, title: 'Multi-Language', desc: 'Support for C++, Python, and JavaScript with rich syntax highlighting.' },
            { icon: Trophy, title: 'Global Ranks', desc: 'Win matches to increase your ELO rating and dominate the leaderboard.' }
          ].map((f, i) => (
            <div key={i} className="p-8 rounded-2xl bg-[#252526] border border-[#3e3e42] hover:border-accent transition-colors group">
              <div className="h-12 w-12 rounded-lg bg-[#3e3e42] flex items-center justify-center text-white mb-6 group-hover:bg-accent group-hover:text-black transition-colors">
                <f.icon />
              </div>
              <h3 className="text-xl font-bold mb-2">{f.title}</h3>
              <p className="text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* ADD FOOTER HERE */}
      <Footer />
    </div>
  );
};

export default Landing;
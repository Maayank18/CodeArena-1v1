import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { ArrowRight, Code2, Zap, Trophy } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already logged in, skip Landing page and go to Dashboard
    if (localStorage.getItem('codearena_user')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-dark text-white selection:bg-accent selection:text-black overflow-y-auto custom-scrollbar">
      {/* Header */}
      <header className="flex items-center justify-between px-10 py-6 border-b border-[#3e3e42]">
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

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#252526] border border-[#3e3e42] text-accent text-sm font-bold mb-8 animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
          </span>
          v2.0 is Live: Multiplayer Battles
        </div>
        
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-8 leading-tight">
          Master Code. <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-emerald-600">
            Defeat Rivals.
          </span>
        </h1>
        
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
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
        <div className="grid md:grid-cols-3 gap-8 mt-32 text-left">
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
    </div>
  );
};

export default Landing;
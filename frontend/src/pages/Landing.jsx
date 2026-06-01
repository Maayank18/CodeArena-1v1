import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import Footer from '../components/Footer'; 
import { ArrowRight } from 'lucide-react';
import logoShield from '../assets/CodeArenaLogo.png';
import FeatureShowcase from '../components/landing/FeatureShowcase';

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('codearena_user')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#121212] text-white selection:bg-accent selection:text-black flex flex-col font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-[#3e3e42] bg-[#121212]/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="scale-90 sm:scale-100 origin-left">
            <Logo />
        </div>
        <div className="flex gap-2 sm:gap-4">
          <button 
            onClick={() => navigate('/login')} 
            className="px-4 sm:px-6 py-2 rounded-lg font-bold text-sm sm:text-base text-gray-300 hover:text-white transition-colors"
          >
            Login
          </button>
          <button 
            onClick={() => navigate('/signup')} 
            className="px-4 sm:px-6 py-2 rounded-lg font-bold text-sm sm:text-base bg-white text-black hover:bg-gray-200 transition-colors"
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 py-0 text-center flex flex-col items-center">
          <div className="flex justify-center mb-4 mt-6 md:mt-10 animate-fade-in-down">
              <img 
                  src={logoShield} 
                  alt="CodeArena Shield Logo" 
                  className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 object-contain drop-shadow-[0_0_50px_rgba(74,238,136,0.3)] hover:scale-105 transition-transform duration-500"
              />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#252526] border border-[#3e3e42] text-accent text-xs sm:text-sm font-bold mb-4 animate-fade-in shadow-lg shadow-black/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            v2.0 is Live: Multiplayer Battles
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Master Code. <br className="hidden sm:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-emerald-600 block sm:inline mt-2 sm:mt-0">
              Defeat Rivals.
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 px-2 leading-relaxed">
            The ultimate 1v1 coding battleground. Challenge friends, solve algorithmic problems in real-time, and climb the global leaderboard.
          </p>

          <button 
            onClick={() => navigate('/signup')}
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-accent text-black text-lg font-bold rounded-xl hover:bg-[#3bd175] transition-all transform hover:scale-105 shadow-[0_0_40px_-10px_rgba(74,238,136,0.5)] active:scale-95 mb-16 sm:mb-24"
          >
            Start Battling Now
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </section>

        {/* Feature Showcase */}
        <FeatureShowcase />
      </main>

      <Footer />
    </div>
  );
};

export default Landing;
// V 1.5

// Version-2.0
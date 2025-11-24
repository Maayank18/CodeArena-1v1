import React from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar'; // Import the Navbar

const Leaderboard = () => {
  return (
    <div className="flex h-screen bg-[#0d1117] text-white overflow-hidden">
      {/* Left Side - Navigation */}
      <Sidebar />

      {/* Right Side - Main Content Wrapper */}
      <div className="flex-1 flex flex-col relative">
        {/* Top Navigation Bar */}
        <Navbar />

        {/* Main Scrollable Area */}
        <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto p-8">
            
            {/* Coming Soon Centerpiece */}
            <div className="text-center space-y-6">
                <div className="relative inline-block">
                    {/* Glowing effect behind the text */}
                    <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-green-600 to-green-400 opacity-60 blur-lg"></div>
                    <h1 className="relative text-6xl font-black text-white tracking-tight uppercase">
                        Leaderboard
                    </h1>
                </div>
                
                <div className="space-y-3 mt-8">
                    <h2 className="text-2xl font-bold text-green-400 tracking-wide">COMING SOON</h2>
                    <p className="text-gray-400 text-lg max-w-lg mx-auto leading-relaxed">
                        We are crunching the numbers! The global ranking system is currently under development.
                    </p>
                </div>

                {/* Visual separator */}
                <div className="w-16 h-1.5 bg-green-500/30 rounded-full mx-auto mt-8"></div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
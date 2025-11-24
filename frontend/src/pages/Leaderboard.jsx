import React from 'react';
// Adjust the path if your Sidebar is in a different location relative to pages
import Sidebar from '../components/Sidebar'; 

const Leaderboard = () => {
  return (
    <div className="flex h-screen bg-[#0d1117] text-white overflow-hidden">
      {/* Left Side - Navigation */}
      <Sidebar />

      {/* Right Side - Main Content */}
      <div className="flex-1 flex flex-col relative overflow-y-auto">
        
        {/* Coming Soon Content */}
        <div className="flex flex-col items-center justify-center h-full text-center space-y-6 p-8">
            {/* Optional: You can add an icon here later */}
            <div className="relative">
                <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-green-600 to-green-400 opacity-75 blur"></div>
                <h1 className="relative text-5xl font-extrabold text-white tracking-tight">
                    Leaderboard
                </h1>
            </div>
            
            <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-green-400">Coming Soon</h2>
                <p className="text-gray-400 max-w-md mx-auto">
                    We are crunching the numbers! The global ranking system is currently under development.
                </p>
            </div>

            {/* decorative visual line */}
            <div className="w-24 h-1 bg-gray-800 rounded-full mt-8"></div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
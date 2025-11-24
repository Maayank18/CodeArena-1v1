import React from 'react';
// Adjust the path if your Sidebar is in a different location relative to pages
import Sidebar from '../components/Sidebar'; 

const Resources = () => {
  return (
    <div className="flex h-screen bg-[#0d1117] text-white overflow-hidden">
      {/* Left Side - Navigation */}
      <Sidebar />

      {/* Right Side - Main Content */}
      <div className="flex-1 flex flex-col relative overflow-y-auto">
        
        {/* Coming Soon Content */}
        <div className="flex flex-col items-center justify-center h-full text-center space-y-6 p-8">
            <div className="relative">
                <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-blue-600 to-purple-400 opacity-75 blur"></div>
                <h1 className="relative text-5xl font-extrabold text-white tracking-tight">
                    Resources
                </h1>
            </div>
            
            <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-blue-400">Coming Soon</h2>
                <p className="text-gray-400 max-w-md mx-auto">
                    A library of coding patterns, algorithms, and study materials is being curated for you.
                </p>
            </div>
            
             {/* decorative visual line */}
             <div className="w-24 h-1 bg-gray-800 rounded-full mt-8"></div>
        </div>
      </div>
    </div>
  );
};

export default Resources;
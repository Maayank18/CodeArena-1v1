import React from 'react';
import logoImg from '../assets/CodeArenaLogo.png'; // Import your image

export const Logo = ({ className }) => (
  <div className={`flex items-center gap-3 font-bold text-2xl tracking-tighter ${className}`}>
    {/* Render the Image */}
    <img 
      src={logoImg} 
      alt="CodeArena Logo" 
      className="h-10 w-10 object-contain rounded-xl shadow-lg shadow-emerald-900/20" 
    />
    <span className="text-white">
      Code<span className="text-accent">Arena</span>
    </span>
  </div>
);
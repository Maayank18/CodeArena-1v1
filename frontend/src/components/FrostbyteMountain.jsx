import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function FrostbyteMountain() {
  const { advancedTheme } = useTheme();

  if (advancedTheme !== 'frostbyte') return null;

  return (
    <div className="fixed bottom-0 left-0 w-full h-[55vh] pointer-events-none z-[0]">
      
      {/* Atmospheric Aurora / Sky Glow behind the mountains */}
      <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,#0ea5e9_0%,transparent_60%)] opacity-20 mix-blend-screen"></div>

      <svg 
        viewBox="0 0 1440 400" 
        className="absolute bottom-0 w-full h-full object-cover drop-shadow-[0_-15px_25px_rgba(6,182,212,0.15)]" 
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="frontIce" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#cffafe" />   {/* Blinding Ice White/Cyan */}
            <stop offset="25%" stopColor="#06b6d4" />  {/* Vivid Cyan */}
            <stop offset="100%" stopColor="#020617" /> {/* Deep Abyss */}
          </linearGradient>
          <linearGradient id="midIce" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" />   {/* Deep Frost Blue */}
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
          <linearGradient id="backIce" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />   {/* Navy Silhouette */}
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
        </defs>

        {/* Background Jagged Peaks (Dark/Shadows) */}
        <polygon 
          fill="url(#backIce)" 
          opacity="0.9" 
          points="0,400 0,150 120,250 280,80 420,220 580,50 750,190 920,20 1100,180 1280,90 1440,210 1440,400" 
        />
        
        {/* Midground Icy Peaks (Deep Blue/Cyan) */}
        <polygon 
          fill="url(#midIce)" 
          opacity="0.8" 
          points="0,400 0,220 180,120 350,260 520,130 680,280 850,110 1050,270 1220,140 1440,260 1440,400" 
        />
        
        {/* Foreground Glowing Frost Peaks (Vivid Highlight) */}
        <polygon 
          fill="url(#frontIce)" 
          opacity="0.95" 
          points="0,400 0,280 220,180 400,320 600,200 780,340 980,190 1180,330 1350,230 1440,300 1440,400" 
        />
      </svg>

      {/* Deep Base Fog to blend the mountain base seamlessly into the dark UI */}
      <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-[#020617] via-[#020617]/90 to-transparent"></div>
    </div>
  );
}

import React from 'react';

const CyberpunkBackground = ({ forceActive = false }) => {
  return (
    <div 
      className="fixed inset-0 z-[0] pointer-events-none"
      style={{ display: forceActive ? 'block' : undefined }}
    >
      {/* Base Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 240, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 240, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      
      {/* Circuit lines (SVG) */}
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <pattern id="circuit" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
          <path d="M 100,0 L 100,80 L 120,100 L 200,100" fill="none" stroke="#00f0ff" strokeWidth="1" />
          <path d="M 0,100 L 80,100 L 100,120 L 100,200" fill="none" stroke="#ff003c" strokeWidth="1" />
          <circle cx="120" cy="100" r="3" fill="#00f0ff" />
          <circle cx="80" cy="100" r="3" fill="#ff003c" />
        </pattern>
        <rect x="0" y="0" width="100%" height="100%" fill="url(#circuit)" />
      </svg>

      {/* Hex Address Decorators */}
      <div className="absolute top-10 right-10 flex flex-col items-end gap-1 font-mono text-[10px] text-[#00f0ff] opacity-30 select-none">
        <span>0x00A1F 00 11 22 33 44 55</span>
        <span>0x00A2F AA BB CC DD EE FF</span>
        <span>0x00A3F SYS.CORE_OVERRIDE</span>
        <span>0x00A4F 100% NOMINAL</span>
      </div>
      
      <div className="absolute bottom-10 left-10 flex flex-col items-start gap-1 font-mono text-[10px] text-[#ff003c] opacity-30 select-none">
        <span>ERR_TRACE: BUFFER_UNDERRUN</span>
        <span>{'> REBOOTING NEURAL_LINK...'}</span>
        <span>{'> CONNECTION ESTABLISHED'}</span>
      </div>

      {/* Vignette Shadow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,#0d0d12_100%)] opacity-90" />
    </div>
  );
};

export default CyberpunkBackground;

// Version-2.0
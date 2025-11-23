// import React from 'react';
// import logoImg from '../assets/CodeArenaLogo.png';

// export const Logo = ({ className }) => (
//   <div className={`flex items-center gap-3 font-bold text-2xl tracking-tighter ${className}`}>
//     <img 
//       src={logoImg} 
//       alt="CodeArena Logo" 
//       // Added 'bg-dark' to the image container so if the logo is white transparent, it's still visible
//       className="h-10 w-10 object-contain rounded-xl shadow-lg shadow-emerald-900/20 bg-[#1e1e1e] p-1" 
//     />
//     {/* FIX: Changed text-white to text-[var(--text-primary)] */}
//     <span className="text-[var(--text-primary)] transition-colors duration-300">
//       Code<span className="text-accent">Arena</span>1v1
//     </span>
//   </div>
// );

// import React from 'react';
// // Assuming your new logo file is named 'logo-shield.png' and is in the assets folder
// import logoShield from '../assets/CodeArenaLogo.png'; 

// export const Logo = ({ className }) => (
//   <div className={`flex items-center gap-3 font-bold text-2xl tracking-tighter ${className}`}>
//     <img 
//       src={logoShield} 
//       alt="CodeArena Logo" 
//       // Increased size slightly for better visibility
//       className="h-12 w-12 object-contain drop-shadow-[0_0_15px_rgba(74,238,136,0.4)]" 
//     />
//     <span className="transition-colors duration-300">
//       Code<span className="text-accent">Arena</span>
//     </span>
//   </div>
// );


// frontend/src/components/Logo.jsx
import React from 'react';
// Make sure this path is correct for your setup
import logoShield from '../assets/CodeArenaLogo.png'; 

export const Logo = ({ className }) => (
  <div className={`flex items-center gap-3 font-bold text-2xl tracking-tighter ${className}`}>
    <img 
      src={logoShield} 
      alt="CodeArena Logo" 
      // ---- THE FIX IS HERE ----
      // Changed from h-12 w-12 to h-16 w-16
      className="h-20 w-20 object-contain drop-shadow-[0_0_15px_rgba(74,238,136,0.4)]" 
      // -------------------------
    />
    <span className="transition-colors duration-300">
      Code<span className="text-accent">Arena</span>1v1
    </span>
  </div>
);
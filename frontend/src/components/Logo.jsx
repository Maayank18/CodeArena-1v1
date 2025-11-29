// frontend/src/components/Logo.jsx
// import React from 'react';
// // Make sure this path is correct for your setup
// import logoShield from '../assets/CodeArenaLogo.png'; 

// export const Logo = ({ className }) => (
//   <div className={`flex items-center gap-3 font-bold text-2xl tracking-tighter ${className}`}>
//     <img 
//       src={logoShield} 
//       alt="CodeArena Logo" 
//       // ---- THE FIX IS HERE ----
//       // Changed from h-12 w-12 to h-16 w-16
//       className="h-20 w-20 object-contain drop-shadow-[0_0_15px_rgba(74,238,136,0.4)]" 
//       // -------------------------
//     />
//     <span className="transition-colors duration-300">
//       Code<span className="text-accent">Arena</span>1v1
//     </span>
//   </div>
// );



// RESPONSIVE TWEAK CHANGES 
import React from 'react';
// Make sure this path is correct for your setup
import logoShield from '../assets/CodeArenaLogo.png'; 

export const Logo = ({ className }) => (
  <div className={`flex items-center gap-2 sm:gap-3 font-bold text-xl sm:text-2xl tracking-tighter ${className}`}>
    <img 
      src={logoShield} 
      alt="CodeArena Logo" 
      // ✅ RESPONSIVE UPDATE:
      // Mobile: h-10 w-10 (40px) - Fits perfectly in 72px Navbar
      // Desktop: h-14 w-14 (56px) - Nice and bold
      className="h-10 w-10 sm:h-14 sm:w-14 object-contain drop-shadow-[0_0_15px_rgba(74,238,136,0.4)] transition-all duration-300" 
    />
    <span className="transition-colors duration-300">
      Code<span className="text-accent">Arena</span>1v1
    </span>
  </div>
);
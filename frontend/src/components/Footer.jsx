import React from 'react';
import { Linkedin, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="w-full border-t border-[#1f2937]/50 bg-opacity-20 backdrop-blur-md py-6 mt-auto">
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left Side: Branding/Copyright */}
        <div className="text-gray-500 text-sm font-medium">
          <span>© {new Date().getFullYear()} CodeArena 1v1.</span>
        </div>

        {/* Center: The "Designed by" Signature */}
        <div className="text-sm font-medium flex items-center gap-1.5">
          <span className="text-gray-500">Designed & Developed by</span>
          <a 
            href="https://www.linkedin.com/in/mayank-garg-120a77214/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative inline-block"
          >
            <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent font-bold hover:from-emerald-300 hover:to-blue-400 transition-all duration-300">
              Mayank Garg
            </span>
            {/* Underline animation */}
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-400 to-blue-500 group-hover:w-full transition-all duration-300"></span>
          </a>
        </div>

        {/* Right Side: Social Links (Minimalist) */}
        <div className="flex items-center gap-5">
          <a 
            href="https://www.linkedin.com/in/mayank-garg-120a77214/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-[#0A66C2] transition-colors duration-300"
            aria-label="LinkedIn"
          >
            <Linkedin size={18} />
          </a>

          <a 
            href="mailto:gargmayank1805@gmail.com"
            className="text-gray-500 hover:text-emerald-400 transition-colors duration-300"
            aria-label="Email"
          >
            <Mail size={18} />
          </a>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
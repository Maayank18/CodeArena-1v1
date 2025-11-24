import React from 'react';
import { Linkedin, Mail, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="w-full border-t border-[#3e3e42] bg-[#0d1117]/50 backdrop-blur-sm py-8 mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left Side: Branding/Copyright */}
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <span>© {new Date().getFullYear()} CodeArena 1v1.</span>
          <span className="hidden md:inline">•</span>
          <span className="flex items-center gap-1">
            Crafted with <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" /> by
          </span>
          <span className="font-bold text-white tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            Mayank Garg
          </span>
        </div>

        {/* Right Side: Social Links */}
        <div className="flex items-center gap-6">
          <a 
            href="https://www.linkedin.com/in/mayank-garg-120a77214/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-gray-400 hover:text-[#0A66C2] transition-colors duration-300"
          >
            <Linkedin className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium hidden sm:block">LinkedIn</span>
          </a>

          <a 
            href="mailto:gargmayank1805@gmail.com"
            className="group flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors duration-300"
          >
            <Mail className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium hidden sm:block">Get in Touch</span>
          </a>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
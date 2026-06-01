import React from 'react';
import { Linkedin, Mail } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { getAdvancedThemeMeta } from '../utils/advancedThemes';

const Footer = () => {
  const { advancedTheme } = useTheme();
  const activeAdvancedTheme = getAdvancedThemeMeta(advancedTheme);

  return (
    <footer
      className={`w-full border-t py-6 mt-auto backdrop-blur-md transition-colors duration-300 ${
        activeAdvancedTheme ? `theme-footer theme-footer-${activeAdvancedTheme.id}` : ''
      }`}
      style={{
        background: 'color-mix(in srgb, var(--surface-elevated) 88%, transparent)',
        borderTopColor: 'color-mix(in srgb, var(--border-color) 72%, transparent)',
      }}
    >
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
        <div className="text-[var(--text-secondary)] text-sm font-medium text-center md:text-left">
          <span>&copy; {new Date().getFullYear()} CodeArena 1v1. All rights reserved.</span>
        </div>

        <div className="text-sm font-medium flex flex-wrap justify-center items-center gap-1.5 text-center">
          <span className="text-[var(--text-secondary)]">Designed &amp; Developed by</span>
          <a
            href="https://www.linkedin.com/in/mayank-garg-120a77214/"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-block"
          >
            <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent font-bold hover:from-emerald-300 hover:to-blue-400 transition-all duration-300">
              Mayank Garg
            </span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-400 to-blue-500 group-hover:w-full transition-all duration-300" />
          </a>
        </div>

        <div className="flex items-center gap-5">
          <a
            href="https://www.linkedin.com/in/mayank-garg-120a77214/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--text-secondary)] hover:text-[#0A66C2] transition-colors duration-300 transform hover:scale-110"
            aria-label="LinkedIn"
          >
            <Linkedin size={18} />
          </a>

          <a
            href="mailto:gargmayank1805@gmail.com"
            className="text-[var(--text-secondary)] hover:text-emerald-400 transition-colors duration-300 transform hover:scale-110"
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

// Version-2.0
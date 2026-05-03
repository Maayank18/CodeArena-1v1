// FILE: frontend/src/components/Navbar.jsx
import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { Logo } from './Logo';
import Avatar from './Avatar';
import { LogOut, Moon, Settings, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';
import { getLevelInfo } from '../utils/levelSystem';
import SettingsModal from './SettingsModal.jsx';

const Navbar = ({ user, onLogout, onUserUpdate }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [displayUser, setDisplayUser] = useState(user);

  useEffect(() => {
    setDisplayUser(user);
  }, [user]);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const handleWindowClick = () => setIsMenuOpen(false);
    window.addEventListener('click', handleWindowClick);

    return () => window.removeEventListener('click', handleWindowClick);
  }, [isMenuOpen]);

  const levelInfo = useMemo(() => {
    return getLevelInfo(displayUser?.rating || 1000);
  }, [displayUser?.rating]);

  const handleLogoClick = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const handleUserUpdate = useCallback((nextUser) => {
    setDisplayUser(nextUser);
    onUserUpdate?.(nextUser);
  }, [onUserUpdate]);

  const handleRequireReauth = useCallback(() => {
    setIsSettingsOpen(false);
    setIsMenuOpen(false);
    localStorage.removeItem('codearena_user');
    localStorage.removeItem('dashboard_profile_cache');
    toast.success('Password updated. Please sign in again.');
    navigate('/login');
  }, [navigate]);

  return (
    <>
      <nav
        className="
        h-[64px] sm:h-[72px]
        border-b
        px-4 sm:px-8
        flex items-center justify-between
        sticky top-0 z-50
        transition-all shadow-sm

        /* ✅ FIX: fallback + CSS variables */
        bg-white dark:bg-[var(--bg-secondary)]
        border-gray-200 dark:border-[var(--border-color)]
      "
      >
      
      {/* Logo Section */}
      <button 
        onClick={handleLogoClick}
        className="flex-shrink-0 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-accent rounded-lg"
        aria-label="Go to Dashboard"
      >
        <Logo />
      </button>

      {/* Actions Section */}
      <div className="flex items-center gap-3 sm:gap-8">
        
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme} 
          className="
            p-2 rounded-full transition-colors
            focus:outline-none focus:ring-2 focus:ring-accent

            /* ✅ FIX */
            text-gray-600 dark:text-[var(--text-secondary)]
            hover:text-gray-900 dark:hover:text-[var(--text-primary)]
            hover:bg-gray-100 dark:hover:bg-[var(--bg-primary)]
          "
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun size={20} className="sm:w-[22px] sm:h-[22px]" />
          ) : (
            <Moon size={20} className="sm:w-[22px] sm:h-[22px]" />
          )}
        </button>

        <div className="h-6 w-px bg-gray-200 dark:bg-[var(--border-color)] sm:h-8" />

        {/* User Profile Dropdown */}
        <div className="flex items-center gap-3 sm:gap-4 relative">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsMenuOpen((prev) => !prev);
            }}
            className="flex items-center gap-3 sm:gap-4 rounded-2xl p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-[var(--bg-primary)]"
          >
          <Avatar 
            username={displayUser?.username}
            src={displayUser?.avatar}
            className="h-8 w-8 sm:h-10 sm:w-10 ring-2 ring-transparent transition-all" 
          />
          
          {/* User Info (Desktop) */}
          <div className="hidden sm:flex flex-col">
            <span className="text-sm sm:text-base font-bold leading-none mb-0.5 max-w-[120px] truncate text-gray-900 dark:text-[var(--text-primary)]">
              {displayUser?.username || 'Guest'}
            </span>
            <span className={`text-[10px] sm:text-xs font-semibold ${levelInfo.color}`}>
              Level {levelInfo.level} {levelInfo.title}
            </span>
          </div>
          </button>

          {/* Dropdown Menu */}
          <div
            className={`
              absolute right-0 top-full mt-3 w-48 py-2
              border rounded-xl shadow-2xl
              transition-all duration-200 transform z-50
              bg-white dark:bg-[var(--bg-secondary)]
              border-gray-200 dark:border-[var(--border-color)]
              ${isMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'}
            `}
            onClick={(event) => event.stopPropagation()}
          >
            
            {/* Mobile User Info */}
            <div className="sm:hidden px-4 py-3 border-b border-gray-200 dark:border-[var(--border-color)]">
              <p className="font-bold truncate text-gray-900 dark:text-[var(--text-primary)]">
                {displayUser?.username}
              </p>
              <p className={`text-xs ${levelInfo.color} mt-1`}>
                Level {levelInfo.level} {levelInfo.title}
              </p>
            </div>

            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsSettingsOpen(true);
              }}
              className="
                w-full px-4 py-3 text-left text-sm flex items-center gap-3 rounded-lg transition-colors
                text-gray-700 dark:text-[var(--text-primary)]
                hover:bg-gray-100 dark:hover:bg-[var(--bg-primary)]
              "
            >
              <Settings size={16} />
              <span>Settings</span>
            </button>
            
            {/* Logout Button */}
            <button 
              onClick={() => {
                setIsMenuOpen(false);
                onLogout?.();
              }}
              className="
                w-full px-4 py-3 text-left text-sm flex items-center gap-3 rounded-lg transition-colors

                text-red-500
                hover:bg-gray-100 dark:hover:bg-[var(--bg-primary)]
              "
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
      </nav>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={displayUser}
        onUserUpdate={handleUserUpdate}
        onRequireReauth={handleRequireReauth}
      />
    </>
  );
};

export default React.memo(Navbar);
// V 1.5

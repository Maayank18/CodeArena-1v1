import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogOut, Moon, Settings, Sun, Zap, Trophy } from 'lucide-react';
import { Logo } from './Logo';
import Avatar from './Avatar';
import SettingsModal from './SettingsModal.jsx';
import { useTheme } from '../context/ThemeContext';
import { getLevelInfo } from '../utils/levelSystem';
import { getAdvancedThemeMeta } from '../utils/advancedThemes';

const Navbar = ({ user, onLogout, onUserUpdate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, advancedTheme, clearAdvancedTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [displayUser, setDisplayUser] = useState(user);
  const [settingsInitialTab, setSettingsInitialTab] = useState('profile');
  const activeAdvancedTheme = getAdvancedThemeMeta(advancedTheme);

  useEffect(() => {
    if (location.pathname === '/settings') {
      setIsSettingsOpen(true);
    } else {
      setIsSettingsOpen(false);
    }
  }, [location.pathname]);

  const handleCloseSettings = useCallback(() => {
    setIsSettingsOpen(false);
    setSettingsInitialTab('profile');

    if (location.pathname === '/settings') {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, location.pathname]);

  useEffect(() => {
    const handleOpenSettings = (event) => {
      const targetTab = event.detail?.tab || 'profile';
      setSettingsInitialTab(targetTab);
      setIsSettingsOpen(true);
      if (location.pathname !== '/settings') {
        navigate('/settings');
      }
    };

    window.addEventListener('codearena:open-settings', handleOpenSettings);
    return () => window.removeEventListener('codearena:open-settings', handleOpenSettings);
  }, [navigate, location.pathname]);

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

  const levelInfo = useMemo(() => getLevelInfo(displayUser?.rating || 1000), [displayUser?.rating]);

  const handleLogoClick = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const handleUserUpdate = useCallback((nextUser) => {
    if (!nextUser || typeof nextUser !== 'object') {
      return;
    }

    setDisplayUser(nextUser);
    onUserUpdate?.(nextUser);
  }, [onUserUpdate]);

  const handleRequireReauth = useCallback(() => {
    setIsSettingsOpen(false);
    setIsMenuOpen(false);
    localStorage.removeItem('codearena_user');
    localStorage.removeItem('dashboard_profile_cache');
    clearAdvancedTheme();
    toast.success('Password updated. Please sign in again.');
    navigate('/login');
  }, [navigate, clearAdvancedTheme]);

  const openCustomizationSettings = useCallback(() => {
    navigate('/settings');
    window.dispatchEvent(new CustomEvent('codearena:open-settings', { detail: { tab: 'customization' } }));
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
          bg-[var(--surface-elevated)] dark:bg-[var(--surface-elevated)]
          border-gray-200 dark:border-[var(--border-color)]
        "
      >
        <button
          onClick={handleLogoClick}
          className="flex-shrink-0 rounded-lg transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-accent"
          aria-label="Go to Dashboard"
        >
          <Logo />
        </button>

        <div className="flex items-center gap-3 sm:gap-8">
          <button
            onClick={() => toast('Contests coming soon!', {
              icon: <Trophy size={18} className="text-yellow-500" />,
              style: {
                borderRadius: '12px',
                background: 'var(--surface-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
                fontWeight: '600',
              },
            })}
            className="hidden items-center gap-2 text-sm font-bold text-[var(--text-secondary)] transition-all cursor-pointer hover:text-[var(--text-primary)] hover:underline lg:flex"
          >
            <Trophy size={16} />
            <span>Contest</span>
          </button>

          <button
            onClick={() => navigate('/pricing')}
            className="hidden items-center gap-2 text-sm font-bold text-yellow-400 transition-all cursor-pointer hover:text-yellow-300 hover:underline lg:flex"
          >
            <Zap size={16} className="fill-current" />
            <span>Upgrade</span>
          </button>

          {activeAdvancedTheme ? (
            <button
              onClick={openCustomizationSettings}
              className={activeAdvancedTheme.badgeClassName}
              title={`${activeAdvancedTheme.name} theme active - click to manage`}
            >
              <span className="advanced-theme-indicator-icon" aria-hidden="true">
                {activeAdvancedTheme.icon}
              </span>
              <span className="hidden lg:inline">{activeAdvancedTheme.name}</span>
            </button>
          ) : (
            <button
              onClick={toggleTheme}
              className="
                p-2 rounded-full transition-colors
                focus:outline-none focus:ring-2 focus:ring-accent
                text-gray-500 dark:text-[var(--text-secondary)]
                hover:text-gray-800 dark:hover:text-[var(--text-primary)]
                hover:bg-[var(--bg-tertiary)] dark:hover:bg-[var(--bg-primary)]
              "
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun size={20} className="sm:h-[22px] sm:w-[22px]" />
              ) : (
                <Moon size={20} className="sm:h-[22px] sm:w-[22px]" />
              )}
            </button>
          )}

          <div className="h-6 w-px bg-gray-200 dark:bg-[var(--border-color)] sm:h-8" />

          <div className="relative flex items-center gap-3 sm:gap-4 z-[60] pointer-events-auto">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setIsMenuOpen((prev) => !prev);
              }}
              className="flex items-center gap-3 rounded-2xl p-1.5 transition-colors hover:bg-[var(--bg-tertiary)] dark:hover:bg-[var(--bg-primary)] sm:gap-4"
            >
              <Avatar
                username={displayUser?.username}
                src={displayUser?.avatar}
                className="h-8 w-8 ring-2 ring-transparent transition-all sm:h-10 sm:w-10"
              />

              <div className="hidden flex-col sm:flex text-left">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="max-w-[120px] truncate text-sm font-bold leading-none text-gray-800 dark:text-[var(--text-primary)] sm:text-base">
                    {displayUser?.username || 'Guest'}
                  </span>
                  {displayUser?.subscriptionPlan && displayUser.subscriptionPlan !== 'free' && (
                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md shadow-sm ${
                      displayUser.subscriptionPlan === 'plus'
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                        : displayUser.subscriptionPlan === 'pro'
                          ? 'bg-accent/10 text-accent border border-accent/20 text-glow-accent'
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    }`}>
                      {displayUser.subscriptionPlan}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-semibold sm:text-xs ${levelInfo.color}`}>
                  Level {levelInfo.level} {levelInfo.title}
                </span>
              </div>
            </button>

            <div
              className={`
                absolute right-0 top-full z-50 mt-3 w-48 rounded-xl border py-2 shadow-2xl transition-all duration-200
                bg-[var(--surface-elevated)] dark:bg-[var(--surface-elevated)]
                border-gray-200 dark:border-[var(--border-color)]
                ${isMenuOpen ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-2 opacity-0'}
              `}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="border-b border-gray-200 px-4 py-3 dark:border-[var(--border-color)] sm:hidden">
                <p className="truncate font-bold text-gray-800 dark:text-[var(--text-primary)]">
                  {displayUser?.username}
                </p>
                <p className={`mt-1 text-xs ${levelInfo.color}`}>
                  Level {levelInfo.level} {levelInfo.title}
                </p>
              </div>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('/settings');
                }}
                className="
                  flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition-colors
                  text-gray-700 dark:text-[var(--text-primary)]
                  hover:bg-[var(--bg-tertiary)] dark:hover:bg-[var(--bg-primary)]
                "
              >
                <Settings size={16} />
                <span>Settings</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onLogout?.();
                }}
                className="
                  flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition-colors
                  text-red-500
                  hover:bg-[var(--bg-tertiary)] dark:hover:bg-[var(--bg-primary)]
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
        onClose={handleCloseSettings}
        user={displayUser}
        onUserUpdate={handleUserUpdate}
        onRequireReauth={handleRequireReauth}
        initialTab={settingsInitialTab}
      />
    </>
  );
};

export default React.memo(Navbar);

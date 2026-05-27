import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  BadgeCheck,
  Bell,
  Camera,
  Check,
  Lock,
  Mail,
  Save,
  Settings2,
  Shield,
  Smartphone,
  UserRound,
  X,
  BarChart3,
  Activity,
  Info,
  Award,
  Palette,
  Users,
  Loader2,
  BookOpen,
  CreditCard,
} from 'lucide-react';
import BadgesTab from './settings/BadgesTab.jsx';
import CustomizationTab from './settings/CustomizationTab.jsx';
import CommunityTab from './settings/CommunityTab.jsx';
import NotesTab from './settings/NotesTab.jsx';
import BillingTab from './settings/BillingTab.jsx';
import PremiumGate from './PremiumGate.jsx';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../api.js';
import Avatar from './Avatar.jsx';

const getApiErrorMessage = (error, fallback) => {
  if (error?.message === 'Duplicate request') {
    return error.message;
  }

  const backendMessage = error?.response?.data?.message;
  const backendCode = error?.response?.data?.code;
  const status = error?.response?.status;

  if (import.meta.env.DEV && (backendMessage || error?.message)) {
    return [backendCode, backendMessage || error.message, status ? `(HTTP ${status})` : '']
      .filter(Boolean)
      .join(' ');
  }

  return backendMessage || fallback;
};

const tabs = [
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'preferences', label: 'Preferences', icon: Bell },
  { id: 'badges', label: 'Badges', icon: Award },
  { id: 'customization', label: 'Customize', icon: Palette },
  { id: 'notes', label: 'Notes', icon: BookOpen },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'community', label: 'Community', icon: Users },
];

const USERNAME_REGEX = /^[A-Za-z0-9_]{3,20}$/;
const buildInitialProfileForm = (user) => ({
  fullName: user?.fullName || '',
  username: user?.username || '',
  bio: user?.bio || '',
  avatar: user?.avatar || '',
});

const buildInitialSecurityForm = (user) => ({
  email: user?.email || '',
  phone: user?.phone || '',
  password: '',
  confirmPassword: '',
});

const buildInitialPreferencesForm = (user) => ({
  emailNotifications: Boolean(user?.preferences?.emailNotifications),
  marketingUpdates: Boolean(user?.preferences?.marketingUpdates),
});

const getPasswordError = (password) => {
  if (!password) return null;
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must include at least one number';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must include at least one special character';
  return null;
};

const ToggleCard = ({ title, description, checked, onChange }) => (
  <label className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-4 py-4 transition-colors hover:border-[var(--border-color)]">
    <div>
      <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="text-xs text-[var(--text-secondary)]">{description}</p>
    </div>
    <span
      className={`relative h-7 w-12 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-[var(--bg-tertiary)]'}`}
    >
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </span>
  </label>
);

const EMPTY_ANALYTICS_DATA = {
  summary: {
    timeSpentMinutes: 0,
    totalSolved: 0,
    totalAttempts: 0,
    accuracyPercent: 0,
    currentStreak: 0,
  },
  activity: [],
  topicBreakdown: [],
};

const AnalyticsTab = () => {
  const [analyticsData, setAnalyticsData] = useState(EMPTY_ANALYTICS_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get('/stats/analytics');
        if (!cancelled && data?.success) {
          setAnalyticsData(data.data || EMPTY_ANALYTICS_DATA);
        }
      } catch {
        if (!cancelled) {
          setAnalyticsData(EMPTY_ANALYTICS_DATA);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAnalytics();
    return () => {
      cancelled = true;
    };
  }, []);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const summary = analyticsData.summary || {};
  const activity = analyticsData.activity || [];
  const topics = analyticsData.topicBreakdown || [];

  const downloadWeeklyReport = async () => {
    try {
      const { data } = await api.get('/stats/weekly-report');
      if (data.success) {
        const report = data.report;
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CodeArena_Weekly_Report_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        toast.success('Weekly report generated!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate report');
    }
  };

  const storedUser = JSON.parse(localStorage.getItem('codearena_user') || '{}');
  const plan = storedUser?.subscriptionPlan || 'free';
  const isAdmin = storedUser?.role === 'admin';
  const userTier = isAdmin ? 3 : (plan === 'free' ? 0 : plan === 'plus' ? 1 : plan === 'pro' ? 2 : 3);

  return (
    <PremiumGate requiredTier="pro">
      <div className="space-y-8 animate-fade-in">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="animate-spin text-accent" size={32} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: 'Total Problems Solved', value: summary.totalSolved || 0, color: 'text-emerald-400' },
                { label: 'Overall Accuracy (%)', value: `${summary.accuracyPercent || 0}%`, color: 'text-blue-400' },
                { label: 'Total Time Spent (mins)', value: summary.timeSpentMinutes || 0, color: 'text-yellow-400' },
                { label: 'Current Streak (days)', value: summary.currentStreak || 0, color: 'text-orange-400' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 shadow-sm transition-colors hover:border-[var(--border-color)]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">{stat.label}</p>
                  <p className={`mt-2 text-2xl font-black ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                    <Activity size={16} className="text-emerald-400" />
                    Activity Over Time
                  </h4>
                  <span className="text-[10px] font-medium text-[var(--text-secondary)]">Last 7 Days</span>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#737373', fontSize: 10 }}
                      />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff', fontSize: '12px' }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      />
                      <Bar dataKey="solved" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                    <BarChart3 size={16} className="text-blue-400" />
                    Topic Distribution
                  </h4>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topics.map((topic) => ({ name: topic.topic, value: topic.solved }))}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {topics.map((entry, index) => (
                          <Cell key={`${entry.topic}-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-5">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
                  <Info size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">Performance Analysis</h4>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-primary)]">
                    {summary.totalAttempts > 0
                      ? `You've completed ${summary.totalSolved || 0} problems across ${summary.totalAttempts || 0} tracked attempts with ${summary.accuracyPercent || 0}% accuracy. Keep pushing your strongest topics while lifting the lower-volume areas in the chart.`
                      : 'Your analytics will appear here after your first tracked battles or campaign clears. For now, the charts stay intentionally empty and stable.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Premium Weekly Report Section */}
            <div className="pt-4 border-t border-[var(--border-color)]">
              <div className={`relative p-6 rounded-2xl border-2 transition-all duration-300 overflow-hidden
                ${userTier >= 3 
                  ? 'bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-emerald-500/20' 
                  : 'bg-gray-500/5 border-gray-500/10 opacity-60 grayscale'}
              `}>
                <div className="flex items-center justify-between gap-6">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <BarChart3 size={16} className="text-emerald-400" />
                      Weekly Performance Report
                    </h4>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      Get a detailed breakdown of your progress, win rates, and campaign efficiency for the last 7 days.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (userTier < 3) {
                        toast.error('Weekly Reports require Premium tier.', { icon: '🔒' });
                        return;
                      }
                      downloadWeeklyReport();
                    }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all
                      ${userTier >= 3 
                        ? 'bg-emerald-500 text-black hover:scale-105 shadow-lg shadow-emerald-500/20' 
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)] cursor-not-allowed'}
                    `}
                  >
                    {userTier >= 3 ? <Save size={14} /> : <Lock size={14} />}
                    Download Report
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </PremiumGate>
  );
};

const VerifiedBadge = ({ label }) => (
  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
    <BadgeCheck size={13} />
    {label}
  </span>
);

const StatusBadge = ({ verified }) => (
  verified ? (
    <VerifiedBadge label="Verified" />
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">
      <Info size={13} />
      Unverified
    </span>
  )
);

const SettingsModal = ({ isOpen, onClose, user, onUserUpdate, onRequireReauth, initialTab }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState(() => buildInitialProfileForm(user));
  const [securityForm, setSecurityForm] = useState(() => buildInitialSecurityForm(user));
  const [preferencesForm, setPreferencesForm] = useState(() => buildInitialPreferencesForm(user));
  const [otpCode, setOtpCode] = useState('');
  const [otpPending, setOtpPending] = useState(null);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isMounted = true;

    const syncProfile = async () => {
      setLoadingProfile(true);
      try {
        const { data } = await api.get('/settings/profile');
        if (!isMounted) return;

        const freshUser = data?.user;
        if (freshUser && typeof freshUser === 'object' && freshUser.username) {
          setProfileForm(buildInitialProfileForm(freshUser));
          setSecurityForm(buildInitialSecurityForm(freshUser));
          setPreferencesForm(buildInitialPreferencesForm(freshUser));
          if (typeof onUserUpdate === 'function') {
            onUserUpdate(freshUser);
          }
        } else {
          // API returned unexpected shape — use existing user prop as fallback
          setProfileForm(buildInitialProfileForm(user));
          setSecurityForm(buildInitialSecurityForm(user));
          setPreferencesForm(buildInitialPreferencesForm(user));
        }
      } catch (error) {
        if (!isMounted) return;
        // Populate forms from existing user prop so the UI isn't blank
        setProfileForm(buildInitialProfileForm(user));
        setSecurityForm(buildInitialSecurityForm(user));
        setPreferencesForm(buildInitialPreferencesForm(user));
        toast.error(error?.response?.data?.message || 'Unable to load settings');
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
        }
      }
    };

    syncProfile();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setActiveTab('profile');
      setOtpPending(null);
      setOtpCode('');
      setIsChangingEmail(false);

      setProfileForm(buildInitialProfileForm(user));
      setSecurityForm(buildInitialSecurityForm(user));
      setPreferencesForm(buildInitialPreferencesForm(user));
    }
  }, [isOpen, user]);

  const usernameError = useMemo(() => {
    if (!profileForm.username) return null;
    return USERNAME_REGEX.test(profileForm.username)
      ? null
      : 'Username must be 3-20 characters and use only letters, numbers, or underscores';
  }, [profileForm.username]);

  const passwordError = useMemo(() => getPasswordError(securityForm.password), [securityForm.password]);

  const closeModal = () => {
    setOtpPending(null);
    setOtpCode('');

    onClose();
  };

  const persistUser = (nextUser) => {
    if (!nextUser) return;
    const storedUser = JSON.parse(localStorage.getItem('codearena_user') || '{}');
    const mergedUser = { ...storedUser, ...nextUser };
    localStorage.setItem('codearena_user', JSON.stringify(mergedUser));
    localStorage.removeItem('dashboard_profile_cache');
    onUserUpdate?.(mergedUser);
    window.dispatchEvent(new CustomEvent('codearena:user-updated', { detail: mergedUser }));
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }

    if (file.size > 1024 * 1024) {
      toast.error('Avatar image must be 1MB or smaller');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfileForm((prev) => ({
        ...prev,
        avatar: typeof reader.result === 'string' ? reader.result : prev.avatar,
      }));
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    if (!profileForm.fullName.trim() || profileForm.fullName.trim().length < 2) {
      toast.error('Full name must be at least 2 characters');
      return;
    }

    if (usernameError) {
      toast.error(usernameError);
      return;
    }

    setSavingProfile(true);
    try {
      const { data } = await api.put('/settings/profile', {
        fullName: profileForm.fullName,
        username: profileForm.username,
        bio: profileForm.bio,
        avatar: profileForm.avatar,
        preferences: preferencesForm,
      });
      persistUser(data.user);
      setSecurityForm(buildInitialSecurityForm(data.user));
      toast.success(data.message || 'Profile updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePreferences = async () => {
    setSavingPreferences(true);
    try {
      const { data } = await api.put('/settings/profile', {
        fullName: profileForm.fullName,
        username: profileForm.username,
        bio: profileForm.bio,
        avatar: profileForm.avatar,
        preferences: preferencesForm,
      });
      persistUser(data.user);
      toast.success('Preferences updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save preferences');
    } finally {
      setSavingPreferences(false);
    }
  };

  const requestOtp = async () => {
    if (securityForm.password) {
      if (passwordError) {
        toast.error(passwordError);
        return;
      }

      if (securityForm.password !== securityForm.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
    }

    if (!securityForm.password) {
      toast.error('Enter a new password before requesting a verification code');
      return;
    }

    setRequestingOtp(true);
    try {
      const { data } = await api.post('/settings/request-otp', {
        password: securityForm.password,
      });
      setOtpPending({ password: true });
      setOtpCode('');

      toast.success(data.message || 'Verification code sent');
    } catch (error) {
      if (error?.message === 'Duplicate request') return;
      console.error('[SETTINGS OTP] Request failed', {
        status: error?.response?.status,
        code: error?.response?.data?.code,
        message: error?.response?.data?.message || error?.message,
      });
      toast.error(getApiErrorMessage(error, 'Unable to send verification code'));
    } finally {
      setRequestingOtp(false);
    }
  };

  const requestEmailVerification = async () => {
    setRequestingOtp(true);
    try {
      const { data } = await api.post('/settings/request-email-verification');
      setOtpPending({ email: true });
      setOtpCode('');
      toast.success(data.message || 'Verification code sent');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to send verification code'));
    } finally {
      setRequestingOtp(false);
    }
  };

  const requestEmailChangeVerification = async () => {
    const emailVal = securityForm.email.trim();
    if (!emailVal) {
      toast.error('Please enter a valid email address');
      return;
    }
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(emailVal)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setRequestingOtp(true);
    try {
      const { data } = await api.post('/settings/request-email-verification', {
        newEmail: emailVal,
      });
      setOtpPending({ email: true, isChange: true });
      setOtpCode('');
      toast.success(data.message || 'Verification code sent to your new email');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to send verification code'));
    } finally {
      setRequestingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpCode.trim()) {
      toast.error('Enter the 6 digit verification code');
      return;
    }

    setVerifyingOtp(true);
    try {
      const endpoint = otpPending?.email ? '/settings/verify-email' : '/settings/verify-otp';
      const { data } = await api.post(endpoint, { otp: otpCode.trim() });

      const syncUser = data.user ? { user: data.user } : null;
      api.clearCache?.();

      let freshUser = syncUser?.user || null;
      try {
        const { data: profileData } = await api.get('/settings/profile', {
          params: { refresh: Date.now() },
        });
        freshUser = profileData?.user || freshUser;
      } catch (profileError) {
        console.warn('[SETTINGS OTP] Fresh profile sync failed after verification', profileError);
      }

      if (freshUser) {
        persistUser(freshUser);
        setProfileForm(buildInitialProfileForm(freshUser));
        setSecurityForm(buildInitialSecurityForm(freshUser));
        setPreferencesForm(buildInitialPreferencesForm(freshUser));
        setIsChangingEmail(false);
      }
      setOtpPending(null);
      setOtpCode('');

      toast.success(data.message || 'Updated successfully');

      if (data.requiresReauth) {
        onRequireReauth?.();
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to verify code'));
    } finally {
      setVerifyingOtp(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeModal}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-[0_24px_80px_rgba(0,0,0,0.45)] h-[650px] max-h-[calc(100dvh-32px)] sm:max-h-[calc(100dvh-48px)]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[var(--border-color)] px-5 py-5 sm:px-7">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-400">Account Center</p>
              <h2 className="mt-1 text-2xl font-black text-[var(--text-primary)]">Settings</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Manage your profile, security, and notification preferences.</p>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-full border border-[var(--border-color)] bg-[var(--bg-tertiary)] p-2 text-[var(--text-secondary)] transition-colors hover:border-[var(--border-color)] hover:text-[var(--text-primary)]"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
            <aside className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)] p-3 lg:w-64 lg:border-b-0 lg:border-r">
              <div className="flex gap-2 overflow-x-auto lg:flex-col">
                {tabs.map((tab) => {
                  const plan = user?.subscriptionPlan || 'free';
                  const tier = plan === 'free' ? 0 : plan === 'plus' ? 1 : plan === 'pro' ? 2 : 3;

                  // Define tier requirements
                  const tierRequirements = {
                    analytics: 2,
                    badges: 2,
                    customization: 2,
                    notes: 1
                  };

                  const isLocked = tierRequirements[tab.id] ? tier < tierRequirements[tab.id] : false;
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex min-w-max items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all lg:min-w-0 ${
                        isActive
                          ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/10'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 lg:gap-3">
                        <Icon size={16} className="shrink-0" />
                        <span className="text-xs sm:text-sm">{tab.label}</span>
                      </div>
                      {isLocked && (
                        <Lock size={14} className={isActive ? 'text-black/60' : 'text-emerald-500/60'} />
                      )}
                    </button>
                  );
                })}
              </div>
            </aside>

            <main className="flex-1 overflow-y-auto bg-[var(--bg-primary)] p-5 custom-scrollbar sm:p-7">
              {loadingProfile ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="animate-spin text-emerald-500" size={32} />
                </div>
              ) : (
                <div className="mx-auto max-w-2xl min-h-full flex flex-col">
                  {activeTab === 'profile' && (
                    <div className="space-y-8 animate-fade-in">
                      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                        <div className="group relative">
                          <div className="h-24 w-24 overflow-hidden rounded-3xl bg-[var(--bg-tertiary)]">
                            {profileForm.avatar ? (
                              <img src={profileForm.avatar} alt="Avatar" className="h-full w-full object-cover" />
                            ) : (
                              <Avatar username={user?.username} size={96} />
                            )}
                          </div>
                          <label className="absolute -bottom-2 -right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl border-4 border-[#121212] bg-emerald-500 text-black transition-transform hover:scale-110">
                            <Camera size={18} />
                            <input type="file" className="sr-only" accept="image/*" onChange={handleAvatarUpload} />
                          </label>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-[var(--text-primary)]">{user?.username}</h4>
                          <p className="text-xs text-[var(--text-secondary)]">
                            Member since {new Date(user?.createdAt).toLocaleDateString()}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <VerifiedBadge label={user?.subscriptionPlan?.toUpperCase() || 'FREE'} />
                            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">
                              Rank #{user?.stats?.rank || '---'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Full Name</label>
                          <div className="relative">
                            <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                            <input
                              value={profileForm.fullName}
                              onChange={(e) => setProfileForm((prev) => ({ ...prev, fullName: e.target.value }))}
                              className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] py-3.5 pl-12 pr-4 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-emerald-500"
                              placeholder="Your full name"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Username</label>
                          <div className="relative">
                            <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                            <input
                              value={profileForm.username}
                              onChange={(e) => setProfileForm((prev) => ({ ...prev, username: e.target.value }))}
                              className={`w-full rounded-2xl border bg-[var(--bg-tertiary)] py-3.5 pl-12 pr-4 text-sm text-[var(--text-primary)] outline-none transition-colors ${
                                usernameError ? 'border-red-500/50' : 'border-[var(--border-color)] focus:border-emerald-500'
                              }`}
                              placeholder="username"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Bio</label>
                        <textarea
                          value={profileForm.bio}
                          onChange={(e) => setProfileForm((prev) => ({ ...prev, bio: e.target.value }))}
                          rows={3}
                          className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] p-4 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-emerald-500"
                          placeholder="Tell us about yourself..."
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={saveProfile}
                          disabled={savingProfile || !!usernameError}
                          className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-8 py-3 text-sm font-bold text-black transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {savingProfile ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Save size={18} />
                          )}
                          Save Changes
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'analytics' && (
                    <PremiumGate requiredTier="pro" message="Upgrade to Pro to unlock advanced analytics and performance insights.">
                      <AnalyticsTab />
                    </PremiumGate>
                  )}

                  {activeTab === 'security' && (
                    <div className="space-y-8 animate-fade-in">
                      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] p-5">
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
                              <Shield size={20} />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-[var(--text-primary)]">Security Controls</h4>
                              <p className="text-xs text-[var(--text-secondary)]">Password changes require OTP verification via your current email address.</p>
                            </div>
                          </div>
                      </div>

                      <div className="grid gap-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Email Address</label>
                            {!isChangingEmail ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsChangingEmail(true);
                                }}
                                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                              >
                                Change Email
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsChangingEmail(false);
                                  setSecurityForm((prev) => ({ ...prev, email: user?.email || '' }));
                                }}
                                className="text-xs text-red-400 hover:text-red-300 font-semibold"
                              >
                                Cancel Change
                              </button>
                            )}
                          </div>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                            <input
                              value={securityForm.email}
                              onChange={(e) => {
                                if (isChangingEmail) {
                                  setSecurityForm((prev) => ({ ...prev, email: e.target.value }));
                                }
                              }}
                              readOnly={!isChangingEmail}
                              className={`w-full rounded-2xl border py-3.5 pl-12 pr-28 text-sm text-[var(--text-primary)] outline-none transition-colors ${
                                isChangingEmail
                                  ? 'border-emerald-500 bg-[var(--bg-secondary)]'
                                  : 'border-[var(--border-color)] bg-[var(--bg-tertiary)]'
                              }`}
                              placeholder="email@example.com"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                              {isChangingEmail ? (
                                <button
                                  type="button"
                                  onClick={requestEmailChangeVerification}
                                  disabled={requestingOtp || !securityForm.email}
                                  className="text-[10px] font-black uppercase tracking-tighter bg-emerald-500 text-black px-2 py-1 rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50"
                                >
                                  {requestingOtp ? '...' : 'Send Code'}
                                </button>
                              ) : user?.emailVerified ? (
                                <StatusBadge verified={true} />
                              ) : (
                                <button
                                  type="button"
                                  onClick={requestEmailVerification}
                                  disabled={requestingOtp}
                                  className="text-[10px] font-black uppercase tracking-tighter bg-emerald-500 text-black px-2 py-1 rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50"
                                >
                                  {requestingOtp ? '...' : 'Verify Now'}
                                </button>
                              )}
                            </div>
                          </div>
                          {!user?.emailVerified && !isChangingEmail && (
                            <p className="px-2 text-[10px] text-emerald-400 font-bold">Email verification is required to upgrade your plan.</p>
                          )}
                          {isChangingEmail && (
                            <p className="px-2 text-[10px] text-emerald-400 font-bold">Enter your new email address to receive a verification code.</p>
                          )}
                        </div>

                        <div className="space-y-2 opacity-60">
                          <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Phone Number</label>
                          <div className="relative">
                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                            <input
                              value={securityForm.phone}
                              readOnly
                              disabled
                              className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] py-3.5 pl-12 pr-4 text-sm text-[var(--text-secondary)] outline-none cursor-not-allowed"
                              placeholder="Not provided"
                            />
                          </div>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">New Password</label>
                            <div className="relative">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                              <input
                                type="password"
                                value={securityForm.password}
                                onChange={(e) => setSecurityForm((prev) => ({ ...prev, password: e.target.value }))}
                                className={`w-full rounded-2xl border bg-[var(--bg-tertiary)] py-3.5 pl-12 pr-4 text-sm text-[var(--text-primary)] outline-none transition-colors ${
                                  passwordError ? 'border-red-500/50' : 'border-[var(--border-color)] focus:border-emerald-500'
                                }`}
                                placeholder="••••••••"
                              />
                            </div>
                            {passwordError && <p className="text-[10px] text-red-400 px-2">{passwordError}</p>}
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Confirm Password</label>
                            <div className="relative">
                              <Check className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                              <input
                                type="password"
                                value={securityForm.confirmPassword}
                                onChange={(e) => setSecurityForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                                className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] py-3.5 pl-12 pr-4 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-emerald-500"
                                placeholder="••••••••"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={requestOtp}
                          disabled={requestingOtp}
                          className="flex items-center gap-2 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] px-8 py-3 text-sm font-bold text-[var(--text-primary)] transition-all hover:bg-[#222] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {requestingOtp ? <Loader2 size={18} className="animate-spin" /> : 'Update Security'}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'preferences' && (
                    <div className="space-y-8 animate-fade-in">
                      <div className="space-y-4">
                        <ToggleCard
                          title="Email Notifications"
                          description="Receive updates about your account activity."
                          checked={preferencesForm.emailNotifications}
                          onChange={(e) =>
                            setPreferencesForm((prev) => ({ ...prev, emailNotifications: e.target.checked }))
                          }
                        />
                        <ToggleCard
                          title="Marketing Updates"
                          description="Stay informed about new features and events."
                          checked={preferencesForm.marketingUpdates}
                          onChange={(e) =>
                            setPreferencesForm((prev) => ({ ...prev, marketingUpdates: e.target.checked }))
                          }
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={savePreferences}
                          disabled={savingPreferences}
                          className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-8 py-3 text-sm font-bold text-black transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {savingPreferences ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                          Save Preferences
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'badges' && <BadgesTab />}

                  {activeTab === 'customization' && (
                    <PremiumGate requiredTier="premium" message="Upgrade to Premium to unlock exclusive profile frames, banners, and advanced themes.">
                      <CustomizationTab />
                    </PremiumGate>
                  )}

                  {activeTab === 'notes' && (
                    <PremiumGate requiredTier="plus" message="Upgrade to Plus to unlock the Spiral Notebook and persistent note-taking.">
                      <NotesTab />
                    </PremiumGate>
                  )}
                  {activeTab === 'billing' && <BillingTab />}
                  {activeTab === 'community' && <CommunityTab />}
                </div>
              )}
            </main>
          </div>

          <AnimatePresence>
            {otpPending && (
              <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
                <motion.button
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    setOtpPending(null);
                    setOtpCode('');

                  }}
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.98 }}
                  className="relative z-10 w-full max-w-md rounded-3xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-6 shadow-2xl"
                >
                  <div className="mb-4 inline-flex rounded-2xl bg-emerald-500/10 p-3 text-emerald-300">
                    <Settings2 size={22} />
                  </div>
                  <h3 className="text-xl font-black text-[var(--text-primary)]">
                    {otpPending?.email ? 'Verify Email Address' : 'Verify Password Change'}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {otpPending?.email 
                      ? 'Enter the 6 digit code sent to your email to verify your account.' 
                      : 'Enter the 6 digit code sent to your current email address to update your password.'}
                  </p>
                  <input
                    value={otpCode}
                    onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    maxLength={6}
                    className="mt-5 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-4 py-4 text-center text-xl font-bold tracking-[0.4em] text-[var(--text-primary)] outline-none transition-colors focus:border-emerald-500"
                    placeholder="000000"
                  />

                  <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpPending(null);
                        setOtpCode('');

                      }}
                      className="rounded-2xl border border-[var(--border-color)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--border-color)] hover:text-[var(--text-primary)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={verifyOtp}
                      disabled={verifyingOtp}
                      className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-black transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {verifyingOtp ? 'Verifying...' : 'Verify and Apply'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SettingsModal;
// fixer

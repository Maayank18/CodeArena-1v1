import React, { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
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

const tabs = [
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'preferences', label: 'Preferences', icon: Bell },
];

const USERNAME_REGEX = /^[A-Za-z0-9_]{3,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9]{10,15}$/;

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
  <label className="flex items-center justify-between gap-4 rounded-2xl border border-gray-800 bg-[#171717] px-4 py-4 transition-colors hover:border-gray-700">
    <div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="text-xs text-gray-400">{description}</p>
    </div>
    <span
      className={`relative h-7 w-12 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-[#232323]'}`}
    >
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </span>
  </label>
);

const AnalyticsTab = () => {
  const analyticsData = {
    stats: [
      { label: 'Total Problems Solved', value: '248', color: 'text-emerald-400' },
      { label: 'Overall Accuracy (%)', value: '78.5%', color: 'text-blue-400' },
      { label: 'Total Time Spent (hrs)', value: '142', color: 'text-yellow-400' },
      { label: 'Current Streak (days)', value: '12', color: 'text-orange-400' },
    ],
    activity: [
      { name: 'Mon', solved: 4 },
      { name: 'Tue', solved: 7 },
      { name: 'Wed', solved: 5 },
      { name: 'Thu', solved: 9 },
      { name: 'Fri', solved: 12 },
      { name: 'Sat', solved: 8 },
      { name: 'Sun', solved: 10 },
    ],
    topics: [
      { name: 'Arrays', value: 40 },
      { name: 'DP', value: 20 },
      { name: 'Graphs', value: 25 },
      { name: 'Math', value: 15 },
    ],
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Row 1: KPI Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {analyticsData.stats.map((stat, idx) => (
          <div key={idx} className="rounded-2xl border border-gray-800 bg-[#1a1a1a] p-4 shadow-sm transition-colors hover:border-gray-700">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{stat.label}</p>
            <p className={`mt-2 text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Row 2: Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity Bar Chart */}
        <div className="rounded-2xl border border-gray-800 bg-[#1a1a1a] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity size={16} className="text-emerald-400" />
              Activity Over Time
            </h4>
            <span className="text-[10px] font-medium text-gray-500">Last 7 Days</span>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.activity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#737373', fontSize: 10 }}
                />
                <YAxis 
                  hide={true}
                />
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

        {/* Topics Pie Chart */}
        <div className="rounded-2xl border border-gray-800 bg-[#1a1a1a] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 size={16} className="text-blue-400" />
              Topic Distribution
            </h4>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.topics}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analyticsData.topics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
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

      {/* Row 3: Insights */}
      <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-5">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
            <Info size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Performance Analysis</h4>
            <p className="mt-2 text-xs leading-relaxed text-gray-300">
              You have a high accuracy in <span className="font-bold text-emerald-400">Data Structures</span>, but your speed drops during <span className="font-bold text-blue-400">Dynamic Programming</span> challenges. Consider practicing more DP fundamentals to balance your competitive edge. Your activity peaked on Friday, showing high engagement during weekend starts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const VerifiedBadge = ({ label }) => (
  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
    <BadgeCheck size={13} />
    {label}
  </span>
);

const SettingsModal = ({ isOpen, onClose, user, onUserUpdate, onRequireReauth }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState(() => buildInitialProfileForm(user));
  const [securityForm, setSecurityForm] = useState(() => buildInitialSecurityForm(user));
  const [preferencesForm, setPreferencesForm] = useState(() => buildInitialPreferencesForm(user));
  const [otpCode, setOtpCode] = useState('');
  const [otpPending, setOtpPending] = useState(null);
  const [devOtp, setDevOtp] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const syncProfile = async () => {
      setLoadingProfile(true);
      try {
        const { data } = await api.get('/settings/profile');
        const freshUser = data.user;
        setProfileForm(buildInitialProfileForm(freshUser));
        setSecurityForm(buildInitialSecurityForm(freshUser));
        setPreferencesForm(buildInitialPreferencesForm(freshUser));
        onUserUpdate?.(freshUser);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Unable to load settings');
      } finally {
        setLoadingProfile(false);
      }
    };

    syncProfile();
  }, [isOpen, onUserUpdate]);

  useEffect(() => {
    if (!isOpen) {
      setActiveTab('profile');
      setOtpPending(null);
      setOtpCode('');
      setDevOtp('');
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
    setDevOtp('');
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
    const payload = {};

    if (securityForm.email.trim() && securityForm.email.trim() !== (user?.email || '')) {
      if (!EMAIL_REGEX.test(securityForm.email.trim())) {
        toast.error('Enter a valid email address');
        return;
      }
      payload.email = securityForm.email.trim();
    }

    if (securityForm.phone.trim() && securityForm.phone.trim() !== (user?.phone || '')) {
      if (!PHONE_REGEX.test(securityForm.phone.trim())) {
        toast.error('Enter a valid phone number');
        return;
      }
      payload.phone = securityForm.phone.trim();
    }

    if (securityForm.password) {
      if (passwordError) {
        toast.error(passwordError);
        return;
      }

      if (securityForm.password !== securityForm.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      payload.password = securityForm.password;
    }

    if (!payload.email && !payload.phone && !payload.password) {
      toast.error('Change at least one sensitive field before requesting a code');
      return;
    }

    setRequestingOtp(true);
    try {
      const { data } = await api.post('/settings/request-otp', payload);
      setOtpPending(payload);
      setOtpCode('');
      setDevOtp(data.devOtp || '');
      toast.success(data.message || 'Verification code sent');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to send verification code');
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
      const { data } = await api.post('/settings/verify-otp', { otp: otpCode.trim() });
      if (data.user) {
        persistUser(data.user);
        setProfileForm(buildInitialProfileForm(data.user));
        setSecurityForm(buildInitialSecurityForm(data.user));
        setPreferencesForm(buildInitialPreferencesForm(data.user));
      }
      setOtpPending(null);
      setOtpCode('');
      setDevOtp('');
      toast.success(data.message || 'Security settings updated');

      if (data.requiresReauth) {
        onRequireReauth?.();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to verify code');
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
          className="relative z-10 flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-gray-800 bg-[#121212] shadow-[0_24px_80px_rgba(0,0,0,0.45)] h-[650px]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-gray-800 px-5 py-5 sm:px-7">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-400">Account Center</p>
              <h2 className="mt-1 text-2xl font-black text-white">Settings</h2>
              <p className="mt-1 text-sm text-gray-400">Manage your profile, security, and notification preferences.</p>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-full border border-gray-800 bg-[#191919] p-2 text-gray-400 transition-colors hover:border-gray-700 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
            <aside className="border-b border-gray-800 bg-[#151515] p-3 lg:w-64 lg:border-b-0 lg:border-r">
              <div className="flex gap-2 overflow-x-auto lg:flex-col">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex min-w-fit items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-emerald-500 text-black shadow-[0_10px_24px_rgba(74,222,128,0.18)]'
                          : 'bg-[#191919] text-gray-300 hover:bg-[#1e1e1e] hover:text-white'
                      }`}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </aside>

            <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-5 sm:px-7">
              {loadingProfile ? (
                <div className="flex min-h-[420px] items-center justify-center text-sm text-gray-400">
                  Loading your settings...
                </div>
              ) : (
                <>
                  {activeTab === 'profile' && (
                    <div className="space-y-6">
                      <div className="rounded-3xl border border-gray-800 bg-[#171717] p-5">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                          <Avatar username={profileForm.username} src={profileForm.avatar} className="h-24 w-24 border-gray-700" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-white">Avatar</p>
                            <p className="mt-1 text-xs text-gray-400">Upload a square image up to 1MB. Preview updates instantly before saving.</p>
                            <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-700 bg-[#1d1d1d] px-4 py-2 text-sm font-semibold text-gray-100 transition-colors hover:border-gray-600 hover:bg-[#222]">
                              <Camera size={15} />
                              Choose Image
                              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Full Name</span>
                          <input
                            value={profileForm.fullName}
                            onChange={(event) => setProfileForm((prev) => ({ ...prev, fullName: event.target.value }))}
                            className="w-full rounded-2xl border border-gray-800 bg-[#171717] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-emerald-500"
                            placeholder="Enter your full name"
                          />
                        </label>
                        <label className="space-y-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Username</span>
                          <input
                            value={profileForm.username}
                            onChange={(event) => setProfileForm((prev) => ({ ...prev, username: event.target.value.replace(/\s/g, '') }))}
                            className="w-full rounded-2xl border border-gray-800 bg-[#171717] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-emerald-500"
                            placeholder="Choose a unique username"
                          />
                          {usernameError && <p className="text-xs text-red-400">{usernameError}</p>}
                        </label>
                      </div>

                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Bio</span>
                        <textarea
                          value={profileForm.bio}
                          onChange={(event) => setProfileForm((prev) => ({ ...prev, bio: event.target.value.slice(0, 240) }))}
                          rows={4}
                          className="w-full rounded-2xl border border-gray-800 bg-[#171717] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-emerald-500"
                          placeholder="Tell the arena a little about yourself"
                        />
                        <p className="text-right text-xs text-gray-500">{profileForm.bio.length}/240</p>
                      </label>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={saveProfile}
                          disabled={savingProfile}
                          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-black transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <Save size={16} />
                          {savingProfile ? 'Saving...' : 'Save Profile'}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'security' && (
                    <div className="space-y-6">
                      <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-100">
                        Sensitive changes are protected with a one-time verification code sent to your currently registered email address.
                      </div>

                      <div className="grid gap-4">
                        <label className="space-y-2">
                          <span className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                            <span className="inline-flex items-center gap-2"><Mail size={14} /> Email</span>
                            <VerifiedBadge label="Verified" />
                          </span>
                          <input
                            value={securityForm.email}
                            onChange={(event) => setSecurityForm((prev) => ({ ...prev, email: event.target.value }))}
                            className="w-full rounded-2xl border border-gray-800 bg-[#171717] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-emerald-500"
                            placeholder="Update your email"
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                            <span className="inline-flex items-center gap-2"><Smartphone size={14} /> Phone</span>
                            <VerifiedBadge label="Verified" />
                          </span>
                          <input
                            value={securityForm.phone}
                            onChange={(event) => setSecurityForm((prev) => ({ ...prev, phone: event.target.value }))}
                            className="w-full rounded-2xl border border-gray-800 bg-[#171717] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-emerald-500"
                            placeholder="Update your phone number"
                          />
                        </label>

                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="space-y-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">New Password</span>
                            <input
                              type="password"
                              value={securityForm.password}
                              onChange={(event) => setSecurityForm((prev) => ({ ...prev, password: event.target.value }))}
                              className="w-full rounded-2xl border border-gray-800 bg-[#171717] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-emerald-500"
                              placeholder="Create a strong password"
                            />
                          </label>
                          <label className="space-y-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Confirm Password</span>
                            <input
                              type="password"
                              value={securityForm.confirmPassword}
                              onChange={(event) => setSecurityForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                              className="w-full rounded-2xl border border-gray-800 bg-[#171717] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-emerald-500"
                              placeholder="Confirm your new password"
                            />
                          </label>
                        </div>

                        {passwordError && <p className="text-xs text-red-400">{passwordError}</p>}

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={requestOtp}
                            disabled={requestingOtp}
                            className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-black transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            <Lock size={16} />
                            {requestingOtp ? 'Sending Code...' : 'Update with OTP'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'preferences' && (
                    <div className="space-y-6">
                      <div className="grid gap-4">
                        <ToggleCard
                          title="Email Notifications"
                          description="Receive match reminders, account alerts, and important updates."
                          checked={preferencesForm.emailNotifications}
                          onChange={() => setPreferencesForm((prev) => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
                        />
                        <ToggleCard
                          title="Marketing Updates"
                          description="Hear about launches, tournaments, and premium feature drops."
                          checked={preferencesForm.marketingUpdates}
                          onChange={() => setPreferencesForm((prev) => ({ ...prev, marketingUpdates: !prev.marketingUpdates }))}
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={savePreferences}
                          disabled={savingPreferences}
                          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-black transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <Check size={16} />
                          {savingPreferences ? 'Saving...' : 'Save Preferences'}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'analytics' && <AnalyticsTab />}
                </>
              )}
            </div>
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
                    setDevOtp('');
                  }}
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.98 }}
                  className="relative z-10 w-full max-w-md rounded-3xl border border-gray-800 bg-[#121212] p-6 shadow-2xl"
                >
                  <div className="mb-4 inline-flex rounded-2xl bg-emerald-500/10 p-3 text-emerald-300">
                    <Settings2 size={22} />
                  </div>
                  <h3 className="text-xl font-black text-white">Verify Sensitive Changes</h3>
                  <p className="mt-2 text-sm text-gray-400">Enter the 6 digit code sent to your current email address to apply these updates.</p>
                  <input
                    value={otpCode}
                    onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    maxLength={6}
                    className="mt-5 w-full rounded-2xl border border-gray-800 bg-[#171717] px-4 py-4 text-center text-xl font-bold tracking-[0.4em] text-white outline-none transition-colors focus:border-emerald-500"
                    placeholder="000000"
                  />
                  {devOtp && (
                    <p className="mt-3 text-xs text-emerald-300">
                      Development OTP: <span className="font-semibold tracking-[0.25em]">{devOtp}</span>
                    </p>
                  )}
                  <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpPending(null);
                        setOtpCode('');
                        setDevOtp('');
                      }}
                      className="rounded-2xl border border-gray-800 px-4 py-3 text-sm font-semibold text-gray-300 transition-colors hover:border-gray-700 hover:text-white"
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

import React, { useState, useEffect, useCallback } from 'react';
import PremiumGate from '../PremiumGate';
import { Loader2, Check, Save, Palette, Code2, Type, ImageIcon } from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';

const AVATAR_FRAMES = [
    { id: 'none', name: 'Default', preview: 'border-[var(--border-color)]', ring: '', isExclusive: false },
    { id: 'neon-cyan', name: 'Neon Cyan', preview: 'border-cyan-400', ring: 'ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]', isExclusive: true },
    { id: 'gold-hexagon', name: 'Gold Hexagon', preview: 'border-amber-400', ring: 'ring-2 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]', isExclusive: true },
    { id: 'pulse-ring', name: 'Pulse Ring', preview: 'border-purple-400', ring: 'ring-2 ring-purple-400 animate-pulse shadow-[0_0_15px_rgba(192,132,252,0.4)]', isExclusive: true },
    { id: 'emerald-glow', name: 'Emerald Glow', preview: 'border-emerald-400', ring: 'ring-2 ring-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]', isExclusive: true },
    { id: 'crimson-edge', name: 'Crimson Edge', preview: 'border-red-400', ring: 'ring-2 ring-red-400 shadow-[0_0_15px_rgba(248,113,113,0.4)]', isExclusive: true },
];

const ENTRANCE_BANNERS = [
    { id: 'default-dark', name: 'Dark Void', gradient: 'from-gray-900 to-black', isExclusive: false },
    { id: 'aurora-borealis', name: 'Aurora', gradient: 'from-emerald-600 via-cyan-700 to-blue-800', isExclusive: true },
    { id: 'cyber-grid', name: 'Cyber Grid', gradient: 'from-violet-700 via-purple-800 to-indigo-900', isExclusive: true },
    { id: 'gradient-sunset', name: 'Sunset', gradient: 'from-orange-600 via-rose-700 to-pink-800', isExclusive: true },
    { id: 'deep-ocean', name: 'Deep Ocean', gradient: 'from-blue-800 via-sky-900 to-teal-900', isExclusive: true },
    { id: 'neon-tokyo', name: 'Neon Tokyo', gradient: 'from-pink-600 via-fuchsia-800 to-violet-900', isExclusive: true },
];

const ADVANCED_THEMES = [
    { id: 'glassmorphism', name: 'Glassmorphism', gradient: 'from-white/20 to-white/5 backdrop-blur-md border border-white/20', isPremium: true },
    { id: 'cyberpunk', name: 'Cyberpunk Neon', gradient: 'from-fuchsia-600 via-purple-700 to-pink-600 border border-pink-500/50', isPremium: true },
    { id: 'monochrome', name: 'Sleek Monochrome', gradient: 'from-gray-800 via-gray-900 to-black border border-gray-700', isPremium: true },
    { id: 'deep-space', name: 'Deep Space', gradient: 'from-slate-900 via-indigo-950 to-black border border-indigo-500/30', isPremium: true },
];

const STACK_LANGUAGES = [
    { id: 'javascript', name: 'JavaScript', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' },
    { id: 'typescript', name: 'TypeScript', color: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
    { id: 'python', name: 'Python', color: 'text-green-400 bg-green-400/10 border-green-400/30' },
    { id: 'java', name: 'Java', color: 'text-red-400 bg-red-400/10 border-red-400/30' },
    { id: 'cpp', name: 'C++', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30' },
    { id: 'go', name: 'Go', color: 'text-sky-400 bg-sky-400/10 border-sky-400/30' },
    { id: 'rust', name: 'Rust', color: 'text-orange-400 bg-orange-400/10 border-orange-400/30' },
    { id: 'kotlin', name: 'Kotlin', color: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
    { id: 'swift', name: 'Swift', color: 'text-orange-300 bg-orange-300/10 border-orange-300/30' },
    { id: 'csharp', name: 'C#', color: 'text-violet-400 bg-violet-400/10 border-violet-400/30' },
    { id: 'ruby', name: 'Ruby', color: 'text-rose-400 bg-rose-400/10 border-rose-400/30' },
    { id: 'dart', name: 'Dart', color: 'text-teal-400 bg-teal-400/10 border-teal-400/30' },
];

const CustomizationTab = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [avatarFrame, setAvatarFrame] = useState('none');
    const [tagline, setTagline] = useState('Novice');
    const [signatureStack, setSignatureStack] = useState([]);
    const [entranceBanner, setEntranceBanner] = useState('default-dark');

    const storedUser = JSON.parse(localStorage.getItem('codearena_user') || '{}');
    const plan = storedUser?.subscriptionPlan || 'free';
    const userTier = plan === 'free' ? 0 : plan === 'plus' ? 1 : plan === 'pro' ? 2 : 3;

    const handleExclusiveClick = (item, setter) => {
        if (item.isExclusive && userTier < 2) {
            toast.error(`${item.name} is a Pro tier customization.`, {
                icon: '🔒',
                style: { borderRadius: '10px', background: '#333', color: '#fff' }
            });
            return;
        }
        setter(item.id);
    };

    useEffect(() => {
        const fetchCustomization = async () => {
            try {
                const res = await api.get('/settings/customization');
                if (res.data?.success) {
                    const c = res.data.customization;
                    setAvatarFrame(c?.avatarFrame || 'none');
                    setTagline(c?.tagline || 'Novice');
                    setSignatureStack(c?.signatureStack || []);
                    setEntranceBanner(c?.entranceBanner || 'default-dark');
                }
            } catch (err) {
                console.error('Customization fetch failed:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomization();
    }, []);

    const toggleStackLang = useCallback((langId) => {
        setSignatureStack(prev => {
            if (prev.includes(langId)) {
                return prev.filter(l => l !== langId);
            }
            if (prev.length >= 3) {
                toast.error('Maximum 3 languages allowed');
                return prev;
            }
            return [...prev, langId];
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.put('/settings/customization', {
                avatarFrame,
                tagline,
                signatureStack,
                entranceBanner,
            });
            if (res.data?.success) {
                toast.success('Customization saved!');
                
                // ✅ SAFE UPDATE: Merge with existing localStorage to preserve token
                const storedUser = JSON.parse(localStorage.getItem('codearena_user') || '{}');
                const nextUser = res.data.user || { ...storedUser, customization: res.data.customization };
                const mergedUser = { ...storedUser, ...nextUser };
                
                localStorage.setItem('codearena_user', JSON.stringify(mergedUser));
                window.dispatchEvent(new CustomEvent('codearena:user-updated', { detail: mergedUser }));
            }
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to save customization';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="h-64 flex items-center justify-center">
                <Loader2 className="animate-spin text-accent" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-10">
                {/* Section 1: Avatar Frames */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Palette size={18} className="text-cyan-400" />
                        <h3 className="text-lg font-bold">Avatar Frame</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        {AVATAR_FRAMES.map(frame => {
                            const isActive = avatarFrame === frame.id;
                            const isLocked = frame.isExclusive && userTier < 2;
                            return (
                                <button
                                    key={frame.id}
                                    onClick={() => handleExclusiveClick(frame, setAvatarFrame)}
                                    className={`relative p-4 rounded-2xl border transition-all duration-200 flex flex-col items-center gap-3
                                        ${isActive
                                            ? 'bg-[var(--bg-secondary)] border-accent ring-1 ring-accent/50 scale-105'
                                            : 'bg-[var(--surface-elevated)] border-[var(--border-color)] hover:border-gray-600 hover:scale-102'
                                        } ${isLocked ? 'opacity-50 grayscale' : ''}`}
                                >
                                    <div className={`w-12 h-12 rounded-full border-2 ${frame.preview} ${isActive ? frame.ring : ''} transition-all`} />
                                    <span className="text-xs font-bold text-[var(--text-secondary)]">{frame.name}</span>
                                    {isActive && !isLocked && (
                                        <div className="absolute top-2 right-2">
                                            <Check size={14} className="text-accent" />
                                        </div>
                                    )}
                                    {isLocked && (
                                        <div className="absolute top-2 right-2">
                                            <Lock size={12} className="text-[var(--text-secondary)]" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Section 2: Professional Tagline */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Type size={18} className="text-purple-400" />
                        <h3 className="text-lg font-bold">Professional Tagline</h3>
                    </div>
                    <div className="max-w-md">
                        <input
                            type="text"
                            value={tagline}
                            onChange={(e) => setTagline(e.target.value.slice(0, 30))}
                            placeholder="e.g. Full-Stack Warrior"
                            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-accent transition-colors text-sm"
                        />
                        <p className="text-xs text-[var(--text-secondary)] mt-2">{tagline?.length || 0}/30 characters — shown on leaderboards</p>
                    </div>
                </section>

                {/* Section 3: Signature Tech Stack */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Code2 size={18} className="text-green-400" />
                        <h3 className="text-lg font-bold">Signature Tech Stack</h3>
                        <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full font-mono">{signatureStack.length}/3</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {STACK_LANGUAGES.map(lang => {
                            const isSelected = signatureStack.includes(lang.id);
                            return (
                                <button
                                    key={lang.id}
                                    onClick={() => toggleStackLang(lang.id)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-200
                                        ${isSelected
                                            ? `${lang.color} scale-105 ring-1 ring-current shadow-lg`
                                            : 'bg-[var(--surface-elevated)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-gray-500'
                                        }`}
                                >
                                    {lang.name}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Section 4: Entrance Banner */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <ImageIcon size={18} className="text-amber-400" />
                        <h3 className="text-lg font-bold">Match Entrance Banner</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {ENTRANCE_BANNERS.map(banner => {
                            const isActive = entranceBanner === banner.id;
                            const isLocked = banner.isExclusive && userTier < 2;
                            return (
                                <button
                                    key={banner.id}
                                    onClick={() => handleExclusiveClick(banner, setEntranceBanner)}
                                    className={`relative h-24 rounded-2xl bg-gradient-to-r ${banner.gradient} border-2 transition-all duration-200 overflow-hidden
                                        ${isActive
                                            ? 'border-accent ring-2 ring-accent/40 scale-105'
                                            : 'border-transparent hover:border-gray-600 hover:scale-102'
                                        } ${isLocked ? 'opacity-50 grayscale' : ''}`}
                                >
                                    <div className="absolute inset-0 flex items-end p-3">
                                        <span className="text-xs font-bold text-[var(--text-primary)]/80 drop-shadow">{banner.name}</span>
                                    </div>
                                    {isActive && !isLocked && (
                                        <div className="absolute top-2 right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                            <Check size={12} className="text-black" />
                                        </div>
                                    )}
                                    {isLocked && (
                                        <div className="absolute top-2 right-2 w-5 h-5 bg-black/40 rounded-full flex items-center justify-center">
                                            <Lock size={12} className="text-white/60" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Section 5: Advanced Themes (Premium Only) */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Palette size={18} className="text-rose-400" />
                        <h3 className="text-lg font-bold">Advanced UI Themes</h3>
                        <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">Premium</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {ADVANCED_THEMES.map(theme => {
                            const isLocked = userTier < 3;
                            return (
                                <button
                                    key={theme.id}
                                    onClick={() => {
                                        if (isLocked) {
                                            toast.error(`${theme.name} is a Premium tier exclusive.`, {
                                                icon: '🔒',
                                                style: { borderRadius: '10px', background: '#333', color: '#fff' }
                                            });
                                            return;
                                        }
                                        toast.success(`${theme.name} applied!`);
                                    }}
                                    className={`relative h-28 rounded-2xl bg-gradient-to-br ${theme.gradient} border-2 border-transparent transition-all duration-300 overflow-hidden group
                                        ${isLocked ? 'opacity-50 grayscale scale-[0.98]' : 'hover:scale-105 hover:border-white/30'}
                                    `}
                                >
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/90 text-center leading-tight drop-shadow-lg">{theme.name}</span>
                                    </div>
                                    {isLocked && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                                            <div className="p-2 bg-black/60 rounded-full border border-white/10">
                                                <Lock size={16} className="text-white/70" />
                                            </div>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t border-[var(--border-color)]">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl bg-accent text-black font-bold text-sm hover:bg-[#3bd175] transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-900/20"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {saving ? 'Saving...' : 'Save Customization'}
                    </button>
                </div>
            </div>
    );
};

export default CustomizationTab;

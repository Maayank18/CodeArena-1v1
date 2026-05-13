import React, { useState, useEffect, useCallback } from 'react';
import PremiumGate from '../PremiumGate';
import { Loader2, Check, Save, Palette, Code2, Type, ImageIcon } from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';

const AVATAR_FRAMES = [
    { id: 'none', name: 'Default', preview: 'border-gray-700', ring: '' },
    { id: 'neon-cyan', name: 'Neon Cyan', preview: 'border-cyan-400', ring: 'ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]' },
    { id: 'gold-hexagon', name: 'Gold Hexagon', preview: 'border-amber-400', ring: 'ring-2 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]' },
    { id: 'pulse-ring', name: 'Pulse Ring', preview: 'border-purple-400', ring: 'ring-2 ring-purple-400 animate-pulse shadow-[0_0_15px_rgba(192,132,252,0.4)]' },
    { id: 'emerald-glow', name: 'Emerald Glow', preview: 'border-emerald-400', ring: 'ring-2 ring-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]' },
    { id: 'crimson-edge', name: 'Crimson Edge', preview: 'border-red-400', ring: 'ring-2 ring-red-400 shadow-[0_0_15px_rgba(248,113,113,0.4)]' },
];

const ENTRANCE_BANNERS = [
    { id: 'default-dark', name: 'Dark Void', gradient: 'from-gray-900 to-black' },
    { id: 'aurora-borealis', name: 'Aurora', gradient: 'from-emerald-600 via-cyan-700 to-blue-800' },
    { id: 'cyber-grid', name: 'Cyber Grid', gradient: 'from-violet-700 via-purple-800 to-indigo-900' },
    { id: 'gradient-sunset', name: 'Sunset', gradient: 'from-orange-600 via-rose-700 to-pink-800' },
    { id: 'deep-ocean', name: 'Deep Ocean', gradient: 'from-blue-800 via-sky-900 to-teal-900' },
    { id: 'neon-tokyo', name: 'Neon Tokyo', gradient: 'from-pink-600 via-fuchsia-800 to-violet-900' },
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
        <PremiumGate requiredTier="pro">
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
                            return (
                                <button
                                    key={frame.id}
                                    onClick={() => setAvatarFrame(frame.id)}
                                    className={`relative p-4 rounded-2xl border transition-all duration-200 flex flex-col items-center gap-3
                                        ${isActive
                                            ? 'bg-white/[0.05] border-accent ring-1 ring-accent/50 scale-105'
                                            : 'bg-[var(--surface-elevated)] border-[var(--border-color)] hover:border-gray-600 hover:scale-102'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-full border-2 ${frame.preview} ${isActive ? frame.ring : ''} transition-all`} />
                                    <span className="text-xs font-bold text-[var(--text-secondary)]">{frame.name}</span>
                                    {isActive && (
                                        <div className="absolute top-2 right-2">
                                            <Check size={14} className="text-accent" />
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
                            return (
                                <button
                                    key={banner.id}
                                    onClick={() => setEntranceBanner(banner.id)}
                                    className={`relative h-24 rounded-2xl bg-gradient-to-r ${banner.gradient} border-2 transition-all duration-200 overflow-hidden
                                        ${isActive
                                            ? 'border-accent ring-2 ring-accent/40 scale-105'
                                            : 'border-transparent hover:border-gray-600 hover:scale-102'
                                        }`}
                                >
                                    <div className="absolute inset-0 flex items-end p-3">
                                        <span className="text-xs font-bold text-white/80 drop-shadow">{banner.name}</span>
                                    </div>
                                    {isActive && (
                                        <div className="absolute top-2 right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                            <Check size={12} className="text-black" />
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
        </PremiumGate>
    );
};

export default CustomizationTab;

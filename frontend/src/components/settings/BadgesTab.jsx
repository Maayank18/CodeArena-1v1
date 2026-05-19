import React, { useState, useEffect } from 'react';
import PremiumGate from '../PremiumGate';
import { Loader2, Lock, Check, Award } from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';
import { BADGE_DEFINITIONS, GLOW_MAP, CATEGORIES } from '../../utils/badgeHelper';

const BadgesTab = () => {
    const [earnedBadges, setEarnedBadges] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');
    const [equippedBadge, setEquippedBadge] = useState('');

    const storedUser = JSON.parse(localStorage.getItem('codearena_user') || '{}');
    const plan = storedUser?.subscriptionPlan || 'free';
    const userTier = plan === 'free' ? 0 : plan === 'plus' ? 1 : plan === 'pro' ? 2 : 3;

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                const res = await api.get('/settings/badges');
                if (res.data?.success) {
                    setEarnedBadges(res.data.badges || []);
                    setStats(res.data.stats);
                }
            } catch (err) {
                console.error('Badge fetch failed:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchBadges();
    }, []);

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('codearena_user') || '{}');
        setEquippedBadge(stored.customization?.equippedBadge || '');
    }, []);

    const handleEquipBadge = async (badgeId) => {
        const isEquipped = equippedBadge === badgeId;
        const newEquipped = isEquipped ? '' : badgeId;

        if (userTier < 2) {
            toast.error('Equipping badges is a Pro tier customization.', {
                icon: '🔒',
                style: { borderRadius: '10px', background: '#333', color: '#fff' }
            });
            return;
        }

        try {
            const res = await api.put('/settings/customization', {
                equippedBadge: newEquipped
            });
            if (res.data?.success) {
                setEquippedBadge(newEquipped);
                toast.success(isEquipped ? 'Unequipped badge!' : `Equipped ${BADGE_DEFINITIONS.find(b => b.id === badgeId)?.name || 'Badge'}!`);
                
                const currentStored = JSON.parse(localStorage.getItem('codearena_user') || '{}');
                const nextUser = res.data.user || {
                    ...currentStored,
                    customization: {
                        ...currentStored.customization,
                        equippedBadge: newEquipped
                    }
                };
                const mergedUser = { ...currentStored, ...nextUser };
                localStorage.setItem('codearena_user', JSON.stringify(mergedUser));
                window.dispatchEvent(new CustomEvent('codearena:user-updated', { detail: mergedUser }));
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to equip badge');
        }
    };

    if (loading) {
        return (
            <div className="h-64 flex items-center justify-center">
                <Loader2 className="animate-spin text-accent" size={32} />
            </div>
        );
    }

    const earned = earnedBadges?.length || 0;
    const total = BADGE_DEFINITIONS.length;

    const filteredBadges = activeCategory === 'all' 
        ? BADGE_DEFINITIONS 
        : BADGE_DEFINITIONS.filter(b => b.category === activeCategory);

    return (
        <div className="space-y-8">
            {/* Header Stats */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-black">Achievement Badges</h2>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">Collect badges by dominating the arena. {total} unique achievements await.</p>
                </div>
                <div className="bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-2xl px-6 py-3 flex items-center gap-3">
                    <Award className="text-amber-400" size={22} />
                    <span className="text-2xl font-black text-amber-400">{earned}</span>
                    <span className="text-[var(--text-secondary)] text-sm font-bold">/ {total} Earned</span>
                </div>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => setActiveCategory('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                        activeCategory === 'all'
                            ? 'bg-accent text-black'
                            : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-accent/50'
                    }`}
                >
                    All ({total})
                </button>
                {CATEGORIES.map(cat => {
                    const count = BADGE_DEFINITIONS.filter(b => b.category === cat).length;
                    const earnedCount = BADGE_DEFINITIONS.filter(b => b.category === cat && earnedBadges?.includes(b.id)).length;
                    return (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                activeCategory === cat
                                    ? 'bg-accent text-black'
                                    : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-accent/50'
                            }`}
                        >
                            {cat} ({earnedCount}/{count})
                        </button>
                    );
                })}
            </div>

            {/* Badge Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredBadges.map((badge) => {
                    const isEarned = earnedBadges?.includes(badge.id);
                    const isLockedByTier = badge.isExclusive && userTier < 2;
                    const Icon = badge.icon;
                    const glowClass = GLOW_MAP[badge.glow] || 'shadow-gray-500/20';
                    const isEquipped = equippedBadge === badge.id;

                    return (
                        <div
                            key={badge.id}
                            onClick={() => {
                                if (isEarned) {
                                    handleEquipBadge(badge.id);
                                } else if (isLockedByTier) {
                                    toast.error(`${badge.name} is a Pro tier exclusive achievement.`, {
                                        icon: '🔒',
                                        style: { borderRadius: '10px', background: '#333', color: '#fff' }
                                    });
                                }
                            }}
                            className={`relative group rounded-2xl border p-6 transition-all duration-300 ease-out cursor-pointer select-none
                                ${isEarned
                                    ? isEquipped
                                        ? `bg-[var(--bg-secondary)] border-accent shadow-2xl ${glowClass} ring-2 ring-accent/60 scale-[1.02]`
                                        : `bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-gray-500 hover:-translate-y-1 hover:scale-[1.02] shadow-xl hover:${glowClass}`
                                    : isLockedByTier
                                        ? 'bg-[var(--bg-tertiary)] border-[var(--border-color)] opacity-40 hover:opacity-50'
                                        : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] opacity-60'
                                }`}
                        >
                            {/* Category Tag / Equipped State */}
                            <div className="absolute top-3 right-3">
                                {isEquipped ? (
                                    <div className="flex items-center gap-1 bg-accent/20 text-accent border border-accent/40 rounded-full px-2 py-0.5 text-[10px] font-bold">
                                        <Check size={10} className="stroke-[3]" />
                                        <span>Equipped</span>
                                    </div>
                                ) : isEarned ? (
                                    <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${badge.gradient} shadow-lg`} />
                                ) : (
                                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">{badge.category}</span>
                                )}
                            </div>

                            {/* Badge Icon with Blurry Locked Preview */}
                            <div className="relative w-14 h-14 mb-4 select-none">
                                <div className={`w-full h-full rounded-xl flex items-center justify-center transition-transform duration-300
                                    ${isEarned
                                        ? `bg-gradient-to-br ${badge.gradient} shadow-lg group-hover:scale-110 group-hover:rotate-3`
                                        : `bg-gradient-to-br ${badge.gradient} opacity-20 blur-[3px]`
                                    }`}
                                >
                                    <Icon className="text-[var(--text-primary)]" size={26} />
                                </div>
                                {!isEarned && (
                                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20 rounded-xl">
                                        <Lock className={isLockedByTier ? "text-amber-500drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]" : "text-white/60"} size={18} />
                                    </div>
                                )}
                            </div>

                            {/* Badge Info */}
                            <h3 className={`text-lg font-bold mb-1 ${isEarned ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                                {badge.name}
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)]">
                                {isLockedByTier && !isEarned ? "Pro Tier Exclusive Achievement" : badge.desc}
                            </p>
                            
                            {isEarned && !isEquipped && (
                                <div className="absolute bottom-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <span className="text-[10px] text-accent font-bold uppercase tracking-wider">Click to Equip</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BadgesTab;

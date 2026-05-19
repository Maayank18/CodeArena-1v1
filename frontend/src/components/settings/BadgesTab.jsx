import React, { useState, useEffect } from 'react';
import { Loader2, Lock, Check, Award, Clock } from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';
import { BADGE_DEFINITIONS, GLOW_MAP, CATEGORIES } from '../../utils/badgeHelper';

const BadgeCard = ({ badge, userTier, equippedBadge, handleEquipBadge, isAdmin }) => {
    const [imgError, setImgError] = useState(false);
    const isEarned = badge.unlocked;
    const isLockedByTier = badge.category === 'Campaign' && userTier < 1; 
    const isVisualUnlock = isEarned || isAdmin;
    const glowClass = GLOW_MAP[badge.glow] || 'shadow-gray-500/20';
    const isEquipped = equippedBadge === badge.key;

    // Dynamically resolve image asset safely
    const badgeImageSrc = new URL(`../../assets/badges/${badge.assetName || badge.key + '.png'}`, import.meta.url).href;

    return (
        <div
            onClick={() => {
                if (isEarned || isAdmin) {
                    handleEquipBadge(badge.key);
                } else if (isLockedByTier) {
                    toast.error(`${badge.displayName} is a Plus/Pro tier exclusive achievement.`, {
                        icon: '🔒',
                        style: { borderRadius: '10px', background: '#333', color: '#fff' }
                    });
                }
            }}
            className={`relative flex flex-col group rounded-2xl border p-5 transition-all duration-300 ease-out select-none
                ${isVisualUnlock
                    ? isEquipped
                        ? `bg-[var(--bg-secondary)] border-accent shadow-2xl ${glowClass} ring-2 ring-accent/60 scale-[1.02] cursor-pointer`
                        : `bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-gray-500 hover:-translate-y-1 hover:scale-[1.02] shadow-xl hover:${glowClass} cursor-pointer`
                    : isLockedByTier
                        ? 'bg-[var(--bg-tertiary)] border-[var(--border-color)] opacity-40 hover:opacity-50 cursor-not-allowed'
                        : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] opacity-90 cursor-default hover:bg-[var(--surface-elevated)]'
                }`}
        >
            {/* Header row: Icon & Status */}
            <div className="flex justify-between items-start mb-4">
                {/* Visual Badge Art */}
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center bg-black/20 rounded-xl border border-[var(--border-color)] overflow-hidden p-1">
                    {!imgError ? (
                        <img 
                            src={badgeImageSrc} 
                            alt={badge.displayName} 
                            className={`w-full h-full object-contain transition-all duration-500 ${
                                isVisualUnlock 
                                    ? 'group-hover:scale-110 drop-shadow-lg opacity-100' 
                                    : 'filter blur-[3px] grayscale opacity-40 brightness-75 mix-blend-luminosity'
                            }`} 
                            onError={() => {
                                console.warn(`Badge asset missing for: ${badge.displayName} (${badgeImageSrc})`);
                                setImgError(true);
                            }}
                        />
                    ) : (
                        <Award size={28} className={isVisualUnlock ? 'text-accent' : 'text-gray-600'} />
                    )}
                    
                    {!isVisualUnlock && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20">
                            <Lock className={isLockedByTier ? "text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]" : "text-white/70 drop-shadow-md"} size={22} />
                        </div>
                    )}
                </div>

                {/* Status tags */}
                <div className="flex flex-col items-end gap-1">
                    {isAdmin && !isEarned && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
                            Admin Mode
                        </span>
                    )}
                    {isEquipped && (
                        <div className="flex items-center gap-1 bg-accent/20 text-accent border border-accent/40 rounded-full px-2 py-0.5 text-[10px] font-bold">
                            <Check size={10} className="stroke-[3]" />
                            <span>Equipped</span>
                        </div>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        badge.rarity === 'Legendary' ? 'bg-amber-500/20 text-amber-500' :
                        badge.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-400' :
                        badge.rarity === 'Rare' ? 'bg-blue-500/20 text-blue-400' :
                        badge.rarity === 'Uncommon' ? 'bg-green-500/20 text-green-400' :
                        'bg-gray-500/20 text-gray-400'
                    }`}>
                        {badge.rarity}
                    </span>
                </div>
            </div>

            {/* Badge Metadata */}
            <div className="flex-1">
                <h3 className={`text-lg font-bold mb-1 ${isVisualUnlock ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                    {badge.displayName}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                    {isLockedByTier && !isEarned ? "Plus/Pro Tier Exclusive Achievement" : badge.description}
                </p>
            </div>

            {/* Progress Section */}
            <div className="mt-auto pt-4 border-t border-[var(--border-color)]">
                <div className="flex justify-between text-xs font-bold mb-2">
                    <span className={isVisualUnlock ? 'text-accent' : 'text-[var(--text-secondary)]'}>
                        {isEarned ? 'Unlocked' : isAdmin ? 'Admin Override' : `Progress: ${badge.progress} / ${badge.requiredValue}`}
                    </span>
                    <span className="text-[var(--text-secondary)]">
                        {isEarned || isAdmin ? '' : `${badge.remaining} remaining`}
                    </span>
                </div>
                <div className="w-full bg-[var(--bg-primary)] rounded-full h-1.5 overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-1000 ease-out ${isEarned ? 'bg-accent' : isAdmin ? 'bg-red-500' : 'bg-gray-500'}`}
                        style={{ width: `${isAdmin && !isEarned ? 100 : badge.completionPercent}%` }}
                    />
                </div>
                {isEarned && badge.unlockedAt && (
                    <div className="flex items-center gap-1 mt-3 text-[10px] text-[var(--text-secondary)] font-medium">
                        <Clock size={12} />
                        <span>Earned on {new Date(badge.unlockedAt).toLocaleDateString()}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const BadgesTab = () => {
    const [earnedBadges, setEarnedBadges] = useState([]);
    const [achievementProgress, setAchievementProgress] = useState([]);
    const [catalog, setCatalog] = useState(BADGE_DEFINITIONS);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');
    const [equippedBadge, setEquippedBadge] = useState('');

    const storedUser = JSON.parse(localStorage.getItem('codearena_user') || '{}');
    const plan = storedUser?.subscriptionPlan || 'free';
    const userTier = plan === 'free' ? 0 : plan === 'plus' ? 1 : plan === 'pro' ? 2 : 3;
    const isAdmin = storedUser?.role === 'admin';

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                const res = await api.get('/settings/badges');
                if (res.data?.success) {
                    setEarnedBadges(res.data.earned || res.data.badges || []);
                    setAchievementProgress(res.data.achievementProgress || []);
                    setStats(res.data.stats);
                    // Use backend catalog if provided, else fallback to frontend helper
                    if (res.data.catalog) {
                        setCatalog(res.data.catalog);
                    }
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

        if (userTier < 2 && !isAdmin) {
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
                toast.success(isEquipped ? 'Unequipped badge!' : `Equipped Badge!`);
                
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
    const total = catalog.length || BADGE_DEFINITIONS.length;

    // Use frontend descriptions and UI classes, but merge with backend dynamic progress
    const mergedBadges = (catalog || BADGE_DEFINITIONS).map(backendDef => {
        const frontendDef = BADGE_DEFINITIONS.find(b => b.id === backendDef.key) || {};
        const progItem = achievementProgress.find(p => p.badgeKey === backendDef.key);
        
        let progress = 0;
        let unlocked = false;
        let unlockedAt = null;

        if (progItem) {
            progress = progItem.progress || 0;
            unlocked = progItem.unlocked || false;
            unlockedAt = progItem.unlockedAt;
        }
        
        // Backward compatibility
        if (earnedBadges.includes(backendDef.key)) {
            unlocked = true;
            progress = backendDef.requiredValue;
        }

        return {
            ...frontendDef,
            ...backendDef,
            progress,
            unlocked,
            unlockedAt,
            requiredValue: backendDef.requiredValue || 1,
            remaining: Math.max((backendDef.requiredValue || 1) - progress, 0),
            completionPercent: Math.min((progress / (backendDef.requiredValue || 1)) * 100, 100)
        };
    });

    const filteredBadges = activeCategory === 'all' 
        ? mergedBadges 
        : mergedBadges.filter(b => b.category === activeCategory);

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
                    <span className="text-2xl font-black text-amber-400">{isAdmin ? total : earned}</span>
                    <span className="text-[var(--text-secondary)] text-sm font-bold">/ {total} {isAdmin ? 'Unlocked (Admin)' : 'Earned'}</span>
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
                    const count = mergedBadges.filter(b => b.category === cat).length;
                    const earnedCount = mergedBadges.filter(b => b.category === cat && b.unlocked).length;
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
                            {cat} ({isAdmin ? count : earnedCount}/{count})
                        </button>
                    );
                })}
            </div>

            {/* Badge Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredBadges.map((badge) => (
                    <BadgeCard 
                        key={badge.key} 
                        badge={badge} 
                        userTier={userTier} 
                        equippedBadge={equippedBadge} 
                        handleEquipBadge={handleEquipBadge} 
                        isAdmin={isAdmin}
                    />
                ))}
            </div>
        </div>
    );
};

export default BadgesTab;

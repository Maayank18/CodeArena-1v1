import React, { useState, useEffect } from 'react';
import { Loader2, Lock, Check, Award, Clock, X } from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';
import { BADGE_DEFINITIONS, GLOW_MAP, CATEGORIES } from '../../utils/badgeHelper';
import { getBadgeImage, normalizeBadgeKey } from '../../utils/badgeAssets';

// Dynamic color matching dictionary for premium aesthetics
const GLOW_COLOR_MAP = {
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    pink: 'bg-pink-500/10 border-pink-500/20 text-pink-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    teal: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
    violet: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    lime: 'bg-lime-500/10 border-lime-500/20 text-lime-400',
    sky: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
    slate: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
    fuchsia: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400',
};

// ==========================================
// INTERACTIVE PORTAL SUB-COMPONENT: 3D REVOLVING PREVIEW MODAL (DOUBLE-SIDED COIN)
// ==========================================
const BadgeShowcaseModal = ({ badge, badgeImageSrc, onClose }) => {
    const glowColor = GLOW_COLOR_MAP[badge.glow] || 'bg-accent/10 text-accent border-accent/20';
    const glowBgClass = glowColor.split(' ')[0];

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center animate-fade-in">
            {/* Smooth Backdrop Overlay Blur */}
            <div 
                className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity duration-300 cursor-pointer"
                onClick={onClose}
            />

            {/* Showcase Viewbox Container */}
            <div className="relative z-10 w-full max-w-sm mx-4 overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900 via-zinc-950 to-black p-8 shadow-2xl flex flex-col items-center text-center">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg text-zinc-400"
                >
                    <X size={20} />
                </button>

                {/* Neon Ambience Background Glow (dynamically colored based on badge type) */}
                <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 blur-[60px] rounded-full pointer-events-none opacity-50 ${glowBgClass}`} />

                {/* Hardware Accelerated Continuous 3D Orbiting Framework */}
                <div 
                    className="w-44 h-44 mb-6 flex items-center justify-center cursor-grab active:cursor-grabbing"
                    style={{ perspective: '1000px' }}
                >
                    <div 
                        className="w-full h-full relative animate-badge-orbit"
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        {/* Front Face (Badge Image) */}
                        <div className="absolute inset-0 w-full h-full flex items-center justify-center" style={{ backfaceVisibility: 'hidden' }}>
                            {badgeImageSrc ? (
                                <img 
                                    src={badgeImageSrc} 
                                    alt={badge.displayName || badge.name} 
                                    className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(255,255,255,0.18)]"
                                />
                            ) : (
                                <Award size={96} className="text-accent" />
                            )}
                        </div>

                        {/* Back Face (Metallic Coin Back with Custom CodeArena Shield) */}
                        <div 
                            className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-b from-zinc-800 to-zinc-950 border border-zinc-700 flex flex-col items-center justify-center shadow-2xl" 
                            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                        >
                            <div className="flex flex-col items-center justify-center">
                                <div className="p-3 bg-zinc-900/60 rounded-full border border-zinc-800 mb-2">
                                    <Award size={48} className="text-zinc-400 opacity-80 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]" />
                                </div>
                                <span className="text-[10px] font-black text-zinc-400 tracking-[0.25em] uppercase">CODEARENA</span>
                                <span className="text-[7px] font-bold text-accent tracking-widest uppercase mt-0.5">EST. 2026</span>
                            </div>
                        </div>
                    </div>
                </div>

                <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                    {badge.displayName || badge.name}
                </h2>
                
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4 border ${glowColor}`}>
                    {badge.rarity} • {badge.category}
                </span>

                <p className="text-gray-400 text-sm leading-relaxed mb-2">
                    {badge.description || badge.desc}
                </p>

                {badge.unlockedAt && (
                    <div className="flex items-center gap-1 mt-4 text-xs text-gray-500 font-medium bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                        <Clock size={14} />
                        <span>Earned on {new Date(badge.unlockedAt).toLocaleDateString()}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// ==========================================
// STRUCTURAL SUB-COMPONENT: CORE BADGE DISPLAY CARD
// ==========================================
const BadgeCard = ({ badge, userTier, equippedBadge, handleEquipBadge, isAdmin, onTriggerShowcase }) => {
    const [imgError, setImgError] = useState(false);
    
    // Enforce definitive unlock matching state
    const realUnlockState = !!badge.unlocked;
    const adminPreviewOverride = isAdmin && !realUnlockState;
    const isVisualUnlock = realUnlockState || adminPreviewOverride;
    
    const glowClass = GLOW_MAP[badge.glow] || 'shadow-gray-500/20';
    const isEquipped = equippedBadge === badge.key;

    // Call resolver using both key extensions to guarantee extraction matching
    const badgeImageSrc = getBadgeImage(badge.key || badge.id);

    return (
        <div
            onClick={() => {
                if (isVisualUnlock) {
                    onTriggerShowcase(badge, badgeImageSrc);
                } else {
                    toast.error(`"${badge.displayName || badge.name}" remains locked. Complete the tracking objectives to inspect the achievement.`, {
                        icon: '🔒',
                        style: { borderRadius: '10px', background: '#222', color: '#fff', border: '1px solid #333' }
                    });
                }
            }}
            className={`relative flex flex-col group rounded-2xl border p-5 transition-all duration-300 ease-out select-none
                ${isVisualUnlock
                    ? isEquipped
                        ? `bg-[var(--bg-secondary)] border-accent shadow-2xl ${glowClass} ring-2 ring-accent/60 scale-[1.02] cursor-pointer hover:brightness-110`
                        : `bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-gray-500 hover:-translate-y-1 hover:scale-[1.02] shadow-xl hover:${glowClass} cursor-pointer`
                    : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] border-dashed opacity-75 cursor-pointer hover:opacity-90 transition-opacity'
                }`}
        >
            <div className="flex justify-between items-start mb-4">
                {/* Visual Badge Artwork Frame */}
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center bg-black/40 rounded-xl border border-[var(--border-color)] overflow-hidden p-1">
                    {!imgError && badgeImageSrc ? (
                        <img 
                            src={badgeImageSrc} 
                            alt={badge.displayName || badge.name} 
                            className={`w-full h-full object-contain transition-all duration-500
                                ${isVisualUnlock 
                                    ? 'group-hover:scale-110 drop-shadow-lg opacity-100' 
                                    : 'filter blur-[5px] grayscale brightness-[0.25] opacity-40 contrast-125' // High-Curiosity lock blur styling
                                }`} 
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <Award size={28} className={isVisualUnlock ? 'text-accent' : 'text-gray-600'} />
                    )}
                    
                    {/* Floating Lock Overlay for Locked Previews */}
                    {!isVisualUnlock && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/10">
                            <Lock className="text-white/60 drop-shadow-md" size={16} />
                        </div>
                    )}
                </div>

                {/* Interactive State Action Anchors */}
                <div className="flex flex-col items-end gap-1.5">
                    {isVisualUnlock && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation(); // Avoid popping the showcase modal when equipping
                                handleEquipBadge(badge.key);
                            }}
                            className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide border transition-all ${
                                isEquipped 
                                    ? 'bg-accent/20 text-accent border-accent/40' 
                                    : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30 hover:text-white'
                            }`}
                        >
                            {isEquipped ? 'Equipped' : 'Equip'}
                        </button>
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

            <div className="flex-1">
                <h3 className={`text-lg font-bold mb-1 ${isVisualUnlock ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                    {badge.displayName || badge.name}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                    {badge.description || badge.desc}
                </p>
            </div>

            {/* Metrics Configuration Progress Frame */}
            <div className="mt-auto pt-4 border-t border-[var(--border-color)]">
                <div className="flex justify-between text-xs font-bold mb-2">
                    <span className={isVisualUnlock ? 'text-accent' : 'text-[var(--text-secondary)]'}>
                        {realUnlockState ? 'Unlocked' : adminPreviewOverride ? 'Admin Preview (Locked)' : `Progress: ${badge.progress || 0} / ${badge.requiredValue}`}
                    </span>
                    {!realUnlockState && !adminPreviewOverride && (
                        <span className="text-[var(--text-secondary)]">
                            {badge.remaining} left
                        </span>
                    )}
                </div>
                <div className="w-full bg-[var(--bg-primary)] rounded-full h-1.5 overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-1000 ease-out ${realUnlockState ? 'bg-accent' : adminPreviewOverride ? 'bg-red-500' : 'bg-gray-700'}`}
                        style={{ width: `${badge.completionPercent || 0}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

// ==========================================
// MASTER LAYER ENGINE COMPONENT: BADGESTAB
// ==========================================
const BadgesTab = () => {
    const [earnedBadges, setEarnedBadges] = useState([]);
    const [achievementProgress, setAchievementProgress] = useState([]);
    const [catalog, setCatalog] = useState(BADGE_DEFINITIONS);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');
    const [equippedBadge, setEquippedBadge] = useState('');
    
    // Lightbox Anchor State Hook
    const [showcaseTarget, setShowcaseTarget] = useState(null);

    const storedUser = JSON.parse(localStorage.getItem('codearena_user') || '{}');
    const plan = (storedUser?.subscriptionPlan || 'free').toLowerCase();
    const userTier = plan === 'free' ? 0 : plan === 'plus' ? 1 : plan === 'pro' ? 2 : 3;
    const isAdmin = storedUser?.role === 'admin';

    // Global Gating Matrix Evaluation (Free and Plus plans are locked out, Pro/Premium/Admin get full access)
    const isSectionEntirelyLocked = (plan === 'free' || plan === 'plus') && !isAdmin;

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                const res = await api.get('/settings/badges');
                if (res.data?.success) {
                    setEarnedBadges(res.data.earned || res.data.badges || []);
                    setAchievementProgress(res.data.achievementProgress || []);
                    if (res.data.catalog && res.data.catalog.length > 0) {
                        setCatalog(res.data.catalog);
                    }
                }
            } catch (err) {
                console.error('Badge synchronization data pass failed:', err);
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
        if (!badgeId) return;
        const isCurrentlyEquipped = equippedBadge === badgeId;
        const newEquipped = isCurrentlyEquipped ? '' : badgeId;

        if (userTier < 2 && !isAdmin) {
            toast.error('Equipping profile badges requires a Pro or Premium tier plan configuration.', {
                icon: '🔒',
                style: { borderRadius: '10px', background: '#222', color: '#fff' }
            });
            return;
        }

        try {
            const res = await api.put('/settings/customization', { equippedBadge: newEquipped });
            if (res.data?.success) {
                setEquippedBadge(newEquipped);
                toast.success(isCurrentlyEquipped ? 'Unequipped badge successfully!' : `Equipped Badge!`);
                
                const currentStored = JSON.parse(localStorage.getItem('codearena_user') || '{}');
                const nextUser = res.data.user || {
                    ...currentStored,
                    customization: { ...currentStored.customization, equippedBadge: newEquipped }
                };
                const mergedUser = { ...currentStored, ...nextUser };
                localStorage.setItem('codearena_user', JSON.stringify(mergedUser));
                window.dispatchEvent(new CustomEvent('codearena:user-updated', { detail: mergedUser }));
            }
        } catch (err) {
            toast.error('Failed to update equipped custom configuration target.');
        }
    };

    if (loading) {
        return (
            <div className="h-64 flex items-center justify-center">
                <Loader2 className="animate-spin text-accent" size={32} />
            </div>
        );
    }

    // Absolute Lock Screen Intercept View for Free/Plus configurations
    if (isSectionEntirelyLocked) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border border-gray-800 bg-black/40 rounded-2xl backdrop-blur-md text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-red-500/20 rounded-full flex items-center justify-center mb-4 border border-amber-500/30 animate-pulse">
                    <Lock className="text-amber-400 text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-wide">Premium Achievement Showcase Grid</h3>
                <p className="text-gray-400 text-sm max-w-sm mt-2 leading-relaxed">
                    The showcase container is locked. Upgrade your subscription plan to <span className="text-cyan-400 font-semibold">PRO</span> or <span className="text-indigo-400 font-semibold">PREMIUM</span> to inspect the vault metrics, unlock custom artwork profiles, and equip items.
                </p>
            </div>
        );
    }

    // Process hydration normalization boundaries smoothly with case-insensitive matching
    const normalizedCatalog = (catalog && catalog.length > 0) ? catalog : BADGE_DEFINITIONS;
    
    const mergedBadges = normalizedCatalog.map(catalogItem => {
        const identifier = catalogItem.key || catalogItem.id;
        
        // Find configuration anchors on both variants safely using normalized keys
        const frontendDef = BADGE_DEFINITIONS.find(b => 
            normalizeBadgeKey(b.id) === normalizeBadgeKey(identifier) || 
            normalizeBadgeKey(b.key) === normalizeBadgeKey(identifier)
        ) || {};
        
        const progressDef = achievementProgress.find(p => 
            normalizeBadgeKey(p.badgeKey) === normalizeBadgeKey(identifier) ||
            normalizeBadgeKey(p.id) === normalizeBadgeKey(identifier)
        ) || {};

        let progress = progressDef.progress || 0;
        let unlocked = !!progressDef.unlocked;
        let unlockedAt = progressDef.unlockedAt || null;

        if (earnedBadges.some(b => normalizeBadgeKey(b) === normalizeBadgeKey(identifier))) {
            unlocked = true;
        }

        // Admin override block: Force complete tracking visual parameters instantly
        if (isAdmin) {
            unlocked = true;
        }

        const reqVal = catalogItem.requiredValue || frontendDef.requiredValue || 1;

        return {
            ...frontendDef,
            ...catalogItem,
            key: identifier,
            id: identifier,
            displayName: catalogItem.displayName || frontendDef.name || identifier,
            description: catalogItem.description || frontendDef.desc || '',
            progress,
            unlocked,
            unlockedAt,
            requiredValue: reqVal,
            remaining: Math.max(reqVal - progress, 0),
            completionPercent: Math.min((progress / reqVal) * 100, 100)
        };
    });

    const activeTotal = mergedBadges.length;
    const unlockedTotalCount = mergedBadges.filter(b => b.unlocked).length;

    const filteredBadges = activeCategory === 'all' 
        ? mergedBadges 
        : mergedBadges.filter(b => b.category?.toLowerCase() === activeCategory.toLowerCase());

    return (
        <div className="space-y-8 relative">
            {/* Header Block View */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="text-left">
                    <h2 className="text-2xl font-black">Achievement Vault Portfolio</h2>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">
                        Inspect active milestones and manage equippable tags. {activeTotal} achievements active.
                    </p>
                </div>
                <div className="bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-2xl px-6 py-3 flex items-center gap-3">
                    <Award className="text-amber-400" size={22} />
                    <span className="text-2xl font-black text-amber-400">
                        {isAdmin ? activeTotal : unlockedTotalCount}
                    </span>
                    <span className="text-[var(--text-secondary)] text-sm font-bold">
                        / {activeTotal} Unlocked {isAdmin && '(Admin Pass)'}
                    </span>
                </div>
            </div>

            {/* Filter Navigation Control Deck */}
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => setActiveCategory('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                        activeCategory === 'all' ? 'bg-accent text-black' : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                    }`}
                >
                    All ({activeTotal})
                </button>
                {CATEGORIES.map(cat => {
                    const count = mergedBadges.filter(b => b.category?.toLowerCase() === cat.toLowerCase()).length;
                    return (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                activeCategory.toLowerCase() === cat.toLowerCase() ? 'bg-accent text-black' : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                            }`}
                        >
                            {cat} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Main Cards Grid Box Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 text-left">
                {filteredBadges.map((badge) => (
                    <BadgeCard 
                        key={badge.key} 
                        badge={badge} 
                        userTier={userTier} 
                        equippedBadge={equippedBadge} 
                        handleEquipBadge={handleEquipBadge} 
                        isAdmin={isAdmin}
                        onTriggerShowcase={(b, src) => setShowcaseTarget({ badge: b, src })}
                    />
                ))}
            </div>

            {/* Faded Lightbox Portal Display */}
            {showcaseTarget && (
                <BadgeShowcaseModal 
                    badge={showcaseTarget.badge}
                    badgeImageSrc={showcaseTarget.src}
                    onClose={() => setShowcaseTarget(null)}
                />
            )}
        </div>
    );
};

export default BadgesTab;

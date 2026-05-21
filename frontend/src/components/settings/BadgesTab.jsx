import React, { useEffect, useMemo, useState } from 'react';
import { Award, Check, Clock, Loader2, Lock, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api';
import BadgeArtwork from '../badges/BadgeArtwork.jsx';
import { BADGE_DEFINITIONS, CATEGORIES, GLOW_MAP } from '../../utils/badgeHelper';
import { normalizeBadgeKey } from '../../utils/badgeAssets';

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

const getPlanTier = (plan) => {
  if (plan === 'premium') return 3;
  if (plan === 'pro') return 2;
  if (plan === 'plus') return 1;
  return 0;
};

const BadgeShowcaseModal = ({ badge, onClose }) => {
  const glowColor = GLOW_COLOR_MAP[badge.glow] || 'bg-accent/10 border-accent/20 text-accent';
  const glowBgClass = glowColor.split(' ')[0];

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center animate-fade-in">
      <div className="absolute inset-0 cursor-pointer bg-black/88 backdrop-blur-md" onClick={onClose} />

      <div className="relative z-10 mx-4 flex w-full max-w-md flex-col items-center overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#191b22] via-[#0f1117] to-black p-8 text-center shadow-[0_45px_90px_-35px_rgba(0,0,0,0.95)]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
        >
          <X size={18} />
        </button>

        <div className={`pointer-events-none absolute left-1/2 top-[32%] h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-55 blur-[76px] ${glowBgClass}`} />

        <div className="mb-6 flex h-52 w-52 items-center justify-center" style={{ perspective: '1200px' }}>
          <div className="animate-badge-orbit relative h-full w-full" style={{ transformStyle: 'preserve-3d' }}>
            {/* Layered stack to create a subtle 3D extrusion while keeping the existing flip/orbit */}
            <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
              <div className="relative h-full w-full" style={{ transformStyle: 'preserve-3d' }}>
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    transform: 'translateZ(-22px) scale(0.99)',
                    filter: 'brightness(0.55) saturate(0.75)',
                    opacity: 0.92,
                    backfaceVisibility: 'hidden',
                  }}
                >
                  <BadgeArtwork
                    badgeId={badge.key}
                    label={badge.displayName || badge.name}
                    frameClassName="h-full w-full"
                    imageClassName="h-full w-full object-cover"
                    noFrame
                  />
                </div>

                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    transform: 'translateZ(-8px) scale(0.995)',
                    filter: 'brightness(0.78) saturate(0.9)',
                    opacity: 0.98,
                    backfaceVisibility: 'hidden',
                  }}
                >
                  <BadgeArtwork
                    badgeId={badge.key}
                    label={badge.displayName || badge.name}
                    frameClassName="h-full w-full"
                    imageClassName="h-full w-full object-cover"
                    noFrame
                  />
                </div>

                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    transform: 'translateZ(0px) scale(1)',
                    backfaceVisibility: 'hidden',
                  }}
                >
                  <BadgeArtwork
                    badgeId={badge.key}
                    label={badge.displayName || badge.name}
                    frameClassName="h-full w-full"
                    imageClassName="h-full w-full object-contain drop-shadow-[0_26px_48px_rgba(0,0,0,0.6)]"
                    noFrame
                  />
                </div>
              </div>
            </div>

            <div
              className="absolute inset-0 rounded-[2rem] border border-white/10 bg-gradient-to-b from-zinc-800 to-zinc-950 shadow-2xl"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <div className="rounded-full border border-white/10 bg-white/5 p-4">
                  <Award size={44} className="text-zinc-300" />
                </div>
                <div className="text-[11px] font-black uppercase tracking-[0.38em] text-zinc-400">
                  CodeArena
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent/90">
                  Achievement Vault
                </div>
              </div>
            </div>
          </div>
        </div>

        <h2 className="mb-2 text-2xl font-black tracking-tight text-white">
          {badge.displayName || badge.name}
        </h2>

        <div className={`mb-4 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] ${glowColor}`}>
          {badge.rarity} • {badge.category}
        </div>

        <p className="mb-4 text-sm leading-relaxed text-zinc-400">
          {badge.description || badge.desc}
        </p>

        <div className="w-full rounded-2xl border border-white/6 bg-white/[0.03] p-4 text-left">
          <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-400">
            <span>{badge.unlocked ? 'Unlocked' : 'Progress'}</span>
            <span>{Math.round(badge.completionPercent || 0)}%</span>
          </div>
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-black/40">
            <div
              className={`h-full transition-all duration-700 ${badge.unlocked ? 'bg-accent' : 'bg-white/20'}`}
              style={{ width: `${badge.completionPercent || 0}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>
              {badge.unlocked ? 'Achievement earned' : `${badge.progress || 0} / ${badge.requiredValue || 1}`}
            </span>
            {badge.unlockedAt ? (
              <span className="inline-flex items-center gap-1">
                <Clock size={12} />
                {new Date(badge.unlockedAt).toLocaleDateString()}
              </span>
            ) : (
              <span>{badge.remaining || 0} left</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const LockedVaultPreview = ({ badges, onUpgrade }) => {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(20,23,31,0.96),rgba(9,10,14,0.98))] p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(74,238,136,0.10),transparent_44%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.10),transparent_38%)]" />
      <div className="relative z-10 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-amber-300">
            <Lock size={12} />
            Pro Required
          </div>
          <h3 className="text-2xl font-black tracking-tight text-white">Badge Vault Preview</h3>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
            Pro and Premium members can inspect, equip, and rotate earned badges. Your future unlocks are shown below as blurred previews so the vault still feels alive.
          </p>
        </div>
        <button
          onClick={onUpgrade}
          className="inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-black text-black transition-transform hover:scale-[1.02]"
        >
          <Sparkles size={16} />
          Upgrade for full access
        </button>
      </div>

      <div className="relative z-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {badges.slice(0, 6).map((badge) => (
          <div
            key={badge.key}
            className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4 shadow-[0_24px_55px_-40px_rgba(0,0,0,0.8)]"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <BadgeArtwork
                badgeId={badge.key}
                label={badge.displayName || badge.name}
                locked
                frameClassName="h-20 w-20 shrink-0"
              />
              <div className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                {badge.rarity}
              </div>
            </div>
            <div className="mb-2 text-base font-bold text-white">{badge.displayName || badge.name}</div>
            <div className="text-sm text-zinc-500">{badge.description || badge.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const BadgeCard = ({ badge, equippedBadge, handleEquipBadge, isAdmin, onTriggerShowcase }) => {
  const realUnlockState = !!badge.unlocked;
  const adminPreviewOverride = isAdmin && !realUnlockState;
  const isSelectable = realUnlockState || adminPreviewOverride;
  const isEquipped = equippedBadge === badge.key;
  const glowClass = GLOW_MAP[badge.glow] || 'shadow-gray-500/20';

  const rarityClass =
    badge.rarity === 'Legendary' ? 'bg-amber-500/18 text-amber-300 border-amber-400/20' :
    badge.rarity === 'Epic' ? 'bg-purple-500/18 text-purple-300 border-purple-400/20' :
    badge.rarity === 'Rare' ? 'bg-blue-500/18 text-blue-300 border-blue-400/20' :
    badge.rarity === 'Uncommon' ? 'bg-emerald-500/18 text-emerald-300 border-emerald-400/20' :
    'bg-slate-500/18 text-slate-300 border-slate-400/20';

  return (
    <div
      onClick={() => onTriggerShowcase(badge)}
      className={[
        'group relative flex cursor-pointer flex-col rounded-[1.75rem] border p-5 text-left transition-all duration-300',
        isEquipped
          ? `border-accent bg-[var(--bg-secondary)] ring-1 ring-accent/45 shadow-[0_28px_65px_-36px_rgba(74,238,136,0.7)] ${glowClass}`
          : isSelectable
            ? `border-[var(--border-color)] bg-[var(--bg-secondary)] hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_28px_65px_-40px_rgba(0,0,0,0.78)]`
            : 'border-dashed border-white/10 bg-[var(--bg-tertiary)]/80 hover:border-white/20'
      ].join(' ')}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <BadgeArtwork
          badgeId={badge.key}
          label={badge.displayName || badge.name}
          locked={!isSelectable}
          frameClassName={[
            'h-20 w-20 shrink-0 transition-transform duration-500',
            isSelectable ? 'group-hover:scale-[1.05]' : ''
          ].join(' ')}
          imageClassName={isSelectable ? 'group-hover:scale-[1.08]' : ''}
        />

        <div className="flex flex-col items-end gap-2">
          <div className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] ${rarityClass}`}>
            {badge.rarity}
          </div>
          {isSelectable && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                handleEquipBadge(badge.key);
              }}
              className={[
                'rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] transition-colors',
                isEquipped
                  ? 'border-accent/30 bg-accent/15 text-accent'
                  : 'border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:text-white'
              ].join(' ')}
            >
              {isEquipped ? 'Unequip' : 'Equip'}
            </button>
          )}
        </div>
      </div>

      <div className="mb-2 text-lg font-bold text-[var(--text-primary)]">
        {badge.displayName || badge.name}
      </div>
      <p className="mb-5 text-sm leading-relaxed text-[var(--text-secondary)]">
        {badge.description || badge.desc}
      </p>

      <div className="mt-auto border-t border-white/6 pt-4">
        <div className="mb-2 flex items-center justify-between text-xs font-bold">
          <span className={isSelectable ? 'text-accent' : 'text-[var(--text-secondary)]'}>
            {realUnlockState ? 'Unlocked' : adminPreviewOverride ? 'Admin Preview' : `${badge.progress || 0} / ${badge.requiredValue || 1}`}
          </span>
          {!realUnlockState && !adminPreviewOverride && (
            <span className="text-[var(--text-secondary)]">{badge.remaining || 0} left</span>
          )}
          {realUnlockState && (
            <span className="inline-flex items-center gap-1 text-emerald-300">
              <Check size={12} />
              Earned
            </span>
          )}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-black/35">
          <div
            className={realUnlockState ? 'h-full bg-accent' : adminPreviewOverride ? 'h-full bg-red-400/70' : 'h-full bg-white/18'}
            style={{ width: `${badge.completionPercent || 0}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const BadgesTab = () => {
  const navigate = useNavigate();
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [achievementProgress, setAchievementProgress] = useState([]);
  const [catalog, setCatalog] = useState(BADGE_DEFINITIONS);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [equippedBadge, setEquippedBadge] = useState('');
  const [showcaseTarget, setShowcaseTarget] = useState(null);

  const storedUser = JSON.parse(localStorage.getItem('codearena_user') || '{}');
  const plan = (storedUser?.subscriptionPlan || 'free').toLowerCase();
  const userTier = getPlanTier(plan);
  const isAdmin = storedUser?.role === 'admin';
  const hasBadgeAccess = userTier >= 2 || isAdmin;

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await api.get('/settings/badges');
        if (res.data?.success) {
          setEarnedBadges(Array.isArray(res.data.earned) ? res.data.earned : Array.isArray(res.data.badges) ? res.data.badges : []);
          setAchievementProgress(Array.isArray(res.data.achievementProgress) ? res.data.achievementProgress : []);
          if (Array.isArray(res.data.catalog) && res.data.catalog.length > 0) {
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

    if (!hasBadgeAccess) {
      toast.error('Equipping profile badges requires a Pro or Premium plan.', {
        style: { borderRadius: '10px', background: '#222', color: '#fff' },
      });
      return;
    }

    try {
      const res = await api.put('/settings/customization', { equippedBadge: newEquipped });
      if (res.data?.success) {
        setEquippedBadge(newEquipped);
        toast.success(isCurrentlyEquipped ? 'Badge unequipped successfully.' : 'Badge equipped successfully.');

        const currentStored = JSON.parse(localStorage.getItem('codearena_user') || '{}');
        const nextUser = res.data.user || {
          ...currentStored,
          customization: { ...currentStored.customization, equippedBadge: newEquipped },
        };
        const mergedUser = { ...currentStored, ...nextUser };
        localStorage.setItem('codearena_user', JSON.stringify(mergedUser));
        window.dispatchEvent(new CustomEvent('codearena:user-updated', { detail: mergedUser }));
      }
    } catch (err) {
      toast.error('Failed to update equipped badge.');
    }
  };

  const mergedBadges = useMemo(() => {
    const normalizedCatalog = Array.isArray(catalog) && catalog.length > 0 ? catalog : BADGE_DEFINITIONS;

    return normalizedCatalog.map((catalogItem) => {
      const identifier = catalogItem.key || catalogItem.id;

      const frontendDef = BADGE_DEFINITIONS.find((badge) =>
        normalizeBadgeKey(badge.id) === normalizeBadgeKey(identifier) ||
        normalizeBadgeKey(badge.key) === normalizeBadgeKey(identifier)
      ) || {};

      const progressDef = achievementProgress.find((progress) =>
        normalizeBadgeKey(progress.badgeKey) === normalizeBadgeKey(identifier) ||
        normalizeBadgeKey(progress.id) === normalizeBadgeKey(identifier)
      ) || {};

      let progress = progressDef.progress || 0;
      let unlocked = !!progressDef.unlocked;
      const unlockedAt = progressDef.unlockedAt || null;

      if (earnedBadges.some((badge) => normalizeBadgeKey(badge) === normalizeBadgeKey(identifier))) {
        unlocked = true;
      }

      if (isAdmin) {
        unlocked = true;
      }

      const requiredValue = catalogItem.requiredValue || frontendDef.requiredValue || 1;

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
        requiredValue,
        remaining: Math.max(requiredValue - progress, 0),
        completionPercent: Math.min((progress / requiredValue) * 100, 100),
      };
    });
  }, [achievementProgress, catalog, earnedBadges, isAdmin]);

  const activeTotal = mergedBadges.length;
  const unlockedTotalCount = mergedBadges.filter((badge) => badge.unlocked).length;

  const filteredBadges = useMemo(() => {
    if (activeCategory === 'all') return mergedBadges;
    return mergedBadges.filter((badge) => badge.category?.toLowerCase() === activeCategory.toLowerCase());
  }, [activeCategory, mergedBadges]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">Achievement Vault</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Inspect earned milestones and equip the badge that should ride with your profile.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-[1.5rem] border border-[var(--border-color)] bg-[var(--surface-elevated)] px-5 py-3">
          <Award className="text-amber-400" size={20} />
          <span className="text-2xl font-black text-amber-300">{isAdmin ? activeTotal : unlockedTotalCount}</span>
          <span className="text-sm font-bold text-[var(--text-secondary)]">/ {activeTotal} unlocked</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] transition-colors ${
            activeCategory === 'all'
              ? 'bg-accent text-black'
              : 'border border-[var(--border-color)] bg-[var(--surface-elevated)] text-[var(--text-secondary)]'
          }`}
        >
          All ({activeTotal})
        </button>
        {CATEGORIES.map((category) => {
          const count = mergedBadges.filter((badge) => badge.category?.toLowerCase() === category.toLowerCase()).length;
          return (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] transition-colors ${
                activeCategory.toLowerCase() === category.toLowerCase()
                  ? 'bg-accent text-black'
                  : 'border border-[var(--border-color)] bg-[var(--surface-elevated)] text-[var(--text-secondary)]'
              }`}
            >
              {category} ({count})
            </button>
          );
        })}
      </div>

      {!hasBadgeAccess ? (
        <LockedVaultPreview
          badges={filteredBadges}
          onUpgrade={() => navigate('/pricing?source=badge-vault')}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredBadges.map((badge) => (
            <BadgeCard
              key={badge.key}
              badge={badge}
              equippedBadge={equippedBadge}
              handleEquipBadge={handleEquipBadge}
              isAdmin={isAdmin}
              onTriggerShowcase={(nextBadge) => setShowcaseTarget(nextBadge)}
            />
          ))}
        </div>
      )}

      {showcaseTarget && (
        <BadgeShowcaseModal badge={showcaseTarget} onClose={() => setShowcaseTarget(null)} />
      )}
    </div>
  );
};

export default BadgesTab;

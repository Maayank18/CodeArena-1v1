import React, { useState, useEffect } from 'react';
import PremiumGate from '../PremiumGate';
import { Loader2, Lock, Shield, Flame, Zap, Target, Award, Star, Trophy, Crown, Timer, Swords, Eye, Moon, Brain, Hash, GitBranch, Layers, Search, ArrowUpDown } from 'lucide-react';
import api from '../../api';

const BADGE_DEFINITIONS = [
    // ── Speed (6) ─────────────────────────────────────────────────
    { id: 'flash',           category: 'Speed',       name: 'Flash',            desc: 'Win a match in under 5 minutes.',           icon: Zap,    gradient: 'from-yellow-400 to-amber-600',   glow: 'yellow' },
    { id: 'sub_minute',      category: 'Speed',       name: 'Sub-Minute',       desc: 'Solve a problem in under 60 seconds.',      icon: Timer,  gradient: 'from-cyan-400 to-blue-600',      glow: 'cyan' },
    { id: 'lightning_round', category: 'Speed',       name: 'Lightning Round',  desc: 'Complete all rounds in under 10 minutes.',  icon: Zap,    gradient: 'from-amber-400 to-orange-600',   glow: 'amber' },
    { id: 'speed_demon',     category: 'Speed',       name: 'Speed Demon',      desc: 'Win 5 matches in under 10 minutes each.',   icon: Flame,  gradient: 'from-red-500 to-orange-600',     glow: 'red' },
    { id: 'time_lord',       category: 'Speed',       name: 'Time Lord',        desc: 'Win a match with 20+ minutes remaining.',   icon: Timer,  gradient: 'from-indigo-500 to-purple-700',  glow: 'indigo' },
    { id: 'instant_kill',    category: 'Speed',       name: 'Instant Kill',     desc: 'Solve first before opponent submits once.', icon: Swords, gradient: 'from-rose-500 to-red-700',       glow: 'rose' },

    // ── Consistency (6) ───────────────────────────────────────────
    { id: 'streak_3',        category: 'Consistency',  name: 'Getting Started',  desc: 'Maintain a 3-day activity streak.',         icon: Flame,  gradient: 'from-green-500 to-emerald-700',  glow: 'green' },
    { id: 'streak_7',        category: 'Consistency',  name: 'Unstoppable',      desc: 'Maintain a 7-day consistency streak.',      icon: Flame,  gradient: 'from-orange-500 to-red-600',     glow: 'orange' },
    { id: 'streak_14',       category: 'Consistency',  name: 'Iron Will',        desc: 'Maintain a 14-day consistency streak.',     icon: Shield, gradient: 'from-slate-500 to-zinc-700',     glow: 'slate' },
    { id: 'streak_30',       category: 'Consistency',  name: 'Marathon Runner',  desc: 'Maintain a 30-day consistency streak.',     icon: Crown,  gradient: 'from-yellow-500 to-amber-700',   glow: 'yellow' },
    { id: 'weekend_warrior', category: 'Consistency',  name: 'Weekend Warrior',  desc: 'Play on 4 consecutive weekends.',           icon: Swords, gradient: 'from-sky-500 to-blue-700',      glow: 'sky' },
    { id: 'night_owl',       category: 'Consistency',  name: 'Night Owl',        desc: 'Win 10 matches played after midnight.',     icon: Moon,   gradient: 'from-violet-600 to-indigo-800',  glow: 'violet' },

    // ── Combat (9) ────────────────────────────────────────────────
    { id: 'first_blood',     category: 'Combat',      name: 'First Blood',      desc: 'Win your very first 1v1 battle.',           icon: Swords, gradient: 'from-cyan-500 to-blue-600',     glow: 'cyan' },
    { id: 'hat_trick',       category: 'Combat',      name: 'Hat Trick',        desc: 'Win 3 matches in a row.',                   icon: Trophy, gradient: 'from-amber-500 to-yellow-600',  glow: 'amber' },
    { id: 'arena_gladiator', category: 'Combat',      name: 'Arena Gladiator',  desc: 'Win 25 battles in the Arena.',              icon: Shield, gradient: 'from-emerald-500 to-green-700', glow: 'emerald' },
    { id: 'centurion',       category: 'Combat',      name: 'Centurion',        desc: 'Play 100 matches in total.',                icon: Award,  gradient: 'from-teal-500 to-cyan-700',     glow: 'teal' },
    { id: 'perfect_round',   category: 'Combat',      name: 'Perfect Round',    desc: 'Solve all problems in a single match.',     icon: Target, gradient: 'from-lime-500 to-green-600',    glow: 'lime' },
    { id: 'flawless_victory',category: 'Combat',      name: 'Flawless Victory', desc: 'Win a best-of-3 match 3-0.',                icon: Star,   gradient: 'from-pink-500 to-rose-700',     glow: 'pink' },
    { id: 'dominator',       category: 'Combat',      name: 'Dominator',        desc: 'Achieve a 10-match win streak.',            icon: Crown,  gradient: 'from-red-600 to-rose-800',      glow: 'red' },
    { id: 'underdog',        category: 'Combat',      name: 'Underdog',         desc: 'Beat an opponent 200+ ELO above you.',      icon: Eye,    gradient: 'from-blue-500 to-indigo-700',   glow: 'blue' },
    { id: 'survivor',        category: 'Combat',      name: 'Survivor',         desc: 'Win a match with <1 minute remaining.',     icon: Timer,  gradient: 'from-orange-600 to-red-700',    glow: 'orange' },

    // ── Mastery (9) ───────────────────────────────────────────────
    { id: 'array_ace',       category: 'Mastery',     name: 'Array Ace',        desc: 'Solve 10 Array problems.',                  icon: Layers,      gradient: 'from-blue-500 to-cyan-600',     glow: 'blue' },
    { id: 'string_slicer',   category: 'Mastery',     name: 'String Slicer',    desc: 'Solve 10 String problems.',                 icon: Award,       gradient: 'from-fuchsia-500 to-pink-700',  glow: 'fuchsia' },
    { id: 'tree_hugger',     category: 'Mastery',     name: 'Tree Hugger',      desc: 'Solve 10 Tree problems.',                   icon: GitBranch,   gradient: 'from-green-500 to-emerald-700', glow: 'green' },
    { id: 'graph_guru',      category: 'Mastery',     name: 'Graph Guru',       desc: 'Solve 10 Graph problems.',                  icon: Brain,       gradient: 'from-purple-500 to-violet-700', glow: 'purple' },
    { id: 'dp_dynamo',       category: 'Mastery',     name: 'DP Dynamo',        desc: 'Solve 10 Dynamic Programming problems.',    icon: Brain,       gradient: 'from-orange-500 to-amber-700',  glow: 'orange' },
    { id: 'sort_king',       category: 'Mastery',     name: 'Sort King',        desc: 'Solve 10 Sorting problems.',                icon: ArrowUpDown, gradient: 'from-teal-500 to-green-600',    glow: 'teal' },
    { id: 'binary_boss',     category: 'Mastery',     name: 'Binary Boss',      desc: 'Solve 10 Binary Search problems.',          icon: Search,      gradient: 'from-indigo-500 to-blue-700',   glow: 'indigo' },
    { id: 'hash_master',     category: 'Mastery',     name: 'Hash Master',      desc: 'Solve 10 Hash Table problems.',             icon: Hash,        gradient: 'from-rose-500 to-pink-700',     glow: 'rose' },
    { id: 'diamond_ranked',  category: 'Mastery',     name: 'Diamond Ranked',   desc: 'Reach a rating of 1500 ELO or higher.',     icon: Star,        gradient: 'from-violet-500 to-purple-700', glow: 'violet' },
];

const GLOW_MAP = {
    cyan: 'shadow-cyan-500/40', orange: 'shadow-orange-500/40', yellow: 'shadow-yellow-500/40',
    emerald: 'shadow-emerald-500/40', purple: 'shadow-purple-500/40', pink: 'shadow-pink-500/40',
    amber: 'shadow-amber-500/40', teal: 'shadow-teal-500/40', violet: 'shadow-violet-500/40',
    red: 'shadow-red-500/40', blue: 'shadow-blue-500/40', green: 'shadow-green-500/40',
    indigo: 'shadow-indigo-500/40', rose: 'shadow-rose-500/40', lime: 'shadow-lime-500/40',
    sky: 'shadow-sky-500/40', slate: 'shadow-slate-500/40', fuchsia: 'shadow-fuchsia-500/40',
};

const CATEGORIES = ['Speed', 'Consistency', 'Combat', 'Mastery'];

const BadgesTab = () => {
    const [earnedBadges, setEarnedBadges] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');

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
        <PremiumGate requiredTier="pro">
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
                        const Icon = badge.icon;
                        const glowClass = GLOW_MAP[badge.glow] || 'shadow-gray-500/20';

                        return (
                            <div
                                key={badge.id}
                                className={`relative group rounded-2xl border p-6 transition-all duration-300 ease-out
                                    ${isEarned
                                        ? `bg-[var(--bg-secondary)] backdrop-blur-md border-[var(--border-color)] ring-1 ring-white/10 shadow-2xl ${glowClass} hover:-translate-y-2 hover:scale-105 cursor-default`
                                        : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] grayscale opacity-60 cursor-not-allowed'
                                    }`}
                            >
                                {/* Category Tag */}
                                <div className="absolute top-3 right-3">
                                    {isEarned ? (
                                        <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${badge.gradient} shadow-lg`} />
                                    ) : (
                                        <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">{badge.category}</span>
                                    )}
                                </div>

                                {/* Badge Icon */}
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300
                                    ${isEarned
                                        ? `bg-gradient-to-br ${badge.gradient} shadow-lg group-hover:scale-110 group-hover:rotate-3`
                                        : 'bg-[var(--bg-secondary)]'
                                    }`}
                                >
                                    {isEarned ? (
                                        <Icon className="text-[var(--text-primary)]" size={26} />
                                    ) : (
                                        <Lock className="text-[var(--text-secondary)]" size={22} />
                                    )}
                                </div>

                                {/* Badge Info */}
                                <h3 className={`text-lg font-bold mb-1 ${isEarned ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                                    {badge.name}
                                </h3>
                                <p className={`text-sm ${isEarned ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
                                    {badge.desc}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </PremiumGate>
    );
};

export default BadgesTab;

import React, { useState, useEffect } from 'react';
import PremiumGate from '../PremiumGate';
import { Loader2, Lock, Shield, Flame, Zap, Target, Award, Star, Trophy, Crown } from 'lucide-react';
import api from '../../api';

const BADGE_DEFINITIONS = [
    { id: 'first_win', name: 'First Blood', desc: 'Win your very first 1v1 battle.', icon: Zap, gradient: 'from-cyan-500 to-blue-600', glow: 'cyan' },
    { id: 'streak_7', name: 'Unstoppable', desc: 'Achieve a 7-day consistency streak.', icon: Flame, gradient: 'from-orange-500 to-red-600', glow: 'orange' },
    { id: 'speed_demon', name: 'Speed Demon', desc: 'Solve a problem in under 60 seconds.', icon: Zap, gradient: 'from-yellow-400 to-amber-600', glow: 'yellow' },
    { id: 'arena_gladiator', name: 'Arena Gladiator', desc: 'Win 25 battles in the Arena.', icon: Shield, gradient: 'from-emerald-500 to-green-700', glow: 'emerald' },
    { id: 'campaign_conqueror', name: 'Campaign Conqueror', desc: 'Complete all nodes in a campaign region.', icon: Crown, gradient: 'from-purple-500 to-indigo-700', glow: 'purple' },
    { id: 'zero_bug', name: 'Zero-Bug Bounty', desc: 'Submit 10 consecutive solutions with zero errors.', icon: Target, gradient: 'from-pink-500 to-rose-700', glow: 'pink' },
    { id: 'top_10', name: 'Leaderboard Elite', desc: 'Reach the top 10 on the global leaderboard.', icon: Trophy, gradient: 'from-amber-400 to-yellow-600', glow: 'amber' },
    { id: 'centurion', name: 'Centurion', desc: 'Play 100 matches in total.', icon: Award, gradient: 'from-teal-500 to-cyan-700', glow: 'teal' },
    { id: 'rating_1500', name: 'Diamond Ranked', desc: 'Reach a rating of 1500 ELO or higher.', icon: Star, gradient: 'from-violet-500 to-purple-700', glow: 'violet' },
];

const GLOW_MAP = {
    cyan: 'shadow-cyan-500/40', orange: 'shadow-orange-500/40', yellow: 'shadow-yellow-500/40',
    emerald: 'shadow-emerald-500/40', purple: 'shadow-purple-500/40', pink: 'shadow-pink-500/40',
    amber: 'shadow-amber-500/40', teal: 'shadow-teal-500/40', violet: 'shadow-violet-500/40',
};

const BadgesTab = () => {
    const [earnedBadges, setEarnedBadges] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

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

    return (
        <PremiumGate requiredTier="pro">
            <div className="space-y-8">
                {/* Header Stats */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h2 className="text-2xl font-black">Achievement Badges</h2>
                        <p className="text-[var(--text-secondary)] text-sm mt-1">Collect badges by dominating the arena.</p>
                    </div>
                    <div className="bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-2xl px-6 py-3 flex items-center gap-3">
                        <Award className="text-amber-400" size={22} />
                        <span className="text-2xl font-black text-amber-400">{earned}</span>
                        <span className="text-[var(--text-secondary)] text-sm font-bold">/ {total} Earned</span>
                    </div>
                </div>

                {/* Badge Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {BADGE_DEFINITIONS.map((badge) => {
                        const isEarned = earnedBadges?.includes(badge.id);
                        const Icon = badge.icon;
                        const glowClass = GLOW_MAP[badge.glow] || 'shadow-gray-500/20';

                        return (
                            <div
                                key={badge.id}
                                className={`relative group rounded-2xl border p-6 transition-all duration-300 ease-out
                                    ${isEarned
                                        ? `bg-white/[0.03] backdrop-blur-md border-white/10 ring-1 ring-white/10 shadow-2xl ${glowClass} hover:-translate-y-2 hover:scale-105 cursor-default`
                                        : 'bg-gray-900/40 border-gray-800/50 grayscale opacity-60 cursor-not-allowed'
                                    }`}
                            >
                                {/* Badge Icon */}
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300
                                    ${isEarned
                                        ? `bg-gradient-to-br ${badge.gradient} shadow-lg group-hover:scale-110 group-hover:rotate-3`
                                        : 'bg-gray-800'
                                    }`}
                                >
                                    {isEarned ? (
                                        <Icon className="text-white" size={26} />
                                    ) : (
                                        <Lock className="text-gray-600" size={22} />
                                    )}
                                </div>

                                {/* Badge Info */}
                                <h3 className={`text-lg font-bold mb-1 ${isEarned ? 'text-white' : 'text-gray-600'}`}>
                                    {badge.name}
                                </h3>
                                <p className={`text-sm ${isEarned ? 'text-gray-400' : 'text-gray-700'}`}>
                                    {badge.desc}
                                </p>

                                {/* Earned Indicator */}
                                {isEarned && (
                                    <div className="absolute top-4 right-4">
                                        <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${badge.gradient} shadow-lg`} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </PremiumGate>
    );
};

export default BadgesTab;

import { 
    Zap, Timer, Flame, Shield, Swords, Crown, Moon, Trophy, Award, 
    Star, Target, Eye, Layers, GitBranch, Brain, ArrowUpDown, Search, Hash 
} from 'lucide-react';

export const BADGE_DEFINITIONS = [
    // ── Speed (9) ─────────────────────────────────────────────────
    { id: 'flash',           category: 'Speed',       name: 'Flash',            desc: 'Win a match in under 5 minutes.',           icon: Zap,    gradient: 'from-yellow-400 to-amber-600',   glow: 'yellow', isExclusive: false },
    { id: 'sub_minute',      category: 'Speed',       name: 'Sub-Minute',       desc: 'Solve a problem in under 60 seconds.',      icon: Timer,  gradient: 'from-cyan-400 to-blue-600',      glow: 'cyan', isExclusive: true },
    { id: 'lightning_round', category: 'Speed',       name: 'Lightning Round',  desc: 'Complete all rounds in under 10 minutes.',  icon: Zap,    gradient: 'from-amber-400 to-orange-600',   glow: 'amber', isExclusive: true },
    { id: 'speed_demon',     category: 'Speed',       name: 'Speed Demon',      desc: 'Win 5 matches in under 10 minutes each.',   icon: Flame,  gradient: 'from-red-500 to-orange-600',     glow: 'red', isExclusive: true },
    { id: 'time_lord',       category: 'Speed',       name: 'Time Lord',        desc: 'Win a match with 20+ minutes remaining.',   icon: Timer,  gradient: 'from-indigo-500 to-purple-700',  glow: 'indigo', isExclusive: true },
    { id: 'instant_kill',    category: 'Speed',       name: 'Instant Kill',     desc: 'Solve first before opponent submits once.', icon: Swords, gradient: 'from-rose-500 to-red-700',       glow: 'rose', isExclusive: true },
    { id: 'supersonic',      category: 'Speed',       name: 'Supersonic',       desc: 'Win a match in under 3 minutes.',           icon: Zap,    gradient: 'from-emerald-400 to-teal-600',   glow: 'emerald', isExclusive: true },
    { id: 'blitzkrieg',      category: 'Speed',       name: 'Blitzkrieg',       desc: 'Solve a problem in under 30 seconds.',      icon: Timer,  gradient: 'from-fuchsia-400 to-rose-600',   glow: 'pink', isExclusive: true },
    { id: 'clutch_win',      category: 'Speed',       name: 'Clutch Win',       desc: 'Win a match with <10 seconds remaining.',   icon: Timer,  gradient: 'from-amber-500 to-red-600',      glow: 'orange', isExclusive: true },

    // ── Consistency (10) ───────────────────────────────────────────
    { id: 'streak_3',        category: 'Consistency',  name: 'Getting Started',  desc: 'Maintain a 3-day activity streak.',         icon: Flame,  gradient: 'from-green-500 to-emerald-700',  glow: 'green', isExclusive: false },
    { id: 'streak_7',        category: 'Consistency',  name: 'Unstoppable',      desc: 'Maintain a 7-day consistency streak.',      icon: Flame,  gradient: 'from-orange-500 to-red-600',     glow: 'orange', isExclusive: true },
    { id: 'streak_14',       category: 'Consistency',  name: 'Iron Will',        desc: 'Maintain a 14-day consistency streak.',     icon: Shield, gradient: 'from-slate-500 to-zinc-700',     glow: 'slate', isExclusive: true },
    { id: 'streak_30',       category: 'Consistency',  name: 'Marathon Runner',  desc: 'Maintain a 30-day consistency streak.',     icon: Crown,  gradient: 'from-yellow-500 to-amber-700',   glow: 'yellow', isExclusive: true },
    { id: 'weekend_warrior', category: 'Consistency',  name: 'Weekend Warrior',  desc: 'Play on 4 consecutive weekends.',           icon: Swords, gradient: 'from-sky-500 to-blue-700',      glow: 'sky', isExclusive: true },
    { id: 'night_owl',       category: 'Consistency',  name: 'Night Owl',        desc: 'Win 10 matches played after midnight.',     icon: Moon,   gradient: 'from-violet-600 to-indigo-800',  glow: 'violet', isExclusive: true },
    { id: 'half_century',    category: 'Consistency',  name: 'Half-Century',     desc: 'Maintain a 50-day consistency streak.',     icon: Trophy, gradient: 'from-cyan-500 to-blue-700',      glow: 'cyan', isExclusive: true },
    { id: 'centurion_streak',category: 'Consistency',  name: 'Centurion Streak', desc: 'Maintain a 100-day consistency streak.',    icon: Crown,  gradient: 'from-yellow-400 via-amber-500 to-red-600', glow: 'yellow', isExclusive: true },
    { id: 'early_bird',      category: 'Consistency',  name: 'Early Bird',       desc: 'Win 10 matches played between 5-8 AM.',     icon: Timer,  gradient: 'from-orange-400 to-yellow-600',  glow: 'amber', isExclusive: true },
    { id: 'devoted_coder',   category: 'Consistency',  name: 'Devoted Coder',    desc: 'Solve problems every day for 30 days.',     icon: Flame,  gradient: 'from-pink-500 to-rose-700',     glow: 'pink', isExclusive: true },

    // ── Combat (13) ────────────────────────────────────────────────
    { id: 'first_blood',     category: 'Combat',      name: 'First Blood',      desc: 'Win your very first 1v1 battle.',           icon: Swords, gradient: 'from-cyan-500 to-blue-600',     glow: 'cyan', isExclusive: false },
    { id: 'hat_trick',       category: 'Combat',      name: 'Hat Trick',        desc: 'Win 3 matches in a row.',                   icon: Trophy, gradient: 'from-amber-500 to-yellow-600',  glow: 'amber', isExclusive: true },
    { id: 'arena_gladiator', category: 'Combat',      name: 'Arena Gladiator',  desc: 'Win 25 battles in the Arena.',              icon: Shield, gradient: 'from-emerald-500 to-green-700', glow: 'emerald', isExclusive: true },
    { id: 'centurion',       category: 'Combat',      name: 'Centurion',        desc: 'Play 100 matches in total.',                icon: Award,  gradient: 'from-teal-500 to-cyan-700',     glow: 'teal', isExclusive: true },
    { id: 'perfect_round',   category: 'Combat',      name: 'Perfect Round',    desc: 'Solve all problems in a single match.',     icon: Target, gradient: 'from-lime-500 to-green-600',    glow: 'lime', isExclusive: true },
    { id: 'flawless_victory',category: 'Combat',      name: 'Flawless Victory', desc: 'Win a best-of-3 match 3-0.',                icon: Star,   gradient: 'from-pink-500 to-rose-700',     glow: 'pink', isExclusive: true },
    { id: 'dominator',       category: 'Combat',      name: 'Dominator',        desc: 'Achieve a 10-match win streak.',            icon: Crown,  gradient: 'from-red-600 to-rose-800',      glow: 'red', isExclusive: true },
    { id: 'underdog',        category: 'Combat',      name: 'Underdog',         desc: 'Beat an opponent 200+ ELO above you.',      icon: Eye,    gradient: 'from-blue-500 to-indigo-700',   glow: 'blue', isExclusive: true },
    { id: 'survivor',        category: 'Combat',      name: 'Survivor',         desc: 'Win a match with <1 minute remaining.',     icon: Timer,  gradient: 'from-orange-600 to-red-700',    glow: 'orange', isExclusive: true },
    { id: 'grandmaster_slayer',category: 'Combat',    name: 'Grandmaster Slayer',desc: 'Beat an opponent 300+ ELO above you.',     icon: Swords, gradient: 'from-purple-600 to-pink-700',     glow: 'purple', isExclusive: true },
    { id: 'legendary_streak',category: 'Combat',      name: 'Legendary Streak', desc: 'Achieve a 15-match win streak.',            icon: Crown,  gradient: 'from-yellow-400 via-orange-500 to-red-600', glow: 'yellow', isExclusive: true },
    { id: 'arena_conqueror', category: 'Combat',      name: 'Arena Conqueror',  desc: 'Win 100 battles in the Arena.',              icon: Trophy, gradient: 'from-emerald-400 to-teal-600',   glow: 'emerald', isExclusive: true },
    { id: 'veteran',         category: 'Combat',      name: 'Veteran',          desc: 'Play 500 matches in total.',                icon: Shield, gradient: 'from-slate-600 to-slate-800',     glow: 'slate', isExclusive: true },

    // ── Mastery (18) ───────────────────────────────────────────────
    { id: 'array_ace',       category: 'Mastery',     name: 'Array Ace',        desc: 'Solve 10 Array problems.',                  icon: Layers,      gradient: 'from-blue-500 to-cyan-600',     glow: 'blue', isExclusive: true },
    { id: 'string_slicer',   category: 'Mastery',     name: 'String Slicer',    desc: 'Solve 10 String problems.',                 icon: Award,       gradient: 'from-fuchsia-500 to-pink-700',  glow: 'fuchsia', isExclusive: true },
    { id: 'tree_hugger',     category: 'Mastery',     name: 'Tree Hugger',      desc: 'Solve 10 Tree problems.',                   icon: GitBranch,   gradient: 'from-green-500 to-emerald-700', glow: 'green', isExclusive: true },
    { id: 'graph_guru',      category: 'Mastery',     name: 'Graph Guru',       desc: 'Solve 10 Graph problems.',                  icon: Brain,       gradient: 'from-purple-500 to-violet-700', glow: 'purple', isExclusive: true },
    { id: 'dp_dynamo',       category: 'Mastery',     name: 'DP Dynamo',        desc: 'Solve 10 Dynamic Programming problems.',    icon: Brain,       gradient: 'from-orange-500 to-amber-700',  glow: 'orange', isExclusive: true },
    { id: 'sort_king',       category: 'Mastery',     name: 'Sort King',        desc: 'Solve 10 Sorting problems.',                icon: ArrowUpDown, gradient: 'from-teal-500 to-green-600',    glow: 'teal', isExclusive: true },
    { id: 'binary_boss',     category: 'Mastery',     name: 'Binary Boss',      desc: 'Solve 10 Binary Search problems.',          icon: Search,      gradient: 'from-indigo-500 to-blue-700',   glow: 'indigo', isExclusive: true },
    { id: 'hash_master',     category: 'Mastery',     name: 'Hash Master',      desc: 'Solve 10 Hash Table problems.',             icon: Hash,        gradient: 'from-rose-500 to-pink-700',     glow: 'rose', isExclusive: true },
    { id: 'diamond_ranked',  category: 'Mastery',     name: 'Diamond Ranked',   desc: 'Reach a rating of 1500 ELO or higher.',     icon: Star,        gradient: 'from-violet-500 to-purple-700', glow: 'violet', isExclusive: true },
    { id: 'linked_list_legend',category: 'Mastery',   name: 'Linked List Legend',desc: 'Solve 10 Linked List problems.',           icon: Layers,      gradient: 'from-teal-400 to-emerald-600',   glow: 'emerald', isExclusive: true },
    { id: 'greedy_genius',   category: 'Mastery',     name: 'Greedy Genius',    desc: 'Solve 10 Greedy problems.',                 icon: Brain,       gradient: 'from-amber-400 to-orange-600',   glow: 'amber', isExclusive: true },
    { id: 'stack_surgeon',   category: 'Mastery',     name: 'Stack Surgeon',    desc: 'Solve 10 Stack/Queue problems.',            icon: Layers,      gradient: 'from-blue-600 to-indigo-700',    glow: 'blue', isExclusive: true },
    { id: 'math_magician',   category: 'Mastery',     name: 'Math Magician',    desc: 'Solve 10 Math/Number Theory problems.',     icon: Hash,        gradient: 'from-rose-400 to-red-600',       glow: 'rose', isExclusive: true },
    { id: 'bit_wizard',      category: 'Mastery',     name: 'Bit Wizard',       desc: 'Solve 10 Bit Manipulation problems.',       icon: Zap,         gradient: 'from-yellow-400 to-orange-500',  glow: 'yellow', isExclusive: true },
    { id: 'backtracking_boss',category: 'Mastery',    name: 'Backtracking Boss',desc: 'Solve 10 Backtracking problems.',           icon: GitBranch,   gradient: 'from-purple-600 to-indigo-800',  glow: 'violet', isExclusive: true },
    { id: 'recursion_ranger',category: 'Mastery',     name: 'Recursion Ranger', desc: 'Solve 10 Recursion/DFS problems.',          icon: Brain,       gradient: 'from-green-400 to-emerald-600',  glow: 'green', isExclusive: true },
    { id: 'grandmaster_ranked',category: 'Mastery',   name: 'Grandmaster Ranked',desc: 'Reach a rating of 1800 ELO or higher.',     icon: Crown,       gradient: 'from-fuchsia-500 via-purple-600 to-pink-700', glow: 'fuchsia', isExclusive: true },
    { id: 'immortal_ranked', category: 'Mastery',     name: 'Immortal Ranked',  desc: 'Reach a rating of 2100 ELO or higher.',     icon: Star,        gradient: 'from-cyan-400 via-indigo-500 to-purple-600', glow: 'cyan', isExclusive: true },
];

export const GLOW_MAP = {
    cyan: 'shadow-cyan-500/40', orange: 'shadow-orange-500/40', yellow: 'shadow-yellow-500/40',
    emerald: 'shadow-emerald-500/40', purple: 'shadow-purple-500/40', pink: 'shadow-pink-500/40',
    amber: 'shadow-amber-500/40', teal: 'shadow-teal-500/40', violet: 'shadow-violet-500/40',
    red: 'shadow-red-500/40', blue: 'shadow-blue-500/40', green: 'shadow-green-500/40',
    indigo: 'shadow-indigo-500/40', rose: 'shadow-rose-500/40', lime: 'shadow-lime-500/40',
    sky: 'shadow-sky-500/40', slate: 'shadow-slate-500/40', fuchsia: 'shadow-fuchsia-500/40',
};

export const CATEGORIES = ['Speed', 'Consistency', 'Combat', 'Mastery'];

// Helper function to render badge icon nicely
export const getBadgeIconData = (badgeId) => {
    const badge = BADGE_DEFINITIONS.find(b => b.id === badgeId);
    if (!badge) return null;
    return badge;
};

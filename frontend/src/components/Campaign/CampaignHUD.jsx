// src/components/Campaign/CampaignHUD.jsx  — V2
// Added `children` prop so Campaign.jsx can inject the Guide button
// without modifying this component's internals.

import React from 'react';
import { Star, Zap, Flame, ShoppingBag, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

const Stat = ({ icon: Icon, value, label, color }) => (
    <div className="flex items-center gap-1.5">
        <Icon size={14} className={color} />
        <motion.span
            key={value}
            initial={{ scale: 1.2, opacity: 0.7 }}
            animate={{ scale: 1,   opacity: 1   }}
            transition={{ duration: 0.22 }}
            className={`font-mono font-black text-sm tabular-nums ${color}`}
        >
            {value}
        </motion.span>
        <span className="text-gray-600 text-[10px] hidden sm:inline">{label}</span>
    </div>
);

const CampaignHUD = ({ progress, onOpenSkillTree, children }) => {
    const kp     = progress?.knowledgePoints    ?? 0;
    const stars  = progress?.totalStars         ?? 0;
    const streak = progress?.currentStreak      ?? 0;
    const solved = progress?.completedNodes?.length ?? 0;

    return (
        <div className="flex items-center justify-between px-4 sm:px-5 py-2 bg-[#07090f]/95 border-b border-gray-800/40 backdrop-blur-md shrink-0 z-20">
            {/* Brand */}
            <div className="flex items-center gap-2">
                <span className="text-xl select-none">🗺️</span>
                <div>
                    <h1 className="font-black text-xs text-white tracking-tight leading-none uppercase">Campaign</h1>
                    <p className="text-[9px] text-gray-700 font-bold uppercase tracking-widest leading-none mt-0.5">Story Mode</p>
                </div>
                <span className="ml-1 text-[8px] font-bold bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded-full border border-cyan-500/20 uppercase tracking-wider hidden sm:block">Beta</span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 sm:gap-5">
                <Stat icon={Star}   value={stars}  label="stars"  color="text-amber-400" />
                <Stat icon={Zap}    value={kp}     label="KP"     color="text-cyan-400"  />
                {streak > 0 && <Stat icon={Flame} value={streak} label="streak" color="text-orange-400" />}
                <div className="hidden md:flex items-center gap-1.5">
                    <Trophy size={13} className="text-purple-400" />
                    <span className="font-mono font-black text-sm text-purple-400 tabular-nums">{solved}</span>
                    <span className="text-gray-600 text-[10px]">solved</span>
                </div>
            </div>

            {/* Right actions — children slot + Skill Tree button */}
            <div className="flex items-center gap-2">
                {children}
                <button
                    onClick={onOpenSkillTree}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-900/20 hover:bg-purple-900/40 border border-purple-700/25 hover:border-purple-600/45 text-purple-300 hover:text-purple-200 rounded-lg text-xs font-bold transition-all"
                >
                    <ShoppingBag size={13} />
                    <span className="hidden sm:inline">Skill Tree</span>
                </button>
            </div>
        </div>
    );
};

export default CampaignHUD;
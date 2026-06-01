// src/components/Campaign/SuccessModal.jsx
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Star, Zap, Map, RotateCcw, Gift, Sparkles } from 'lucide-react';

// Animated KP counter
const CountUp = ({ target, delay = 0 }) => {
    const [val, setVal] = useState(0);
    useEffect(() => {
        const t = setTimeout(() => {
            if (target <= 0) { setVal(0); return; }
            let cur = 0;
            const step = Math.max(1, Math.ceil(target / 28));
            const iv = setInterval(() => {
                cur = Math.min(cur + step, target);
                setVal(cur);
                if (cur >= target) clearInterval(iv);
            }, 28);
            return () => clearInterval(iv);
        }, delay * 1000);
        return () => clearTimeout(t);
    }, [target, delay]);
    return <>{val}</>;
};

const MESSAGES = {
    1: { headline: 'Node Complete!',     sub: 'You passed all test cases.',      emoji: '✅' },
    2: { headline: 'Efficient!',          sub: 'Great execution speed.',          emoji: '🎯' },
    3: { headline: 'Perfect Solution!',  sub: 'Three stars — flawless work!',    emoji: '🏆' },
};

import { useTheme } from '../../context/ThemeContext';

const SuccessModal = ({ isOpen, result, onViewMap, onContinue }) => {
    const { isDark } = useTheme();
    if (!isOpen || !result) return null;

    const stars   = result.stars   ?? 1;
    const kp      = result.kpEarned ?? 0;
    const time    = result.executionTime ?? 0;
    const msg     = MESSAGES[stars] || MESSAGES[1];
    const newNodes = result.newlyUnlockedNodes ?? [];
    const loot    = result.lootDropped;
    const improved = result.isImprovement;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/60 dark:bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.82, y: 50, opacity: 0 }}
                        animate={{ scale: 1,    y: 0,  opacity: 1 }}
                        exit={{    scale: 0.88, y: 30, opacity: 0 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 220 }}
                        className="bg-white dark:bg-[#0a0c12] border border-gray-100 dark:border-gray-800/60 rounded-2xl w-full max-w-[420px] overflow-hidden shadow-2xl transition-colors"
                    >
                        {/* Top glow band */}
                        <div className={`h-1 w-full ${stars === 3 ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500' : stars === 2 ? 'bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600' : 'bg-gradient-to-r from-emerald-600 via-accent to-emerald-600'}`} />

                        <div className={`px-6 pt-7 pb-4 text-center ${stars === 3 ? (isDark ? 'bg-gradient-to-b from-amber-950/25 to-transparent' : 'bg-gradient-to-b from-amber-50 to-transparent') : stars === 2 ? (isDark ? 'bg-gradient-to-b from-yellow-950/20 to-transparent' : 'bg-gradient-to-b from-yellow-50 to-transparent') : (isDark ? 'bg-gradient-to-b from-emerald-950/15 to-transparent' : 'bg-gradient-to-b from-emerald-50 to-transparent')}`}>
                            <motion.div
                                initial={{ scale: 0, rotate: -30 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.15, type: 'spring', stiffness: 250 }}
                                className="text-5xl mb-4 inline-block"
                            >
                                {msg.emoji}
                            </motion.div>

                            <motion.h2
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                className="text-2xl font-black text-gray-900 dark:text-white mb-1"
                            >
                                {msg.headline}
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.35 }}
                                className="text-gray-500 dark:text-gray-400 text-sm font-medium"
                            >
                                {msg.sub}
                            </motion.p>
                        </div>

                        {/* Star reveal */}
                        <div className="px-6 py-4 flex items-center justify-center gap-4">
                            {[1, 2, 3].map(i => (
                                <motion.div
                                    key={i}
                                    initial={{ scale: 0, rotate: -180, opacity: 0 }}
                                    animate={
                                        i <= stars
                                            ? { scale: 1, rotate: 0, opacity: 1 }
                                            : { scale: 0.55, rotate: 0, opacity: 0.18 }
                                    }
                                    transition={{ delay: 0.55 + (i - 1) * 0.28, type: 'spring', stiffness: 200, damping: 14 }}
                                >
                                    <Star
                                        size={52}
                                        className={
                                            i <= stars
                                                ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_22px_rgba(251,191,36,0.7)]'
                                                : isDark ? 'fill-gray-800 text-gray-800' : 'fill-gray-200 text-gray-200'
                                        }
                                    />
                                </motion.div>
                            ))}
                        </div>

                        {/* Stats */}
                        <div className="px-6 pb-4 grid grid-cols-2 gap-3">
                            <motion.div
                                initial={{ opacity: 0, x: -18 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1.35 }}
                                className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/50 rounded-xl p-3.5 text-center"
                            >
                                <div className="flex items-center justify-center gap-1 mb-1">
                                    <Zap size={13} className="text-cyan-600 dark:text-accent" />
                                    <span className="text-[10px] text-gray-500 dark:text-gray-600 font-bold uppercase tracking-wider">KP Earned</span>
                                </div>
                                <div className="text-2xl font-black text-cyan-600 dark:text-accent">
                                    +<CountUp target={kp} delay={1.5} />
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 18 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1.35 }}
                                className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/50 rounded-xl p-3.5 text-center"
                            >
                                <div className="flex items-center justify-center gap-1 mb-1">
                                    <span className="text-[10px] text-gray-500 dark:text-gray-600 font-bold uppercase tracking-wider">⚡ Avg Time</span>
                                </div>
                                <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                                    {time}<span className="text-sm text-blue-700 dark:text-blue-600">ms</span>
                                </div>
                            </motion.div>
                        </div>

                        {/* Badges */}
                        <div className="px-6 pb-5 space-y-2">
                            {improved && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.88 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 1.75 }}
                                    className="text-center py-2 bg-emerald-50 dark:bg-emerald-950/25 rounded-lg border border-emerald-200 dark:border-emerald-800/35"
                                >
                                    <span className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">🎉 New Personal Best!</span>
                                </motion.div>
                            )}

                            {newNodes.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.9 }}
                                    className="text-center py-2 bg-cyan-50 dark:bg-accent/8 rounded-lg border border-cyan-100 dark:border-accent/25 flex items-center justify-center gap-2"
                                >
                                    <Sparkles size={14} className="text-cyan-600 dark:text-accent" />
                                    <span className="text-sm text-cyan-600 dark:text-accent font-bold">
                                        {newNodes.length} new node{newNodes.length > 1 ? 's' : ''} unlocked!
                                    </span>
                                </motion.div>
                            )}

                            {loot && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.7 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 2.05, type: 'spring', stiffness: 300 }}
                                    className="text-center py-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-700/40"
                                >
                                    <div className="text-2xl mb-0.5">🎁</div>
                                    <p className="text-sm text-amber-700 dark:text-amber-300 font-bold">Loot Drop: {loot.itemId}!</p>
                                </motion.div>
                            )}
                        </div>

                        {/* Buttons */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 2.1 }}
                            className="px-5 pb-5 flex gap-3"
                        >
                            <button
                                onClick={onViewMap}
                                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700/60 text-gray-700 dark:text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                <Map size={16} /> View World
                            </button>
                            <button
                                onClick={onContinue}
                                className="flex-1 py-3 bg-accent hover:bg-[#3bd175] text-black rounded-xl font-black transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-accent/20"
                            >
                                <RotateCcw size={16} /> Try Again?
                            </button>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SuccessModal;
// V 1.5

// Version-2.0
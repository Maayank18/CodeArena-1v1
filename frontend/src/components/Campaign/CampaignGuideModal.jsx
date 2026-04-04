// src/components/Campaign/CampaignGuideModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Gamified 3-tab guide modal explaining all campaign mechanics.
// Tabs: The Journey | The Economy | Boss Battles
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Map, Zap, Skull, Star, Lock, ShoppingBag, Sparkles, Clock, Trophy, ChevronRight } from 'lucide-react';

const TABS = [
    { id: 'journey',  label: 'The Journey',  icon: Map    },
    { id: 'economy',  label: 'The Economy',  icon: Zap    },
    { id: 'battles',  label: 'Boss Battles', icon: Skull  },
];

// ── Tab content components ────────────────────────────────────────────────────

const JourneyTab = () => (
    <div className="space-y-5">
        <div className="text-center pb-2">
            <div className="text-5xl mb-3 select-none">🗺️</div>
            <h3 className="text-xl font-black text-white mb-1">Your Campaign Path</h3>
            <p className="text-gray-500 text-sm">A linear adventure through the world of algorithms</p>
        </div>

        {[
            {
                icon: <div className="w-9 h-9 rounded-full border-2 border-cyan-400 bg-cyan-950/40 flex items-center justify-center" style={{ boxShadow: '0 0 12px #06b6d455' }}><div className="w-2.5 h-2.5 rounded-full bg-cyan-400" /></div>,
                title: 'Available Nodes',
                desc: 'Glowing circles on the map are ready to challenge. Click to view the problem, then start the fight.',
            },
            {
                icon: <div className="w-9 h-9 rounded-full border-2 border-gray-700 bg-gray-900/60 flex items-center justify-center opacity-50"><Lock size={14} className="text-gray-600" /></div>,
                title: 'Locked Nodes',
                desc: 'Each node unlocks the next. You must defeat Node N before Node N+1 opens. No skipping.',
            },
            {
                icon: <div className="w-9 h-9 rounded-full border-2 border-amber-400 bg-amber-950/40 flex items-center justify-center" style={{ boxShadow: '0 0 14px #fbbf2460' }}><Star size={14} className="fill-amber-400 text-amber-400" /></div>,
                title: 'Completed Nodes',
                desc: 'Gold glow shows your finished nodes. Return anytime to improve your star rating.',
            },
            {
                icon: <ChevronRight size={18} className="text-gray-500" />,
                title: 'Island Progression',
                desc: 'Beat the final Boss Node of an Island to unlock the next Island entirely.',
            },
        ].map((item, i) => (
            <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-4 p-4 bg-gray-900/40 rounded-xl border border-gray-800/40 hover:border-gray-700/60 transition-colors"
            >
                <div className="shrink-0 mt-0.5">{item.icon}</div>
                <div>
                    <p className="font-bold text-[13px] text-white mb-1">{item.title}</p>
                    <p className="text-[12px] text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
            </motion.div>
        ))}
    </div>
);

const EconomyTab = () => (
    <div className="space-y-5">
        <div className="text-center pb-2">
            <div className="text-5xl mb-3 select-none">⚡</div>
            <h3 className="text-xl font-black text-white mb-1">Knowledge Points</h3>
            <p className="text-gray-500 text-sm">Earn KP by solving nodes. Spend it on cosmetics.</p>
        </div>

        {/* Earning */}
        <div>
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2.5">How to Earn KP</p>
            <div className="grid grid-cols-3 gap-2">
                {[
                    { label: '⭐ 1 Star', kp: '+10–30', desc: 'Pass all cases' },
                    { label: '⭐⭐ 2 Stars', kp: '+20–50', desc: 'Beat time limit' },
                    { label: '⭐⭐⭐ 3 Stars', kp: '+35–80', desc: 'Optimal speed' },
                ].map((r, i) => (
                    <div key={i} className="text-center p-3 bg-gray-900/50 border border-gray-800/50 rounded-xl">
                        <p className="text-[10px] text-gray-500 mb-1 font-bold">{r.label}</p>
                        <p className="text-lg font-black text-accent">{r.kp}</p>
                        <p className="text-[9px] text-gray-700 mt-0.5">{r.desc}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* The 3-star system */}
        <div className="p-4 bg-amber-950/15 border border-amber-800/30 rounded-xl space-y-3">
            <div className="flex items-center gap-2 mb-1">
                <Trophy size={15} className="text-amber-400" />
                <p className="font-bold text-amber-300 text-sm">The 3-Star System</p>
            </div>
            {[
                { s: 1, label: 'Pass', desc: 'All public + hidden test cases pass. Correctness only.' },
                { s: 2, label: 'Fast', desc: 'Average execution time under the 2-star threshold.' },
                { s: 3, label: 'Optimal', desc: 'Near O(n) time. Only the best solutions reach this.' },
            ].map(r => (
                <div key={r.s} className="flex items-start gap-3">
                    <div className="flex shrink-0 mt-0.5">
                        {Array.from({ length: 3 }, (_, i) => (
                            <Star key={i} size={10} className={i < r.s ? 'fill-amber-400 text-amber-400' : 'fill-gray-800 text-gray-800'} />
                        ))}
                    </div>
                    <div>
                        <span className="text-[11px] font-bold text-amber-300">{r.label} — </span>
                        <span className="text-[11px] text-gray-500">{r.desc}</span>
                    </div>
                </div>
            ))}
        </div>

        {/* Spending */}
        <div>
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2.5">Spending KP — Skill Tree</p>
            <div className="space-y-2">
                {[
                    { icon: '🟩', label: 'Themes', desc: 'Change your arena visual style', cost: '100–150 KP' },
                    { icon: '🥇', label: 'Borders', desc: 'Profile ring cosmetics', cost: '80–120 KP' },
                    { icon: '⚔️', label: 'Titles', desc: 'Displayed in arena matches', cost: '120–200 KP' },
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-purple-950/15 border border-purple-900/30 rounded-lg">
                        <span className="text-xl">{item.icon}</span>
                        <div className="flex-1">
                            <p className="text-[12px] font-bold text-purple-200">{item.label}</p>
                            <p className="text-[10px] text-gray-600">{item.desc}</p>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-accent shrink-0">{item.cost}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const BattlesTab = () => (
    <div className="space-y-5">
        <div className="text-center pb-2">
            <div className="text-5xl mb-3 select-none">💀</div>
            <h3 className="text-xl font-black text-white mb-1">Boss Battles</h3>
            <p className="text-gray-500 text-sm">Every island has a guardian. Defeat them to progress.</p>
        </div>

        {/* Boss rules */}
        {[
            {
                emoji: '🔴',
                title: 'Mid Boss (Node 6)',
                color: 'border-orange-800/40 bg-orange-950/10',
                titleColor: 'text-orange-300',
                desc: 'A medium difficulty challenge with a strict time limit. All hidden test cases must pass. Rewards bonus KP.',
            },
            {
                emoji: '💀',
                title: 'Final Boss (Node 15)',
                color: 'border-red-800/40 bg-red-950/12',
                titleColor: 'text-red-300',
                desc: 'Hard. Optimised solutions only. Defeating unlocks the next Island. Drops rare cosmetic loot.',
            },
        ].map((item, i) => (
            <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-4 rounded-xl border ${item.color}`}
            >
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{item.emoji}</span>
                    <p className={`font-black text-[14px] ${item.titleColor}`}>{item.title}</p>
                </div>
                <p className="text-[12px] text-gray-500 leading-relaxed">{item.desc}</p>
            </motion.div>
        ))}

        {/* The Sage */}
        <div className="p-4 bg-purple-950/20 border border-purple-800/35 rounded-xl">
            <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-full bg-purple-950/60 border border-purple-600/40 flex items-center justify-center" style={{ boxShadow: '0 0 10px rgba(168,85,247,0.3)' }}>
                    <Sparkles size={14} className="text-purple-400" />
                </div>
                <p className="font-black text-purple-200 text-sm">The Sage Appears</p>
            </div>
            <p className="text-[12px] text-gray-500 leading-relaxed mb-3">
                Stuck? After <span className="text-purple-300 font-bold">3 failed attempts</span> on any node, a glowing button reveals itself. The Sage — an AI mentor — will appear and offer a Socratic hint.
            </p>
            <div className="px-3 py-2 bg-black/30 rounded-lg border border-purple-900/30">
                <p className="text-[11px] text-purple-300 italic">
                    "The Sage does not give you fish. The Sage teaches you to see the water."
                </p>
            </div>
            <p className="text-[10px] text-gray-700 mt-2">The Sage gives a conceptual hint, never the solution code.</p>
        </div>

        {/* Loot */}
        <div className="p-4 bg-amber-950/15 border border-amber-800/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🎁</span>
                <p className="font-bold text-amber-300 text-sm">Loot Drops</p>
            </div>
            <p className="text-[12px] text-gray-500">Final Boss nodes have a random chance to drop exclusive cosmetics that can't be bought in the Skill Tree. The rarer the item, the lower the drop chance.</p>
        </div>
    </div>
);

const TAB_CONTENT = { journey: JourneyTab, economy: EconomyTab, battles: BattlesTab };

// ── Main modal ────────────────────────────────────────────────────────────────

const CampaignGuideModal = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('journey');
    const Content = TAB_CONTENT[activeTab] || JourneyTab;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
                    onClick={e => e.target === e.currentTarget && onClose()}
                >
                    <motion.div
                        initial={{ scale: 0.87, y: 28, opacity: 0 }}
                        animate={{ scale: 1,    y: 0,  opacity: 1 }}
                        exit={{    scale: 0.87, y: 28, opacity: 0 }}
                        transition={{ type: 'spring', damping: 24, stiffness: 230 }}
                        className="bg-[#090b10] border border-gray-800/50 rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
                    >
                        {/* Top accent line */}
                        <div className="h-0.5 bg-gradient-to-r from-cyan-600/60 via-purple-500/60 to-red-600/60" />

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/50">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-cyan-950/50 border border-cyan-700/30 flex items-center justify-center">
                                    <Map size={18} className="text-cyan-400" />
                                </div>
                                <div>
                                    <h2 className="font-black text-white text-lg tracking-tight">How to Play</h2>
                                    <p className="text-[11px] text-gray-600">Campaign Mode Guide</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 text-gray-600 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Tab bar */}
                        <div className="flex border-b border-gray-800/50 px-2 pt-1 gap-1">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all ${
                                        activeTab === tab.id
                                            ? 'text-white'
                                            : 'text-gray-600 hover:text-gray-400'
                                    }`}
                                >
                                    <tab.icon size={13} />
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="guide-tab-indicator"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-t"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Tab content */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0  }}
                                    exit={{    opacity: 0, y: -6 }}
                                    transition={{ duration: 0.18 }}
                                >
                                    <Content />
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3.5 border-t border-gray-800/40 flex items-center justify-between">
                            <p className="text-[11px] text-gray-700">Defeat every island boss to master the Algorithm World.</p>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-accent hover:bg-[#3bd175] text-black text-xs font-black rounded-lg transition-all"
                            >
                                Start Playing →
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CampaignGuideModal;
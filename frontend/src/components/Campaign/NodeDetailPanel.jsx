// src/components/Campaign/NodeDetailPanel.jsx
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Clock, Lock, Play, RefreshCw, Skull, Star, Zap, Gift } from 'lucide-react';
import StarDisplay from '../Campaign/StarDisplay';

const DIFF = {
    Easy:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    Hard:   'bg-red-500/10 text-red-400 border-red-500/25',
};

const NodeDetailPanel = ({ node, progress, onClose, onStartChallenge }) => {
    if (!node) return null;

    const done      = progress?.completedNodes?.find(n => n.nodeId === node.nodeId);
    const isAvail   = progress?.unlockedNodes?.includes(node.nodeId);
    const isBoss    = node.nodeType === 'boss';
    const problem   = node.problemId;
    const diffColor = DIFF[problem?.difficulty] || DIFF.Easy;

    return (
        <AnimatePresence>
            <motion.aside
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                className="absolute right-0 top-0 bottom-0 w-full sm:w-[380px] bg-[#0a0c12] border-l border-gray-800/50 z-40 flex flex-col shadow-2xl"
            >
                {/* ─ Header ─ */}
                <div className={`px-5 pt-5 pb-4 border-b border-gray-800/50 ${isBoss ? 'bg-red-950/20' : 'bg-[#0d1117]/60'}`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                {isBoss && <Skull size={16} className="text-red-400 shrink-0" />}
                                <h2 className="font-black text-white text-lg leading-tight truncate">
                                    {problem?.title || node.nodeId}
                                </h2>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                {problem?.difficulty && (
                                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${diffColor}`}>
                                        {problem.difficulty}
                                    </span>
                                )}
                                {isBoss && (
                                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/25">
                                        Boss
                                    </span>
                                )}
                                <span className="text-[10px] font-mono text-gray-700">{node.nodeId}</span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors shrink-0"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* ─ Body ─ */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 custom-scrollbar">

                    {/* Description preview */}
                    {problem?.description && (
                        <div>
                            <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Overview</h4>
                            <p className="text-[13px] text-gray-400 leading-relaxed line-clamp-4">
                                {problem.description}
                            </p>
                        </div>
                    )}

                    {/* Star thresholds */}
                    <div>
                        <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Star Requirements</h4>
                        <div className="space-y-2">
                            {[
                                { s: 1, label: 'Pass all hidden test cases' },
                                { s: 2, label: `Avg time < ${node.starThresholds?.twoStarTimeMs ?? '—'}ms` },
                                { s: 3, label: `Avg time < ${node.starThresholds?.threeStarTimeMs ?? '—'}ms` },
                            ].map(row => (
                                <div key={row.s} className="flex items-center justify-between px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-800/50">
                                    <StarDisplay stars={row.s} total={3} size="sm" />
                                    <span className="text-[11px] text-gray-500">{row.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Rewards */}
                    <div>
                        <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Rewards</h4>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { s: 1, kp: node.rewards?.oneStarKP   },
                                { s: 2, kp: node.rewards?.twoStarKP   },
                                { s: 3, kp: node.rewards?.threeStarKP },
                            ].map(r => (
                                <div key={r.s} className="text-center py-3 bg-gray-900/60 rounded-xl border border-gray-800/50">
                                    <StarDisplay stars={r.s} total={3} size="sm" />
                                    <div className="flex items-center justify-center gap-1 mt-1.5">
                                        <Zap size={11} className="text-accent" />
                                        <span className="text-xs font-black text-accent">+{r.kp}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {isBoss && node.rewards?.lootPool?.length > 0 && (
                            <div className="mt-2 p-2.5 bg-amber-950/20 rounded-lg border border-amber-800/30 flex items-center justify-center gap-2">
                                <Gift size={14} className="text-amber-400" />
                                <span className="text-xs text-amber-400 font-bold">Possible loot drop!</span>
                            </div>
                        )}
                    </div>

                    {/* Your best performance */}
                    {done && (
                        <div>
                            <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Your Best</h4>
                            <div className="p-3.5 bg-gray-900/50 rounded-xl border border-gray-800/50 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] text-gray-500">Stars</span>
                                    <StarDisplay stars={done.starsAwarded} total={3} size="md" />
                                </div>
                                {done.bestTimeMs && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] text-gray-500 flex items-center gap-1"><Clock size={11} /> Best Time</span>
                                        <span className="text-[12px] font-mono font-bold text-accent">{done.bestTimeMs}ms avg</span>
                                    </div>
                                )}
                                {done.language && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] text-gray-500">Language</span>
                                        <span className="text-[11px] font-mono text-gray-400 capitalize">{done.language}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ─ Footer CTA ─ */}
                <div className="p-4 border-t border-gray-800/50 space-y-2">
                    {!isAvail ? (
                        <div className="flex items-center justify-center gap-2 py-3 text-gray-600 text-sm">
                            <Lock size={15} />
                            <span>Complete prerequisites first</span>
                        </div>
                    ) : (
                        <button
                            onClick={() => onStartChallenge(node.nodeId)}
                            className={`w-full py-3.5 rounded-xl font-black text-[15px] transition-all flex items-center justify-center gap-2.5 shadow-lg ${
                                done
                                    ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                                    : isBoss
                                        ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-red-900/30'
                                        : 'bg-accent hover:bg-[#3bd175] text-black shadow-accent/20'
                            }`}
                        >
                            {done
                                ? <><RefreshCw size={18} /> Try to Improve</>
                                : isBoss
                                    ? <><Skull size={18} /> Fight Boss</>
                                    : <><Play size={18} /> Start Challenge</>
                            }
                        </button>
                    )}
                </div>
            </motion.aside>
        </AnimatePresence>
    );
};

export default NodeDetailPanel;

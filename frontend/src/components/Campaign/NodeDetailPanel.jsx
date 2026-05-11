import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Clock, Zap, Lock, Play, RotateCcw, Skull } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const DIFF_COLOR = {
  Easy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
  Hard: 'text-red-400 bg-red-500/10 border-red-500/25',
};

const ROOT_NODE_ID = 'region-1-node-01';

const isAbsoluteRootNode = (node) =>
  node?.nodeId === ROOT_NODE_ID ||
  (node?.regionOrder === 1 && node?.nodeOrder === 1);

const NodeDetailPanel = ({ node, progress, onClose, onStartChallenge }) => {
  const { isDark } = useTheme();
  if (!node) return null;

  const completedSet = new Set(progress?.completedNodes?.map((entry) => entry.nodeId) ?? []);
  const prerequisites = Array.isArray(node.prerequisites)
    ? node.prerequisites.filter(Boolean)
    : [];
  const isEntryNode = isAbsoluteRootNode(node);
  const isLocked = !isEntryNode && !prerequisites.every((prereq) => completedSet.has(prereq));
  const completion = progress?.completedNodes?.find((n) => n.nodeId === node.nodeId);
  const isCompleted = !!completion;
  const stars = completion?.starsAwarded ?? 0;
  const isBoss = node.nodeType === 'boss';
  const isMidBoss = node.bossType === 'mid';
  const hasProblemData = node.hasProblemData !== false && Boolean(node.problemId || node.problem);

  const title =
    node.problem?.title ||
    node.problemId?.title ||
    node.title ||
    `Unknown Challenge ${node.nodeNum ?? ''}`.trim();

  const difficulty =
    node.problem?.difficulty ||
    node.problemId?.difficulty ||
    'Easy';

  const accentColor = isMidBoss ? '#a855f7' : isBoss ? '#ef4444' : '#22d3ee';
  const effectiveLocked = isLocked || !hasProblemData;

  return (
    <AnimatePresence>
      {node && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 dark:bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed inset-0 z-[101] flex items-end justify-center p-0 sm:items-center sm:p-6"
            onClick={onClose}
          >
            <div
              className="relative z-[101] w-full max-w-md md:max-w-lg bg-white dark:bg-[#0F172A] border border-gray-100 dark:border-gray-700 rounded-t-[28px] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[88dvh] sm:max-h-[min(84vh,720px)] transition-colors"
              onClick={(event) => event.stopPropagation()}
              style={{ boxShadow: isDark ? `0 30px 80px ${accentColor}22` : `0 20px 60px rgba(0,0,0,0.15)` }}
            >
              <div
                className="h-0.5 shrink-0"
                style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
              />

              <button
                onClick={onClose}
                className="absolute top-3 right-3 z-10 p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors touch-manipulation"
              >
                <X size={16} />
              </button>

              <div className="flex items-start justify-between px-4 py-4 md:px-6 shrink-0 sm:px-5 sm:py-5">
                <div className="flex items-center gap-3 flex-1 min-w-0 pr-10">
                  {isBoss && (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: `${accentColor}20`, border: `1.5px solid ${accentColor}60` }}
                    >
                      {isMidBoss ? <span>Boss</span> : <Skull size={15} style={{ color: accentColor }} />}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="font-black text-gray-800 dark:text-white text-base sm:text-lg md:text-xl leading-tight truncate">
                      {title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {isBoss && (
                        <span
                          className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                          style={{
                            background: isMidBoss ? '#6b21a8' : '#991b1b',
                            color: isMidBoss ? '#e9d5ff' : '#fecaca',
                          }}
                        >
                          {isMidBoss ? 'Mid Boss' : 'Zone Boss'}
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${DIFF_COLOR[difficulty] || DIFF_COLOR.Easy}`}>
                        {difficulty}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-4 min-h-0 md:px-6 sm:px-5" style={{ WebkitOverflowScrolling: 'touch' }}>
                {effectiveLocked ? (
                  <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 dark:bg-slate-900/70 border border-gray-100 dark:border-slate-700/70 rounded-xl">
                    <Lock size={14} className="text-gray-400 dark:text-slate-500 shrink-0" />
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {hasProblemData
                        ? 'Complete the previous node to unlock this challenge.'
                        : 'This challenge is not available in the current local dataset yet.'}
                    </p>
                  </div>
                ) : isCompleted ? (
                  <div className="flex items-center gap-3 px-3 py-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl">
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map((i) => (
                        <Star key={i} size={14} className={i <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-600'} />
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-amber-300">Completed</p>
                      {completion?.bestTimeMs && (
                        <p className="text-[10px] text-amber-200/70 flex items-center gap-1">
                          <Clock size={9} /> Best: {completion.bestTimeMs}ms avg
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold"
                    style={{
                      background: `${accentColor}10`,
                      borderColor: `${accentColor}40`,
                      color: accentColor,
                    }}
                  >
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: accentColor }} />
                    Ready to attempt
                  </div>
                )}

                {hasProblemData && node.rewards && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                      Rewards
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { s: 1, kp: node.rewards.oneStarKP },
                        { s: 2, kp: node.rewards.twoStarKP },
                        { s: 3, kp: node.rewards.threeStarKP },
                      ].map((r) => (
                        <div
                          key={r.s}
                          className="flex flex-col items-center p-2 bg-gray-50 dark:bg-slate-950/45 rounded-lg border border-gray-100 dark:border-slate-800/80"
                        >
                          <div className="flex gap-0.5 mb-0.5">
                            {[1, 2, 3].map((i) => (
                              <span key={i} style={{ fontSize: 9, color: i <= r.s ? '#fbbf24' : '#374151' }}>★</span>
                            ))}
                          </div>
                          <div className="flex items-center gap-0.5">
                            <Zap size={9} className="text-cyan-400" />
                            <span className="text-[11px] font-black text-cyan-400">{r.kp}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {hasProblemData && node.starThresholds && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                      Star Thresholds
                    </p>
                    <div className="space-y-1.5">
                      {[
                        { s: 1, label: 'Pass all test cases' },
                        { s: 2, label: `Avg time < ${node.starThresholds.twoStarTimeMs}ms` },
                        { s: 3, label: `Avg time < ${node.starThresholds.threeStarTimeMs}ms` },
                      ].map((r) => (
                        <div key={r.s} className="flex items-center gap-2 text-[11px]">
                          <div className="flex gap-0.5 shrink-0">
                            {[1, 2, 3].map((i) => (
                              <span key={i} style={{ fontSize: 9, color: i <= r.s ? '#fbbf24' : isDark ? '#374151' : '#e2e8f0' }}>★</span>
                            ))}
                          </div>
                          <span className="text-gray-500 dark:text-slate-400">{r.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {hasProblemData && isBoss && node.rewards?.lootPool?.length > 0 && (
                  <div className="p-3 bg-purple-100/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/30 rounded-xl">
                    <p className="text-[10px] font-bold text-purple-600 dark:text-purple-300 uppercase tracking-widest mb-1.5">
                      Loot Pool
                    </p>
                    <div className="space-y-1">
                      {node.rewards.lootPool.map((loot, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-700 dark:text-slate-300 capitalize">
                            {loot.itemType}: {loot.itemId.replace(/_/g, ' ')}
                          </span>
                          <span className="text-purple-600 dark:text-purple-300 font-bold">
                            {Math.round(loot.dropChance * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-4 py-4 border-t border-gray-100 dark:border-slate-800/80 shrink-0 md:px-6 sm:px-5">
                {effectiveLocked ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl text-sm font-black bg-gray-100 dark:bg-slate-900/80 text-gray-400 dark:text-slate-500 cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation transition-colors"
                  >
                    <Lock size={14} /> {hasProblemData ? 'Locked' : 'Coming Soon'}
                  </button>
                ) : isCompleted ? (
                  <button
                    onClick={() => onStartChallenge(node)}
                    className="w-full py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all text-black touch-manipulation"
                    style={{ background: 'linear-gradient(90deg, #fbbf24, #f59e0b)' }}
                  >
                    <RotateCcw size={15} /> Replay & Improve
                  </button>
                ) : (
                  <button
                    onClick={() => onStartChallenge(node)}
                    className="w-full py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all text-black touch-manipulation"
                    style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)` }}
                  >
                    <Play size={15} /> Start Challenge
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default React.memo(NodeDetailPanel);

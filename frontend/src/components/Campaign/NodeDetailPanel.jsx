// // src/components/Campaign/NodeDetailPanel.jsx
// // ─────────────────────────────────────────────────────────────────────────────
// // Slide-in panel on the campaign map showing node details and a Start button.
// // Fully theme-aware (dark: variants). Safe optional chaining everywhere.
// // Positioned absolute on desktop, bottom-sheet on mobile.
// // z-index 40 — sits above canvas (z-10) but below modals (z-9999).
// // ─────────────────────────────────────────────────────────────────────────────

// import React from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { X, Star, Clock, Zap, Lock, Play, RotateCcw, Skull } from 'lucide-react';

// const DIFF_COLOR = {
//   Easy:   'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
//   Medium: 'text-amber-400   bg-amber-500/10   border-amber-500/25',
//   Hard:   'text-red-400     bg-red-500/10     border-red-500/25',
// };

// const NodeDetailPanel = ({ node, progress, onClose, onStartChallenge }) => {
//   if (!node) return null;

//   // Determine node progression state
//   const isLocked    = !progress?.unlockedNodes?.includes(node.nodeId);
//   const completion  = progress?.completedNodes?.find(n => n.nodeId === node.nodeId);
//   const isCompleted = !!completion;
// //   const isAvailable = !isLocked && !isCompleted;
//   const stars       = completion?.starsAwarded ?? 0;
//   const isBoss      = node.nodeType === 'boss';
//   const isMidBoss   = node.bossType === 'mid';

//   // Read title/difficulty from either data shape
//   const title      = node.problem?.title      || node.problemId?.title      || `Challenge ${node.nodeNum}`;
//   const difficulty = node.problem?.difficulty || node.problemId?.difficulty || 'Easy';
// //   const description= node.problem?.description|| node.problemId?.description|| '';

//   const accentColor = isMidBoss ? '#a855f7' : isBoss ? '#ef4444' : '#22d3ee';

//   return (
//     <AnimatePresence>
//       {node && (
//         <>
//           {/* Backdrop (mobile only) */}
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="sm:hidden absolute inset-0 bg-black/50 z-30"
//             onClick={onClose}
//           />

//           {/* Panel */}
//           <motion.div
//             initial={{ opacity: 0, x: 40 }}
//             animate={{ opacity: 1, x: 0 }}
//             exit={{ opacity: 0, x: 40 }}
//             transition={{ type: 'spring', damping: 28, stiffness: 260 }}
//             className={`
//               absolute z-40
//               bottom-0 left-0 right-0 rounded-t-2xl
//               sm:bottom-auto sm:top-4 sm:right-4 sm:left-auto
//               sm:w-80 sm:max-w-[90vw] sm:rounded-2xl
//               bg-white dark:bg-[#0a0d14]
//               border-t sm:border border-slate-200 dark:border-gray-800/60
//               shadow-2xl
//               flex flex-col
//               max-h-[70dvh] sm:max-h-[calc(100dvh-2rem)]
//             `}
//             style={{ boxShadow: `0 0 40px ${accentColor}20` }}
//           >
//             {/* Top accent */}
//             <div
//               className="h-0.5 rounded-t-2xl shrink-0"
//               style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
//             />

//             {/* Header */}
//             <div className="flex items-start justify-between px-4 py-3.5 shrink-0">
//               <div className="flex items-center gap-2 flex-1 min-w-0">
//                 {isBoss && (
//                   <div
//                     className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
//                     style={{ background: `${accentColor}20`, border: `1.5px solid ${accentColor}60` }}
//                   >
//                     {isMidBoss ? <span>⚔️</span> : <Skull size={14} style={{ color: accentColor }} />}
//                   </div>
//                 )}
//                 <div className="min-w-0">
//                   <h3 className="font-black text-slate-900 dark:text-white text-[15px] leading-tight truncate">
//                     {title}
//                   </h3>
//                   <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
//                     {isBoss && (
//                       <span
//                         className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
//                         style={{
//                           background: isMidBoss ? '#6b21a8' : '#991b1b',
//                           color: isMidBoss ? '#e9d5ff' : '#fecaca',
//                         }}
//                       >
//                         {isMidBoss ? 'Mid Boss' : 'Zone Boss'}
//                       </span>
//                     )}
//                     <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${DIFF_COLOR[difficulty] || DIFF_COLOR.Easy}`}>
//                       {difficulty}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//               <button
//                 onClick={onClose}
//                 className="p-1.5 text-slate-400 dark:text-gray-600 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors shrink-0 ml-2"
//               >
//                 <X size={16} />
//               </button>
//             </div>

//             {/* Scrollable body */}
//             <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-3 min-h-0">

//               {/* Status banner */}
//               {isLocked ? (
//                 <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800/50 rounded-xl">
//                   <Lock size={14} className="text-gray-400 dark:text-gray-600 shrink-0" />
//                   <p className="text-xs text-gray-500 dark:text-gray-600">
//                     Complete the previous node to unlock this challenge.
//                   </p>
//                 </div>
//               ) : isCompleted ? (
//                 <div className="flex items-center gap-3 px-3 py-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-xl">
//                   <div className="flex gap-0.5">
//                     {[1, 2, 3].map(i => (
//                       <Star key={i} size={14} className={i <= stars ? 'text-amber-400 fill-amber-400' : 'text-gray-600'} />
//                     ))}
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Completed</p>
//                     {completion?.bestTimeMs && (
//                       <p className="text-[10px] text-amber-500/70 dark:text-amber-600 flex items-center gap-1">
//                         <Clock size={9} /> Best: {completion.bestTimeMs}ms avg
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               ) : (
//                 <div
//                   className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold"
//                   style={{
//                     background: `${accentColor}10`,
//                     borderColor: `${accentColor}40`,
//                     color: accentColor,
//                   }}
//                 >
//                   <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: accentColor }} />
//                   Ready to attempt
//                 </div>
//               )}

//               {/* Rewards */}
//               {node.rewards && (
//                 <div>
//                   <p className="text-[10px] font-bold text-slate-400 dark:text-gray-600 uppercase tracking-widest mb-1.5">
//                     Rewards
//                   </p>
//                   <div className="grid grid-cols-3 gap-1.5">
//                     {[
//                       { s: 1, kp: node.rewards.oneStarKP   },
//                       { s: 2, kp: node.rewards.twoStarKP   },
//                       { s: 3, kp: node.rewards.threeStarKP },
//                     ].map(r => (
//                       <div key={r.s} className="flex flex-col items-center p-2 bg-slate-100 dark:bg-gray-900/50 rounded-lg border border-slate-200 dark:border-gray-800/50">
//                         <div className="flex gap-0.5 mb-0.5">
//                           {[1, 2, 3].map(i => (
//                             <span key={i} style={{ fontSize: 9, color: i <= r.s ? '#fbbf24' : '#374151' }}>★</span>
//                           ))}
//                         </div>
//                         <div className="flex items-center gap-0.5">
//                           <Zap size={9} className="text-cyan-400" />
//                           <span className="text-[11px] font-black text-cyan-400">{r.kp}</span>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* Star thresholds */}
//               {node.starThresholds && (
//                 <div>
//                   <p className="text-[10px] font-bold text-slate-400 dark:text-gray-600 uppercase tracking-widest mb-1.5">
//                     Star Thresholds
//                   </p>
//                   <div className="space-y-1">
//                     {[
//                       { s: 1, label: 'Pass all test cases' },
//                       { s: 2, label: `Avg time < ${node.starThresholds.twoStarTimeMs}ms` },
//                       { s: 3, label: `Avg time < ${node.starThresholds.threeStarTimeMs}ms` },
//                     ].map(r => (
//                       <div key={r.s} className="flex items-center gap-2 text-[11px]">
//                         <div className="flex gap-0.5 shrink-0">
//                           {[1, 2, 3].map(i => (
//                             <span key={i} style={{ fontSize: 9, color: i <= r.s ? '#fbbf24' : '#374151' }}>★</span>
//                           ))}
//                         </div>
//                         <span className="text-slate-500 dark:text-gray-600">{r.label}</span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* Boss loot pool */}
//               {isBoss && node.rewards?.lootPool?.length > 0 && (
//                 <div className="p-3 bg-purple-50 dark:bg-purple-950/15 border border-purple-200 dark:border-purple-800/30 rounded-xl">
//                   <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1.5">
//                     Loot Pool
//                   </p>
//                   <div className="space-y-1">
//                     {node.rewards.lootPool.map((loot, i) => (
//                       <div key={i} className="flex items-center justify-between text-[11px]">
//                         <span className="text-slate-600 dark:text-gray-400 capitalize">
//                           {loot.itemType}: {loot.itemId.replace(/_/g, ' ')}
//                         </span>
//                         <span className="text-purple-500 dark:text-purple-400 font-bold">
//                           {Math.round(loot.dropChance * 100)}%
//                         </span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Action button */}
//             <div className="px-4 py-3 border-t border-slate-200 dark:border-gray-800/50 shrink-0">
//               {isLocked ? (
//                 <button disabled className="w-full py-3 rounded-xl text-sm font-black bg-gray-100 dark:bg-gray-900/50 text-gray-400 dark:text-gray-600 cursor-not-allowed flex items-center justify-center gap-2">
//                   <Lock size={14} /> Locked
//                 </button>
//               ) : isCompleted ? (
//                 <button
//                   onClick={() => onStartChallenge(node.nodeId)}
//                   className="w-full py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all text-black"
//                   style={{ background: `linear-gradient(90deg, #fbbf24, #f59e0b)` }}
//                 >
//                   <RotateCcw size={15} /> Replay & Improve
//                 </button>
//               ) : (
//                 <button
//                   onClick={() => onStartChallenge(node.nodeId)}
//                   className="w-full py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all text-black"
//                   style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)` }}
//                 >
//                   <Play size={15} /> Start Challenge
//                 </button>
//               )}
//             </div>
//           </motion.div>
//         </>
//       )}
//     </AnimatePresence>
//   );
// };

// export default NodeDetailPanel;



































// src/components/Campaign/NodeDetailPanel.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Slide-in panel on the campaign map showing node details and a Start button.
// Fully theme-aware (dark: variants). Safe optional chaining everywhere.
// Positioned absolute on desktop, bottom-sheet on mobile.
// z-index 40 — sits above canvas (z-10) but below modals (z-9999).
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Clock, Zap, Lock, Play, RotateCcw, Skull } from 'lucide-react';

const DIFF_COLOR = {
  Easy:   'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  Medium: 'text-amber-400   bg-amber-500/10   border-amber-500/25',
  Hard:   'text-red-400     bg-red-500/10     border-red-500/25',
};

const NodeDetailPanel = ({ node, progress, onClose, onStartChallenge }) => {
  if (!node) return null;

  // Determine node progression state
  const isLocked    = !progress?.unlockedNodes?.includes(node.nodeId);
  const completion  = progress?.completedNodes?.find(n => n.nodeId === node.nodeId);
  const isCompleted = !!completion;
  const isAvailable = !isLocked && !isCompleted;
  const stars       = completion?.starsAwarded ?? 0;
  const isBoss      = node.nodeType === 'boss';
  const isMidBoss   = node.bossType === 'mid';

  // Read title/difficulty from either data shape
  const title      = node.problem?.title      || node.problemId?.title      || `Challenge ${node.nodeNum}`;
  const difficulty = node.problem?.difficulty || node.problemId?.difficulty || 'Easy';
  const description= node.problem?.description|| node.problemId?.description|| '';

  const accentColor = isMidBoss ? '#a855f7' : isBoss ? '#ef4444' : '#22d3ee';

  return (
    <AnimatePresence>
      {node && (
        <>
          {/* Backdrop (mobile only) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sm:hidden absolute inset-0 bg-black/50 z-30"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className={`
              absolute z-40
              bottom-0 left-0 right-0 rounded-t-2xl
              sm:bottom-auto sm:top-4 sm:right-4 sm:left-auto
              sm:w-80 sm:max-w-[90vw] sm:rounded-2xl
              bg-white dark:bg-[#0a0d14]
              border-t sm:border border-slate-200 dark:border-gray-800/60
              shadow-2xl
              flex flex-col
              max-h-[70dvh] sm:max-h-[calc(100dvh-2rem)]
            `}
            style={{ boxShadow: `0 0 40px ${accentColor}20` }}
          >
            {/* Top accent */}
            <div
              className="h-0.5 rounded-t-2xl shrink-0"
              style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
            />

            {/* Header */}
            <div className="flex items-start justify-between px-4 py-3.5 shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {isBoss && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `${accentColor}20`, border: `1.5px solid ${accentColor}60` }}
                  >
                    {isMidBoss ? <span>⚔️</span> : <Skull size={14} style={{ color: accentColor }} />}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-black text-slate-900 dark:text-white text-[15px] leading-tight truncate">
                    {title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
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
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 dark:text-gray-600 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors shrink-0 ml-2"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-3 min-h-0">

              {/* Status banner */}
              {isLocked ? (
                <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800/50 rounded-xl">
                  <Lock size={14} className="text-gray-400 dark:text-gray-600 shrink-0" />
                  <p className="text-xs text-gray-500 dark:text-gray-600">
                    Complete the previous node to unlock this challenge.
                  </p>
                </div>
              ) : isCompleted ? (
                <div className="flex items-center gap-3 px-3 py-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-xl">
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map(i => (
                      <Star key={i} size={14} className={i <= stars ? 'text-amber-400 fill-amber-400' : 'text-gray-600'} />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Completed</p>
                    {completion?.bestTimeMs && (
                      <p className="text-[10px] text-amber-500/70 dark:text-amber-600 flex items-center gap-1">
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

              {/* Rewards */}
              {node.rewards && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-gray-600 uppercase tracking-widest mb-1.5">
                    Rewards
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { s: 1, kp: node.rewards.oneStarKP   },
                      { s: 2, kp: node.rewards.twoStarKP   },
                      { s: 3, kp: node.rewards.threeStarKP },
                    ].map(r => (
                      <div key={r.s} className="flex flex-col items-center p-2 bg-slate-100 dark:bg-gray-900/50 rounded-lg border border-slate-200 dark:border-gray-800/50">
                        <div className="flex gap-0.5 mb-0.5">
                          {[1, 2, 3].map(i => (
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

              {/* Star thresholds */}
              {node.starThresholds && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-gray-600 uppercase tracking-widest mb-1.5">
                    Star Thresholds
                  </p>
                  <div className="space-y-1">
                    {[
                      { s: 1, label: 'Pass all test cases' },
                      { s: 2, label: `Avg time < ${node.starThresholds.twoStarTimeMs}ms` },
                      { s: 3, label: `Avg time < ${node.starThresholds.threeStarTimeMs}ms` },
                    ].map(r => (
                      <div key={r.s} className="flex items-center gap-2 text-[11px]">
                        <div className="flex gap-0.5 shrink-0">
                          {[1, 2, 3].map(i => (
                            <span key={i} style={{ fontSize: 9, color: i <= r.s ? '#fbbf24' : '#374151' }}>★</span>
                          ))}
                        </div>
                        <span className="text-slate-500 dark:text-gray-600">{r.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Boss loot pool */}
              {isBoss && node.rewards?.lootPool?.length > 0 && (
                <div className="p-3 bg-purple-50 dark:bg-purple-950/15 border border-purple-200 dark:border-purple-800/30 rounded-xl">
                  <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1.5">
                    Loot Pool
                  </p>
                  <div className="space-y-1">
                    {node.rewards.lootPool.map((loot, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 dark:text-gray-400 capitalize">
                          {loot.itemType}: {loot.itemId.replace(/_/g, ' ')}
                        </span>
                        <span className="text-purple-500 dark:text-purple-400 font-bold">
                          {Math.round(loot.dropChance * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action button */}
            <div className="px-4 py-3 border-t border-slate-200 dark:border-gray-800/50 shrink-0">
              {isLocked ? (
                <button disabled className="w-full py-3 rounded-xl text-sm font-black bg-gray-100 dark:bg-gray-900/50 text-gray-400 dark:text-gray-600 cursor-not-allowed flex items-center justify-center gap-2">
                  <Lock size={14} /> Locked
                </button>
              ) : isCompleted ? (
                <button
                  onClick={() => onStartChallenge(node.nodeId)}
                  className="w-full py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all text-black"
                  style={{ background: `linear-gradient(90deg, #fbbf24, #f59e0b)` }}
                >
                  <RotateCcw size={15} /> Replay & Improve
                </button>
              ) : (
                <button
                  onClick={() => onStartChallenge(node.nodeId)}
                  className="w-full py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all text-black"
                  style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)` }}
                >
                  <Play size={15} /> Start Challenge
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NodeDetailPanel;
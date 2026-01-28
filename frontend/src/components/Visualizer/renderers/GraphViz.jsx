// import React from 'react';
// import { motion, AnimatePresence } from 'framer-motion';

// const GraphViz = ({ data, pointers }) => {
//     // data is a 2D grid

//     const getCellProps = (val) => {
//         // 1. PATH ARROWS (The Trail) - Neon Green Glow
//         if (['↑', '↓', '←', '→'].includes(val)) {
//             return { 
//                 bg: 'bg-green-500/20', 
//                 text: 'text-green-400 text-xl font-black drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]', 
//                 border: 'border-green-500/50',
//                 content: val,
//                 zIndex: 10
//             };
//         }

//         // 2. SPECIAL NODES
//         // Start: Electric Cyan
//         if (val === 'S') return { 
//             bg: 'bg-cyan-600', 
//             text: 'text-white font-bold', 
//             border: 'border-cyan-400', 
//             shadow: 'shadow-[0_0_20px_rgba(8,145,178,0.8)]', 
//             content: 'S', 
//             zIndex: 20 
//         };
//         // Goal: Hot Pink
//         if (val === 'G') return { 
//             bg: 'bg-pink-600', 
//             text: 'text-white font-bold', 
//             border: 'border-pink-400', 
//             shadow: 'shadow-[0_0_20px_rgba(219,39,119,0.8)]', 
//             content: 'G', 
//             zIndex: 20 
//         };
//         // Active Head: Blazing Yellow
//         if (val === '*') return { 
//             bg: 'bg-yellow-400', 
//             text: 'text-black', 
//             border: 'border-yellow-200', 
//             shadow: 'shadow-[0_0_25px_rgba(250,204,21,0.9)]', 
//             content: '●', 
//             pulse: true, 
//             zIndex: 30 
//         }; 

//         // 3. TERRAIN WEIGHTS
//         if (typeof val === 'number') {
//             // Unexplored / Wall
//             if (val === 0) return { bg: 'bg-[#0f172a]', text: 'text-slate-700', border: 'border-slate-800' }; 
            
//             // Low Cost (1-9): Cool Blue - "Smooth Road"
//             if (val < 10) return { 
//                 bg: 'bg-blue-600/10', 
//                 text: 'text-blue-400 font-bold', 
//                 border: 'border-blue-500/30' 
//             }; 
            
//             // High Cost (50+): Warning Orange - "Mud/Traffic"
//             if (val >= 50) return { 
//                 bg: 'bg-orange-600/20', 
//                 text: 'text-orange-400 font-bold', 
//                 border: 'border-orange-500/50',
//                 shadow: 'shadow-[inset_0_0_10px_rgba(234,88,12,0.1)]'
//             }; 
            
//             return { bg: 'bg-[#0f172a]', text: 'text-slate-500', border: 'border-slate-800' };
//         }

//         return { bg: 'bg-[#0f172a]', text: '', border: 'border-slate-800' };
//     };

//     return (
//         <div className="p-8 bg-[#020617] rounded-3xl border border-slate-800 inline-block shadow-2xl relative overflow-hidden">
//             {/* Ambient Background Glow */}
//             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-900/10 to-purple-900/10 pointer-events-none" />

//             {/* Grid Container */}
//             <div className="flex flex-col gap-2 relative z-10">
//                 {data.map((row, r) => (
//                     <div key={r} className="flex gap-2">
//                         {row.map((val, c) => {
//                             const { bg, text, border, shadow, content, pulse, zIndex } = getCellProps(val);
                            
//                             // Check for active pointers
//                             const isPointerHere = (pointers['r'] === r && pointers['c'] === c);

//                             return (
//                                 <motion.div
//                                     key={`${r}-${c}`}
//                                     layout
//                                     initial={false}
//                                     animate={{ 
//                                         scale: pulse || isPointerHere ? 1.15 : 1,
//                                         borderColor: isPointerHere ? '#fff' : undefined,
//                                         borderWidth: isPointerHere ? '2px' : '1px',
//                                     }}
//                                     className={`
//                                         w-12 h-12 md:w-14 md:h-14 flex items-center justify-center 
//                                         rounded-xl border-2 text-sm md:text-lg font-mono relative backdrop-blur-md
//                                         ${bg} ${border} ${text} ${shadow || ''} transition-all duration-200
//                                         ${zIndex ? `z-[${zIndex}]` : 'z-0'}
//                                     `}
//                                 >
//                                     {content ?? val}

//                                     {/* Pulse Animation for Active Node */}
//                                     {(pulse || isPointerHere) && (
//                                         <motion.div
//                                             initial={{ opacity: 0.8, scale: 1 }}
//                                             animate={{ opacity: 0, scale: 2 }}
//                                             transition={{ repeat: Infinity, duration: 1 }}
//                                             className="absolute inset-0 rounded-xl border-2 border-yellow-300/50"
//                                         />
//                                     )}
//                                 </motion.div>
//                             );
//                         })}
//                     </div>
//                 ))}
//             </div>

//             {/* Legend */}
//             <div className="flex flex-wrap gap-5 mt-8 justify-center items-center border-t border-slate-800 pt-5">
//                 <LegendItem color="bg-blue-500/20 border-blue-500 text-blue-300" label="Road" />
//                 <LegendItem color="bg-orange-600/20 border-orange-500 text-orange-400" label="Mud" />
//                 <LegendItem color="bg-green-500/20 text-green-400 border-green-500" label="Path" />
//                 <LegendItem color="bg-cyan-600 text-white shadow-lg shadow-cyan-600/50" label="Start" />
//                 <LegendItem color="bg-pink-600 text-white shadow-lg shadow-pink-600/50" label="Goal" />
//             </div>
//         </div>
//     );
// };

// const LegendItem = ({ color, label }) => (
//     <div className="flex items-center gap-2">
//         <div className={`w-4 h-4 rounded ${color} ${!color.includes('border') ? 'border border-transparent' : ''}`}></div>
//         <span className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest">{label}</span>
//     </div>
// );

// // ✅ EXPORT DEFAULT IS CRITICAL
// export default GraphViz;
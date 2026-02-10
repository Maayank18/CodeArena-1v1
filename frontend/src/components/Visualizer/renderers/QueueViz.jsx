// import React, { useMemo, memo } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { ArrowLeft, ArrowRight } from 'lucide-react';

// const QueueViz = memo(({ data, pointers }) => {
    
//     //  MEMOIZED DATA PREP
//     // Generates stable IDs for duplicates to ensure correct Framer Motion tracking
//     const uniqueData = useMemo(() => {
//         if (!Array.isArray(data)) return [];
        
//         const counts = new Map();
//         return data.map((val) => {
//             const safeKey = val === null ? 'null' : String(val);
//             const count = (counts.get(safeKey) || 0) + 1;
//             counts.set(safeKey, count);
            
//             return { 
//                 val, 
//                 id: `${safeKey}_${count}` // Stable ID: "10_1", "10_2"
//             };
//         });
//     }, [data]);

//     return (
//         <div className="relative p-8 bg-[#0d1117] inline-block rounded-xl border border-gray-800 shadow-2xl overflow-hidden">
            
//             {/* 1. VISUAL GUIDES (Front/Rear Labels) */}
//             <div className="absolute top-3 left-0 w-full flex justify-between px-6 z-0 pointer-events-none">
//                 <div className="flex flex-col items-start opacity-40">
//                     <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest font-bold">Front (Exit)</span>
//                     <ArrowLeft size={14} className="text-emerald-500 mt-1" />
//                 </div>
//                 <div className="flex flex-col items-end opacity-40">
//                     <span className="text-[10px] text-blue-400 font-mono uppercase tracking-widest font-bold">Rear (Enter)</span>
//                     <ArrowLeft size={14} className="text-blue-500 mt-1 rotate-180" />
//                 </div>
//             </div>

//             {/* 2. THE PIPE CONTAINER */}
//             {/* Uses a gradient background to simulate a channel */}
//             <div className="
//                 flex items-center gap-3 py-6 px-10 min-h-[100px] min-w-[280px] relative z-10
//                 bg-gradient-to-r from-emerald-900/10 via-transparent to-blue-900/10
//                 border-y border-gray-800/50 rounded-lg mt-4
//             ">
                
//                 <AnimatePresence mode='popLayout'>
//                     {uniqueData.map(({ val, id }, idx) => {
                        
//                         // Pointer Logic (front, rear, etc.)
//                         const activePointers = Object.entries(pointers || {})
//                             .filter(([, index]) => index === idx)
//                             .map(([name]) => name);

//                         const isActive = activePointers.length > 0;

//                         return (
//                             <motion.div
//                                 layout
//                                 key={id}
//                                 // FIFO ANIMATION: Enter from Right, Exit to Left
//                                 initial={{ opacity: 0, x: 50, scale: 0.5 }}
//                                 animate={{ opacity: 1, x: 0, scale: 1 }}
//                                 exit={{ opacity: 0, x: -50, scale: 0.5, transition: { duration: 0.2 } }}
//                                 transition={{ type: "spring", stiffness: 350, damping: 25 }}
//                                 className="relative flex flex-col items-center"
//                             >
//                                 {/* VALUE BOX */}
//                                 <motion.div
//                                     layout
//                                     animate={{ 
//                                         backgroundColor: isActive ? 'rgba(245, 158, 11, 0.15)' : '#1f2937',
//                                         borderColor: isActive ? '#f59e0b' : '#374151',
//                                         y: isActive ? -4 : 0
//                                     }}
//                                     className={`
//                                         w-14 h-14 flex items-center justify-center 
//                                         border-2 rounded-xl shadow-lg relative z-10 backdrop-blur-sm
//                                         ${isActive ? 'z-20' : 'z-10'}
//                                     `}
//                                 >
//                                     <span className={`text-sm font-mono font-bold ${isActive ? 'text-amber-400' : 'text-gray-200'}`}>
//                                         {val}
//                                     </span>
//                                 </motion.div>

//                                 {/* INDEX */}
//                                 <div className="mt-2 text-[10px] font-mono text-gray-600 select-none">
//                                     {idx}
//                                 </div>

//                                 {/* POINTERS (Above the box) */}
//                                 <AnimatePresence>
//                                     {isActive && (
//                                         <motion.div
//                                             initial={{ opacity: 0, y: 5 }}
//                                             animate={{ opacity: 1, y: 0 }}
//                                             exit={{ opacity: 0, y: 3 }}
//                                             className="absolute bottom-full mb-2 flex flex-col items-center z-30"
//                                         >
//                                             <div className="bg-amber-500 text-[#0d1117] text-[9px] px-2 py-0.5 rounded shadow-lg font-bold border border-amber-400 whitespace-nowrap uppercase">
//                                                 {activePointers.join(', ')}
//                                             </div>
//                                             <svg width="10" height="6" viewBox="0 0 10 6" fill="#f59e0b" className="mt-[-1px]">
//                                                 <path d="M5 6L0 0H10L5 6Z" />
//                                             </svg>
//                                         </motion.div>
//                                     )}
//                                 </AnimatePresence>
//                             </motion.div>
//                         );
//                     })}
//                 </AnimatePresence>

//                 {/* EMPTY STATE */}
//                 {uniqueData.length === 0 && (
//                     <div className="absolute inset-0 flex items-center justify-center">
//                         <span className="text-gray-700 text-xs font-mono border border-dashed border-gray-800 px-4 py-2 rounded-lg bg-gray-900/50">
//                             Queue is Empty
//                         </span>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// });

// export default QueueViz;



















import React, { useMemo, useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, History, AlertTriangle, Trash2 } from 'lucide-react';

const QueueViz = memo(({ data, pointers, capacity = null, front = null, rear = null }) => {
    
    // 1. STABLE DATA GENERATION
    const uniqueData = useMemo(() => {
        if (!Array.isArray(data)) return [];
        
        const counts = new Map();
        return data.map((val) => {
            const safeKey = val === null ? 'null' : String(val);
            const count = (counts.get(safeKey) || 0) + 1;
            counts.set(safeKey, count);
            
            return { 
                val, 
                id: `${safeKey}_${count}`
            };
        });
    }, [data]);

    // 2. DEQUEUED HISTORY TRACKING
    const [dequeuedHistory, setDequeuedHistory] = useState([]);
    const prevDataRef = useRef(uniqueData);

    useEffect(() => {
        const prev = prevDataRef.current;
        const curr = uniqueData;

        if (prev.length > curr.length) {
            const removed = prev.slice(0, prev.length - curr.length);
            const newHistoryItems = removed.map(item => ({
                ...item,
                uniqueKey: `${item.id}_${Date.now()}_${Math.random()}`
            }));
            setDequeuedHistory(history => [...newHistoryItems, ...history].slice(0, 5));
        }
        
        if (prev.length === 0 && curr.length > 0) {
            setDequeuedHistory([]);
        }

        prevDataRef.current = curr;
    }, [uniqueData]);

    // 3. OVERFLOW DETECTION
    const isFull = capacity && uniqueData.length >= capacity;
    const isOverflow = capacity && uniqueData.length > capacity;

    // 4. CALCULATE ACTUAL FRONT/REAR INDICES
    const actualFront = front !== null ? front : 0;
    const actualRear = rear !== null ? rear : uniqueData.length - 1;

    return (
        <div className="flex items-center gap-6 p-6">
            
            {/* --- MAIN QUEUE VISUALIZATION --- */}
            <div className="flex flex-col items-center">
                
                {/* ✅ REMOVED: Duplicate header - now handled by VizCanvas */}
                
                {/* Metadata Row (Capacity + Warnings) */}
                <div className="flex flex-col items-center gap-1 mb-3">
                    {capacity && (
                        <span className="text-[9px] font-mono text-gray-600">
                            {uniqueData.length}/{capacity}
                        </span>
                    )}
                    
                    {/* Overflow Warning */}
                    <AnimatePresence>
                        {isOverflow && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="px-2 py-1 bg-red-900/20 border border-red-500/40 rounded flex items-center gap-1.5"
                            >
                                <AlertTriangle size={10} className="text-red-400" />
                                <span className="text-[8px] font-bold text-red-400 uppercase">Overflow</span>
                            </motion.div>
                        )}
                        {isFull && !isOverflow && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="px-2 py-1 bg-yellow-900/20 border border-yellow-500/40 rounded"
                            >
                                <span className="text-[8px] font-bold text-yellow-400 uppercase">Full</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Direction Indicators */}
                <div className="w-full flex justify-between items-center mb-2 px-2 opacity-60">
                    <div className="flex items-center gap-1">
                        <ArrowLeft size={10} className="text-emerald-400" />
                        <span className="text-[8px] text-emerald-400 font-mono uppercase font-bold">Out</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-[8px] text-blue-400 font-mono uppercase font-bold">In</span>
                        <ArrowRight size={10} className="text-blue-400" />
                    </div>
                </div>

                {/* THE QUEUE PIPE */}
                <div className="
                    relative flex items-center gap-2 py-6 px-6 min-h-[100px] min-w-[280px]
                    bg-gradient-to-r from-emerald-900/5 via-transparent to-blue-900/5
                    border-y-2 border-gray-800/50 rounded-lg
                    overflow-visible
                ">
                    {/* Capacity Guide Line */}
                    {capacity && uniqueData.length > 0 && (
                        <div 
                            className="absolute left-0 top-0 bottom-0 border-r-2 border-dashed border-yellow-600/20 z-0 pointer-events-none"
                            style={{ left: `${Math.min((capacity / (uniqueData.length || 1)) * 100, 100)}%` }}
                        />
                    )}

                    <AnimatePresence mode='popLayout'>
                        {uniqueData.map(({ val, id }, idx) => {
                            
                            const activePointers = Object.entries(pointers || {})
                                .filter(([, index]) => index === idx)
                                .map(([name]) => name);

                            const isFrontPtr = idx === actualFront;
                            const isRearPtr = idx === actualRear;
                            const isActive = activePointers.length > 0 || isFrontPtr || isRearPtr;
                            const isOverCapacity = capacity && idx >= capacity;

                            // ✅ FIX: Determine label text (prioritize FRONT/REAR over custom pointers)
                            let pointerLabel = '';
                            if (isFrontPtr && isRearPtr) {
                                pointerLabel = 'F+R'; // Both (for single-element queue)
                            } else if (isFrontPtr) {
                                pointerLabel = 'FRONT';
                            } else if (isRearPtr) {
                                pointerLabel = 'REAR';
                            } else if (activePointers.length > 0) {
                                pointerLabel = activePointers.join(',');
                            }

                            return (
                                <motion.div
                                    layout
                                    key={id}
                                    initial={{ opacity: 0, x: 50, scale: 0.5 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: -50, scale: 0.5 }}
                                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                    className="relative flex flex-col items-center shrink-0"
                                >
                                    {/* ✅ POINTER LABEL (Above - Fixed Positioning) */}
                                    <AnimatePresence>
                                        {pointerLabel && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -3 }}
                                                className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-30 whitespace-nowrap"
                                            >
                                                <div className="bg-amber-500 text-[#0d1117] text-[8px] px-1.5 py-0.5 rounded shadow-lg font-bold border border-amber-600 uppercase tracking-wide">
                                                    {pointerLabel}
                                                </div>
                                                {/* Triangle */}
                                                <svg width="6" height="3" viewBox="0 0 6 3" fill="#f59e0b" className="mt-[-1px]">
                                                    <path d="M3 3L0 0H6L3 3Z" />
                                                </svg>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* VALUE BOX */}
                                    <motion.div
                                        layout
                                        animate={{ 
                                            backgroundColor: isOverCapacity 
                                                ? 'rgba(239, 68, 68, 0.15)' 
                                                : isActive 
                                                    ? 'rgba(245, 158, 11, 0.15)' 
                                                    : '#1f2937',
                                            borderColor: isOverCapacity 
                                                ? '#ef4444' 
                                                : isActive 
                                                    ? '#f59e0b' 
                                                    : '#374151',
                                            boxShadow: isActive ? '0 4px 12px rgba(245, 158, 11, 0.2)' : 'none',
                                        }}
                                        className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center border-2 rounded-xl relative backdrop-blur-sm"
                                    >
                                        <span className={`text-sm font-mono font-bold ${
                                            isOverCapacity ? 'text-red-400' : isActive ? 'text-amber-400' : 'text-gray-200'
                                        }`}>
                                            {val}
                                        </span>

                                        {/* Overflow Badge */}
                                        {isOverCapacity && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0d1117]"></div>
                                        )}
                                    </motion.div>

                                    {/* INDEX (Below) */}
                                    <div className="mt-1.5 text-[9px] font-mono text-gray-600 select-none">
                                        {idx}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* EMPTY STATE */}
                    {uniqueData.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-gray-700 text-xs font-mono border border-dashed border-gray-800 px-4 py-2 rounded-lg bg-gray-900/50">
                                Queue is Empty
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* --- DEQUEUED HISTORY --- */}
            <div className="h-auto min-h-[160px] w-px bg-gray-800 mx-2" />

            <div className="flex flex-col items-center min-h-[160px]">
                <div className="flex items-center gap-2 text-gray-500 font-mono text-[10px] uppercase tracking-widest mb-2 font-bold opacity-70">
                    <History size={12} />
                    <span>Dequeued</span>
                </div>

                <div className="
                    flex flex-col gap-2 p-3 min-w-[100px] min-h-[130px]
                    bg-[#0d1117]/50 rounded-xl border border-dashed border-gray-800
                    overflow-hidden
                ">
                    <AnimatePresence mode='popLayout'>
                        {dequeuedHistory.map((item, index) => (
                            <motion.div
                                key={item.uniqueKey}
                                layout
                                initial={{ opacity: 0, x: -20, scale: 0.8 }}
                                animate={{ opacity: 1 - index * 0.15, x: 0, scale: 1 - index * 0.05 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                                className="flex items-center gap-2"
                            >
                                <div className="w-16 h-7 flex items-center justify-center border border-emerald-900/50 bg-emerald-900/10 rounded text-emerald-400 font-mono text-xs font-bold">
                                    {item.val}
                                </div>
                                {index === 0 && (
                                    <span className="text-[8px] text-emerald-500 font-bold uppercase">
                                        Latest
                                    </span>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {dequeuedHistory.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-20 gap-2">
                            <Trash2 size={20} />
                            <span className="text-[9px] font-mono text-center">None</span>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
});

export default QueueViz;
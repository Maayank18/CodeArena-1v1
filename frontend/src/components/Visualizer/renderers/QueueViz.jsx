// import React from 'react';
// import { motion, AnimatePresence } from 'framer-motion';

// const QueueViz = ({ data, pointers }) => {
    
//     // Smart Keys for duplicates (same as Stack/Array)
//     const counts = {};
//     const uniqueData = data.map((val) => {
//         counts[val] = (counts[val] || 0) + 1;
//         return { val, id: `${val}_${counts[val]}` };
//     });

//     return (
//         <div className="relative p-6 bg-[#0d1117] inline-block">
            
//             {/* Queue Label */}
//             <div className="absolute top-0 left-0 w-full flex justify-between px-2">
//                 <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Front</span>
//                 <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Rear</span>
//             </div>

//             {/* The "Pipe" Container */}
//             <div className="flex items-center gap-2 border-y-2 border-gray-700/50 py-4 px-8 min-h-[80px] min-w-[200px] relative">
                
//                 <AnimatePresence mode='popLayout'>
//                     {uniqueData.map(({ val, id }, idx) => {
                        
//                         // Find pointers for this index
//                         const activePointers = Object.entries(pointers || {})
//                             .filter(([, index]) => index === idx)
//                             .map(([name]) => name);

//                         const isActive = activePointers.length > 0;

//                         return (
//                             <motion.div
//                                 layout
//                                 key={id}
//                                 // FIFO Animation: Enter Right, Exit Left
//                                 initial={{ opacity: 0, x: 50, scale: 0.8 }}
//                                 animate={{ opacity: 1, x: 0, scale: 1 }}
//                                 exit={{ opacity: 0, x: -50, scale: 0.8 }}
//                                 transition={{ type: "spring", stiffness: 400, damping: 25 }}
//                                 className="relative"
//                             >
//                                 {/* THE QUEUE BOX */}
//                                 <motion.div
//                                     layout
//                                     animate={{ 
//                                         backgroundColor: isActive ? '#f59e0b' : '#1f2937',
//                                         borderColor: isActive ? '#fbbf24' : '#374151',
//                                     }}
//                                     className="w-12 h-12 flex items-center justify-center border-2 rounded-lg shadow-lg relative z-10"
//                                 >
//                                     <span className={`text-sm font-mono font-bold ${isActive ? 'text-black' : 'text-white'}`}>
//                                         {val}
//                                     </span>
//                                 </motion.div>

//                                 {/* INDEX (Below) */}
//                                 <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-gray-600">
//                                     {idx}
//                                 </div>

//                                 {/* POINTERS (Top) */}
//                                 <AnimatePresence>
//                                     {isActive && (
//                                         <motion.div
//                                             initial={{ opacity: 0, y: -5 }}
//                                             animate={{ opacity: 1, y: 0 }}
//                                             exit={{ opacity: 0, y: -3 }}
//                                             className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 flex flex-col items-center z-20"
//                                         >
//                                             <div className="bg-amber-500 text-black font-bold text-[9px] px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider mb-0.5 whitespace-nowrap">
//                                                 {activePointers.join(', ')}
//                                             </div>
//                                             {/* Down Arrow */}
//                                             <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
//                                                 <path d="M12 5v14M5 12l7 7 7-7"/>
//                                             </svg>
//                                         </motion.div>
//                                     )}
//                                 </AnimatePresence>
//                             </motion.div>
//                         );
//                     })}
//                 </AnimatePresence>

//                 {/* Empty State Ghost */}
//                 {data.length === 0 && (
//                     <div className="absolute inset-0 flex items-center justify-center text-gray-700 text-xs font-mono select-none">
//                         Empty Queue
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default QueueViz;



















import React, { useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const QueueViz = memo(({ data, pointers }) => {
    
    // 🧠 MEMOIZED DATA PREP
    // Generates stable IDs for duplicates to ensure correct Framer Motion tracking
    const uniqueData = useMemo(() => {
        if (!Array.isArray(data)) return [];
        
        const counts = new Map();
        return data.map((val) => {
            const safeKey = val === null ? 'null' : String(val);
            const count = (counts.get(safeKey) || 0) + 1;
            counts.set(safeKey, count);
            
            return { 
                val, 
                id: `${safeKey}_${count}` // Stable ID: "10_1", "10_2"
            };
        });
    }, [data]);

    return (
        <div className="relative p-8 bg-[#0d1117] inline-block rounded-xl border border-gray-800 shadow-2xl overflow-hidden">
            
            {/* 1. VISUAL GUIDES (Front/Rear Labels) */}
            <div className="absolute top-3 left-0 w-full flex justify-between px-6 z-0 pointer-events-none">
                <div className="flex flex-col items-start opacity-40">
                    <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest font-bold">Front (Exit)</span>
                    <ArrowLeft size={14} className="text-emerald-500 mt-1" />
                </div>
                <div className="flex flex-col items-end opacity-40">
                    <span className="text-[10px] text-blue-400 font-mono uppercase tracking-widest font-bold">Rear (Enter)</span>
                    <ArrowLeft size={14} className="text-blue-500 mt-1 rotate-180" />
                </div>
            </div>

            {/* 2. THE PIPE CONTAINER */}
            {/* Uses a gradient background to simulate a channel */}
            <div className="
                flex items-center gap-3 py-6 px-10 min-h-[100px] min-w-[280px] relative z-10
                bg-gradient-to-r from-emerald-900/10 via-transparent to-blue-900/10
                border-y border-gray-800/50 rounded-lg mt-4
            ">
                
                <AnimatePresence mode='popLayout'>
                    {uniqueData.map(({ val, id }, idx) => {
                        
                        // Pointer Logic (front, rear, etc.)
                        const activePointers = Object.entries(pointers || {})
                            .filter(([, index]) => index === idx)
                            .map(([name]) => name);

                        const isActive = activePointers.length > 0;

                        return (
                            <motion.div
                                layout
                                key={id}
                                // FIFO ANIMATION: Enter from Right, Exit to Left
                                initial={{ opacity: 0, x: 50, scale: 0.5 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: -50, scale: 0.5, transition: { duration: 0.2 } }}
                                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                className="relative flex flex-col items-center"
                            >
                                {/* VALUE BOX */}
                                <motion.div
                                    layout
                                    animate={{ 
                                        backgroundColor: isActive ? 'rgba(245, 158, 11, 0.15)' : '#1f2937',
                                        borderColor: isActive ? '#f59e0b' : '#374151',
                                        y: isActive ? -4 : 0
                                    }}
                                    className={`
                                        w-14 h-14 flex items-center justify-center 
                                        border-2 rounded-xl shadow-lg relative z-10 backdrop-blur-sm
                                        ${isActive ? 'z-20' : 'z-10'}
                                    `}
                                >
                                    <span className={`text-sm font-mono font-bold ${isActive ? 'text-amber-400' : 'text-gray-200'}`}>
                                        {val}
                                    </span>
                                </motion.div>

                                {/* INDEX */}
                                <div className="mt-2 text-[10px] font-mono text-gray-600 select-none">
                                    {idx}
                                </div>

                                {/* POINTERS (Above the box) */}
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 3 }}
                                            className="absolute bottom-full mb-2 flex flex-col items-center z-30"
                                        >
                                            <div className="bg-amber-500 text-[#0d1117] text-[9px] px-2 py-0.5 rounded shadow-lg font-bold border border-amber-400 whitespace-nowrap uppercase">
                                                {activePointers.join(', ')}
                                            </div>
                                            <svg width="10" height="6" viewBox="0 0 10 6" fill="#f59e0b" className="mt-[-1px]">
                                                <path d="M5 6L0 0H10L5 6Z" />
                                            </svg>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
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
    );
});

export default QueueViz;
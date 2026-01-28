// import React from 'react';
// import { motion, AnimatePresence } from 'framer-motion';

// const StackViz = ({ data, pointers }) => {
    
//     // 🧠 SMART KEYS: Generate unique IDs for duplicates (same as ArrayViz)
//     const counts = {};
//     const uniqueData = data.map((val) => {
//         counts[val] = (counts[val] || 0) + 1;
//         return { val, id: `${val}_${counts[val]}` };
//     });

//     return (
//         <div className="relative p-4 border border-gray-800 rounded-xl bg-[#0d1117] inline-block">
//             {/* Container: flex-col-reverse makes the end of array appear at the top */}
//             <div className="flex flex-col-reverse items-center gap-1 min-w-[100px]"> 
//                 <AnimatePresence mode='popLayout'>
//                     {uniqueData.map(({ val, id }, idx) => {
                        
//                         // Find pointers for this index (e.g., "top")
//                         const activePointers = Object.entries(pointers || {})
//                             .filter(([, index]) => index === idx)
//                             .map(([name]) => name);

//                         // Is this the absolute top element of the stack?
//                         const isTop = idx === data.length - 1;
//                         const isActive = activePointers.length > 0 || isTop;

//                         return (
//                             <motion.div
//                                 layout
//                                 key={id}
//                                 // Animation: Drop in from above (push), fly out up (pop)
//                                 initial={{ opacity: 0, y: -50, scale: 0.8 }}
//                                 animate={{ opacity: 1, y: 0, scale: 1 }}
//                                 exit={{ opacity: 0, y: -50, scale: 0.8 }}
//                                 transition={{ type: "spring", stiffness: 400, damping: 25 }}
//                                 className="relative w-full flex justify-center"
//                             >
//                                 {/* THE STACK BOX */}
//                                 <motion.div
//                                     layout
//                                     animate={{ 
//                                         backgroundColor: isActive ? '#f59e0b' : '#1f2937',
//                                         borderColor: isActive ? '#fbbf24' : '#374151',
//                                     }}
//                                     className="w-full h-12 flex items-center justify-center border-2 rounded-lg shadow-md relative z-10"
//                                 >
//                                     <span className={`text-sm font-mono font-bold ${isActive ? 'text-black' : 'text-white'}`}>
//                                         {val}
//                                     </span>
//                                 </motion.div>

//                                 {/* INDEX LABEL (Left side) */}
//                                 <div className="absolute -left-6 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-500">
//                                     [{idx}]
//                                 </div>

//                                 {/* POINTERS (Right side arrows) */}
//                                 <AnimatePresence>
//                                     {activePointers.length > 0 && (
//                                         <motion.div
//                                             initial={{ opacity: 0, x: -10 }}
//                                             animate={{ opacity: 1, x: 0 }}
//                                             exit={{ opacity: 0, x: -5 }}
//                                             className="absolute -right-2 top-1/2 -translate-y-1/2 flex items-center z-20 translate-x-full"
//                                         >
//                                             {/* Left Arrow */}
//                                             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
//                                                 <path d="M19 12H5M12 19l-7-7 7-7"/>
//                                             </svg>
                                            
//                                             {/* Badge */}
//                                             <div className="bg-amber-500 text-black font-bold text-[9px] px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider ml-1 whitespace-nowrap">
//                                                 {activePointers.join(', ')}
//                                             </div>
//                                         </motion.div>
//                                     )}
//                                 </AnimatePresence>
//                             </motion.div>
//                         );
//                     })}
//                 </AnimatePresence>
                
//                 {/* Visual Base of the Stack */}
//                 {data.length === 0 && (
//                     <div className="text-gray-600 text-xs font-mono py-2">Empty Stack</div>
//                 )}
//                 <div className="w-full h-1 bg-gray-700 rounded-full mt-1 opacity-50"></div>
//             </div>
//         </div>
//     );
// };

// export default StackViz;














import React, { useMemo, useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trash2, History } from 'lucide-react';

const StackViz = memo(({ data, pointers }) => {
    
    // 1. STABLE DATA GENERATION
    // Generate stable IDs for duplicates (e.g., 10_1, 10_2)
    const uniqueData = useMemo(() => {
        if (!Array.isArray(data)) return [];
        const counts = new Map();
        return data.map((val) => {
            const safeKey = val === null ? 'null' : String(val);
            const count = (counts.get(safeKey) || 0) + 1;
            counts.set(safeKey, count);
            return { val, id: `${safeKey}_${count}` };
        });
    }, [data]);

    // 2. POPPED HISTORY TRACKING
    // Since the backend only gives us the *current* state, we must
    // internally track what was removed to visualize the "Pop" action.
    const [poppedHistory, setPoppedHistory] = useState([]);
    const prevDataRef = useRef(uniqueData);

    useEffect(() => {
        const prev = prevDataRef.current;
        const curr = uniqueData;

        // Detect if the stack shrank (POP operation)
        if (prev.length > curr.length) {
            // Identify the items that are no longer in the current list
            // (Simplified: assuming LIFO, the top items were removed)
            const diff = prev.slice(curr.length);
            
            // Add to history with a unique timestamp to prevent ID collisions
            const newHistoryItems = diff.map(item => ({
                ...item,
                uniqueKey: `${item.id}_${Date.now()}`
            }));

            setPoppedHistory(history => [...newHistoryItems, ...history].slice(0, 5)); // Keep last 5
        }
        
        // Reset history if stack grows from 0 (New Run)
        if (prev.length === 0 && curr.length > 0) {
            setPoppedHistory([]);
        }

        prevDataRef.current = curr;
    }, [uniqueData]);

    return (
        <div className="flex items-end gap-6 p-6">
            
            {/* --- SECTION A: THE MAIN STACK --- */}
            <div className="flex flex-col items-center">
                <span className="text-gray-500 font-mono text-[10px] uppercase tracking-widest mb-2 font-bold">Stack Memory</span>
                
                {/* U-Shaped Container */}
                <div className="
                    relative flex flex-col-reverse items-center justify-start gap-1 
                    min-w-[140px] min-h-[200px] p-2 pb-0
                    border-l-4 border-r-4 border-b-4 border-gray-700/50 rounded-b-xl
                    bg-[#0d1117] shadow-2xl
                ">
                    <AnimatePresence mode='popLayout'>
                        {uniqueData.map(({ val, id }, idx) => {
                            
                            // Pointer Logic
                            const activePointers = Object.entries(pointers || {})
                                .filter(([, index]) => index === idx)
                                .map(([name]) => name);

                            const isTop = idx === uniqueData.length - 1;
                            const isActive = activePointers.length > 0 || isTop;

                            return (
                                <motion.div
                                    layout
                                    key={id}
                                    // PUSH: Fall from top (-100px)
                                    // POP: Fly up and fade (+100px)
                                    initial={{ opacity: 0, y: -100, scale: 0.8 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -100, scale: 0.5, zIndex: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    className="relative w-full flex justify-center z-10"
                                >
                                    {/* VALUE BOX */}
                                    <motion.div
                                        layout
                                        animate={{ 
                                            backgroundColor: isActive ? 'rgba(245, 158, 11, 0.15)' : '#1f2937',
                                            borderColor: isActive ? '#f59e0b' : '#374151',
                                            boxShadow: isActive ? '0 0 15px rgba(245, 158, 11, 0.2)' : 'none',
                                        }}
                                        className="w-24 h-10 flex items-center justify-center border-2 rounded-md relative backdrop-blur-sm"
                                    >
                                        <span className={`text-sm font-mono font-bold ${isActive ? 'text-amber-400' : 'text-gray-200'}`}>
                                            {val}
                                        </span>
                                    </motion.div>

                                    {/* INDEX (Left) */}
                                    <div className="absolute -left-8 top-1/2 -translate-y-1/2 text-[9px] font-mono text-gray-600 select-none">
                                        {idx}
                                    </div>

                                    {/* POINTERS (Right) */}
                                    <AnimatePresence>
                                        {activePointers.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 10 }}
                                                className="absolute -right-2 translate-x-full top-1/2 -translate-y-1/2 flex items-center gap-1"
                                            >
                                                <ArrowLeft size={14} className="text-amber-500" />
                                                <div className="bg-amber-500 text-black text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shadow-sm">
                                                    {activePointers.join(', ')}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* Empty State Overlay */}
                    {uniqueData.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-700 text-xs font-mono select-none pointer-events-none">
                            Stack is Empty
                        </div>
                    )}
                </div>
            </div>

            {/* --- SECTION B: POPPED HISTORY --- */}
            <div className="h-[200px] w-px bg-gray-800 mx-2" /> {/* Divider */}

            <div className="flex flex-col items-center h-[200px]">
                <div className="flex items-center gap-2 text-gray-500 font-mono text-[10px] uppercase tracking-widest mb-2 font-bold opacity-70">
                    <History size={12} />
                    <span>Popped History</span>
                </div>

                <div className="
                    flex flex-col gap-2 p-3 min-w-[100px] h-full
                    bg-[#0d1117]/50 rounded-xl border border-dashed border-gray-800
                    overflow-hidden
                ">
                    <AnimatePresence mode='popLayout'>
                        {poppedHistory.map((item, index) => (
                            <motion.div
                                key={item.uniqueKey}
                                layout
                                initial={{ opacity: 0, x: -20, scale: 0.8 }}
                                animate={{ opacity: 1 - index * 0.15, x: 0, scale: 1 - index * 0.05 }} // Fade older items
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                                className="flex items-center gap-2"
                            >
                                <div className="w-20 h-8 flex items-center justify-center border border-red-900/50 bg-red-900/10 rounded text-red-400 font-mono text-xs font-bold shadow-sm">
                                    {item.val}
                                </div>
                                {index === 0 && (
                                    <motion.span 
                                        initial={{ opacity: 0 }} 
                                        animate={{ opacity: 1 }}
                                        className="text-[8px] text-red-500 font-bold uppercase tracking-tighter"
                                    >
                                        Just Now
                                    </motion.span>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {poppedHistory.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-20 gap-2">
                            <Trash2 size={24} />
                            <span className="text-[9px] font-mono">No Items Popped</span>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
});

export default StackViz;
// import React from 'react';
// import { motion, AnimatePresence } from 'framer-motion';

// const ArrayViz = ({ data, pointers }) => {
    
//     // 🧠 SMART KEYS: Generate unique IDs for duplicate values
//     // If we have [10, 10], keys become "10_1" and "10_2"
//     // This allows React to distinguish them so they can swap positions physically
//     const counts = {};
//     const uniqueData = data.map((val) => {
//         counts[val] = (counts[val] || 0) + 1;
//         return { val, id: `${val}_${counts[val]}` };
//     });

//     return (
//         <div className="relative py-8 px-4 border border-gray-800 rounded-xl bg-[#0d1117] overflow-x-auto custom-scrollbar">
            
//             {/* Container */}
//             <div className="flex items-start justify-center min-w-max mx-auto gap-2"> 
//                 <AnimatePresence mode='popLayout'>
//                     {uniqueData.map(({ val, id }, idx) => {
                        
//                         // Find pointers for this CURRENT index
//                         const activePointers = Object.entries(pointers || {})
//                             .filter(([, index]) => index === idx)
//                             .map(([name]) => name);

//                         const isActive = activePointers.length > 0;

//                         return (
//                             <motion.div
//                                 layout // 🚀 MAGIC PROP: Enables physical movement swapping
//                                 key={id} // Track by ID (Content), not Index
//                                 transition={{ 
//                                     type: "spring", 
//                                     stiffness: 400, // Snap quickly
//                                     damping: 25     // Less bounce for sorting clarity
//                                 }}
//                                 className="relative flex flex-col items-center"
//                             >
//                                 {/* 1. THE BOX */}
//                                 <motion.div
//                                     layout
//                                     animate={{ 
//                                         backgroundColor: isActive ? '#f59e0b' : '#1f2937',
//                                         borderColor: isActive ? '#fbbf24' : '#374151',
//                                         scale: isActive ? 1.1 : 1,
//                                         y: isActive ? -5 : 0, // Lift active items slightly
//                                         zIndex: isActive ? 50 : 0 // Active items float above others during swap
//                                     }}
//                                     className="w-12 h-12 flex items-center justify-center border-2 rounded-lg shadow-lg relative z-10"
//                                 >
//                                     <span className={`text-sm font-mono font-bold ${isActive ? 'text-black' : 'text-white'}`}>
//                                         {val}
//                                     </span>
//                                 </motion.div>

//                                 {/* 2. INDEX LABEL (Attached to position, not value) */}
//                                 {/* We render this OUTSIDE the motion box so indices don't swap, only boxes do. 
//                                     However, since this wrapper moves, we must rely on the array order. */}
//                                 <div className="mt-2 text-[10px] font-mono text-gray-500">
//                                     {idx}
//                                 </div>

//                                 {/* 3. POINTERS (Arrows) */}
//                                 <AnimatePresence>
//                                     {isActive && (
//                                         <motion.div
//                                             initial={{ opacity: 0, y: -5 }}
//                                             animate={{ opacity: 1, y: 0 }}
//                                             exit={{ opacity: 0, y: -3 }}
//                                             className="absolute top-full mt-1 flex flex-col items-center z-50"
//                                         >
//                                             {/* Arrow */}
//                                             <svg 
//                                                 width="12" height="12" 
//                                                 viewBox="0 0 24 24" 
//                                                 fill="none" 
//                                                 stroke="#f59e0b" 
//                                                 strokeWidth="4" 
//                                                 strokeLinecap="round" 
//                                                 strokeLinejoin="round"
//                                             >
//                                                 <path d="M12 19V5M5 12l7-7 7 7"/>
//                                             </svg>
                                            
//                                             {/* Badge */}
//                                             <div className="bg-amber-500 text-black font-bold text-[9px] px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider mt-0.5">
//                                                 {activePointers.join(', ')}
//                                             </div>
//                                         </motion.div>
//                                     )}
//                                 </AnimatePresence>
//                             </motion.div>
//                         );
//                     })}
//                 </AnimatePresence>
//             </div>
//         </div>
//     );
// };

// export default ArrayViz;
















import React, { useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ArrayViz = memo(({ data, pointers }) => {
    
    // 🧠 OPTIMIZED: Memoize data preparation to prevent re-calc on every frame
    // Handles duplicate values naturally by assigning sequential IDs (e.g., 5_1, 5_2)
    const uniqueData = useMemo(() => {
        if (!Array.isArray(data)) return [];
        
        const counts = new Map();
        return data.map((val) => {
            // Safe key generation for null/undefined/mixed types
            const safeKey = val === null ? 'null' : (val === undefined ? 'undefined' : String(val));
            const count = (counts.get(safeKey) || 0) + 1;
            counts.set(safeKey, count);
            
            return { 
                val, 
                // Stable ID ensures Framer Motion knows which block moved where
                id: `${safeKey}_${count}` 
            };
        });
    }, [data]);

    return (
        <div className="relative py-10 px-6 border border-gray-800 rounded-xl bg-[#0d1117] overflow-x-auto custom-scrollbar flex flex-col items-center">
            
            {/* Array Container */}
            <div className="flex items-end justify-center min-w-max gap-3 pb-2"> 
                <AnimatePresence mode='popLayout'>
                    {uniqueData.map(({ val, id }, idx) => {
                        
                        // 1. POINTER LOOKUP
                        // Find all variables (i, j, left, right) pointing to this index
                        const activePointers = Object.entries(pointers || {})
                            .filter(([, index]) => index === idx)
                            .map(([name]) => name);

                        const isActive = activePointers.length > 0;

                        return (
                            <motion.div
                                layout // 🚀 Enable Magic Motion for Swapping
                                key={id} // Crucial: Track by content ID, not Index
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                                transition={{ 
                                    type: "spring", 
                                    stiffness: 350, 
                                    damping: 25,
                                    mass: 1
                                }}
                                className="relative flex flex-col items-center"
                                style={{ 
                                    zIndex: isActive ? 10 : 0 // Ensure moving items fly ABOVE others
                                }}
                            >
                                {/* --- THE VALUE BOX --- */}
                                <motion.div
                                    layout
                                    animate={{ 
                                        backgroundColor: isActive ? 'rgba(245, 158, 11, 0.15)' : '#161b22',
                                        borderColor: isActive ? '#f59e0b' : '#30363d',
                                        boxShadow: isActive ? '0 0 15px rgba(245, 158, 11, 0.2)' : 'none',
                                        y: isActive ? -8 : 0, // Lift active items visually
                                    }}
                                    className={`
                                        w-14 h-14 flex items-center justify-center 
                                        border-2 rounded-xl relative overflow-hidden backdrop-blur-sm
                                        transition-colors duration-200
                                    `}
                                >
                                    <span className={`
                                        text-lg font-mono font-bold z-10 
                                        ${isActive ? 'text-amber-400' : 'text-gray-300'}
                                    `}>
                                        {val === null ? '∅' : String(val)}
                                    </span>
                                </motion.div>

                                {/* --- INDEX LABEL --- */}
                                {/* Static absolute position relative to the column */}
                                <div className="mt-3 text-[10px] font-mono text-gray-600 font-bold select-none">
                                    {idx}
                                </div>

                                {/* --- POINTER ARROWS --- */}
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
                                        >
                                            {/* Arrow SVG */}
                                            <svg 
                                                width="14" height="14" 
                                                viewBox="0 0 24 24" 
                                                fill="none" 
                                                stroke="#f59e0b" 
                                                strokeWidth="3" 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round"
                                                className="mb-1 drop-shadow-md"
                                            >
                                                <path d="M12 19V5M5 12l7-7 7 7"/>
                                            </svg>
                                            
                                            {/* Pointer Badge (e.g., "i, j") */}
                                            <motion.div 
                                                layoutId={`pointer-${id}`}
                                                className="bg-amber-500 text-[#0d1117] text-[10px] font-bold px-2 py-0.5 rounded shadow-lg border border-amber-400 whitespace-nowrap"
                                            >
                                                {activePointers.join(', ')}
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
});

export default ArrayViz;
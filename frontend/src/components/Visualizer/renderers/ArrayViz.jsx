// import React from 'react';
// import { motion, AnimatePresence } from 'framer-motion';

// const ArrayViz = ({ data, pointers }) => {
//     return (
//         // Reduced padding to save vertical space
//         <div className="relative py-6 px-4 border border-gray-800 rounded-xl bg-[#0d1117] overflow-x-auto custom-scrollbar">
            
//             {/* Array Container: Centered Row of Boxes */}
//             {/* Changed to items-start so pointers align correctly even if heights vary slightly */}
//             <div className="flex items-start justify-center min-w-max mx-auto"> 
//                 <AnimatePresence mode='popLayout'>
//                     {data.map((val, idx) => {
//                         // Find pointers for this index
//                         const activePointers = Object.entries(pointers || {})
//                             .filter(([, index]) => index === idx)
//                             .map(([name]) => name);

//                         const isActive = activePointers.length > 0;

//                         return (
//                             <motion.div
//                                 layout
//                                 transition={{ type: "spring", stiffness: 300, damping: 25 }}
//                                 key={idx} 
//                                 className="relative flex flex-col items-center"
//                             >
//                                 {/* 1. THE BOX (More Compact: 48px instead of 64px) */}
//                                 <motion.div
//                                     layout
//                                     animate={{ 
//                                         backgroundColor: isActive ? '#f59e0b' : '#1f2937',
//                                         borderColor: isActive ? '#fbbf24' : '#374151',
//                                         scale: isActive ? 1.05 : 1,
//                                         zIndex: isActive ? 20 : 10,
//                                     }}
//                                     // CHANGED: w-12 h-12 (was w-16 h-16)
//                                     className="w-12 h-12 flex items-center justify-center border-r last:border-r-0 border-y border-l first:rounded-l-lg last:rounded-r-lg shadow-lg relative"
//                                 >
//                                     {/* CHANGED: text-sm (was text-lg) */}
//                                     <span className={`text-sm font-mono font-bold ${isActive ? 'text-black' : 'text-white'}`}>
//                                         {val}
//                                     </span>
//                                 </motion.div>

//                                 {/* 2. INDEX LABEL (Below Box) */}
//                                 {/* CHANGED: mt-1 text-[10px] (was mt-2 text-xs) */}
//                                 <div className="mt-1 text-[10px] font-mono text-gray-500">
//                                     {idx}
//                                 </div>

//                                 {/* 3. ANIMATED POINTERS (Below Index) */}
//                                 <AnimatePresence>
//                                     {isActive && (
//                                         <motion.div
//                                             initial={{ opacity: 0, y: -5 }}
//                                             animate={{ opacity: 1, y: 0 }}
//                                             exit={{ opacity: 0, y: -3 }}
//                                             // CHANGED: mt-2 (was mt-6)
//                                             className="absolute top-full mt-2 flex flex-col items-center z-30"
//                                         >
//                                             {/* Up Arrow - slightly smaller */}
//                                             <svg 
//                                                 width="10" height="10" 
//                                                 viewBox="0 0 24 24" 
//                                                 fill="none" 
//                                                 stroke="#f59e0b" 
//                                                 strokeWidth="3" 
//                                                 strokeLinecap="round" 
//                                                 strokeLinejoin="round"
//                                                 className="mb-0.5"
//                                             >
//                                                 <path d="M12 19V5M5 12l7-7 7 7"/>
//                                             </svg>
                                            
//                                             {/* Pointer Label Badge - smaller font/padding */}
//                                             <div className="bg-amber-500 text-black font-bold text-[9px] px-1.5 py-0.5 rounded-sm shadow-md uppercase tracking-wider whitespace-nowrap">
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







import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ArrayViz = ({ data, pointers }) => {
    
    // 🧠 SMART KEYS: Generate unique IDs for duplicate values
    // If we have [10, 10], keys become "10_1" and "10_2"
    // This allows React to distinguish them so they can swap positions physically
    const counts = {};
    const uniqueData = data.map((val) => {
        counts[val] = (counts[val] || 0) + 1;
        return { val, id: `${val}_${counts[val]}` };
    });

    return (
        <div className="relative py-8 px-4 border border-gray-800 rounded-xl bg-[#0d1117] overflow-x-auto custom-scrollbar">
            
            {/* Container */}
            <div className="flex items-start justify-center min-w-max mx-auto gap-2"> 
                <AnimatePresence mode='popLayout'>
                    {uniqueData.map(({ val, id }, idx) => {
                        
                        // Find pointers for this CURRENT index
                        const activePointers = Object.entries(pointers || {})
                            .filter(([, index]) => index === idx)
                            .map(([name]) => name);

                        const isActive = activePointers.length > 0;

                        return (
                            <motion.div
                                layout // 🚀 MAGIC PROP: Enables physical movement swapping
                                key={id} // Track by ID (Content), not Index
                                transition={{ 
                                    type: "spring", 
                                    stiffness: 400, // Snap quickly
                                    damping: 25     // Less bounce for sorting clarity
                                }}
                                className="relative flex flex-col items-center"
                            >
                                {/* 1. THE BOX */}
                                <motion.div
                                    layout
                                    animate={{ 
                                        backgroundColor: isActive ? '#f59e0b' : '#1f2937',
                                        borderColor: isActive ? '#fbbf24' : '#374151',
                                        scale: isActive ? 1.1 : 1,
                                        y: isActive ? -5 : 0, // Lift active items slightly
                                        zIndex: isActive ? 50 : 0 // Active items float above others during swap
                                    }}
                                    className="w-12 h-12 flex items-center justify-center border-2 rounded-lg shadow-lg relative z-10"
                                >
                                    <span className={`text-sm font-mono font-bold ${isActive ? 'text-black' : 'text-white'}`}>
                                        {val}
                                    </span>
                                </motion.div>

                                {/* 2. INDEX LABEL (Attached to position, not value) */}
                                {/* We render this OUTSIDE the motion box so indices don't swap, only boxes do. 
                                    However, since this wrapper moves, we must rely on the array order. */}
                                <div className="mt-2 text-[10px] font-mono text-gray-500">
                                    {idx}
                                </div>

                                {/* 3. POINTERS (Arrows) */}
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -3 }}
                                            className="absolute top-full mt-1 flex flex-col items-center z-50"
                                        >
                                            {/* Arrow */}
                                            <svg 
                                                width="12" height="12" 
                                                viewBox="0 0 24 24" 
                                                fill="none" 
                                                stroke="#f59e0b" 
                                                strokeWidth="4" 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round"
                                            >
                                                <path d="M12 19V5M5 12l7-7 7 7"/>
                                            </svg>
                                            
                                            {/* Badge */}
                                            <div className="bg-amber-500 text-black font-bold text-[9px] px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider mt-0.5">
                                                {activePointers.join(', ')}
                                            </div>
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
};

export default ArrayViz;
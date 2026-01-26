import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StackViz = ({ data, pointers }) => {
    
    // 🧠 SMART KEYS: Generate unique IDs for duplicates (same as ArrayViz)
    const counts = {};
    const uniqueData = data.map((val) => {
        counts[val] = (counts[val] || 0) + 1;
        return { val, id: `${val}_${counts[val]}` };
    });

    return (
        <div className="relative p-4 border border-gray-800 rounded-xl bg-[#0d1117] inline-block">
            {/* Container: flex-col-reverse makes the end of array appear at the top */}
            <div className="flex flex-col-reverse items-center gap-1 min-w-[100px]"> 
                <AnimatePresence mode='popLayout'>
                    {uniqueData.map(({ val, id }, idx) => {
                        
                        // Find pointers for this index (e.g., "top")
                        const activePointers = Object.entries(pointers || {})
                            .filter(([, index]) => index === idx)
                            .map(([name]) => name);

                        // Is this the absolute top element of the stack?
                        const isTop = idx === data.length - 1;
                        const isActive = activePointers.length > 0 || isTop;

                        return (
                            <motion.div
                                layout
                                key={id}
                                // Animation: Drop in from above (push), fly out up (pop)
                                initial={{ opacity: 0, y: -50, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -50, scale: 0.8 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                className="relative w-full flex justify-center"
                            >
                                {/* THE STACK BOX */}
                                <motion.div
                                    layout
                                    animate={{ 
                                        backgroundColor: isActive ? '#f59e0b' : '#1f2937',
                                        borderColor: isActive ? '#fbbf24' : '#374151',
                                    }}
                                    className="w-full h-12 flex items-center justify-center border-2 rounded-lg shadow-md relative z-10"
                                >
                                    <span className={`text-sm font-mono font-bold ${isActive ? 'text-black' : 'text-white'}`}>
                                        {val}
                                    </span>
                                </motion.div>

                                {/* INDEX LABEL (Left side) */}
                                <div className="absolute -left-6 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-500">
                                    [{idx}]
                                </div>

                                {/* POINTERS (Right side arrows) */}
                                <AnimatePresence>
                                    {activePointers.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -5 }}
                                            className="absolute -right-2 top-1/2 -translate-y-1/2 flex items-center z-20 translate-x-full"
                                        >
                                            {/* Left Arrow */}
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M19 12H5M12 19l-7-7 7-7"/>
                                            </svg>
                                            
                                            {/* Badge */}
                                            <div className="bg-amber-500 text-black font-bold text-[9px] px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider ml-1 whitespace-nowrap">
                                                {activePointers.join(', ')}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                
                {/* Visual Base of the Stack */}
                {data.length === 0 && (
                    <div className="text-gray-600 text-xs font-mono py-2">Empty Stack</div>
                )}
                <div className="w-full h-1 bg-gray-700 rounded-full mt-1 opacity-50"></div>
            </div>
        </div>
    );
};

export default StackViz;
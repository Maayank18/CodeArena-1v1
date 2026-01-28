import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const QueueViz = ({ data, pointers }) => {
    
    // Smart Keys for duplicates (same as Stack/Array)
    const counts = {};
    const uniqueData = data.map((val) => {
        counts[val] = (counts[val] || 0) + 1;
        return { val, id: `${val}_${counts[val]}` };
    });

    return (
        <div className="relative p-6 bg-[#0d1117] inline-block">
            
            {/* Queue Label */}
            <div className="absolute top-0 left-0 w-full flex justify-between px-2">
                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Front</span>
                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Rear</span>
            </div>

            {/* The "Pipe" Container */}
            <div className="flex items-center gap-2 border-y-2 border-gray-700/50 py-4 px-8 min-h-[80px] min-w-[200px] relative">
                
                <AnimatePresence mode='popLayout'>
                    {uniqueData.map(({ val, id }, idx) => {
                        
                        // Find pointers for this index
                        const activePointers = Object.entries(pointers || {})
                            .filter(([, index]) => index === idx)
                            .map(([name]) => name);

                        const isActive = activePointers.length > 0;

                        return (
                            <motion.div
                                layout
                                key={id}
                                // FIFO Animation: Enter Right, Exit Left
                                initial={{ opacity: 0, x: 50, scale: 0.8 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: -50, scale: 0.8 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                className="relative"
                            >
                                {/* THE QUEUE BOX */}
                                <motion.div
                                    layout
                                    animate={{ 
                                        backgroundColor: isActive ? '#f59e0b' : '#1f2937',
                                        borderColor: isActive ? '#fbbf24' : '#374151',
                                    }}
                                    className="w-12 h-12 flex items-center justify-center border-2 rounded-lg shadow-lg relative z-10"
                                >
                                    <span className={`text-sm font-mono font-bold ${isActive ? 'text-black' : 'text-white'}`}>
                                        {val}
                                    </span>
                                </motion.div>

                                {/* INDEX (Below) */}
                                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-gray-600">
                                    {idx}
                                </div>

                                {/* POINTERS (Top) */}
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -3 }}
                                            className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 flex flex-col items-center z-20"
                                        >
                                            <div className="bg-amber-500 text-black font-bold text-[9px] px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider mb-0.5 whitespace-nowrap">
                                                {activePointers.join(', ')}
                                            </div>
                                            {/* Down Arrow */}
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 5v14M5 12l7 7 7-7"/>
                                            </svg>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* Empty State Ghost */}
                {data.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-700 text-xs font-mono select-none">
                        Empty Queue
                    </div>
                )}
            </div>
        </div>
    );
};

export default QueueViz;
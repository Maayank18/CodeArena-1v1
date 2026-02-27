import React, { useMemo, useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trash2, History, AlertTriangle } from 'lucide-react';

const StackViz = memo(({ data, pointers, capacity = null, isFull = false }) => {
    
    // 1. STABLE DATA GENERATION
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
    const [poppedHistory, setPoppedHistory] = useState([]);
    const prevDataRef = useRef(uniqueData);

    useEffect(() => {
        const prev = prevDataRef.current;
        const curr = uniqueData;

        // Detect POP operation
        if (prev.length > curr.length) {
            const diff = prev.slice(curr.length);
            const newHistoryItems = diff.map(item => ({
                ...item,
                uniqueKey: `${item.id}_${Date.now()}`
            }));
            setPoppedHistory(history => [...newHistoryItems, ...history].slice(0, 5));
        }
        
        // Reset on new run
        if (prev.length === 0 && curr.length > 0) {
            setPoppedHistory([]);
        }

        prevDataRef.current = curr;
    }, [uniqueData]);

    // 3. OVERFLOW DETECTION
    const isOverflow = capacity && uniqueData.length > capacity;

    return (
        <div className="flex items-end gap-6 p-6">
            
            {/* --- MAIN STACK --- */}
            <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-500 font-mono text-[10px] uppercase tracking-widest font-bold">
                        Stack Memory
                    </span>
                    {capacity && (
                        <span className="text-[9px] font-mono text-gray-600">
                            {uniqueData.length}/{capacity}
                        </span>
                    )}
                </div>
                
                {/* Overflow Warning */}
                <AnimatePresence>
                    {isOverflow && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mb-2 px-2 py-1 bg-red-900/20 border border-red-500/40 rounded flex items-center gap-1.5"
                        >
                            <AlertTriangle size={12} className="text-red-400" />
                            <span className="text-[9px] font-bold text-red-400 uppercase">Stack Overflow!</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* U-Shaped Container */}
                <div className="
                    relative flex flex-col-reverse items-center justify-start gap-1 
                    min-w-[140px] p-2 pb-0
                    border-l-4 border-r-4 border-b-4 border-gray-700/50 rounded-b-xl
                    bg-[#0d1117] shadow-2xl
                " style={{ minHeight: capacity ? `${Math.max(200, capacity * 45)}px` : '200px' }}>
                    
                    {/* Capacity Line Indicator */}
                    {capacity && uniqueData.length > 0 && (
                        <div 
                            className="absolute left-0 right-0 border-t-2 border-dashed border-yellow-600/30 z-0"
                            style={{ bottom: `${capacity * 44}px` }}
                        >
                            <span className="absolute -left-10 -top-2 text-[8px] font-mono text-yellow-600/50">
                                capacity
                            </span>
                        </div>
                    )}

                    <AnimatePresence mode='popLayout'>
                        {uniqueData.map(({ val, id }, idx) => {
                            
                            const activePointers = Object.entries(pointers || {})
                                .filter(([, index]) => index === idx)
                                .map(([name]) => name);

                            const isTop = idx === uniqueData.length - 1;
                            const isActive = activePointers.length > 0 || isTop;
                            const isOverCapacity = capacity && idx >= capacity;

                            return (
                                <motion.div
                                    layout
                                    key={id}
                                    initial={{ opacity: 0, y: -100, scale: 0.8 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -100, scale: 0.5 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    className="relative w-full flex justify-center z-10"
                                >
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
                                            boxShadow: isActive ? '0 0 15px rgba(245, 158, 11, 0.2)' : 'none',
                                        }}
                                        className="w-24 h-10 flex items-center justify-center border-2 rounded-md relative backdrop-blur-sm"
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

                                    {/* INDEX */}
                                    <div className="absolute -left-8 top-1/2 -translate-y-1/2 text-[9px] font-mono text-gray-600">
                                        {idx}
                                    </div>

                                    {/* POINTERS */}
                                    <AnimatePresence>
                                        {activePointers.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 10 }}
                                                className="absolute -right-2 translate-x-full top-1/2 -translate-y-1/2 flex items-center gap-1"
                                            >
                                                <ArrowLeft size={14} className="text-amber-500" />
                                                <div className="bg-amber-500 text-black text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                                                    {activePointers.join(', ')}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* Empty State */}
                    {uniqueData.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-700 text-xs font-mono">
                            Stack is Empty
                        </div>
                    )}
                </div>
            </div>

            {/* --- POPPED HISTORY --- */}
            <div className="h-auto min-h-[200px] w-px bg-gray-800 mx-2" />

            <div className="flex flex-col items-center min-h-[200px]">
                <div className="flex items-center gap-2 text-gray-500 font-mono text-[10px] uppercase tracking-widest mb-2 font-bold opacity-70">
                    <History size={12} />
                    <span>Popped</span>
                </div>

                <div className="
                    flex flex-col gap-2 p-3 min-w-[100px] min-h-[160px]
                    bg-[#0d1117]/50 rounded-xl border border-dashed border-gray-800
                    overflow-hidden
                ">
                    <AnimatePresence mode='popLayout'>
                        {poppedHistory.map((item, index) => (
                            <motion.div
                                key={item.uniqueKey}
                                layout
                                initial={{ opacity: 0, x: -20, scale: 0.8 }}
                                animate={{ opacity: 1 - index * 0.15, x: 0, scale: 1 - index * 0.05 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                                className="flex items-center gap-2"
                            >
                                <div className="w-20 h-8 flex items-center justify-center border border-red-900/50 bg-red-900/10 rounded text-red-400 font-mono text-xs font-bold">
                                    {item.val}
                                </div>
                                {index === 0 && (
                                    <span className="text-[8px] text-red-500 font-bold uppercase">
                                        Latest
                                    </span>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {poppedHistory.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-20 gap-2">
                            <Trash2 size={20} />
                            <span className="text-[9px] font-mono">None</span>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
});

export default StackViz;









































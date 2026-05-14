import React, { useMemo, useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trash2, History, AlertTriangle } from 'lucide-react';
import { useThemeColors } from './useThemeColors';

const StackViz = memo(({ data, pointers, capacity = null, isFull = false }) => {
    const colors = useThemeColors();
    const isLight = colors.bgPrimary === '#fafaf9';

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

    const [poppedHistory, setPoppedHistory] = useState([]);
    const prevDataRef = useRef(uniqueData);

    useEffect(() => {
        const prev = prevDataRef.current;
        const curr = uniqueData;

        if (prev.length > curr.length) {
            const diff = prev.slice(curr.length);
            const newHistoryItems = diff.map((item) => ({
                ...item,
                uniqueKey: `${item.id}_${Date.now()}`,
            }));
            setPoppedHistory((history) => [...newHistoryItems, ...history].slice(0, 5));
        }

        if (prev.length === 0 && curr.length > 0) {
            setPoppedHistory([]);
        }

        prevDataRef.current = curr;
    }, [uniqueData]);

    const isOverflow = capacity && uniqueData.length > capacity;

    return (
        <div className="flex items-end gap-6 p-6">
            <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest font-bold" style={{ color: colors.textMuted }}>
                        Stack Memory
                    </span>
                    {capacity && (
                        <span className="text-[9px] font-mono" style={{ color: colors.textFaint }}>
                            {uniqueData.length}/{capacity}
                        </span>
                    )}
                </div>

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

                <div
                    className="relative flex flex-col-reverse items-center justify-start gap-1 min-w-[140px] p-2 pb-0 border-l-4 border-r-4 border-b-4 rounded-b-xl shadow-2xl"
                    style={{
                        minHeight: capacity ? `${Math.max(200, capacity * 45)}px` : '200px',
                        borderColor: isLight ? '#cbd5e1' : 'rgba(55, 65, 81, 0.5)',
                        background: `linear-gradient(180deg, ${colors.bgSecondary} 0%, ${colors.bgPrimary} 100%)`,
                        boxShadow: isLight
                            ? '0 20px 46px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255,255,255,0.85)'
                            : '0 18px 40px rgba(0,0,0,0.28)',
                    }}
                >
                    {capacity && uniqueData.length > 0 && (
                        <div
                            className="absolute left-0 right-0 border-t-2 border-dashed border-yellow-600/30 z-0"
                            style={{ bottom: `${capacity * 44}px` }}
                        >
                            <span className="absolute -left-10 -top-2 text-[8px] font-mono text-yellow-600/70">capacity</span>
                        </div>
                    )}

                    <AnimatePresence mode="popLayout">
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
                                    key={`cell-${idx}`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    transition={{ 
                                        type: 'spring', 
                                        stiffness: 400, 
                                        damping: 30,
                                        mass: 0.8
                                    }}
                                    className="relative w-full flex justify-center z-10"
                                >
                                    <motion.div
                                        layout
                                        animate={{
                                            backgroundColor: isOverCapacity ? 'rgba(239, 68, 68, 0.15)' : isActive ? colors.activeCell : colors.bgCard,
                                            borderColor: isOverCapacity ? '#ef4444' : isActive ? colors.activeBorder : colors.borderStrong,
                                            boxShadow: isActive
                                                ? (isLight
                                                    ? '0 14px 30px rgba(245, 158, 11, 0.16), 0 0 0 4px rgba(245, 158, 11, 0.08)'
                                                    : '0 0 15px rgba(245, 158, 11, 0.2)')
                                                : (isLight ? '0 10px 24px rgba(15, 23, 42, 0.08)' : 'none'),
                                        }}
                                        className="flex items-center justify-center border-2 rounded-md relative backdrop-blur-sm" style={{ width: "var(--vz-stack-width)", height: "var(--vz-cell-size)" }}
                                    >
                                        <span
                                            className="font-mono font-bold" 
                                            style={{ 
                                                fontSize: "var(--vz-cell-font)",
                                                color: isOverCapacity ? '#f87171' : isActive ? colors.activeText : colors.textPrimary 
                                            }}
                                        >
                                            {val}
                                        </span>

                                        {isOverCapacity && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2" style={{ borderColor: colors.bgPrimary }} />
                                        )}
                                    </motion.div>

                                    <div className="absolute -left-8 top-1/2 -translate-y-1/2 text-[9px] font-mono" style={{ color: colors.textFaint }}>
                                        {idx}
                                    </div>

                                    <AnimatePresence>
                                        {activePointers.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 10 }}
                                                className="absolute -right-2 translate-x-full top-1/2 -translate-y-1/2 flex items-center gap-1"
                                            >
                                                <ArrowLeft size={14} className="text-amber-500" />
                                                <div className="bg-amber-500 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase" style={{ color: colors.bgPrimary }}>
                                                    {activePointers.join(', ')}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {uniqueData.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-mono" style={{ color: colors.textMuted }}>
                            Stack is Empty
                        </div>
                    )}
                </div>
            </div>

            <div className="h-auto min-h-[200px] w-px mx-2" style={{ background: colors.border }} />

            <div className="flex flex-col items-center min-h-[200px]">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest mb-2 font-bold opacity-80" style={{ color: colors.textMuted }}>
                    <History size={12} />
                    <span>Popped</span>
                </div>

                <div
                    className="flex flex-col gap-2 p-3 min-w-[100px] min-h-[160px] rounded-xl border border-dashed overflow-hidden"
                    style={{
                        background: isLight ? 'rgba(255,255,255,0.78)' : 'rgba(13,17,23,0.5)',
                        borderColor: colors.border,
                    }}
                >
                    <AnimatePresence mode="popLayout">
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
                                    <span className="text-[8px] text-red-500 font-bold uppercase">Latest</span>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {poppedHistory.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-20 gap-2">
                            <Trash2 size={20} />
                            <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>None</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default StackViz;

import React, { useMemo, useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, History, AlertTriangle, Trash2 } from 'lucide-react';
import { useThemeColors } from './useThemeColors';

const QueueViz = memo(({ data, pointers, capacity = null, front = null, rear = null }) => {
    const colors = useThemeColors();
    const isLight = colors.bgPrimary === '#fafaf9';

    const uniqueData = useMemo(() => {
        if (!Array.isArray(data)) return [];

        const counts = new Map();
        return data.map((val) => {
            const safeKey = val === null ? 'null' : String(val);
            const count = (counts.get(safeKey) || 0) + 1;
            counts.set(safeKey, count);

            return {
                val,
                id: `${safeKey}_${count}`,
            };
        });
    }, [data]);

    const [dequeuedHistory, setDequeuedHistory] = useState([]);
    const prevDataRef = useRef(uniqueData);

    useEffect(() => {
        const prev = prevDataRef.current;
        const curr = uniqueData;

        if (prev.length > curr.length) {
            const removed = prev.slice(0, prev.length - curr.length);
            const newHistoryItems = removed.map((item) => ({
                ...item,
                uniqueKey: `${item.id}_${Date.now()}_${Math.random()}`,
            }));
            setDequeuedHistory((history) => [...newHistoryItems, ...history].slice(0, 5));
        }

        if (prev.length === 0 && curr.length > 0) {
            setDequeuedHistory([]);
        }

        prevDataRef.current = curr;
    }, [uniqueData]);

    const isFull = capacity && uniqueData.length >= capacity;
    const isOverflow = capacity && uniqueData.length > capacity;
    const actualFront = front !== null ? front : 0;
    const actualRear = rear !== null ? rear : uniqueData.length - 1;

    return (
        <div className="flex items-center gap-6 p-6">
            <div className="flex flex-col items-center">
                <div className="flex flex-col items-center gap-1 mb-3">
                    {capacity && (
                        <span className="text-[9px] font-mono" style={{ color: colors.textFaint }}>
                            {uniqueData.length}/{capacity}
                        </span>
                    )}

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

                <div
                    className="relative flex items-center gap-2 py-6 px-6 min-h-[100px] min-w-[280px] border-y-2 rounded-[24px] overflow-visible"
                    style={{
                        background: isLight
                            ? 'linear-gradient(90deg, rgba(16,185,129,0.05), rgba(255,255,255,0.96), rgba(59,130,246,0.06))'
                            : 'linear-gradient(90deg, rgba(6,95,70,0.10), transparent, rgba(30,64,175,0.10))',
                        borderColor: isLight ? '#cbd5e1' : 'rgba(55, 65, 81, 0.5)',
                        boxShadow: isLight ? '0 16px 36px rgba(15, 23, 42, 0.08)' : 'none',
                    }}
                >
                    {capacity && uniqueData.length > 0 && (
                        <div
                            className="absolute left-0 top-0 bottom-0 border-r-2 border-dashed border-yellow-600/20 z-0 pointer-events-none"
                            style={{ left: `${Math.min((capacity / (uniqueData.length || 1)) * 100, 100)}%` }}
                        />
                    )}

                    <AnimatePresence mode="popLayout">
                        {uniqueData.map(({ val, id }, idx) => {
                            const activePointers = Object.entries(pointers || {})
                                .filter(([, index]) => index === idx)
                                .map(([name]) => name);

                            const isFrontPtr = idx === actualFront;
                            const isRearPtr = idx === actualRear;
                            const isActive = activePointers.length > 0 || isFrontPtr || isRearPtr;
                            const isOverCapacity = capacity && idx >= capacity;

                            let pointerLabel = '';
                            if (isFrontPtr && isRearPtr) pointerLabel = 'F+R';
                            else if (isFrontPtr) pointerLabel = 'FRONT';
                            else if (isRearPtr) pointerLabel = 'REAR';
                            else if (activePointers.length > 0) pointerLabel = activePointers.join(',');

                            return (
                                <motion.div
                                    layout
                                    key={id}
                                    initial={{ opacity: 0, x: 50, scale: 0.5 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: -50, scale: 0.5 }}
                                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                                    className="relative flex flex-col items-center shrink-0"
                                >
                                    <AnimatePresence>
                                        {pointerLabel && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -3 }}
                                                className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-30 whitespace-nowrap"
                                            >
                                                <div className="bg-amber-500 text-[8px] px-1.5 py-0.5 rounded shadow-lg font-bold border border-amber-600 uppercase tracking-wide" style={{ color: colors.bgPrimary }}>
                                                    {pointerLabel}
                                                </div>
                                                <svg width="6" height="3" viewBox="0 0 6 3" fill="#f59e0b" className="mt-[-1px]">
                                                    <path d="M3 3L0 0H6L3 3Z" />
                                                </svg>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <motion.div
                                        layout
                                        animate={{
                                            backgroundColor: isOverCapacity ? 'rgba(239, 68, 68, 0.15)' : isActive ? colors.activeCell : colors.bgCard,
                                            borderColor: isOverCapacity ? '#ef4444' : isActive ? colors.activeBorder : colors.borderStrong,
                                            boxShadow: isActive
                                                ? (isLight
                                                    ? '0 14px 30px rgba(245, 158, 11, 0.16), 0 0 0 4px rgba(245, 158, 11, 0.08)'
                                                    : '0 4px 12px rgba(245, 158, 11, 0.2)')
                                                : (isLight ? '0 10px 24px rgba(15, 23, 42, 0.08)' : 'none'),
                                        }}
                                        className="flex items-center justify-center border-2 rounded-xl relative backdrop-blur-sm" style={{ width: "var(--vz-cell-size)", height: "var(--vz-cell-size)" }}
                                    >
                                        <span
                                            className="font-mono font-bold" style={{ fontSize: "var(--vz-cell-font)" }}
                                            style={{ color: isOverCapacity ? '#f87171' : isActive ? colors.activeText : colors.textPrimary }}
                                        >
                                            {val}
                                        </span>

                                        {isOverCapacity && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2" style={{ borderColor: colors.bgPrimary }} />
                                        )}
                                    </motion.div>

                                    <div className="mt-1.5 text-[9px] font-mono select-none" style={{ color: colors.textFaint }}>
                                        {idx}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {uniqueData.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span
                                className="text-xs font-mono border border-dashed px-4 py-2 rounded-lg"
                                style={{
                                    color: colors.textMuted,
                                    borderColor: colors.border,
                                    background: isLight ? 'rgba(255,255,255,0.82)' : 'rgba(13,17,23,0.5)',
                                }}
                            >
                                Queue is Empty
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="h-auto min-h-[160px] w-px mx-2" style={{ background: colors.border }} />

            <div className="flex flex-col items-center min-h-[160px]">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest mb-2 font-bold opacity-80" style={{ color: colors.textMuted }}>
                    <History size={12} />
                    <span>Dequeued</span>
                </div>

                <div
                    className="flex flex-col gap-2 p-3 min-w-[100px] min-h-[130px] rounded-xl border border-dashed overflow-hidden"
                    style={{
                        background: isLight ? 'rgba(255,255,255,0.78)' : 'rgba(13,17,23,0.5)',
                        borderColor: colors.border,
                    }}
                >
                    <AnimatePresence mode="popLayout">
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
                                    <span className="text-[8px] text-emerald-500 font-bold uppercase">Latest</span>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {dequeuedHistory.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-20 gap-2">
                            <Trash2 size={20} />
                            <span className="text-[9px] font-mono text-center" style={{ color: colors.textMuted }}>None</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default QueueViz;

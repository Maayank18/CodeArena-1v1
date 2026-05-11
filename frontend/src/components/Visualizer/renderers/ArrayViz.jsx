import React, { useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeColors } from './useThemeColors';

const ArrayViz = memo(({ data, pointers }) => {
    const colors = useThemeColors();

    const uniqueData = useMemo(() => {
        if (!Array.isArray(data)) return [];

        const counts = new Map();
        return data.map((val) => {
            const safeKey = val === null ? 'null' : (val === undefined ? 'undefined' : String(val));
            const count = (counts.get(safeKey) || 0) + 1;
            counts.set(safeKey, count);

            return {
                val,
                id: `${safeKey}_${count}`,
            };
        });
    }, [data]);

    const isLight = colors.bgPrimary === '#fafaf9';

    return (
        <div
            className="relative py-10 px-6 overflow-x-auto custom-scrollbar flex flex-col items-center rounded-[28px] border"
            style={{
                borderColor: colors.border,
                background: `linear-gradient(180deg, ${colors.bgSecondary} 0%, ${colors.bgPrimary} 100%)`,
                boxShadow: isLight
                    ? '0 20px 46px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255,255,255,0.85)'
                    : '0 18px 40px rgba(0,0,0,0.28)',
            }}
        >
            <div
                className="absolute inset-x-8 top-4 h-16 rounded-full pointer-events-none"
                style={{
                    background: isLight
                        ? 'radial-gradient(circle, rgba(96,165,250,0.14), transparent 70%)'
                        : 'radial-gradient(circle, rgba(88,166,255,0.12), transparent 70%)',
                    filter: 'blur(12px)',
                }}
            />

            <div className="flex items-end justify-center min-w-max gap-3 pb-2">
                <AnimatePresence mode="popLayout">
                    {uniqueData.map(({ val, id }, idx) => {
                        const activePointers = Object.entries(pointers || {})
                            .filter(([, index]) => index === idx)
                            .map(([name]) => name);

                        const isActive = activePointers.length > 0;

                        return (
                            <motion.div
                                layout
                                key={id}
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 350,
                                    damping: 25,
                                    mass: 1,
                                }}
                                className="relative flex flex-col items-center"
                                style={{ zIndex: isActive ? 10 : 0 }}
                            >
                                <motion.div
                                    layout
                                    animate={{
                                        backgroundColor: isActive ? colors.activeCell : colors.bgCard,
                                        borderColor: isActive ? colors.activeBorder : colors.borderStrong,
                                        boxShadow: isActive
                                            ? (isLight
                                                ? '0 14px 30px rgba(245, 158, 11, 0.16), 0 0 0 4px rgba(245, 158, 11, 0.08)'
                                                : '0 0 15px rgba(245, 158, 11, 0.2)')
                                            : (isLight ? '0 10px 24px rgba(15, 23, 42, 0.08)' : 'none'),
                                        y: isActive ? -8 : 0,
                                    }}
                                    className="w-14 h-14 flex items-center justify-center border-2 rounded-xl relative overflow-hidden backdrop-blur-sm transition-colors duration-200"
                                >
                                    <div
                                        className="absolute inset-x-2 top-1 h-3 rounded-full opacity-50"
                                        style={{
                                            background: isLight
                                                ? 'linear-gradient(180deg, rgba(255,255,255,0.95), transparent)'
                                                : 'linear-gradient(180deg, rgba(255,255,255,0.10), transparent)',
                                        }}
                                    />
                                    <span
                                        className="text-lg font-mono font-bold z-10"
                                        style={{ color: isActive ? colors.activeText : colors.textPrimary }}
                                    >
                                        {val === null ? '∅' : String(val)}
                                    </span>
                                </motion.div>

                                <div
                                    className="mt-3 text-[10px] font-mono font-bold select-none"
                                    style={{ color: colors.textMuted }}
                                >
                                    {idx}
                                </div>

                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
                                        >
                                            <svg
                                                width="14"
                                                height="14"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="#f59e0b"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="mb-1 drop-shadow-md"
                                            >
                                                <path d="M12 19V5M5 12l7-7 7 7" />
                                            </svg>

                                            <motion.div
                                                layoutId={`pointer-${id}`}
                                                className="text-[10px] font-bold px-2 py-0.5 rounded shadow-lg border whitespace-nowrap"
                                                style={{
                                                    background: '#f59e0b',
                                                    color: colors.bgPrimary,
                                                    borderColor: '#fbbf24',
                                                }}
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

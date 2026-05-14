import React, { useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X, ChevronDown } from 'lucide-react';
import { useThemeColors } from './useThemeColors';

const LinkedListViz = memo(({ data, name }) => {
    const colors = useThemeColors();
    const isLight = colors.bgPrimary === '#fafaf9';

    const { nodes, cycleToIndex, terminated } = useMemo(() => {
        const list = [];
        let current = data;
        let count = 0;
        const VISUAL_LIMIT = 20;

        const visitedMap = new Map();
        let cycleTarget = -1;

        while (current && count < VISUAL_LIMIT) {
            const currentId = current.id || `auto-id-${count}`;

            if (current === '[Circular]') {
                cycleTarget = 0;
                break;
            }

            if (visitedMap.has(currentId)) {
                cycleTarget = visitedMap.get(currentId);
                break;
            }

            visitedMap.set(currentId, count);

            const rawVal = current.val ?? current.value ?? current.data;
            const val = rawVal === undefined ? '?' : String(rawVal);

            list.push({
                id: currentId,
                index: count,
                val,
                address: `0x${(4096 + count * 32).toString(16).toUpperCase()}`,
            });

            current = current.next;
            count++;
        }

        return {
            nodes: list,
            cycleToIndex: cycleTarget,
            terminated: !current && cycleTarget === -1,
        };
    }, [data]);

    const NODE_WIDTH = 96;
    const GAP_WIDTH = 32;
    const TOTAL_ITEM_WIDTH = NODE_WIDTH + GAP_WIDTH;

    return (
        <div className="w-full p-4 pt-16 overflow-x-auto custom-scrollbar flex flex-col min-h-[280px] select-none">
            {nodes.length === 0 ? (
                <div
                    className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl opacity-70"
                    style={{
                        borderColor: colors.borderStrong,
                        background: isLight ? 'rgba(255,255,255,0.76)' : 'rgba(13,17,23,0.5)',
                    }}
                >
                    <span
                        className="font-mono text-xs uppercase tracking-widest"
                        style={{ color: colors.textMuted }}
                    >
                        Null / Empty List
                    </span>
                </div>
            ) : (
                <div className="relative flex items-start pl-4" style={{ paddingBottom: '80px' }}>
                    {cycleToIndex !== -1 && nodes.length > 0 && (
                        <CycleArrow
                            startIndex={nodes.length - 1}
                            endIndex={cycleToIndex}
                            itemWidth={TOTAL_ITEM_WIDTH}
                            nodeWidth={NODE_WIDTH}
                        />
                    )}

                    <AnimatePresence mode="popLayout">
                        {nodes.map((node, i) => (
                            <motion.div 
                                layout
                                key={node.id} 
                                className="relative flex items-center" 
                                style={{ marginRight: i === nodes.length - 1 ? 0 : `${GAP_WIDTH}px` }}
                            >
                                {i === 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute -top-14 left-0 right-0 flex flex-col items-center z-20"
                                    >
                                        <div
                                            className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-widest"
                                            style={{
                                                background: isLight ? 'rgba(99,102,241,0.12)' : '#6366f1',
                                                border: `1px solid ${isLight ? 'rgba(99,102,241,0.28)' : '#818cf8'}`,
                                                color: isLight ? '#4338ca' : '#ffffff',
                                                boxShadow: isLight ? '0 10px 24px rgba(99, 102, 241, 0.14)' : '0 0 15px rgba(99,102,241,0.5)',
                                            }}
                                        >
                                            {name || 'HEAD'}
                                        </div>
                                        <div className="h-5 w-0.5" style={{ background: '#818cf8' }} />
                                        <ChevronDown size={16} className="-mt-1.5" style={{ color: '#818cf8' }} />
                                    </motion.div>
                                )}

                                <NodeBlock val={node.val} address={node.address} />

                                {i < nodes.length - 1 && (
                                    <div className="absolute -right-7 top-1/2 -translate-y-1/2 opacity-50" style={{ color: colors.textMuted }}>
                                        <ArrowRight size={20} />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {terminated && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center opacity-70 ml-8"
                        >
                            <div
                                className="w-10 h-10 border-2 border-dashed rounded-lg flex items-center justify-center"
                                style={{
                                    borderColor: 'rgba(239,68,68,0.3)',
                                    background: isLight ? 'rgba(254,226,226,0.8)' : 'rgba(127,29,29,0.1)',
                                    boxShadow: '0 0 10px rgba(239,68,68,0.1)',
                                }}
                            >
                                <X size={16} className="text-red-400" />
                            </div>
                            <span className="mt-1.5 text-[9px] text-red-400 font-mono font-bold tracking-widest">NULL</span>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
});

const NodeBlock = memo(({ val, address }) => {
    const colors = useThemeColors();
    const isLight = colors.bgPrimary === '#fafaf9';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative flex w-24 h-12 rounded-md overflow-hidden shadow-xl transition-transform hover:-translate-y-1"
        >
            <div className="absolute -bottom-5 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[8px] font-mono" style={{ color: colors.textMuted }}>{address}</span>
            </div>

            <div
                className="w-14 flex items-center justify-center relative overflow-hidden border-y border-l"
                style={{
                    background: isLight
                        ? 'linear-gradient(180deg, rgba(224,231,255,0.96), rgba(199,210,254,0.78))'
                        : '#1e1b4b',
                    borderColor: '#6366f1',
                }}
            >
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/20" />
                <span
                    className="font-mono text-sm font-bold truncate px-1"
                    style={{
                        color: isLight ? '#3730a3' : '#a5b4fc',
                        filter: isLight ? 'none' : 'drop-shadow(0 0 8px rgba(165,180,252,0.5))',
                    }}
                    title={val}
                >
                    {val}
                </span>
            </div>

            <div
                className="flex-1 border flex items-center justify-center relative"
                style={{
                    background: isLight
                        ? 'linear-gradient(180deg, rgba(220,252,231,0.96), rgba(167,243,208,0.74))'
                        : '#022c22',
                    borderColor: '#10b981',
                }}
            >
                <span
                    className="font-mono text-[8px] font-bold uppercase tracking-wide z-10"
                    style={{ color: isLight ? '#047857' : '#34d399' }}
                >
                    NEXT
                </span>
            </div>
        </motion.div>
    );
});

const CycleArrow = ({ startIndex, endIndex, itemWidth, nodeWidth }) => {
    const startX = (startIndex * itemWidth) + (nodeWidth / 2);
    const endX = (endIndex * itemWidth) + (nodeWidth / 2);
    const leftX = Math.min(startX, endX);
    const width = Math.abs(startX - endX);
    const height = 45;
    const safeWidth = width || 40;
    const isSelfLoop = width === 0;

    return (
        <div
            className="absolute top-full left-0 pointer-events-none z-0"
            style={{
                left: `${leftX}px`,
                width: `${safeWidth}px`,
                height: `${height}px`,
                marginTop: '2px',
            }}
        >
            <svg width="100%" height="100%" overflow="visible">
                <defs>
                    <marker id="arrowhead-cycle" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#fbbf24" />
                    </marker>
                </defs>

                {isSelfLoop ? (
                    <path
                        d={`M ${safeWidth / 2} 0 Q ${safeWidth} ${height}, ${safeWidth / 2} 0`}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead-cycle)"
                    />
                ) : (
                    <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: 'easeInOut' }}
                        d={`
                            M ${safeWidth} 0
                            v 10
                            Q ${safeWidth} ${height} ${safeWidth / 2} ${height}
                            T 0 10
                            v -4
                        `}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead-cycle)"
                        strokeDasharray="4 2"
                        strokeOpacity="0.8"
                    />
                )}

                <text
                    x="50%"
                    y={height + 12}
                    fill="#fbbf24"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="monospace"
                    letterSpacing="1px"
                >
                    CYCLE DETECTED
                </text>
            </svg>
        </div>
    );
};

export default LinkedListViz;

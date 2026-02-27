import React, { useMemo, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X, ChevronDown } from 'lucide-react';

const LinkedListViz = memo(({ data, name }) => {
    
    //  MEMOIZED PARSING ENGINE
    const { nodes, cycleToIndex, terminated } = useMemo(() => {
        const list = [];
        let current = data;
        let count = 0;
        const VISUAL_LIMIT = 20; 
        
        const visitedMap = new Map();
        let cycleTarget = -1;

        while (current && count < VISUAL_LIMIT) {
            const currentId = current.id || `auto-id-${count}`;
            
            // 1. Cycle Detection
            if (current === '[Circular]') {
                cycleTarget = 0; 
                break;
            }
            
            if (visitedMap.has(currentId)) {
                cycleTarget = visitedMap.get(currentId);
                break;
            }

            visitedMap.set(currentId, count);

            // 2. Data Extraction
            const rawVal = current.val ?? current.value ?? current.data;
            const val = rawVal === undefined ? '?' : String(rawVal);

            list.push({
                id: currentId,
                index: count,
                val: val,
                address: `0x${(4096 + count * 32).toString(16).toUpperCase()}`
            });

            current = current.next;
            count++;
        }

        return { 
            nodes: list, 
            cycleToIndex: cycleTarget, 
            terminated: !current && cycleTarget === -1 
        };
    }, [data]);

    // 📏 PRECISE LAYOUT CONSTANTS (Must match CSS)
    // Node: w-24 (96px)
    // Gap: mr-8 (32px)
    const NODE_WIDTH = 96; 
    const GAP_WIDTH = 32;   
    const TOTAL_ITEM_WIDTH = NODE_WIDTH + GAP_WIDTH;

    return (
        <div className="w-full p-4 pt-16 overflow-x-auto custom-scrollbar flex flex-col min-h-[280px] select-none">
            
            {nodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-800 rounded-xl bg-[#0d1117]/50 opacity-60">
                    <span className="font-mono text-xs text-gray-500 uppercase tracking-widest">Null / Empty List</span>
                </div>
            ) : (
                <div className="relative flex items-start pl-4" style={{ paddingBottom: '80px' }}>
                    
                    {/* --- SMART CYCLE ARROW (The "Strap") --- */}
                    {cycleToIndex !== -1 && nodes.length > 0 && (
                        <CycleArrow 
                            startIndex={nodes.length - 1} 
                            endIndex={cycleToIndex} 
                            itemWidth={TOTAL_ITEM_WIDTH}
                            nodeWidth={NODE_WIDTH}
                        />
                    )}

                    <AnimatePresence mode='popLayout'>
                        {nodes.map((node, i) => (
                            <div key={node.id} className="relative flex items-center" style={{ marginRight: i === nodes.length - 1 ? 0 : `${GAP_WIDTH}px` }}>
                                
                                {/* 1. HEAD POINTER (Floating Top) */}
                                {i === 0 && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute -top-14 left-0 right-0 flex flex-col items-center z-20"
                                    >
                                        <div className="bg-[#6366f1] border border-[#818cf8] text-white px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-widest shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                                            {name || 'HEAD'}
                                        </div>
                                        <div className="h-5 w-0.5 bg-[#818cf8]"></div>
                                        <ChevronDown size={16} className="text-[#818cf8] -mt-1.5" />
                                    </motion.div>
                                )}

                                {/* 2. THE NODE BLOCK */}
                                <NodeBlock val={node.val} address={node.address} />

                                {/* 3. LINEAR ARROW (Between Nodes) */}
                                {/* Only show if not last node OR (last node AND terminated is true) */}
                                {(i < nodes.length - 1) && (
                                    <div className="absolute -right-7 top-1/2 -translate-y-1/2 text-gray-600 opacity-50">
                                        <ArrowRight size={20} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </AnimatePresence>

                    {/* 4. NULL TERMINATION */}
                    {terminated && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }} 
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center opacity-60 ml-8"
                        >
                            <div className="w-10 h-10 border-2 border-dashed border-red-500/30 bg-red-900/10 rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.1)]">
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

// --- SUB-COMPONENT: COMPACT NODE (96px Width) ---
const NodeBlock = memo(({ val, address }) => (
    <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="group relative flex w-24 h-12 rounded-md overflow-hidden shadow-xl transition-transform hover:-translate-y-1"
    >
        {/* Memory Address Tooltip */}
        <div className="absolute -bottom-5 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[8px] font-mono text-gray-500">{address}</span>
        </div>

        {/* LEFT: DATA (Purple/Blue) */}
        <div className="w-14 bg-[#1e1b4b] border-y border-l border-[#6366f1] flex items-center justify-center relative overflow-hidden">
            {/* Top Shine */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/20"></div>
            <span className="font-mono text-sm font-bold text-[#a5b4fc] drop-shadow-[0_0_8px_rgba(165,180,252,0.5)] truncate px-1" title={val}>
                {val}
            </span>
        </div>

        {/* RIGHT: NEXT (Emerald Green) */}
        <div className="flex-1 bg-[#022c22] border border-[#10b981] flex items-center justify-center relative">
            <span className="font-mono text-[8px] font-bold text-[#34d399] uppercase tracking-wide z-10">
                NEXT
            </span>
        </div>
    </motion.div>
));

// --- SUB-COMPONENT: PRECISE CYCLE ARROW ---
const CycleArrow = ({ startIndex, endIndex, itemWidth, nodeWidth }) => {
    // 1. Calculate Center Points
    const startX = (startIndex * itemWidth) + (nodeWidth / 2);
    const endX = (endIndex * itemWidth) + (nodeWidth / 2);
    
    // 2. SVG ViewBox Logic
    // We render the SVG starting from the "Target Node" (Left) to "Tail Node" (Right)
    const leftX = Math.min(startX, endX);
    const width = Math.abs(startX - endX);
    const height = 45; // Depth of the loop under nodes

    // If loop is to itself (width 0), handle gracefully
    const safeWidth = width || 40; 
    const isSelfLoop = width === 0;

    return (
        <div 
            className="absolute top-full left-0 pointer-events-none z-0"
            style={{ 
                left: `${leftX}px`, 
                width: `${safeWidth}px`, 
                height: `${height}px`,
                marginTop: '2px' 
            }}
        >
            <svg width="100%" height="100%" overflow="visible">
                <defs>
                    <marker id="arrowhead-cycle" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#fbbf24" />
                    </marker>
                </defs>
                
                {isSelfLoop ? (
                    // Self-loop (small circle)
                    <path 
                        d={`M ${safeWidth/2} 0 Q ${safeWidth} ${height}, ${safeWidth/2} 0`}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead-cycle)"
                    />
                ) : (
                    // Standard Loop Back (Curve)
                    // Starts at Right (Tail), Curves Down, Ends at Left (Target)
                    <motion.path 
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        d={`
                            M ${safeWidth} 0 
                            v 10 
                            Q ${safeWidth} ${height} ${safeWidth/2} ${height} 
                            T 0 10 
                            v -4
                        `}
                        fill="none"
                        stroke="#fbbf24" // Amber-400
                        strokeWidth="2"
                        markerEnd="url(#arrowhead-cycle)"
                        strokeDasharray="4 2"
                        strokeOpacity="0.8"
                    />
                )}
                
                {/* Loop Label */}
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











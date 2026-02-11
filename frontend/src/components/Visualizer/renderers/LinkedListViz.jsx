// import React, { useMemo, memo } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { ArrowRight, X, RotateCw, CornerDownRight } from 'lucide-react';

// const LinkedListViz = memo(({ data, name }) => {

//     // 🧠 MEMOIZED PARSING
//     // Flattens the nested structure [val, next: [val, next...]] into a linear array
//     // Only re-calculates when 'data' changes.
//     const { nodes, isCircular, terminated } = useMemo(() => {
//         const list = [];
//         let current = data;
//         let count = 0;
//         const SAFE_LIMIT = 15; // Visual limit to prevent UI overflow
//         let isCycle = false;

//         while (current && count < SAFE_LIMIT) {
//             // 1. Detect Backend Cycle Marker
//             if (current === '[Circular]') {
//                 isCycle = true;
//                 break;
//             }

//             // 2. Extract Value (Support val/value/data props)
//             const rawVal = current.val ?? current.value ?? current.data;
//             const val = rawVal === undefined ? '?' : String(rawVal);

//             list.push({
//                 id: `node-${count}`, // Stable ID for animation
//                 index: count,
//                 val: val,
//             });

//             current = current.next;
//             count++;
//         }

//         return { 
//             nodes: list, 
//             isCircular: isCycle,
//             terminated: !current && !isCycle // True if list ends naturally with null
//         };
//     }, [data]);

//     if (!nodes.length) {
//         return (
//             <div className="flex flex-col items-center justify-center p-8 text-gray-500 opacity-50">
//                 <span className="font-mono text-xs">Empty List / Null</span>
//             </div>
//         );
//     }

//     return (
//         <div className="p-6 overflow-x-auto custom-scrollbar">
            
//             {/* Horizontal Container */}
//             <div className="flex items-center min-w-max pb-4">
                
//                 {/* HEAD POINTER LABEL */}
//                 <div className="flex flex-col items-center mr-4 group">
//                     <span className="text-purple-400 font-bold font-mono text-xs mb-1 bg-purple-900/20 px-2 py-0.5 rounded border border-purple-500/30">
//                         {name || 'head'}
//                     </span>
//                     <ArrowRight className="text-purple-500" size={16} />
//                 </div>

//                 {/* NODES LIST */}
//                 <AnimatePresence mode='popLayout'>
//                     {nodes.map((node, i) => (
//                         <motion.div 
//                             key={node.id}
//                             layout
//                             initial={{ opacity: 0, scale: 0.8, x: -20 }}
//                             animate={{ opacity: 1, scale: 1, x: 0 }}
//                             transition={{ type: "spring", stiffness: 300, damping: 25 }}
//                             className="flex items-center"
//                         >
//                             <NodeBlock val={node.val} index={node.index} />
                            
//                             {/* Connection Arrow */}
//                             <div className="mx-2 text-gray-600 flex items-center justify-center">
//                                 <ArrowRight size={20} strokeWidth={2} />
//                             </div>
//                         </motion.div>
//                     ))}
//                 </AnimatePresence>

//                 {/* TERMINATION: NULL or CYCLE */}
//                 {terminated ? (
//                     <motion.div 
//                         initial={{ opacity: 0 }} 
//                         animate={{ opacity: 1 }}
//                         className="flex flex-col items-center justify-center opacity-60"
//                     >
//                         <div className="w-10 h-10 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center bg-[#0d1117]">
//                             <X size={18} className="text-red-500" />
//                         </div>
//                         <span className="mt-1 text-[10px] text-gray-500 font-mono font-bold">NULL</span>
//                     </motion.div>
//                 ) : isCircular ? (
//                     <motion.div 
//                         initial={{ opacity: 0 }} 
//                         animate={{ opacity: 1 }}
//                         className="flex items-center gap-2"
//                     >
//                         <div className="bg-orange-500/10 border border-orange-500/50 p-2 rounded-lg flex items-center gap-2 text-orange-400">
//                             <RotateCw size={16} className="animate-spin-slow" />
//                             <span className="text-[10px] font-bold font-mono">CYCLE</span>
//                         </div>
//                     </motion.div>
//                 ) : (
//                     // Truncated view
//                     <span className="text-gray-600 text-xl font-bold tracking-widest">...</span>
//                 )}

//             </div>
//         </div>
//     );
// });

// // --- SUB-COMPONENT: VISUAL NODE BLOCK ---
// const NodeBlock = memo(({ val, index }) => (
//     <div className="flex flex-col items-center group relative">
        
//         {/* Memory Address Simulation (Top Label) */}
//         <span className="absolute -top-5 left-0 text-[9px] text-gray-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
//             0x{((index + 10) * 8).toString(16).toUpperCase()}
//         </span>

//         <div className="flex shadow-lg rounded-lg overflow-hidden border border-gray-700/50">
            
//             {/* 1. DATA SEGMENT */}
//             <div className="w-14 h-12 bg-[#1f6feb] flex flex-col items-center justify-center relative border-r border-[#0d4496]">
//                 <span className="text-white font-bold font-mono text-sm z-10 truncate max-w-[3rem]">
//                     {val}
//                 </span>
//                 <span className="absolute bottom-0.5 right-1 text-[8px] text-blue-200 opacity-60 font-mono">val</span>
//             </div>

//             {/* 2. POINTER SEGMENT */}
//             <div className="w-8 h-12 bg-[#238636] flex items-center justify-center relative">
//                 <div className="w-2 h-2 bg-[#d7ffd9] rounded-full shadow-inner" />
//                 <span className="absolute bottom-0.5 right-1 text-[8px] text-green-200 opacity-60 font-mono">next</span>
//             </div>

//         </div>
//     </div>
// ));

// export default LinkedListViz;


















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





























// import React, { useMemo, memo } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { ArrowRight, X, ChevronDown, RefreshCw } from 'lucide-react';

// const LinkedListViz = memo(({ data, name, pointers }) => {
    
//     // 🧠 ROBUST PARSER with Content-Based Cycle Detection
//     const { nodes, cycleInfo, terminated } = useMemo(() => {
//         const list = [];
//         let current = data;
//         let count = 0;
//         const VISUAL_LIMIT = 20;
        
//         const seenSignatures = new Map();
//         let cycleDetected = false;
//         let cycleStart = -1;
//         let cycleEnd = -1;

//         while (current && count < VISUAL_LIMIT && !cycleDetected) {
//             if (current === '[Circular]') {
//                 cycleDetected = true;
//                 cycleStart = count - 1;
//                 cycleEnd = 0;
//                 break;
//             }

//             const val = current.val ?? current.value ?? current.data ?? '?';
//             const hasNext = !!current.next;
//             const signature = `${JSON.stringify(val)}_${hasNext}`;
            
//             if (seenSignatures.has(signature)) {
//                 const prevIndex = seenSignatures.get(signature);
//                 if (count > 3) {
//                     cycleDetected = true;
//                     cycleStart = count;
//                     cycleEnd = prevIndex;
//                     break;
//                 }
//             }
            
//             seenSignatures.set(signature, count);

//             const nodeId = `node_${count}_${val}`;

//             list.push({
//                 id: nodeId,
//                 index: count,
//                 val: String(val),
//                 address: `0x${(2048 + count * 32).toString(16).toUpperCase()}`
//             });

//             current = current.next;
//             count++;
//         }

//         return { 
//             nodes: list, 
//             cycleInfo: cycleDetected ? { start: cycleStart, end: cycleEnd } : null,
//             terminated: !current && !cycleDetected
//         };
//     }, [data]);

//     // 📏 OPTIMIZED LAYOUT (Smaller nodes)
//     const NODE_WIDTH = 84;  // Reduced from 96
//     const NODE_HEIGHT = 40; // Reduced from 48
//     const GAP_WIDTH = 42;   // Reduced from 48
//     const TOTAL_ITEM_WIDTH = NODE_WIDTH + GAP_WIDTH;
//     const totalWidth = Math.max(nodes.length * TOTAL_ITEM_WIDTH + 150, 600);

//     return (
//         <div className="w-full relative pb-6">
//             {/* 📦 SCROLLABLE CONTAINER with proper padding */}
//             <div 
//                 className="overflow-x-auto overflow-y-visible custom-scrollbar pb-4 pt-16 px-2"
//                 style={{ scrollBehavior: 'smooth' }}
//             >
//                 {nodes.length === 0 ? (
//                     <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-800 rounded-xl bg-[#0d1117]/50 opacity-60 min-h-[120px]">
//                         <span className="font-mono text-xs text-gray-500 uppercase tracking-widest">Null / Empty List</span>
//                     </div>
//                 ) : (
//                     <div 
//                         className="relative flex items-start min-h-[100px]"
//                         style={{ 
//                             width: `${totalWidth}px`,
//                             minWidth: 'max-content',
//                             paddingLeft: '16px',   // ✅ Extra padding to show first node
//                             paddingRight: '64px'   // ✅ Extra padding for NULL
//                         }}
//                     >
                        
//                         {/* --- NODES --- */}
//                         <AnimatePresence mode='sync'>
//                             {nodes.map((node, i) => {
                                
//                                 const activePointers = Object.entries(pointers || {})
//                                     .filter(([, idx]) => idx === node.index)
//                                     .map(([ptrName]) => ptrName);

//                                 if (i === 0 && (!pointers || Object.keys(pointers).length === 0)) {
//                                     activePointers.push(name || 'head');
//                                 }

//                                 const isCycleEnd = cycleInfo && i === cycleInfo.end;

//                                 return (
//                                     <motion.div 
//                                         key={node.id}
//                                         layout
//                                         initial={{ opacity: 0, scale: 0.9, y: -10 }}
//                                         animate={{ opacity: 1, scale: 1, y: 0 }}
//                                         exit={{ opacity: 0, scale: 0.8, x: -30 }}
//                                         transition={{ 
//                                             layout: { duration: 0.3, type: "spring", stiffness: 400, damping: 35 },
//                                             opacity: { duration: 0.25 },
//                                             scale: { duration: 0.25 }
//                                         }}
//                                         className="relative flex items-center shrink-0"
//                                         style={{ 
//                                             marginRight: i === nodes.length - 1 ? 0 : `${GAP_WIDTH}px`,
//                                             zIndex: activePointers.length > 0 ? 30 : 10
//                                         }}
//                                     >
                                        
//                                         {/* 1. POINTER LABELS */}
//                                         <AnimatePresence mode='wait'>
//                                             {activePointers.length > 0 && (
//                                                 <motion.div 
//                                                     initial={{ opacity: 0, y: -8 }}
//                                                     animate={{ opacity: 1, y: 0 }}
//                                                     exit={{ opacity: 0, y: -5 }}
//                                                     className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center z-40 gap-0.5"
//                                                 >
//                                                     {activePointers.map((ptr, idx) => (
//                                                         <motion.div 
//                                                             key={ptr}
//                                                             initial={{ opacity: 0, scale: 0.85 }}
//                                                             animate={{ opacity: 1, scale: 1 }}
//                                                             transition={{ delay: idx * 0.04 }}
//                                                             className="bg-indigo-600 border border-indigo-400 text-white px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase tracking-widest shadow-lg shadow-indigo-500/50 whitespace-nowrap"
//                                                         >
//                                                             {ptr}
//                                                         </motion.div>
//                                                     ))}
//                                                     <div className="flex flex-col items-center mt-0.5">
//                                                         <div className="h-2 w-0.5 bg-indigo-400"></div>
//                                                         <ChevronDown size={11} className="text-indigo-400 -mt-0.5" />
//                                                     </div>
//                                                 </motion.div>
//                                             )}
//                                         </AnimatePresence>

//                                         {/* 2. CYCLE BADGE (Compact) */}
//                                         {isCycleEnd && (
//                                             <motion.div
//                                                 initial={{ opacity: 0, scale: 0 }}
//                                                 animate={{ opacity: 1, scale: 1 }}
//                                                 className="absolute -top-6 -right-1 z-50"
//                                             >
//                                                 <div className="bg-yellow-500 text-black px-1.5 py-0.5 rounded text-[8px] font-black flex items-center gap-1 shadow-lg border border-yellow-600">
//                                                     <RefreshCw size={9} />
//                                                     <span>CYCLE</span>
//                                                 </div>
//                                             </motion.div>
//                                         )}

//                                         {/* 3. NODE BLOCK (Smaller) */}
//                                         <NodeBlock 
//                                             val={node.val} 
//                                             address={node.address}
//                                             isActive={activePointers.length > 0}
//                                             isCyclePoint={isCycleEnd}
//                                             width={NODE_WIDTH}
//                                             height={NODE_HEIGHT}
//                                         />

//                                         {/* 4. CONNECTION ARROW */}
//                                         {i < nodes.length - 1 && (
//                                             <motion.div 
//                                                 layout
//                                                 className="absolute top-1/2 -translate-y-1/2 text-gray-500 flex items-center justify-center"
//                                                 style={{ 
//                                                     right: `-${GAP_WIDTH - 10}px`,
//                                                     width: `${GAP_WIDTH - 20}px`
//                                                 }}
//                                             >
//                                                 <ArrowRight size={16} strokeWidth={2.5} />
//                                             </motion.div>
//                                         )}
//                                     </motion.div>
//                                 );
//                             })}
//                         </AnimatePresence>

//                         {/* 5. NULL TERMINATION */}
//                         {terminated && (
//                             <motion.div 
//                                 layout
//                                 initial={{ opacity: 0, scale: 0.8 }} 
//                                 animate={{ opacity: 1, scale: 1 }}
//                                 transition={{ layout: { duration: 0.3 } }}
//                                 className="flex flex-col items-center justify-center opacity-70 ml-6 shrink-0"
//                             >
//                                 <div className="w-10 h-10 border-2 border-dashed border-red-500/50 bg-red-900/10 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.2)]">
//                                     <X size={18} className="text-red-400" strokeWidth={3} />
//                                 </div>
//                                 <span className="mt-1 text-[9px] text-red-400 font-mono font-bold tracking-widest">NULL</span>
//                             </motion.div>
//                         )}
//                     </div>
//                 )}
//             </div>

//             {/* 📊 CYCLE INDICATOR (Text only, no arrow) */}
//             {cycleInfo && (
//                 <motion.div
//                     initial={{ opacity: 0, y: 8 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     className="mt-2 flex justify-center"
//                 >
//                     <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/40 rounded-lg">
//                         <RefreshCw size={12} className="text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
//                         <span className="text-[10px] font-mono font-bold text-yellow-400 uppercase tracking-wider">
//                             Circular: Node {cycleInfo.end} ← Node {cycleInfo.start}
//                         </span>
//                     </div>
//                 </motion.div>
//             )}
//         </div>
//     );
// });

// // --- OPTIMIZED NODE BLOCK (with dynamic sizing) ---
// const NodeBlock = memo(({ val, address, isActive, isCyclePoint, width, height }) => {
//     return (
//         <motion.div 
//             layout
//             animate={{
//                 scale: isActive ? 1.05 : 1,
//                 boxShadow: isActive 
//                     ? '0 0 20px rgba(99, 102, 241, 0.5)' 
//                     : isCyclePoint
//                         ? '0 0 18px rgba(234, 179, 8, 0.4)'
//                         : '0 4px 12px rgba(0, 0, 0, 0.4)'
//             }}
//             transition={{ duration: 0.25 }}
//             className="group relative flex rounded-md overflow-hidden hover:-translate-y-1 transition-transform z-10 border-2"
//             style={{
//                 width: `${width}px`,
//                 height: `${height}px`,
//                 borderColor: isCyclePoint ? '#eab308' : isActive ? '#6366f1' : '#374151'
//             }}
//         >
//             {/* Memory Address Tooltip */}
//             <div className="absolute -bottom-7 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
//                 <span className="text-[8px] font-mono text-gray-400 bg-black/95 px-2 py-0.5 rounded border border-gray-700 shadow-xl">
//                     {address}
//                 </span>
//             </div>

//             {/* LEFT: DATA (Yellow) */}
//             <div 
//                 className="bg-[#facc15] flex items-center justify-center relative border-r-2 border-yellow-700"
//                 style={{ width: `${width * 0.58}px` }} // ~58% for data section
//             >
//                 <div className="absolute top-0 left-0 right-0 h-px bg-white/50"></div>
//                 <span className="font-mono text-xs font-extrabold text-black truncate px-1 drop-shadow-sm z-10">
//                     {val}
//                 </span>
//             </div>

//             {/* RIGHT: NEXT (Blue) */}
//             <div className="flex-1 bg-[#3b82f6] flex items-center justify-center relative">
//                 <div className="absolute inset-0 bg-blue-300/20 animate-pulse" style={{ animationDuration: '2s' }}></div>
//                 <span className="font-mono text-[7px] font-black text-white uppercase tracking-wider z-10">
//                     NEXT
//                 </span>
//             </div>
//         </motion.div>
//     );
// });

// export default LinkedListViz;
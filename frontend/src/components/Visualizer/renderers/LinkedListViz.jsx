// import React from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { ArrowRight, X } from 'lucide-react';

// const LinkedListViz = ({ data, name }) => {
//     // 1. FLATTEN THE LIST
//     // Turn the nested object { val: 1, next: { val: 2... } } 
//     // into a flat array [ {val:1}, {val:2} ]
//     const nodes = [];
//     let current = data;
//     // Safety limit to prevent infinite loops if circular
//     let limit = 100; 
    
//     while (current && limit > 0) {
//         nodes.push({
//             id: Math.random(), // In a real app, use a stable ID if possible
//             val: current.val ?? current.value ?? current.data,
//             // Track if this specific node is being pointed to by a variable
//             rawNode: current 
//         });
//         current = current.next;
//         limit--;
//     }

//     return (
//         <div className="p-8 overflow-x-auto custom-scrollbar">
//             <div className="flex items-center gap-2 min-w-max">
                
//                 {/* HEAD LABEL */}
//                 <div className="flex flex-col items-center mr-4">
//                     <span className="text-purple-400 font-bold font-mono text-sm mb-2">{name}</span>
//                     <ArrowRight className="text-purple-400 rotate-90" size={20} />
//                 </div>

//                 <AnimatePresence>
//                     {nodes.map((node, index) => (
//                         <motion.div 
//                             key={index}
//                             initial={{ opacity: 0, x: -20 }}
//                             animate={{ opacity: 1, x: 0 }}
//                             transition={{ delay: index * 0.1 }}
//                             className="flex items-center"
//                         >
//                             {/* THE NODE (Split Design: Data | Next) */}
//                             <div className="flex flex-col items-center">
//                                 <div className="flex shadow-xl">
//                                     {/* DATA PART (Blue) */}
//                                     <div className="w-16 h-12 bg-blue-600 flex items-center justify-center border-r border-blue-800 rounded-l-md relative">
//                                         <span className="text-white font-bold font-mono text-lg z-10">
//                                             {node.val}
//                                         </span>
//                                         <span className="absolute -top-5 text-[10px] text-blue-400 font-mono">Data</span>
//                                     </div>

//                                     {/* NEXT POINTER PART (Green) */}
//                                     <div className="w-10 h-12 bg-green-600 flex items-center justify-center rounded-r-md relative">
//                                         <div className="w-2 h-2 bg-green-900 rounded-full" />
//                                         <span className="absolute -top-5 text-[10px] text-green-400 font-mono">Next</span>
//                                     </div>
//                                 </div>
                                
//                                 {/* Memory Address Simulation (Optional) */}
//                                 <span className="mt-2 text-[10px] text-gray-600 font-mono">
//                                     0x{((index + 1) * 1024).toString(16)}
//                                 </span>
//                             </div>

//                             {/* ARROW CONNECTION */}
//                             <div className="mx-2 text-gray-500">
//                                 <ArrowRight size={24} />
//                             </div>
//                         </motion.div>
//                     ))}
//                 </AnimatePresence>

//                 {/* NULL TERMINATOR */}
//                 <motion.div 
//                     initial={{ opacity: 0 }}
//                     animate={{ opacity: 1 }}
//                     transition={{ delay: nodes.length * 0.1 }}
//                     className="flex flex-col items-center justify-center opacity-50"
//                 >
//                     <div className="w-10 h-12 border-2 border-dashed border-gray-600 rounded-md flex items-center justify-center bg-gray-900/50">
//                         <X size={20} className="text-red-500" />
//                     </div>
//                     <span className="mt-2 text-[10px] text-gray-500 font-mono">NULL</span>
//                 </motion.div>

//             </div>
//         </div>
//     );
// };

// export default LinkedListViz;





import React, { useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X, RotateCw, CornerDownRight } from 'lucide-react';

const LinkedListViz = memo(({ data, name }) => {

    // 🧠 MEMOIZED PARSING
    // Flattens the nested structure [val, next: [val, next...]] into a linear array
    // Only re-calculates when 'data' changes.
    const { nodes, isCircular, terminated } = useMemo(() => {
        const list = [];
        let current = data;
        let count = 0;
        const SAFE_LIMIT = 15; // Visual limit to prevent UI overflow
        let isCycle = false;

        while (current && count < SAFE_LIMIT) {
            // 1. Detect Backend Cycle Marker
            if (current === '[Circular]') {
                isCycle = true;
                break;
            }

            // 2. Extract Value (Support val/value/data props)
            const rawVal = current.val ?? current.value ?? current.data;
            const val = rawVal === undefined ? '?' : String(rawVal);

            list.push({
                id: `node-${count}`, // Stable ID for animation
                index: count,
                val: val,
            });

            current = current.next;
            count++;
        }

        return { 
            nodes: list, 
            isCircular: isCycle,
            terminated: !current && !isCycle // True if list ends naturally with null
        };
    }, [data]);

    if (!nodes.length) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500 opacity-50">
                <span className="font-mono text-xs">Empty List / Null</span>
            </div>
        );
    }

    return (
        <div className="p-6 overflow-x-auto custom-scrollbar">
            
            {/* Horizontal Container */}
            <div className="flex items-center min-w-max pb-4">
                
                {/* HEAD POINTER LABEL */}
                <div className="flex flex-col items-center mr-4 group">
                    <span className="text-purple-400 font-bold font-mono text-xs mb-1 bg-purple-900/20 px-2 py-0.5 rounded border border-purple-500/30">
                        {name || 'head'}
                    </span>
                    <ArrowRight className="text-purple-500" size={16} />
                </div>

                {/* NODES LIST */}
                <AnimatePresence mode='popLayout'>
                    {nodes.map((node, i) => (
                        <motion.div 
                            key={node.id}
                            layout
                            initial={{ opacity: 0, scale: 0.8, x: -20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="flex items-center"
                        >
                            <NodeBlock val={node.val} index={node.index} />
                            
                            {/* Connection Arrow */}
                            <div className="mx-2 text-gray-600 flex items-center justify-center">
                                <ArrowRight size={20} strokeWidth={2} />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* TERMINATION: NULL or CYCLE */}
                {terminated ? (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center opacity-60"
                    >
                        <div className="w-10 h-10 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center bg-[#0d1117]">
                            <X size={18} className="text-red-500" />
                        </div>
                        <span className="mt-1 text-[10px] text-gray-500 font-mono font-bold">NULL</span>
                    </motion.div>
                ) : isCircular ? (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2"
                    >
                        <div className="bg-orange-500/10 border border-orange-500/50 p-2 rounded-lg flex items-center gap-2 text-orange-400">
                            <RotateCw size={16} className="animate-spin-slow" />
                            <span className="text-[10px] font-bold font-mono">CYCLE</span>
                        </div>
                    </motion.div>
                ) : (
                    // Truncated view
                    <span className="text-gray-600 text-xl font-bold tracking-widest">...</span>
                )}

            </div>
        </div>
    );
});

// --- SUB-COMPONENT: VISUAL NODE BLOCK ---
const NodeBlock = memo(({ val, index }) => (
    <div className="flex flex-col items-center group relative">
        
        {/* Memory Address Simulation (Top Label) */}
        <span className="absolute -top-5 left-0 text-[9px] text-gray-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
            0x{((index + 10) * 8).toString(16).toUpperCase()}
        </span>

        <div className="flex shadow-lg rounded-lg overflow-hidden border border-gray-700/50">
            
            {/* 1. DATA SEGMENT */}
            <div className="w-14 h-12 bg-[#1f6feb] flex flex-col items-center justify-center relative border-r border-[#0d4496]">
                <span className="text-white font-bold font-mono text-sm z-10 truncate max-w-[3rem]">
                    {val}
                </span>
                <span className="absolute bottom-0.5 right-1 text-[8px] text-blue-200 opacity-60 font-mono">val</span>
            </div>

            {/* 2. POINTER SEGMENT */}
            <div className="w-8 h-12 bg-[#238636] flex items-center justify-center relative">
                <div className="w-2 h-2 bg-[#d7ffd9] rounded-full shadow-inner" />
                <span className="absolute bottom-0.5 right-1 text-[8px] text-green-200 opacity-60 font-mono">next</span>
            </div>

        </div>
    </div>
));

export default LinkedListViz;
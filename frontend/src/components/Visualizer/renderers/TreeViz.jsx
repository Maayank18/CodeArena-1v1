// import React from 'react';
// import { motion, AnimatePresence } from 'framer-motion';

// const TreeNode = ({ node, label }) => {
//     // 1. Base Case: If node is null, render invisible placeholder to maintain grid structure
//     if (!node) {
//         return <div className="invisible w-12 h-12" />;
//     }

//     const { val, value, data, left, right } = node;
//     const nodeValue = val ?? value ?? data ?? '?';
    
//     // Check if children exist
//     const hasChildren = left || right;
//     // Determine if it is a leaf (no children) to apply the Green color scheme
//     const isLeaf = !left && !right;

//     return (
//         <div className="flex flex-col items-center">
//             {/* 2. THE NODE (Circle) - Original Color Scheme Restored */}
//             <motion.div
//                 layout
//                 initial={{ scale: 0, opacity: 0 }}
//                 animate={{ scale: 1, opacity: 1 }}
//                 transition={{ type: "spring", stiffness: 300, damping: 20 }}
//                 className="relative z-10"
//             >
//                 {/* Color Logic:
//                     - Leaf Node -> Emerald Green Gradient
//                     - Parent Node -> Indigo Blue Gradient
//                 */}
//                 <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border-2 transition-all ${
//                     isLeaf 
//                         ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 border-emerald-300' 
//                         : 'bg-gradient-to-br from-indigo-500 to-indigo-700 border-indigo-300'
//                 }`}>
//                     <span className="text-white font-mono font-bold text-sm drop-shadow-md">
//                         {nodeValue}
//                     </span>
//                 </div>

//                 {/* Label Badge (Root, L, R) - Restored */}
//                 {label && (
//                     <motion.span 
//                         initial={{ opacity: 0, y: -5 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-gray-400 bg-gray-900/90 px-2 py-0.5 rounded-md border border-gray-700 font-bold uppercase tracking-wider whitespace-nowrap"
//                     >
//                         {label}
//                     </motion.span>
//                 )}
//             </motion.div>

//             {/* 3. CONNECTORS & CHILDREN */}
//             <AnimatePresence>
//                 {hasChildren && (
//                     <motion.div
//                         initial={{ opacity: 0, y: -10 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         exit={{ opacity: 0, y: -10 }}
//                         className="flex flex-col items-center"
//                     >
//                         {/* A. SVG Connector Layer (The Lines) */}
//                         <div className="w-full h-8 relative">
//                             <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
//                                 {/* Line to Left Child */}
//                                 {left && (
//                                     <motion.line 
//                                         x1="50%" y1="0" 
//                                         x2="25%" y2="100%" 
//                                         stroke="#6366f1" // Indigo-500
//                                         strokeWidth="2"
//                                         strokeLinecap="round"
//                                         initial={{ pathLength: 0, opacity: 0 }}
//                                         animate={{ pathLength: 1, opacity: 0.5 }}
//                                         transition={{ duration: 0.4 }}
//                                     />
//                                 )}
                                
//                                 {/* Line to Right Child */}
//                                 {right && (
//                                     <motion.line 
//                                         x1="50%" y1="0" 
//                                         x2="75%" y2="100%" 
//                                         stroke="#6366f1" // Indigo-500
//                                         strokeWidth="2"
//                                         strokeLinecap="round"
//                                         initial={{ pathLength: 0, opacity: 0 }}
//                                         animate={{ pathLength: 1, opacity: 0.5 }}
//                                         transition={{ duration: 0.4 }}
//                                     />
//                                 )}
//                             </svg>
//                         </div>

//                         {/* B. Children Container */}
//                         <div className="flex items-start gap-2 w-full">
//                             {/* Left Child Slot (50% width) */}
//                             <div className="flex-1 flex justify-center">
//                                 {left ? <TreeNode node={left} label="L" /> : <div className="w-12" />}
//                             </div>

//                             {/* Right Child Slot (50% width) */}
//                             <div className="flex-1 flex justify-center">
//                                 {right ? <TreeNode node={right} label="R" /> : <div className="w-12" />}
//                             </div>
//                         </div>
//                     </motion.div>
//                 )}
//             </AnimatePresence>
//         </div>
//     );
// };

// const TreeViz = ({ data, name }) => {
//     if (!data) {
//         return (
//             <div className="w-full h-48 flex items-center justify-center text-gray-600 border border-gray-800 rounded-xl bg-gray-900/30">
//                 <p className="text-sm">No tree data</p>
//             </div>
//         );
//     }

//     return (
//         // Restored Container Background Gradient
//         <div className="w-full overflow-auto bg-gradient-to-b from-[#161b22] to-[#0d1117] p-8 rounded-xl border border-gray-800 flex flex-col items-center shadow-inner min-h-[300px]">
//             <TreeNode node={data} label="root" />
//         </div>
//     );
// };

// export default TreeViz;

















import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- MAIN WRAPPER ---
const TreeViz = memo(({ data, name }) => {
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
        return (
            <div className="w-full h-48 flex flex-col items-center justify-center text-gray-500 border border-dashed border-gray-800 rounded-xl bg-[#0d1117]/50">
                <span className="text-xs font-mono">Empty Tree / Null</span>
            </div>
        );
    }

    return (
        <div className="
            relative w-full overflow-auto custom-scrollbar 
            bg-gradient-to-b from-[#0d1117] to-[#161b22] 
            p-10 rounded-xl border border-gray-800 
            flex flex-col items-center shadow-2xl min-h-[350px]
        ">
            {/* Background Grid Pattern for depth */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
            
            <div className="relative z-10">
                <TreeNode node={data} label="root" depth={0} />
            </div>
        </div>
    );
});

// --- RECURSIVE NODE COMPONENT ---
const TreeNode = memo(({ node, label, depth }) => {
    // Base Case: Ghost node for spacing if parent has only one child
    if (!node) {
        return <div className="w-12 h-12 invisible" />;
    }

    // 1. EXTRACT DATA
    // Supports various naming conventions (val, value, data)
    const rawVal = node.val ?? node.value ?? node.data;
    const val = rawVal !== undefined ? String(rawVal) : '?';
    
    // Check children
    const left = node.left;
    const right = node.right;
    const isLeaf = !left && !right;
    const hasChildren = left || right;

    return (
        <div className="flex flex-col items-center">
            
            {/* 2. THE NODE CIRCLE */}
            <div className="relative z-20">
                <motion.div
                    layout
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ 
                        type: "spring", 
                        stiffness: 260, 
                        damping: 20, 
                        delay: depth * 0.1 // Staggered entry based on depth
                    }}
                    className={`
                        w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center 
                        border-[3px] shadow-xl relative backdrop-blur-sm transition-colors
                        ${isLeaf 
                            ? 'bg-gradient-to-br from-emerald-900/80 to-emerald-600/20 border-emerald-500 shadow-emerald-900/20' 
                            : 'bg-gradient-to-br from-indigo-900/80 to-indigo-600/20 border-indigo-500 shadow-indigo-900/20'
                        }
                    `}
                >
                    <span className={`
                        text-sm md:text-base font-mono font-bold drop-shadow-md
                        ${isLeaf ? 'text-emerald-100' : 'text-indigo-100'}
                    `}>
                        {val}
                    </span>

                    {/* LABEL BADGE (Root, L, R) */}
                    {label && (
                        <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`
                                absolute -top-3 left-1/2 -translate-x-1/2 
                                text-[9px] font-bold px-1.5 py-0.5 rounded border shadow-sm uppercase tracking-wider
                                ${isLeaf 
                                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800' 
                                    : 'bg-indigo-950 text-indigo-400 border-indigo-800'
                                }
                            `}
                        >
                            {label}
                        </motion.div>
                    )}
                </motion.div>
            </div>

            {/* 3. CONNECTORS & CHILDREN */}
            <AnimatePresence>
                {hasChildren && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center"
                    >
                        {/* A. SVG CONNECTOR LAYER */}
                        {/* This SVG sits between the parent and the children row.
                           It draws lines from Top-Center to Bottom-Left (25%) and Bottom-Right (75%)
                        */}
                        <div className="w-full h-10 relative">
                            <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
                                {/* Path to Left Child */}
                                {left && (
                                    <motion.path 
                                        d="M 50% 0 C 50% 20, 25% 20, 25% 100%" 
                                        fill="none" 
                                        stroke="#6366f1" 
                                        strokeWidth="2" 
                                        strokeOpacity="0.3"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.5, delay: depth * 0.1 }}
                                    />
                                )}
                                {/* Path to Right Child */}
                                {right && (
                                    <motion.path 
                                        d="M 50% 0 C 50% 20, 75% 20, 75% 100%" 
                                        fill="none" 
                                        stroke="#6366f1" 
                                        strokeWidth="2" 
                                        strokeOpacity="0.3"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.5, delay: depth * 0.1 }}
                                    />
                                )}
                            </svg>
                        </div>

                        {/* B. CHILDREN CONTAINER */}
                        <div className="flex items-start gap-4 md:gap-8 pt-1">
                            {/* Left Branch */}
                            <div className="flex flex-col items-center">
                                {left ? <TreeNode node={left} label="L" depth={depth + 1} /> : <div className="w-12" />}
                            </div>

                            {/* Right Branch */}
                            <div className="flex flex-col items-center">
                                {right ? <TreeNode node={right} label="R" depth={depth + 1} /> : <div className="w-12" />}
                            </div>
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

export default TreeViz;
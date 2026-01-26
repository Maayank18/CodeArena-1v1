// // src/components/Visualizer/renderers/TreeViz.jsx
// import React from 'react';
// import { motion, AnimatePresence } from 'framer-motion';

// // Recursive Node Component
// const TreeNode = ({ node, label, depth = 0 }) => {
//     if (!node) return null;

//     const value = node.val ?? node.value ?? node.data ?? '?';
//     const left = node.left;
//     const right = node.right;
//     const next = node.next; // For linked lists

//     const isLeaf = !left && !right && !next;

//     return (
//         <div className="flex flex-col items-center mx-2">
            
//             {/* Node Circle */}
//             <motion.div 
//                 layout
//                 initial={{ scale: 0, opacity: 0 }}
//                 animate={{ scale: 1, opacity: 1 }}
//                 exit={{ scale: 0, opacity: 0 }}
//                 transition={{ 
//                     type: "spring", 
//                     stiffness: 260, 
//                     damping: 20 
//                 }}
//                 className="relative z-10"
//             >
//                 {/* Main Circle with Gradient */}
//                 <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border-2 transition-all ${
//                     isLeaf 
//                         ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 border-emerald-300' 
//                         : 'bg-gradient-to-br from-indigo-500 to-indigo-700 border-indigo-300'
//                 }`}>
//                     <span className="text-white font-bold font-mono text-sm drop-shadow-md">
//                         {value}
//                     </span>
//                 </div>

//                 {/* Label Badge (Root, L, R, Next) */}
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

//             {/* Children Container */}
//             <div className="flex items-start mt-8 gap-6">
                
//                 {/* Linked List: Horizontal Next Pointer */}
//                 {next && (
//                     <div className="flex items-center -mt-8">
//                         {/* Arrow Line */}
//                         <motion.div 
//                             initial={{ width: 0 }} 
//                             animate={{ width: 40 }} 
//                             transition={{ duration: 0.4, ease: "easeOut" }}
//                             className="h-0.5 bg-gray-500 relative ml-2"
//                         >
//                             {/* Arrow Head */}
//                             <div className="absolute right-0 -top-1 w-2 h-2 border-t-2 border-r-2 border-gray-500 rotate-45" />
//                         </motion.div>
                        
//                         <TreeNode node={next} label="next" depth={depth + 1} />
//                     </div>
//                 )}

//                 {/* Binary Tree: Vertical Edges */}
//                 {(left || right) && (
//                     <AnimatePresence>
//                         <div className="flex gap-8 relative">
                            
//                             {/* Left Child */}
//                             {left && (
//                                 <div className="flex flex-col items-center relative">
//                                     {/* Connector Line */}
//                                     <motion.div 
//                                         initial={{ height: 0, opacity: 0 }}
//                                         animate={{ height: 32, opacity: 1 }}
//                                         transition={{ duration: 0.3 }}
//                                         className="w-0.5 bg-gray-600 absolute -top-8 right-1/2 origin-top"
//                                         style={{ transform: 'rotate(30deg)' }}
//                                     />
                                    
//                                     <TreeNode node={left} label="L" depth={depth + 1} />
//                                 </div>
//                             )}
                            
//                             {/* Right Child */}
//                             {right && (
//                                 <div className="flex flex-col items-center relative">
//                                     {/* Connector Line */}
//                                     <motion.div 
//                                         initial={{ height: 0, opacity: 0 }}
//                                         animate={{ height: 32, opacity: 1 }}
//                                         transition={{ duration: 0.3 }}
//                                         className="w-0.5 bg-gray-600 absolute -top-8 left-1/2 origin-top"
//                                         style={{ transform: 'rotate(-30deg)' }}
//                                     />
                                    
//                                     <TreeNode node={right} label="R" depth={depth + 1} />
//                                 </div>
//                             )}
//                         </div>
//                     </AnimatePresence>
//                 )}
//             </div>
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
//         <div className="w-full overflow-x-auto overflow-y-hidden bg-gradient-to-b from-[#161b22] to-[#0d1117] p-8 rounded-xl border border-gray-800 flex flex-col items-center shadow-inner min-h-[300px] max-h-[600px]">
//             <TreeNode node={data} label="root" />
//         </div>
//     );
// };

// export default TreeViz;












import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TreeNode = ({ node, label }) => {
    // 1. Base Case: If node is null, render invisible placeholder to maintain grid structure
    if (!node) {
        return <div className="invisible w-12 h-12" />;
    }

    const { val, value, data, left, right } = node;
    const nodeValue = val ?? value ?? data ?? '?';
    
    // Check if children exist
    const hasChildren = left || right;
    // Determine if it is a leaf (no children) to apply the Green color scheme
    const isLeaf = !left && !right;

    return (
        <div className="flex flex-col items-center">
            {/* 2. THE NODE (Circle) - Original Color Scheme Restored */}
            <motion.div
                layout
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative z-10"
            >
                {/* Color Logic:
                    - Leaf Node -> Emerald Green Gradient
                    - Parent Node -> Indigo Blue Gradient
                */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border-2 transition-all ${
                    isLeaf 
                        ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 border-emerald-300' 
                        : 'bg-gradient-to-br from-indigo-500 to-indigo-700 border-indigo-300'
                }`}>
                    <span className="text-white font-mono font-bold text-sm drop-shadow-md">
                        {nodeValue}
                    </span>
                </div>

                {/* Label Badge (Root, L, R) - Restored */}
                {label && (
                    <motion.span 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-gray-400 bg-gray-900/90 px-2 py-0.5 rounded-md border border-gray-700 font-bold uppercase tracking-wider whitespace-nowrap"
                    >
                        {label}
                    </motion.span>
                )}
            </motion.div>

            {/* 3. CONNECTORS & CHILDREN */}
            <AnimatePresence>
                {hasChildren && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col items-center"
                    >
                        {/* A. SVG Connector Layer (The Lines) */}
                        <div className="w-full h-8 relative">
                            <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
                                {/* Line to Left Child */}
                                {left && (
                                    <motion.line 
                                        x1="50%" y1="0" 
                                        x2="25%" y2="100%" 
                                        stroke="#6366f1" // Indigo-500
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 0.5 }}
                                        transition={{ duration: 0.4 }}
                                    />
                                )}
                                
                                {/* Line to Right Child */}
                                {right && (
                                    <motion.line 
                                        x1="50%" y1="0" 
                                        x2="75%" y2="100%" 
                                        stroke="#6366f1" // Indigo-500
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 0.5 }}
                                        transition={{ duration: 0.4 }}
                                    />
                                )}
                            </svg>
                        </div>

                        {/* B. Children Container */}
                        <div className="flex items-start gap-2 w-full">
                            {/* Left Child Slot (50% width) */}
                            <div className="flex-1 flex justify-center">
                                {left ? <TreeNode node={left} label="L" /> : <div className="w-12" />}
                            </div>

                            {/* Right Child Slot (50% width) */}
                            <div className="flex-1 flex justify-center">
                                {right ? <TreeNode node={right} label="R" /> : <div className="w-12" />}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const TreeViz = ({ data, name }) => {
    if (!data) {
        return (
            <div className="w-full h-48 flex items-center justify-center text-gray-600 border border-gray-800 rounded-xl bg-gray-900/30">
                <p className="text-sm">No tree data</p>
            </div>
        );
    }

    return (
        // Restored Container Background Gradient
        <div className="w-full overflow-auto bg-gradient-to-b from-[#161b22] to-[#0d1117] p-8 rounded-xl border border-gray-800 flex flex-col items-center shadow-inner min-h-[300px]">
            <TreeNode node={data} label="root" />
        </div>
    );
};

export default TreeViz;
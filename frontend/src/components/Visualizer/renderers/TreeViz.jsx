// import React, { memo } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';

// // --- MAIN WRAPPER ---
// const TreeViz = memo(({ data, name }) => {
//     if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
//         return (
//             <div className="w-full h-48 flex flex-col items-center justify-center text-gray-500 border border-dashed border-gray-800 rounded-xl bg-[#0d1117]/50">
//                 <span className="text-xs font-mono">Empty Tree / Null</span>
//             </div>
//         );
//     }

//     return (
//         <div className="
//             relative w-full overflow-auto custom-scrollbar 
//             bg-gradient-to-b from-[#0d1117] to-[#161b22] 
//             p-10 rounded-xl border border-gray-800 
//             flex flex-col items-center shadow-2xl min-h-[350px]
//         ">
//             {/* Background Grid Pattern for depth */}
//             <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
            
//             <div className="relative z-10">
//                 <TreeNode node={data} label="root" depth={0} />
//             </div>
//         </div>
//     );
// });

// // --- RECURSIVE NODE COMPONENT ---
// const TreeNode = memo(({ node, label, depth }) => {
//     // Base Case: Ghost node for spacing if parent has only one child
//     if (!node) {
//         return <div className="w-12 h-12 invisible" />;
//     }

//     // 1. EXTRACT DATA
//     // Supports various naming conventions (val, value, data)
//     const rawVal = node.val ?? node.value ?? node.data;
//     const val = rawVal !== undefined ? String(rawVal) : '?';
    
//     // Check children
//     const left = node.left;
//     const right = node.right;
//     const isLeaf = !left && !right;
//     const hasChildren = left || right;

//     return (
//         <div className="flex flex-col items-center">
            
//             {/* 2. THE NODE CIRCLE */}
//             <div className="relative z-20">
//                 <motion.div
//                     layout
//                     initial={{ scale: 0, opacity: 0 }}
//                     animate={{ scale: 1, opacity: 1 }}
//                     transition={{ 
//                         type: "spring", 
//                         stiffness: 260, 
//                         damping: 20, 
//                         delay: depth * 0.1 // Staggered entry based on depth
//                     }}
//                     className={`
//                         w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center 
//                         border-[3px] shadow-xl relative backdrop-blur-sm transition-colors
//                         ${isLeaf 
//                             ? 'bg-gradient-to-br from-emerald-900/80 to-emerald-600/20 border-emerald-500 shadow-emerald-900/20' 
//                             : 'bg-gradient-to-br from-indigo-900/80 to-indigo-600/20 border-indigo-500 shadow-indigo-900/20'
//                         }
//                     `}
//                 >
//                     <span className={`
//                         text-sm md:text-base font-mono font-bold drop-shadow-md
//                         ${isLeaf ? 'text-emerald-100' : 'text-indigo-100'}
//                     `}>
//                         {val}
//                     </span>

//                     {/* LABEL BADGE (Root, L, R) */}
//                     {label && (
//                         <motion.div 
//                             initial={{ opacity: 0, y: 5 }}
//                             animate={{ opacity: 1, y: 0 }}
//                             className={`
//                                 absolute -top-3 left-1/2 -translate-x-1/2 
//                                 text-[9px] font-bold px-1.5 py-0.5 rounded border shadow-sm uppercase tracking-wider
//                                 ${isLeaf 
//                                     ? 'bg-emerald-950 text-emerald-400 border-emerald-800' 
//                                     : 'bg-indigo-950 text-indigo-400 border-indigo-800'
//                                 }
//                             `}
//                         >
//                             {label}
//                         </motion.div>
//                     )}
//                 </motion.div>
//             </div>

//             {/* 3. CONNECTORS & CHILDREN */}
//             <AnimatePresence>
//                 {hasChildren && (
//                     <motion.div
//                         initial={{ opacity: 0 }}
//                         animate={{ opacity: 1 }}
//                         className="flex flex-col items-center"
//                     >
//                         {/* A. SVG CONNECTOR LAYER */}
//                         {/* This SVG sits between the parent and the children row.
//                            It draws lines from Top-Center to Bottom-Left (25%) and Bottom-Right (75%)
//                         */}
//                         <div className="w-full h-10 relative">
//                             <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
//                                 {/* Path to Left Child */}
//                                 {left && (
//                                     <motion.path 
//                                         d="M 50% 0 C 50% 20, 25% 20, 25% 100%" 
//                                         fill="none" 
//                                         stroke="#6366f1" 
//                                         strokeWidth="2" 
//                                         strokeOpacity="0.3"
//                                         initial={{ pathLength: 0 }}
//                                         animate={{ pathLength: 1 }}
//                                         transition={{ duration: 0.5, delay: depth * 0.1 }}
//                                     />
//                                 )}
//                                 {/* Path to Right Child */}
//                                 {right && (
//                                     <motion.path 
//                                         d="M 50% 0 C 50% 20, 75% 20, 75% 100%" 
//                                         fill="none" 
//                                         stroke="#6366f1" 
//                                         strokeWidth="2" 
//                                         strokeOpacity="0.3"
//                                         initial={{ pathLength: 0 }}
//                                         animate={{ pathLength: 1 }}
//                                         transition={{ duration: 0.5, delay: depth * 0.1 }}
//                                     />
//                                 )}
//                             </svg>
//                         </div>

//                         {/* B. CHILDREN CONTAINER */}
//                         <div className="flex items-start gap-4 md:gap-8 pt-1">
//                             {/* Left Branch */}
//                             <div className="flex flex-col items-center">
//                                 {left ? <TreeNode node={left} label="L" depth={depth + 1} /> : <div className="w-12" />}
//                             </div>

//                             {/* Right Branch */}
//                             <div className="flex flex-col items-center">
//                                 {right ? <TreeNode node={right} label="R" depth={depth + 1} /> : <div className="w-12" />}
//                             </div>
//                         </div>

//                     </motion.div>
//                 )}
//             </AnimatePresence>
//         </div>
//     );
// });

// export default TreeViz;
















import React, { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';

// --- CONFIGURATION ---
const CONFIG = {
    MAX_DEPTH: 8, // Prevent infinite rendering
    MAX_CHILDREN: 10, // Limit n-ary tree children display
    SHOW_NULL_NODES: true, // Visualize null/missing children
    NODE_SIZE: 56, // Base node size in pixels
    HORIZONTAL_GAP: 32, // Gap between siblings
    VERTICAL_GAP: 48, // Gap between levels
};

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
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
            
            <div className="relative z-10">
                <TreeNode node={data} label="root" depth={0} visited={new Set()} />
            </div>
        </div>
    );
});

// --- RECURSIVE NODE COMPONENT (OPTIMIZED) ---
const TreeNode = memo(({ node, label, depth, visited }) => {
    // 🛡️ SAFETY: Prevent infinite loops from circular references
    if (visited.has(node)) {
        return <CircularRefNode />;
    }

    // 🛡️ SAFETY: Depth limiter
    if (depth >= CONFIG.MAX_DEPTH) {
        return <MaxDepthNode />;
    }

    // Base Case: Null node
    if (!node) {
        return CONFIG.SHOW_NULL_NODES && depth > 0 ? <NullNode /> : <div className="w-12 h-12 invisible" />;
    }

    // 🧠 SMART PROPERTY DETECTION
    const nodeProps = extractNodeProperties(node);
    const { value, children, metadata, isLeaf } = nodeProps;

    // Add current node to visited set
    const newVisited = new Set(visited);
    newVisited.add(node);

    return (
        <div className="flex flex-col items-center">
            
            {/* 1. THE NODE CIRCLE (WITH METADATA SUPPORT) */}
            <NodeCircle 
                value={value} 
                label={label} 
                depth={depth} 
                isLeaf={isLeaf}
                metadata={metadata}
            />

            {/* 2. CHILDREN RENDERING */}
            <AnimatePresence>
                {children.length > 0 && (
                    <ChildrenContainer 
                        children={children} 
                        depth={depth}
                        visited={newVisited}
                    />
                )}
            </AnimatePresence>
        </div>
    );
});

// --- SMART PROPERTY EXTRACTION ---
function extractNodeProperties(node) {
    // Support multiple naming conventions
    const VALUE_FIELDS = ['val', 'value', 'data', 'key', 'item', 'element', 'content'];
    
    let value = '?';
    for (const field of VALUE_FIELDS) {
        if (node[field] !== undefined && node[field] !== null) {
            value = String(node[field]);
            break;
        }
    }

    // 🎯 CHILDREN DETECTION (supports both binary and n-ary trees)
    let children = [];
    
    // 1. Check for explicit children array (n-ary tree)
    if (Array.isArray(node.children)) {
        children = node.children
            .slice(0, CONFIG.MAX_CHILDREN)
            .map((child, idx) => ({ node: child, label: `C${idx}` }));
    }
    // 2. Check for left/right (binary tree)
    else if ('left' in node || 'right' in node) {
        if (node.left !== undefined) children.push({ node: node.left, label: 'L' });
        if (node.right !== undefined) children.push({ node: node.right, label: 'R' });
    }
    // 3. Check for numbered children (child0, child1, ...)
    else {
        const childKeys = Object.keys(node).filter(k => /^child\d+$/i.test(k)).sort();
        children = childKeys.map(k => ({ node: node[k], label: k.replace(/child/i, 'C') }));
    }

    // 🎨 METADATA EXTRACTION (for advanced visualizations)
    const metadata = {
        color: node.color || node.nodeColor || null,
        weight: node.weight || node.cost || null,
        height: node.height || null,
        size: node.size || null,
        isVisited: node.visited || node.isVisited || false,
        parent: node.parent || node.parentNode || null, // Don't render, just detect
    };

    const isLeaf = children.length === 0;

    return { value, children, metadata, isLeaf };
}

// --- NODE CIRCLE COMPONENT ---
const NodeCircle = memo(({ value, label, depth, isLeaf, metadata }) => {
    // Apply custom color if available
    const customColor = metadata.color;
    const isVisited = metadata.isVisited;

    const baseStyle = isLeaf 
        ? 'from-emerald-900/80 to-emerald-600/20 border-emerald-500' 
        : 'from-indigo-900/80 to-indigo-600/20 border-indigo-500';

    const visitedStyle = isVisited 
        ? 'from-yellow-900/80 to-yellow-600/20 border-yellow-500'
        : baseStyle;

    const colorStyle = customColor 
        ? `bg-${customColor}-900/80 border-${customColor}-500`
        : visitedStyle;

    return (
        <div className="relative z-20">
            <motion.div
                layout
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                    type: "spring", 
                    stiffness: 260, 
                    damping: 20, 
                    delay: depth * 0.08
                }}
                className={`
                    w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center 
                    border-[3px] shadow-xl relative backdrop-blur-sm transition-colors
                    bg-gradient-to-br ${colorStyle}
                `}
            >
                <span className="text-sm md:text-base font-mono font-bold drop-shadow-md text-white">
                    {value}
                </span>

                {/* LABEL BADGE */}
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

                {/* METADATA BADGES (weight, height, etc.) */}
                {metadata.weight !== null && (
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[8px] font-bold px-1 py-0.5 rounded bg-gray-900 text-gray-400 border border-gray-700">
                        w:{metadata.weight}
                    </div>
                )}
            </motion.div>
        </div>
    );
});

// --- CHILDREN CONTAINER (SMART LAYOUT) ---
const ChildrenContainer = memo(({ children, depth, visited }) => {
    const isBinary = children.length === 2;
    const isNary = children.length > 2;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center"
        >
            {/* SVG CONNECTORS */}
            <div className="w-full h-10 relative" style={{ minWidth: `${children.length * 60}px` }}>
                <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
                    {children.map((child, idx) => {
                        const totalChildren = children.length;
                        const xPos = ((idx + 1) / (totalChildren + 1)) * 100;
                        
                        return (
                            <motion.path 
                                key={idx}
                                d={`M 50% 0 C 50% 20, ${xPos}% 20, ${xPos}% 100%`}
                                fill="none" 
                                stroke={child.node ? "#6366f1" : "#4b5563"}
                                strokeWidth="2" 
                                strokeOpacity={child.node ? "0.3" : "0.15"}
                                strokeDasharray={child.node ? "none" : "4 4"}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.5, delay: depth * 0.08 }}
                            />
                        );
                    })}
                </svg>
            </div>

            {/* CHILDREN NODES */}
            <div className={`flex items-start pt-1 ${isNary ? 'gap-3 md:gap-4' : 'gap-4 md:gap-8'}`}>
                {children.map((child, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                        <TreeNode 
                            node={child.node} 
                            label={child.label} 
                            depth={depth + 1}
                            visited={visited}
                        />
                    </div>
                ))}
            </div>
        </motion.div>
    );
});

// --- SPECIAL NODE TYPES ---
const NullNode = memo(() => (
    <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-10 h-10 rounded-full border-2 border-dashed border-gray-700/50 flex items-center justify-center bg-gray-900/20"
    >
        <span className="text-[10px] font-mono text-gray-600">∅</span>
    </motion.div>
));

const CircularRefNode = memo(() => (
    <div className="w-12 h-12 rounded-full border-2 border-orange-500 flex items-center justify-center bg-orange-900/20">
        <span className="text-xs font-bold text-orange-400">↻</span>
    </div>
));

const MaxDepthNode = memo(() => (
    <div className="w-12 h-12 rounded-full border-2 border-yellow-500 flex items-center justify-center bg-yellow-900/20">
        <span className="text-[10px] font-bold text-yellow-400">···</span>
    </div>
));

export default TreeViz;
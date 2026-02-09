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

// --- CONFIGURATION ---
const CONFIG = {
    MAX_DEPTH: 8,
    MAX_CHILDREN: 10,
    SHOW_NULL_NODES: false, // ✅ CHANGED: Better for most trees
    NODE_SIZE: 56,
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
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
            
            {/* Variable Name Label */}
            <div className="absolute top-4 left-4 px-2 py-1 bg-purple-900/30 border border-purple-500/30 rounded text-xs font-mono text-purple-300">
                {name}
            </div>
            
            <div className="relative z-10">
                <TreeNode node={data} label="root" depth={0} visited={new Set()} />
            </div>
        </div>
    );
});

// --- RECURSIVE NODE COMPONENT ---
const TreeNode = memo(({ node, label, depth, visited }) => {
    // 🛡️ Circular reference protection
    if (visited.has(node)) {
        return <CircularRefNode />;
    }

    // 🛡️ Depth limiter
    if (depth >= CONFIG.MAX_DEPTH) {
        return <MaxDepthNode />;
    }

    // Base Case: Null node
    if (!node) {
        return CONFIG.SHOW_NULL_NODES && depth > 0 ? <NullNode /> : null;
    }

    // 🧠 Property extraction
    const nodeProps = extractNodeProperties(node);
    const { value, children, metadata, isLeaf } = nodeProps;

    // Add to visited set
    const newVisited = new Set(visited);
    newVisited.add(node);

    return (
        <div className="flex flex-col items-center">
            <NodeCircle 
                value={value} 
                label={label} 
                depth={depth} 
                isLeaf={isLeaf}
                metadata={metadata}
            />

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

// --- PROPERTY EXTRACTION ---
function extractNodeProperties(node) {
    const VALUE_FIELDS = ['val', 'value', 'data', 'key', 'item', 'element', 'content'];
    
    let value = '?';
    for (const field of VALUE_FIELDS) {
        if (node[field] !== undefined && node[field] !== null) {
            value = String(node[field]);
            break;
        }
    }

    // Children detection
    let children = [];
    
    if (Array.isArray(node.children)) {
        children = node.children
            .slice(0, CONFIG.MAX_CHILDREN)
            .map((child, idx) => ({ node: child, label: `${idx}` }));
    } else if ('left' in node || 'right' in node) {
        if (node.left !== undefined) children.push({ node: node.left, label: 'L' });
        if (node.right !== undefined) children.push({ node: node.right, label: 'R' });
    }

    // Metadata
    const metadata = {
        color: node.color || node.nodeColor || null,
        weight: node.weight || node.cost || null,
        height: node.height || null,
        isVisited: node.visited || node.isVisited || false,
    };

    const isLeaf = children.length === 0;

    return { value, children, metadata, isLeaf };
}

// --- NODE CIRCLE ---
const NodeCircle = memo(({ value, label, depth, isLeaf, metadata }) => {
    // ✅ FIXED: Predefined styles instead of dynamic Tailwind
    const getNodeStyle = () => {
        if (metadata.isVisited) {
            return {
                gradient: 'from-yellow-900/80 to-yellow-600/20',
                border: 'border-yellow-500',
                shadow: 'shadow-yellow-900/20',
                text: 'text-yellow-100',
                badge: 'bg-yellow-950 text-yellow-400 border-yellow-800'
            };
        }
        
        if (metadata.color === 'red') {
            return {
                gradient: 'from-red-900/80 to-red-600/20',
                border: 'border-red-500',
                shadow: 'shadow-red-900/20',
                text: 'text-red-100',
                badge: 'bg-red-950 text-red-400 border-red-800'
            };
        }
        
        if (metadata.color === 'green') {
            return {
                gradient: 'from-green-900/80 to-green-600/20',
                border: 'border-green-500',
                shadow: 'shadow-green-900/20',
                text: 'text-green-100',
                badge: 'bg-green-950 text-green-400 border-green-800'
            };
        }
        
        if (isLeaf) {
            return {
                gradient: 'from-emerald-900/80 to-emerald-600/20',
                border: 'border-emerald-500',
                shadow: 'shadow-emerald-900/20',
                text: 'text-emerald-100',
                badge: 'bg-emerald-950 text-emerald-400 border-emerald-800'
            };
        }
        
        return {
            gradient: 'from-indigo-900/80 to-indigo-600/20',
            border: 'border-indigo-500',
            shadow: 'shadow-indigo-900/20',
            text: 'text-indigo-100',
            badge: 'bg-indigo-950 text-indigo-400 border-indigo-800'
        };
    };

    const style = getNodeStyle();

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
                    bg-gradient-to-br ${style.gradient} ${style.border} ${style.shadow}
                `}
            >
                <span className={`text-sm md:text-base font-mono font-bold drop-shadow-md ${style.text}`}>
                    {value}
                </span>

                {label && (
                    <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`
                            absolute -top-3 left-1/2 -translate-x-1/2 
                            text-[9px] font-bold px-1.5 py-0.5 rounded border shadow-sm uppercase tracking-wider
                            ${style.badge}
                        `}
                    >
                        {label}
                    </motion.div>
                )}

                {metadata.weight !== null && (
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[8px] font-bold px-1 py-0.5 rounded bg-gray-900 text-gray-400 border border-gray-700">
                        w:{metadata.weight}
                    </div>
                )}
                
                {metadata.height !== null && (
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 text-[8px] font-bold px-1 py-0.5 rounded bg-gray-900 text-gray-400 border border-gray-700">
                        h:{metadata.height}
                    </div>
                )}
            </motion.div>
        </div>
    );
});

// --- CHILDREN CONTAINER ---
const ChildrenContainer = memo(({ children, depth, visited }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center"
        >
            {/* SVG Connectors */}
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

            {/* Children */}
            <div className="flex items-start gap-4 md:gap-8 pt-1">
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

// --- SPECIAL NODES ---
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
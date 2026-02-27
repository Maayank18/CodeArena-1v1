import React, { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- DYNAMIC SIZING CALCULATOR ---
function calculateTreeDimensions(node, visited = new Set()) {
    if (!node || visited.has(node)) return { maxDepth: 0, maxWidth: 0 };
    visited.add(node);

    const left = node.left ? calculateTreeDimensions(node.left, visited) : { maxDepth: 0, maxWidth: 0 };
    const right = node.right ? calculateTreeDimensions(node.right, visited) : { maxDepth: 0, maxWidth: 0 };
    
    const children = node.children ? node.children.filter(c => c).length : 0;
    const maxDepth = 1 + Math.max(left.maxDepth, right.maxDepth);
    const maxWidth = Math.max(left.maxWidth + right.maxWidth, children, 1);

    return { maxDepth, maxWidth };
}

function getOptimalSizing(maxDepth, maxWidth) {
    // Auto-scale based on complexity
    let nodeSize, gap, fontSize;

    if (maxDepth <= 3 && maxWidth <= 4) {
        // Small tree - Large nodes
        nodeSize = 56;
        gap = 32;
        fontSize = 'text-base';
    } else if (maxDepth <= 5 && maxWidth <= 8) {
        // Medium tree - Medium nodes
        nodeSize = 44;
        gap = 24;
        fontSize = 'text-sm';
    } else if (maxDepth <= 7 && maxWidth <= 16) {
        // Large tree - Small nodes
        nodeSize = 36;
        gap = 16;
        fontSize = 'text-xs';
    } else {
        // Huge tree - Tiny nodes
        nodeSize = 28;
        gap = 12;
        fontSize = 'text-[10px]';
    }

    return { nodeSize, gap, fontSize };
}

// --- MAIN WRAPPER ---
const TreeViz = memo(({ data, name }) => {
    const { maxDepth, maxWidth } = useMemo(() => calculateTreeDimensions(data), [data]);
    const sizing = useMemo(() => getOptimalSizing(maxDepth, maxWidth), [maxDepth, maxWidth]);

    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
        return (
            <div className="w-full h-32 flex flex-col items-center justify-center text-gray-500 border border-dashed border-gray-800 rounded-lg bg-[#0d1117]/50">
                <span className="text-xs font-mono">Empty Tree</span>
            </div>
        );
    }

    return (
        <div className="
            relative w-full overflow-auto custom-scrollbar 
            bg-gradient-to-b from-[#0d1117] to-[#161b22] 
            p-6 rounded-xl border border-gray-800 
            flex flex-col items-center shadow-xl
        " style={{ minHeight: `${Math.min(maxDepth * 80, 400)}px` }}>
            
            {/* Variable Name Label */}
            <div className="absolute top-2 left-2 px-2 py-1 bg-purple-900/30 border border-purple-500/30 rounded text-[10px] font-mono text-purple-300 z-50">
                {name} <span className="text-gray-500 ml-1">D:{maxDepth}</span>
            </div>
            
            <div className="relative z-10 scale-95">
                <TreeNode 
                    node={data} 
                    label="root" 
                    depth={0} 
                    visited={new Set()}
                    sizing={sizing}
                />
            </div>
        </div>
    );
});

// --- RECURSIVE NODE COMPONENT ---
const TreeNode = memo(({ node, label, depth, visited, sizing }) => {
    if (visited.has(node)) return <CircularRefNode sizing={sizing} />;
    if (depth >= 8) return <MaxDepthNode sizing={sizing} />;
    if (!node) return null;

    const nodeProps = extractNodeProperties(node);
    const { value, children, metadata, isLeaf } = nodeProps;

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
                sizing={sizing}
            />

            <AnimatePresence>
                {children.length > 0 && (
                    <ChildrenContainer 
                        children={children} 
                        depth={depth}
                        visited={newVisited}
                        sizing={sizing}
                    />
                )}
            </AnimatePresence>
        </div>
    );
});

// --- PROPERTY EXTRACTION ---
function extractNodeProperties(node) {
    const VALUE_FIELDS = ['val', 'value', 'data', 'key', 'item'];
    
    let value = '?';
    for (const field of VALUE_FIELDS) {
        if (node[field] !== undefined && node[field] !== null) {
            value = String(node[field]);
            break;
        }
    }

    let children = [];
    
    if (Array.isArray(node.children)) {
        children = node.children.slice(0, 10).map((child, idx) => ({ node: child, label: `${idx}` }));
    } else if ('left' in node || 'right' in node) {
        if (node.left !== undefined) children.push({ node: node.left, label: 'L' });
        if (node.right !== undefined) children.push({ node: node.right, label: 'R' });
    }

    const metadata = {
        color: node.color || null,
        weight: node.weight || null,
        height: node.height || null,
        isVisited: node.visited || false,
    };

    return { value, children, metadata, isLeaf: children.length === 0 };
}

// --- NODE CIRCLE (DYNAMIC SIZING) ---
const NodeCircle = memo(({ value, label, depth, isLeaf, metadata, sizing }) => {
    const style = getNodeStyle(isLeaf, metadata);

    return (
        <div className="relative z-20">
            <motion.div
                layout
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 25, 
                    delay: depth * 0.05
                }}
                className={`
                    rounded-full flex items-center justify-center 
                    border-[2px] shadow-lg relative backdrop-blur-sm transition-colors
                    bg-gradient-to-br ${style.gradient} ${style.border}
                `}
                style={{ width: sizing.nodeSize, height: sizing.nodeSize }}
            >
                <span className={`${sizing.fontSize} font-mono font-bold drop-shadow-md ${style.text}`}>
                    {value}
                </span>

                {label && (
                    <motion.div 
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`
                            absolute -top-2 left-1/2 -translate-x-1/2 
                            text-[8px] font-bold px-1 py-0.5 rounded border shadow-sm uppercase
                            ${style.badge}
                        `}
                    >
                        {label}
                    </motion.div>
                )}

                {metadata.weight !== null && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[7px] font-bold px-1 py-0.5 rounded bg-gray-900 text-gray-400 border border-gray-700">
                        {metadata.weight}
                    </div>
                )}
            </motion.div>
        </div>
    );
});

function getNodeStyle(isLeaf, metadata) {
    if (metadata.isVisited) {
        return {
            gradient: 'from-yellow-900/80 to-yellow-600/20',
            border: 'border-yellow-500',
            text: 'text-yellow-100',
            badge: 'bg-yellow-950 text-yellow-400 border-yellow-800'
        };
    }
    
    if (metadata.color === 'red') {
        return {
            gradient: 'from-red-900/80 to-red-600/20',
            border: 'border-red-500',
            text: 'text-red-100',
            badge: 'bg-red-950 text-red-400 border-red-800'
        };
    }
    
    if (isLeaf) {
        return {
            gradient: 'from-emerald-900/80 to-emerald-600/20',
            border: 'border-emerald-500',
            text: 'text-emerald-100',
            badge: 'bg-emerald-950 text-emerald-400 border-emerald-800'
        };
    }
    
    return {
        gradient: 'from-indigo-900/80 to-indigo-600/20',
        border: 'border-indigo-500',
        text: 'text-indigo-100',
        badge: 'bg-indigo-950 text-indigo-400 border-indigo-800'
    };
}

// --- CHILDREN CONTAINER ---
const ChildrenContainer = memo(({ children, depth, visited, sizing }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center"
        >
            <div className="w-full relative" style={{ height: sizing.gap, minWidth: `${children.length * sizing.gap * 1.5}px` }}>
                <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
                    {children.map((child, idx) => {
                        const xPos = ((idx + 1) / (children.length + 1)) * 100;
                        return (
                            <motion.path 
                                key={idx}
                                d={`M 50% 0 C 50% ${sizing.gap/2}, ${xPos}% ${sizing.gap/2}, ${xPos}% 100%`}
                                fill="none" 
                                stroke={child.node ? "#6366f1" : "#4b5563"}
                                strokeWidth="1.5" 
                                strokeOpacity={child.node ? "0.4" : "0.2"}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.4, delay: depth * 0.05 }}
                            />
                        );
                    })}
                </svg>
            </div>

            <div className="flex items-start pt-1" style={{ gap: sizing.gap }}>
                {children.map((child, idx) => (
                    <div key={idx}>
                        <TreeNode 
                            node={child.node} 
                            label={child.label} 
                            depth={depth + 1}
                            visited={visited}
                            sizing={sizing}
                        />
                    </div>
                ))}
            </div>
        </motion.div>
    );
});

// --- SPECIAL NODES ---
const CircularRefNode = memo(({ sizing }) => (
    <div 
        className="rounded-full border-2 border-orange-500 flex items-center justify-center bg-orange-900/20"
        style={{ width: sizing.nodeSize, height: sizing.nodeSize }}
    >
        <span className="text-xs font-bold text-orange-400">↻</span>
    </div>
));

const MaxDepthNode = memo(({ sizing }) => (
    <div 
        className="rounded-full border-2 border-yellow-500 flex items-center justify-center bg-yellow-900/20"
        style={{ width: sizing.nodeSize, height: sizing.nodeSize }}
    >
        <span className="text-[10px] font-bold text-yellow-400">···</span>
    </div>
));

export default TreeViz;













































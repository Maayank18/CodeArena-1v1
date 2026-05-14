import React, { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeColors } from './useThemeColors';

function calculateTreeDimensions(node, visited = new Set()) {
    if (!node || visited.has(node)) return { maxDepth: 0, maxWidth: 0 };
    visited.add(node);

    const left = node.left ? calculateTreeDimensions(node.left, visited) : { maxDepth: 0, maxWidth: 0 };
    const right = node.right ? calculateTreeDimensions(node.right, visited) : { maxDepth: 0, maxWidth: 0 };

    const children = node.children ? node.children.filter((c) => c).length : 0;
    const maxDepth = 1 + Math.max(left.maxDepth, right.maxDepth);
    const maxWidth = Math.max(left.maxWidth + right.maxWidth, children, 1);

    return { maxDepth, maxWidth };
}

function getOptimalSizing(maxDepth, maxWidth) {
    if (maxDepth <= 3) return { nodeSize: 40, gap: 44, fontSize: 'text-sm' };
    if (maxDepth <= 5) return { nodeSize: 34, gap: 38, fontSize: 'text-xs' };
    return { nodeSize: 28, gap: 32, fontSize: 'text-[10px]' };
}

const TreeViz = memo(({ data, name }) => {
    const colors = useThemeColors();
    const isLight = colors.bgPrimary === '#fafaf9';
    const { maxDepth, maxWidth } = useMemo(() => calculateTreeDimensions(data), [data]);
    const sizing = useMemo(() => getOptimalSizing(maxDepth, maxWidth), [maxDepth, maxWidth]);

    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
        return (
            <div
                className="w-full h-32 flex flex-col items-center justify-center border border-dashed rounded-lg"
                style={{
                    color: colors.textMuted,
                    borderColor: colors.borderStrong,
                    background: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(13,17,23,0.5)',
                }}
            >
                <span className="text-xs font-mono">Empty Tree</span>
            </div>
        );
    }

    return (
        <div
            className="relative w-full overflow-auto custom-scrollbar p-6 rounded-[28px] border flex flex-col items-center shadow-xl"
            style={{
                minHeight: `${Math.min(maxDepth * 80, 400)}px`,
                borderColor: colors.border,
                background: `linear-gradient(180deg, ${colors.bgSecondary} 0%, ${colors.bgPrimary} 100%)`,
                boxShadow: isLight
                    ? '0 20px 46px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255,255,255,0.85)'
                    : '0 18px 40px rgba(0,0,0,0.28)',
            }}
        >
            <div
                className="absolute top-2 left-2 px-2 py-1 rounded text-[10px] font-mono z-50"
                style={{
                    background: isLight ? 'rgba(192,132,252,0.14)' : 'rgba(88,28,135,0.30)',
                    border: `1px solid ${isLight ? 'rgba(147,51,234,0.28)' : 'rgba(168,85,247,0.30)'}`,
                    color: isLight ? '#7e22ce' : '#d8b4fe',
                }}
            >
                {name} <span className="ml-1" style={{ color: colors.textMuted }}>D:{maxDepth}</span>
            </div>

            <div className="relative z-10 scale-95">
                <TreeNode node={data} label="root" depth={0} visited={new Set()} sizing={sizing} isLight={isLight} />
            </div>
        </div>
    );
});

const TreeNode = memo(({ node, label, depth, visited, sizing, isLight }) => {
    if (visited.has(node)) return <CircularRefNode sizing={sizing} isLight={isLight} />;
    if (depth >= 8) return <MaxDepthNode sizing={sizing} isLight={isLight} />;
    if (!node) return null;

    const nodeProps = extractNodeProperties(node);
    const { value, children, metadata, isLeaf } = nodeProps;

    const newVisited = new Set(visited);
    newVisited.add(node);

    return (
        <div className="flex flex-col items-center">
            <NodeCircle value={value} label={label} depth={depth} isLeaf={isLeaf} metadata={metadata} sizing={sizing} isLight={isLight} />

            <AnimatePresence>
                {children.length > 0 && (
                    <ChildrenContainer children={children} depth={depth} visited={newVisited} sizing={sizing} isLight={isLight} />
                )}
            </AnimatePresence>
        </div>
    );
});

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

const NodeCircle = memo(({ value, label, depth, isLeaf, metadata, sizing, isLight }) => {
    const style = getNodeStyle(isLeaf, metadata, isLight);

    return (
        <div className="relative z-20">
            <motion.div
                layout
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                    delay: depth * 0.05,
                }}
                className={`rounded-full flex items-center justify-center border-[2px] shadow-lg relative backdrop-blur-sm transition-colors bg-gradient-to-br ${style.gradient} ${style.border}`}
                style={{ width: 'var(--vz-cell-size)', height: 'var(--vz-cell-size)' }}
            >
                <span className={`${sizing.fontSize} font-mono font-bold drop-shadow-md ${style.text}`}>
                    {value}
                </span>

                {label && (
                    <motion.div
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-bold px-1 py-0.5 rounded border shadow-sm uppercase ${style.badge}`}
                    >
                        {label}
                    </motion.div>
                )}

                {metadata.weight !== null && (
                    <div
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[7px] font-bold px-1 py-0.5 rounded border"
                        style={{
                            background: isLight ? 'rgba(255,255,255,0.94)' : '#111827',
                            color: isLight ? '#475569' : '#9ca3af',
                            borderColor: isLight ? '#cbd5e1' : '#374151',
                        }}
                    >
                        {metadata.weight}
                    </div>
                )}
            </motion.div>
        </div>
    );
});

function getNodeStyle(isLeaf, metadata, isLight) {
    if (metadata.isVisited) {
        return {
            gradient: isLight ? 'from-amber-100 to-yellow-50' : 'from-yellow-900/80 to-yellow-600/20',
            border: 'border-yellow-500',
            text: isLight ? 'text-amber-800' : 'text-yellow-100',
            badge: isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-yellow-950 text-yellow-400 border-yellow-800',
        };
    }

    if (metadata.color === 'red') {
        return {
            gradient: isLight ? 'from-rose-100 to-red-50' : 'from-red-900/80 to-red-600/20',
            border: 'border-red-500',
            text: isLight ? 'text-rose-700' : 'text-red-100',
            badge: isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-red-950 text-red-400 border-red-800',
        };
    }

    if (isLeaf) {
        return {
            gradient: isLight ? 'from-emerald-100 to-green-50' : 'from-emerald-900/80 to-emerald-600/20',
            border: 'border-emerald-500',
            text: isLight ? 'text-emerald-700' : 'text-emerald-100',
            badge: isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-950 text-emerald-400 border-emerald-800',
        };
    }

    return {
        gradient: isLight ? 'from-indigo-100 to-violet-50' : 'from-indigo-900/80 to-indigo-600/20',
        border: 'border-indigo-500',
        text: isLight ? 'text-indigo-700' : 'text-indigo-100',
        badge: isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-indigo-950 text-indigo-400 border-indigo-800',
    };
}

const ChildrenContainer = memo(({ children, depth, visited, sizing, isLight }) => {
    // Ultra-compact, elegant horizontal spacing
    const horizontalMultiplier = 0.9 + Math.max(0, (2 - depth) * 0.25);
    const containerWidth = children.length * sizing.gap * horizontalMultiplier;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center mt-1">
            <div className="relative" style={{ height: sizing.gap, minWidth: `${containerWidth}px` }}>
                <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
                    {children.map((child, idx) => {
                        const xPos = ((idx + 1) / (children.length + 1)) * 100;
                        return (
                            <motion.path
                                key={idx}
                                d={`M 50% 0 C 50% 50%, ${xPos}% 50%, ${xPos}% 100%`}
                                fill="none"
                                stroke={child.node ? (isLight ? '#6366f1' : '#818cf8') : (isLight ? '#94a3b8' : '#4b5563')}
                                strokeWidth="1.5"
                                strokeOpacity={child.node ? (isLight ? '0.55' : '0.4') : '0.2'}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.4, delay: depth * 0.05 }}
                            />
                        );
                    })}
                </svg>
            </div>

            <div className="flex items-start" style={{ gap: `${sizing.gap * 0.2}px` }}>
                {children.map((child, idx) => (
                    <div key={idx} style={{ padding: '0 2px' }}>
                        <TreeNode node={child.node} label={child.label} depth={depth + 1} visited={visited} sizing={sizing} isLight={isLight} />
                    </div>
                ))}
            </div>
        </motion.div>
    );
});

const CircularRefNode = memo(({ sizing, isLight }) => (
    <div
        className="rounded-full border-2 border-orange-500 flex items-center justify-center"
        style={{ width: sizing.nodeSize, height: sizing.nodeSize, background: isLight ? 'rgba(255, 237, 213, 0.96)' : 'rgba(154, 52, 18, 0.20)' }}
    >
        <span className="text-xs font-bold text-orange-400">LOOP</span>
    </div>
));

const MaxDepthNode = memo(({ sizing, isLight }) => (
    <div
        className="rounded-full border-2 border-yellow-500 flex items-center justify-center"
        style={{ width: sizing.nodeSize, height: sizing.nodeSize, background: isLight ? 'rgba(254, 249, 195, 0.96)' : 'rgba(113, 63, 18, 0.20)' }}
    >
        <span className="text-[10px] font-bold text-yellow-500">...</span>
    </div>
));

export default TreeViz;

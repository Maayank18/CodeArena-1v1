import React, { useMemo, memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Hash, AlertTriangle } from 'lucide-react';
import { useThemeColors } from './renderers/useThemeColors';

import ArrayViz            from './renderers/ArrayViz';
import StackViz            from './renderers/StackViz';
import QueueViz            from './renderers/QueueViz';
import TreeViz             from './renderers/TreeViz';
import MatrixViz           from './renderers/MatrixViz';
import LinkedListViz       from './renderers/LinkedListViz';
import DoublyLinkedListViz from './renderers/DoublyLinkedListViz';

// ─── Constants ────────────────────────────────────────────────────────────────

const BANNED_VARS = new Set([
    'window', 'global', 'globalThis', 'self', 'module', 'exports',
    'arguments', 'require', 'process', '__dirname', '__filename', 'console',
    '__snapshot', '__step',
]);

const POINTER_NAME_RE = /^(i|j|k|idx|index|left|right|mid|start|end|ptr|lo|hi|low|high|front|rear|top|l|r|p|q)$/i;

// ─── Shared Styles/Primitives ─────────────────────────────────────────────────

const COLOR_MAP = {
    blue:    { bg: 'rgba(96,165,250,0.08)',  text: '#60a5fa', border: 'rgba(96,165,250,0.25)'   },
    pink:    { bg: 'rgba(244,114,182,0.08)', text: '#f472b6', border: 'rgba(244,114,182,0.25)'  },
    emerald: { bg: 'rgba(52,211,153,0.08)',  text: '#34d399', border: 'rgba(52,211,153,0.25)'   },
    indigo:  { bg: 'rgba(129,140,248,0.08)', text: '#818cf8', border: 'rgba(129,140,248,0.25)'  },
    orange:  { bg: 'rgba(251,146,60,0.08)',  text: '#fb923c', border: 'rgba(251,146,60,0.25)'   },
    purple:  { bg: 'rgba(192,132,252,0.08)', text: '#c084fc', border: 'rgba(192,132,252,0.25)'  },
    teal:    { bg: 'rgba(45,212,191,0.08)',  text: '#2dd4bf', border: 'rgba(45,212,191,0.25)'   },
    yellow:  { bg: 'rgba(251,191,36,0.08)',  text: '#fbbf24', border: 'rgba(251,191,36,0.25)'   },
    rose:    { bg: 'rgba(251,113,133,0.08)', text: '#fb7185', border: 'rgba(251,113,133,0.25)'  },
    cyan:    { bg: 'rgba(34,211,238,0.08)',  text: '#22d3ee', border: 'rgba(34,211,238,0.25)'   },
    gray:    { bg: 'rgba(107,114,128,0.08)', text: '#9ca3af', border: 'rgba(107,114,128,0.25)'  },
};

const TypeBadge = ({ children, color = 'gray' }) => {
    const c = COLOR_MAP[color] || COLOR_MAP.gray;
    return (
        <span className="mb-3 px-2 py-0.5 rounded text-[10px] font-bold font-mono border uppercase tracking-wider"
            style={{ background: c.bg, color: c.text, borderColor: c.border }}>
            {children}
        </span>
    );
};

const Wrapper = ({ children, badge, color = 'blue' }) => (
    <div className="flex flex-col items-center">
        <TypeBadge color={color}>{badge}</TypeBadge>
        {children}
    </div>
);

// ─── Structure Detection ─────────────────────────────────────────────────────

function isLinkedListNode(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
    const keys = Object.keys(obj);
    const hasVal  = keys.some(k => ['val','value','data'].includes(k));
    const hasNext = keys.includes('next');
    return hasVal && hasNext;
}

function isTreeNode(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
    const keys = Object.keys(obj);
    const hasVal = keys.some(k => ['val','value','data','key'].includes(k));
    const hasLR  = keys.includes('left') || keys.includes('right');
    return hasVal && hasLR;
}

function isAdjacencyList(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
    const vals = Object.values(obj);
    return vals.length >= 2 && vals.every(v => Array.isArray(v));
}

// ─── Sub-Renderers ───────────────────────────────────────────────────────────

const GraphRenderer = memo(({ name, data }) => {
    const entries = Object.entries(data);
    const isWeighted = entries.some(([, nbrs]) => nbrs.some(n => typeof n === 'object' && n !== null));
    return (
        <div className="flex flex-col items-center">
            <TypeBadge color="cyan">Graph — {name}</TypeBadge>
            <div className="p-4 rounded-xl border font-mono text-xs min-w-[200px] shadow-lg overflow-auto"
                style={{ background: 'var(--vz-bg-secondary,#161b22)', borderColor: 'var(--vz-border,#30363d)', maxHeight: 260 }}>
                {entries.map(([node, nbrs]) => (
                    <div key={node} className="flex items-start gap-3 mb-2 last:mb-0">
                        <span className="font-bold px-2 py-0.5 rounded min-w-[2rem] text-center shrink-0"
                            style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)' }}>{node}</span>
                        <span style={{ color: 'var(--vz-text-muted,#8b949e)' }}>→</span>
                        <div className="flex flex-wrap gap-1.5">
                            {nbrs.length === 0 ? <span style={{ color: 'var(--vz-text-faint,#6e7681)' }}>∅</span> : nbrs.map((n, i) => (
                                <span key={i} className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}>
                                    {typeof n === 'object' && n !== null ? `${n.node ?? n.to ?? '?'}(${n.weight ?? n.cost ?? ''})` : String(n)}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

const ObjectRenderer = memo(({ name, value }) => {
    const json = useMemo(() => {
        try { return JSON.stringify(value, null, 2); } catch { return String(value); }
    }, [value]);
    return (
        <div className="flex flex-col items-center">
            <TypeBadge color="gray">Object — {name}</TypeBadge>
            <div className="p-4 rounded-xl border font-mono text-xs shadow-lg overflow-auto"
                style={{ background: 'var(--vz-bg-secondary,#161b22)', borderColor: 'var(--vz-border,#30363d)', color: 'var(--vz-text-primary,#e6edf3)', maxHeight: 240, maxWidth: 360 }}>
                <pre>{json}</pre>
            </div>
        </div>
    );
});

const MapRenderer = memo(({ name, data }) => (
    <div className="flex flex-col items-center">
        <TypeBadge color="yellow">Map — {name}</TypeBadge>
        <div className="flex flex-col gap-1 p-3 rounded-xl border min-w-[160px] shadow-lg"
            style={{ background: 'var(--vz-bg-secondary,#161b22)', borderColor: 'var(--vz-border,#30363d)' }}>
            {data.map(([k, v], i) => (
                <div key={i} className="flex justify-between gap-4 text-xs font-mono" style={{ borderBottom: i < data.length - 1 ? '1px solid var(--vz-border,#30363d)' : 'none', paddingBottom: 6, marginBottom: 6 }}>
                    <span style={{ color: '#60a5fa', fontWeight: 700 }}>{String(k)}</span>
                    <span style={{ color: '#34d399', fontWeight: 700 }}>{String(v)}</span>
                </div>
            ))}
        </div>
    </div>
));

const SetRenderer = memo(({ name, data }) => (
    <div className="flex flex-col items-center">
        <TypeBadge color="rose">Set — {name}</TypeBadge>
        <div className="flex flex-wrap gap-2 p-3 rounded-xl border max-w-[220px] justify-center shadow-lg"
            style={{ background: 'var(--vz-bg-secondary,#161b22)', borderColor: 'var(--vz-border,#30363d)' }}>
            {data.map((v, i) => (
                <span key={i} className="px-2 py-1 rounded text-xs font-mono" style={{ background: 'rgba(251,113,133,0.1)', color: '#fb7185', border: '1px solid rgba(251,113,133,0.25)' }}>{String(v)}</span>
            ))}
        </div>
    </div>
));

const CompactVariablePill = memo(({ name, value }) => (
    <motion.div layout initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="flex items-center rounded-lg overflow-hidden shadow-sm border"
        style={{ borderColor: 'var(--vz-border,#30363d)', background: 'var(--vz-bg-primary,#0d1117)' }}>
        <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider font-mono border-r"
            style={{ background: 'var(--vz-bg-secondary,#161b22)', color: 'var(--vz-text-muted,#8b949e)', borderColor: 'var(--vz-border,#30363d)' }}>{name}</div>
        <div className="px-3 py-1.5 text-sm font-mono font-bold tabular-nums" style={{ color: 'var(--vz-accent,#58a6ff)' }}>
            {value === null ? 'null' : value === undefined ? 'undef' : String(value)}
        </div>
    </motion.div>
));

const InfoCard = ({ name, label }) => (
    <div className="p-4 rounded-xl border flex flex-col items-center gap-2 shadow-lg"
        style={{ background: 'rgba(251,146,60,0.08)', borderColor: 'rgba(251,146,60,0.3)', color: '#fb923c' }}>
        <AlertTriangle size={14} />
        <span className="font-bold text-xs font-mono">{label}</span>
    </div>
);

const EmptyState = () => (
    <div className="h-full flex flex-col items-center justify-center gap-4 select-none opacity-50">
        <Activity size={56} strokeWidth={1} className="animate-pulse" />
        <p className="font-medium">Ready to Visualize</p>
    </div>
);

const NoVarsState = () => (
    <div className="h-full flex flex-col items-center justify-center gap-3 select-none opacity-40">
        <Hash size={44} strokeWidth={1} />
        <p className="text-sm font-mono">No variables in current scope</p>
    </div>
);

// ─── Intelligent Router ──────────────────────────────────────────────────────

const ComplexRenderer = memo(({ name, value, pointers }) => {
    const lower = name.toLowerCase();
    if (value === null) return null;
    if (value === '[Circular]') return <InfoCard name={name} label="Circular Ref" />;
    if (value?.type === 'Map') return <MapRenderer name={name} data={value.entries ?? []} />;
    if (value?.type === 'Set') return <SetRenderer name={name} data={value.values  ?? []} />;

    if (Array.isArray(value)) {
        if (value.length === 0) return <TypeBadge color="blue">Empty Array — {name}</TypeBadge>;
        const isMatrix = Array.isArray(value[0]) && value[0].length > 0;
        if (/heap|priority|pq|minheap|maxheap/i.test(name)) return <Wrapper badge="Heap" color="orange"><ArrayViz data={value} pointers={pointers} /></Wrapper>;
        if (/stack/i.test(name)) return <Wrapper badge="Stack" color="pink"><StackViz data={value} pointers={pointers} /></Wrapper>;
        if (/queue|deque/i.test(name) || lower === 'q') return <Wrapper badge="Queue" color="emerald"><QueueViz data={value} pointers={pointers} /></Wrapper>;
        if (isMatrix) return <Wrapper badge="Matrix" color="indigo"><MatrixViz data={value} pointers={pointers} /></Wrapper>;
        return <Wrapper badge="Array" color="blue"><ArrayViz data={value} pointers={pointers} /></Wrapper>;
    }

    if (typeof value === 'object') {
        const keys = Object.keys(value);
        if (isAdjacencyList(value)) return <GraphRenderer name={name} data={value} />;
        if (keys.includes('stack') && Array.isArray(value.stack)) return <Wrapper badge="Stack (OOP)" color="pink"><StackViz data={value.stack} pointers={pointers} /></Wrapper>;
        const qArr = value.queue || value.items;
        if (Array.isArray(qArr)) return <Wrapper badge="Queue (OOP)" color="emerald"><QueueViz data={qArr} pointers={pointers} /></Wrapper>;
        if (keys.includes('head') && isLinkedListNode(value.head)) return <ComplexRenderer name={name} value={value.head} pointers={pointers} />;
        if (isTreeNode(value)) return <Wrapper badge="Binary Tree" color="purple"><TreeViz data={value} name={name} /></Wrapper>;
        if (isLinkedListNode(value) && keys.includes('prev')) return <Wrapper badge="DLL" color="orange"><DoublyLinkedListViz data={value} name={name} /></Wrapper>;
        if (isLinkedListNode(value)) return <Wrapper badge="Linked List" color="teal"><LinkedListViz data={value} name={name} /></Wrapper>;
        return <ObjectRenderer name={name} value={value} />;
    }
    return null;
});

// ─── Main Canvas ─────────────────────────────────────────────────────────────

const VizCanvas = memo(({ variables }) => {
    const colors = useThemeColors();
    const isLight = colors.bgPrimary === '#fafaf9';

    const { complexVars, simpleVars, pointers, isEmpty } = useMemo(() => {
        if (!variables) return { complexVars: [], simpleVars: [], pointers: {}, isEmpty: true };
        const complex = [];
        const simple = [];
        const ptrs = {};
        const complexIds = new Set();
        const entries = Object.entries(variables);

        entries.forEach(([name, value]) => {
            if (BANNED_VARS.has(name) && name !== 'this') return;
            if (name.startsWith('__')) return;
            if (typeof value === 'function' || typeof value === 'symbol') return;

            const isPrimitive = value === null || value === undefined || typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean' || typeof value === 'bigint';

            if (isPrimitive) {
                simple.push([name, value]);
                if (Number.isInteger(value) && value >= 0 && value < 10000 && POINTER_NAME_RE.test(name)) ptrs[name] = value;
            } else if (name !== 'this') {
                complex.push([name, value]);
                if (value && value.__id) complexIds.add(value.__id);
            }
        });

        const thisVal = variables['this'];
        if (thisVal && typeof thisVal === 'object' && !Array.isArray(thisVal)) {
            if (!thisVal.__id || !complexIds.has(thisVal.__id)) complex.push(['Active Object', thisVal]);
        }

        // ── Single Renderer Isolation Logic ──
        // To prevent mixing multiple render modes (e.g., Array boxes alongside a Tree),
        // we categorize the complex variables and choose ONLY ONE canonical renderer mode.
        const treeVars = [];
        const graphVars = [];
        const linkedListVars = [];
        const arrayVars = [];
        const fallbackVars = [];

        complex.forEach(([name, value]) => {
            if (isTreeNode(value)) treeVars.push([name, value]);
            else if (isAdjacencyList(value)) graphVars.push([name, value]);
            else if (isLinkedListNode(value) || (value && value.head && isLinkedListNode(value.head))) linkedListVars.push([name, value]);
            else if (Array.isArray(value) || (value && value.stack) || (value && (value.queue || value.items))) arrayVars.push([name, value]);
            else fallbackVars.push([name, value]);
        });

        // Determine the canonical renderer mode strictly in priority order
        let activeComplexVars = [];
        if (graphVars.length > 0) activeComplexVars = graphVars;
        else if (treeVars.length > 0) activeComplexVars = treeVars;
        else if (linkedListVars.length > 0) activeComplexVars = linkedListVars;
        else if (arrayVars.length > 0) activeComplexVars = arrayVars;
        else activeComplexVars = fallbackVars;

        return { complexVars: activeComplexVars, simpleVars: simple, pointers: ptrs, isEmpty: activeComplexVars.length === 0 && simple.length === 0 };
    }, [variables]);

    if (!variables) return <EmptyState />;
    if (isEmpty) return <NoVarsState />;

    return (
        <div className="viz-canvas flex flex-col h-full w-full overflow-hidden relative"
             style={{ background: isLight ? 'linear-gradient(180deg, #ffffff 0%, #f8fafc 55%, #f1f5f9 100%)' : 'var(--vz-bg-primary, #0d1117)' }}>
            <div className="flex-1 overflow-auto relative z-10" style={{ padding: '20px' }}>
                <div className="flex flex-wrap justify-center items-start gap-8 content-start min-h-full">
                    <AnimatePresence mode="popLayout">
                        {complexVars.map(([name, value]) => (
                            <motion.div key={name} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        style={{ maxWidth: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <ComplexRenderer name={name} value={value} pointers={pointers} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {complexVars.length === 0 && simpleVars.length > 0 && (
                        <div className="flex flex-col items-center justify-center mt-16 opacity-30 w-full"><Activity size={40} /><p className="mt-3 text-xs font-mono">Tracking Primitives Below</p></div>
                    )}
                </div>
            </div>
            {simpleVars.length > 0 && (
                <div className="w-full shrink-0 z-30 p-4 border-t" style={{ background: isLight ? 'rgba(255,255,255,0.9)' : 'var(--vz-bg-secondary, #161b22)', borderColor: 'var(--vz-border, #30363d)' }}>
                    <div className="flex flex-wrap gap-2 justify-center items-center">
                        <AnimatePresence mode="popLayout">
                            {simpleVars.map(([name, value]) => <CompactVariablePill key={name} name={name} value={value} />)}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
});

export default VizCanvas;

// Version-2.0
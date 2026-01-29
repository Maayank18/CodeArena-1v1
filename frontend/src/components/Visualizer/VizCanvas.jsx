// import React, { useMemo, memo } from 'react';
// import { AnimatePresence, motion } from 'framer-motion';
// import { Activity, Hash, Layers, Braces } from 'lucide-react';

// // --- RENDERERS ---
// import ArrayViz from './renderers/ArrayViz';
// import StackViz from './renderers/StackViz'; 
// import QueueViz from './renderers/QueueViz'; 
// // import GraphViz from './renderers/GraphViz'; 
// import TreeViz from './renderers/TreeViz';
// import MatrixViz from './renderers/MatrixViz';
// import LinkedListViz from './renderers/LinkedListViz';
// import DoublyLinkedListViz from './renderers/DoublyLinkedListViz'; // ✅ ADDED

// // System variables to hide from visualization (Expanded for safety)
// const BANNED_VARS = [
//     'this', 'window', 'global', 'self', 'module', 'exports', 'arguments', 
//     'require', 'process', '__dirname', '__filename', 'console'
// ];

// const VizCanvas = memo(({ variables }) => {
    
//     // 🧠 1. SMART CLASSIFICATION ENGINE (Memoized)
//     const { complexVars, simpleVars, pointers, isEmpty } = useMemo(() => {
//         if (!variables) return { complexVars: [], simpleVars: [], pointers: {}, isEmpty: true };

//         const complex = [];
//         const simple = [];
//         const ptrs = {};

//         Object.entries(variables).forEach(([name, value]) => {
//             if (BANNED_VARS.includes(name)) return;
//             if (typeof value === 'function' || typeof value === 'symbol') return;

//             // Detect Pointers (Integers used as indices)
//             if (Number.isInteger(value) && value >= 0 && value < 1000) {
//                 ptrs[name] = value;
//             }

//             // Detect Primitive Types
//             const isPrimitive = (
//                 value === null || 
//                 value === undefined || 
//                 typeof value === 'number' || 
//                 typeof value === 'string' || 
//                 typeof value === 'boolean' ||
//                 value === 'NaN' || 
//                 value === 'Infinity' || 
//                 value === '-Infinity'
//             );

//             // Detect Backend Special Types (Map/Set)
//             const isSpecialStruct = value && typeof value === 'object' && (value.type === 'Map' || value.type === 'Set');

//             if (isPrimitive) {
//                 simple.push([name, value]);
//             } else if (isSpecialStruct) {
//                 complex.push([name, value]);
//             } else {
//                 complex.push([name, value]);
//             }
//         });

//         return { 
//             complexVars: complex, 
//             simpleVars: simple, 
//             pointers: ptrs,
//             isEmpty: complex.length === 0 && simple.length === 0
//         };
//     }, [variables]);

//     // 2. EMPTY STATE
//     if (!variables) return <EmptyState />;
//     if (isEmpty) return <NoVarsState />;

//     return (
//         <div className="flex flex-col h-full w-full overflow-hidden bg-[#0d1117] relative">
            
//             {/* --- TOP: MAIN STAGE (Complex Structures) --- */}
//             <div className="flex-1 p-8 overflow-auto custom-scrollbar">
//                 <div className="flex flex-wrap justify-center items-start gap-12 content-start min-h-full">
//                     <AnimatePresence mode='popLayout'>
//                         {complexVars.map(([name, value]) => (
//                             <motion.div 
//                                 key={name} 
//                                 layout
//                                 initial={{ opacity: 0, scale: 0.9 }}
//                                 animate={{ opacity: 1, scale: 1 }}
//                                 exit={{ opacity: 0, scale: 0.9 }}
//                                 transition={{ duration: 0.3 }}
//                                 className="flex flex-col items-center min-w-min"
//                             >
//                                 <ComplexRenderer name={name} value={value} pointers={pointers} />
//                             </motion.div>
//                         ))}
//                     </AnimatePresence>

//                     {/* Hint if only primitives exist */}
//                     {complexVars.length === 0 && simpleVars.length > 0 && (
//                         <div className="flex flex-col items-center justify-center h-full w-full text-gray-600 opacity-40 mt-20">
//                             <Activity size={48} />
//                             <p className="mt-4 text-sm font-mono">Tracking Primitive Values Below</p>
//                         </div>
//                     )}
//                 </div>
//             </div>

//             {/* --- BOTTOM: VARIABLE PILLS (Primitives) --- */}
//             {simpleVars.length > 0 && (
//                 <div className="w-full px-6 py-4 border-t border-gray-800 bg-[#161b22]/95 backdrop-blur-md shrink-0 z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
//                     <div className="flex flex-wrap gap-4 justify-center items-center">
//                         <AnimatePresence mode='popLayout'>
//                             {simpleVars.map(([name, value]) => (
//                                 <CompactVariablePill key={name} name={name} value={value} />
//                             ))}
//                         </AnimatePresence>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// });

// // 🧠 LOGIC: INTELLIGENT ROUTER
// const ComplexRenderer = memo(({ name, value, pointers }) => {
//     const lowerName = name.toLowerCase();

//     // 0. HANDLE SAFETY MARKERS
//     if (value === '[Circular]') return <InfoCard name={name} label="Circular Ref" icon={<Activity size={14}/>} color="orange" />;

//     // 1. HANDLE SPECIAL BACKEND TYPES (Map / Set)
//     if (value?.type === 'Map') return <MapRenderer name={name} data={value.entries} />;
//     if (value?.type === 'Set') return <SetRenderer name={name} data={value.values} />;

//     // 2. ARRAYS & MATRICES
//     if (Array.isArray(value)) {
//         if (value.length === 0) return <Header badge="Empty Array" name={name} />;
        
//         const isMatrix = Array.isArray(value[0]);

//         // Specific Data Structures by Naming Convention
//         if (lowerName.includes('stack')) return <Wrapper badge="Stack (LIFO)" color="pink"><StackViz data={value} pointers={pointers} /></Wrapper>;
//         if (lowerName.includes('queue') || lowerName === 'q') return <Wrapper badge="Queue (FIFO)" color="emerald"><QueueViz data={value} pointers={pointers} /></Wrapper>;
        
//         // Grid/Graph Detection (Matrix + Naming)
//         // Note: GraphViz is currently commented out in imports, so we use MatrixViz fallback or you can uncomment GraphViz above if needed.
//         if (isMatrix && (lowerName.includes('grid') || lowerName.includes('board') || lowerName.includes('maze') || lowerName.includes('graph'))) {
//              // return <Wrapper badge="Weighted Grid" color="indigo"><GraphViz data={value} pointers={pointers} /></Wrapper>;
//              return <Wrapper badge={`Grid ${value.length}×${value[0].length}`} color="indigo"><MatrixViz data={value} pointers={pointers} /></Wrapper>;
//         }

//         // Standard Matrix vs Array
//         if (isMatrix) return <Wrapper badge={`Matrix ${value.length}×${value[0].length}`} color="orange"><MatrixViz data={value} pointers={pointers} /></Wrapper>;
        
//         return <Wrapper badge="Array" color="blue"><ArrayViz data={value} pointers={pointers} /></Wrapper>;
//     }

//     // 3. OBJECTS (Trees, Linked Lists, Wrappers)
//     if (typeof value === 'object' && value !== null) {
//         const keys = Object.keys(value);

//         // ✅ NEW: Auto-Unwrap Wrapper Classes (e.g. "new DoublyLinkedList()")
//         // If an object has a 'head' property that looks like a node, render that instead of the wrapper object
//         if (keys.includes('head') && value.head && typeof value.head === 'object') {
//              return <ComplexRenderer name={name} value={value.head} pointers={pointers} />;
//         }

//         // Heuristic Checks
//         const hasNext = keys.includes('next');
//         const hasPrev = keys.includes('prev'); // ✅ Check for DLL
//         const hasLeftRight = keys.includes('left') || keys.includes('right');
//         const hasVal = keys.includes('val') || keys.includes('value') || keys.includes('data');
        
//         // Tree
//         if (hasLeftRight && hasVal) return <Wrapper badge="Binary Tree" color="purple"><TreeViz data={value} name={name} /></Wrapper>;
        
//         // ✅ DLL Detection
//         if (hasNext && hasPrev && hasVal) return <Wrapper badge="Doubly Linked List" color="orange"><DoublyLinkedListViz data={value} name={name} /></Wrapper>;

//         // SLL Detection
//         if (hasNext && hasVal) return <Wrapper badge="Linked List" color="teal"><LinkedListViz data={value} name={name} /></Wrapper>;

//         // Fallback: Generic JSON Object
//         return (
//             <div className="flex flex-col items-center">
//                 <Header badge="Object" name={name} />
//                 <div className="bg-[#161b22] p-4 rounded-xl border border-gray-800 font-mono text-xs text-gray-300 min-w-[180px] shadow-lg">
//                     <pre className="custom-scrollbar overflow-auto max-h-48">
//                         {JSON.stringify(value, null, 2)}
//                     </pre>
//                 </div>
//             </div>
//         );
//     }

//     return null;
// });

// // --- SPECIALIZED SUB-RENDERERS ---

// const MapRenderer = ({ name, data }) => (
//     <div className="flex flex-col items-center">
//         <Header badge="Map" badgeColor="text-yellow-400 bg-yellow-400/10 border-yellow-400/20" name={name} meta={`size: ${data.length}`} />
//         <div className="flex flex-col gap-1 bg-[#161b22] p-3 rounded-xl border border-gray-800 min-w-[160px] shadow-lg">
//             {data.map(([k, v], i) => (
//                 <div key={i} className="flex justify-between gap-4 text-xs font-mono border-b border-gray-800 last:border-0 pb-1.5 mb-1.5 last:pb-0 last:mb-0">
//                     <span className="text-blue-400 font-bold">{String(k)}</span>
//                     <span className="text-gray-600">→</span>
//                     <span className="text-emerald-400 font-bold">{String(v)}</span>
//                 </div>
//             ))}
//             {data.length === 0 && <span className="text-gray-600 italic text-xs text-center">Empty</span>}
//         </div>
//     </div>
// );

// const SetRenderer = ({ name, data }) => (
//     <div className="flex flex-col items-center">
//         <Header badge="Set" badgeColor="text-rose-400 bg-rose-400/10 border-rose-400/20" name={name} meta={`size: ${data.length}`} />
//         <div className="flex flex-wrap gap-2 bg-[#161b22] p-3 rounded-xl border border-gray-800 max-w-[200px] justify-center shadow-lg">
//             {data.map((v, i) => (
//                 <span key={i} className="px-2 py-1 bg-gray-800 rounded text-xs text-rose-300 font-mono border border-gray-700 shadow-sm">
//                     {String(v)}
//                 </span>
//             ))}
//             {data.length === 0 && <span className="text-gray-600 italic text-xs">Empty</span>}
//         </div>
//     </div>
// );

// // --- UTILITY COMPONENTS ---

// const Wrapper = ({ children, badge, color = "blue" }) => {
//     const colors = {
//         pink: "text-pink-400 bg-pink-400/10 border-pink-400/20",
//         emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
//         indigo: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
//         orange: "text-orange-400 bg-orange-400/10 border-orange-400/20",
//         blue: "text-blue-400 bg-blue-400/10 border-blue-400/20",
//         purple: "text-purple-400 bg-purple-400/10 border-purple-400/20",
//         teal: "text-teal-400 bg-teal-400/10 border-teal-400/20",
//     };

//     return (
//         <div className="flex flex-col items-center">
//             <div className={`mb-3 px-2 py-0.5 rounded text-[10px] font-bold font-mono border uppercase tracking-wider ${colors[color]}`}>
//                 {badge}
//             </div>
//             {children}
//             <span className="mt-2 text-xs font-mono font-bold text-gray-500">{/* Name label moved to children usually, or handled by header */}</span>
//         </div>
//     );
// };

// const CompactVariablePill = memo(({ name, value }) => (
//     <motion.div 
//         layout 
//         initial={{ scale: 0.9, opacity: 0 }} 
//         animate={{ scale: 1, opacity: 1 }} 
//         className="flex items-center bg-[#0d1117] border border-gray-700 rounded-lg overflow-hidden shadow-sm group hover:border-gray-500 transition-colors"
//     >
//         <div className="bg-[#161b22] px-2.5 py-1.5 text-[10px] font-bold text-gray-400 border-r border-gray-700 uppercase tracking-wider group-hover:text-gray-300">
//             {name}
//         </div>
//         <div className="px-3 py-1.5 text-sm font-mono font-bold text-blue-400 tabular-nums">
//             {value === null ? 'null' : String(value)}
//         </div>
//     </motion.div>
// ));

// const Header = ({ badge, badgeColor, name, meta }) => (
//     <div className="flex items-center gap-2 mb-3">
//         <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono border ${badgeColor || 'bg-gray-800 text-gray-400 border-gray-700'}`}>
//             {badge}
//         </span>
//         <span className="text-gray-200 font-bold text-sm font-mono">{name}</span>
//         {meta && <span className="text-gray-600 text-[10px] font-mono border-l border-gray-700 pl-2">{meta}</span>}
//     </div>
// );

// const InfoCard = ({ name, label, icon, color }) => (
//     <div className={`p-4 rounded-xl border flex flex-col items-center gap-2 shadow-lg bg-${color}-900/10 border-${color}-500/30 text-${color}-400`}>
//         {icon}
//         <span className="font-bold text-xs font-mono">{label}</span>
//         <span className="text-[10px] opacity-70">{name}</span>
//     </div>
// );

// const EmptyState = () => (
//     <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-4 select-none">
//         <Activity size={64} strokeWidth={1} className="opacity-20 animate-pulse" />
//         <div className="text-center">
//             <p className="font-medium text-gray-400">Ready to Visualize</p>
//             <p className="text-sm opacity-50 mt-1">Run code to see memory trace</p>
//         </div>
//     </div>
// );

// const NoVarsState = () => (
//     <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-3 select-none">
//         <Hash size={48} strokeWidth={1} className="opacity-20" />
//         <p className="text-sm font-mono opacity-60">No variables in current scope</p>
//     </div>
// );

// export default VizCanvas;













import React, { useMemo, memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Hash, Layers, Braces } from 'lucide-react';

// --- RENDERERS ---
import ArrayViz from './renderers/ArrayViz';
import StackViz from './renderers/StackViz'; 
import QueueViz from './renderers/QueueViz'; 
// import GraphViz from './renderers/GraphViz'; 
import TreeViz from './renderers/TreeViz';
import MatrixViz from './renderers/MatrixViz';
import LinkedListViz from './renderers/LinkedListViz';
import DoublyLinkedListViz from './renderers/DoublyLinkedListViz'; // ✅ IMPORTED

const BANNED_VARS = [
    'this', 'window', 'global', 'self', 'module', 'exports', 'arguments', 
    'require', 'process', '__dirname', '__filename', 'console'
];

const VizCanvas = memo(({ variables }) => {
    
    // 🧠 SMART CLASSIFICATION ENGINE
    const { complexVars, simpleVars, pointers, isEmpty } = useMemo(() => {
        if (!variables) return { complexVars: [], simpleVars: [], pointers: {}, isEmpty: true };

        const complex = [];
        const simple = [];
        const ptrs = {};

        Object.entries(variables).forEach(([name, value]) => {
            if (BANNED_VARS.includes(name)) return;
            if (typeof value === 'function' || typeof value === 'symbol') return;

            if (Number.isInteger(value) && value >= 0 && value < 1000) {
                ptrs[name] = value;
            }

            const isPrimitive = (
                value === null || value === undefined || 
                typeof value === 'number' || typeof value === 'string' || 
                typeof value === 'boolean' || value === 'NaN' || 
                value === 'Infinity' || value === '-Infinity'
            );

            const isSpecialStruct = value && typeof value === 'object' && (value.type === 'Map' || value.type === 'Set');

            if (isPrimitive) {
                simple.push([name, value]);
            } else if (isSpecialStruct) {
                complex.push([name, value]);
            } else {
                complex.push([name, value]);
            }
        });

        return { complexVars: complex, simpleVars: simple, pointers: ptrs, isEmpty: complex.length === 0 && simple.length === 0 };
    }, [variables]);

    if (!variables) return <EmptyState />;
    if (isEmpty) return <NoVarsState />;

    return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-[#0d1117] relative">
            <div className="flex-1 p-8 overflow-auto custom-scrollbar">
                <div className="flex flex-wrap justify-center items-start gap-12 content-start min-h-full">
                    <AnimatePresence mode='popLayout'>
                        {complexVars.map(([name, value]) => (
                            <motion.div 
                                key={name} 
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                                className="flex flex-col items-center min-w-min"
                            >
                                <ComplexRenderer name={name} value={value} pointers={pointers} />
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {complexVars.length === 0 && simpleVars.length > 0 && (
                        <div className="flex flex-col items-center justify-center h-full w-full text-gray-600 opacity-40 mt-20">
                            <Activity size={48} />
                            <p className="mt-4 text-sm font-mono">Tracking Primitive Values Below</p>
                        </div>
                    )}
                </div>
            </div>

            {simpleVars.length > 0 && (
                <div className="w-full px-6 py-4 border-t border-gray-800 bg-[#161b22]/95 backdrop-blur-md shrink-0 z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
                    <div className="flex flex-wrap gap-4 justify-center items-center">
                        <AnimatePresence mode='popLayout'>
                            {simpleVars.map(([name, value]) => (
                                <CompactVariablePill key={name} name={name} value={value} />
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
});

// 🧠 LOGIC: INTELLIGENT ROUTER
const ComplexRenderer = memo(({ name, value, pointers }) => {
    const lowerName = name.toLowerCase();

    if (value === '[Circular]') return <InfoCard name={name} label="Circular Ref" icon={<Activity size={14}/>} color="orange" />;
    if (value?.type === 'Map') return <MapRenderer name={name} data={value.entries} />;
    if (value?.type === 'Set') return <SetRenderer name={name} data={value.values} />;

    if (Array.isArray(value)) {
        if (value.length === 0) return <Header badge="Empty Array" name={name} />;
        const isMatrix = Array.isArray(value[0]);

        if (lowerName.includes('stack')) return <Wrapper badge="Stack (LIFO)" color="pink"><StackViz data={value} pointers={pointers} /></Wrapper>;
        if (lowerName.includes('queue') || lowerName === 'q') return <Wrapper badge="Queue (FIFO)" color="emerald"><QueueViz data={value} pointers={pointers} /></Wrapper>;
        
        if (isMatrix && (lowerName.includes('grid') || lowerName.includes('board') || lowerName.includes('maze') || lowerName.includes('graph'))) {
             return <Wrapper badge={`Grid ${value.length}×${value[0].length}`} color="indigo"><MatrixViz data={value} pointers={pointers} /></Wrapper>;
        }
        if (isMatrix) return <Wrapper badge={`Matrix ${value.length}×${value[0].length}`} color="orange"><MatrixViz data={value} pointers={pointers} /></Wrapper>;
        
        return <Wrapper badge="Array" color="blue"><ArrayViz data={value} pointers={pointers} /></Wrapper>;
    }

    if (typeof value === 'object' && value !== null) {
        const keys = Object.keys(value);

        // ✅ AUTO-UNWRAP: This is the secret to a clean display
        // It drills down into 'list.head' and visualizes that, instead of the wrapper object
        if (keys.includes('head') && value.head && typeof value.head === 'object') {
             return <ComplexRenderer name={name} value={value.head} pointers={pointers} />;
        }

        const hasNext = keys.includes('next');
        const hasPrev = keys.includes('prev'); 
        const hasLeftRight = keys.includes('left') || keys.includes('right');
        const hasVal = keys.includes('val') || keys.includes('value') || keys.includes('data');
        
        if (hasLeftRight && hasVal) return <Wrapper badge="Binary Tree" color="purple"><TreeViz data={value} name={name} /></Wrapper>;
        if (hasNext && hasPrev && hasVal) return <Wrapper badge="Doubly Linked List" color="orange"><DoublyLinkedListViz data={value} name={name} /></Wrapper>;
        if (hasNext && hasVal) return <Wrapper badge="Linked List" color="teal"><LinkedListViz data={value} name={name} /></Wrapper>;

        return (
            <div className="flex flex-col items-center">
                <Header badge="Object" name={name} />
                <div className="bg-[#161b22] p-4 rounded-xl border border-gray-800 font-mono text-xs text-gray-300 min-w-[180px] shadow-lg">
                    <pre className="custom-scrollbar overflow-auto max-h-48">
                        {JSON.stringify(value, null, 2)}
                    </pre>
                </div>
            </div>
        );
    }
    return null;
});

// ... Sub-renderers (MapRenderer, SetRenderer, Wrapper, CompactVariablePill, Header, InfoCard, EmptyState, NoVarsState) are standard ...
// Ensure you include them from the previous complete snippet

const MapRenderer = ({ name, data }) => (
    <div className="flex flex-col items-center">
        <Header badge="Map" badgeColor="text-yellow-400 bg-yellow-400/10 border-yellow-400/20" name={name} meta={`size: ${data.length}`} />
        <div className="flex flex-col gap-1 bg-[#161b22] p-3 rounded-xl border border-gray-800 min-w-[160px] shadow-lg">
            {data.map(([k, v], i) => (
                <div key={i} className="flex justify-between gap-4 text-xs font-mono border-b border-gray-800 last:border-0 pb-1.5 mb-1.5 last:pb-0 last:mb-0">
                    <span className="text-blue-400 font-bold">{String(k)}</span>
                    <span className="text-gray-600">→</span>
                    <span className="text-emerald-400 font-bold">{String(v)}</span>
                </div>
            ))}
            {data.length === 0 && <span className="text-gray-600 italic text-xs text-center">Empty</span>}
        </div>
    </div>
);

const SetRenderer = ({ name, data }) => (
    <div className="flex flex-col items-center">
        <Header badge="Set" badgeColor="text-rose-400 bg-rose-400/10 border-rose-400/20" name={name} meta={`size: ${data.length}`} />
        <div className="flex flex-wrap gap-2 bg-[#161b22] p-3 rounded-xl border border-gray-800 max-w-[200px] justify-center shadow-lg">
            {data.map((v, i) => (
                <span key={i} className="px-2 py-1 bg-gray-800 rounded text-xs text-rose-300 font-mono border border-gray-700 shadow-sm">
                    {String(v)}
                </span>
            ))}
            {data.length === 0 && <span className="text-gray-600 italic text-xs">Empty</span>}
        </div>
    </div>
);

const Wrapper = ({ children, badge, color = "blue" }) => {
    const colors = {
        pink: "text-pink-400 bg-pink-400/10 border-pink-400/20",
        emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
        indigo: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
        orange: "text-orange-400 bg-orange-400/10 border-orange-400/20",
        blue: "text-blue-400 bg-blue-400/10 border-blue-400/20",
        purple: "text-purple-400 bg-purple-400/10 border-purple-400/20",
        teal: "text-teal-400 bg-teal-400/10 border-teal-400/20",
    };

    return (
        <div className="flex flex-col items-center">
            <div className={`mb-3 px-2 py-0.5 rounded text-[10px] font-bold font-mono border uppercase tracking-wider ${colors[color]}`}>
                {badge}
            </div>
            {children}
            <span className="mt-2 text-xs font-mono font-bold text-gray-500">{/* Name label moved to children usually, or handled by header */}</span>
        </div>
    );
};

const CompactVariablePill = memo(({ name, value }) => (
    <motion.div 
        layout 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="flex items-center bg-[#0d1117] border border-gray-700 rounded-lg overflow-hidden shadow-sm group hover:border-gray-500 transition-colors"
    >
        <div className="bg-[#161b22] px-2.5 py-1.5 text-[10px] font-bold text-gray-400 border-r border-gray-700 uppercase tracking-wider group-hover:text-gray-300">
            {name}
        </div>
        <div className="px-3 py-1.5 text-sm font-mono font-bold text-blue-400 tabular-nums">
            {value === null ? 'null' : String(value)}
        </div>
    </motion.div>
));

const Header = ({ badge, badgeColor, name, meta }) => (
    <div className="flex items-center gap-2 mb-3">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono border ${badgeColor || 'bg-gray-800 text-gray-400 border-gray-700'}`}>
            {badge}
        </span>
        <span className="text-gray-200 font-bold text-sm font-mono">{name}</span>
        {meta && <span className="text-gray-600 text-[10px] font-mono border-l border-gray-700 pl-2">{meta}</span>}
    </div>
);

const InfoCard = ({ name, label, icon, color }) => (
    <div className={`p-4 rounded-xl border flex flex-col items-center gap-2 shadow-lg bg-${color}-900/10 border-${color}-500/30 text-${color}-400`}>
        {icon}
        <span className="font-bold text-xs font-mono">{label}</span>
        <span className="text-[10px] opacity-70">{name}</span>
    </div>
);

const EmptyState = () => (
    <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-4 select-none">
        <Activity size={64} strokeWidth={1} className="opacity-20 animate-pulse" />
        <div className="text-center">
            <p className="font-medium text-gray-400">Ready to Visualize</p>
            <p className="text-sm opacity-50 mt-1">Run code to see memory trace</p>
        </div>
    </div>
);

const NoVarsState = () => (
    <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-3 select-none">
        <Hash size={48} strokeWidth={1} className="opacity-20" />
        <p className="text-sm font-mono opacity-60">No variables in current scope</p>
    </div>
);

export default VizCanvas;
// import React, { useMemo, memo } from 'react';
// import { AnimatePresence, motion } from 'framer-motion';
// import { Activity, Hash } from 'lucide-react';

// // --- RENDERERS ---
// import ArrayViz from './renderers/ArrayViz';
// import StackViz from './renderers/StackViz'; 
// import QueueViz from './renderers/QueueViz'; 
// import TreeViz from './renderers/TreeViz';
// import MatrixViz from './renderers/MatrixViz';
// import LinkedListViz from './renderers/LinkedListViz';
// import DoublyLinkedListViz from './renderers/DoublyLinkedListViz';

// const BANNED_VARS = [
//     'this', 'window', 'global', 'self', 'module', 'exports', 'arguments', 
//     'require', 'process', '__dirname', '__filename', 'console'
// ];

// const VizCanvas = memo(({ variables }) => {
    
//     const { complexVars, simpleVars, pointers, isEmpty } = useMemo(() => {
//         if (!variables) return { complexVars: [], simpleVars: [], pointers: {}, isEmpty: true };

//         const complex = [];
//         const simple = [];
//         const ptrs = {};

//         Object.entries(variables).forEach(([name, value]) => {
//             if (BANNED_VARS.includes(name)) return;
//             if (typeof value === 'function' || typeof value === 'symbol') return;

//             if (Number.isInteger(value) && value >= 0 && value < 1000) {
//                 ptrs[name] = value;
//             }

//             const isPrimitive = (
//                 value === null || value === undefined || 
//                 typeof value === 'number' || typeof value === 'string' || 
//                 typeof value === 'boolean'
//             );

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

//     if (!variables) return <EmptyState />;
//     if (isEmpty) return <NoVarsState />;

//     return (
//         <div className="flex flex-col h-full w-full overflow-hidden bg-[#0d1117] relative">
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

//                     {complexVars.length === 0 && simpleVars.length > 0 && (
//                         <div className="flex flex-col items-center justify-center h-full w-full text-gray-600 opacity-40 mt-20">
//                             <Activity size={48} />
//                             <p className="mt-4 text-sm font-mono">Tracking Primitive Values Below</p>
//                         </div>
//                     )}
//                 </div>
//             </div>

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

// // 🧠 INTELLIGENT ROUTER
// const ComplexRenderer = memo(({ name, value, pointers }) => {
//     const lowerName = name.toLowerCase();

//     // ========== PHASE 1: SPECIAL TYPES ==========
//     if (value === '[Circular]') {
//         return <InfoCard name={name} label="Circular Ref" icon={<Activity size={14}/>} color="orange" />;
//     }
    
//     if (value?.type === 'Map') {
//         return <MapRenderer name={name} data={value.entries} />;
//     }
    
//     if (value?.type === 'Set') {
//         return <SetRenderer name={name} data={value.values} />;
//     }

//     // ========== PHASE 2: ARRAYS ==========
//     if (Array.isArray(value)) {
//         if (value.length === 0) {
//             return <Header badge="Empty Array" name={name} />;
//         }
        
//         const isMatrix = value.length > 0 && Array.isArray(value[0]);

//         // Named patterns
//         if (lowerName.includes('stack')) {
//             return (
//                 <Wrapper badge="Stack (LIFO)" color="pink">
//                     <StackViz data={value} pointers={pointers} />
//                 </Wrapper>
//             );
//         }
        
//         if (lowerName.includes('queue') || lowerName === 'q') {
//             return (
//                 <Wrapper badge="Queue (FIFO)" color="emerald">
//                     <QueueViz data={value} pointers={pointers} />
//                 </Wrapper>
//             );
//         }
        
//         // Matrix detection
//         if (isMatrix && (lowerName.includes('grid') || lowerName.includes('board') || 
//                          lowerName.includes('maze') || lowerName.includes('graph'))) {
//             return (
//                 <Wrapper badge={`Grid ${value.length}×${value[0]?.length || 0}`} color="indigo">
//                     <MatrixViz data={value} pointers={pointers} />
//                 </Wrapper>
//             );
//         }
        
//         if (isMatrix) {
//             return (
//                 <Wrapper badge={`Matrix ${value.length}×${value[0]?.length || 0}`} color="orange">
//                     <MatrixViz data={value} pointers={pointers} />
//                 </Wrapper>
//             );
//         }
        
//         // Default array
//         return (
//             <Wrapper badge="Array" color="blue">
//                 <ArrayViz data={value} pointers={pointers} />
//             </Wrapper>
//         );
//     }

//     // ========== PHASE 3: OBJECTS ==========
//     if (typeof value === 'object' && value !== null) {
//         const keys = Object.keys(value);

//         // ===== A. STACK CLASS (OOP) =====
//         if (keys.includes('stack') && Array.isArray(value.stack)) {
//             const stackData = value.stack;
//             const capacity = value.capacity || value.size || null;
//             const isFull = capacity && stackData.length >= capacity;

//             return (
//                 <div className="flex flex-col items-center">
//                     <div className="flex items-center gap-2 mb-3">
//                         <span className="text-[10px] font-bold px-2 py-0.5 rounded font-mono border uppercase tracking-wider bg-pink-900/20 text-pink-400 border-pink-500/30">
//                             Stack (OOP)
//                         </span>
//                         <span className="text-gray-200 font-bold text-sm font-mono">{name}</span>
//                         {capacity && (
//                             <span className="text-[10px] font-mono text-gray-500 border-l border-gray-700 pl-2">
//                                 {stackData.length}/{capacity}
//                                 {isFull && <span className="text-red-400 ml-1">FULL</span>}
//                             </span>
//                         )}
//                     </div>
//                     <StackViz 
//                         data={stackData} 
//                         pointers={pointers}
//                         capacity={capacity}
//                         isFull={isFull}
//                     />
//                 </div>
//             );
//         }

//         // ===== B. QUEUE CLASS (OOP) =====
//         if ((keys.includes('queue') || keys.includes('items')) && 
//             (Array.isArray(value.queue) || Array.isArray(value.items))) {
            
//             const queueData = value.queue || value.items;
//             const capacity = value.capacity || value.size || value.maxSize || null;
//             const front = value.front !== undefined ? value.front : null;
//             const rear = value.rear !== undefined ? value.rear : null;
//             const isFull = capacity && queueData.length >= capacity;

//             return (
//                 <div className="flex flex-col items-center">
//                     <div className="flex items-center gap-2 mb-3">
//                         <span className="text-[10px] font-bold px-2 py-0.5 rounded font-mono border uppercase tracking-wider bg-emerald-900/20 text-emerald-400 border-emerald-500/30">
//                             Queue (OOP)
//                         </span>
//                         <span className="text-gray-200 font-bold text-sm font-mono">{name}</span>
//                         {capacity && (
//                             <span className="text-[10px] font-mono text-gray-500 border-l border-gray-700 pl-2">
//                                 {queueData.length}/{capacity}
//                                 {isFull && <span className="text-yellow-400 ml-1">FULL</span>}
//                             </span>
//                         )}
//                     </div>
//                     <QueueViz 
//                         data={queueData} 
//                         pointers={pointers}
//                         capacity={capacity}
//                         front={front}
//                         rear={rear}
//                     />
//                 </div>
//             );
//         }

//         // ===== C. LINKED LIST CLASS (OOP) =====
//         if (keys.includes('head') && value.head && typeof value.head === 'object') {
//             const headKeys = Object.keys(value.head);
//             if (headKeys.includes('val') || headKeys.includes('next') || 
//                 headKeys.includes('value') || headKeys.includes('data')) {
//                 return <ComplexRenderer name={name} value={value.head} pointers={pointers} />;
//             }
//         }

//         // ===== D. NODE STRUCTURES =====
//         const hasNext = keys.includes('next');
//         const hasPrev = keys.includes('prev'); 
//         const hasLeftRight = keys.includes('left') || keys.includes('right');
//         const hasVal = keys.includes('val') || keys.includes('value') || keys.includes('data');
        
//         if (hasLeftRight && hasVal) {
//             return (
//                 <Wrapper badge="Binary Tree" color="purple">
//                     <TreeViz data={value} name={name} />
//                 </Wrapper>
//             );
//         }
        
//         if (hasNext && hasPrev && hasVal) {
//             return (
//                 <Wrapper badge="Doubly Linked List" color="orange">
//                     <DoublyLinkedListViz data={value} name={name} />
//                 </Wrapper>
//             );
//         }
        
//         if (hasNext && hasVal) {
//             return (
//                 <Wrapper badge="Linked List" color="teal">
//                     <LinkedListViz data={value} name={name} />
//                 </Wrapper>
//             );
//         }

//         // ===== E. GENERIC OBJECT =====
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

// // ========== SUB-RENDERERS ==========

// const MapRenderer = ({ name, data }) => (
//     <div className="flex flex-col items-center">
//         <Header 
//             badge="Map" 
//             badgeColor="text-yellow-400 bg-yellow-400/10 border-yellow-400/20" 
//             name={name} 
//             meta={`size: ${data.length}`} 
//         />
//         <div className="flex flex-col gap-1 bg-[#161b22] p-3 rounded-xl border border-gray-800 min-w-[160px] shadow-lg">
//             {data.map(([k, v], i) => (
//                 <div key={i} className="flex justify-between gap-4 text-xs font-mono border-b border-gray-800 last:border-0 pb-1.5 mb-1.5 last:pb-0 last:mb-0">
//                     <span className="text-blue-400 font-bold">{String(k)}</span>
//                     <span className="text-gray-600">→</span>
//                     <span className="text-emerald-400 font-bold">{String(v)}</span>
//                 </div>
//             ))}
//             {data.length === 0 && (
//                 <span className="text-gray-600 italic text-xs text-center">Empty</span>
//             )}
//         </div>
//     </div>
// );

// const SetRenderer = ({ name, data }) => (
//     <div className="flex flex-col items-center">
//         <Header 
//             badge="Set" 
//             badgeColor="text-rose-400 bg-rose-400/10 border-rose-400/20" 
//             name={name} 
//             meta={`size: ${data.length}`} 
//         />
//         <div className="flex flex-wrap gap-2 bg-[#161b22] p-3 rounded-xl border border-gray-800 max-w-[200px] justify-center shadow-lg">
//             {data.map((v, i) => (
//                 <span key={i} className="px-2 py-1 bg-gray-800 rounded text-xs text-rose-300 font-mono border border-gray-700 shadow-sm">
//                     {String(v)}
//                 </span>
//             ))}
//             {data.length === 0 && (
//                 <span className="text-gray-600 italic text-xs">Empty</span>
//             )}
//         </div>
//     </div>
// );

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
//         {meta && (
//             <span className="text-gray-600 text-[10px] font-mono border-l border-gray-700 pl-2">
//                 {meta}
//             </span>
//         )}
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



























// // FILE: frontend/src/components/Visualizer/VizCanvas.jsx
// // FULLY REWRITTEN — Theme-aware, mobile-responsive, all hardcoded darks replaced
// import React, { useMemo, memo } from 'react';
// import { AnimatePresence, motion } from 'framer-motion';
// import { Activity, Hash } from 'lucide-react';

// import ArrayViz            from './renderers/ArrayViz';
// import StackViz            from './renderers/StackViz';
// import QueueViz            from './renderers/QueueViz';
// import TreeViz             from './renderers/TreeViz';
// import MatrixViz           from './renderers/MatrixViz';
// import LinkedListViz       from './renderers/LinkedListViz';
// import DoublyLinkedListViz from './renderers/DoublyLinkedListViz';

// // Variables we never want to display
// const BANNED_VARS = new Set([
//     'this','window','global','self','module','exports',
//     'arguments','require','process','__dirname','__filename','console',
// ]);

// // ✅ FIX: Only these names are treated as array-pointer indices
// // Prevents 'sum', 'count', 'n', 'capacity' from falsely highlighting array cells
// const POINTER_NAME_RE = /^(i|j|k|l|r|left|right|mid|start|end|ptr|lo|hi|low|high|front|rear|top|bot|p|q)$/i;

// // ─────────────────────────────────────────────────────────────────────────────
// // MAIN CANVAS
// // ─────────────────────────────────────────────────────────────────────────────
// const VizCanvas = memo(({ variables }) => {
//     const { complexVars, simpleVars, pointers, isEmpty } = useMemo(() => {
//         if (!variables) return { complexVars:[], simpleVars:[], pointers:{}, isEmpty:true };

//         const complex = [];
//         const simple  = [];
//         const ptrs    = {};

//         Object.entries(variables).forEach(([name, value]) => {
//             if (BANNED_VARS.has(name)) return;
//             if (typeof value === 'function' || typeof value === 'symbol') return;

//             // ✅ FIXED: whitelist-only pointer detection
//             if (
//                 Number.isInteger(value) &&
//                 value >= 0 && value < 1000 &&
//                 POINTER_NAME_RE.test(name)
//             ) ptrs[name] = value;

//             const isPrimitive =
//                 value === null || value === undefined ||
//                 typeof value === 'number' ||
//                 typeof value === 'string'  ||
//                 typeof value === 'boolean';

//             // ✅ FIX: collapsed redundant isSpecialStruct branch
//             if (isPrimitive) simple.push([name, value]);
//             else             complex.push([name, value]);
//         });

//         return {
//             complexVars: complex,
//             simpleVars:  simple,
//             pointers:    ptrs,
//             isEmpty:     complex.length === 0 && simple.length === 0,
//         };
//     }, [variables]);

//     if (!variables) return <EmptyState />;
//     if (isEmpty)    return <NoVarsState />;

//     return (
//         <>
//             {/* ── GLOBAL THEME OVERRIDES ────────────────────────────────────
//                 All renderer sub-files still use hardcoded dark Tailwind classes.
//                 Rather than touching every renderer, we inject a single CSS block
//                 that remaps those exact values to theme-aware CSS variables.
//                 When data-theme="light" on a parent, every renderer goes light.
//             ─────────────────────────────────────────────────────────────── */}
//             <ThemeOverrideStyles />

//             <div
//                 className="viz-canvas flex flex-col h-full w-full overflow-hidden relative"
//                 style={{ background: 'var(--vz-bg-primary, #0d1117)' }}
//             >
//                 {/* ── COMPLEX VARS (arrays, trees, linked lists…) ─────────── */}
//                 <div className="flex-1 overflow-auto" style={{ padding: 'clamp(12px, 3vw, 32px)' }}>
//                     <div className="flex flex-wrap justify-center items-start gap-6 sm:gap-10 content-start min-h-full">
//                         <AnimatePresence mode="popLayout">
//                             {complexVars.map(([name, value]) => (
//                                 <motion.div
//                                     key={name}
//                                     layout
//                                     initial={{ opacity: 0, scale: 0.9, y: 10 }}
//                                     animate={{ opacity: 1, scale: 1,   y: 0  }}
//                                     exit={{    opacity: 0, scale: 0.9, y: -10 }}
//                                     transition={{ duration: 0.25 }}
//                                     // ✅ MOBILE FIX: constrain width so cards don't overflow viewport
//                                     className="flex flex-col items-center"
//                                     style={{ maxWidth: '100%' }}
//                                 >
//                                     {/* ✅ MOBILE FIX: scrollable wrapper per card */}
//                                     <div
//                                         className="max-w-full overflow-x-auto"
//                                         style={{ WebkitOverflowScrolling: 'touch' }}
//                                     >
//                                         <ComplexRenderer
//                                             name={name}
//                                             value={value}
//                                             pointers={pointers}
//                                         />
//                                     </div>
//                                 </motion.div>
//                             ))}
//                         </AnimatePresence>

//                         {complexVars.length === 0 && simpleVars.length > 0 && (
//                             <div
//                                 className="flex flex-col items-center justify-center h-40 w-full opacity-30 mt-12"
//                                 style={{ color: 'var(--vz-text-muted, #8b949e)' }}
//                             >
//                                 <Activity size={40} />
//                                 <p className="mt-3 text-xs font-mono">Tracking Primitive Values Below</p>
//                             </div>
//                         )}
//                     </div>
//                 </div>

//                 {/* ── SIMPLE VAR PILLS (bottom bar) ───────────────────────── */}
//                 {simpleVars.length > 0 && (
//                     <div
//                         className="w-full shrink-0 z-30"
//                         style={{
//                             borderTop:   '1px solid var(--vz-border, #30363d)',
//                             background:  'var(--vz-bg-secondary, #161b22)',
//                             padding:     'clamp(8px, 2vw, 16px) clamp(12px, 3vw, 24px)',
//                             boxShadow:   '0 -4px 20px rgba(0,0,0,0.2)',
//                         }}
//                     >
//                         <div className="flex flex-wrap gap-2 sm:gap-3 justify-center items-center">
//                             <AnimatePresence mode="popLayout">
//                                 {simpleVars.map(([name, value]) => (
//                                     <CompactVariablePill key={name} name={name} value={value} />
//                                 ))}
//                             </AnimatePresence>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </>
//     );
// });

// // ─────────────────────────────────────────────────────────────────────────────
// // INTELLIGENT ROUTER
// // ─────────────────────────────────────────────────────────────────────────────
// const ComplexRenderer = memo(({ name, value, pointers }) => {
//     const lowerName = name.toLowerCase();

//     // ── PHASE 1: Special serialised types ───────────────────────────────────
//     if (value === '[Circular]')
//         return <InfoCard name={name} label="Circular Ref" icon={<Activity size={14}/>} color="orange" />;

//     if (value?.type === 'Map')
//         return <MapRenderer name={name} data={value.entries} />;

//     if (value?.type === 'Set')
//         return <SetRenderer name={name} data={value.values} />;

//     // ── PHASE 2: Arrays ─────────────────────────────────────────────────────
//     if (Array.isArray(value)) {
//         if (value.length === 0) return <CardHeader badge="Empty Array" name={name} />;

//         const isMatrix = Array.isArray(value[0]);

//         if (lowerName.includes('stack'))
//             return <Wrapper badge="Stack (LIFO)" color="pink"><StackViz data={value} pointers={pointers} /></Wrapper>;

//         if (lowerName.includes('queue') || lowerName === 'q')
//             return <Wrapper badge="Queue (FIFO)" color="emerald"><QueueViz data={value} pointers={pointers} /></Wrapper>;

//         if (isMatrix && /grid|board|maze|graph/.test(lowerName))
//             return <Wrapper badge={`Grid ${value.length}×${value[0]?.length||0}`} color="indigo"><MatrixViz data={value} pointers={pointers} /></Wrapper>;

//         if (isMatrix)
//             return <Wrapper badge={`Matrix ${value.length}×${value[0]?.length||0}`} color="orange"><MatrixViz data={value} pointers={pointers} /></Wrapper>;

//         return <Wrapper badge="Array" color="blue"><ArrayViz data={value} pointers={pointers} /></Wrapper>;
//     }

//     // ── PHASE 3: Objects ────────────────────────────────────────────────────
//     if (typeof value === 'object' && value !== null) {
//         const keys = Object.keys(value);

//         // Stack class (OOP)
//         if (keys.includes('stack') && Array.isArray(value.stack)) {
//             const stackData = value.stack;
//             const capacity  = value.capacity || value.size || null;
//             return (
//                 <div className="flex flex-col items-center">
//                     <OopHeader badge="Stack (OOP)" color="pink" name={name} capacity={capacity} count={stackData.length} />
//                     <StackViz data={stackData} pointers={pointers} capacity={capacity} isFull={capacity && stackData.length >= capacity} />
//                 </div>
//             );
//         }

//         // Queue class (OOP)
//         if ((keys.includes('queue') || keys.includes('items')) &&
//             (Array.isArray(value.queue) || Array.isArray(value.items))) {
//             const queueData = value.queue || value.items;
//             const capacity  = value.capacity || value.size || value.maxSize || null;
//             return (
//                 <div className="flex flex-col items-center">
//                     <OopHeader badge="Queue (OOP)" color="emerald" name={name} capacity={capacity} count={queueData.length} />
//                     <QueueViz
//                         data={queueData}
//                         pointers={pointers}
//                         capacity={capacity}
//                         front={value.front ?? null}
//                         rear={value.rear ?? null}
//                     />
//                 </div>
//             );
//         }

//         // Linked list class (OOP) — unwrap head
//         if (keys.includes('head') && value.head && typeof value.head === 'object') {
//             const hk = Object.keys(value.head);
//             if (hk.includes('val') || hk.includes('next') || hk.includes('value') || hk.includes('data'))
//                 return <ComplexRenderer name={name} value={value.head} pointers={pointers} />;
//         }

//         // Node structures
//         const hasNext     = keys.includes('next');
//         const hasPrev     = keys.includes('prev');
//         const hasLR       = keys.includes('left') || keys.includes('right');
//         const hasVal      = keys.includes('val')  || keys.includes('value') || keys.includes('data');

//         if (hasLR && hasVal)
//             return <Wrapper badge="Binary Tree" color="purple"><TreeViz data={value} name={name} /></Wrapper>;

//         if (hasNext && hasPrev && hasVal)
//             return <Wrapper badge="Doubly Linked List" color="orange"><DoublyLinkedListViz data={value} name={name} /></Wrapper>;

//         if (hasNext && hasVal)
//             return <Wrapper badge="Linked List" color="teal"><LinkedListViz data={value} name={name} /></Wrapper>;

//         // Generic object fallback
//         return (
//             <div className="flex flex-col items-center">
//                 <CardHeader badge="Object" name={name} />
//                 <div
//                     className="p-4 rounded-xl border font-mono text-xs min-w-[180px] shadow-lg"
//                     style={{
//                         background:   'var(--vz-bg-secondary, #161b22)',
//                         borderColor:  'var(--vz-border, #30363d)',
//                         color:        'var(--vz-text-primary, #e6edf3)',
//                     }}
//                 >
//                     <pre className="overflow-auto max-h-48">{JSON.stringify(value, null, 2)}</pre>
//                 </div>
//             </div>
//         );
//     }

//     return null;
// });

// // ─────────────────────────────────────────────────────────────────────────────
// // SHARED UI PRIMITIVES  — all use CSS variables, no hardcoded dark hex
// // ─────────────────────────────────────────────────────────────────────────────

// /** Coloured type-badge + variable name row */
// const CardHeader = ({ badge, badgeColor, name, meta }) => (
//     <div className="flex items-center gap-2 mb-3 flex-wrap">
//         <span
//             className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono border uppercase tracking-wider"
//             style={badgeColor || {
//                 background:  'var(--vz-bg-secondary,#161b22)',
//                 color:       'var(--vz-text-muted,#8b949e)',
//                 borderColor: 'var(--vz-border,#30363d)',
//             }}
//         >
//             {badge}
//         </span>
//         <span
//             className="font-bold text-sm font-mono"
//             style={{ color: 'var(--vz-text-primary,#e6edf3)' }}
//         >
//             {name}
//         </span>
//         {meta && (
//             <span
//                 className="text-[10px] font-mono border-l pl-2"
//                 style={{ color: 'var(--vz-text-muted,#8b949e)', borderColor: 'var(--vz-border,#30363d)' }}
//             >
//                 {meta}
//             </span>
//         )}
//     </div>
// );

// /** OOP wrapper header (Stack OOP / Queue OOP) */
// const OopHeader = ({ badge, color, name, capacity, count }) => {
//     const colorMap = {
//         pink:    { bg:'rgba(244,114,182,0.08)', text:'#f472b6', border:'rgba(244,114,182,0.25)' },
//         emerald: { bg:'rgba(52,211,153,0.08)',  text:'#34d399', border:'rgba(52,211,153,0.25)'  },
//     };
//     const c = colorMap[color] || colorMap.pink;
//     return (
//         <div className="flex items-center gap-2 mb-3 flex-wrap">
//             <span
//                 className="text-[10px] font-bold px-2 py-0.5 rounded font-mono border uppercase tracking-wider"
//                 style={{ background: c.bg, color: c.text, borderColor: c.border }}
//             >
//                 {badge}
//             </span>
//             <span
//                 className="font-bold text-sm font-mono"
//                 style={{ color: 'var(--vz-text-primary,#e6edf3)' }}
//             >
//                 {name}
//             </span>
//             {capacity && (
//                 <span
//                     className="text-[10px] font-mono border-l pl-2"
//                     style={{ color: 'var(--vz-text-muted,#8b949e)', borderColor: 'var(--vz-border,#30363d)' }}
//                 >
//                     {count}/{capacity}
//                     {count >= capacity && (
//                         <span className="text-red-400 ml-1 font-bold">FULL</span>
//                     )}
//                 </span>
//             )}
//         </div>
//     );
// };

// /** Type-colour wrapper for renderers */
// const Wrapper = ({ children, badge, color = 'blue' }) => {
//     const colorMap = {
//         pink:    { bg:'rgba(244,114,182,0.08)', text:'#f472b6', border:'rgba(244,114,182,0.25)' },
//         emerald: { bg:'rgba(52,211,153,0.08)',  text:'#34d399', border:'rgba(52,211,153,0.25)'  },
//         indigo:  { bg:'rgba(129,140,248,0.08)', text:'#818cf8', border:'rgba(129,140,248,0.25)' },
//         orange:  { bg:'rgba(251,146,60,0.08)',  text:'#fb923c', border:'rgba(251,146,60,0.25)'  },
//         blue:    { bg:'rgba(96,165,250,0.08)',  text:'#60a5fa', border:'rgba(96,165,250,0.25)'  },
//         purple:  { bg:'rgba(192,132,252,0.08)', text:'#c084fc', border:'rgba(192,132,252,0.25)' },
//         teal:    { bg:'rgba(45,212,191,0.08)',  text:'#2dd4bf', border:'rgba(45,212,191,0.25)'  },
//     };
//     const c = colorMap[color];
//     return (
//         <div className="flex flex-col items-center">
//             <span
//                 className="mb-3 px-2 py-0.5 rounded text-[10px] font-bold font-mono border uppercase tracking-wider"
//                 style={{ background: c.bg, color: c.text, borderColor: c.border }}
//             >
//                 {badge}
//             </span>
//             {children}
//         </div>
//     );
// };

// /** Map key→value table */
// const MapRenderer = ({ name, data }) => (
//     <div className="flex flex-col items-center">
//         <CardHeader
//             badge="Map"
//             badgeColor={{ background:'rgba(251,191,36,0.08)', color:'#fbbf24', borderColor:'rgba(251,191,36,0.2)' }}
//             name={name}
//             meta={`size: ${data.length}`}
//         />
//         <div
//             className="flex flex-col gap-1 p-3 rounded-xl border min-w-[160px] shadow-lg"
//             style={{ background: 'var(--vz-bg-secondary,#161b22)', borderColor: 'var(--vz-border,#30363d)' }}
//         >
//             {data.map(([k,v],i) => (
//                 <div
//                     key={i}
//                     className="flex justify-between gap-4 text-xs font-mono pb-1.5 mb-1.5 last:pb-0 last:mb-0"
//                     style={{ borderBottom: i < data.length-1 ? '1px solid var(--vz-border,#30363d)' : 'none' }}
//                 >
//                     <span className="text-blue-400 font-bold">{String(k)}</span>
//                     <span style={{ color: 'var(--vz-text-muted,#8b949e)' }}>→</span>
//                     <span className="text-emerald-400 font-bold">{String(v)}</span>
//                 </div>
//             ))}
//             {data.length === 0 && (
//                 <span style={{ color: 'var(--vz-text-muted,#8b949e)' }} className="italic text-xs text-center">Empty</span>
//             )}
//         </div>
//     </div>
// );

// /** Set chip display */
// const SetRenderer = ({ name, data }) => (
//     <div className="flex flex-col items-center">
//         <CardHeader
//             badge="Set"
//             badgeColor={{ background:'rgba(251,113,133,0.08)', color:'#fb7185', borderColor:'rgba(251,113,133,0.2)' }}
//             name={name}
//             meta={`size: ${data.length}`}
//         />
//         <div
//             className="flex flex-wrap gap-2 p-3 rounded-xl border max-w-[220px] justify-center shadow-lg"
//             style={{ background: 'var(--vz-bg-secondary,#161b22)', borderColor: 'var(--vz-border,#30363d)' }}
//         >
//             {data.map((v,i) => (
//                 <span
//                     key={i}
//                     className="px-2 py-1 rounded text-xs font-mono border shadow-sm"
//                     style={{
//                         background: 'var(--vz-bg-hover,#1f2937)',
//                         color: '#fb7185',
//                         borderColor: 'var(--vz-border,#30363d)',
//                     }}
//                 >
//                     {String(v)}
//                 </span>
//             ))}
//             {data.length === 0 && (
//                 <span style={{ color: 'var(--vz-text-muted,#8b949e)' }} className="italic text-xs">Empty</span>
//             )}
//         </div>
//     </div>
// );

// /** Compact primitive variable pill (bottom strip) */
// const CompactVariablePill = memo(({ name, value }) => (
//     <motion.div
//         layout
//         initial={{ scale: 0.9, opacity: 0 }}
//         animate={{ scale: 1,   opacity: 1 }}
//         className="flex items-center rounded-lg overflow-hidden shadow-sm"
//         style={{ border: '1px solid var(--vz-border,#30363d)', background: 'var(--vz-bg-primary,#0d1117)' }}
//     >
//         <div
//             className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider font-mono border-r"
//             style={{
//                 background:  'var(--vz-bg-secondary,#161b22)',
//                 color:       'var(--vz-text-muted,#8b949e)',
//                 borderColor: 'var(--vz-border,#30363d)',
//             }}
//         >
//             {name}
//         </div>
//         <div
//             className="px-3 py-1.5 text-sm font-mono font-bold tabular-nums"
//             style={{ color: 'var(--vz-accent,#58a6ff)' }}
//         >
//             {value === null ? 'null' : value === undefined ? 'undef' : String(value)}
//         </div>
//     </motion.div>
// ));

// /** Info badge for edge cases (circular refs etc.) */
// const InfoCard = ({ name, label, icon, color }) => {
//     const cols = {
//         orange: { bg:'rgba(251,146,60,0.08)', border:'rgba(251,146,60,0.3)', text:'#fb923c' },
//     };
//     const c = cols[color] || cols.orange;
//     return (
//         <div
//             className="p-4 rounded-xl border flex flex-col items-center gap-2 shadow-lg"
//             style={{ background: c.bg, borderColor: c.border, color: c.text }}
//         >
//             {icon}
//             <span className="font-bold text-xs font-mono">{label}</span>
//             <span className="text-[10px] opacity-70">{name}</span>
//         </div>
//     );
// };

// const EmptyState = () => (
//     <div
//         className="h-full flex flex-col items-center justify-center gap-4 select-none"
//         style={{ color: 'var(--vz-text-muted,#8b949e)' }}
//     >
//         <Activity size={56} strokeWidth={1} className="opacity-20 animate-pulse" />
//         <div className="text-center">
//             <p className="font-medium" style={{ color: 'var(--vz-text-primary,#e6edf3)' }}>
//                 Ready to Visualize
//             </p>
//             <p className="text-sm opacity-50 mt-1">Run code to see memory trace</p>
//         </div>
//     </div>
// );

// const NoVarsState = () => (
//     <div
//         className="h-full flex flex-col items-center justify-center gap-3 select-none"
//         style={{ color: 'var(--vz-text-muted,#8b949e)' }}
//     >
//         <Hash size={44} strokeWidth={1} className="opacity-20" />
//         <p className="text-sm font-mono opacity-60">No variables in current scope</p>
//     </div>
// );

// // ─────────────────────────────────────────────────────────────────────────────
// // THEME OVERRIDE CSS
// // Remaps the hardcoded dark hex classes that still exist in the individual
// // renderer files (ArrayViz, StackViz, etc.) to CSS-variable values so they
// // respond to data-theme="light" without touching each renderer file.
// // ─────────────────────────────────────────────────────────────────────────────
// const ThemeOverrideStyles = () => (
//     <style>{`
//         /* ── canvas background ── */
//         [data-theme="light"] .viz-canvas {
//             background: #f6f8fa !important;
//         }

//         /* ── dark panel backgrounds (all renderer files) ── */
//         [data-theme="light"] [class*="bg-[#0d1117]"],
//         [data-theme="light"] [class*="bg-[\\#0d1117]"] {
//             background-color: #ffffff !important;
//         }
//         [data-theme="light"] [class*="bg-[#161b22]"],
//         [data-theme="light"] [class*="bg-[\\#161b22]"] {
//             background-color: #f6f8fa !important;
//         }
//         [data-theme="light"] [class*="bg-[#1f2937]"],
//         [data-theme="light"] [class*="bg-[\\#1f2937]"] {
//             background-color: #eaeef2 !important;
//         }
//         [data-theme="light"] [class*="bg-[#1e1b4b]"],
//         [data-theme="light"] [class*="bg-[\\#1e1b4b]"] {
//             background-color: #eff0ff !important;
//         }
//         [data-theme="light"] [class*="bg-[#022c22]"],
//         [data-theme="light"] [class*="bg-[\\#022c22]"] {
//             background-color: #ecfdf5 !important;
//         }

//         /* ── dark borders ── */
//         [data-theme="light"] .border-gray-800 { border-color: #d0d7de !important; }
//         [data-theme="light"] .border-gray-700 { border-color: #d8dee4 !important; }
//         [data-theme="light"] .border-\\[\\#30363d\\] { border-color: #d0d7de !important; }
//         [data-theme="light"] .border-\\[\\#374151\\] { border-color: #d0d7de !important; }

//         /* ── primary text (light-on-dark → dark-on-light) ── */
//         [data-theme="light"] .text-gray-300 { color: #1f2328 !important; }
//         [data-theme="light"] .text-gray-200 { color: #1f2328 !important; }

//         /* ── secondary / muted text ── */
//         [data-theme="light"] .text-gray-500 { color: #57606a !important; }
//         [data-theme="light"] .text-gray-600 { color: #6e7781 !important; }
//         [data-theme="light"] .text-gray-700 { color: #424a53 !important; }

//         /* ── chip / tag inside Set renderer ── */
//         [data-theme="light"] .bg-gray-800 {
//             background-color: #eaeef2 !important;
//             color: #1f2328 !important;
//         }

//         /* ── U-shaped stack border ── */
//         [data-theme="light"] .border-gray-700\/50 { border-color: rgba(208,215,222,0.8) !important; }

//         /* ── node NEXT pointer cell (LinkedList) ── */
//         [data-theme="light"] [class*="bg-[#022c22]"] {
//             background-color: #ecfdf5 !important;
//         }
//         [data-theme="light"] [class*="bg-[#1e1b4b]"] {
//             background-color: #eef0ff !important;
//         }

//         /* ── backdrop/gradient backgrounds ── */
//         [data-theme="light"] .from-\\[\\#0d1117\\] { --tw-gradient-from: #ffffff !important; }
//         [data-theme="light"] .to-\\[\\#161b22\\]   { --tw-gradient-to:   #f6f8fa !important; }
//     `}</style>
// );

// export default VizCanvas;

















































































// FILE: frontend/src/components/Visualizer/VizCanvas.jsx
// CORE REWRITE — correctness and real-world code handling
// Key improvements:
//   1. Graph adjacency list detection + renderer
//   2. Heap / Priority Queue detection
//   3. Null-safe tree routing (BST with null children no longer breaks)
//   4. Better pointer heuristics (fewer false positives)
//   5. BigInt support in primitive pills
//   6. Generic object fallback with readable JSON

import React, { useMemo, memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Hash, AlertTriangle } from 'lucide-react';

import ArrayViz            from './renderers/ArrayViz';
import StackViz            from './renderers/StackViz';
import QueueViz            from './renderers/QueueViz';
import TreeViz             from './renderers/TreeViz';
import MatrixViz           from './renderers/MatrixViz';
import LinkedListViz       from './renderers/LinkedListViz';
import DoublyLinkedListViz from './renderers/DoublyLinkedListViz';

// ─── Constants ────────────────────────────────────────────────────────────────

const BANNED_VARS = new Set([
    'this','window','global','globalThis','self','module','exports',
    'arguments','require','process','__dirname','__filename','console',
    '__snapshot','__step',
]);

// POINTER HEURISTIC: strict whitelist of iteration-variable names only.
// Prevents sum, count, n, max, capacity from being treated as pointers.
const POINTER_NAME_RE = /^(i|j|k|idx|index|left|right|mid|start|end|ptr|lo|hi|low|high|front|rear|top|l|r|p|q)$/i;

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

// Graph: object where every value is an array (adjacency list)
function isAdjacencyList(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
    const vals = Object.values(obj);
    return vals.length >= 2 && vals.every(v => Array.isArray(v));
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CANVAS
// ─────────────────────────────────────────────────────────────────────────────
const VizCanvas = memo(({ variables }) => {

    const { complexVars, simpleVars, pointers, isEmpty } = useMemo(() => {
        if (!variables) return { complexVars:[], simpleVars:[], pointers:{}, isEmpty:true };

        const complex = [];
        const simple  = [];
        const ptrs    = {};

        Object.entries(variables).forEach(([name, value]) => {
            if (BANNED_VARS.has(name)) return;
            if (name.startsWith('__')) return;
            if (typeof value === 'function' || typeof value === 'symbol') return;

            // Strict pointer detection
            if (
                Number.isInteger(value) &&
                value >= 0 && value < 10_000 &&
                POINTER_NAME_RE.test(name)
            ) {
                ptrs[name] = value;
            }

            const isPrimitive =
                value === null      ||
                value === undefined ||
                typeof value === 'number'  ||
                typeof value === 'string'  ||
                typeof value === 'boolean' ||
                typeof value === 'bigint';

            if (isPrimitive) simple.push([name, value]);
            else             complex.push([name, value]);
        });

        return {
            complexVars: complex,
            simpleVars:  simple,
            pointers:    ptrs,
            isEmpty:     complex.length === 0 && simple.length === 0,
        };
    }, [variables]);

    if (!variables) return <EmptyState />;
    if (isEmpty)    return <NoVarsState />;

    return (
        <div
            className="viz-canvas flex flex-col h-full w-full overflow-hidden relative"
            style={{ background: 'var(--vz-bg-primary, #0d1117)' }}
        >
            {/* Complex vars (arrays, trees, linked lists, graphs…) */}
            <div className="flex-1 overflow-auto" style={{ padding: 'clamp(12px, 3vw, 32px)' }}>
                <div className="flex flex-wrap justify-center items-start gap-8 content-start min-h-full">
                    <AnimatePresence mode="popLayout">
                        {complexVars.map(([name, value]) => (
                            <motion.div
                                key={name} layout
                                initial={{ opacity: 0, scale: 0.92, y: 10 }}
                                animate={{ opacity: 1, scale: 1,    y: 0  }}
                                exit={{    opacity: 0, scale: 0.88, y: -8 }}
                                transition={{ duration: 0.22 }}
                                style={{ maxWidth: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                            >
                                <div style={{ maxWidth: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                    <ComplexRenderer name={name} value={value} pointers={pointers} />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {complexVars.length === 0 && simpleVars.length > 0 && (
                        <div className="flex flex-col items-center justify-center mt-16 opacity-30 w-full"
                            style={{ color: 'var(--vz-text-muted, #8b949e)' }}>
                            <Activity size={40} />
                            <p className="mt-3 text-xs font-mono">Tracking Primitives Below</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Primitive pills */}
            {simpleVars.length > 0 && (
                <div className="w-full shrink-0 z-30"
                    style={{
                        borderTop:  '1px solid var(--vz-border, #30363d)',
                        background: 'var(--vz-bg-secondary, #161b22)',
                        padding:    'clamp(8px, 2vw, 14px) clamp(12px, 3vw, 24px)',
                    }}>
                    <div className="flex flex-wrap gap-2 justify-center items-center">
                        <AnimatePresence mode="popLayout">
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

// ─────────────────────────────────────────────────────────────────────────────
// INTELLIGENT ROUTER
// ─────────────────────────────────────────────────────────────────────────────
const ComplexRenderer = memo(({ name, value, pointers }) => {
    const lower = name.toLowerCase();

    if (value === null) return null;
    if (value === '[Circular]') return <InfoCard name={name} label="Circular Ref" />;

    // Map / Set (serialised by tracer)
    if (value?.type === 'Map') return <MapRenderer name={name} data={value.entries ?? []} />;
    if (value?.type === 'Set') return <SetRenderer name={name} data={value.values  ?? []} />;

    // Arrays
    if (Array.isArray(value)) {
        if (value.length === 0) return <TypeBadge color="blue">Empty Array — {name}</TypeBadge>;

        const isMatrix = Array.isArray(value[0]) && value[0].length > 0;

        if (/heap|priority|pq|minheap|maxheap/i.test(name))
            return <Wrapper badge="Heap / Priority Queue" color="orange"><ArrayViz data={value} pointers={pointers} /></Wrapper>;

        if (/stack/i.test(name))
            return <Wrapper badge="Stack (LIFO)" color="pink"><StackViz data={value} pointers={pointers} /></Wrapper>;

        if (/queue|deque/i.test(name) || lower === 'q')
            return <Wrapper badge="Queue (FIFO)" color="emerald"><QueueViz data={value} pointers={pointers} /></Wrapper>;

        if (isMatrix)
            return <Wrapper badge={`Matrix ${value.length}×${value[0]?.length || 0}`} color={/grid|board|maze/.test(lower) ? 'indigo' : 'orange'}>
                       <MatrixViz data={value} pointers={pointers} />
                   </Wrapper>;

        return <Wrapper badge="Array" color="blue"><ArrayViz data={value} pointers={pointers} /></Wrapper>;
    }

    // Objects
    if (typeof value === 'object') {
        const keys = Object.keys(value);

        // Graph adjacency list: { '0': [1,2], '1': [0] }
        if (isAdjacencyList(value))
            return <GraphRenderer name={name} data={value} />;

        // OOP Stack
        if (keys.includes('stack') && Array.isArray(value.stack)) {
            const cap = value.capacity || value.maxSize || null;
            return (
                <div className="flex flex-col items-center">
                    <TypeBadge color="pink">Stack (OOP) — {name}{cap ? ` [${value.stack.length}/${cap}]` : ''}</TypeBadge>
                    <StackViz data={value.stack} pointers={pointers} capacity={cap} />
                </div>
            );
        }

        // OOP Queue
        const qArr = value.queue || value.items;
        if (Array.isArray(qArr)) {
            const cap = value.capacity || value.maxSize || null;
            return (
                <div className="flex flex-col items-center">
                    <TypeBadge color="emerald">Queue (OOP) — {name}{cap ? ` [${qArr.length}/${cap}]` : ''}</TypeBadge>
                    <QueueViz data={qArr} pointers={pointers} capacity={cap} front={value.front ?? null} rear={value.rear ?? null} />
                </div>
            );
        }

        // OOP LinkedList { head: Node }
        if (keys.includes('head') && isLinkedListNode(value.head))
            return <ComplexRenderer name={name} value={value.head} pointers={pointers} />;

        // Tree node
        if (isTreeNode(value))
            return <Wrapper badge="Binary Tree" color="purple"><TreeViz data={value} name={name} /></Wrapper>;

        // DLL node
        if (isLinkedListNode(value) && keys.includes('prev'))
            return <Wrapper badge="Doubly Linked List" color="orange"><DoublyLinkedListViz data={value} name={name} /></Wrapper>;

        // Singly LL node
        if (isLinkedListNode(value))
            return <Wrapper badge="Linked List" color="teal"><LinkedListViz data={value} name={name} /></Wrapper>;

        // Generic fallback
        return <ObjectRenderer name={name} value={value} />;
    }

    return null;
});

// ─── Graph Renderer ──────────────────────────────────────────────────────────
const GraphRenderer = memo(({ name, data }) => {
    const entries = Object.entries(data);
    const isWeighted = entries.some(([, nbrs]) => nbrs.some(n => typeof n === 'object' && n !== null));

    return (
        <div className="flex flex-col items-center">
            <TypeBadge color="cyan">
                Graph (Adjacency List) — {name} [{entries.length} nodes{isWeighted ? ', weighted' : ''}]
            </TypeBadge>
            <div className="p-4 rounded-xl border font-mono text-xs min-w-[200px] shadow-lg overflow-auto"
                style={{ background: 'var(--vz-bg-secondary,#161b22)', borderColor: 'var(--vz-border,#30363d)', maxHeight: 260 }}>
                {entries.map(([node, nbrs]) => (
                    <div key={node} className="flex items-start gap-3 mb-2 last:mb-0">
                        <span className="font-bold px-2 py-0.5 rounded min-w-[2rem] text-center shrink-0"
                            style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)' }}>
                            {node}
                        </span>
                        <span style={{ color: 'var(--vz-text-muted,#8b949e)' }}>→</span>
                        <div className="flex flex-wrap gap-1.5">
                            {nbrs.length === 0
                                ? <span style={{ color: 'var(--vz-text-faint,#6e7681)' }}>∅</span>
                                : nbrs.map((n, i) => (
                                    <span key={i} className="px-1.5 py-0.5 rounded"
                                        style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}>
                                        {typeof n === 'object' && n !== null
                                            ? `${n.node ?? n.to ?? '?'}(${n.weight ?? n.cost ?? ''})`
                                            : String(n)}
                                    </span>
                                ))
                            }
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

// ─── Generic Object Renderer ─────────────────────────────────────────────────
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

// ─── Map / Set ───────────────────────────────────────────────────────────────
const MapRenderer = memo(({ name, data }) => (
    <div className="flex flex-col items-center">
        <TypeBadge color="yellow">Map — {name} [size: {data.length}]</TypeBadge>
        <div className="flex flex-col gap-1 p-3 rounded-xl border min-w-[160px] shadow-lg"
            style={{ background: 'var(--vz-bg-secondary,#161b22)', borderColor: 'var(--vz-border,#30363d)' }}>
            {data.length === 0
                ? <span style={{ color: 'var(--vz-text-muted,#8b949e)' }} className="italic text-xs">Empty</span>
                : data.map(([k, v], i) => (
                    <div key={i} className="flex justify-between gap-4 text-xs font-mono"
                        style={{ borderBottom: i < data.length - 1 ? '1px solid var(--vz-border,#30363d)' : 'none', paddingBottom: i < data.length - 1 ? 6 : 0, marginBottom: i < data.length - 1 ? 6 : 0 }}>
                        <span style={{ color: '#60a5fa', fontWeight: 700 }}>{String(k)}</span>
                        <span style={{ color: 'var(--vz-text-muted,#8b949e)' }}>→</span>
                        <span style={{ color: '#34d399', fontWeight: 700 }}>{String(v)}</span>
                    </div>
                ))}
        </div>
    </div>
));

const SetRenderer = memo(({ name, data }) => (
    <div className="flex flex-col items-center">
        <TypeBadge color="rose">Set — {name} [size: {data.length}]</TypeBadge>
        <div className="flex flex-wrap gap-2 p-3 rounded-xl border max-w-[220px] justify-center shadow-lg"
            style={{ background: 'var(--vz-bg-secondary,#161b22)', borderColor: 'var(--vz-border,#30363d)' }}>
            {data.length === 0
                ? <span style={{ color: 'var(--vz-text-muted,#8b949e)' }} className="italic text-xs">Empty</span>
                : data.map((v, i) => (
                    <span key={i} className="px-2 py-1 rounded text-xs font-mono"
                        style={{ background: 'rgba(251,113,133,0.1)', color: '#fb7185', border: '1px solid rgba(251,113,133,0.25)' }}>
                        {String(v)}
                    </span>
                ))}
        </div>
    </div>
));

// ─── Shared Primitives ───────────────────────────────────────────────────────
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

const CompactVariablePill = memo(({ name, value }) => (
    <motion.div layout initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="flex items-center rounded-lg overflow-hidden shadow-sm"
        style={{ border: '1px solid var(--vz-border,#30363d)', background: 'var(--vz-bg-primary,#0d1117)' }}>
        <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider font-mono border-r"
            style={{ background: 'var(--vz-bg-secondary,#161b22)', color: 'var(--vz-text-muted,#8b949e)', borderColor: 'var(--vz-border,#30363d)' }}>
            {name}
        </div>
        <div className="px-3 py-1.5 text-sm font-mono font-bold tabular-nums"
            style={{ color: 'var(--vz-accent,#58a6ff)' }}>
            {value === null ? 'null'
                : value === undefined ? 'undef'
                : typeof value === 'bigint' ? value.toString() + 'n'
                : String(value)}
        </div>
    </motion.div>
));

const InfoCard = ({ name, label }) => (
    <div className="p-4 rounded-xl border flex flex-col items-center gap-2 shadow-lg"
        style={{ background: 'rgba(251,146,60,0.08)', borderColor: 'rgba(251,146,60,0.3)', color: '#fb923c' }}>
        <AlertTriangle size={14} />
        <span className="font-bold text-xs font-mono">{label}</span>
        <span className="text-[10px] opacity-70">{name}</span>
    </div>
);

const EmptyState = () => (
    <div className="h-full flex flex-col items-center justify-center gap-4 select-none"
        style={{ color: 'var(--vz-text-muted,#8b949e)' }}>
        <Activity size={56} strokeWidth={1} className="opacity-20 animate-pulse" />
        <div className="text-center">
            <p className="font-medium" style={{ color: 'var(--vz-text-primary,#e6edf3)' }}>Ready to Visualize</p>
            <p className="text-sm opacity-50 mt-1">Run code to see memory trace</p>
        </div>
    </div>
);

const NoVarsState = () => (
    <div className="h-full flex flex-col items-center justify-center gap-3 select-none"
        style={{ color: 'var(--vz-text-muted,#8b949e)' }}>
        <Hash size={44} strokeWidth={1} className="opacity-20" />
        <p className="text-sm font-mono opacity-60">No variables in current scope</p>
    </div>
);

export default VizCanvas;
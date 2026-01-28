// import React from 'react';
// import { AnimatePresence, motion } from 'framer-motion';
// import { Activity } from 'lucide-react';

// import ArrayViz from './renderers/ArrayViz';
// import StackViz from './renderers/StackViz'; 
// import QueueViz from './renderers/QueueViz'; // ✅ IMPORT QueueViz
// import VariableBox from './renderers/VariableBox';
// import TreeViz from './renderers/TreeViz';
// import MatrixViz from './renderers/MatrixViz';
// import LinkedListViz from './renderers/LinkedListViz';

// const BANNED_VARS = ['this', 'window', 'global', 'self', 'module', 'exports', 'arguments'];

// const VizCanvas = ({ variables }) => {
    
//     // 1. EMPTY STATE
//     if (!variables) {
//         return (
//             <div className="h-full flex items-center justify-center text-gray-500 select-none">
//                 <div className="text-center space-y-4">
//                     <Activity size={48} className="mx-auto opacity-20" />
//                     <div>
//                         <p className="text-lg font-medium mb-1">Ready to Visualize</p>
//                         <p className="text-sm opacity-60">Write your code and click "Run & Visualize"</p>
//                     </div>
//                 </div>
//             </div>
//         );
//     }

//     // 2. FILTER VARS
//     const visibleVars = Object.entries(variables).filter(([name]) => !BANNED_VARS.includes(name));

//     if (visibleVars.length === 0) {
//         return (
//             <div className="h-full flex items-center justify-center text-gray-500 select-none">
//                 <div className="text-center space-y-2 max-w-md">
//                     <p className="text-sm font-medium">No variables to visualize</p>
//                     <p className="text-xs opacity-60">Hidden system variables: {Object.keys(variables).join(', ')}</p>
//                 </div>
//             </div>
//         );
//     }

//     // 3. EXTRACT POINTERS
//     const pointers = {};
//     visibleVars.forEach(([key, val]) => {
//         if (Number.isInteger(val) && val >= 0 && val < 1000) {
//             pointers[key] = val;
//         }
//     });

//     // 4. SPLIT VARIABLES
//     const complexVars = []; 
//     const simpleVars = []; 

//     visibleVars.forEach(([name, value]) => {
//         if (typeof value === 'function' || typeof value === 'symbol') return;
//         const isPrimitive = (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean' || value === null || value === undefined);
        
//         if (isPrimitive) simpleVars.push([name, value]);
//         else complexVars.push([name, value]);
//     });

//     return (
//         <div className="flex flex-col h-full overflow-hidden bg-[#0d1117]">
            
//             {/* TOP: MAIN STAGE (Visualizations) */}
//             <div className="flex-1 p-6 overflow-auto custom-scrollbar flex flex-col gap-8 items-center">
//                 <AnimatePresence mode='popLayout'>
//                     {complexVars.map(([name, value]) => (
//                         <div key={name} className="w-full flex flex-col items-center">
//                             <ComplexRenderer name={name} value={value} pointers={pointers} />
//                         </div>
//                     ))}
//                 </AnimatePresence>

//                 {complexVars.length === 0 && simpleVars.length > 0 && (
//                     <div className="flex-1 flex flex-col items-center justify-center text-gray-600 opacity-50">
//                         <Activity size={32} className="mb-2" />
//                         <p className="text-sm">Values below</p>
//                     </div>
//                 )}
//             </div>

//             {/* BOTTOM: HORIZONTAL VARIABLE BAR */}
//             {simpleVars.length > 0 && (
//                 <div className="w-full p-4 border-t border-gray-800 bg-[#0d1117]/90 backdrop-blur-sm shrink-0 z-20">
//                     <div className="flex flex-wrap gap-4 justify-center items-center content-center">
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
// };

// const CompactVariablePill = ({ name, value }) => {
//     return (
//         <motion.div
//             layout
//             initial={{ scale: 0.9, opacity: 0 }}
//             animate={{ scale: 1, opacity: 1 }}
//             exit={{ scale: 0.9, opacity: 0 }}
//             className="px-3 py-2 bg-[#161b22] rounded-lg flex items-center gap-3 shadow-sm border border-gray-800"
//         >
//             <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{name}</span>
//             <div className="w-px h-4 bg-gray-700"></div>
//             <span className="text-base font-mono font-bold text-blue-400 tabular-nums">{String(value)}</span>
//         </motion.div>
//     );
// };

// // --- HELPER: Logic to choose the right renderer for Complex Types ---
// const ComplexRenderer = ({ name, value, pointers }) => {
//     // A. ARRAYS (1D), STACKS & QUEUES
//     if (Array.isArray(value) && (value.length === 0 || !Array.isArray(value[0]))) {
//         const lowerName = name.toLowerCase();
        
//         // 1. Check for Stack
//         if (lowerName.includes('stack')) {
//             return (
//                 <div className="flex flex-col items-center">
//                     <Header 
//                         badge="Stack (LIFO)" 
//                         badgeColor="text-pink-400 bg-pink-400/10 border-pink-400/20" 
//                         name={name} 
//                         meta={`size: ${value.length}`} 
//                     />
//                     <StackViz data={value} pointers={pointers} />
//                 </div>
//             );
//         }
        
//         // ✅ 2. Check for Queue
//         if (lowerName.includes('queue') || lowerName === 'q') {
//             return (
//                 <div className="flex flex-col items-center">
//                     <Header 
//                         badge="Queue (FIFO)" 
//                         badgeColor="text-emerald-400 bg-emerald-400/10 border-emerald-400/20" 
//                         name={name} 
//                         meta={`size: ${value.length}`} 
//                     />
//                     <QueueViz data={value} pointers={pointers} />
//                 </div>
//             );
//         }

//         // 3. Default Array
//         return (
//             <div className="flex flex-col items-center">
//                 <Header badge="Array" badgeColor="text-blue-400 bg-blue-400/10" name={name} meta={`len: ${value.length}`} />
//                 <ArrayViz data={value} pointers={pointers} />
//             </div>
//         );
//     }

//     // B. 2D MATRICES
//     if (Array.isArray(value) && value.length > 0 && Array.isArray(value[0])) {
//         return (
//             <div className="flex flex-col items-center">
//                 <Header 
//                     badge={`Matrix ${value.length}×${value[0]?.length || 0}`} 
//                     badgeColor="text-orange-400 bg-orange-400/10 border-orange-400/20" 
//                     name={name} 
//                 />
//                 <MatrixViz data={value} pointers={pointers} />
//             </div>
//         );
//     }

//     // C. OBJECTS
//     if (typeof value === 'object' && value !== null) {
//         const hasNodeProps = value.val !== undefined || value.value !== undefined || value.next !== undefined || value.left !== undefined || value.right !== undefined;
        
//         if (hasNodeProps) {
//             const isLinkedList = value.next !== undefined && !value.left && !value.right;
//             const isBinaryTree = value.left !== undefined || value.right !== undefined;
            
//             if (isLinkedList) {
//                 return (
//                     <div className="flex flex-col items-center">
//                         <Header badge="List" badgeColor="text-emerald-400 bg-emerald-400/10 border-emerald-400/20" name={name} />
//                         <LinkedListViz data={value} name={name} />
//                     </div>
//                 );
//             }
//             return (
//                 <div className="flex flex-col items-center">
//                     <Header badge={isBinaryTree ? "Tree" : "Graph"} badgeColor="text-purple-400 bg-purple-400/10 border-purple-400/20" name={name} />
//                     <TreeViz data={value} name={name} />
//                 </div>
//             );
//         }
        
//         return (
//             <div className="min-w-[200px] bg-[#161b22] p-4 rounded-xl border border-gray-800 flex flex-col items-center">
//                 <Header badge="Object" name={name} />
//                 <pre className="text-[10px] text-green-400 overflow-auto max-h-48 font-mono custom-scrollbar mt-2">{JSON.stringify(value, null, 2)}</pre>
//             </div>
//         );
//     }
//     return null;
// };

// const Header = ({ badge, badgeColor = "text-gray-400 bg-gray-800", name, meta }) => (
//     <div className="flex items-center gap-3 mb-3 justify-center">
//         <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-transparent ${badgeColor}`}>
//             {badge}
//         </span>
//         <h3 className="text-white font-mono text-sm font-bold">{name}</h3>
//         {meta && <span className="text-gray-600 text-[10px] font-mono">{meta}</span>}
//     </div>
// );

// export default VizCanvas;

















import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity } from 'lucide-react';

// --- RENDERERS ---
import ArrayViz from './renderers/ArrayViz';
import StackViz from './renderers/StackViz'; 
import QueueViz from './renderers/QueueViz'; 
// import GraphViz from './renderers/GraphViz'; // ✅ Specialized Graph/Grid Renderer
import TreeViz from './renderers/TreeViz';
import MatrixViz from './renderers/MatrixViz';
import LinkedListViz from './renderers/LinkedListViz';

// System variables to hide from visualization
const BANNED_VARS = ['this', 'window', 'global', 'self', 'module', 'exports', 'arguments'];

const VizCanvas = ({ variables }) => {
    
    // 1. EMPTY STATE HANDLING
    if (!variables) {
        return (
            <div className="h-full flex items-center justify-center text-gray-500 select-none">
                <div className="text-center space-y-4">
                    <Activity size={48} className="mx-auto opacity-20" />
                    <div>
                        <p className="text-lg font-medium mb-1">Ready to Visualize</p>
                        <p className="text-sm opacity-60">Write your code and click "Run & Visualize"</p>
                    </div>
                </div>
            </div>
        );
    }

    // 2. FILTER RELEVANT VARIABLES
    const visibleVars = Object.entries(variables).filter(([name]) => !BANNED_VARS.includes(name));

    if (visibleVars.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-gray-500 select-none">
                <div className="text-center space-y-2 max-w-md">
                    <p className="text-sm font-medium">No variables to visualize</p>
                    <p className="text-xs opacity-60">Hidden system variables: {Object.keys(variables).join(', ')}</p>
                </div>
            </div>
        );
    }

    // 3. EXTRACT POINTERS (Integers used as indices: i, j, k, r, c, top, rear)
    const pointers = {};
    visibleVars.forEach(([key, val]) => {
        if (Number.isInteger(val) && val >= 0 && val < 1000) {
            pointers[key] = val;
        }
    });

    // 4. CLASSIFY VARIABLES (Complex vs Primitives)
    const complexVars = []; 
    const simpleVars = []; 

    visibleVars.forEach(([name, value]) => {
        if (typeof value === 'function' || typeof value === 'symbol') return;
        
        // Primitives go to the bottom bar
        const isPrimitive = (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean' || value === null || value === undefined);
        
        if (isPrimitive) simpleVars.push([name, value]);
        else complexVars.push([name, value]);
    });

    return (
        <div className="flex flex-col h-full overflow-hidden bg-[#0d1117]">
            
            {/* --- TOP: MAIN STAGE (Complex Structures) --- */}
            <div className="flex-1 p-6 overflow-auto custom-scrollbar flex flex-col gap-10 items-center">
                <AnimatePresence mode='popLayout'>
                    {complexVars.map(([name, value]) => (
                        <div key={name} className="w-full flex flex-col items-center">
                            <ComplexRenderer name={name} value={value} pointers={pointers} />
                        </div>
                    ))}
                </AnimatePresence>

                {/* Empty State for Complex Vars */}
                {complexVars.length === 0 && simpleVars.length > 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-600 opacity-50">
                        <Activity size={32} className="mb-2" />
                        <p className="text-sm">Values below</p>
                    </div>
                )}
            </div>

            {/* --- BOTTOM: VARIABLE PILLS (Primitives) --- */}
            {simpleVars.length > 0 && (
                <div className="w-full p-4 border-t border-gray-800 bg-[#0d1117]/90 backdrop-blur-sm shrink-0 z-20">
                    <div className="flex flex-wrap gap-4 justify-center items-center content-center">
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
};

// ✨ COMPONENT: Bottom Bar Variable Pill
const CompactVariablePill = ({ name, value }) => {
    return (
        <motion.div
            layout
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="px-3 py-2 bg-[#161b22] rounded-lg flex items-center gap-3 shadow-sm border border-gray-800"
        >
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{name}</span>
            <div className="w-px h-4 bg-gray-700"></div>
            <span className="text-base font-mono font-bold text-blue-400 tabular-nums">{String(value)}</span>
        </motion.div>
    );
};

// 🧠 LOGIC: Determines the correct visualization based on Data Type & Naming Convention
const ComplexRenderer = ({ name, value, pointers }) => {
    
    // A. 1D ARRAYS (Arrays, Stacks, Queues)
    if (Array.isArray(value) && (value.length === 0 || !Array.isArray(value[0]))) {
        const lowerName = name.toLowerCase();
        
        // 1. STACK Detection
        if (lowerName.includes('stack')) {
            return (
                <div className="flex flex-col items-center">
                    <Header 
                        badge="Stack (LIFO)" 
                        badgeColor="text-pink-400 bg-pink-400/10 border-pink-400/20" 
                        name={name} 
                        meta={`size: ${value.length}`} 
                    />
                    <StackViz data={value} pointers={pointers} />
                </div>
            );
        }
        
        // 2. QUEUE Detection
        if (lowerName.includes('queue') || lowerName === 'q') {
            return (
                <div className="flex flex-col items-center">
                    <Header 
                        badge="Queue (FIFO)" 
                        badgeColor="text-emerald-400 bg-emerald-400/10 border-emerald-400/20" 
                        name={name} 
                        meta={`size: ${value.length}`} 
                    />
                    <QueueViz data={value} pointers={pointers} />
                </div>
            );
        }

        // 3. Default ARRAY
        return (
            <div className="flex flex-col items-center">
                <Header badge="Array" badgeColor="text-blue-400 bg-blue-400/10" name={name} meta={`len: ${value.length}`} />
                <ArrayViz data={value} pointers={pointers} />
            </div>
        );
    }

    // B. 2D ARRAYS (Matrices & Graphs)
    if (Array.isArray(value) && value.length > 0 && Array.isArray(value[0])) {
        const lowerName = name.toLowerCase();

        // ✅ 4. GRAPH / GRID Detection (DFS, BFS, Pathfinding)
        // If variable is named 'grid', 'board', 'maze', or 'graph', use the smart GraphViz renderer
        if (lowerName.includes('grid') || lowerName.includes('board') || lowerName.includes('maze') || lowerName.includes('graph')) {
             return (
                <div className="flex flex-col items-center">
                    <Header 
                        badge="Weighted Grid" 
                        badgeColor="text-indigo-400 bg-indigo-400/10 border-indigo-400/20" 
                        name={name} 
                    />
                    {/* Passes pointers (like r, c, i, j) to highlight active cells */}
                    <GraphViz data={value} pointers={pointers} />
                </div>
            );
        }

        // 5. Default MATRIX
        return (
            <div className="flex flex-col items-center">
                <Header 
                    badge={`Matrix ${value.length}×${value[0]?.length || 0}`} 
                    badgeColor="text-orange-400 bg-orange-400/10 border-orange-400/20" 
                    name={name} 
                />
                <MatrixViz data={value} pointers={pointers} />
            </div>
        );
    }

    // C. OBJECTS (Linked Lists, Trees, Graphs, JSON)
    if (typeof value === 'object' && value !== null) {
        // Heuristic: Does it look like a Node?
        const hasNodeProps = value.val !== undefined || value.value !== undefined || value.next !== undefined || value.left !== undefined || value.right !== undefined;
        
        if (hasNodeProps) {
            // Linked List (Has next, no left/right)
            const isLinkedList = value.next !== undefined && !value.left && !value.right;
            // Binary Tree (Has left or right)
            const isBinaryTree = value.left !== undefined || value.right !== undefined;
            
            if (isLinkedList) {
                return (
                    <div className="flex flex-col items-center">
                        <Header badge="List" badgeColor="text-emerald-400 bg-emerald-400/10 border-emerald-400/20" name={name} />
                        <LinkedListViz data={value} name={name} />
                    </div>
                );
            }
            return (
                <div className="flex flex-col items-center">
                    <Header badge={isBinaryTree ? "Tree" : "Graph"} badgeColor="text-purple-400 bg-purple-400/10 border-purple-400/20" name={name} />
                    <TreeViz data={value} name={name} />
                </div>
            );
        }
        
        // Default Object (JSON View)
        return (
            <div className="min-w-[200px] bg-[#161b22] p-4 rounded-xl border border-gray-800 flex flex-col items-center">
                <Header badge="Object" name={name} />
                <pre className="text-[10px] text-green-400 overflow-auto max-h-48 font-mono custom-scrollbar mt-2">{JSON.stringify(value, null, 2)}</pre>
            </div>
        );
    }
    return null;
};

// ✨ COMPONENT: Standard Header for all visualizations
const Header = ({ badge, badgeColor = "text-gray-400 bg-gray-800", name, meta }) => (
    <div className="flex items-center gap-3 mb-3 justify-center">
        <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-transparent ${badgeColor}`}>
            {badge}
        </span>
        <h3 className="text-white font-mono text-sm font-bold">{name}</h3>
        {meta && <span className="text-gray-600 text-[10px] font-mono">{meta}</span>}
    </div>
);

export default VizCanvas;
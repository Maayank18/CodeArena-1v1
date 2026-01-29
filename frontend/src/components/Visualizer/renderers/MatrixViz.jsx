// import React, { useMemo, memo } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';

// // --- MAIN COMPONENT ---
// const MatrixViz = memo(({ data, pointers }) => {
    
//     // 🛡️ Guard Clause: Prevents crash on empty data
//     if (!data || !Array.isArray(data) || data.length === 0) {
//         return (
//             <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-800 rounded-xl bg-[#0d1117]/50 min-w-[200px] min-h-[150px]">
//                 <span className="font-mono text-xs text-gray-500">Empty Matrix / Initializing...</span>
//             </div>
//         );
//     }

//     const colCount = data[0]?.length || 0;

//     return (
//         // ✅ ADDED: min-w and min-h to prevent visual "collapse"
//         <div className="inline-block p-6 bg-[#0d1117] border border-gray-800 rounded-xl shadow-2xl overflow-hidden relative min-w-[120px] min-h-[120px]">
            
//             <div className="flex flex-col relative">
                
//                 {/* 1. COLUMN INDICES (Top Axis) */}
//                 <div className="flex gap-2 mb-2 ml-8 pl-1">
//                     {Array.from({ length: colCount }).map((_, c) => (
//                         <div key={c} className="w-12 text-center text-[10px] font-mono text-gray-600 select-none font-bold">
//                             {c}
//                         </div>
//                     ))}
//                 </div>

//                 {/* 2. GRID ROWS */}
//                 <div className="flex flex-col gap-2">
//                     {data.map((row, r) => (
//                         <div key={r} className="flex gap-2 items-center">
                            
//                             {/* ROW INDEX (Left Axis) */}
//                             <div className="w-6 text-right text-[10px] font-mono text-gray-600 select-none pr-2 font-bold">
//                                 {r}
//                             </div>

//                             {/* ROW CELLS */}
//                             <MatrixRow 
//                                 row={row} 
//                                 rowIndex={r} 
//                                 pointers={pointers} 
//                             />
//                         </div>
//                     ))}
//                 </div>
//             </div>
//         </div>
//     );
// });

// // --- ROW COMPONENT ---
// const MatrixRow = memo(({ row, rowIndex, pointers }) => {
//     return (
//         <div className="flex gap-2">
//             {row.map((val, c) => {
//                 // 🧠 LOGIC: Safe access to pointers
//                 const r = rowIndex;
//                 const i = pointers?.i ?? pointers?.row ?? -1;
//                 const j = pointers?.j ?? pointers?.col ?? -1;

//                 // 1. Exact Cell Match [i][j]
//                 const isExactMatch = (i === r && j === c);

//                 // 2. Active Row Match [i] (when j is not yet active/valid)
//                 const isRowActive = (i === r && j === -1);

//                 return (
//                     <MatrixCell 
//                         key={`${r}-${c}`}
//                         val={val}
//                         r={r}
//                         c={c}
//                         isExactMatch={isExactMatch}
//                         isRowActive={isRowActive}
//                     />
//                 );
//             })}
//         </div>
//     );
// });

// // --- CELL COMPONENT ---
// const MatrixCell = memo(({ val, r, c, isExactMatch, isRowActive }) => {
    
//     // Visual Variants
//     const variants = {
//         idle: { scale: 1, backgroundColor: '#161b22', borderColor: '#30363d', zIndex: 0 },
//         rowHighlight: { scale: 1.02, backgroundColor: '#1f2937', borderColor: '#4b5563', zIndex: 10 },
//         active: { scale: 1.15, backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: '#f59e0b', zIndex: 20 }
//     };

//     const state = isExactMatch ? 'active' : (isRowActive ? 'rowHighlight' : 'idle');

//     return (
//         <motion.div
//             layout
//             initial={false}
//             animate={state}
//             variants={variants}
//             transition={{ duration: 0.2 }}
//             className={`
//                 w-12 h-12 flex items-center justify-center 
//                 border-2 rounded-lg relative text-sm font-mono font-bold shadow-sm
//                 ${isExactMatch ? 'text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'text-gray-300'}
//             `}
//         >
//             {/* Value */}
//             <span className="z-10">{val}</span>

//             {/* Coordinates (Subtle Background) */}
//             {!isExactMatch && (
//                 <span className="absolute top-0.5 left-1 text-[7px] text-gray-700 font-mono opacity-40 select-none">
//                     {r},{c}
//                 </span>
//             )}

//             {/* Active Pointer Badge */}
//             <AnimatePresence>
//                 {isExactMatch && (
//                     <motion.div 
//                         initial={{ opacity: 0, y: 5 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         exit={{ opacity: 0 }}
//                         className="absolute -top-3.5 -right-3 z-30 pointer-events-none"
//                     >
//                         <div className="bg-amber-500 text-black text-[7px] px-1 py-0.5 rounded shadow-sm font-black uppercase tracking-tighter border border-amber-400">
//                             [i][j]
//                         </div>
//                     </motion.div>
//                 )}
//             </AnimatePresence>
//         </motion.div>
//     );
// });

// export default MatrixViz;












import React, { useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- MAIN COMPONENT ---
const MatrixViz = memo(({ data, pointers }) => {
    
    // 🛡️ Guard Clause
    if (!data || !Array.isArray(data) || data.length === 0) {
        return (
            <div className="p-8 border-2 border-dashed border-gray-800 rounded-xl flex items-center justify-center opacity-50">
                <span className="font-mono text-xs">Empty Matrix</span>
            </div>
        );
    }

    const colCount = data[0]?.length || 0;

    return (
        <div className="inline-block p-6 bg-[#0d1117] border border-gray-800 rounded-xl shadow-2xl overflow-hidden relative">
            
            <div className="flex flex-col relative">
                
                {/* 1. COLUMN INDICES (Top Axis) */}
                <div className="flex gap-2 mb-2 ml-8 pl-1">
                    {Array.from({ length: colCount }).map((_, c) => (
                        <div key={c} className="w-12 text-center text-[10px] font-mono text-gray-600 select-none">
                            {c}
                        </div>
                    ))}
                </div>

                {/* 2. GRID ROWS */}
                <div className="flex flex-col gap-2">
                    {data.map((row, r) => (
                        <div key={r} className="flex gap-2 items-center">
                            
                            {/* ROW INDEX (Left Axis) */}
                            <div className="w-6 text-right text-[10px] font-mono text-gray-600 select-none pr-2">
                                {r}
                            </div>

                            {/* ROW CELLS */}
                            <MatrixRow 
                                row={row} 
                                rowIndex={r} 
                                pointers={pointers} 
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});

// --- ROW COMPONENT (Intermediate Optimization) ---
// Prevents re-rendering rows that aren't being interacted with
const MatrixRow = memo(({ row, rowIndex, pointers }) => {
    return (
        <div className="flex gap-2">
            {row.map((val, c) => {
                // 🧠 LOGIC: Calculate active state here to keep Cell props simple
                // Matches standard Loop logic: i/row for outer, j/col for inner
                
                const r = rowIndex;
                const i = pointers?.i ?? pointers?.row ?? -1;
                const j = pointers?.j ?? pointers?.col ?? -1;

                // 1. Is this the specific cell being accessed? (i, j)
                const isExactMatch = (i === r && j === c);

                // 2. Is this the current active row? (i) - but we haven't picked a column yet
                //    This simulates the state: for(let i=0...){ // here }
                const isRowActive = (i === r && j === -1);

                return (
                    <MatrixCell 
                        key={`${r}-${c}`}
                        val={val}
                        r={r}
                        c={c}
                        isExactMatch={isExactMatch}
                        isRowActive={isRowActive}
                    />
                );
            })}
        </div>
    );
});

// --- CELL COMPONENT (Heavily Optimized) ---
const MatrixCell = memo(({ val, r, c, isExactMatch, isRowActive }) => {
    
    // Determine visual state
    const variants = {
        idle: { scale: 1, backgroundColor: '#0d1117', borderColor: '#30363d', zIndex: 0 },
        rowHighlight: { scale: 1, backgroundColor: '#1f2937', borderColor: '#4b5563', zIndex: 1 },
        active: { scale: 1.15, backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: '#f59e0b', zIndex: 20 }
    };

    const state = isExactMatch ? 'active' : (isRowActive ? 'rowHighlight' : 'idle');

    return (
        <motion.div
            layout
            initial={false}
            animate={state}
            variants={variants}
            transition={{ duration: 0.2 }}
            className={`
                w-12 h-12 flex items-center justify-center 
                border-2 rounded-lg relative text-sm font-mono font-bold
                ${isExactMatch ? 'text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'text-gray-300'}
            `}
        >
            {/* Value */}
            <span className="z-10">{val}</span>

            {/* Coordinates (Subtle Background) */}
            {!isExactMatch && (
                <span className="absolute top-0.5 left-1 text-[7px] text-gray-700 font-mono opacity-50">
                    {r},{c}
                </span>
            )}

            {/* Active Pointer Badge */}
            <AnimatePresence>
                {isExactMatch && (
                    <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute -top-3.5 right-[-4px] z-30"
                    >
                        <div className="bg-amber-500 text-[#0d1117] text-[8px] px-1.5 py-0.5 rounded shadow-sm font-bold border border-amber-400">
                            [i][j]
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
});

export default MatrixViz;
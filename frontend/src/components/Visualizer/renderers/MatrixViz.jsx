// import React from 'react';
// import { motion } from 'framer-motion';

// const MatrixViz = ({ data, pointers }) => {
//     if (!data || data.length === 0) return null;

//     return (
//         <div className="inline-block p-6 bg-[#0d1117] border border-gray-800 rounded-xl shadow-2xl">
//             <div className="flex flex-col gap-2">
//                 {data.map((row, r) => (
//                     <div key={r} className="flex gap-2">
//                         {row.map((val, c) => {
//                             // POINTER LOGIC: Check if any pointer matches this cell
//                             // We support standard names: i, j, row, col
//                             const isRowMatch = (pointers?.i === r || pointers?.row === r);
//                             const isColMatch = (pointers?.j === c || pointers?.col === c);
                            
//                             // Highlight if BOTH row and col match (specific cell)
//                             // OR if only row matches (entire row scan)
//                             const isCellHighlighted = isRowMatch && isColMatch;
//                             const isRowHighlighted = isRowMatch && !pointers?.j; // Highlight row if j isn't defined yet

//                             return (
//                                 <motion.div
//                                     key={`${r}-${c}`}
//                                     layout
//                                     initial={{ scale: 0.8 }}
//                                     animate={{ 
//                                         scale: isCellHighlighted ? 1.1 : 1,
//                                         backgroundColor: isCellHighlighted ? '#f59e0b' : (isRowHighlighted ? '#1f2937' : '#0d1117'),
//                                         borderColor: isCellHighlighted ? '#fbbf24' : '#374151'
//                                     }}
//                                     className="w-12 h-12 flex items-center justify-center border-2 rounded-lg text-white font-mono font-bold relative"
//                                 >
//                                     {val}
                                    
//                                     {/* Grid Coordinates */}
//                                     <span className="absolute top-0.5 left-1 text-[8px] text-gray-600">
//                                         {r},{c}
//                                     </span>

//                                     {/* Pointer Label */}
//                                     {isCellHighlighted && (
//                                         <div className="absolute -top-3 right-0 bg-amber-500 text-black text-[8px] px-1 rounded font-bold">
//                                             [i][j]
//                                         </div>
//                                     )}
//                                 </motion.div>
//                             );
//                         })}
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// };

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
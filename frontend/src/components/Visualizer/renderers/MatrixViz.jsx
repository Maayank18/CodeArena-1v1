// // src/components/Visualizer/renderers/MatrixViz.jsx
// import React from 'react';
// import { motion } from 'framer-motion';

// const MatrixViz = ({ data, pointers }) => {
//     if (!data || data.length === 0) {
//         return (
//             <div className="p-4 border border-gray-800 rounded-lg bg-gray-900/50 text-gray-600 text-sm">
//                 Empty matrix
//             </div>
//         );
//     }

//     return (
//         <div className="inline-block p-6 bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl shadow-2xl">
//             <div className="flex flex-col gap-2">
//                 {data.map((row, r) => (
//                     <motion.div 
//                         key={r} 
//                         initial={{ opacity: 0, x: -20 }}
//                         animate={{ opacity: 1, x: 0 }}
//                         transition={{ delay: r * 0.05 }}
//                         className="flex gap-2"
//                     >
//                         {row.map((val, c) => {
//                             // Check if pointers match this cell
//                             // For matrices, we might have pointers like: i=1, j=2
//                             const isHighlighted = 
//                                 (pointers?.i === r || pointers?.row === r) && 
//                                 (pointers?.j === c || pointers?.col === c);

//                             return (
//                                 <motion.div
//                                     key={`${r}-${c}`}
//                                     layout
//                                     initial={{ scale: 0.8, opacity: 0 }}
//                                     animate={{ 
//                                         scale: 1, 
//                                         opacity: 1,
//                                         backgroundColor: isHighlighted ? '#f59e0b' : '#1f2937',
//                                         borderColor: isHighlighted ? '#fbbf24' : '#4b5563'
//                                     }}
//                                     whileHover={{ scale: 1.1, borderColor: '#60a5fa' }}
//                                     transition={{ duration: 0.2 }}
//                                     className="w-14 h-14 flex items-center justify-center border-2 rounded-lg text-sm font-mono font-bold text-white relative group cursor-default shadow-lg"
//                                 >
//                                     {/* Cell Value */}
//                                     <span className="z-10">{val}</span>
                                    
//                                     {/* Coordinate Label */}
//                                     <span className="absolute top-0.5 left-1 text-[8px] text-gray-500 font-normal">
//                                         {r},{c}
//                                     </span>

//                                     {/* Hover Tooltip */}
//                                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
//                                         <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap border border-gray-700">
//                                             [{r}][{c}] = {val}
//                                         </div>
//                                     </div>

//                                     {/* Highlighted Indicator */}
//                                     {isHighlighted && (
//                                         <motion.div
//                                             initial={{ opacity: 0 }}
//                                             animate={{ opacity: 1 }}
//                                             className="absolute inset-0 bg-amber-500/20 rounded-lg animate-pulse"
//                                         />
//                                     )}
//                                 </motion.div>
//                             );
//                         })}
//                     </motion.div>
//                 ))}
//             </div>
//         </div>
//     );
// };

// export default MatrixViz;









import React from 'react';
import { motion } from 'framer-motion';

const MatrixViz = ({ data, pointers }) => {
    if (!data || data.length === 0) return null;

    return (
        <div className="inline-block p-6 bg-[#0d1117] border border-gray-800 rounded-xl shadow-2xl">
            <div className="flex flex-col gap-2">
                {data.map((row, r) => (
                    <div key={r} className="flex gap-2">
                        {row.map((val, c) => {
                            // POINTER LOGIC: Check if any pointer matches this cell
                            // We support standard names: i, j, row, col
                            const isRowMatch = (pointers?.i === r || pointers?.row === r);
                            const isColMatch = (pointers?.j === c || pointers?.col === c);
                            
                            // Highlight if BOTH row and col match (specific cell)
                            // OR if only row matches (entire row scan)
                            const isCellHighlighted = isRowMatch && isColMatch;
                            const isRowHighlighted = isRowMatch && !pointers?.j; // Highlight row if j isn't defined yet

                            return (
                                <motion.div
                                    key={`${r}-${c}`}
                                    layout
                                    initial={{ scale: 0.8 }}
                                    animate={{ 
                                        scale: isCellHighlighted ? 1.1 : 1,
                                        backgroundColor: isCellHighlighted ? '#f59e0b' : (isRowHighlighted ? '#1f2937' : '#0d1117'),
                                        borderColor: isCellHighlighted ? '#fbbf24' : '#374151'
                                    }}
                                    className="w-12 h-12 flex items-center justify-center border-2 rounded-lg text-white font-mono font-bold relative"
                                >
                                    {val}
                                    
                                    {/* Grid Coordinates */}
                                    <span className="absolute top-0.5 left-1 text-[8px] text-gray-600">
                                        {r},{c}
                                    </span>

                                    {/* Pointer Label */}
                                    {isCellHighlighted && (
                                        <div className="absolute -top-3 right-0 bg-amber-500 text-black text-[8px] px-1 rounded font-bold">
                                            [i][j]
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MatrixViz;
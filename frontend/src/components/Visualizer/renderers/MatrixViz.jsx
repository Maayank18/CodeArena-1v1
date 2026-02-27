import React, { useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MatrixViz = memo(({ data, pointers }) => {
    
    //  Guard Clause
    if (!data || !Array.isArray(data) || data.length === 0) {
        return (
            <div className="p-8 border-2 border-dashed border-gray-800 rounded-xl flex items-center justify-center opacity-50">
                <span className="font-mono text-xs text-gray-500">Empty Matrix</span>
            </div>
        );
    }

    const rows = data.length;
    const cols = data[0]?.length || 0;

    //  AUTO-SCALING: Adapt cell size to matrix dimensions
    const { cellSize, fontSize, gapSize } = useMemo(() => {
        const totalCells = rows * cols;
        
        if (totalCells <= 25) {
            return { cellSize: 48, fontSize: 'text-sm', gapSize: 8 };
        } else if (totalCells <= 100) {
            return { cellSize: 36, fontSize: 'text-xs', gapSize: 6 };
        } else if (totalCells <= 400) {
            return { cellSize: 28, fontSize: 'text-[10px]', gapSize: 4 };
        } else {
            return { cellSize: 20, fontSize: 'text-[8px]', gapSize: 2 };
        }
    }, [rows, cols]);

    // 🧠 SMART POINTER EXTRACTION
    const extractedPointers = useMemo(() => {
        if (!pointers) {
            return { 
                current: { row: -1, col: -1 }, 
                start: { row: -1, col: -1 }, 
                end: { row: -1, col: -1 } 
            };
        }

        return {
            current: {
                row: pointers.i ?? pointers.row ?? pointers.r ?? pointers.x ?? -1,
                col: pointers.j ?? pointers.col ?? pointers.c ?? pointers.y ?? -1
            },
            start: {
                row: pointers.startRow ?? pointers.start_row ?? pointers.sr ?? -1,
                col: pointers.startCol ?? pointers.start_col ?? pointers.sc ?? -1
            },
            end: {
                row: pointers.endRow ?? pointers.end_row ?? pointers.er ?? -1,
                col: pointers.endCol ?? pointers.end_col ?? pointers.ec ?? -1
            }
        };
    }, [pointers]);

    return (
        <div 
            className="inline-block p-6 bg-[#0d1117] border border-gray-800 rounded-xl shadow-2xl overflow-auto custom-scrollbar"
            style={{ maxHeight: '600px', maxWidth: '90vw' }}
        >
            <div className="flex flex-col relative">
                
                {/* METADATA BAR */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-800">
                    <span className="text-[10px] font-mono text-gray-500">
                        Dimensions: {rows}×{cols}
                    </span>
                    {extractedPointers.current.row >= 0 && extractedPointers.current.col >= 0 && (
                        <span className="text-[10px] font-mono text-amber-400 font-bold">
                            [{extractedPointers.current.row}][{extractedPointers.current.col}]
                        </span>
                    )}
                </div>

                {/* COLUMN INDICES */}
                <div className="flex mb-2 ml-8">
                    <div style={{ display: 'flex', gap: `${gapSize}px` }}>
                        {Array.from({ length: cols }).map((_, c) => (
                            <div 
                                key={c} 
                                className="text-center text-[9px] font-mono text-gray-600 select-none font-bold"
                                style={{ width: cellSize }}
                            >
                                {c}
                            </div>
                        ))}
                    </div>
                </div>

                {/* GRID ROWS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: `${gapSize}px` }}>
                    {data.map((row, r) => (
                        <div key={r} className="flex items-center" style={{ gap: `${gapSize}px` }}>
                            {/* ROW INDEX */}
                            <div className="w-6 text-right text-[9px] font-mono text-gray-600 select-none pr-2 font-bold">
                                {r}
                            </div>
                            {/* ROW CELLS */}
                            <MatrixRow 
                                row={row} 
                                rowIndex={r} 
                                extractedPointers={extractedPointers}
                                cellSize={cellSize}
                                fontSize={fontSize}
                                gapSize={gapSize}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});

// --- ROW COMPONENT ---
const MatrixRow = memo(({ row, rowIndex, extractedPointers, cellSize, fontSize, gapSize }) => {
    return (
        <div style={{ display: 'flex', gap: `${gapSize}px` }}>
            {row.map((val, colIndex) => {
                const r = rowIndex;
                const c = colIndex;
                const { current, start, end } = extractedPointers;

                const isCurrentCell = (current.row === r && current.col === c);
                const isRowActive = (current.row === r && current.col === -1);
                const isStartCell = (start.row === r && start.col === c);
                const isEndCell = (end.row === r && end.col === c);
                const isInRange = 
                    start.row >= 0 && end.row >= 0 &&
                    r >= start.row && r <= end.row &&
                    c >= start.col && c <= end.col;

                const cellMeta = detectCellMetadata(val);

                return (
                    <MatrixCell 
                        key={`${r}-${c}`}
                        val={val}
                        r={r}
                        c={c}
                        isCurrentCell={isCurrentCell}
                        isRowActive={isRowActive}
                        isStartCell={isStartCell}
                        isEndCell={isEndCell}
                        isInRange={isInRange}
                        cellMeta={cellMeta}
                        cellSize={cellSize}
                        fontSize={fontSize}
                    />
                );
            })}
        </div>
    );
});

// --- METADATA DETECTOR ---
function detectCellMetadata(val) {
    if (val && typeof val === 'object') {
        return {
            isObject: true,
            isVisited: val.visited || val.isVisited || false,
            isPath: val.path || val.isPath || false,
            isObstacle: val.obstacle || val.isObstacle || val.blocked || false,
            isStart: val.start || val.isStart || false,
            isEnd: val.end || val.isEnd || val.goal || false,
            distance: val.distance || val.dist || val.cost || null,
            value: val.val || val.value || val.data || '?'
        };
    }

    return {
        isObject: false,
        isVisited: false,
        isPath: false,
        isObstacle: val === '#' || val === 'X' || val === -1 || val === Infinity,
        isStart: val === 'S',
        isEnd: val === 'E' || val === 'G',
        distance: null,
        value: val
    };
}

// --- CELL COMPONENT ---
const MatrixCell = memo(({ 
    val, r, c, 
    isCurrentCell, isRowActive, isStartCell, isEndCell, isInRange,
    cellMeta, cellSize, fontSize 
}) => {
    
    const getCellStyle = () => {
        if (isCurrentCell) {
            return {
                bg: 'rgba(245, 158, 11, 0.2)',
                border: '#f59e0b',
                text: 'text-amber-300',
                shadow: '0 0 15px rgba(245, 158, 11, 0.3)',
                scale: 1.1,
                zIndex: 30
            };
        }

        if (cellMeta.isStart || isStartCell) {
            return {
                bg: 'rgba(34, 197, 94, 0.2)',
                border: '#22c55e',
                text: 'text-green-300',
                shadow: '0 0 10px rgba(34, 197, 94, 0.2)',
                scale: 1.05,
                zIndex: 25
            };
        }

        if (cellMeta.isEnd || isEndCell) {
            return {
                bg: 'rgba(239, 68, 68, 0.2)',
                border: '#ef4444',
                text: 'text-red-300',
                shadow: '0 0 10px rgba(239, 68, 68, 0.2)',
                scale: 1.05,
                zIndex: 25
            };
        }

        if (cellMeta.isObstacle) {
            return {
                bg: '#1f2937',
                border: '#374151',
                text: 'text-gray-600',
                shadow: 'none',
                scale: 1,
                zIndex: 5
            };
        }

        if (cellMeta.isPath) {
            return {
                bg: 'rgba(59, 130, 246, 0.15)',
                border: '#3b82f6',
                text: 'text-blue-300',
                shadow: '0 0 8px rgba(59, 130, 246, 0.15)',
                scale: 1,
                zIndex: 15
            };
        }

        if (cellMeta.isVisited) {
            return {
                bg: 'rgba(168, 85, 247, 0.1)',
                border: '#a855f7',
                text: 'text-purple-300',
                shadow: 'none',
                scale: 1,
                zIndex: 10
            };
        }

        if (isRowActive) {
            return {
                bg: '#1f2937',
                border: '#4b5563',
                text: 'text-gray-300',
                shadow: 'none',
                scale: 1,
                zIndex: 8
            };
        }

        if (isInRange) {
            return {
                bg: 'rgba(100, 116, 139, 0.1)',
                border: '#64748b',
                text: 'text-gray-300',
                shadow: 'none',
                scale: 1,
                zIndex: 6
            };
        }

        return {
            bg: '#0d1117',
            border: '#30363d',
            text: 'text-gray-300',
            shadow: 'none',
            scale: 1,
            zIndex: 0
        };
    };

    const style = getCellStyle();
    const displayValue = cellMeta.isObject ? cellMeta.value : val;

    return (
        <motion.div
            layout
            initial={false}
            animate={{
                scale: style.scale,
                backgroundColor: style.bg,
                borderColor: style.border,
                boxShadow: style.shadow,
                zIndex: style.zIndex
            }}
            transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 25 }}
            className={`
                flex items-center justify-center 
                border-2 rounded-lg relative ${fontSize} font-mono font-bold
                ${style.text}
            `}
            style={{ width: cellSize, height: cellSize }}
        >
            {/* Main Value */}
            <span className="z-10 truncate px-0.5">
                {displayValue === null ? 'ø' : 
                 displayValue === undefined ? '?' : 
                 displayValue === Infinity ? '∞' : 
                 displayValue === -Infinity ? '-∞' :
                 String(displayValue)}
            </span>

            {/* Coordinates */}
            {!isCurrentCell && cellSize >= 36 && (
                <span className="absolute bottom-0.5 left-0.5 text-[7px] text-gray-700 opacity-40">
                    {r},{c}
                </span>
            )}

            {/* Distance Badge */}
            {cellMeta.distance !== null && cellSize >= 36 && (
                <span className="absolute top-0.5 right-0.5 text-[7px] bg-gray-900/80 px-1 rounded text-gray-400 font-bold">
                    {cellMeta.distance}
                </span>
            )}

            {/* Active Pointer Badge */}
            <AnimatePresence>
                {isCurrentCell && cellSize >= 28 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute -top-3 -right-1 z-40"
                    >
                        <div className="bg-amber-500 text-[#0d1117] text-[8px] px-1.5 py-0.5 rounded shadow-lg font-bold border border-amber-600 whitespace-nowrap">
                            [{r}][{c}]
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Start Marker */}
            {(cellMeta.isStart || isStartCell) && cellSize >= 28 && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] bg-green-500 text-black px-1 py-0.5 rounded font-bold">
                    S
                </div>
            )}
            
            {/* End Marker */}
            {(cellMeta.isEnd || isEndCell) && cellSize >= 28 && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] bg-red-500 text-black px-1 py-0.5 rounded font-bold">
                    E
                </div>
            )}
        </motion.div>
    );
});

export default MatrixViz;










































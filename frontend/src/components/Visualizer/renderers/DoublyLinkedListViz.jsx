import React, { useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, X, RotateCw } from 'lucide-react';

const DoublyLinkedListViz = memo(({ data, name }) => {

    // 1. FLATTEN THE LIST
    const { nodes, isCircular, terminated } = useMemo(() => {
        const list = [];
        let current = data;
        let count = 0;
        const SAFE_LIMIT = 15;
        let isCycle = false;

        while (current && count < SAFE_LIMIT) {
            // Handle Backend Cycle Marker
            if (current === '[Circular]') {
                isCycle = true;
                break;
            }

            // Extract Value
            const rawVal = current.val ?? current.value ?? current.data;
            const val = rawVal === undefined ? '?' : String(rawVal);

            list.push({
                id: `node-${count}`,
                index: count,
                val: val,
            });

            current = current.next;
            count++;
        }

        return { 
            nodes: list, 
            isCircular: isCycle,
            terminated: !current && !isCycle 
        };
    }, [data]);

    if (!nodes.length) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500 opacity-50">
                <span className="font-mono text-xs">Empty DLL / Null</span>
            </div>
        );
    }

    return (
        <div className="p-6 overflow-x-auto custom-scrollbar">
            <div className="flex items-center min-w-max pb-4 pt-2">
                
                {/* HEAD LABEL */}
                <div className="flex flex-col items-center mr-2 group">
                    <span className="text-orange-400 font-bold font-mono text-xs mb-1 bg-orange-900/20 px-2 py-0.5 rounded border border-orange-500/30">
                        {name || 'head'}
                    </span>
                    <ArrowRight className="text-orange-500" size={16} />
                </div>

                {/* NODES */}
                <AnimatePresence mode='popLayout'>
                    {nodes.map((node, i) => (
                        <motion.div 
                            key={node.id}
                            layout
                            initial={{ opacity: 0, scale: 0.8, x: -20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="flex items-center"
                        >
                            <DLLNodeBlock val={node.val} index={node.index} />
                            
                            {/* BI-DIRECTIONAL ARROWS */}
                            <div className="mx-1 flex flex-col gap-1 items-center justify-center w-12 opacity-60">
                                {/* Next Arrow (Top) */}
                                <div className="flex items-center text-green-500 w-full">
                                    <div className="h-0.5 w-full bg-green-500/50"></div>
                                    <ArrowRight size={14} />
                                </div>
                                
                                {/* Prev Arrow (Bottom) */}
                                <div className="flex items-center text-blue-500 w-full">
                                    <ArrowLeft size={14} />
                                    <div className="h-0.5 w-full bg-blue-500/50"></div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* TERMINATION */}
                {terminated ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="opacity-50">
                        <div className="w-8 h-10 border-2 border-dashed border-gray-600 rounded flex items-center justify-center">
                            <X size={14} />
                        </div>
                    </motion.div>
                ) : (
                    <div className="text-orange-400 font-mono text-xs flex items-center gap-1">
                        <RotateCw size={14} className="animate-spin" /> Cycle
                    </div>
                )}
            </div>
        </div>
    );
});

// --- DLL NODE COMPONENT (3 Parts: Prev | Data | Next) ---
const DLLNodeBlock = memo(({ val, index }) => (
    <div className="flex flex-col items-center group relative">
        <span className="absolute -top-5 left-0 text-[9px] text-gray-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
            Node[{index}]
        </span>

        <div className="flex shadow-lg rounded-lg overflow-hidden border border-gray-700/50">
            
            {/* 1. PREV POINTER (Blue) */}
            <div className="w-6 h-12 bg-[#0d4496] flex items-center justify-center border-r border-[#0d1117]/30 relative" title="prev">
                <div className="w-1.5 h-1.5 bg-blue-200 rounded-full opacity-70" />
            </div>

            {/* 2. DATA (Darker Blue/Grey) */}
            <div className="w-14 h-12 bg-[#1f2937] flex flex-col items-center justify-center relative border-r border-[#0d1117]/30">
                <span className="text-white font-bold font-mono text-sm z-10 truncate max-w-[3rem]">
                    {val}
                </span>
            </div>

            {/* 3. NEXT POINTER (Green) */}
            <div className="w-6 h-12 bg-[#238636] flex items-center justify-center relative" title="next">
                <div className="w-1.5 h-1.5 bg-green-200 rounded-full opacity-70" />
            </div>

        </div>
    </div>
));

export default DoublyLinkedListViz;